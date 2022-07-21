const express = require("express");
const route = express.Router();
var notificationService = require("../services/notifications.js");
var postsService = require("../services/posts.js");
const moment = require("moment");
moment.locale("vi")

// route.use(function(req,res,next){ // kiểm tra xem có đăng nhập chưa để chuyển hướng về trang login

// })

// origin: /home

route.get("/",async function(req,res){
    
    // lấy danh sách thông báo để hiển thị (10 cái mới nhất)
    var limitval = 10;
    var sortval = {notificationdate: -1} // sắp xeo theo thời gian thông báo mới nhất (giảm dần)
                                            // nếu số 1 là dương thì là tăng dần
    var filter = {};
    var skipval = 0;
    var notificationsVal = await notificationService.findNotifications(filter,skipval,limitval,sortval)
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
    // lấy danh sách post để hiển thị (10 cái mới nhất) (không bao gồm comment -- comment người dùng có thể load sau)
    var sortval = {postdate:-1}; 
    var postsVal = await postsService.findPostsWithoutComments(filter,skipval,limitval,sortval);
    //map lại dữ liệu
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
    // console.log("posts ne")
    // console.log(postsLength)
    res.render("home",{title:"Home",notifications:notifications,posts:posts, postsLength:postsLength});// trả về giao diện home, dữ liệu account đã được thêm trong middleware ở app.js trước route Home
})

module.exports=route