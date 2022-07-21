const express = require("express");
const route = express.Router();
const registerMiddleware = require("../middlewares/register.js");
// const accountCtr = require("../controllers/accounts.js");
const myValid = require("../validations/my-validation.js");
const validationResult = myValid.validationResult;
var accountsService = require("../services/accounts.js");
var departmentsService = require("../services/departments.js");

var hashpass = require("password-hash"); //module liên quan đến mật khẩu băm (tạo, verify,...)
// origin: /register

/*Start: middleware chung trước khi vào trang đăng ký */
route.use(registerMiddleware.checkAdmin,function(req,res,next){
    res.locals.registerErr = req.flash("registerErr");
    res.locals.usernameVal = req.flash("usernameVal")
    res.locals.emailVal = req.flash("emailVal")
    next();
});
/*end: middleware chung trước khi vào trang đăng ký */


/*Start: trả về form đăng ký */

route.get("/",async function(req,res){
    // lấy toàn bộ thông tin phòng khoa để đổ ra view
    var departmentsval = await departmentsService.findDepartments({});
    var departments = departmentsval.map(function(department){
        return {
            id: department._id,
            departname: department.departname
        }
    })
    res.render("register",{departments:departments});
})


/*End: trả về form đăng ký */


/*Start: thực hiện chức năng đăng ký*/

// kiểm tra tính hợp lệ của form
function registerFormHandle(req,res,next){
    var validResult = validationResult(req);
    var {username, email} = req.body; // lấy ra 2 thông tin để hiển thị lại người dùng nhập lỗi
    req.flash("usernameVal",username);
    req.flash("emailVal",email);
    if(validResult.errors.length){ // nếu có lỗi
                                /* mỗi lỗi bao gồm {
                                                    value: giá trị bị lỗi
                                                    msg: tin nhắn lỗi được định nghĩa ở validUserForm
                                                    param: key bị lỗi
                                                    location: nếu dùng form thì giá trị ở đây là body */
        var error = validResult.errors[0];
        // console.log(error.msg)
        req.flash("registerErr",error.msg);
        return res.redirect("/register");
    }

    next();

}

// kiểm tra thông tin tài khoản muốn đăng ký (thông tin phòng khoa, sự tồn tại ?)
async function checkRegisterInformation(req,res,next){ // kiểm tra form đăng ký lần 2
    // var {username, password, passwordconfirm,email, department} = req.body;
    var {username,email, department} = req.body;
    // if(password != passwordconfirm){
    //     req.flash("registerErr","Mật khẩu và mật khẩu xác nhận không khớp");
    //     return res.redirect("/register");
    // }
    //lấy ra phòng khoa
    var departmentVal = await departmentsService.findDepartment({_id:department});
    // kiểm tra tồn tại phòng - khoa
    if(!departmentVal){
        req.flash("registerErr","Phòng - khoa bạn chọn không tồn tại");
        return res.redirect("/register");
    }
    // kiểm tra tồn tại của account 
    var account = await accountsService.findOne({username: username});
    
    if(account){
        req.flash("registerErr","Tài khoản đã tồn tại");
        return res.redirect("/register");
    }
    // kiểm tra tồn tại của email
    var account = await accountsService.findOne({email:email}); // tìm account có email tương ứng
    if(account){ //nếu có thì trùng email
        req.flash("registerErr","Email đã tồn tại");
        return res.redirect("/register");
    }
    next();

}
// thực hiện đăng ký
async function startRegister(req,res){ // bắt đầu đăng ký
    // var {username, password, email, department} = req.body;
    var {username, email, department} = req.body;
    // tạo mật khẩu mặc định
    var password = "tdt123456tdt";
    var filter = {
        username: username,
        password: hashpass.generate(password),
        rolecode:"PK",
        email: email,
        information:{
            showname: username,
            department: department
        },
        departresponsible:[ // thêm thông tin phụ trách phòng khoa (mặc định là phòng - khoa được chọn khi đăng ký)
            department
        ]
    }
    var account = await accountsService.add(filter);
    if(!account){
        req.flash("registerErr","Đăng ký thất bại, vui lòng thử lại");
        return res.redirect("/register");
    }
    // đăng ký thành công thì chuyển đến trang thiết lập quyền cho tài khoản
    return res.redirect(`/account/setting?id=${account._id}`);
}

route.post("/",myValid.validRegisterForm,registerFormHandle,checkRegisterInformation,function(req,res){
    startRegister(req,res);
})

/*End: thực hiện chức năng đăng ký*/

module.exports = route;