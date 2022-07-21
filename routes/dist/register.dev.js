"use strict";

var express = require("express");

var route = express.Router();

var registerMiddleware = require("../middlewares/register.js"); // const accountCtr = require("../controllers/accounts.js");


var myValid = require("../validations/my-validation.js");

var validationResult = myValid.validationResult;

var accountsService = require("../services/accounts.js");

var departmentsService = require("../services/departments.js");

var hashpass = require("password-hash"); //module liên quan đến mật khẩu băm (tạo, verify,...)
// origin: /register

/*Start: middleware chung trước khi vào trang đăng ký */


route.use(registerMiddleware.checkAdmin, function (req, res, next) {
  res.locals.registerErr = req.flash("registerErr");
  res.locals.usernameVal = req.flash("usernameVal");
  res.locals.emailVal = req.flash("emailVal");
  next();
});
/*end: middleware chung trước khi vào trang đăng ký */

/*Start: trả về form đăng ký */

route.get("/", function _callee(req, res) {
  var departmentsval, departments;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(departmentsService.findDepartments({}));

        case 2:
          departmentsval = _context.sent;
          departments = departmentsval.map(function (department) {
            return {
              id: department._id,
              departname: department.departname
            };
          });
          res.render("register", {
            departments: departments
          });

        case 5:
        case "end":
          return _context.stop();
      }
    }
  });
});
/*End: trả về form đăng ký */

/*Start: thực hiện chức năng đăng ký*/
// kiểm tra tính hợp lệ của form

function registerFormHandle(req, res, next) {
  var validResult = validationResult(req);
  var _req$body = req.body,
      username = _req$body.username,
      email = _req$body.email; // lấy ra 2 thông tin để hiển thị lại người dùng nhập lỗi

  req.flash("usernameVal", username);
  req.flash("emailVal", email);

  if (validResult.errors.length) {
    // nếu có lỗi

    /* mỗi lỗi bao gồm {
                        value: giá trị bị lỗi
                        msg: tin nhắn lỗi được định nghĩa ở validUserForm
                        param: key bị lỗi
                        location: nếu dùng form thì giá trị ở đây là body */
    var error = validResult.errors[0]; // console.log(error.msg)

    req.flash("registerErr", error.msg);
    return res.redirect("/register");
  }

  next();
} // kiểm tra thông tin tài khoản muốn đăng ký (thông tin phòng khoa, sự tồn tại ?)


function checkRegisterInformation(req, res, next) {
  var _req$body2, username, email, department, departmentVal, account;

  return regeneratorRuntime.async(function checkRegisterInformation$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          // kiểm tra form đăng ký lần 2
          // var {username, password, passwordconfirm,email, department} = req.body;
          _req$body2 = req.body, username = _req$body2.username, email = _req$body2.email, department = _req$body2.department; // if(password != passwordconfirm){
          //     req.flash("registerErr","Mật khẩu và mật khẩu xác nhận không khớp");
          //     return res.redirect("/register");
          // }
          //lấy ra phòng khoa

          _context2.next = 3;
          return regeneratorRuntime.awrap(departmentsService.findDepartment({
            _id: department
          }));

        case 3:
          departmentVal = _context2.sent;

          if (departmentVal) {
            _context2.next = 7;
            break;
          }

          req.flash("registerErr", "Phòng - khoa bạn chọn không tồn tại");
          return _context2.abrupt("return", res.redirect("/register"));

        case 7:
          _context2.next = 9;
          return regeneratorRuntime.awrap(accountsService.findOne({
            username: username
          }));

        case 9:
          account = _context2.sent;

          if (!account) {
            _context2.next = 13;
            break;
          }

          req.flash("registerErr", "Tài khoản đã tồn tại");
          return _context2.abrupt("return", res.redirect("/register"));

        case 13:
          _context2.next = 15;
          return regeneratorRuntime.awrap(accountsService.findOne({
            email: email
          }));

        case 15:
          account = _context2.sent;

          if (!account) {
            _context2.next = 19;
            break;
          }

          //nếu có thì trùng email
          req.flash("registerErr", "Email đã tồn tại");
          return _context2.abrupt("return", res.redirect("/register"));

        case 19:
          next();

        case 20:
        case "end":
          return _context2.stop();
      }
    }
  });
} // thực hiện đăng ký


function startRegister(req, res) {
  var _req$body3, username, email, department, password, filter, account;

  return regeneratorRuntime.async(function startRegister$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          // bắt đầu đăng ký
          // var {username, password, email, department} = req.body;
          _req$body3 = req.body, username = _req$body3.username, email = _req$body3.email, department = _req$body3.department; // tạo mật khẩu mặc định

          password = "tdt123456tdt";
          filter = {
            username: username,
            password: hashpass.generate(password),
            rolecode: "PK",
            email: email,
            information: {
              showname: username,
              department: department
            },
            departresponsible: [// thêm thông tin phụ trách phòng khoa (mặc định là phòng - khoa được chọn khi đăng ký)
            department]
          };
          _context3.next = 5;
          return regeneratorRuntime.awrap(accountsService.add(filter));

        case 5:
          account = _context3.sent;

          if (account) {
            _context3.next = 9;
            break;
          }

          req.flash("registerErr", "Đăng ký thất bại, vui lòng thử lại");
          return _context3.abrupt("return", res.redirect("/register"));

        case 9:
          return _context3.abrupt("return", res.redirect("/account/setting?id=".concat(account._id)));

        case 10:
        case "end":
          return _context3.stop();
      }
    }
  });
}

route.post("/", myValid.validRegisterForm, registerFormHandle, checkRegisterInformation, function (req, res) {
  startRegister(req, res);
});
/*End: thực hiện chức năng đăng ký*/

module.exports = route;