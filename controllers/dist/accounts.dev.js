"use strict";

var accountsService = require("../services/accounts.js");

var departmentsService = require("../services/departments.js");

var hashpass = require("password-hash"); //module liên quan đến mật khẩu băm (tạo, verify,...)


var add = function add(account) {
  var accountResult;
  return regeneratorRuntime.async(function add$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(accountsService.add(account));

        case 2:
          accountResult = _context.sent;
          return _context.abrupt("return", accountResult);

        case 4:
        case "end":
          return _context.stop();
      }
    }
  });
};

var findOne = function findOne(filter) {
  var accountResult;
  return regeneratorRuntime.async(function findOne$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return regeneratorRuntime.awrap(accountsService.findOne(filter));

        case 2:
          accountResult = _context2.sent;
          return _context2.abrupt("return", accountResult);

        case 4:
        case "end":
          return _context2.stop();
      }
    }
  });
};

var addAdmin = function addAdmin() {
  var oldAccount, accountResult;
  return regeneratorRuntime.async(function addAdmin$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.next = 2;
          return regeneratorRuntime.awrap(accountsService.findOne({
            username: "admin"
          }));

        case 2:
          oldAccount = _context3.sent;

          if (!oldAccount) {
            _context3.next = 5;
            break;
          }

          return _context3.abrupt("return");

        case 5:
          account = {
            username: "admin",
            password: hashpass.generate("123456"),
            //tạo ra password dạng mã băm
            rolecode: "AM",
            email: "tothanhtin123@gmail.com"
          };
          _context3.next = 8;
          return regeneratorRuntime.awrap(accountsService.add(account));

        case 8:
          accountResult = _context3.sent;

          if (accountResult) {
            console.log(accountResult);
          } else {
            console.log("Tài khoản admin đã tồn tại");
          }

        case 10:
        case "end":
          return _context3.stop();
      }
    }
  });
}; // đã thay thế bằng passport
// var toLogin = async function(req,res){ // tiến hành đăng nhập -- tới được đây thì thông tin tài khoản đã hợp lệ
//     //lấy thông tin tài khoản
//     var username = req.body.username;
//     var password = req.body.password;
//     // tìm tài khoản trong csdl 
//     var account=await findOne({username:username});// tìm kiếm username theo giá trị username từ form
//         //{username:"admin"}
//     if(!account){ // không tìm thấy => không tồn tại => trả về false
//         req.flash("loginErr","Tài khoản hoặc mật khẩu không đúng"); // thiết lập flash với lỗi
//         return res.redirect("/login");
//     }
//     var checkPassword = hashpass.verify(password,account.password); // kiểm tra hash password
//     // console.log(account.password)
//     if(!checkPassword){ // nếu password từ input != password hash => sai mật khẩu => trả về false
//         req.flash("loginErr","Tài khoản hoặc mật khẩu không đúng"); // thiết lập flash với lỗi
//         return res.redirect("/login");
//     }
//     //nếu k có lỗi
//     req.session.account = account; // lưu thông tin tài khoản vào session
//     console.log(account);
//     //điều hướng đến home
//     return res.redirect("/home");
// }


function getDepartments() {
  var filterDepartments, departments;
  return regeneratorRuntime.async(function getDepartments$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          filterDepartments = {};
          _context4.next = 3;
          return regeneratorRuntime.awrap(departmentsService.findDepartments(filterDepartments));

        case 3:
          departments = _context4.sent;
          return _context4.abrupt("return", departments);

        case 5:
        case "end":
          return _context4.stop();
      }
    }
  });
} //đã gọi trực tiếp ở route
// var getRegister = async function(req,res){ // trả về trang đăng kí
//     var departmentsval = await getDepartments();
//     var departments = departmentsval.map(function(department){
//         return {
//             id: department._id,
//             departname: department.departname
//         }
//     })
//     res.render("register",{departments:departments});
// }


function checkRegisterInformation(req, res) {
  var _req$body, username, password, passwordconfirm, email, department, departmentVal, account;

  return regeneratorRuntime.async(function checkRegisterInformation$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          // kiểm tra form đăng ký lần 2
          _req$body = req.body, username = _req$body.username, password = _req$body.password, passwordconfirm = _req$body.passwordconfirm, email = _req$body.email, department = _req$body.department; // if(password != passwordconfirm){
          //     req.flash("registerErr","Mật khẩu và mật khẩu xác nhận không khớp");
          //     return res.redirect("/register");
          // }

          _context5.next = 3;
          return regeneratorRuntime.awrap(departmentsService.findDepartment({
            _id: department
          }));

        case 3:
          departmentVal = _context5.sent;

          if (departmentVal) {
            _context5.next = 7;
            break;
          }

          req.flash("registerErr", "Phòng - khoa bạn chọn không tồn tại");
          return _context5.abrupt("return", res.redirect("/register"));

        case 7:
          _context5.next = 9;
          return regeneratorRuntime.awrap(findOne({
            username: username
          }));

        case 9:
          account = _context5.sent;

          if (!account) {
            _context5.next = 13;
            break;
          }

          req.flash("registerErr", "Tài khoản đã tồn tại");
          return _context5.abrupt("return", res.redirect("/register"));

        case 13:
          _context5.next = 15;
          return regeneratorRuntime.awrap(findOne({
            email: email
          }));

        case 15:
          account = _context5.sent;

          if (!account) {
            _context5.next = 19;
            break;
          }

          //nếu có thì trùng email
          req.flash("registerErr", "Email đã tồn tại");
          return _context5.abrupt("return", res.redirect("/register"));

        case 19:
          startRegister(req, res);

        case 20:
        case "end":
          return _context5.stop();
      }
    }
  });
}

function startRegister(req, res) {
  var _req$body2, username, password, email, department, filter, account;

  return regeneratorRuntime.async(function startRegister$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          // bắt đầu đăng ký
          _req$body2 = req.body, username = _req$body2.username, password = _req$body2.password, email = _req$body2.email, department = _req$body2.department;
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
          _context6.next = 4;
          return regeneratorRuntime.awrap(add(filter));

        case 4:
          account = _context6.sent;

          if (account) {
            _context6.next = 8;
            break;
          }

          req.flash("registerErr", "Đăng ký thất bại, vui lòng thử lại");
          return _context6.abrupt("return", res.redirect("/register"));

        case 8:
          console.log(account);
          res.send(account.username);

        case 10:
        case "end":
          return _context6.stop();
      }
    }
  });
}

var toRegister = function toRegister(req, res) {
  checkRegisterInformation(req, res); // kiểm tra thông tin lần 2 (những thông tin chỉ có trong csdl) và gọi hàm đăng ký
};

module.exports = {
  add: add,
  addAdmin: addAdmin,
  findOne: findOne,
  // toLogin,
  // getRegister,
  toRegister: toRegister
};