"use strict";

function checkLogin(req, res, next) {
  console.log("checklogin");

  if (!req.user) {
    next();
  } else {
    res.redirect("/home");
  }
}

module.exports = {
  checkLogin: checkLogin
};