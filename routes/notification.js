const express = require("express");
const route = express.Router();
const createError = require("http-errors");
var notificationService = require("../services/notifications.js");
var accountsService = require("../services/accounts.js");
var departmentsService = require("../services/departments.js");
const myValid = require("../validations/my-validation.js");
const validationResult = myValid.validationResult;
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const basehandle = require("../handles/base-handles.js"); // file chứa một hàm xử lý các vấn đề chung
const moment = require("moment");

moment.locale("vi")
var io;
var mysocket;
// origin: notification

// function checkRoleAddNotification(req,res,next){ // kiểm tra quyền chức năng thêm hoặc hiển thị trang quản lý thông báo
//     var rolecode = req.user.rolecode;
//     if(rolecode!=="PK" && rolecode!=="AM"){
//         return next(createError(404,"Không tìm thấy trang"))
//     }
//     next();
// }

route.use(function(req,res,next){
    // io = req.io;
    // io.on('connection', function(socket){
    //     req.notificationsocket = socket;
    //     socket.on("client-test-send",function(data){
    //         console.log(data)
    //     })
    //     socket.emit("server-test-send","send cái nè");
    //  });
    // console.log("fromroute: "+req.alluser)
     next()
})



function checkRoleInteractNotification(req,res,next){ // kiểm tra quyền khi thực hiện chức năng quản lý, thêm xóa sửa thông báo
    
    var rolecode = req.user.rolecode;
    if(rolecode!=="PK" && rolecode!=="AM"){
        return next(createError(404,"Không tìm thấy trang"))
    }
    
    next();
}




/*start: hiển thị view thêm thông báo */

route.use("/add",checkRoleInteractNotification,function(req,res,next){
    res.locals.addnotificationErr = req.flash("addnotificationErr");
    res.locals.addnotificationSucc = req.flash("addnotificationSucc");
    res.locals.titleVal = req.flash("titleVal");
    res.locals.contentVal = req.flash("contentVal");
    next();
})

route.get("/add",async function(req,res){
    // lấy danh sách phòng - khoa để hiển thị lên view (dựa vào quyền)
    var rolecode = req.user.rolecode;
    // nếu người dùng hiện tại là AM thì hiện toàn bộ phòng khoa
    var departmentsVal;
    if(rolecode==="AM"){
        departmentsVal = await departmentsService.findDepartments({});
    }
    else if(rolecode==="PK"){
        departmentsVal = req.user.departresponsible;
    }
    // map lại dữ liệu
    var departments = departmentsVal.map(function(depart){
        return {
            id: depart._id,
            departname: depart.departname
        }
    })

    res.render("addnotification",{title:"Thêm thông báo",departments:departments});
})


/*end: hiển thị view thêm thông báo */


/* start: xử lý thêm thông báo (chưa làm chức năng hiển thị thông báo lên trang người dùng là có thông báo mới) */
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
        
        else if(path.extname(file.originalname)==".xls" || path.extname(file.originalname)==".txt"||path.extname(file.originalname)==".doc" || path.extname(file.originalname)==".docx" || path.extname(file.originalname)==".pdf"){
            callback(null,true);
        }
        else{
            callback(new Error("File không đúng định dạng document hoặc hình ảnh"),false); // sai định dạng file thì tạo một lỗi mới
                                                                            // hàm xử lý file sẽ bắt được lỗi này (xem phần add sản phẩm)
        }
    },

    limits:{fileSize:10000000} // giới hạn file -- bé hơn 10mb
})

function handleAddNotificationForm(req,res,next){
    var {title,content} = req.body;
    
    var validResult = validationResult(req);
    if(validResult.errors.length){
        req.flash("titleVal",title);
        req.flash("contentVal",content);
        var error = validResult.errors[0];
        req.flash("addnotificationErr",error.msg);
        // đồng thời xóa hết file trong thư mục tạm (nếu có)
        basehandle.deleteAllFileInTmp(req);
        return res.redirect("/notification/add");
    }
    next();
}
route.use("/add",function(req,res,next){// kiểm tra file trước ở đây cho đỡ rối
                                        // do form gửi lên là dạng data-form
                                        // nên ta phải xủ lý file trước khi xử các thông tin khác
    var uploadResult = upload.array("notification-files",3);
    uploadResult(req,res,function(err){
        var {title,content} = req.body;
        
        if(err){
            req.flash("titleVal",title);
            req.flash("contentVal",content);
            var errormess = err.message;
            if(errormess=="Unexpected field"){
                errormess = "Tối đa 3 files được cho phép"
            }
            req.flash("addnotificationErr",errormess);
            return res.redirect("/notification/add");
        }
        next();
    })
})
route.post("/add",myValid.validNotificationForm,handleAddNotificationForm,async function(req,res,next){
    var files = req.files;
    var {title,content,department} = req.body;
    var rolecode = req.user.rolecode;
    // kiểm tra xem department (ở dạng id) người dùng chọn có tồn tại không ?
    // nếu là người dùng AM thì kiểm tra trong toàn bộ departments
    var depart;
    if(rolecode==="AM"){
        //nếu là người dùng AM thì tìm trong csdl
        depart = await departmentsService.findDepartment({_id:department});
        
    }
    // nếu là người dùng PK thì tìm trong phòng khoa mình phụ trách
    else if(rolecode==="PK"){
        // nếu là người dùng PK thì tìm trong phòng khoa mình phụ trách
        var departments = req.user.departresponsible;
        depart = departments.find(t=>t._id==department);
    }
    if(!depart){ // nếu không tồn tại department mà người dugnf chọn thì báo lỗi và xóa hết file tạm
        req.flash("addnotificationErr","Phòng khoa cho thông báo không tồn tại");
        // đồng thời xóa hết file trong thư mục tạm (nếu có)
        basehandle.deleteAllFileInTmp(req);
        return res.redirect("/notification/add");
    }

    // nếu đến đây thì không có lỗi
    // tiến hành lưu thông tin về title - content - department trước -- lưu thành công thì mới tiến hành lưu file

    // bởi vì lưu thành công ta mới có được id của thông báo để tạo thư mục chứa file dễ hơn
    var value = {
        title: title,
        content: content,
        department: department
    }
    var notification = await notificationService.add(value);
    // console.log(notification);
    // tiến hành di chuyển file vào thư mục của notifications/id bài viết nếu có
    if(req.files.length){
        // gọi hàm thêm nhiều file
        var result = await basehandle.moveFiles(req,notification._id,"notifications");
        var pathToSaveArray = result[0];
        var originFileNameArray = result[1];
        var pathToInteract = result[2]; //mảng chứa đường dẫn để tương tác với csdl
        
        // thực hiện lưu vào csdl
        for(var i= 0; i< pathToSaveArray.length ; i++){
            var valuefile = { // chuẩn bị dữ liệu
                fileurl: pathToSaveArray[i], // đường dẫn đến file 
                originfilename: originFileNameArray[i], // tên để hiển thị
                path:pathToInteract[i] // đường dẫn để tương tác
            }
            // push vào notification đã tạo ở trên
            notification.files.push(valuefile);

        }
    }
    // lấy lại bài thông báo đó ra thì kết quả result chưa có chứa thông tin populate phòng khoa
    // nên ta sài find để lấy luôn thông tin phòng khoa
    var notificationToSocket = await notificationService.findNotification({_id:notification._id});
    // cuối cùng là save notification lại
    notification.save()
    .then(result=>{
        if(result){
            
            req.flash("interactnotificationSucc","Bạn vừa tạo một bài thông báo mới có id: " + result._id)
            //gửi thông báo mới đến tất cả người dùng đang active bằng dùng socketio trong một hàm bất đồng bộ
            //chhuanar bị dữ liệu
            var notificationToSend = {
                id: notificationToSocket._id,
                title: notificationToSocket.title,
                notificationdate: moment(notificationToSocket.notificationdate).format("L"),
                department:{
                    id:notification.department._id,
                    departname: notificationToSocket.department.departname,
                    departtype: notificationToSocket.department.departtype,
                    departcode: notificationToSocket.department.departcode
                }
            }
            sendNotificationToAllUser(req,notificationToSend);
            // console.log("no1")
            return res.redirect("/notification/manager");
        }

    })
    .catch(err=>{
        console.log(err);
        req.flash("addnotificationErr","Có lỗi khi tạo bài thông báo, vui lòng thử lại");
        return res.redirect("/notification/add");
    })
    
})
//khi có một thông báo mới được tạo thì dùng socket và gửi đến tất cả người dùng
async function sendNotificationToAllUser(req, notificationToSend){
    
    //lấy ra socketio
    var io = req.io;
            
    // //lấy ra mảng id của tất cả người dùng
    // var alluser = req.alluser;
    // //gửi thông báo cho tất cả người dùng đã đăng nhập (dựa vào mảng id)
    // alluser.forEach(function(userid){
        
    //     //gửi thông báo cho io nào ở client đang kết nối đến home và chờ sự kiện server-send-new-notification-${userid}
    //     io.of("/home").emit(`server-send-new-notification-${userid}`,notificationToSend)
    // })
    // // console.log("no2")
    io.emit("server-send-new-notification",notificationToSend);
}

/* end: xử lý thêm thông báo */

/*Start: Hiển thị chi tiết một thông báo */
route.get("/details",async function(req,res,next){
    // kiểm tra xem có id bài viết được gửi đến không
    var id = req.query.id;
    if(!id){
        return next(createError(404,"Không tìm thấy bài viết"))
    }
    // thực hiện tìm bài viết dựa vào id
    var notificationVal = await notificationService.findNotification({_id:id});
    
    if(!notificationVal){
        return next(createError(404,"Không tìm thấy bài viết"))
    }
    // console.log(notificationVal)
    //mapping giá trị lại
    var notification = {
        id: notificationVal._id,
        title: notificationVal.title,
        content: notificationVal.content,
        notificationdate:moment(notificationVal.notificationdate).format("L"),
        department:{
            id: notificationVal.department._id,
            departname: notificationVal.department.departname
        },
        files:notificationVal.files.map(function(noti){
            return {
                id: noti._id,
                fileurl: noti.fileurl,
                originfilename: noti.originfilename
            }
        })
    }
    // console.log(notification);
    res.render("detailsnotification",{title:"Chi tiết thông báo",notification:notification});

})
/*End: Hiển thị chi tiết một thông báo */

route.use("/edit",checkRoleInteractNotification,function(req,res,next){
    res.locals.editnotificationErr = req.flash("editnotificationErr");
    res.locals.editnotificationSucc = req.flash("editnotificationSucc");
    next()
})

// hàm kiểm tra quyền đăng bài của tài khoản có được cho phép xóa, sửa bài thông báo hay không ?
async function middlewareInteractNotification(req,res,next){
    var id = req.query.id; //lấy ra id bài thông báo
    if(!id){
        return next(createError(404,"Không tìm thấy bài viết"))
    }
    // thực hiện tìm bài viết dựa vào id
    var notificationVal = await notificationService.findNotification({_id:id});
    
    if(!notificationVal){
        return next(createError(404,"Không thể truy cập bài viết"))
    }
    
    var account = req.user;
   
    // lấy ra thông tin để kiểm tra quyền hạn của tài khoản có tương ứng với bài không (chỉ dành cho tk PK)
    if(account.rolecode ==="PK"){
        var department = notificationVal.department; //lấy thông tin phòng khoa của bài
        var departresponsible = account.departresponsible; // lấy quyền hạn đăng bài của user
        if(!departresponsible.find(t=>t._id.toString()==department._id.toString())){ // kiểm tra
            return next(createError(404,"Không thể truy cập bài viết"))
        }
    }
    next();
}
/*Start: Hiển thị trang chỉnh sửa một thông báo */

route.get("/edit",middlewareInteractNotification,async function(req,res,next){
    var id = req.query.id;
    // lấy thông tin phòng khoa dựa vào quyền người dùng để hiện ra view và để chỉnh sửa
    var account = req.user;
    var departmentsVal;
    var rolecode = account.rolecode;
    // thực hiện tìm bài viết dựa vào id
    var notificationVal = await notificationService.findNotification({_id:id});
    if(rolecode==="AM"){
        departmentsVal = await departmentsService.findDepartments({});
    }
    else if(rolecode==="PK"){
        departmentsVal = req.user.departresponsible;
    }
    // map lại dữ liệu
    var departments = departmentsVal.map(function(depart){
        return {
            id: depart._id,
            departname: depart.departname
        }
    })
    
    //map lại dữ liệu bài thông báo
    var notification = {
        id: notificationVal._id,
        title: notificationVal.title,
        content: notificationVal.content,
        notificationdate:moment(notificationVal.notificationdate).format("L"),
        department:{
            id: notificationVal.department._id,
            departname: notificationVal.department.departname
        },
        files:notificationVal.files.map(function(noti){
            return {
                id: noti._id,
                fileurl: noti.fileurl,
                originfilename: noti.originfilename
            }
        })
    }
    res.render("editnotification",{title:"Chỉnh sửa thông báo",notification:notification,departments:departments});

})

/*End: Hiển thị trang chỉnh sửa một thông báo */

/*Start: Xóa một file trong bài thông báo */
route.get("/deletefile",middlewareInteractNotification,async function(req,res){
    var {id, fileid} = req.query;
    // id (của bài viết) đã được kiểm tra
    // kiểm tra id của file
    if(!fileid){
        req.flash("editnotificationErr","File không tồn tại để xóa");
        return res.redirect(`/notification/edit?id=${id}`)
    }
    // kiểm tra sự tồn tại của file trong bài viết
    // lấy bài viết ra
    var notificationVal = await notificationService.findNotification({_id:id});
    // nếu trường hợp bài viết không có file nào => không có gì để xóa
    if(!notificationVal.files.length){
        req.flash("editnotificationErr","File không tồn tại để xóa");
        return res.redirect(`/notification/edit?id=${id}`)
    }
    // tìm file trong bài thông báo
    var file = notificationVal.files.find(t=>t._id.toString()==fileid.toString());
    // nếu không tìm thấy file thì báo lỗi
    if(!file){
        req.flash("editnotificationErr","File không tồn tại để xóa");
        return res.redirect(`/notification/edit?id=${id}`)
    }
    //lấy ra đường dẫn để xóa trên firebase
    var pathToDelete = file.path;
    //gọi hàm xóa trên firebase
    await basehandle.deleteFile(pathToDelete);
    // sau đó xóa file ra khỏi mảng của bài thông báo
    var indextoDelete = notificationVal.files.findIndex(t=>t._id.toString()==fileid.toString());
    notificationVal.files.splice(indextoDelete,1);
    notificationVal.save()
    .then(result=>{
        if(result){
            req.flash("editnotificationSucc","Xóa file thành công");
            return res.redirect(`/notification/edit?id=${id}`)
        }
    })
    .catch(err=>{
        req.flash("editnotificationErr","Đã có lỗi xảy ra khi xóa file, vui lòng thử lại");
        return res.redirect(`/notification/edit?id=${id}`)
    })
   
})
/*End: Xóa một file trong bài thông báo */

/*start: chỉnh sửa bài thông báo */

function handleEditNotificationForm(req,res,next){
    
    var id = req.query.id;
    var validResult = validationResult(req);
    if(validResult.errors.length){
        var error = validResult.errors[0];
        req.flash("editnotificationErr",error.msg);
        // đồng thời xóa hết file trong thư mục tạm (nếu có)
        basehandle.deleteAllFileInTmp(req);
        return res.redirect(`/notification/edit?id=${id}`)
    }
    next();
}
route.use("/edit",middlewareInteractNotification,function(req,res,next){// kiểm tra file trước ở đây cho đỡ rối
    // do form gửi lên là dạng data-form
    // nên ta phải xủ lý file trước khi xử các thông tin khác
    var id = req.query.id;
    var uploadResult = upload.array("notification-files",3);
    uploadResult(req,res,function(err){
        if(err){
            
            var errormess = err.message;
            if(errormess=="Unexpected field"){
                errormess = "Tối đa 3 files được cho phép"
            }
            req.flash("editnotificationErr",errormess);
            return res.redirect(`/notification/edit?id=${id}`)
        }
        next();
    })
})

route.post("/edit",myValid.validNotificationForm,handleEditNotificationForm,async function(req,res,next){
    // trước khi vào được tới đây đã kiểm tra qua middleware hết rồi (kiểm tra id, sự tồn tại của bài viết, quyền người dùng tương tác)
    // cũng đã kiểm tra luôn tính hợp của form 
    // lấy id bài viết
    var id =req.query.id;
    var {title,content,department} = req.body;
    var rolecode = req.user.rolecode;
    // kiểm tra xem department (ở dạng id) người dùng chọn có tồn tại không ?
    // nếu là người dùng AM thì kiểm tra trong toàn bộ departments
    var depart;
    if(rolecode==="AM"){
        //nếu là người dùng AM thì tìm trong csdl
        depart = await departmentsService.findDepartment({_id:department});
        
    }
    // nếu là người dùng PK thì tìm trong phòng khoa mình phụ trách
    else if(rolecode==="PK"){
        // nếu là người dùng PK thì tìm trong phòng khoa mình phụ trách
        var departments = req.user.departresponsible;
        depart = departments.find(t=>t._id.toString()==department.toString());
    }
    if(!depart){ // nếu không tồn tại department mà người dugnf chọn thì báo lỗi và xóa hết file tạm
        req.flash("editnotificationErr","Phòng khoa cho thông báo không tồn tại");
        // đồng thời xóa hết file trong thư mục tạm (nếu có)
        basehandle.deleteAllFileInTmp(req);
        return res.redirect(`/notification/edit?id=${id}`)
    }
    // lấy bài viết
    var notificationVal = await notificationService.findNotification({_id:id});
    // kiểm tra về file (nếu có)
    if(req.files.length){
        // nếu số file của bài viết + số file up lên > 3 => xóa hết trong file tạm và báo lỗi
        var lengthcurrentfiles = notificationVal.files.length; //số file hiện tại đang có
        var lengthnewfiles = req.files.length; // số file dự định thêm vào
        if(lengthcurrentfiles+lengthnewfiles > 3){
            basehandle.deleteAllFileInTmp(req);//xóa file tạm nếu có lỗi xảy ra
            req.flash("editnotificationErr","Không thể up thêm file, đã đạt số lượng tối đa");
            return res.redirect(`/notification/edit?id=${id}`)
        }
        // nếu không có lỗi về số luognwj tối đa thì chuyển file vào thư mục
        
        // gọi hàm thêm nhiều file
        var result = await basehandle.moveFiles(req,id,"notifications");
        var pathToSaveArray = result[0];
        var originFileNameArray = result[1];
        var pathToInteract = result[2]; //mảng chứa đường dẫn để tương tác với csdl
        
        // thực hiện lưu vào csdl
        for(var i= 0; i< pathToSaveArray.length ; i++){
            var valuefile = { // chuẩn bị dữ liệu
                fileurl: pathToSaveArray[i], // đường dẫn đến file 
                originfilename: originFileNameArray[i], // tên để hiển thị
                path:pathToInteract[i] // đường dẫn để tương tác
            }
            // push vào notification đã tạo ở trên
            notificationVal.files.push(valuefile);

        }
        
        
    }
    // lưu các thông tin khác về content, title, phòng khoa
    notificationVal.content = content;
    notificationVal.title = title;
    notificationVal.department = department
    notificationVal.save()
    .then(result=>{
        if(result){
            req.flash("editnotificationSucc","Chỉnh sửa file thành công");
            return res.redirect(`/notification/edit?id=${id}`)
        }
    })
    .catch(err=>{
        req.flash("editnotificationErr","Chỉnh sửa file thất bại, vui lòng thử lại");
        return res.redirect(`/notification/edit?id=${id}`)
    })
    
})
/*end: chỉnh sửa bài thông báo */


/*start: xóa một bài thông báo */

// trước khi xóa đã gọi middleware kiểm tra người dùng có quyền được xóa hay không
route.get("/delete",middlewareInteractNotification,async function(req,res,next){
    // lấy ra id của bài viết
    var id = req.query.id;
    // lấy ra bài viết để truy cập file
    var notification = await notificationService.findNotification({_id:id});
    //lấy ra files của bài viết
    var files = notification.files;
    // thực hiện xóa trong csdl
    var result = await notificationService.deleteNotification({_id:id});
    // console.log(result);
    if(result && result.ok===1){ // nếu kết quả xóa thành công
        //tiến hành xóa các file trên filebase (không cần chờ kết quả vì bài viết sẽ không còn tồn tại)
        for(fileindex in files){
            var file = files[fileindex];
            basehandle.deleteFile(file.path); //lấy path để xóa
        }
        req.flash("interactnotificationSucc","Bạn vừa xóa bài thông báo có id: " + id)
        return res.redirect("/notification/manager");
        
    }
    else{
        req.flash("editnotificationErr","Xóa file thất bại, vui lòng thử, vui lòng thử lại");
        return res.redirect(`/notification/edit?id=${id}`)
    }

   

})


/*end: xóa một bài thông báo */


/*start: hiển thị trang quản lý thông báo (bao gồm chức năng tìm kiếm )*/

//đã gọi middleware kiểm tra quyền người dùng
route.use("/manager",checkRoleInteractNotification,function(req,res,next){
    // nếu xóa hay thêm thông báo thành công thì sẽ có hiển thị thông báo này ở trang quản lý
    res.locals.interactnotificationSucc = req.flash("interactnotificationSucc");
    next()
})


route.get("/manager",async function(req,res,next){
    // xác định các giá trị search (department, field, searchvalue)
    //department: giá trị là id của phòng khoa muốn tìm hoặc là all(nghĩa là tìm tất cả luôn)
    //field: trường dữ liệu muốn tìm -- nếu là rỗng thì không tìm
    //searchvalue: giá trị muốn tìm theo field -- nếu là rỗng thì không tìm
    //page
    var {field,department,searchvalue,page} = req.query;
    var filter = {};
    if(field!=="id" && field!=="title"){ // nếu filter kiểu dữ liệu không nằm trong 2 giá trị này => không tìm kiểu dữ liệu
        field = "none";
        searchvalue = ""; // không chọn trường dữ liệu thì search value không có nghĩa gì nữa
    }
    else{
        
        if(!searchvalue || searchvalue==""){ // nếu không có giá trị tìm kiếm thì việc chọn field cũng không còn ý nghĩa
            // cho nên ta cũng field = none
            field = "none";

        }
    }
    
    // nếu field != none (nghĩa là người dùng muốn tìm kiếm thông báo theo kiểu dữ liệu và có nhập dữ liệu) 
    //thì ta mới thêm vào filter
    if(field !== "none"){
        // lúc đưa vào ta cũng kiểm tra một chút để đưa lại dạng _id nếu field là id cho phù hợp khi tìm kiếm
        // nên dùng toán tử like
        filter[`${field =="id" ? "_id" : field}`] = {$regex: searchvalue, $options: "i"}
    }
    
    
    
    // lấy danh sách phòng - khoa để hiển thị lên view (dựa vào quyền) để cho phần filter
    var rolecode = req.user.rolecode;
    // nếu người dùng hiện tại là AM thì hiện toàn bộ phòng khoa
    var departmentsVal;
    if(rolecode==="AM"){
        //lấy danh sách tất cả phòng khoa nếu là AM
        departmentsVal = await departmentsService.findDepartments({});
    }
    else if(rolecode==="PK"){
        //lấy danh sách phòng khoa thuộc quyền hạn nếu là PK
        departmentsVal = req.user.departresponsible;
    }
    // map lại dữ liệu
    var departments = departmentsVal.map(function(depart){
        return {
            id: depart._id,
            departname: depart.departname
        }
    })
    // tìm giá trị department (id) mà người sử dụng chức năng tìm kiếm có trong mảng departments hay không
    if(departments.find(t=>t.id.toString()===department)){ //nếu có nghĩa là người dùng có chọn một phòng khoa theo quyền
                                                            // để tìm kiếm thông báo
        
        filter["department"] = department
        // lưu ý là khi ta filter find của mongoose thì lúc này dữ liệu chưa được populate
        // nên ta chỉ có thể tìm kiếm nó ở dạng id thông thường lúc chưa populate
        // hoặc có một giải pháp khác là filter trong hàm populate luôn (có thể xem thêm trong trang mongoose phần populate)
    }
    else{ // ngược lại không có thì hiển thị toàn bộ thông báo (theo quyền hạn phòng khoa của người dùng)
        department = "all"; // set lại department = all
        if(rolecode==="AM"){ // nếu là AM thì chỉ cần hiện toàn bộ thông báo là được
            // không cần thêm gì vào filter để có thể lấy toàn bộ thông báo
            
        }
        else{ // ngược lại nếu là PK thì hiển thị toàn bộ thông báo nhưng dựa theo phòng khoa mà mình được phân quyền
            var tmp = [] // mảng chứa id của phòng khoa mà người dùng đảm nhận
            departments.forEach(function(depart){ // chạy mảng departments để lấy giá trị id
                tmp.push(depart.id)
            })

            filter["department"] = {$in : tmp};// tạo một giá trị $or mảng 
                                    //ví dụ (k liên quan đến bài) (db.inventory.find ( { quantity: { $in: [20, 50] } } ))
                                    // tìm ra quantity có 20 hoặc 50
                                    // áp dụng điều này để tìm thông báo theo mảng id tương ứng

        }
    }
   
   
    // lấy ra số lượng thông báo hiện có theo filter
    var numbernotifications = await notificationService.countNotifications(filter);
    //nếu count không tồn tại (lỗi do input search value không đúng định dạng thì trả về undefined) ta gán = 0
    if(!numbernotifications){
        numbernotifications = 0;
    }
    // tìm số page lớn nhất theo số bài thông báo
    // dùng hàm làm tròn đến cận lớn nhất (2.1 = 3 or 2.5 = 3 or 2.7 = 3)
    var numberpage = Math.ceil(numbernotifications/10); // chia 10 vì theo yêu cầu phân trang thì phân 10 bài mỗi trang
    // kiểm tra page
    if(!page){ // nếu không có thì cứ gán = 1
        page = 1;
    }
    else{ // nếu có thì kiểm tra tính hợp lệ của page (phải là số nguyên)
        if(isNaN(page)){ // nếu không phải là số
            return next(createError(404,"Không tìm thấy trang mong muốn"))
        }
        // nếu là số thì kiểm tra có phải số nguyên không ?
        if(Number.isInteger(page)){
            return next(createError(404,"Không tìm thấy trang mong muốn"))
        }
        // nếu là số nguyên mà < 1 => không có vụ < 0 được báo lỗi luôn
        if(page < 1){
            return next(createError(404,"Không tìm thấy trang mong muốn"))
        }
        // nếu page không có lỗi gì thì chuyển về dạng int
        page = parseInt(page);
        // nếu số page người dùng muốn tìm > số page có thể đạt được dựa vào số thông báo (đã tính ở trên)
        if(page > numberpage){
            return next(createError(404,"Không tìm thấy trang mong muốn"))
        }
       
    }
    
    


    // tìm danh sách notifications để hiển thị lên view -- nếu số lượng thông báo theo filter > 0
    if(numbernotifications > 0){
        // tìm danh sách thông báo
        // chuẩn bị dữ liệu skip (page -1) * 10 là để bỏ 10 dữ liệu ở trước page này
        var skipval = (page-1)*10
        var limitval = 10;
        var sortval = {notificationdate: -1} // sắp xeo theo thời gian thông báo mới nhất (giảm dần)
                                            // nếu số 1 là dương thì là tăng dần
        var notificationsVal = await notificationService.findNotifications(filter,skipval,limitval,sortval)
        // console.log(notificationsVal)
        // map lại dữ liệu
        var notifications = notificationsVal.map(function(notification){
            return {
                id: notification._id,
                title: notification.title,
                department: {
                    id:notification.department._id,
                    departname: notification.department.departname,
                    departtype: notification.department.departtype,
                    departcode: notification.department.departcode
                },
                notificationdate:moment(notification.notificationdate).format("L")
                
            }
        })
    }
    else{
        var notifications = []
    }
    
    
  
        
  
    
    // console.log(notifications);
    // console.log(filter)
    
    res.render("managernotification",{title:"Quản lý thông báo",notifications:notifications,departments:departments,department:department,field:field,searchvalue:searchvalue,page:page, numberpage:numberpage})
})

/*end: hiển thị trang quản lý thông báo (bao gồm chức năng tìm kiếm ) */

/*start: hiển thị tất cả thông báo cho người dùng */

route.get("/",async function(req,res,next){
    var {department, page } = req.query;
    //nếu không có giá trị department hay department = "all" thì nghĩa là người dùng đang muốn xem thông báo
    // mà không quan tâm đến phong ban nào
    if(!department || department=="all"){
        department = "all";
    }
    var filter = {};
    

    //nếu người dùng tìm các thông báo theo phòng ban nào đó -- thì gán giá trị vào cho filter
    if(department!="all"){
        filter["department"] = department
    }

    // lấy ra số lượng thông báo hiện có theo filter
    var numbernotifications = await notificationService.countNotifications(filter);

    //nếu count không tồn tại (lỗi do input search value không đúng định dạng thì trả về undefined) ta gán = 0
    if(!numbernotifications){
        numbernotifications = 0;
    }
    // tìm số page lớn nhất theo số bài thông báo
    // dùng hàm làm tròn đến cận lớn nhất (2.1 = 3 or 2.5 = 3 or 2.7 = 3)
    var numberpage = Math.ceil(numbernotifications/10); // chia 10 vì theo yêu cầu phân trang thì phân 10 bài mỗi trang
    // kiểm tra page
    if(!page){ // nếu không có thì cứ gán = 1
        page = 1;
    }
    else{ // nếu có thì kiểm tra tính hợp lệ của page (phải là số nguyên)
        if(isNaN(page)){ // nếu không phải là số
            return next(createError(404,"Không tìm thấy trang mong muốn"))
        }
        // nếu là số thì kiểm tra có phải số nguyên không ?
        if(Number.isInteger(page)){
            return next(createError(404,"Không tìm thấy trang mong muốn"))
        }
        // nếu là số nguyên mà < 1 => không có vụ < 0 được báo lỗi luôn
        if(page < 1){
            return next(createError(404,"Không tìm thấy trang mong muốn"))
        }
        // nếu page không có lỗi gì thì chuyển về dạng int
        page = parseInt(page);
        // nếu số page người dùng muốn tìm > số page có thể đạt được dựa vào số thông báo (đã tính ở trên)
        if(page > numberpage){
            return next(createError(404,"Không tìm thấy trang mong muốn"))
        }
       
    }
    // tìm danh sách notifications để hiển thị lên view -- nếu số lượng thông báo theo filter > 0
    if(numbernotifications > 0){
        // tìm danh sách thông báo
        // chuẩn bị dữ liệu skip (page -1) * 10 là để bỏ 10 dữ liệu ở trước page này
        var skipval = (page-1)*10
        var limitval = 10;
        var sortval = {notificationdate: -1} // sắp xeo theo thời gian thông báo mới nhất (giảm dần)
                                            // nếu số 1 là dương thì là tăng dần
        var notificationsVal = await notificationService.findNotifications(filter,skipval,limitval,sortval)
        // console.log(notificationsVal)
        // map lại dữ liệu
        var notifications = notificationsVal.map(function(notification){
            return {
                id: notification._id,
                title: notification.title,
                department: {
                    id:notification.department._id,
                    departname: notification.department.departname,
                    departtype: notification.department.departtype,
                    departcode: notification.department.departcode
                },
                notificationdate:moment(notification.notificationdate).format("L")
                
            }
        })
    }
    else{
        var notifications = []
    }
    //lấy danh sách tất cả phòng khoa để đổ ra view dành cho việc filter
    var departmentsVal = await departmentsService.findDepartments({})
    //mapping dữ liệu lại
    // map lại dữ liệu
    var departments = departmentsVal.map(function(depart){
        return {
            id: depart._id,
            departname: depart.departname
        }
    })
    res.render("notifications",{title:"Thông báo",departments:departments,department:department,notifications:notifications,page:page,numberpage:numberpage})
    

})

/*end: hiển thị tất cả thông báo cho người dùng */




module.exports = route;