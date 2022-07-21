const mongoose = require("mongoose");
const schema = mongoose.Schema;

var accountsSchema = schema({
    googleuserid:{type:schema.Types.String},
    username:{ /* tên tài khoản */
        type:String,
        require:[true,"Vui lòng nhập tài khoản"],
        
    },
    password:{ /* mật khẩu */
        type:String,
        require:[true,"Vui lòng nhập mật khẩu"],
        min:[6,"Mật khẩu phải ít nhất 6 kí tự"]
    },
    rolecode:{ /* quyền */
        type:String,
        require:[true,"Vui lòng thêm quyền tài khoản"],
        enum:["AM","SV","PK"]
    },
    email:{ /* email của tài khoản */
        type:String,
        require:[true,"Vui lòng thêm email cho tài khoản"],
       
    },
    information:{ /* thông tin để hiển thị */
        showname:{ /* tên để hiển thị */
            type:String,
            default:function(){
                return this.username;
            } /* mặc định là tên tài khoản -- dùng kiểu gọi function, rồi return mới lấy được */
        },
        classname:{ /* tên lớp */
            type:String,
            default: "Chưa cập nhật"
        },
        department:{type:schema.Types.ObjectId, ref:"Departments"},
        avatar:{ //đường dẫn đến ảnh đại diện (dành cho việc hiển thị)
            type:String,
            default:"/img/project/default_avatar.jpg"
        },
        path:{
            type:String // một đường dẫn tương đối (dùng để tương tác với dịch vụ lưu trữ)
        }
    },
    departresponsible:[ /* Phòng - Khoa phụ trách (dành cho tài khoản PK) */
        {type:schema.Types.ObjectId, ref:"Departments"}
    ],
    posts:[
        {type:schema.Types.ObjectId, ref:"Posts"}
    ],
    notifications:[ /* dành cho tài khoản PK và AM */
        {type:schema.Types.ObjectId, ref:"Posts"}
    ]
})

var accounts = mongoose.model("Accounts",accountsSchema);
module.exports=accounts;