const route = require("express").Router();
var departmentsService = require("../services/departments.js");

//origin: /department

//khi bấm vào phần thông báo theo phòng khoa thì hiển thị danh sách phòng khoa để chọn 
route.get("/",async function(req,res){
    //lấy danh sách tất cả phòng khoa
    var departmentsVal = await departmentsService.findDepartments({});
    //map lại dữ liệu
    var departments = departmentsVal.map(function(department){
        return {
            id: department._id,
            departname: department.departname
        }
    })
    return res.render("departments",{title:"Danh sách phòng khoa",departments:departments})
})

module.exports = route;