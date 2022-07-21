"use strict";

var createError = require('http-errors');

var checkAdmin = function checkAdmin(req, res, next) {
  // console.log("tintin")
  var rolecode = req.user.rolecode; // console.log(rolecode)

  if (rolecode !== "AM") {
    // nếu không phải là Admin
    return next(createError(404, "Không tìm thấy trang"));
  }

  next();
};

module.exports = {
  checkAdmin: checkAdmin
};