module.exports = function(passport){
    const express = require("express");
    const route = express.Router();
    const accountCtr = require("../controllers/accounts.js");
    const myValid = require("../validations/my-validation.js");
    const validationResult = myValid.validationResult;
    const loginMiddleware = require("../middlewares/login.js");
    var accountsService = require("../services/accounts.js");
    var hashpass = require("password-hash"); //module liên quan đến mật khẩu băm (tạo, verify,...)
    const localStrategy = require("passport-local").Strategy;
    // origin: /login

    route.use(loginMiddleware.checkLogin,function(req,res,next){// gọi middleware để kiểm tra login và xử lý lỗi
        // lấy lỗi (có thể không có sẽ gán bằng rỗng)
        res.locals.loginErr = req.flash("loginErr");
        res.locals.usernameVal = req.flash("usernameVal")
        next();
    })

    // thiết lập passport cho tài khoản local
    async function loginHandle(req,username,password,done,res){
        // kiểm tra sự tồn tại của tài khoản
        var account = await accountsService.findOne({username:username});
        
        // nếu tài khoản không tồn tại thì báo lỗi
        if(!account){
            // gửi về done lỗi -- kèm thiết lập tin nhắn lỗi cho req flash
            return done(null,false,req.flash("loginErr","Tài khoản hoặc mật khẩu không đúng"))
        }
        var passwordHash = account.password;
        if(!hashpass.verify(password,passwordHash)){
            return done(null,false,req.flash("loginErr","Tài khoản hoặc mật khẩu không đúng"))
        }
        return done(null,username);
    }
    passport.use(new localStrategy({
        usernameField: 'username',
        passReqToCallback: true // cho phép truyền req, res vào
    },loginHandle))

    /*start: route hiển thị trang đăng nhập */
    //localhost:3000/login/

    //localhost:3000/login/
    route.get("/",function(req,res){ // hiển thị trang đăng nhập
        
        res.render("login",{title:"Đăng nhập"});
        
    })



    /*end: route hiển thị trang đăng nhập */



    /*start: route và các hàm xử lý form đăng nhập (người dùng AM hoặc PK) */

    function loginFormHandle(req,res,next){ // hàm xử lý form đăng nhập

        var validResult = validationResult(req); // nhận kết quả từ việc valid
        req.flash("usernameVal",req.body.username) // lưu lại thông tin tài khoản trong trường form sai thì còn hiển thị lại được
        if(validResult.errors.length){ // nếu có lỗi -- thì lấy ra lỗi đầu tiên nhận được
            var error = validResult.errors[0];/* mỗi lỗi bao gồm {
                                                                    value: giá trị bị lỗi
                                                                    msg: tin nhắn lỗi được định nghĩa ở validUserForm
                                                                    param: key bị lỗi
                                                                    location: nếu dùng form thì giá trị ở đây là body
                                                                }*/
            req.flash("loginErr",error.msg); // thiết lập flash với lỗi
            return res.redirect("/login");
        }
        next();
    }


    route.post("/",myValid.validLoginForm,loginFormHandle,passport.authenticate("local",{
        failureRedirect:"/login", // liên kết điều hướng khi thất bại
        successRedirect:"/home" // liên kết điều hướng khi thành công
    }))

    /*end: route xử lý form đăng nhập (người dùng AM hoặc PK) */
    return route;

}