"use strict";

var checkLogin = function checkLogin(req, res, next) {
  if (req.user) {
    return res.redirect("/home");
  }

  next();
};

module.exports = {
  checkLogin: checkLogin
};