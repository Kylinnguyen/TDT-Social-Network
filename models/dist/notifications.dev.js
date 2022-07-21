"use strict";

var mongoose = require("mongoose");

var schema = mongoose.Schema;
var notificationsSchema = schema({
  title: {
    /* tiêu đề thông báo */
    type: String,
    required: [true, "Vui lòng nhập tiêu đề thông báo"]
  },
  content: {
    /* nội dung thông báo */
    type: String,
    required: [true, "Vui lòng nhập nội dung thông báo"]
  },
  // owner:{ /* chủ bài thông báo */
  //     type:schema.Types.ObjectId, ref:"Accounts"
  // },
  notificationdate: {
    /* thời gian đăng thông báo */
    type: Date,
    "default": Date.now
  },
  department: {
    /* thuộc phòng - khoa nào */
    type: schema.Types.ObjectId,
    ref: "Departments"
  },
  files: [
  /* các file của thông báo */
  {
    fileurl: {
      /* đường dẫn tương đối của file */
      type: String
    },
    originfilename: {
      /* hiển thị tên file ban đầu không có chỉnh sửa gì để hiển thị cho đẹp*/
      type: String
    },
    filedate: {
      /* ngày đăng file */
      type: Date,
      "default": Date.now
    }
  }]
});
var notifications = mongoose.model("Notifications", notificationsSchema);
module.exports = notifications;