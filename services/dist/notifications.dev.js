"use strict";

var Notifications = require("../models/notifications.js");

var add = function add(value) {
  return regeneratorRuntime.async(function add$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          return _context.abrupt("return", new Notifications(value).save().then(function (result) {
            return result;
          })["catch"](function (err) {
            console.log(err);
          }));

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
};

var findNotification = function findNotification(filter) {
  return regeneratorRuntime.async(function findNotification$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          return _context2.abrupt("return", Notifications.findOne(filter).populate("department").exec().then(function (result) {
            return result;
          })["catch"](function (err) {// console.log(err);
          }));

        case 1:
        case "end":
          return _context2.stop();
      }
    }
  });
};

var findNotifications = function findNotifications(filter, skipval, limitval, sortval) {
  return regeneratorRuntime.async(function findNotifications$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          return _context3.abrupt("return", Notifications.find(filter).skip(skipval).limit(limitval).sort(sortval).populate("department").exec().then(function (result) {
            return result;
          })["catch"](function (err) {
            console.log(err);
          }));

        case 1:
        case "end":
          return _context3.stop();
      }
    }
  });
};

var countNotifications = function countNotifications(filter) {
  return regeneratorRuntime.async(function countNotifications$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          return _context4.abrupt("return", Notifications.count(filter).then(function (result) {
            return result;
          })["catch"](function (err) {// console.log(err);
          }));

        case 1:
        case "end":
          return _context4.stop();
      }
    }
  });
}; //xóa một bài thông báo


var deleteNotification = function deleteNotification(filter) {
  return regeneratorRuntime.async(function deleteNotification$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          return _context5.abrupt("return", Notifications.deleteOne(filter).exec().then(function (result) {
            return result;
          })["catch"](function (err) {
            console.log(err);
          }));

        case 1:
        case "end":
          return _context5.stop();
      }
    }
  });
};

module.exports = {
  add: add,
  findNotification: findNotification,
  findNotifications: findNotifications,
  countNotifications: countNotifications,
  deleteNotification: deleteNotification
};