"use strict";

var express = require("express");

var route = express.Router();

var createError = require("http-errors");

var notificationService = require("../services/notifications.js");

var accountsService = require("../services/accounts.js");

var departmentsService = require("../services/departments.js");

var myValid = require("../validations/my-validation.js");

var validationResult = myValid.validationResult;

var multer = require("multer");

var path = require("path");

var fs = require("fs");

var basehandle = require("../handles/base-handles.js"); // file chứa một hàm xử lý các vấn đề chung


var moment = require("moment");

moment.locale("vi");
var io;
var mysocket; // origin: notification
// function checkRoleAddNotification(req,res,next){ // kiểm tra quyền chức năng thêm hoặc hiển thị trang quản lý thông báo
//     var rolecode = req.user.rolecode;
//     if(rolecode!=="PK" && rolecode!=="AM"){
//         return next(createError(404,"Không tìm thấy trang"))
//     }
//     next();
// }

route.use(function (req, res, next) {
  // io = req.io;
  // io.on('connection', function(socket){
  //     req.notificationsocket = socket;
  //     socket.on("client-test-send",function(data){
  //         console.log(data)
  //     })
  //     socket.emit("server-test-send","send cái nè");
  //  });
  // console.log("fromroute: "+req.alluser)
  next();
});

function checkRoleInteractNotification(req, res, next) {
  // kiểm tra quyền khi thực hiện chức năng quản lý, thêm xóa sửa thông báo
  var rolecode = req.user.rolecode;

  if (rolecode !== "PK" && rolecode !== "AM") {
    return next(createError(404, "Không tìm thấy trang"));
  }

  next();
}
/*start: hiển thị view thêm thông báo */


route.use("/add", checkRoleInteractNotification, function (req, res, next) {
  res.locals.addnotificationErr = req.flash("addnotificationErr");
  res.locals.addnotificationSucc = req.flash("addnotificationSucc");
  res.locals.titleVal = req.flash("titleVal");
  res.locals.contentVal = req.flash("contentVal");
  next();
});
route.get("/add", function _callee(req, res) {
  var rolecode, departmentsVal, departments;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // lấy danh sách phòng - khoa để hiển thị lên view (dựa vào quyền)
          rolecode = req.user.rolecode; // nếu người dùng hiện tại là AM thì hiện toàn bộ phòng khoa

          if (!(rolecode === "AM")) {
            _context.next = 7;
            break;
          }

          _context.next = 4;
          return regeneratorRuntime.awrap(departmentsService.findDepartments({}));

        case 4:
          departmentsVal = _context.sent;
          _context.next = 8;
          break;

        case 7:
          if (rolecode === "PK") {
            departmentsVal = req.user.departresponsible;
          }

        case 8:
          // map lại dữ liệu
          departments = departmentsVal.map(function (depart) {
            return {
              id: depart._id,
              departname: depart.departname
            };
          });
          res.render("addnotification", {
            title: "Thêm thông báo",
            departments: departments
          });

        case 10:
        case "end":
          return _context.stop();
      }
    }
  });
});
/*end: hiển thị view thêm thông báo */

/* start: xử lý thêm thông báo (chưa làm chức năng hiển thị thông báo lên trang người dùng là có thông báo mới) */

var storage = multer.diskStorage({
  // thiết lập nơi lưu trữ và tên file được lưu trữ
  filename: function filename(req, file, callback) {
    //callback thiết lập tên file
    callback(null, Date.now() + "_" + file.originalname);
  },
  destination: function destination(req, file, callback) {
    //callback thiết lập nơi lưu trữ tạm thời
    // đường link tính từ thư mục gốc của project
    callback(null, "public/tmp/");
  }
});
var upload = multer({
  storage: storage,
  // thiết lập lưu trữ (nơi lưu trữ và tên file được lưu trữ)
  fileFilter: function fileFilter(req, file, callback) {
    //callback lưu file
    // xử lý file trước khi di chuyển
    // console.log(path.extname(file.originalname))
    if (file.mimetype.startsWith("image/")) {
      // kiểm tra xem có phải file ảnh không ?
      // phải thì cho phép upload
      callback(null, true); // callback là đại diện cho hàm upload file của multer nếu true thì cho phép upload file
      // ngược lại nếu false là sẽ k upload
    } else if (path.extname(file.originalname) == ".xls" || path.extname(file.originalname) == ".txt" || path.extname(file.originalname) == ".doc" || path.extname(file.originalname) == ".docx" || path.extname(file.originalname) == ".pdf") {
      callback(null, true);
    } else {
      callback(new Error("File không đúng định dạng document hoặc hình ảnh"), false); // sai định dạng file thì tạo một lỗi mới
      // hàm xử lý file sẽ bắt được lỗi này (xem phần add sản phẩm)
    }
  },
  limits: {
    fileSize: 10000000
  } // giới hạn file -- bé hơn 10mb

});

function handleAddNotificationForm(req, res, next) {
  var _req$body = req.body,
      title = _req$body.title,
      content = _req$body.content;
  var validResult = validationResult(req);

  if (validResult.errors.length) {
    req.flash("titleVal", title);
    req.flash("contentVal", content);
    var error = validResult.errors[0];
    req.flash("addnotificationErr", error.msg); // đồng thời xóa hết file trong thư mục tạm (nếu có)

    basehandle.deleteAllFileInTmp(req);
    return res.redirect("/notification/add");
  }

  next();
}

route.use("/add", function (req, res, next) {
  // kiểm tra file trước ở đây cho đỡ rối
  // do form gửi lên là dạng data-form
  // nên ta phải xủ lý file trước khi xử các thông tin khác
  var uploadResult = upload.array("notification-files", 3);
  uploadResult(req, res, function (err) {
    var _req$body2 = req.body,
        title = _req$body2.title,
        content = _req$body2.content;

    if (err) {
      req.flash("titleVal", title);
      req.flash("contentVal", content);
      var errormess = err.message;

      if (errormess == "Unexpected field") {
        errormess = "Tối đa 3 files được cho phép";
      }

      req.flash("addnotificationErr", errormess);
      return res.redirect("/notification/add");
    }

    next();
  });
});
route.post("/add", myValid.validNotificationForm, handleAddNotificationForm, function _callee2(req, res, next) {
  var files, _req$body3, title, content, department, rolecode, depart, departments, value, notification, result, pathToSaveArray, originFileNameArray, i, valuefile, notificationToSocket;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          files = req.files;
          _req$body3 = req.body, title = _req$body3.title, content = _req$body3.content, department = _req$body3.department;
          rolecode = req.user.rolecode; // kiểm tra xem department (ở dạng id) người dùng chọn có tồn tại không ?
          // nếu là người dùng AM thì kiểm tra trong toàn bộ departments

          if (!(rolecode === "AM")) {
            _context2.next = 9;
            break;
          }

          _context2.next = 6;
          return regeneratorRuntime.awrap(departmentsService.findDepartment({
            _id: department
          }));

        case 6:
          depart = _context2.sent;
          _context2.next = 10;
          break;

        case 9:
          // nếu là người dùng PK thì tìm trong phòng khoa mình phụ trách
          if (rolecode === "PK") {
            // nếu là người dùng PK thì tìm trong phòng khoa mình phụ trách
            departments = req.user.departresponsible;
            depart = departments.find(function (t) {
              return t._id == department;
            });
          }

        case 10:
          if (depart) {
            _context2.next = 14;
            break;
          }

          // nếu không tồn tại department mà người dugnf chọn thì báo lỗi và xóa hết file tạm
          req.flash("addnotificationErr", "Phòng khoa cho thông báo không tồn tại"); // đồng thời xóa hết file trong thư mục tạm (nếu có)

          basehandle.deleteAllFileInTmp(req);
          return _context2.abrupt("return", res.redirect("/notification/add"));

        case 14:
          // nếu đến đây thì không có lỗi
          // tiến hành lưu thông tin về title - content - department trước -- lưu thành công thì mới tiến hành lưu file
          // bởi vì lưu thành công ta mới có được id của thông báo để tạo thư mục chứa file dễ hơn
          value = {
            title: title,
            content: content,
            department: department
          };
          _context2.next = 17;
          return regeneratorRuntime.awrap(notificationService.add(value));

        case 17:
          notification = _context2.sent;

          // console.log(notification);
          // tiến hành di chuyển file vào thư mục của notifications/id bài viết nếu có
          if (req.files.length) {
            // gọi hàm thêm nhiều file
            result = basehandle.moveFiles(req, notification._id, "notifications");
            pathToSaveArray = result[0];
            originFileNameArray = result[1]; // thực hiện lưu vào csdl

            for (i = 0; i < pathToSaveArray.length; i++) {
              valuefile = {
                // chuẩn bị dữ liệu
                fileurl: pathToSaveArray[i],
                // đường dẫn tương đối
                originfilename: originFileNameArray[i] // tên để hiển thị

              }; // push vào notification đã tạo ở trên

              notification.files.push(valuefile);
            }
          } // lấy lại bài thông báo đó ra thì kết quả result chưa có chứa thông tin populate phòng khoa
          // nên ta sài find để lấy luôn thông tin phòng khoa


          _context2.next = 21;
          return regeneratorRuntime.awrap(notificationService.findNotification({
            _id: notification._id
          }));

        case 21:
          notificationToSocket = _context2.sent;
          // cuối cùng là save notification lại
          notification.save().then(function (result) {
            if (result) {
              req.flash("interactnotificationSucc", "Bạn vừa tạo một bài thông báo mới có id: " + result._id); //gửi thông báo mới đến tất cả người dùng đang active bằng dùng socketio trong một hàm bất đồng bộ
              //chhuanar bị dữ liệu

              var notificationToSend = {
                id: notificationToSocket._id,
                title: notificationToSocket.title,
                notificationdate: moment(notificationToSocket.notificationdate).format("L"),
                department: {
                  id: notification.department._id,
                  departname: notificationToSocket.department.departname,
                  departtype: notificationToSocket.department.departtype,
                  departcode: notificationToSocket.department.departcode
                }
              };
              sendNotificationToAllUser(req, notificationToSend); // console.log("no1")

              return res.redirect("/notification/manager");
            }
          })["catch"](function (err) {
            console.log(err);
            req.flash("addnotificationErr", "Có lỗi khi tạo bài thông báo, vui lòng thử lại");
            return res.redirect("/notification/add");
          });

        case 23:
        case "end":
          return _context2.stop();
      }
    }
  });
}); //khi có một thông báo mới được tạo thì dùng socket và gửi đến tất cả người dùng

function sendNotificationToAllUser(req, notificationToSend) {
  var io, alluser;
  return regeneratorRuntime.async(function sendNotificationToAllUser$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          //lấy ra socketio
          io = req.io; //lấy ra mảng id của tất cả người dùng

          alluser = req.alluser; //gửi thông báo cho tất cả người dùng đã đăng nhập (dựa vào mảng id)

          alluser.forEach(function (userid) {
            //gửi thông báo cho io nào ở client đang kết nối đến home và chờ sự kiện server-send-new-notification-${userid}
            io.of("/home").emit("server-send-new-notification-".concat(userid), notificationToSend);
          }); // console.log("no2")

        case 3:
        case "end":
          return _context3.stop();
      }
    }
  });
}
/* end: xử lý thêm thông báo */

/*Start: Hiển thị chi tiết một thông báo */


route.get("/details", function _callee3(req, res, next) {
  var id, notificationVal, notification;
  return regeneratorRuntime.async(function _callee3$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          // kiểm tra xem có id bài viết được gửi đến không
          id = req.query.id;

          if (id) {
            _context4.next = 3;
            break;
          }

          return _context4.abrupt("return", next(createError(404, "Không tìm thấy bài viết")));

        case 3:
          _context4.next = 5;
          return regeneratorRuntime.awrap(notificationService.findNotification({
            _id: id
          }));

        case 5:
          notificationVal = _context4.sent;

          if (notificationVal) {
            _context4.next = 8;
            break;
          }

          return _context4.abrupt("return", next(createError(404, "Không tìm thấy bài viết")));

        case 8:
          // console.log(notificationVal)
          //mapping giá trị lại
          notification = {
            id: notificationVal._id,
            title: notificationVal.title,
            content: notificationVal.content,
            notificationdate: moment(notificationVal.notificationdate).format("L"),
            department: {
              id: notificationVal.department._id,
              departname: notificationVal.department.departname
            },
            files: notificationVal.files.map(function (noti) {
              return {
                id: noti._id,
                fileurl: noti.fileurl,
                originfilename: noti.originfilename
              };
            })
          }; // console.log(notification);

          res.render("detailsnotification", {
            title: "Chi tiết thông báo",
            notification: notification
          });

        case 10:
        case "end":
          return _context4.stop();
      }
    }
  });
});
/*End: Hiển thị chi tiết một thông báo */

route.use("/edit", checkRoleInteractNotification, function (req, res, next) {
  res.locals.editnotificationErr = req.flash("editnotificationErr");
  res.locals.editnotificationSucc = req.flash("editnotificationSucc");
  next();
}); // hàm kiểm tra quyền đăng bài của tài khoản có được cho phép xóa, sửa bài thông báo hay không ?

function middlewareInteractNotification(req, res, next) {
  var id, notificationVal, account, department, departresponsible;
  return regeneratorRuntime.async(function middlewareInteractNotification$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          id = req.query.id; //lấy ra id bài thông báo

          if (id) {
            _context5.next = 3;
            break;
          }

          return _context5.abrupt("return", next(createError(404, "Không tìm thấy bài viết")));

        case 3:
          _context5.next = 5;
          return regeneratorRuntime.awrap(notificationService.findNotification({
            _id: id
          }));

        case 5:
          notificationVal = _context5.sent;

          if (notificationVal) {
            _context5.next = 8;
            break;
          }

          return _context5.abrupt("return", next(createError(404, "Không thể truy cập bài viết")));

        case 8:
          account = req.user; // lấy ra thông tin để kiểm tra quyền hạn của tài khoản có tương ứng với bài không (chỉ dành cho tk PK)

          if (!(account.rolecode === "PK")) {
            _context5.next = 14;
            break;
          }

          department = notificationVal.department; //lấy thông tin phòng khoa của bài

          departresponsible = account.departresponsible; // lấy quyền hạn đăng bài của user

          if (departresponsible.find(function (t) {
            return t._id.toString() == department._id.toString();
          })) {
            _context5.next = 14;
            break;
          }

          return _context5.abrupt("return", next(createError(404, "Không thể truy cập bài viết")));

        case 14:
          next();

        case 15:
        case "end":
          return _context5.stop();
      }
    }
  });
}
/*Start: Hiển thị trang chỉnh sửa một thông báo */


route.get("/edit", middlewareInteractNotification, function _callee4(req, res, next) {
  var id, account, departmentsVal, rolecode, notificationVal, departments, notification;
  return regeneratorRuntime.async(function _callee4$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          id = req.query.id; // lấy thông tin phòng khoa dựa vào quyền người dùng để hiện ra view và để chỉnh sửa

          account = req.user;
          rolecode = account.rolecode; // thực hiện tìm bài viết dựa vào id

          _context6.next = 5;
          return regeneratorRuntime.awrap(notificationService.findNotification({
            _id: id
          }));

        case 5:
          notificationVal = _context6.sent;

          if (!(rolecode === "AM")) {
            _context6.next = 12;
            break;
          }

          _context6.next = 9;
          return regeneratorRuntime.awrap(departmentsService.findDepartments({}));

        case 9:
          departmentsVal = _context6.sent;
          _context6.next = 13;
          break;

        case 12:
          if (rolecode === "PK") {
            departmentsVal = req.user.departresponsible;
          }

        case 13:
          // map lại dữ liệu
          departments = departmentsVal.map(function (depart) {
            return {
              id: depart._id,
              departname: depart.departname
            };
          }); //map lại dữ liệu bài thông báo

          notification = {
            id: notificationVal._id,
            title: notificationVal.title,
            content: notificationVal.content,
            notificationdate: moment(notificationVal.notificationdate).format("L"),
            department: {
              id: notificationVal.department._id,
              departname: notificationVal.department.departname
            },
            files: notificationVal.files.map(function (noti) {
              return {
                id: noti._id,
                fileurl: noti.fileurl,
                originfilename: noti.originfilename
              };
            })
          };
          res.render("editnotification", {
            title: "Chỉnh sửa thông báo",
            notification: notification,
            departments: departments
          });

        case 16:
        case "end":
          return _context6.stop();
      }
    }
  });
});
/*End: Hiển thị trang chỉnh sửa một thông báo */

/*Start: Xóa một file trong bài thông báo */

route.get("/deletefile", middlewareInteractNotification, function _callee5(req, res) {
  var _req$query, id, fileid, notificationVal, file, pathToDelete, indextoDelete;

  return regeneratorRuntime.async(function _callee5$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          _req$query = req.query, id = _req$query.id, fileid = _req$query.fileid; // id (của bài viết) đã được kiểm tra
          // kiểm tra id của file

          if (fileid) {
            _context7.next = 4;
            break;
          }

          req.flash("editnotificationErr", "File không tồn tại để xóa");
          return _context7.abrupt("return", res.redirect("/notification/edit?id=".concat(id)));

        case 4:
          _context7.next = 6;
          return regeneratorRuntime.awrap(notificationService.findNotification({
            _id: id
          }));

        case 6:
          notificationVal = _context7.sent;

          if (notificationVal.files.length) {
            _context7.next = 10;
            break;
          }

          req.flash("editnotificationErr", "File không tồn tại để xóa");
          return _context7.abrupt("return", res.redirect("/notification/edit?id=".concat(id)));

        case 10:
          // tìm file trong bài thông báo
          file = notificationVal.files.find(function (t) {
            return t._id.toString() == fileid.toString();
          }); // nếu không tìm thấy file thì báo lỗi

          if (file) {
            _context7.next = 14;
            break;
          }

          req.flash("editnotificationErr", "File không tồn tại để xóa");
          return _context7.abrupt("return", res.redirect("/notification/edit?id=".concat(id)));

        case 14:
          // nếu tìm thấy file thì trước tiên xóa trong thư mục trước
          // kiểm tra xem có tồn tại cái đường dẫn thư mục đến file hay không ?
          pathToDelete = "public" + file.fileurl; // console.log(pathToDelete)

          if (fs.existsSync(pathToDelete)) {
            // nếu có thì xóa
            fs.unlinkSync(pathToDelete);
          } // sau đó xóa file ra khỏi mảng của bài thông báo


          indextoDelete = notificationVal.files.findIndex(function (t) {
            return t._id.toString() == fileid.toString();
          });
          notificationVal.files.splice(indextoDelete, 1);
          notificationVal.save().then(function (result) {
            if (result) {
              req.flash("editnotificationSucc", "Xóa file thành công");
              return res.redirect("/notification/edit?id=".concat(id));
            }
          })["catch"](function (err) {
            req.flash("editnotificationErr", "Đã có lỗi xảy ra khi xóa file, vui lòng thử lại");
            return res.redirect("/notification/edit?id=".concat(id));
          });

        case 19:
        case "end":
          return _context7.stop();
      }
    }
  });
});
/*End: Xóa một file trong bài thông báo */

/*start: chỉnh sửa bài thông báo */

function handleEditNotificationForm(req, res, next) {
  var id = req.query.id;
  var validResult = validationResult(req);

  if (validResult.errors.length) {
    var error = validResult.errors[0];
    req.flash("editnotificationErr", error.msg); // đồng thời xóa hết file trong thư mục tạm (nếu có)

    basehandle.deleteAllFileInTmp(req);
    return res.redirect("/notification/edit?id=".concat(id));
  }

  next();
}

route.use("/edit", middlewareInteractNotification, function (req, res, next) {
  // kiểm tra file trước ở đây cho đỡ rối
  // do form gửi lên là dạng data-form
  // nên ta phải xủ lý file trước khi xử các thông tin khác
  var id = req.query.id;
  var uploadResult = upload.array("notification-files", 3);
  uploadResult(req, res, function (err) {
    if (err) {
      var errormess = err.message;

      if (errormess == "Unexpected field") {
        errormess = "Tối đa 3 files được cho phép";
      }

      req.flash("editnotificationErr", errormess);
      return res.redirect("/notification/edit?id=".concat(id));
    }

    next();
  });
});
route.post("/edit", myValid.validNotificationForm, handleEditNotificationForm, function _callee6(req, res, next) {
  var id, _req$body4, title, content, department, rolecode, depart, departments, notificationVal, lengthcurrentfiles, lengthnewfiles, result, pathToSaveArray, originFileNameArray, i, valuefile;

  return regeneratorRuntime.async(function _callee6$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          // trước khi vào được tới đây đã kiểm tra qua middleware hết rồi (kiểm tra id, sự tồn tại của bài viết, quyền người dùng tương tác)
          // cũng đã kiểm tra luôn tính hợp của form 
          // lấy id bài viết
          id = req.query.id;
          _req$body4 = req.body, title = _req$body4.title, content = _req$body4.content, department = _req$body4.department;
          rolecode = req.user.rolecode; // kiểm tra xem department (ở dạng id) người dùng chọn có tồn tại không ?
          // nếu là người dùng AM thì kiểm tra trong toàn bộ departments

          if (!(rolecode === "AM")) {
            _context8.next = 9;
            break;
          }

          _context8.next = 6;
          return regeneratorRuntime.awrap(departmentsService.findDepartment({
            _id: department
          }));

        case 6:
          depart = _context8.sent;
          _context8.next = 10;
          break;

        case 9:
          // nếu là người dùng PK thì tìm trong phòng khoa mình phụ trách
          if (rolecode === "PK") {
            // nếu là người dùng PK thì tìm trong phòng khoa mình phụ trách
            departments = req.user.departresponsible;
            depart = departments.find(function (t) {
              return t._id.toString() == department.toString();
            });
          }

        case 10:
          if (depart) {
            _context8.next = 14;
            break;
          }

          // nếu không tồn tại department mà người dugnf chọn thì báo lỗi và xóa hết file tạm
          req.flash("editnotificationErr", "Phòng khoa cho thông báo không tồn tại"); // đồng thời xóa hết file trong thư mục tạm (nếu có)

          basehandle.deleteAllFileInTmp(req);
          return _context8.abrupt("return", res.redirect("/notification/edit?id=".concat(id)));

        case 14:
          _context8.next = 16;
          return regeneratorRuntime.awrap(notificationService.findNotification({
            _id: id
          }));

        case 16:
          notificationVal = _context8.sent;

          if (!req.files.length) {
            _context8.next = 28;
            break;
          }

          // nếu số file của bài viết + số file up lên > 3 => xóa hết trong file tạm và báo lỗi
          lengthcurrentfiles = notificationVal.files.length; //số file hiện tại đang có

          lengthnewfiles = req.files.length; // số file dự định thêm vào

          if (!(lengthcurrentfiles + lengthnewfiles > 3)) {
            _context8.next = 24;
            break;
          }

          basehandle.deleteAllFileInTmp(req); //xóa file tạm nếu có lỗi xảy ra

          req.flash("editnotificationErr", "Không thể up thêm file, đã đạt số lượng tối đa");
          return _context8.abrupt("return", res.redirect("/notification/edit?id=".concat(id)));

        case 24:
          // nếu không có lỗi về số luognwj tối đa thì chuyển file vào thư mục
          // gọi hàm thêm nhiều file
          result = basehandle.moveFiles(req, id, "notifications"); // kết quả trả về từ hàm thêm nhiều file

          pathToSaveArray = result[0]; // mảng chứa các url để lưu vào csdl

          originFileNameArray = result[1]; // mảng hiển thị tên file (chưa quả chỉnh sửa) để lưu vào csdl
          // thực hiện lưu vào csdl

          for (i = 0; i < pathToSaveArray.length; i++) {
            valuefile = {
              // chuẩn bị dữ liệu
              fileurl: pathToSaveArray[i],
              // đường dẫn tương đối
              originfilename: originFileNameArray[i] // tên để hiển thị

            }; // push vào notification đã tạo ở trên

            notificationVal.files.push(valuefile);
          }

        case 28:
          // lưu các thông tin khác về content, title, phòng khoa
          notificationVal.content = content;
          notificationVal.title = title;
          notificationVal.department = department;
          notificationVal.save().then(function (result) {
            if (result) {
              req.flash("editnotificationSucc", "Chỉnh sửa file thành công");
              return res.redirect("/notification/edit?id=".concat(id));
            }
          })["catch"](function (err) {
            req.flash("editnotificationErr", "Chỉnh sửa file thất bại, vui lòng thử lại");
            return res.redirect("/notification/edit?id=".concat(id));
          });

        case 32:
        case "end":
          return _context8.stop();
      }
    }
  });
});
/*end: chỉnh sửa bài thông báo */

/*start: xóa một bài thông báo */
// trước khi xóa đã gọi middleware kiểm tra người dùng có quyền được xóa hay không

route.get("/delete", middlewareInteractNotification, function _callee7(req, res, next) {
  var id, result, notificationDirectory;
  return regeneratorRuntime.async(function _callee7$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          // lấy ra id của bài viết
          id = req.query.id; // thực hiện xóa trong csdl

          _context9.next = 3;
          return regeneratorRuntime.awrap(notificationService.deleteNotification({
            _id: id
          }));

        case 3:
          result = _context9.sent;

          if (!(result && result.ok === 1)) {
            _context9.next = 11;
            break;
          }

          // nếu kết quả xóa thành công
          // thì tiến hành xóa thư mục của bài thông báo này (dựa theo id)
          notificationDirectory = "public/notifications/".concat(id);

          if (fs.existsSync(notificationDirectory)) {
            // kiểm tra tồn tại của thư mục trước khi xóa
            // gọi câu lệnh để xóa thư mục và toàn bộ file trong thư mục
            fs.rmdirSync(notificationDirectory, {
              recursive: true
            });
          }

          req.flash("interactnotificationSucc", "Bạn vừa xóa bài thông báo có id: " + id);
          return _context9.abrupt("return", res.redirect("/notification/manager"));

        case 11:
          req.flash("editnotificationErr", "Xóa file thất bại, vui lòng thử, vui lòng thử lại");
          return _context9.abrupt("return", res.redirect("/notification/edit?id=".concat(id)));

        case 13:
        case "end":
          return _context9.stop();
      }
    }
  });
});
/*end: xóa một bài thông báo */

/*start: hiển thị trang quản lý thông báo (bao gồm chức năng tìm kiếm )*/
//đã gọi middleware kiểm tra quyền người dùng

route.use("/manager", checkRoleInteractNotification, function (req, res, next) {
  // nếu xóa hay thêm thông báo thành công thì sẽ có hiển thị thông báo này ở trang quản lý
  res.locals.interactnotificationSucc = req.flash("interactnotificationSucc");
  next();
});
route.get("/manager", function _callee8(req, res, next) {
  var _req$query2, field, department, searchvalue, page, filter, rolecode, departmentsVal, departments, tmp, numbernotifications, numberpage, skipval, limitval, sortval, notificationsVal, notifications;

  return regeneratorRuntime.async(function _callee8$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          // xác định các giá trị search (department, field, searchvalue)
          //department: giá trị là id của phòng khoa muốn tìm hoặc là all(nghĩa là tìm tất cả luôn)
          //field: trường dữ liệu muốn tìm -- nếu là rỗng thì không tìm
          //searchvalue: giá trị muốn tìm theo field -- nếu là rỗng thì không tìm
          //page
          _req$query2 = req.query, field = _req$query2.field, department = _req$query2.department, searchvalue = _req$query2.searchvalue, page = _req$query2.page;
          filter = {};

          if (field !== "id" && field !== "title") {
            // nếu filter kiểu dữ liệu không nằm trong 2 giá trị này => không tìm kiểu dữ liệu
            field = "none";
            searchvalue = ""; // không chọn trường dữ liệu thì search value không có nghĩa gì nữa
          } else {
            if (!searchvalue || searchvalue == "") {
              // nếu không có giá trị tìm kiếm thì việc chọn field cũng không còn ý nghĩa
              // cho nên ta cũng field = none
              field = "none";
            }
          } // nếu field != none (nghĩa là người dùng muốn tìm kiếm thông báo theo kiểu dữ liệu và có nhập dữ liệu) 
          //thì ta mới thêm vào filter


          if (field !== "none") {
            // lúc đưa vào ta cũng kiểm tra một chút để đưa lại dạng _id nếu field là id cho phù hợp khi tìm kiếm
            // nên dùng toán tử like
            filter["".concat(field == "id" ? "_id" : field)] = {
              $regex: searchvalue,
              $options: "i"
            };
          } // lấy danh sách phòng - khoa để hiển thị lên view (dựa vào quyền) để cho phần filter


          rolecode = req.user.rolecode; // nếu người dùng hiện tại là AM thì hiện toàn bộ phòng khoa

          if (!(rolecode === "AM")) {
            _context10.next = 11;
            break;
          }

          _context10.next = 8;
          return regeneratorRuntime.awrap(departmentsService.findDepartments({}));

        case 8:
          departmentsVal = _context10.sent;
          _context10.next = 12;
          break;

        case 11:
          if (rolecode === "PK") {
            //lấy danh sách phòng khoa thuộc quyền hạn nếu là PK
            departmentsVal = req.user.departresponsible;
          }

        case 12:
          // map lại dữ liệu
          departments = departmentsVal.map(function (depart) {
            return {
              id: depart._id,
              departname: depart.departname
            };
          }); // tìm giá trị department (id) mà người sử dụng chức năng tìm kiếm có trong mảng departments hay không

          if (departments.find(function (t) {
            return t.id.toString() === department;
          })) {
            //nếu có nghĩa là người dùng có chọn một phòng khoa theo quyền
            // để tìm kiếm thông báo
            filter["department"] = department; // lưu ý là khi ta filter find của mongoose thì lúc này dữ liệu chưa được populate
            // nên ta chỉ có thể tìm kiếm nó ở dạng id thông thường lúc chưa populate
            // hoặc có một giải pháp khác là filter trong hàm populate luôn (có thể xem thêm trong trang mongoose phần populate)
          } else {
            // ngược lại không có thì hiển thị toàn bộ thông báo (theo quyền hạn phòng khoa của người dùng)
            department = "all"; // set lại department = all

            if (rolecode === "AM") {// nếu là AM thì chỉ cần hiện toàn bộ thông báo là được
              // không cần thêm gì vào filter để có thể lấy toàn bộ thông báo
            } else {
              // ngược lại nếu là PK thì hiển thị toàn bộ thông báo nhưng dựa theo phòng khoa mà mình được phân quyền
              tmp = []; // mảng chứa id của phòng khoa mà người dùng đảm nhận

              departments.forEach(function (depart) {
                // chạy mảng departments để lấy giá trị id
                tmp.push(depart.id);
              });
              filter["department"] = {
                $in: tmp
              }; // tạo một giá trị $or mảng 
              //ví dụ (k liên quan đến bài) (db.inventory.find ( { quantity: { $in: [20, 50] } } ))
              // tìm ra quantity có 20 hoặc 50
              // áp dụng điều này để tìm thông báo theo mảng id tương ứng
            }
          } // lấy ra số lượng thông báo hiện có theo filter


          _context10.next = 16;
          return regeneratorRuntime.awrap(notificationService.countNotifications(filter));

        case 16:
          numbernotifications = _context10.sent;

          //nếu count không tồn tại (lỗi do input search value không đúng định dạng thì trả về undefined) ta gán = 0
          if (!numbernotifications) {
            numbernotifications = 0;
          } // tìm số page lớn nhất theo số bài thông báo
          // dùng hàm làm tròn đến cận lớn nhất (2.1 = 3 or 2.5 = 3 or 2.7 = 3)


          numberpage = Math.ceil(numbernotifications / 10); // chia 10 vì theo yêu cầu phân trang thì phân 10 bài mỗi trang
          // kiểm tra page

          if (page) {
            _context10.next = 23;
            break;
          }

          // nếu không có thì cứ gán = 1
          page = 1;
          _context10.next = 32;
          break;

        case 23:
          if (!isNaN(page)) {
            _context10.next = 25;
            break;
          }

          return _context10.abrupt("return", next(createError(404, "Không tìm thấy trang mong muốn")));

        case 25:
          if (!Number.isInteger(page)) {
            _context10.next = 27;
            break;
          }

          return _context10.abrupt("return", next(createError(404, "Không tìm thấy trang mong muốn")));

        case 27:
          if (!(page < 1)) {
            _context10.next = 29;
            break;
          }

          return _context10.abrupt("return", next(createError(404, "Không tìm thấy trang mong muốn")));

        case 29:
          // nếu page không có lỗi gì thì chuyển về dạng int
          page = parseInt(page); // nếu số page người dùng muốn tìm > số page có thể đạt được dựa vào số thông báo (đã tính ở trên)

          if (!(page > numberpage)) {
            _context10.next = 32;
            break;
          }

          return _context10.abrupt("return", next(createError(404, "Không tìm thấy trang mong muốn")));

        case 32:
          if (!(numbernotifications > 0)) {
            _context10.next = 42;
            break;
          }

          // tìm danh sách thông báo
          // chuẩn bị dữ liệu skip (page -1) * 10 là để bỏ 10 dữ liệu ở trước page này
          skipval = (page - 1) * 10;
          limitval = 10;
          sortval = {
            notificationdate: -1
          }; // sắp xeo theo thời gian thông báo mới nhất (giảm dần)
          // nếu số 1 là dương thì là tăng dần

          _context10.next = 38;
          return regeneratorRuntime.awrap(notificationService.findNotifications(filter, skipval, limitval, sortval));

        case 38:
          notificationsVal = _context10.sent;
          // console.log(notificationsVal)
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
          });
          _context10.next = 43;
          break;

        case 42:
          notifications = [];

        case 43:
          // console.log(notifications);
          // console.log(filter)
          res.render("managernotification", {
            title: "Quản lý thông báo",
            notifications: notifications,
            departments: departments,
            department: department,
            field: field,
            searchvalue: searchvalue,
            page: page,
            numberpage: numberpage
          });

        case 44:
        case "end":
          return _context10.stop();
      }
    }
  });
});
/*end: hiển thị trang quản lý thông báo (bao gồm chức năng tìm kiếm ) */

/*start: hiển thị tất cả thông báo cho người dùng */

route.get("/", function _callee9(req, res, next) {
  var _req$query3, department, page, filter, numbernotifications, numberpage, skipval, limitval, sortval, notificationsVal, notifications, departmentsVal, departments;

  return regeneratorRuntime.async(function _callee9$(_context11) {
    while (1) {
      switch (_context11.prev = _context11.next) {
        case 0:
          _req$query3 = req.query, department = _req$query3.department, page = _req$query3.page; //nếu không có giá trị department hay department = "all" thì nghĩa là người dùng đang muốn xem thông báo
          // mà không quan tâm đến phong ban nào

          if (!department || department == "all") {
            department = "all";
          }

          filter = {}; //nếu người dùng tìm các thông báo theo phòng ban nào đó -- thì gán giá trị vào cho filter

          if (department != "all") {
            filter["department"] = department;
          } // lấy ra số lượng thông báo hiện có theo filter


          _context11.next = 6;
          return regeneratorRuntime.awrap(notificationService.countNotifications(filter));

        case 6:
          numbernotifications = _context11.sent;

          //nếu count không tồn tại (lỗi do input search value không đúng định dạng thì trả về undefined) ta gán = 0
          if (!numbernotifications) {
            numbernotifications = 0;
          } // tìm số page lớn nhất theo số bài thông báo
          // dùng hàm làm tròn đến cận lớn nhất (2.1 = 3 or 2.5 = 3 or 2.7 = 3)


          numberpage = Math.ceil(numbernotifications / 10); // chia 10 vì theo yêu cầu phân trang thì phân 10 bài mỗi trang
          // kiểm tra page

          if (page) {
            _context11.next = 13;
            break;
          }

          // nếu không có thì cứ gán = 1
          page = 1;
          _context11.next = 22;
          break;

        case 13:
          if (!isNaN(page)) {
            _context11.next = 15;
            break;
          }

          return _context11.abrupt("return", next(createError(404, "Không tìm thấy trang mong muốn")));

        case 15:
          if (!Number.isInteger(page)) {
            _context11.next = 17;
            break;
          }

          return _context11.abrupt("return", next(createError(404, "Không tìm thấy trang mong muốn")));

        case 17:
          if (!(page < 1)) {
            _context11.next = 19;
            break;
          }

          return _context11.abrupt("return", next(createError(404, "Không tìm thấy trang mong muốn")));

        case 19:
          // nếu page không có lỗi gì thì chuyển về dạng int
          page = parseInt(page); // nếu số page người dùng muốn tìm > số page có thể đạt được dựa vào số thông báo (đã tính ở trên)

          if (!(page > numberpage)) {
            _context11.next = 22;
            break;
          }

          return _context11.abrupt("return", next(createError(404, "Không tìm thấy trang mong muốn")));

        case 22:
          if (!(numbernotifications > 0)) {
            _context11.next = 32;
            break;
          }

          // tìm danh sách thông báo
          // chuẩn bị dữ liệu skip (page -1) * 10 là để bỏ 10 dữ liệu ở trước page này
          skipval = (page - 1) * 10;
          limitval = 10;
          sortval = {
            notificationdate: -1
          }; // sắp xeo theo thời gian thông báo mới nhất (giảm dần)
          // nếu số 1 là dương thì là tăng dần

          _context11.next = 28;
          return regeneratorRuntime.awrap(notificationService.findNotifications(filter, skipval, limitval, sortval));

        case 28:
          notificationsVal = _context11.sent;
          // console.log(notificationsVal)
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
          });
          _context11.next = 33;
          break;

        case 32:
          notifications = [];

        case 33:
          _context11.next = 35;
          return regeneratorRuntime.awrap(departmentsService.findDepartments({}));

        case 35:
          departmentsVal = _context11.sent;
          //mapping dữ liệu lại
          // map lại dữ liệu
          departments = departmentsVal.map(function (depart) {
            return {
              id: depart._id,
              departname: depart.departname
            };
          });
          res.render("notifications", {
            title: "Thông báo",
            departments: departments,
            department: department,
            notifications: notifications,
            page: page,
            numberpage: numberpage
          });

        case 38:
        case "end":
          return _context11.stop();
      }
    }
  });
});
/*end: hiển thị tất cả thông báo cho người dùng */

module.exports = route;