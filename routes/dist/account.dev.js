"use strict";

// dành cho chức năng cập nhật thông tin cá nhân (Sinh viên), phân quyền đăng thông báo (AM), đổi mật khẩu (AM,PK)
var accountsService = require("../services/accounts.js");

var departmentsService = require("../services/departments.js");

var myValid = require("../validations/my-validation.js");

var validationResult = myValid.validationResult;

var route = require("express").Router();

var multer = require("multer");

var createError = require('http-errors');

var hashpass = require("password-hash"); //module liên quan đến mật khẩu băm (tạo, verify,...)


var fs = require("fs");

var _require = require("../models/accounts.js"),
    create = _require.create; // origin: /account


function checkRoleSettingAccount(req, res, next) {
  // kiểm tra quyền chức năng thiết lập quyền hạn đăng bài
  var rolecode = req.user.rolecode;

  if (rolecode !== "AM") {
    return next(createError(404, "Không tìm thấy trang"));
  }

  next();
}

function checkRoleChangePassword(req, res, next) {
  // kiểm tra quyền chức năng đổi mật khẩu
  var rolecode = req.user.rolecode;

  if (rolecode !== "PK" && rolecode !== "AM") {
    return next(createError(404, "Không tìm thấy trang"));
  }

  next();
}

function checkRoleChangeInformation(req, res, next) {
  // kiểm tra quyền chức năng cập nhật thông tin cá nhân
  var rolecode = req.user.rolecode;

  if (rolecode !== "SV" && rolecode !== "AM") {
    return next(createError(404, "Không tìm thấy trang"));
  }

  next();
} // phân quyền đăng thông báo

/*start: hiển thị view thiết lập quyền đăng thông báo */


route.use("/setting", checkRoleSettingAccount, function (req, res, next) {
  res.locals.settingaccountErr = req.flash("settingaccountErr");
  res.locals.settingaccountSucc = req.flash("settingaccountSucc");
  next();
});
route.get("/setting", function _callee(req, res, next) {
  var id, account, currentDepartment, departmentVal, departments, accountedit;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // lấy thông tin tài khoản dựa vào id (query)
          id = req.query.id; // nếu không có thông tin id thì báo lỗi

          if (id) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return", next(createError(404, "Không tìm thấy người dùng")));

        case 3:
          _context.next = 5;
          return regeneratorRuntime.awrap(accountsService.findOne({
            _id: id
          }));

        case 5:
          account = _context.sent;

          if (account) {
            _context.next = 8;
            break;
          }

          return _context.abrupt("return", next(createError(404, "Không tìm thấy người dùng")));

        case 8:
          // lấy ra danh sách phòng khoa mà tài khoản hiên tại đang phụ trách (lấy ra id) 
          currentDepartment = account.departresponsible.map(function (depart) {
            // mapping lấy ra id của phòng khoa mà hiện tại 
            // tài khoản đang phụ trách
            return {
              id: depart.id
            };
          }); // lấy ra danh sách tất cả phòng khoa

          _context.next = 11;
          return regeneratorRuntime.awrap(departmentsService.findDepartments({}));

        case 11:
          departmentVal = _context.sent;
          departments = departmentVal.map(function (department) {
            return {
              id: department._id,
              departname: department.departname
            };
          });
          accountedit = {
            // lấy thông tin tài khoản người dùng muốn sửa để hiện ra view
            id: account._id,
            // id tài khoản
            rolecode: account.rolecode,
            username: account.username,
            // tên username
            departname: getDepartname(account) // tên phòng khoa được gán lúc tạo

          }; // trả ra view 3 thông tin - id tài khoản muốn sửa - mảng id của phòng khoa đang phụ trách hiện tại - mảng tất cả các phòng khoa

          res.render("accountsetting", {
            title: "Thiết lập tài khoản",
            departments: departments,
            currentDepartment: currentDepartment,
            accountedit: accountedit
          });

        case 15:
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
/*end: hiển thị view thiết lập quyền đăng thông báo */

/*start: xử lý form thiết lập quyền đăng bài */


route.post("/setting", function _callee2(req, res, next) {
  var id, departments, account, departmentVal, checkResult;
  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          // lấy thông tin tài khoản dựa vào id (query)
          id = req.query.id; // lấy ra mảng id của các phòng khoa được chọn cập nhật mới (vì là checkbox => mảng)

          departments = req.body.department; // nếu không có thông tin id thì báo lỗi

          if (id) {
            _context2.next = 4;
            break;
          }

          return _context2.abrupt("return", next(createError(404, "Không tìm thấy người dùng")));

        case 4:
          _context2.next = 6;
          return regeneratorRuntime.awrap(accountsService.findOne({
            _id: id
          }));

        case 6:
          account = _context2.sent;

          if (account) {
            _context2.next = 9;
            break;
          }

          return _context2.abrupt("return", next(createError(404, "Không tìm thấy người dùng")));

        case 9:
          if (!(departments && account.rolecode !== "PK")) {
            _context2.next = 12;
            break;
          }

          req.flash("settingaccountErr", "Tài khoản này không đượcp phép phân quyền đăng bài");
          return _context2.abrupt("return", res.redirect("/account/setting?id=".concat(id)));

        case 12:
          _context2.next = 14;
          return regeneratorRuntime.awrap(departmentsService.findDepartments({}));

        case 14:
          departmentVal = _context2.sent;
          // kiểm tra xem giá trị các phòng khoa được chọn có tồn tại trong csdl không ?
          checkResult = true;

          if (departments) {
            // có thể người dùng bỏ chọn tất cả nên sẽ không xảy ra forEach => xét điều kiện
            departments.forEach(function (departid) {
              if (!departmentVal.find(function (t) {
                return t._id.toString() == departid;
              })) {
                // nếu không tồn tại thì gán false để báo lỗi
                checkResult = false;
              }
            });
          }

          if (!(checkResult == false)) {
            _context2.next = 20;
            break;
          }

          // nếu có lỗi quay về trang phân quyền để báo lỗi
          req.flash("settingaccountErr", "Giá trị phòng khoa không hợp lệ");
          return _context2.abrupt("return", res.redirect("/account/setting?id=".concat(id)));

        case 20:
          // nếu không có lỗi thì tiến hành cập nhật lại
          // cách gọn nhất là lấy luôn cái account ở trên sau đó dán giá trị cho departresponsible
          // mặc dù là mảng departresponsible nhận các giá trị thuộc objectID nhưng khi ta thêm chuỗi vào nó cũng
          // tự đổi
          account.departresponsible = departments; // console.log(account);

          account.save().then(function (result) {
            if (result) {
              // console.log(result)
              req.flash("settingaccountSucc", "Thiết lập tài khoản thành công");
              return res.redirect("/account/setting?id=".concat(id));
            }
          })["catch"](function (err) {
            console.log(err);
            req.flash("settingaccountErr", "Thiết lập tài khoản thất bại, vui lòng thử lại");
            return res.redirect("/account/setting?id=".concat(id));
          });

        case 22:
        case "end":
          return _context2.stop();
      }
    }
  });
});
/*end: xử lý form thiết lập quyền đăng bài */
// cập nhật thông tin cá nhân

route.use("/information", function (req, res, next) {
  res.locals.informationErr = req.flash("informationErr");
  res.locals.informationSucc = req.flash("informationSucc");
  next();
});
/*start: hiển thị view thông tin cá nhân */

route.get("/information", function _callee3(req, res, next) {
  var id, rolecode, myid, account, filter, departmentsVal, departments, accountToChange;
  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          id = req.query.id;
          rolecode = req.user.rolecode; // quyền tài khoản

          myid = req.user._id; // id tài khoản hiện tại của bản thân
          //người dùng có thể thông qua id của người khác để xem thông tin cá nhân => không cho phép
          // chỉ có AM được quyền làm như thế
          // người dùng khác (SV) chỉ có thể xem thông tin của chính bản thân mình

          if (id) {
            _context3.next = 5;
            break;
          }

          return _context3.abrupt("return", next(createError(404, "Không tìm thấy người dùng")));

        case 5:
          if (!(rolecode === "SV" || rolecode === "PK")) {
            _context3.next = 9;
            break;
          }

          if (!(myid != id)) {
            _context3.next = 9;
            break;
          }

          // nếu phải => id trong session và query khác nhau => dán lại bằng id của bản thân
          // khi so sánh không nền dùng !== vì kiểu dữ liệu khác nhau chỉ nên dùng != để so sánh giá trị
          id = myid; // sau đó redirect đến trang thông tin cá nhân đúng với mình

          return _context3.abrupt("return", res.redirect("/account/information?id=".concat(id)));

        case 9:
          _context3.next = 11;
          return regeneratorRuntime.awrap(accountsService.findOne({
            _id: id
          }));

        case 11:
          account = _context3.sent;

          if (account) {
            _context3.next = 14;
            break;
          }

          return _context3.abrupt("return", next(createError(404, "Không tìm thấy người dùng")));

        case 14:
          // // nếu người dùng thuộc quyên PK thì không cho phép sửa thông tin cá nhân
          // if(account.rolecode==="PK"){
          //     return next(createError(404,"Không tìm thấy thông tin cá nhân của người dùng"))
          // }
          // lấy ra danh sách khoa để hiển thị ra view nếu là người dùng SV -- còn nếu không phải thì lấy tất
          filter = {};

          if (rolecode === "SV") {
            filter = {
              departtype: "K"
            };
          }

          _context3.next = 18;
          return regeneratorRuntime.awrap(departmentsService.findDepartments(filter));

        case 18:
          departmentsVal = _context3.sent;
          departments = departmentsVal.map(function (depart) {
            return {
              id: depart._id,
              departname: depart.departname
            };
          }); //nếu có thì đổ ra view

          accountToChange = {
            id: account._id,
            rolecode: account.rolecode,
            username: account.username,
            showname: account.information.showname,
            department: account.information.department,
            avatar: account.information.avatar,
            classname: account.information.classname,
            //hiển thị thêm danh sách phòng khoa phụ trách cho người dùng PK
            departresponsible: account.departresponsible.map(function (departres) {
              return {
                id: departres._id,
                departname: departres.departname
              };
            })
          }; // console.log("Test 11")
          // console.log(departments);
          // console.log(accountToChange)
          // console.log(account)

          res.render("information", {
            title: "Thông tin cá nhân",
            accountToChange: accountToChange,
            departments: departments
          });

        case 22:
        case "end":
          return _context3.stop();
      }
    }
  });
});
/*end: hiển thị view thông tin cá nhân */

/*start: xử lý form thay đổi thông tin cá nhân*/
// thiết lập multer

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
    } else {
      callback(new Error("File không đúng định dạng hình ảnh"), false); // sai định dạng file thì tạo một lỗi mới
      // hàm xử lý file sẽ bắt được lỗi này (xem phần add sản phẩm)
    }
  },
  limits: {
    fileSize: 1000000
  } // giới hạn file -- bé hơn 1mb

});
route.post("/information", function _callee5(req, res, next) {
  var id, rolecode, myid, account, uploadResult;
  return regeneratorRuntime.async(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          id = req.query.id;
          rolecode = req.user.rolecode; // quyền tài khoản

          myid = req.user._id; // id tài khoản hiện tại của bản thân
          //người dùng có thể thông qua id của người khác để sửa thông tin cá nhân => không cho phép
          // chỉ có AM được quyền làm như thế
          // người dùng khác (SV) chỉ có thể xem thông tin của chính bản thân mình

          if (id) {
            _context5.next = 5;
            break;
          }

          return _context5.abrupt("return", next(createError(404, "Không tìm thấy người dùng")));

        case 5:
          if (!(rolecode === "SV" || rolecode === "PK")) {
            _context5.next = 8;
            break;
          }

          if (!(myid != id)) {
            _context5.next = 8;
            break;
          }

          return _context5.abrupt("return", next(createError(400, "Đường dẫn không hợp lệ")));

        case 8:
          _context5.next = 10;
          return regeneratorRuntime.awrap(accountsService.findOne({
            _id: id
          }));

        case 10:
          account = _context5.sent;

          if (account) {
            _context5.next = 13;
            break;
          }

          return _context5.abrupt("return", next(createError(404, "Không tìm thấy người dùng")));

        case 13:
          // // nếu người dùng thuộc quyên PK thì không cho phép sửa thông tin cá nhân
          // if(account.rolecode==="PK"){
          //     return next(createError(404,"Không tìm thấy thông tin cá nhân của người dùng"))
          // }
          // nếu không có lỗi thì tiếp tục
          // xử lý hình từ input name avatar
          uploadResult = upload.single("avatar");
          uploadResult(req, res, function _callee4(err) {
            var _req$body, showname, classname, department, filter, departmentsVal, errormess, file, avatar, fileExist, oldPath, filename, pathaccount, newPath, pathToSave;

            return regeneratorRuntime.async(function _callee4$(_context4) {
              while (1) {
                switch (_context4.prev = _context4.next) {
                  case 0:
                    _req$body = req.body, showname = _req$body.showname, classname = _req$body.classname, department = _req$body.department; // showname là bắt buộc nên chỉ cần kiểm tra nó

                    if (showname) {
                      _context4.next = 4;
                      break;
                    }

                    req.flash("informationErr", "Vui lòng nhập tên hiển thị");
                    return _context4.abrupt("return", res.redirect("/account/information?id=".concat(id)));

                  case 4:
                    if (!(showname.length < 2)) {
                      _context4.next = 7;
                      break;
                    }

                    req.flash("informationErr", "Vui lòng nhập tên hiển thị có độ dài ít nhất là 2");
                    return _context4.abrupt("return", res.redirect("/account/information?id=".concat(id)));

                  case 7:
                    account.information.showname = showname; // lưu lại thông tin tên hiển thị

                    account.information.classname = classname; // lưu lại thông tin tên lớp
                    // lấy ra danh sách khoa để kieemr tra giá trị người dùng chọn
                    //nếu là PK hoặc AM thì hiện tất còn SV thì chỉ hiện Khoa

                    filter = {};

                    if (rolecode === "SV") {
                      filter = {
                        departtype: "K"
                      };
                    }

                    _context4.next = 13;
                    return regeneratorRuntime.awrap(departmentsService.findDepartments(filter));

                  case 13:
                    departmentsVal = _context4.sent;

                    if (department && departmentsVal.find(function (t) {
                      return t._id.toString() == department;
                    })) {
                      // nếu có tồn tại => người dùng có chọn một khoa
                      // nếu có thì gán vào account
                      account.information.department = department; //value của department đang là một id
                    }

                    if (!err) {
                      _context4.next = 19;
                      break;
                    }

                    // nếu có lỗi về file (lỗi đã được thiết lập ở multer) thì redirect về
                    // console.log(err.message)
                    errormess = err.message;
                    req.flash("informationErr", errormess);
                    return _context4.abrupt("return", res.redirect("/account/information?id=".concat(id)));

                  case 19:
                    file = req.file; // trường hợp ảnh đại diện ta chỉ lấy một file -- nếu có nhiều file thì gọi files
                    // console.log(file);
                    // console.log(account);

                    if (file) {
                      // nếu có file thì nghĩa là người dùng muốn cập nhật ảnh đại diện mới
                      //xóa file cũ
                      // lấy file cũ ra + cộng thêm public để có thể xóa được
                      // vì đường link file sẽ được tính từ project gốc
                      //nếu là file hình mặc định thì không cần xóa -- còn nếu không mới xóa
                      if (account.information.avatar !== "/img/project/default_avatar.jpg") {
                        avatar = "public" + account.information.avatar;
                        fileExist = fs.existsSync(avatar); // bởi vì file hình có thể là liên kết internet => kiểm tra nó

                        if (fileExist) {
                          // có tồn tại thì xóa đi
                          fs.unlinkSync(avatar);
                        }
                      } // tiếp đến là chuyển file mới up lên


                      oldPath = file.path;
                      filename = file.filename; // file name

                      pathaccount = "public/accounts/".concat(account._id); // dùng để kiểm tra xem thư mục này có tồn tại không
                      // nếu không thì tạo mới

                      newPath = "public/accounts/".concat(account._id, "/").concat(filename); // path để di chuyển file

                      pathToSave = "/accounts/".concat(account._id, "/").concat(filename); // path để lưu vào csdl
                      //kiểm tra sự tồn tại của thư mục sắp lưu

                      if (!fs.existsSync(pathaccount)) {
                        // nếu đường dẫn chuỗi thư mục không có
                        // thì tạo mới
                        fs.mkdirSync(pathaccount, {
                          recursive: true
                        }); // thêm option đệ quy để tạo thư mục theo path(tạo nhiều thư mục)
                      } // di chuyển file


                      fs.renameSync(oldPath, newPath); //lưu đường dẫn để hiển thị

                      account.information.avatar = pathToSave;
                    } // lưu lại thông tin


                    account.save().then(function (result) {
                      if (result) {
                        req.flash("informationSucc", "Cập nhật thông tin cá nhân thành công");
                        return res.redirect("/account/information?id=".concat(id));
                      }
                    })["catch"](function (err) {
                      console.log(err);
                    });

                  case 22:
                  case "end":
                    return _context4.stop();
                }
              }
            });
          });

        case 15:
        case "end":
          return _context5.stop();
      }
    }
  });
});
/*end: xử lý form thay đổi thông tin cá nhân*/
// đổi mật khẩu

route.use("/changepassword", checkRoleChangePassword, function (req, res, next) {
  res.locals.changepasswordErr = req.flash("changepasswordErr");
  res.locals.changepasswordSucc = req.flash("changepasswordSucc");
  next();
});
/*start: hiển thị view đổi mật khẩu */

route.get("/changepassword", function (req, res, next) {
  res.render("changepassword", {
    title: "Đổi mật khẩu"
  });
});
/*end: hiển thị view đổi mật khẩu */

/*start: thực hiện đổi mật khẩu */

function handleChangePasswordForm(req, res, next) {
  // xử lý lỗi từ việc valid
  var validResult = validationResult(req);

  if (validResult.errors.length) {
    var error = validResult.errors[0];
    req.flash("changepasswordErr", error.msg);
    return res.redirect("/account/changepassword");
  }

  next();
}

route.post("/changepassword", myValid.validChangePasswordForm, handleChangePasswordForm, function _callee6(req, res, next) {
  var _req$body2, password, newpassword, account, currentpassword;

  return regeneratorRuntime.async(function _callee6$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          _req$body2 = req.body, password = _req$body2.password, newpassword = _req$body2.newpassword; // kiểm tra mật khẩu có đúng không ?
          //lấy thông tin tài khoản hiện tại từ db (lấy từ db để có thể lưu được cho nên không dùng req.user để lấy trục tiếp)

          _context6.next = 3;
          return regeneratorRuntime.awrap(accountsService.findOne({
            _id: req.user._id
          }));

        case 3:
          account = _context6.sent;

          if (account) {
            _context6.next = 7;
            break;
          }

          req.flash("changepasswordErr", "Đã có vấn đề về tài khoản khi đổi mật khẩu");
          return _context6.abrupt("return", res.redirect("/account/changepassword"));

        case 7:
          currentpassword = account.password; // kiểm tra password hiện tại mà người dùng nhập và password được lưu trong db

          if (hashpass.verify(password, currentpassword)) {
            _context6.next = 11;
            break;
          }

          // nếu không giống nhau
          req.flash("changepasswordErr", "Mật khẩu hiện tại không đúng");
          return _context6.abrupt("return", res.redirect("/account/changepassword"));

        case 11:
          // nếu đúng thì đổi mật khẩu
          account.password = hashpass.generate(newpassword);
          account.save().then(function (result) {
            if (result) {
              req.flash("changepasswordSucc", "Thay đổi mật khẩu thành công");
              return res.redirect("/account/changepassword");
            }

            next(createError(500, "Đã có lỗi xảy ra khi đổi mật khẩu"));
          })["catch"](function (err) {
            next(createError(500, "Đã có lỗi xảy ra khi đổi mật khẩu"));
          });

        case 13:
        case "end":
          return _context6.stop();
      }
    }
  });
});
/*end: thực hiện đổi mật khẩu */

/*Start: thực hiện hiển thị giao diện quản lý tài khoản */

route.get("/manager", checkRoleSettingAccount, function _callee7(req, res, next) {
  var _req$query, field, rolecode, searchvalue, filter, accountsVal, accounts;

  return regeneratorRuntime.async(function _callee7$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          // xác định các giá trị search (rolename, field, searchvalue)
          //rolecode: giá trị là tên quyền muốn tìm (PK hoặc SV)
          //field: trường dữ liệu muốn tìm -- nếu là rỗng thì không tìm
          //searchvalue: giá trị muốn tìm theo field -- nếu là rỗng thì không tìm
          _req$query = req.query, field = _req$query.field, rolecode = _req$query.rolecode, searchvalue = _req$query.searchvalue;
          filter = {};

          if (field !== "username") {
            // nếu filter kiểu dữ liệu không nằm trong giá trị này
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
            //dùng toán tử like để tìm kiếm
            filter["".concat(field)] = {
              $regex: searchvalue,
              $options: "i"
            };
          } //kiểm tra xem người dùng có filter theo tên quyền không


          if (rolecode === "AM" || rolecode === "PK" || rolecode === "SV") {
            filter["rolecode"] = rolecode;
          } //lấy ra danh sách tài khoản dựa theo filter


          _context7.next = 7;
          return regeneratorRuntime.awrap(accountsService.findAccounts(filter));

        case 7:
          accountsVal = _context7.sent;
          //map lại dữ liệu
          accounts = accountsVal.map(function (account, index) {
            //index: vị trí của account trong mảng
            return {
              stt: index + 1,
              //stt để hiển thị trên view
              id: account._id,
              username: account.username,
              rolecode: account.rolecode
            };
          });
          return _context7.abrupt("return", res.render("manageraccounts", {
            title: "Quản lý tài khoản",
            accounts: accounts,
            field: field,
            rolecode: rolecode,
            searchvalue: searchvalue
          }));

        case 10:
        case "end":
          return _context7.stop();
      }
    }
  });
});
/*End: thực hiện giao diện quản lý tài khoản */

module.exports = route;