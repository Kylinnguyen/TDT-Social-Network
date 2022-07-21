const express = require("express");
const app = express();

const expressHandlebars = require("express-handlebars"); // view enigne
const fs = require("fs");
const multer = require("multer");
const credentials = require("./credentials.js");
const emailValid = require("email-validator"); // module để kiểm tra email
const mongoose = require("mongoose");
require("dotenv").config(); // thiết lập để có thể đọc được biến môi trường trong file .env (đọc bằng cách process.env.tenkey)
const {OAuth2Client} = require('google-auth-library'); /* module cho việc xác thực google - signin */
const CLIENT_ID = credentials.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(CLIENT_ID);
const flash = require("express-flash"); // module flash dùng để cho tạo tin nhắn tạm thời dùng 1 lần (có thể hiểu là session flash)
const passport = require("passport");
var accountsService = require("./services/accounts.js");
var createError = require('http-errors');
var alluser = []
const PORT = process.env.PORT || 8080;

//thiết lập môi trường lập trình - development (hoặc môi trường chạy thật -- production)
// app.set("env","development");

//sử dụng câu lệnh này để khi ta sử dụng các file trong thư mục public như hình, file css hay js thông đường dẫn tương đối
//thì hệ thống sẽ gán đường dẫn tương đối đó với đường dẫn dưới ở dạng dưới mới có thể lấy đúng file được
// có thể tạo ra nhiều đường dẫn static bằng cách gọi nhiều lần câu lệnh bên dưới
app.use(express.static(__dirname+"/public"))




// sử dụng câu lệnh này để  có thể xử lý dữ liệu từ phía client gửi lên (như tham số trên url, get, post,..)
app.use(express.urlencoded({extended:true}));
// sử dụng câu lệnh này để có thể xử lý dữ liệu json từ phía client gửi lên -- thường được sử dụng trong thiết kế API
app.use(express.json())

// sử dụng module phân tích cookie với chuỗi má hóa dữ liệu cookie -- về coi thêm công dụng của cái credentials này
app.use(require('cookie-parser')(credentials.cookieSecret));
var session = require('express-session')({ // nhớ thêm các option bên dưới để không bị lỗi
    secret:credentials.sessionSecret,
    resave: true,
    saveUninitialized: true,
    }
)
//sử dụng module session -- lưu ý là phải sử dụng sau cookie, bởi vì cookie dùng để lưu định danh (id) của máy nên cookie phải được tạo trước
app.use(session)

// module flash dùng để cho tạo tin nhắn tạm thời dùng 1 lần (có thể hiểu là session flash)
app.use(flash());

//sử dụng file main có đuôi là handlebars làm file layout gốc (có thể thay đổi được)
// nhớ để file main này theo cấu trúc từ mục gốc / views / layouts / main.handlebars
var myHelpers = require("./handlebar_helpers/base.js"); // sử dụng một số helper được định nghĩa

app.engine('handlebars',expressHandlebars(
    {
        defaultLayout:"main",
        helpers:{
            // tạo các helper
            studentsList: function(students,options){
                var returnData = "";
                var lengthStudents = students.length;
                for(var i=0; i<lengthStudents;i++){
                    // thêm và thay đổi một số giá trị cho mảng products được gửi từ view vào -
                    students[i].stt = i+1; // thêm số thứ tự
                    students[i].decorationclass = (i+1)%2==0 ? "even_row" : "odd_row"; //gán bằng class even_row nếu số thứ tự chia hết cho 2
                                                                                // ngược lại thì gán bằng odd_row
                                                                                // mục đích là để hiển thị
                    returnData += options.fn(students[i]);
                }
                return returnData;
            },
            notification_manager_show:myHelpers.notification_manager_show,
            accounts_manager_show:myHelpers.accounts_manager_show,
            change_password_show:myHelpers.change_password_show,
            showDepartmentForAccountSetting:myHelpers.showDepartmentForAccountSetting,
            showDepartmentForAccountInformation:myHelpers.showDepartmentForAccountInformation,
            showEditNotification:myHelpers.showEditNotification,
            showDepartmentsForEditNotification:myHelpers.showDepartmentsForEditNotification,
            showFilterManagerNotification:myHelpers.showFilterManagerNotification,
            showPaginationManagerNotifications:myHelpers.showPaginationManagerNotifications,
            showListNotifications:myHelpers.showListNotifications,
            showPaginationNotifications:myHelpers.showPaginationNotifications,
            showFilterNotifications:myHelpers.showFilterNotifications,
            showPosts:myHelpers.showPosts,
            showPostLocation:myHelpers.showPostLocation,
            showClassName:myHelpers.showClassName,
            showFilterManagerAccounts:myHelpers.showFilterManagerAccounts
        }
    }
))

// thiết lập cho passport

app.use(passport.initialize());// thông báo sử dụng passport
app.use(passport.session());

passport.serializeUser(function(username,done){ // chuyển dữ liệu từ tham số vào req.session.passport.user
                                                // được gọi khi xác thực thành công
                                                // tùy vào trường mà load dữ liệu ở database lên ở đây
                                                // chỉ chạy 1 lần khi xác thực thành công
    // alluser.push(username)
    // console.log(alluser)
    // console.log(username)
    // tìm tài khoản thông qua username
    
    // kiểm tra trùng đã thực hiện ở bước trước
    done(null,username)
})
passport.deserializeUser(async function(username,done){ // giải mã dữ liệu từ req.session.passport.user và gán vào req.user 
                                                // cứ khi gọi req.user thì hàm này sẽ được gọi
    // console.log("deserialize");
    var account = await accountsService.findOne({username:username}); // gọi ở đây để có thể liên tục cập nhật tài khoản
   
    done(null,account)
})





var storage  = multer.diskStorage({ // thiết lập nơi lưu trữ và tên file được lưu trữ
    filename:function(req,file,callback){ //callback thiết lập tên file
        callback(null,Date.now()+"_"+file.originalname);
    },
    destination:function(req,file,callback){ //callback thiết lập nơi lưu trữ
        callback(null,"public/img");
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
            callback(null,false);
        }
    },

    limits:{fileSize:1000000} // giới hạn file -- bé hơn 1mb
})



// thiết lập mongo database

var opts = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
};
const mongodbURL = process.env.MONGODB_URI || credentials.mongo.development.connectionString;
// kiểm tra môi trường hiên tại để thiết lập kết nối tương ứng  (môi trường được thiết lập ở trên)
// switch(app.get("env")){
//     case "development":{
//         mongoose.connect(mongodbURL,opts,connectmongoResult);
//         break;
//     }
//     case "production":{
//         mongoose.connect(mongodbURL,opts,connectmongoResult);
//         break;
//     }
//     default:{
//         mongoose.connect(mongodbURL,opts,connectmongoResult);
//     }
// }
 mongoose.connect(mongodbURL,opts,connectmongoResult);
var rolesCtr = require("./controllers/roles.js");
var departmentsCtr = require("./controllers/departments.js");
var accountsCtr = require("./controllers/accounts.js");
function connectmongoResult(err){
    if(err){
        console.log(err.message)
    }
    else{ // khi kết nối thành công thì đồng thời tạo một số dữ liệu cho database nếu database chưa có
        console.log("Connection to mongodb is successful")
        // thêm quyền trong hệ thống
       
        rolesCtr.add(); // tạo các quyền
        departmentsCtr.add(); // tạo các phòng-khoa
        accountsCtr.addAdmin(); // tạo tài khoản cho admin
    }
    
}







//sử dụng handlebars view engine 
app.set("view engine","handlebars");

// khi xử lý các url nếu có render ra view thì các view này sẽ được thêm vào {{{body}}} trong layout main
// lưu ý là các file view này phải được tạo ở thư mục gốc / views / các file view

app.use(function(req,res,next){
    // tạo một mảng người dùng và lưu vào req để tiện sử dụng cho socket
  
    
    
    next()
})


// thực hiện kết nối (ta chuyển lên đầu trước thay vì để ở cuối để thực hiện kết nối và chuẩn bị dữ liệu cho socket)
var server = app.listen(process.env.PORT || 3000,function(){
    console.log("Connecting to " + PORT);
})

var io = require('socket.io')(server);
//thiết lập một số thông số giữa passport và socketio để có thể kiểm tra đăng nhập rồi mới kết nối đến socket
const wrap = middleware => (socket, next) => middleware(socket.request, {}, next);

io.use(wrap(session));
io.use(wrap(passport.initialize()));
io.use(wrap(passport.session()));

//middleware kiểm tra đăng nhập -- nếu đăng nhập thì chuyển đến io.on("connect") bên dưới
io.use((socket, next) => {
    if (socket.request.user) { //lấy ra thông tin đăng nhập như req.user
        // console.log("UUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUUU")
        // console.log(socket.request.user)
      next();
    } else {
      next(new Error('unauthorized'))
    }
});
//kết nối đến client (đã kiểm tra đăng nhập ở middleware trên)
io.on('connect', (client) => {
    // console.log(`new connection ${client.id}`);
    // //trả thử về tất cả client
    // io.emit("newmess",{message:"OK"});
    //kết luận -- những client mà chưa đăng nhập vào thì sẽ không thể nào vượt qua được middleware ở trên
    //do đó không thể kết nối đến được socket ở đây
    // do vậy khi emit tin nhắn thì các client chưa kết nối đó cũng không thể nhận được
    // ==> làm các chức năng thông báo cho người dùng ở route khác thì lấy io từ req và gọi io.emit(somedata) là được
   //xem thêm link được dán trong tường nhà
});


app.use(function(req,res,next){
    // // Đăng ký các sự kiện của socket
    // io.on('connection', function(socket){
    //     socket.on("client-login-send-userid",function(data){
    //         console.log("userid: " + data)
    //         var userid = data;
    //         if(req.user && req.user._id){
    //             console.log(req.user)
    //             if(userid==req.user._id.toString() && !alluser.find(t=>t.toString()==userid)){
    //                 alluser.push(userid)
                    
    //                 console.log(alluser)
    //             }
    //         }
    //     })
    // });
    // var alluser = JSON.stringify(req.sessionStore.sessions)
    // alluser = JSON.parse(alluser)
    // console.log(alluser)
    req.myvars = {
        rootfolder : __dirname
    } // gán giá trị __dirname ở thư mục gốc của project để có thể sử dụng trong các route

    // gán io vào req để các route có thể sử dụng 
    req.io = io;
    next();
    
})


//Route index( localhost:3000)
const indexRoute = require("./routes/index.js");
app.use("/",indexRoute);



// // Route xử lý google sign in
// const verifyRoute = require("./routes/verify.js");
// app.use("/verify",verifyRoute);

//Route xác thực google sign in
const authRoute = require("./routes/auth.js");
app.use("/auth",authRoute(passport));


//Route đăng nhập
const loginRoute = require("./routes/login.js");
app.use("/login",loginRoute(passport));


//middleware kiểm tra tình trạng đăng nhập để thực hiện các route tiếp theo
app.use(function(req,res,next){ // kiểm tra xem có đăng nhập chưa để thực hiện các chức ở các route bên dưới
                                // ngược lại thì cchuyeenr ra trang login
    if(!req.user){
        // console.log("md2");
        return res.redirect("/login");
    }
    next();
})

//middleware dùng để thêm thông tin tài khoản từ session vào biến local
app.use(function(req,res,next){
    var user = req.user; // lấy dữ liệu user được deserializeUser từ local
    var account = {
        id: user._id,
        username: user.username,
        rolecode: user.rolecode,
        information:user.information,
        departresponsible: user.departresponsible.map(function(depart){
            return {
                id: depart._id,
                departname: depart.departname
            }
        })
    }
    // console.log("test home")
    // console.log(account)
    res.locals.account = account; // gán vào locals để sử dụng trong view template

    // thêm thông tin id tất cả người dùng để sử dụng cho những route sau đăng nhập
    // if(!alluser.find(t=>t==account.id.toString())){
    //     alluser.push(account.id.toString());
    // }
    // req.alluser=alluser;
    next()
})


//Route home
const homeRoute = require("./routes/home.js");
app.use("/home",homeRoute);


//Route đăng ký(dành cho admin)
const registerRoute = require("./routes/register.js");
app.use("/register",registerRoute);

//Route liên quan đến xử lý thông tin các tài khoản người dùng
const accountRoute = require("./routes/account.js");
app.use("/account",accountRoute);

//Route thông báo
const notificationRoute = require("./routes/notification.js");
app.use("/notification",notificationRoute);

//Route bài post
const postRoute = require("./routes/post.js");
app.use("/post",postRoute)


//Route tường nhà
const wallRoute = require("./routes/wall.js");
app.use("/wall",wallRoute);

//Route department
const departmentRoute = require("./routes/department.js");
app.use("/department",departmentRoute)

//Route quản lý
const managerRoute = require("./routes/manager.js");
app.use("/manager",managerRoute);

//Route đăng xuất
const logoutRoute = require("./routes/logout.js");
app.use("/logout",logoutRoute(alluser))
// app.get("/logout",function(req,res){
//     //xóa id người dùng trong mảng tất cả người dùng
//     //tìm vị trí trong mảng tất cả người dùng
//     // console.log(alluser)
//     var id = req.user._id.toString();
//     var index = alluser.findIndex(t=>t.toString()==id);
//     if(index >=0){
//         alluser.splice(index,1);
//     }
//     console.log(alluser)
//     delete req.session.passport.user;
//     res.redirect("/login");
// })





// xử lý url không được xử lý phía trên (không tồn tại trong hệ thống)
app.use(function(req,res,next){
    // res.status(404);
    // res.render("error",{
    //     errormess:"404 - Not Found Error"
    // })
    return next(createError(404,"Không tìm thấy trang"));
    
    
});



// hiển thị lỗi khi hệ thống có lỗi
app.use(function(err,req,res,next){
    var code = err.status || 500;
    var message = err.message
    
    res.status(code).render("error",{
        errormess: `${code} - Đã có lỗi xảy ra: ${message}`
    })
})

