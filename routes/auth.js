module.exports = function(passport){ // truyền passport từ bên ngoài vào

    const express = require("express");
    const route = express.Router();
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
    const credentials = require("../credentials.js");
    var accountsService = require("../services/accounts.js");
    //origin: /auth

    async function authGoogle(req,accessToken,refreshToken,infor,profile,done){ // hàm xử lý sau khi đăng nhập vào một goog email
    
        // thử check email sinh viên
        var email = profile.emails[0].value;
        // cắt chuỗi @
        var tmp = email.split("@");
        // lấy chuỗi sau @
        var afteremail = tmp[1];
        if(afteremail!=="student.tdtu.edu.vn"){
            // console.log("Không phải email sinh viên");
            return done(null,false,req.flash("loginErr","Vui lòng sử dụng email sinh viên"));
        }
        //nếu đúng là email sinh viên thi thêm tài khoản ở đây luôn
        var username = email;
        // kiểm tra xem tài khoản sinh viên này có trong hệ thống chưa ?
        var account = await accountsService.findOne({username:username});
        if(!account){ // nếu chưa có thì thêm vào
            var value = {
                googleuserid: profile.id,
                username:username,
                rolecode:"SV",
                email:email,
                information:{
                    showname:profile.displayName,
                    avatar: profile.photos[0].value
                }
            }
            var result = await accountsService.add(value);
            // console.log(result)
            if(!result){
                return done(null,false,req.flash("loginErr","Đã có lỗi xảy ra, vui lòng thử lại"))
            }
        }
        
        done(null,username)
    }
    passport.use(new GoogleStrategy({
        clientID: credentials.google.GOOGLE_CLIENT_ID,
        clientSecret: credentials.google.GOOGLE_CLIENT_SECRET,
        callbackURL: credentials.google.GOOGLE_CALLBACK_URL, // đường link redirect tới sau khi người dùng đăng nhập vào một email
        passReqToCallback:true,
        scope: ['profile', 'email']
    },authGoogle))
    
    route.use(function(req,res,next){
        // console.log("ok");
        next()
    })
    route.get("/google",passport.authenticate("google",{
        
    }))

    route.get("/google/callback",passport.authenticate("google",{ // hàm nhận phản hồi
        failureRedirect:"/login", // liên kết điều hướng khi thất bại -- xảy ra khi có done(null,false)
        successRedirect:"/home" // liên kết điều hướng khi thành công -- xảy ra khi hàm serializeUser chạy xong (k có lỗi -- nếu có lỗi cũng lên trên :v)
    }))
    
    return route; // nhớ trả về route

}