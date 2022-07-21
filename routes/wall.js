const express = require("express");
const route = express.Router();
var notificationService = require("../services/notifications.js");
var postsService = require("../services/posts.js");
var accountsService = require("../services/accounts.js");
const createError = require("http-errors");
const moment = require("moment");
moment.locale("vi")

//origin: /wall

route.use("/",function(req,res,next){
    //lấy ra id người dùng muốn xem khi vào tường nha của người đó
    var userid = req.query.id;
    if(!userid){ //kiểm tra xem có giá trị userid không ?
        return next(createError(404,"Không tìm thấy trang"));
    }
    return next();
})

route.get("/",async function(req,res,next){
    //lấy ra giá trị id của người dùng mà mình muốn xem tường nhà
    var userid = req.query.id;
    //tìm kiếm trong csdl
    var userVal = await accountsService.findOne({_id:userid});
    //kiểm tra sự tồn tại
    if(!userVal){
        return next(createError(404,"Không tìm thấy trang"));
    }
    //còn có người dùng thì lấy 10 bài viết mới nhất của người dùng đó ra
    var skipval = 0;
    var limitval = 10;
    var sortval = {postdate:-1};
    var filter = {owner:userid}; //tìm kiếm những bài viết dựa theo id của người dùng
    //lấy bài posts
    var postsVal = await postsService.findPostsWithoutComments(filter,skipval,limitval,sortval);
    //map lại dữ liệu bài post
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
    // lấy ra số lượng posts được lấy ra để gắn vào một phần nào đó của giao diện để dễ dàng cho việc loadtimeline hơn
    var postsLength = posts.length;
    // console.log(userVal)
    //map lại dữ liệu chủ nhân tường nhà
    var userwall = {
        id: userVal._id,
        rolecode: userVal.rolecode,
        information:{
            showname:userVal.information.showname,
            classname:userVal.information.classname,
            department:{
                departname: getDepartname(userVal)
            },
            avatar:userVal.information.avatar
        }
    }

    return res.render("wall",{title:"Tường nhà",userwall:userwall, posts:posts,postsLength:postsLength})

})

function getDepartname(userVal){
    if(userVal.information.department){
        return userVal.information.department.departname;
    }
    else{
        if(userVal.rolecode==="AM"){
            return "Quản trị hệ thống"
        }
        else{
            return "Chưa cập nhật"
        }
        
    }
}


module.exports = route;