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


var moment = require("moment"); // origin: notify


function checkRoleAddNotify(req, res, next) {
  // kiểm tra quyền chức năng thêm thông báo
  var rolecode = req.user.rolecode;

  if (rolecode !== "PK" && rolecode !== "AM") {
    return next(createError(404, "Không tìm thấy trang"));
  }

  next();
}

function checkRoleInteractNotify(req, res, next) {
  // kiểm tra quyền khi thực hiện chức năng xóa sửa thông báo
  var id = req.query.id; // id của bài thông báo

  var rolecode = req.user.rolecode;

  if (rolecode !== "PK" && rolecode !== "AM") {
    return next(createError(404, "Không tìm thấy trang"));
  } // kiểm tra quyền đăng bài mới có thể vào trang sửa bài tương ứng hay mới có thể xóa bài


  if (rolecode !== "AM") {} // nếu là PK thì mới kiểm tra quyền đăng bài
  // thực hiện kiểm tra quyền đăng bài
  // dựa vào id của bài thông báo lấy thông tin từ csdl
  // lấy thông tin phòng khoa của bài thông báo (lấy ra id)
  // kiểm tra id của phòng khoa được lấy ra từ bài báo xem có ở trong quyền phụ trách đăng bài không ?
  //nếu không có thì báo lỗi
  // nếu có thì tiếp tục công việc tiếp theo


  next();
}

function checkRoleChangeInformation(req, res, next) {
  // kiểm tra quyền chức năng cập nhật thông tin cá nhân
  var rolecode = req.user.rolecode;

  if (rolecode !== "SV" && rolecode !== "AM") {
    return next(createError(404, "Không tìm thấy trang"));
  }

  next();
}
/*start: hiển thị view thêm thông báo */


route.use("/add", checkRoleAddNotify, function (req, res, next) {
  res.locals.addnotifyErr = req.flash("addnotifyErr");
  res.locals.addnotifySucc = req.flash("addnotifySucc");
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

/* start: xử lý thêm thông báo */

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
    if (file.mimetype.startsWith("image/")) {
      // kiểm tra xem có phải file ảnh không ?
      // phải thì cho phép upload
      callback(null, true); // callback là đại diện cho hàm upload file của multer nếu true thì cho phép upload file
      // ngược lại nếu false là sẽ k upload
    } else if (path.extname(file.originalname) == "xls" || path.extname(file.originalname) == "txt" || path.extname(file.originalname) == "doc" || path.extname(file.originalname) == "docx" || path.extname(file.originalname) == "pdf") {
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

function handleAddNotifyForm(req, res, next) {
  var _req$body = req.body,
      title = _req$body.title,
      content = _req$body.content;
  req.flash("titleVal", title);
  req.flash("contentVal", content);
  var validResult = validationResult(req);

  if (validResult.errors.length) {
    var error = validResult.errors[0];
    req.flash("addnotifyErr", error.msg); // đồng thời xóa hết file trong thư mục tạm (nếu có)

    basehandle.deleteAllFileInTmp(req);
    return res.redirect("/notify/add");
  }

  next();
}

route.use("/add", function (req, res, next) {
  // kiểm tra file trước ở đây cho đỡ rối
  // do form gửi lên là dạng data-form
  // nên ta phải xủ lý file trước khi xử các thông tin khác
  var uploadResult = upload.array("notify-files", 3);
  uploadResult(req, res, function (err) {
    var _req$body2 = req.body,
        title = _req$body2.title,
        content = _req$body2.content;
    req.flash("titleVal", title);
    req.flash("contentVal", content);

    if (err) {
      var errormess = err.message;

      if (errormess == "Unexpected field") {
        errormess = "Tối đa 3 files được cho phép";
      }

      req.flash("addnotifyErr", errormess);
      return res.redirect("/notify/add");
    }

    next();
  });
});
route.post("/add", myValid.validAddNotify, handleAddNotifyForm, function _callee2(req, res, next) {
  var files, _req$body3, title, content, department, rolecode, depart, departments, value, notify, result, pathToSaveArray, originFileNameArray, i, valuefile;

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
          req.flash("addnotifyErr", "Phòng khoa cho thông báo không tồn tại"); // đồng thời xóa hết file trong thư mục tạm (nếu có)

          basehandle.deleteAllFileInTmp(req);
          return _context2.abrupt("return", res.redirect("/notify/add"));

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
          notify = _context2.sent;
          console.log(notify); // tiến hành di chuyển file vào thư mục của notifications/id bài viết nếu có

          if (req.files.length) {
            // gọi hàm thêm nhiều file
            result = basehandle.moveFiles(req, notify._id, "notifications");
            pathToSaveArray = result[0];
            originFileNameArray = result[1]; // thực hiện lưu vào csdl

            for (i = 0; i < pathToSaveArray.length; i++) {
              valuefile = {
                // chuẩn bị dữ liệu
                fileurl: pathToSaveArray[i],
                // đường dẫn tương đối
                originfilename: originFileNameArray[i] // tên để hiển thị

              }; // push vào notify đã tạo ở trên

              notify.files.push(valuefile);
            }
          } // cuối cùng là save notify lại


          notify.save().then(function (result) {
            if (result) {
              req.flash("addnotifySucc", "Tạo bài thông báo thành công");
              return res.redirect("/notify/add");
            }
          })["catch"](function (err) {
            console.log(err);
            req.flash("addnotifyErr", "Có lỗi khi tạo bài thông báo, vui lòng thử lại");
            return res.redirect("/notify/add");
          });

        case 21:
        case "end":
          return _context2.stop();
      }
    }
  });
});
/* end: xử lý thêm thông báo */

/*Start: Hiển thị chi tiết một thông báo */

route.get("/details", function _callee3(req, res, next) {
  var id, notify;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          // kiểm tra xem có id bài viết được gửi đến không
          id = req.query.id;

          if (id) {
            _context3.next = 3;
            break;
          }

          return _context3.abrupt("return", next(createError(404, "Không tìm thấy bài viết")));

        case 3:
          _context3.next = 5;
          return regeneratorRuntime.awrap(notificationService.findNotify({
            _id: id
          }));

        case 5:
          notify = _context3.sent;

          if (notify) {
            _context3.next = 8;
            break;
          }

          return _context3.abrupt("return", next(createError(404, "Không tìm thấy bài viết")));

        case 8:
          console.log(notify);
          res.render("detailsnotification", {
            title: "Chi tiết thông báo",
            notify: notify
          });

        case 10:
        case "end":
          return _context3.stop();
      }
    }
  });
});
/*End: Hiển thị chi tiết một thông báo */

module.exports = route;