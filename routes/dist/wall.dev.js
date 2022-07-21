"use strict";

var express = require("express");

var route = express.Router();

var notificationService = require("../services/notifications.js");

var postsService = require("../services/posts.js");

var accountsService = require("../services/accounts.js");

var createError = require("http-errors");

var moment = require("moment");

moment.locale("vi"); //origin: /wall

route.use("/", function (req, res, next) {
  //lấy ra id người dùng muốn xem khi vào tường nha của người đó
  var userid = req.query.id;

  if (!userid) {
    //kiểm tra xem có giá trị userid không ?
    return next(createError(404, "Không tìm thấy trang"));
  }

  return next();
});
route.get("/", function _callee(req, res, next) {
  var userid, userVal, skipval, limitval, sortval, filter, postsVal, posts, postsLength, userwall;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          //lấy ra giá trị id của người dùng mà mình muốn xem tường nhà
          userid = req.query.id; //tìm kiếm trong csdl

          _context.next = 3;
          return regeneratorRuntime.awrap(accountsService.findOne({
            _id: userid
          }));

        case 3:
          userVal = _context.sent;

          if (userVal) {
            _context.next = 6;
            break;
          }

          return _context.abrupt("return", next(createError(404, "Không tìm thấy trang")));

        case 6:
          //còn có người dùng thì lấy 10 bài viết mới nhất của người dùng đó ra
          skipval = 0;
          limitval = 10;
          sortval = {
            postdate: -1
          };
          filter = {
            owner: userid
          }; //tìm kiếm những bài viết dựa theo id của người dùng
          //lấy bài posts

          _context.next = 12;
          return regeneratorRuntime.awrap(postsService.findPostsWithoutComments(filter, skipval, limitval, sortval));

        case 12:
          postsVal = _context.sent;
          //map lại dữ liệu bài post
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

          postsLength = posts.length; // console.log(userVal)
          //map lại dữ liệu chủ nhân tường nhà

          userwall = {
            id: userVal._id,
            rolecode: userVal.rolecode,
            information: {
              showname: userVal.information.showname,
              classname: userVal.information.classname,
              department: {
                departname: getDepartname(userVal)
              },
              avatar: userVal.information.avatar
            }
          };
          return _context.abrupt("return", res.render("wall", {
            title: "Tường nhà",
            userwall: userwall,
            posts: posts,
            postsLength: postsLength
          }));

        case 17:
        case "end":
          return _context.stop();
      }
    }
  });
});

function getDepartname(userVal) {
  if (userVal.information.department) {
    return userVal.information.department.departname;
  } else {
    if (userVal.rolecode === "AM") {
      return "Quản trị hệ thống";
    } else {
      return "Chưa cập nhật";
    }
  }
}

module.exports = route;