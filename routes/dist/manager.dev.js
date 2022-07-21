"use strict";

var route = require("express").Router();

var createError = require("http-errors"); //origin: /manager
//chỉ có AM hoặc PK mới được sử dụng giao diện quản lý


route.use(function (req, res, next) {
  var rolecode = req.user.rolecode;

  if (rolecode !== "AM" && rolecode !== "PK") {
    return next(createError(404, "Không tìm thấy trang"));
  }

  return next();
});
route.get("/", function (req, res) {
  res.render("dashboard", {
    title: "Quản lý"
  });
});
module.exports = route;