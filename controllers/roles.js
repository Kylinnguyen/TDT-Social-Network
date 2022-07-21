var roleService = require("../services/roles.js");


var add = function(){
    var roles = [
        {
            rolecode:"AM",
            rolename:"Admin"
        },
        {
            rolecode:"PK",
            rolename:"Phòng Khoa"
        },
        {
            rolecode:"SV",
            rolename:"Sinh Viên"
        }
    ]
    roles.forEach(async function(role){
        var roleResult = await roleService.add(role);
        if(roleResult){
            console.log(roleResult);
        }
        else{
            console.log(`Quyền ${role.rolecode} đã được tạo trước đó`);
        }
    });
}

module.exports={
    add
}