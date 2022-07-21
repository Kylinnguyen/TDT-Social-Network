"use strict";

var fs = require("fs");

function deleteAllFileInTmp(req) {
  // hàm dùng để xóa hết file trong thư mục tạm nếu có
  var files = req.files;

  if (files.length) {
    files.forEach(function (file) {
      fs.unlinkSync(file.path);
    });
  }
}

function moveFiles(req, id, modelname) {
  //req dùng để lấy files từ req.files
  //id: id của bài viết hoặc thông báo (hoặc của một đối tượng nào đó)
  //modelname: tên của một đối tượng (ví dụ như: posts, notifications,...)
  var files = req.files;
  var pathToSaveArray = []; // mảng chưa đường dẫn để lưu vào csdl

  var originFileNameArray = []; // mảng chứa tên file lúc chưa chuyển đổi để hiển thị lên view cho đẹp

  files.forEach(function (file) {
    // tiếp đến là chuyển file mới up lên
    var oldPath = file.path;
    var originalname = file.originalname;
    var filename = file.filename; // file name

    var pathaccount = "public/".concat(modelname, "/").concat(id); // dùng để kiểm tra xem thư mục này có tồn tại không
    // nếu không thì tạo mới

    var newPath = "public/".concat(modelname, "/").concat(id, "/").concat(filename); // path để di chuyển file

    var pathToSave = "/".concat(modelname, "/").concat(id, "/").concat(filename); // path để lưu vào csdl
    //kiểm tra sự tồn tại của thư mục sắp lưu

    if (!fs.existsSync(pathaccount)) {
      // nếu đường dẫn chuỗi thư mục không có
      // thì tạo mới
      fs.mkdirSync(pathaccount, {
        recursive: true
      }); // thêm option đệ quy để tạo thư mục theo path(tạo nhiều thư mục)
    } // di chuyển file


    fs.renameSync(oldPath, newPath);
    pathToSaveArray.push(pathToSave); // thêm các đường dẫn để lưu vào csdl

    originFileNameArray.push(originalname); // thêm tên file ban đầu (lúc chưa chuyển đổi để hiển thị lên view)
  }); //trả về các đường dẫn để lưu vào csdl

  return [pathToSaveArray, originFileNameArray];
}

module.exports = {
  deleteAllFileInTmp: deleteAllFileInTmp,
  moveFiles: moveFiles
};