"use strict";

var express = require("express");

var route = express.Router();

var notificationService = require("../services/notifications.js");

var postsService = require("../services/posts.js");

var moment = require("moment");

moment.locale("vi"); // route.use(function(req,res,next){ // kiểm tra xem có đăng nhập chưa để chuyển hướng về trang login
// })
// origin: /home

route.get("/", function _callee(req, res) {
  var limitval, sortval, filter, skipval, notificationsVal, notifications, postsVal, posts, postsLength;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // lấy danh sách thông báo để hiển thị (10 cái mới nhất)
          limitval = 10;
          sortval = {
            notificationdate: -1
          }; // sắp xeo theo thời gian thông báo mới nhất (giảm dần)
          // nếu số 1 là dương thì là tăng dần

          filter = {};
          skipval = 0;
          _context.next = 6;
          return regeneratorRuntime.awrap(notificationService.findNotifications(filter, skipval, limitval, sortval));

        case 6:
          notificationsVal = _context.sent;
          // map lại dữ liệu
          notifications = notificationsVal.map(function (notification) {
            return {
              id: notification._id,
              title: notification.title,
              department: {
                id: notification.department._id,
                departname: notification.department.departname,
                departtype: notification.department.departtype,
                departcode: notification.department.departcode
              },
              notificationdate: moment(notification.notificationdate).format("L")
            };
          }); // lấy danh sách post để hiển thị (10 cái mới nhất) (không bao gồm comment -- comment người dùng có thể load sau)

          sortval = {
            postdate: -1
          };
          _context.next = 11;
          return regeneratorRuntime.awrap(postsService.findPostsWithoutComments(filter, skipval, limitval, sortval));

        case 11:
          postsVal = _context.sent;
          //map lại dữ liệu
          posts = postsVal.map(function (post) {
            return {
              id: post.id,
              content: post.content,
              owner: {
                id: post.owner.id,
                information: {
                  showname: post.owner.information.showname,
                  avatar: post.owner.information.avatar
                }
              },
              postdate: moment(post.postdate).format("LLL"),
              attachedfiles: post.attachedfiles.map(function (file) {
                return {
                  id: file.id,
                  fileurl: file.fileurl,
                  filetype: file.filetype
                };
              })
            };
          }); // lấy ra số lượng posts được lấy ra để gắn vào một phần nào đó của giao diện để dễ dàng cho việc loadtimeline hơn

          postsLength = posts.length; // console.log("posts ne")
          // console.log(postsLength)

          res.render("home", {
            title: "Home",
            notifications: notifications,
            posts: posts,
            postsLength: postsLength
          }); // trả về giao diện home, dữ liệu account đã được thêm trong middleware ở app.js trước route Home

        case 15:
        case "end":
          return _context.stop();
      }
    }
  });
});
module.exports = route;