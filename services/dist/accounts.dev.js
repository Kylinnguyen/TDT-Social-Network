"use strict";

var Accounts = require("../models/accounts.js");

var add = function add(value) {
  return regeneratorRuntime.async(function add$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          return _context.abrupt("return", new Accounts(value).save().then(function (result) {
            return result;
          })["catch"](function (err) {// console.log(err)
          }));

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
};

var findOne = function findOne(filter) {
  return regeneratorRuntime.async(function findOne$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          return _context2.abrupt("return", Accounts.findOne(filter).select("username password rolecode email information departresponsible").populate("information.department").populate("departresponsible").exec().then(function (result) {
            if (result) {
              return result;
            }
          })["catch"](function (err) {}));

        case 1:
        case "end":
          return _context2.stop();
      }
    }
  });
};

var findAccounts = function findAccounts(filter) {
  return regeneratorRuntime.async(function findAccounts$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          return _context3.abrupt("return", Accounts.find(filter).select("username password rolecode email information departresponsible").populate("information.department").populate("departresponsible").exec().then(function (result) {
            return result;
          })["catch"](function (err) {}));

        case 1:
        case "end":
          return _context3.stop();
      }
    }
  });
};

module.exports = {
  add: add,
  findOne: findOne,
  findAccounts: findAccounts
};