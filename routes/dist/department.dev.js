"use strict";

var route = require("express").Router();

var departmentsService = require("../services/departments.js"); //origin: /department
//khi bấm vào phần thông báo theo phòng khoa thì hiển thị danh sách phòng khoa để chọn 


route.get("/", function _callee(req, res) {
  var departmentsVal, departments;
  return regeneratorRuntime.async(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.next = 2;
          return regeneratorRuntime.awrap(departmentsService.findDepartments({}));

        case 2:
          departmentsVal = _context.sent;
          //map lại dữ liệu
          departments = departmentsVal.map(function (department) {
            return {
              id: department._id,
              departname: department.departname
            };
          });
          return _context.abrupt("return", res.render("departments", {
            title: "Danh sách phòng khoa",
            departments: departments
          }));

        case 5:
        case "end":
          return _context.stop();
      }
    }
  });
});
module.exports = route;