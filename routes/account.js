// dành cho chức năng cập nhật thông tin cá nhân (Sinh viên), phân quyền đăng thông báo (AM), đổi mật khẩu (AM,PK)

var accountsService = require("../services/accounts.js");
var departmentsService = require("../services/departments.js");
const myValid = require("../validations/my-validation.js");
const validationResult = myValid.validationResult;
const route = require("express").Router();
const multer = require("multer");
var createError = require('http-errors');
var hashpass = require("password-hash"); //module liên quan đến mật khẩu băm (tạo, verify,...)
var fs = require("fs");
var myhandles = require("../handles/base-handles.js"); //module chứa một số hàm thông dụng
const { create } = require("../models/accounts.js");
// origin: /account

function checkRoleSettingAccount(req,res,next){ // kiểm tra quyền chức năng thiết lập quyền hạn đăng bài
    var rolecode = req.user.rolecode;
    if(rolecode!=="AM"){
        return next(createError(404,"Không tìm thấy trang"))
    }
    next();
}

function checkRoleChangePassword(req,res,next){ // kiểm tra quyền chức năng đổi mật khẩu
    var rolecode = req.user.rolecode;
    if(rolecode!=="PK" && rolecode!=="AM"){
        return next(createError(404,"Không tìm thấy trang"))
    }
    next();
}

function checkRoleChangeInformation(req,res,next){// kiểm tra quyền chức năng cập nhật thông tin cá nhân
    var rolecode = req.user.rolecode;
   
    if(rolecode!=="SV" && rolecode!=="AM"){
        return next(createError(404,"Không tìm thấy trang"))
    }
    next();
}



// phân quyền đăng thông báo

/*start: hiển thị view thiết lập quyền đăng thông báo */
route.use("/setting",checkRoleSettingAccount,function(req,res,next){
    res.locals.settingaccountErr = req.flash("settingaccountErr");
    res.locals.settingaccountSucc = req.flash("settingaccountSucc");
    next();
})
route.get("/setting",async function(req,res,next){
    // lấy thông tin tài khoản dựa vào id (query)
    var id = req.query.id;
    // nếu không có thông tin id thì báo lỗi
    if(!id){
        return next(createError(404,"Không tìm thấy người dùng"))
    }
    // lấy thông tin tài khoản dựa vào id
    var account = await accountsService.findOne({_id:id});
    if(!account){ // nếu tài khoản người dùng theo id không tồn tại thì báo lỗi
        return next(createError(404,"Không tìm thấy người dùng"))
    }
    // lấy ra danh sách phòng khoa mà tài khoản hiên tại đang phụ trách (lấy ra id) 
    var currentDepartment = account.departresponsible.map(function(depart){ // mapping lấy ra id của phòng khoa mà hiện tại 
                                                                            // tài khoản đang phụ trách
        return {
            id: depart.id
        }
    });
    // lấy ra danh sách tất cả phòng khoa
    var departmentVal = await departmentsService.findDepartments({});
    var departments = departmentVal.map(function(department){
        return {
            id: department._id,
            departname: department.departname
        }
    }) 
    var accountedit = { // lấy thông tin tài khoản người dùng muốn sửa để hiện ra view
        id: account._id, // id tài khoản
        rolecode:account.rolecode,
        username: account.username,// tên username
        departname: getDepartname(account)// tên phòng khoa được gán lúc tạo
    }
    // trả ra view 3 thông tin - id tài khoản muốn sửa - mảng id của phòng khoa đang phụ trách hiện tại - mảng tất cả các phòng khoa
    res.render("accountsetting",{title:"Thiết lập tài khoản", departments:departments, currentDepartment:currentDepartment,accountedit:accountedit});
})
function getDepartname(userVal){
    if(userVal.information.department){
        return userVal.information.department.departname;
    }
    else{
        if(userVal.rolecode==="AM"){
            return "Quản trị hệ thống"
        }
        else{
            return "Chưa cập nhật"
        }
        
    }
}

/*end: hiển thị view thiết lập quyền đăng thông báo */


/*start: xử lý form thiết lập quyền đăng bài */

route.post("/setting",async function(req,res,next){
     // lấy thông tin tài khoản dựa vào id (query)
     var id = req.query.id;
      // lấy ra mảng id của các phòng khoa được chọn cập nhật mới (vì là checkbox => mảng)
      var departments = req.body.department;
     // nếu không có thông tin id thì báo lỗi
     if(!id){
        return next(createError(404,"Không tìm thấy người dùng"))
     }
     // lấy thông tin tài khoản dựa vào id
     var account = await accountsService.findOne({_id:id});
     if(!account){ // nếu tài khoản người dùng theo id không tồn tại thì báo lỗi
        return next(createError(404,"Không tìm thấy người dùng"))
     }
     //kiểm tra quyền xem có phải PK và đang thực hiện set quyền không ?
     if(departments && account.rolecode!=="PK"){
        req.flash("settingaccountErr","Tài khoản này không đượcp phép phân quyền đăng bài");
        return res.redirect(`/account/setting?id=${id}`);
     }

    
     
    // lấy ra danh sách tất cả phòng khoa
    var departmentVal = await departmentsService.findDepartments({});
     // kiểm tra xem giá trị các phòng khoa được chọn có tồn tại trong csdl không ?
     var checkResult = true;
     if(departments){ // có thể người dùng bỏ chọn tất cả nên sẽ không xảy ra forEach => xét điều kiện
        departments.forEach(function(departid){
            if(!departmentVal.find(t=>t._id.toString()==departid)){ // nếu không tồn tại thì gán false để báo lỗi
                checkResult = false;
            }
        })
     }
     
    if(checkResult==false){ // nếu có lỗi quay về trang phân quyền để báo lỗi
        req.flash("settingaccountErr","Giá trị phòng khoa không hợp lệ");
        return res.redirect(`/account/setting?id=${id}`);
    }

    // nếu không có lỗi thì tiến hành cập nhật lại
    // cách gọn nhất là lấy luôn cái account ở trên sau đó dán giá trị cho departresponsible
    // mặc dù là mảng departresponsible nhận các giá trị thuộc objectID nhưng khi ta thêm chuỗi vào nó cũng
    // tự đổi
    account.departresponsible = departments;
    // console.log(account);
    account.save()
    .then(result=>{
        if(result){
            // console.log(result)
            req.flash("settingaccountSucc","Thiết lập tài khoản thành công");
            return res.redirect(`/account/setting?id=${id}`);
        }
    })
    .catch(err=>{
        console.log(err);
        req.flash("settingaccountErr","Thiết lập tài khoản thất bại, vui lòng thử lại");
        return res.redirect(`/account/setting?id=${id}`);
    })
    
     
})


/*end: xử lý form thiết lập quyền đăng bài */




// cập nhật thông tin cá nhân
route.use("/information",function(req,res,next){
    res.locals.informationErr = req.flash("informationErr");
    
    res.locals.informationSucc = req.flash("informationSucc");
    next();
})
/*start: hiển thị view thông tin cá nhân */
route.get("/information",async function(req,res,next){
  
    var id = req.query.id;
    var rolecode = req.user.rolecode; // quyền tài khoản
    var myid = req.user._id; // id tài khoản hiện tại của bản thân
    //người dùng có thể thông qua id của người khác để xem thông tin cá nhân => không cho phép
    // chỉ có AM được quyền làm như thế
    // người dùng khác (SV) chỉ có thể xem thông tin của chính bản thân mình
    if(!id){
        // req.flash("informationErr","Thông tin tài khoản muốn tìm không hợp lệ");
        // return res.redirect(`/home`);
        return next(createError(404,"Không tìm thấy người dùng"))
    }
    if(rolecode === "SV" || rolecode==="PK"){ // nếu người dùng là SV hoặc PK
        // kiểm tra xem có phải người dùng SV này đang cố xem thông tin của người khác qua id của người đó không
        if(myid!=id){ // nếu phải => id trong session và query khác nhau => dán lại bằng id của bản thân
            // khi so sánh không nền dùng !== vì kiểu dữ liệu khác nhau chỉ nên dùng != để so sánh giá trị
            id = myid;
            // sau đó redirect đến trang thông tin cá nhân đúng với mình
            return res.redirect(`/account/information?id=${id}`) 
        }
    }

   
    // tìm người dùng thông qua id
    var account = await accountsService.findOne({_id:id});
    if(!account){
        // req.flash("informationErr","Thông tin tài khoản bạn muốn tìm không tồn tại");
        return next(createError(404,"Không tìm thấy người dùng"))
       
    }
    // // nếu người dùng thuộc quyên PK thì không cho phép sửa thông tin cá nhân
    // if(account.rolecode==="PK"){
    //     return next(createError(404,"Không tìm thấy thông tin cá nhân của người dùng"))
    // }
    // lấy ra danh sách khoa để hiển thị ra view nếu là người dùng SV -- còn nếu không phải thì lấy tất
    var filter = {}
    if(account.rolecode==="SV"){
        filter={departtype:"K"}
    }
    
    var departmentsVal = await departmentsService.findDepartments(filter);
    
    var departments = departmentsVal.map(function(depart){
        return {
            id: depart._id,
            departname: depart.departname
        }
    })
    //nếu có thì đổ ra view
    var accountToChange = {
        id: account._id,
        rolecode: account.rolecode,
        username: account.username,
        showname: account.information.showname,
        department: account.information.department,
        avatar:account.information.avatar,
        classname:account.information.classname,
        //hiển thị thêm danh sách phòng khoa phụ trách cho người dùng PK
        departresponsible: account.departresponsible.map(function(departres){
            return {
                id: departres._id,
                departname: departres.departname
            }
        })
    }
    // console.log("Test 11")
    // console.log(departments);
    // console.log(accountToChange)
    // console.log(account)
    res.render("information",{title:"Thông tin cá nhân",accountToChange:accountToChange,departments:departments});

})
/*end: hiển thị view thông tin cá nhân */

/*start: xử lý form thay đổi thông tin cá nhân*/
// thiết lập multer

var storage  = multer.diskStorage({ // thiết lập nơi lưu trữ và tên file được lưu trữ
    filename:function(req,file,callback){ //callback thiết lập tên file
        callback(null,Date.now()+"_"+file.originalname);
    },
    destination:function(req,file,callback){ //callback thiết lập nơi lưu trữ tạm thời
                                            // đường link tính từ thư mục gốc của project
        callback(null,"public/tmp/");
    }
    
})

var upload = multer({

    storage:storage, // thiết lập lưu trữ (nơi lưu trữ và tên file được lưu trữ)
    fileFilter:function(req,file,callback){ //callback lưu file
        // xử lý file trước khi di chuyển

        if(file.mimetype.startsWith("image/")){ // kiểm tra xem có phải file ảnh không ?
                        // phải thì cho phép upload
            callback(null,true); // callback là đại diện cho hàm upload file của multer nếu true thì cho phép upload file
                                        // ngược lại nếu false là sẽ k upload
        }
        else{
            callback(new Error("File không đúng định dạng hình ảnh"),false); // sai định dạng file thì tạo một lỗi mới
                                                                            // hàm xử lý file sẽ bắt được lỗi này (xem phần add sản phẩm)
        }
    },

    limits:{fileSize:1000000} // giới hạn file -- bé hơn 1mb
})

route.post("/information",async function(req,res,next){
    var id = req.query.id; //id của tài khoản
    var rolecode = req.user.rolecode; // quyền tài khoản
    var myid = req.user._id; // id tài khoản hiện tại của bản thân
    //người dùng có thể thông qua id của người khác để sửa thông tin cá nhân => không cho phép
    // chỉ có AM được quyền làm như thế
    // người dùng khác (SV) chỉ có thể xem thông tin của chính bản thân mình
    if(!id){
        return next(createError(404,"Không tìm thấy người dùng"))
    }
    if(rolecode === "SV" || rolecode==="PK"){ // nếu người dùng là SV hoặc PK
        // kiểm tra xem có phải người dùng SV này đang cố xem thông tin của người khác qua id của người đó không
        if(myid!=id){ // nếu phải => id trong session và query khác nhau 
            return next(createError(400,"Đường dẫn không hợp lệ"))
        }
    }
    // tìm người dùng thông qua id
    var account = await accountsService.findOne({_id:id});
    if(!account){
        // req.flash("informationErr","Thông tin tài khoản bạn muốn tìm không tồn tại");
        return next(createError(404,"Không tìm thấy người dùng"))
    }
    // // nếu người dùng thuộc quyên PK thì không cho phép sửa thông tin cá nhân
    // if(account.rolecode==="PK"){
    //     return next(createError(404,"Không tìm thấy thông tin cá nhân của người dùng"))
    // }
    // nếu không có lỗi thì tiếp tục
    // xử lý hình từ input name avatar
    var uploadResult=upload.single("avatar");
    uploadResult(req,res,async function(err){
        var {showname, classname, department} = req.body;
        // showname là bắt buộc nên chỉ cần kiểm tra nó
        if(!showname){
            req.flash("informationErr", "Vui lòng nhập tên hiển thị");
            return res.redirect(`/account/information?id=${id}`);
        }
        if(showname.length < 2){
            req.flash("informationErr", "Vui lòng nhập tên hiển thị có độ dài ít nhất là 2");
            return res.redirect(`/account/information?id=${id}`);
        }
        account.information.showname = showname; // lưu lại thông tin tên hiển thị
        account.information.classname= classname; // lưu lại thông tin tên lớp
        // lấy ra danh sách khoa để kieemr tra giá trị người dùng chọn
        //nếu là PK hoặc AM thì hiện tất còn SV thì chỉ hiện Khoa
        var filter = {};
        if(rolecode==="SV"){
            filter = {departtype:"K"};
        }
        var departmentsVal = await departmentsService.findDepartments(filter);
        if(department && departmentsVal.find(t=>t._id.toString()==department)){ // nếu có tồn tại => người dùng có chọn một khoa
            // nếu có thì gán vào account
            account.information.department = department; //value của department đang là một id
        }

        if(err){ // nếu có lỗi về file (lỗi đã được thiết lập ở multer) thì redirect về
            // console.log(err.message)
            var errormess = err.message;
            
            req.flash("informationErr", errormess);
            
            return res.redirect(`/account/information?id=${id}`);
        }
        var file = req.file; // trường hợp ảnh đại diện ta chỉ lấy một file -- nếu có nhiều file thì gọi files
        // console.log(file);
        // console.log(account);
        if(file){ // nếu có file thì nghĩa là người dùng muốn cập nhật ảnh đại diện mới
            //xóa file cũ
            
            if(account.information.avatar!=="/img/project/default_avatar.jpg"){
               //gọi hàm xóa hình người dùng (trên firebase storage)
               await myhandles.deleteFile(account.information.path); //path chứa đường dẫn để tương tác với firebase
            }
            //gọi hàm up file lên firebase và
            //nhận về 3 giá trị
            // urlToSave: đường dẫn để hiển thị lên view
            // originalname: tên file ban đầu người dùng up lên chưa được chuyển đổi
            // path: đường dẫn dùng để tương tác với dịch vụ lưu trữ (dùng để xóa chẳng hạn)
            var {urlToSave,originalname,path} = await myhandles.moveFile(file,id,"accounts");
            //lưu đường dẫn để hiển thị
            account.information.avatar = urlToSave; //lưu lại đường dẫn để hiển thị
            account.information.path = path; // lưu lại đường dẫn để tương tác
        }
        // lưu lại thông tin
        account.save()
        .then(result=>{
            if(result){
                req.flash("informationSucc","Cập nhật thông tin cá nhân thành công");
                return res.redirect(`/account/information?id=${id}`)
            }
        })
        .catch(err=>{
            console.log(err);
        })
        
    })

})


/*end: xử lý form thay đổi thông tin cá nhân*/




// đổi mật khẩu
route.use("/changepassword",checkRoleChangePassword,function(req,res,next){
    res.locals.changepasswordErr = req.flash("changepasswordErr");
    res.locals.changepasswordSucc = req.flash("changepasswordSucc");
    next();
})
/*start: hiển thị view đổi mật khẩu */
route.get("/changepassword",function(req,res,next){
    res.render("changepassword",{title:"Đổi mật khẩu"})
})
/*end: hiển thị view đổi mật khẩu */


/*start: thực hiện đổi mật khẩu */
function handleChangePasswordForm(req,res,next){ // xử lý lỗi từ việc valid
    var validResult = validationResult(req);
    if(validResult.errors.length){
        var error = validResult.errors[0];
        req.flash("changepasswordErr",error.msg);
        return res.redirect("/account/changepassword")
    }
    next();
}
route.post("/changepassword",myValid.validChangePasswordForm,handleChangePasswordForm,async function(req,res,next){
    var {password, newpassword} = req.body;
    // kiểm tra mật khẩu có đúng không ?
    //lấy thông tin tài khoản hiện tại từ db (lấy từ db để có thể lưu được cho nên không dùng req.user để lấy trục tiếp)
    var account = await accountsService.findOne({_id:req.user._id});
    if(!account){
        req.flash("changepasswordErr","Đã có vấn đề về tài khoản khi đổi mật khẩu");
        return res.redirect("/account/changepassword")
    }
    var currentpassword = account.password;
    // kiểm tra password hiện tại mà người dùng nhập và password được lưu trong db
    if(!hashpass.verify(password,currentpassword)){ // nếu không giống nhau
        req.flash("changepasswordErr","Mật khẩu hiện tại không đúng");
        return res.redirect("/account/changepassword")
    }
    // nếu đúng thì đổi mật khẩu
    account.password = hashpass.generate(newpassword);
    account.save()
    .then(result=>{
        if(result){
            req.flash("changepasswordSucc","Thay đổi mật khẩu thành công");
            return res.redirect("/account/changepassword")
        }
        next(createError(500,"Đã có lỗi xảy ra khi đổi mật khẩu"));
    })
    .catch(err=>{
        next(createError(500,"Đã có lỗi xảy ra khi đổi mật khẩu"));
    })
})
/*end: thực hiện đổi mật khẩu */

/*Start: thực hiện hiển thị giao diện quản lý tài khoản */

route.get("/manager",checkRoleSettingAccount,async function(req,res,next){
    // xác định các giá trị search (rolename, field, searchvalue)
    //rolecode: giá trị là tên quyền muốn tìm (PK hoặc SV)
    //field: trường dữ liệu muốn tìm -- nếu là rỗng thì không tìm
    //searchvalue: giá trị muốn tìm theo field -- nếu là rỗng thì không tìm
    var {field,rolecode,searchvalue} = req.query;
    var filter = {};
    if(field!=="username"){ // nếu filter kiểu dữ liệu không nằm trong giá trị này
        field = "none";
        searchvalue = ""; // không chọn trường dữ liệu thì search value không có nghĩa gì nữa
    }
    else{
        if(!searchvalue || searchvalue==""){ // nếu không có giá trị tìm kiếm thì việc chọn field cũng không còn ý nghĩa
            // cho nên ta cũng field = none
            field = "none";

        }
    }
    // nếu field != none (nghĩa là người dùng muốn tìm kiếm thông báo theo kiểu dữ liệu và có nhập dữ liệu) 
    //thì ta mới thêm vào filter
    if(field !== "none"){
        //dùng toán tử like để tìm kiếm
        filter[`${field}`] = {$regex: searchvalue, $options: "i"}
    }
    //kiểm tra xem người dùng có filter theo tên quyền không
    if(rolecode==="AM" || rolecode==="PK" || rolecode==="SV" ){
        filter[`rolecode`] = rolecode
    }
    //lấy ra danh sách tài khoản dựa theo filter
    var accountsVal = await accountsService.findAccounts(filter);
    //map lại dữ liệu
    var accounts = accountsVal.map(function(account,index){ //index: vị trí của account trong mảng
        return {
            stt: index+1, //stt để hiển thị trên view
            id: account._id,
            username: account.username,
            rolecode: account.rolecode
        }
    })
    
    return res.render("manageraccounts",{title:"Quản lý tài khoản",accounts:accounts, field:field, rolecode:rolecode, searchvalue:searchvalue})
})


/*End: thực hiện giao diện quản lý tài khoản */



module.exports = route;