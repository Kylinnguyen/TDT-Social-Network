"use strict";

module.exports = function (passport) {
  // truyền passport từ bên ngoài vào
  var express = require("express");

  var route = express.Router();

  var GoogleStrategy = require('passport-google-oauth20').Strategy;

  var credentials = require("../credentials.js");

  var accountsService = require("../services/accounts.js"); //origin: /auth


  function authGoogle(req, accessToken, refreshToken, infor, profile, done) {
    var email, tmp, afteremail, username, account, value, result;
    return regeneratorRuntime.async(function authGoogle$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            // hàm xử lý sau khi đăng nhập vào một goog email
            // thử check email sinh viên
            email = profile.emails[0].value; // cắt chuỗi @

            tmp = email.split("@"); // lấy chuỗi sau @

            afteremail = tmp[1];

            if (!(afteremail !== "student.tdtu.edu.vn")) {
              _context.next = 5;
              break;
            }

            return _context.abrupt("return", done(null, false, req.flash("loginErr", "Vui lòng sử dụng email sinh viên")));

          case 5:
            //nếu đúng là email sinh viên thi thêm tài khoản ở đây luôn
            username = email; // kiểm tra xem tài khoản sinh viên này có trong hệ thống chưa ?

            _context.next = 8;
            return regeneratorRuntime.awrap(accountsService.findOne({
              username: username
            }));

          case 8:
            account = _context.sent;

            if (account) {
              _context.next = 16;
              break;
            }

            // nếu chưa có thì thêm vào
            value = {
              googleuserid: profile.id,
              username: username,
              rolecode: "SV",
              email: email,
              information: {
                showname: profile.displayName,
                avatar: profile.photos[0].value
              }
            };
            _context.next = 13;
            return regeneratorRuntime.awrap(accountsService.add(value));

          case 13:
            result = _context.sent;

            if (result) {
              _context.next = 16;
              break;
            }

            return _context.abrupt("return", done(null, false, req.flash("loginErr", "Đã có lỗi xảy ra, vui lòng thử lại")));

          case 16:
            done(null, username);

          case 17:
          case "end":
            return _context.stop();
        }
      }
    });
  }

  passport.use(new GoogleStrategy({
    clientID: credentials.google.GOOGLE_CLIENT_ID,
    clientSecret: credentials.google.GOOGLE_CLIENT_SECRET,
    callbackURL: credentials.google.GOOGLE_CALLBACK_URL,
    // đường link redirect tới sau khi người dùng đăng nhập vào một email
    passReqToCallback: true,
    scope: ['profile', 'email']
  }, authGoogle));
  route.use(function (req, res, next) {
    // console.log("ok");
    next();
  });
  route.get("/google", passport.authenticate("google", {}));
  route.get("/google/callback", passport.authenticate("google", {
    // hàm nhận phản hồi
    failureRedirect: "/login",
    // liên kết điều hướng khi thất bại -- xảy ra khi có done(null,false)
    successRedirect: "/home" // liên kết điều hướng khi thành công -- xảy ra khi hàm serializeUser chạy xong (k có lỗi -- nếu có lỗi cũng lên trên :v)

  }));
  return route; // nhớ trả về route
};