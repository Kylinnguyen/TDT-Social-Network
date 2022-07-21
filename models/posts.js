const mongoose = require("mongoose");
const schema = mongoose.Schema;


var postsSchema = schema({
    content:{ /* nội dung bài post */
        type:String
    },
    owner:{ /* chủ bài post */
        type:schema.Types.ObjectId, ref:"Accounts"
    },
    postdate:{/* thời gian đăng bài */
        type:Date,
        default:Date.now 
        // thời gian đăng bài  -- mặc định không thêm là lấy thời gian hiện tại
        // nhưng lưu ý rằng thời gian ta thêm vào hay mặc định thì
        // mongoose cũng đưa về dạng chuẩn UTC của nó (khác với thời gian vn hiện tại)
        // do đó khi truy vấn ta phải format nó lại định dạng việt nam (gợi ý dùng module moment)
    },
    comments:[ /* các comments của bài đăng */
        {
            owner:{ /* chủ comment */
                type:schema.Types.ObjectId, ref:"Accounts"
            },
            content:{ /* nội dung comment */
                type:String
            },
            commentdate:{ /* ngày comment */
                type:Date,
                default:Date.now
            }
        }
    ],
    attachedfiles:[ /* danh sách các file (hình ảnh, video) của bài đăng */
        {
            fileurl:{ /* đường dẫn đến file (dành cho việc hiển thị) */
                type:String
            },
            filetype:{ /* kiểu file (đường dẫn hình hoặc video) */
                type:String
            },
            filedate:{ /* ngày đăng */
                type:Date,
                default:Date.now
            },
            path:{
                type:String // một đường dẫn tương đối (dùng để tương tác với dịch vụ lưu trữ)
            }
        }
    ],
    
})

var posts = mongoose.model("Posts",postsSchema);
module.exports=posts;