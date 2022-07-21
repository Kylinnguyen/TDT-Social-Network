const mongoose = require("mongoose");
const schema = mongoose.Schema;

var departmentsSchema = schema({
    departcode: { /* tên phòng khoa viết tắt */
        type: String,
        required: [true,"Vui lòng điền mã phòng-khoa"],
        validate:{ /* kiểm tra trùng */
            validator: function(value){
                return this.model("Departments").findOne({departcode:value}).exec().then(result=>{return result ? false : true})
            },
            message: function(props){
                return `Mã phòng-khoa ${props.value} đã tồn tại`;
            }
        }  
    },
    departname: { /* tên phòng khoa viết dài */
        type: String,
        required: [true,"Vui lòng điền mã tên phòng-khoa"],
        validate:{ /* kiểm tra trùng */
            
            validator: function(value){
                return this.model("Departments").findOne({departname:value}).exec().then(result=>{return result ? false : true})
            },
            message: function(props){
                return `Tên phòng-khoa ${props.value} đã tồn tại`;
            }
        }  
    },
    departtype:{ /* là phòng hay khoa */
        type: String,
        require:[true,"Vui lòng nhập kiểu Phòng hay khoa"],
        enum:["P","K"] /* chỉ giới hạn trong hai giá trị là P: Phòng hoặc K: khoa */
    }
})

var departments = mongoose.model("Departments",departmentsSchema);
module.exports=departments;