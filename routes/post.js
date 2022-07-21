const express = require("express");
const route = express.Router();
const createError = require("http-errors");
var accountsService = require("../services/accounts.js");
var postsService = require("../services/posts.js");
const myValid = require("../validations/my-validation.js");
const validationResult = myValid.validationResult;
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const basehandle = require("../handles/base-handles.js"); // file chứa một hàm xử lý các vấn đề chung
const moment = require("moment");
const { base } = require("../models/accounts.js");

moment.locale("vi")
//origin: /post

route.use(function(req,res,next){
    next();
})


var storage  = multer.diskStorage({ // thiết lập nơi lưu trữ và tên file được lưu trữ
    filename:function(req,file,callback){ //callback thiết lập tên file
        callback(null,Date.now()+"_"+file.originalname);
    },
    destination:function(req,file,callback){ //callback thiết lập nơi lưu trữ tạm thời
                                            // đường link tính từ thư mục gốc của project
        callback(null,"public/tmp/");
    }
    
})

var upload = multer({

    storage:storage, // thiết lập lưu trữ (nơi lưu trữ và tên file được lưu trữ)
    fileFilter:function(req,file,callback){ //callback lưu file
        // xử lý file trước khi di chuyển
        // console.log(path.extname(file.originalname))
        if(file.mimetype.startsWith("image/")){ // kiểm tra xem có phải file ảnh không ?
                        // phải thì cho phép upload
            callback(null,true); // callback là đại diện cho hàm upload file của multer nếu true thì cho phép upload file
                                        // ngược lại nếu false là sẽ k upload
        }
        else{
            callback(new Error("File không đúng định dạng hình ảnh"),false); // sai định dạng file thì tạo một lỗi mới
                                                                            // hàm xử lý file sẽ bắt được lỗi này (xem phần add sản phẩm)
        }
    },

    limits:{fileSize:10000000} // giới hạn file -- bé hơn 10mb
})

// xử lý form của bài post -- xử lý file trước
function handleFilesPostUpload(req,res,next){
    var uploadResult = upload.array("imgs"); //xử lý mảng hình có name imgs
    uploadResult(req,res,function(err){
        if(err){ // nếu có lỗi file thì trả về json lỗi
            return res.status(400).json({
                code: 400,
                message:err.message
            })
        }
        // nếu không có lỗi gì thì qua hàm kế tiếp theo
        // console.log(req.files)
        next();

    })
}

//hàm kiểm tra và convert một url youtube thành một embed youtube
// nếu không phải một url youtube thì không trả về gì
function convertYoutubeUrl(url){
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    // kiểm tra xem có phải link youtube không
    if (match && match[2].length == 11) { // nếu phải
        return match[2]; // trả về id của link youtube này
    } else { // nếu không phải
        return;
    }
}

// kiểm tra các phần còn lại của post như content - video link
function handlePostsUpload(req,res,next){
    var {videos, content} = req.body;
    
    // vì có nhiều liên kết videos nên tham số đến là một mảng
    // kiểm tra content trước 
    if(!content || content.trim().length <=0){
        // đồng thời xóa hết file trong thư mục tạm (nếu có)
        basehandle.deleteAllFileInTmp(req);
        return res.status(400).json({
            code:400,
            message:"Vui lòng nhập nội dung bài viết"
        })
    }
    // tiếp theo là kiểm tra từng liên kết youtube trong mảng youtube (nếu có)
    if(videos && videos.length){
        var n = videos.length;
        for(var i=0 ; i< n; i++){
            var videolink = videos[i];
            // kiểm tra youtube url
            if(!convertYoutubeUrl(videolink)){
                // đồng thời xóa hết file trong thư mục tạm (nếu có)
                basehandle.deleteAllFileInTmp(req);
                return res.status(400).json({
                    code:400,
                    message:`Liên kết ${videolink} không phải một liên kết youtube, vui lòng chọn liên kết khác`
                })
            }
        }
    }
    
    
    next();
}
// đã trải qua 2 handle xử lý file hình và xử lý nội dung trước khi đến đây
route.post("/add",handleFilesPostUpload,handlePostsUpload,async function(req,res){
    
    // console.log("pô")
    // nếu không có lỗi gì thì sẽ đến được đây
    // ta tiến hành thêm bài post vào csdl
    // lấy dữ liệu ra
    var {videos, content} = req.body;
    var files = req.files;
    console.log(files)
    // // lấy ra id của người dùng
    var id = req.user._id;

    // thêm vào csdl content, videos link, người dùng trước để có id tạo thư mục
    //chuẩn bị dữ liệu
    var value = {
        content:content, // nội dung bài post
        owner: id, // người gửi bài post
    }
    // thêm vào csdl
    var post = await postsService.add(value);
    // console.log(post)
    if(!post){ // nếu không có post => lỗi
        return res.status(500).json({
            code:500,
            message:"Đã xảy ra lỗi trong quá trình đăng bài, vui lòng thử lại"
        })
    }
    
    
    //nếu không bị lỗi thì tiến hành di chuyển file hình và thêm đường dẫn vào csdl (nếu có)
    if(files.length){
        var result = await basehandle.moveFiles(req,post._id,"posts");
        var pathToSaveArray = result[0]; // mảng đường dẫn để lưu vào csdl
        var pathToInteract = result[2]; //mảng chứa đường dẫn để tương tác với csdl 
        // thực hiện lưu vào csdl
        for(var i= 0; i< pathToSaveArray.length ; i++){
            var valuefile = { // chuẩn bị dữ liệu
                fileurl: pathToSaveArray[i], // đường dẫn
                filetype:"image", // kiểu file đính kèm là hình ảnh
                path:pathToInteract[i] // đường dẫn để tương tác
            }
            // push vào post đã tạo ở trên
            post.attachedfiles.push(valuefile);

        }
        
    }
    if(videos && videos.length){
        // thêm dữ liệu các đường dẫn video youtube
        videos.forEach(function(videolink){
            post.attachedfiles.push({
                fileurl:videolink,
                filetype:"video"// kiểu file đính kèm là video
            })
        })
    }
    // xong rồi save lại
    post.save()
    .then(async result=>{
        if(result){
            //lấy ra lại dữ liệu lần nữa để có populate
            var postVal = await postsService.findPost({_id:result._id});
            // map lại dữ liệu
            let postnew = {
                id: postVal._id,
                content: postVal.content,
                owner:{
                    id: postVal.owner._id,
                    information:{
                        showname: postVal.owner.information.showname,
                        avatar:postVal.owner.information.avatar
                    }
                },
                postdate:moment(postVal.postdate).format("LLL"),
                attachedfiles: postVal.attachedfiles.map(file=>{
                    return {
                        id: file.id,
                        fileurl: file.fileurl,
                        filetype: file.filetype
                    }
                })
            }
            res.status(200).json({
                code:200,
                message:"Đăng bài thành công",
                data:postnew
            })
        }
        else{
            res.status(500).json({
                code:500,
                message:"Đã xảy ra lỗi khi đăng bài"
            })
        }
    })
    .catch(err=>{
        console.log(err);
        res.status(500).json({
            code:500,
            message:"Đã xảy ra lỗi khi đăng bài"
        })
    })
    
    // res.status(200).json({
    //             code:200,
    //             message:"Ok"
    //         })
    
})

//thực hiện edit
route.post("/edit",handleFilesPostUpload,handlePostsUpload,async function(req,res){
    var {id, content, videos, videosdelete, imagesdelete} = req.body;
    var files = req.files;
    //lấy ra id người dùng hiện tại
    var userid = req.user._id;
    //lấy ra quyền người dùng
    var rolecode = req.user.rolecode;
    // console.log("id "+ id);
    // console.log("content "+ content)
    // if(videosdelete && videosdelete.length){
    //     console.log("videosdelete")
    //     console.log(videosdelete)
    // }
    // if(imagesdelete && imagesdelete.length){
    //     console.log("imagesdelete")
    //     console.log(imagesdelete)
    // }
    // if(files.length){
    //     console.log(files)
    // }
    // res.status(200).json({
    //     code:200,
    //     message:"ok"
    // })

    //kiểm tra sự tồn tại của bài đăng (lẫn id của bài đăng và kiểm tra chủ nhân của bài đăng có đúng là người đang thực hiện không)
    var filter;
    //nếu người dùng là AM thì không cần kiểm tra chủ nhân -- chỉ cần kiểm tra sự tồn tại
    if(rolecode=="AM"){
        filter = {_id:id};
    }
    else{ // ngược lại không phải AM thì phải kiểm tra chủ nhân bài viết
        filter = {_id:id, owner:userid};
    }
    var post = await postsService.findPost(filter); //post này đã có populate người dùng và comment
    if(!post){ //nếu không có bài viết thì có nghĩa bài viết không tồn tại hoặc người đang thực hiện chỉnh sửa không phải chủ nhân bài viết
        //xóa đi các file tạm
        basehandle.deleteAllFileInTmp(req);
        return res.status(404).json({
            code:404,
            message:"Không tìm thấy bài viết cần sửa"
        })
    }
    //lưu nội dung mới
    post.content = content;
    //tiến hành sửa lại nội dung cũng như thêm file
    //tiến hành xóa đi những videos link muốn xóa trước (nếu có)
    if(videosdelete && videosdelete.length){
        videosdelete.forEach(function(videoid){
            // lấy ra vị trí của video cần xóa trong mảng
            var index = post.attachedfiles.findIndex(t=>t._id.toString()==videoid);
            if(index >=0){ // nếu có vị trí thì xóa trong mảng
                post.attachedfiles.splice(index,1);
            }
        })
    }
    //tiến hành xóa đi những images muốn xóa (nếu có)
    if(imagesdelete && imagesdelete.length){
        for(imgdeleteindex in imagesdelete){ //lấy từng index
            var imageid = imagesdelete[imgdeleteindex]; //dựa vào index lấy image id
            // lấy ra image cần xóa trong mảng
            var image = post.attachedfiles.find(t=>t._id.toString()==imageid);
            // nếu image có tồn tại
            if(image){
                // kiểm tra xem có tồn tại cái đường dẫn thư mục đến file hay không ?
                var pathToDelete =image.path; //lấy path để tương tác ra
               
                //gọi hàm xóa trên firebase
                await basehandle.deleteFile(pathToDelete)
            }
            //lấy ra vị trí image cần xóa trong mảng
            var index = post.attachedfiles.findIndex(t=>t._id.toString()==imageid);
            if(index>=0){
                post.attachedfiles.splice(index,1);
            }
        }
        
    }


    //tiến hành di chuyển file hình và thêm đường dẫn hình vào (nếu có)
    if(files.length){
        var result = await basehandle.moveFiles(req,post._id,"posts");
        var pathToSaveArray = result[0]; // mảng đường dẫn để lưu vào csdl
        var pathToInteract = result[2]; //mảng chứa đường dẫn để tương tác với csdl 
        // thực hiện lưu vào csdl
        for(var i= 0; i< pathToSaveArray.length ; i++){
            var valuefile = { // chuẩn bị dữ liệu
                fileurl: pathToSaveArray[i], // đường dẫn
                filetype:"image", // kiểu file đính kèm là hình ảnh
                path:pathToInteract[i] // đường dẫn để tương tác
            }
            // push vào post đã tạo ở trên
            post.attachedfiles.push(valuefile);

        }
        
    }

    //tiến hành thêm link youtube mới (nếu có)
    if(videos && videos.length){
        // thêm dữ liệu các đường dẫn video youtube
        videos.forEach(function(videolink){
            post.attachedfiles.push({
                fileurl:videolink,
                filetype:"video"// kiểu file đính kèm là video
            })
        })
    }
    
    
    //sau đó save lại và trả về cho người dùng
    post.save()
    .then(result=>{
        if(result){ // result này đã có populate chủ nhân bài viết
            // console.log(result);
            var postVal = result;
            // map lại dữ liệu
            let postnew = {
                id: postVal._id,
                content: postVal.content,
                owner:{
                    id: postVal.owner._id,
                    information:{
                        showname: postVal.owner.information.showname,
                        avatar:postVal.owner.information.avatar
                    }
                },
                postdate:moment(postVal.postdate).format("LLL"),
                attachedfiles: postVal.attachedfiles.map(file=>{
                    return {
                        id: file.id,
                        fileurl: file.fileurl,
                        filetype: file.filetype
                    }
                })
            }
            return res.status(200).json({
                code:200,
                message:"Sửa lại bài viết thành công",
                data:postnew
            })
        }
        else{
            return res.status(400).json({
                code:400,
                message:"Đã xảy ra lỗi trong quá trình chỉnh sửa bài viết"
            })
        }


    })
    .catch(err=>{
        return res.status(400).json({
            code:400,
            message:"Đã xảy ra lỗi trong quá trình chỉnh sửa bài viết"
        })
    })

})

// thực hiện xóa bài post
route.post("/delete/:id",async function(req,res){
    //lấy ra id của bài viết
    var id = req.params.id;
    //lấy ra id người dùng hiện tại
    var userid = req.user._id;
    //lấy ra quyền người dùng
    var rolecode = req.user.rolecode;
    //lấy bài viết ra từ csdl để kiểm tra xem sự tồn tại và quyền hạn người xóa
    if(rolecode=="AM"){ //nếu là AM thì chỉ cần kiểm tra sự tồn tại
        filter = {_id:id};
    }
    else{ // ngược lại không phải AM thì phải kiểm tra chủ nhân bài viết
        filter = {_id:id, owner:userid};
    }
    var post = await postsService.findPost(filter); //post này đã có populate người dùng và comment
   
    if(!post){ //nếu không có bài viết thì có nghĩa bài viết không tồn tại hoặc người đang thực hiện chỉnh sửa không phải chủ nhân bài viết
        //xóa đi các file tạm
        basehandle.deleteAllFileInTmp(req);
        return res.status(404).json({
            code:404,
            message:"Không tìm thấy bài viết cần xóa"
        })
    }
    //lấy ra các file đính kèm của bài post để xóa
    var attachedfiles = post.attachedfiles;
    //còn nếu có thì tiến hành xóa
    var result = await postsService.deletePost({_id:id});
    //nếu xóa thành công thì tiến hành xóa luôn cả thư mục của posts
    if(result && result.ok===1){
        //tiến hành xóa file được lưu trên firebase
        
        for(indexfile in attachedfiles){
            var file = attachedfiles[indexfile];
            //nếu thuộc dạng image thì mới tiến hành xóa
            if(file.filetype == "image"){
                var pathTodelete = file.path; //lấy ra đường dẫn để tương tác với firebase
                //gọi hàm xóa mà không cần chờ
                basehandle.deleteFile(pathTodelete);
            }
        }
         
        //gửi thông báo đên user là vừa có một thông báo bị xóa (xem xét lại có nên sử dụng không ?)
        //có thể một vài user sẽ bị lỡ mất thông báo này
        sendDeletePostToAllUser(req);
        return res.status(200).json({
            code:200,
            message:"Xóa thành công"
        })
    }
    else{
        return res.status(400).json({
            code:400,
            message:"Xóa bài post thất bại, vui lòng thử lại"
        })
    }


   
})

//hàm thực hiện gửi thông báo đến các user là vừa có một thông báo bị xóa
//để user cập nhật lại biến skip ( postslength) để load timeline cho chính xác hơn
// không cần phải gửi thông tin post nào bị xóa vì nó sẽ làm ảnh hưởng giao diện nếu như ta tiến hành xóa ngay trên giao diện
async function sendDeletePostToAllUser(req){
    //lấy ra socketio
    var io = req.io;
    // //lấy ra mảng id của tất cả người dùng đang đăng nhập
    // var alluser = req.alluser;
    // //tiến hành gửi
    // alluser.forEach(function(userid){
    //     //gửi thông báo cho io nào ở client đang kết nối đến comment và chờ sự kiện server-send-delete-post-${userid}
    //     io.of("/post").emit(`server-send-delete-post-${userid}`,{message:"delete post"});
    // })
    io.emit("`server-send-delete-post",{message:"delete post"})
}

// thực hiện lấy bài posts (có thể lấy 1 hoặc nhiều tùy vào người dùng muốn skip bao nhiêu)
route.get("/get",async function(req,res){
    var skipval = req.query.skip;
    var limitval = req.query.limit;
    var userid = req.query.userid;
    var sortval = {postdate:-1};
    // console.log(skipval)
    var filter = {};
    // nếu có thêm id người dùng thì gán vào filter
    if(userid && userid!=="undefined"){
        // console.log(userid)
        filter["owner"] = userid;
    }
     //kiểm tra 2 giá trị skipval và limitval có phải số không ?
    if(isNaN(skipval) || isNaN(limitval)){
        skipval = 0;
        limitval = 0;
    }
    //nếu phải thì parse tụi nó thành số
    skipval = Number(skipval);
    limitval = Number(limitval);
    //kiểm tra 2 giá trị skipval và limitval có phải số nguyên không
    if(!Number.isInteger(skipval) || !Number.isInteger(limitval)){
       // không phải thì gán = 0 coi như người dùng không muốn dùng đến skip và limit
        skipval = 0;
        limitval = 0;
    }
    //nếu 2 số này âm thì cũng không hợp lệ
    if(skipval <0 || limitval <0){
        return res.status(400).json({
            code:400,
            message:"Giá trị không hợp lệ"
        })
    }
    //nếu không có lỗi thì ta chuẩn bị lấy dữ liệu
    var postsVal = await postsService.findPostsWithoutComments(filter,skipval,limitval,sortval);
    //map dữ liệu
    var posts = postsVal.map(function(post){
        return {
            id: post.id,
            content: post.content,
            owner:{
                id:post.owner.id,
                information:{
                    showname: post.owner.information.showname,
                    avatar: post.owner.information.avatar
                }
            },
            postdate:moment(post.postdate).format("LLL"),
            attachedfiles: post.attachedfiles.map(function(file){
                return {
                    id: file.id,
                    fileurl: file.fileurl,
                    filetype: file.filetype
                }
            })
        }
    })
    //gửi lại
    return res.status(200).json({
        code:200,
        message:"Lấy dữ liệu thành công",
        data:posts
    })
})


//thực hiện lấy comments (dựa theo id bài post)
route.get("/comment/:id",async function(req,res){
    //id của bài viết muốn lấy comment
    var id = req.params.id;
    // kiểm tra sự tồn tại của bài viết
    var post = await postsService.findPost({_id:id});
    
    if(!post){ //nếu bài viết không tồn tại
        return res.status(404).json({
            code:404,
            message:"Không tìm thấy bài viết"
        })
    }
    //nếu tồn tại thì lấy ra toàn bộ comments của bài viết
    var commentsVal = post.comments;
    //map lại dữ liệu
    var comments = commentsVal.map(function(comment){
        return {
            id: comment._id,
            postid: id, // id của bài post
            owner:{
                id: comment.owner.id,
                information:{
                    showname: comment.owner.information.showname,
                    avatar: comment.owner.information.avatar
                }
            },
            content: comment.content,
            commentdate: moment(comment.commentdate).fromNow()
        }
    })
    //trả về dữ liệu
    return res.status(200).json({
        code:200,
        message:"Lấy comment thành công",
        data: comments
    })
})
// thực hiện comment
route.post("/comment/:id",async function(req,res){
    //id của bài viết được comment
    var id = req.params.id;
    //lấy ra nội dung comment
    var commentContent = req.body.content;
    //nếu nội dung trống hay không tồn tại thì báo lỗi
    if(!commentContent || commentContent.trim().length <=0){
        return res.status(400).json({
            code:400,
            message:"Nội dung comment không hợp lệ"
        })
    }
    // kiểm tra sự tồn tại của bài viết
    var post = await postsService.findPost({_id:id});
    // nếu không tồn tại thì báo lỗi
    if(!post){
        return res.status(404).json({
            code:404,
            message:"Bài viết muốn comment không tồn tại"
        })
    }
    // nếu tồn tại thì thêm nội dung comment vào
    //lấy ra id người comment (là chính người dùng đang đăng nhập)
    var userid = req.user._id;
    var comment = {
        owner:userid, // chủ nhân comment
        content:commentContent // nội dung comment
    }
    post.comments.push(comment);
    // sau khi push thì comment đã được thêm (được tạo id cũng như các thông tin default)
    // nên ta sẽ lấy phần tử cuối cùng trong mảng comments của post vì nó là comment ta vừa mới thêm
    // lưu ý là nội dung comment mới này có cái owner chưa được populate nhưng ta có thể gán owner bằng thông tin đăng nhập hiện tại
    var commentnew = post.comments[post.comments.length-1];
    // console.log(commentnew);
    // console.log("populate ne")
    // await commentnew.populate("owner").execPopulate()
    // .then(result=>{
    //     console.log(result)
    // })
    // .catch(err=>{
    //     console.log(err);
    // })
    
    // xong rồi thì save lại
    post.save()
    .then(result=>{
        if(result){
            // console.log("result comment")
            // console.log(result);
            //lấy thêm thông tin người dùng đăng nhập hiện tại (là chủ nhân comment này)
            var information = req.user.information;
            //dữ liệu comment để gửi lại cho người dùng
            var commentToSend = {
                id: commentnew._id, //id comment
                postid: id, // id của bài post
                content: commentnew.content,
                commentdate: moment(commentnew.commentdate).fromNow(),
                owner:{
                    id: userid,
                    information:{
                        showname:information.showname,
                        avatar:information.avatar
                    }
                }
            }
            // gọi hàm gửi comment đến người dùng khác (hàm này bất đồng bộ)
            sendCommentToAllUser(req,commentToSend);
            return res.status(200).json({
                code:200,
                message:"Comment thành công",
                data: commentToSend
            })
        }
        else{
            return res.status(500).json({
                code:500,
                message:"Đã xảy ra lỗi khi thực hiện comment"
            })
        }
    })
    .catch(err=>{
        return res.status(500).json({
            code:500,
            message:"Đã xảy ra lỗi khi thực hiện comment"
        })
    })
    
})
//việc gửi nên được đặt trong một hàm bất đồng bộ
async function sendCommentToAllUser(req,commentToSend){
    //lấy ra socketio
    var io = req.io;
    // //lấy ra mảng id của tất cả người dùng đang đăng nhập
    // var alluser = req.alluser;
    // //tiến hành gửi
    // alluser.forEach(function(userid){
    //     //gửi thông báo cho io nào ở client đang kết nối đến comment và chờ sự kiện server-send-new-comment-${userid}
    //     io.of("/comment").emit(`server-send-new-comment-${userid}`,commentToSend)
    // })
    io.emit("server-send-new-comment",commentToSend);
}

//thực hiện xóa một comment
route.post("/deletecomment/:id",async function(req,res){
    //lấy ra id của bài post
    var postid = req.params.id;
    //lấy ra id của comment
    var commentid = req.body.commentid;
    //lấy ra quyền người dùng hiện tại
    var rolecode = req.user.rolecode;
    //lấy ra id người dùng hiện tại
    var userid = req.user._id;
    // kiểm tra sự tồn tại của bài viết
    var post = await postsService.findPost({_id:postid});
    // nếu không tồn tại thì báo lỗi
    if(!post){
        return res.status(404).json({
            code:404,
            message:"Bài viết muốn xóa comment không tồn tại"
        })
    }
    //kiểm tra sự tồn tại của comment
    // tìm comment trong mảng comments của post
    var comment = post.comments.find(t=>t._id.toString()==commentid);
    if(!comment){
        return res.status(404).json({
            code:404,
            message:"Comment không tồn tại"
        })
    }
    //nếu người dùng hiện tại không phải admin thì kiểm tra người dùng hiện tại có phải chủ nhân của comment không ?
    // còn nếu admin thì cứ thực hiện xóa thẳng
    if(rolecode!=="AM"){
         // lấy ra id của chủ comment
        var ownercommentid = comment.owner._id;
        //so sánh với id người dùng đang đăng nhập
        //nếu phải chủ nhân comment thì báo lỗi liền ^^
        if(ownercommentid.toString() !== userid.toString()){
            return res.status(400).json({
                code:400,
                message:"Không thể xóa comment"
            })
        }
    }
    
    //nếu không có lỗi thì xóa comment trong mảng post
    //lấy vị trí comment
    var indexToDelete = post.comments.findIndex(t=>t._id.toString()==commentid);
    //xóa trong mảng comments
    post.comments.splice(indexToDelete,1);
    //save lại
    post.save()
    .then(result=>{
        if(result){
            // console.log(result)
            return res.status(200).json({
                code:200,
                message:"Xóa comment thành công",
                data:{ // trả về dữ liệu comment bị xóa
                    commentid:commentid
                }
            })
        }
        return res.status(500).json({
            code:500,
            message:"Xóa comment thất bại"
        })
    })
    .catch(err=>{
        return res.status(500).json({
            code:500,
            message:"Xóa comment thất bại"
        })
    })
   
    

})

module.exports = route;