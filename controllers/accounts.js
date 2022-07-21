var accountsService = require("../services/accounts.js");
var departmentsService = require("../services/departments.js");
var hashpass = require("password-hash"); //module liên quan đến mật khẩu băm (tạo, verify,...)



var add = async function(account){
    let accountResult =  await accountsService.add(account);
    return accountResult
}
var findOne = async function(filter){
    let accountResult = await accountsService.findOne(filter);
    return accountResult;
}

var addAdmin = async function(){ /* tạo tài khoản cho admin */
    var oldAccount = await accountsService.findOne({username:"admin"});
    if(oldAccount){ // nếu có rồi thì khỏi tạo nữa
        return;
    }
    account = {
        username:"admin",
        password: hashpass.generate("123456"), //tạo ra password dạng mã băm
        rolecode:"AM",
        email:"tothanhtin123@gmail.com"
    }
    let accountResult = await accountsService.add(account);
    if(accountResult){
        console.log(accountResult);
    }
    else{
        console.log("Tài khoản admin đã tồn tại")
    }
}

// đã thay thế bằng passport
// var toLogin = async function(req,res){ // tiến hành đăng nhập -- tới được đây thì thông tin tài khoản đã hợp lệ
//     //lấy thông tin tài khoản
//     var username = req.body.username;
//     var password = req.body.password;
//     // tìm tài khoản trong csdl 
    
//     var account=await findOne({username:username});// tìm kiếm username theo giá trị username từ form
//         //{username:"admin"}
    
//     if(!account){ // không tìm thấy => không tồn tại => trả về false
//         req.flash("loginErr","Tài khoản hoặc mật khẩu không đúng"); // thiết lập flash với lỗi
//         return res.redirect("/login");
//     }
    
//     var checkPassword = hashpass.verify(password,account.password); // kiểm tra hash password
//     // console.log(account.password)
//     if(!checkPassword){ // nếu password từ input != password hash => sai mật khẩu => trả về false
//         req.flash("loginErr","Tài khoản hoặc mật khẩu không đúng"); // thiết lập flash với lỗi
//         return res.redirect("/login");
//     }
//     //nếu k có lỗi
//     req.session.account = account; // lưu thông tin tài khoản vào session
//     console.log(account);
//     //điều hướng đến home
//     return res.redirect("/home");
// }

async function getDepartments(){
    var filterDepartments = {};
    var departments = await departmentsService.findDepartments(filterDepartments);
    return departments;
}

//đã gọi trực tiếp ở route
// var getRegister = async function(req,res){ // trả về trang đăng kí
//     var departmentsval = await getDepartments();
//     var departments = departmentsval.map(function(department){
//         return {
//             id: department._id,
//             departname: department.departname
//         }
//     })
//     res.render("register",{departments:departments});
// }

async function checkRegisterInformation(req,res){ // kiểm tra form đăng ký lần 2
    var {username, password, passwordconfirm,email, department} = req.body;
    // if(password != passwordconfirm){
    //     req.flash("registerErr","Mật khẩu và mật khẩu xác nhận không khớp");
    //     return res.redirect("/register");
    // }
    var departmentVal = await departmentsService.findDepartment({_id:department});
    // kiểm tra tồn tại phòng - khoa
    if(!departmentVal){
        req.flash("registerErr","Phòng - khoa bạn chọn không tồn tại");
        return res.redirect("/register");
    }
    // kiểm tra tồn tại của account 
    var account = await findOne({username: username});
    
    if(account){
        req.flash("registerErr","Tài khoản đã tồn tại");
        return res.redirect("/register");
    }
    // kiểm tra tồn tại của email
    var account = await findOne({email:email}); // tìm account có email tương ứng
    if(account){ //nếu có thì trùng email
        req.flash("registerErr","Email đã tồn tại");
        return res.redirect("/register");
    }
    startRegister(req,res);

}
async function startRegister(req,res){ // bắt đầu đăng ký
    var {username, password, email, department} = req.body;
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
    var account = await add(filter);
    if(!account){
        req.flash("registerErr","Đăng ký thất bại, vui lòng thử lại");
        return res.redirect("/register");
    }
    console.log(account);
    res.send(account.username);
}

var toRegister = function(req,res){
    checkRegisterInformation(req,res); // kiểm tra thông tin lần 2 (những thông tin chỉ có trong csdl) và gọi hàm đăng ký
    
}


module.exports = {
    add,
    addAdmin,
    findOne,
    // toLogin,
    // getRegister,
    toRegister
}