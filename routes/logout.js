

//origin: /logout


module.exports = function(alluser){ //alluser là biến chứa id tất cả người dùng (nó là biến var nên dù chuyền qua dạng tham số thì kết quả bên app vẫn bị ảnh hưởng)
    const express = require("express");
    const route = express.Router();

    //origin: /logout
    route.get("/",function(req,res){// thực hiện đăng xuất
        //xóa id người dùng trong mảng tất cả người dùng
        //tìm vị trí trong mảng tất cả người dùng
        var id = req.user._id.toString();
        var index = alluser.findIndex(t=>t.toString()==id)
        if(index >=0){
            alluser.splice(index,1);
        }
        console.log(alluser)
        delete req.session.passport.user;
        res.redirect("/login");
    })
    
    return route;
}