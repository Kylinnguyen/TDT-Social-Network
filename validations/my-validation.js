const {check, validationResult} = require("express-validator")
/* var username = req.body.username;
    var password = req.body.password; */
const validLoginForm = [
    // kiểm tra tên đăng nhập
    check("username").exists().withMessage("Vui lòng nhập tài khoản")
    .notEmpty().withMessage("Vui lòng nhập tài khoản"),

    check("password").exists().withMessage("Vui lòng nhập mật khẩu")
    .notEmpty().withMessage("Vui lòng nhập mật khẩu")
    .isLength({min:6}).withMessage("Mật khẩu phải có ít nhất 6 kí tự")
    .isLength({max:16}).withMessage("Mật khẩu chỉ có tối đa 16 kí tự")
]

const validRegisterForm = [
    check("username").exists().withMessage("Vui lòng nhập tài khoản")
    .notEmpty().withMessage("Vui lòng nhập tài khoản"),

    // check("password").exists().withMessage("Vui lòng nhập mật khẩu")
    // .notEmpty().withMessage("Vui lòng nhập mật khẩu")
    // .isLength({min:6}).withMessage("Mật khẩu phải có ít nhất 6 kí tự")
    // .isLength({max:16}).withMessage("Mật khẩu chỉ có tối đa 16 kí tự"),

    // check("passwordconfirm").exists().withMessage("Vui lòng nhập mật khẩu xác nhận")
    // .notEmpty().withMessage("Vui lòng nhập mật khẩu xác nhận")
    // .custom(function(value,{req}){
    //     if(value !== req.body.password){
    //         throw new Error("Mật khẩu xác nhận không khớp");
    //     }
    //     return true;
    // }),

    check("email").exists().withMessage("Vui lòng nhập email")
    .notEmpty().withMessage("Vui lòng nhập email")
    .isEmail().withMessage("Không đúng định dạng email"),

    check("department").exists().withMessage("Vui lòng chọn 1 phòng - khoa")
    .notEmpty().withMessage("Vui lòng chọn 1 phòng - khoa"),

    

]

const validChangePasswordForm = [
    check("password").exists().withMessage("Vui lòng nhập mật khẩu hiện tại")
    .notEmpty().withMessage("Vui lòng nhập mật khẩu hiện tại"),

    check("newpassword").exists().withMessage("Vui lòng nhập mật khẩu mới")
    .notEmpty().withMessage("Vui lòng nhập mật khẩu mới")
    .isLength({min:6}).withMessage("Mật khẩu mới phải có ít nhất 6 kí tự")
    .isLength({max:16}).withMessage("Mật khẩu mới chỉ có tối đa 16 kí tự"),

    check("passwordconfirm").exists().withMessage("Vui lòng nhập mật khẩu xác nhận")
    .notEmpty().withMessage("Vui lòng nhập mật khẩu xác nhận")
    .custom(function(value,{req}){
        if(value !== req.body.newpassword){
            throw new Error("Mật khẩu xác nhận không khớp");
        }
        return true;
    }),
]
const validNotificationForm= [
    check("title").exists().withMessage("Vui lòng nhập tiêu đề thông báo")
    .notEmpty().withMessage("Vui lòng nhập tiêu đề thông báo")
    .isLength({min:6}).withMessage("Tiêu đề thông báo quá ngắn"),

    check("content").exists().withMessage("Vui lòng nhập nội dung thông báo")
    .notEmpty().withMessage("Vui lòng nhập nội dung thông báo")
    .isLength({min:6}).withMessage("Nội dung thông báo quá ngắn"),

  

    check("department").exists().withMessage("Vui lòng chọn 1 phòng - khoa")
    .notEmpty().withMessage("Vui lòng chọn 1 phòng - khoa"),

]


module.exports = {
    validationResult,
    validLoginForm,
    validRegisterForm,
    validChangePasswordForm,
    validNotificationForm
}