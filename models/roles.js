const mongoose = require("mongoose");
const schema = mongoose.Schema;

var rolesSchema = schema({
    rolecode:{ /* tên quyền viết tắt (AM-SV-PK) */
        type: String,
        required:[true,"Vui lòng nhập mã quyền"],
        /* custom kiểm tra lỗi (validation custom) */
        validate:{ /* lưu ý rằng unique trong mongoose k phải một validation -- tuy nó cũng báo lỗi là trùng
                    dữ liệu nhưng không thể khiến nó trả về tin nhắn lỗi -- do đó ta có thể custom theo kiểu này */
            validator : function(value){ /* thực hiện kiểm tra giá trị vào */
                /* câu lệnh dưới là kiểm tra xem có tồn tại rolecode hay chưa -- nếu tồn tại trả về false ngược lại
                                                                                            chưa tồn tại là true */
                return this.model("Roles").findOne({rolecode:value}).exec().then(result=>{return result ? false : true});
            },
            /* message lỗi này sẽ xảy ra khi validator ở trên trả về false, lúc này props.value tương ứng với giá trị đầu vào */
            message: props => `Mã quyền: ${props.value} đã tồn tại`
        }
    },
    rolename:{ /* tền quyền viết dài */
        type: String,
        required:[true,"Vui lòng nhập tên quyền"],
        validate:{ /* kiểm tra trùng lặp */
            validator: function(value){
                return this.model("Roles").findOne({rolename:value}).exec().then(result=>{return result ? false : true});
            },
            message: props => `Tên quyền: ${props.value} đã tồn tại`
        }
    }
})

var Roles = mongoose.model("Roles",rolesSchema)

module.exports=Roles;