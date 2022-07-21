"use strict";

var express = require("express");

var route = express.Router();

var createError = require("http-errors");

var accountsService = require("../services/accounts.js");

var postsService = require("../services/posts.js");

var myValid = require("../validations/my-validation.js");

var validationResult = myValid.validationResult;

var multer = require("multer");

var path = require("path");

var fs = require("fs");

var basehandle = require("../handles/base-handles.js"); // file chứa một hàm xử lý các vấn đề chung


var moment = require("moment");

moment.locale("vi"); //origin: /post

route.use(function (req, res, next) {
  next();
});
var storage = multer.diskStorage({
  // thiết lập nơi lưu trữ và tên file được lưu trữ
  filename: function filename(req, file, callback) {
    //callback thiết lập tên file
    callback(null, Date.now() + "_" + file.originalname);
  },
  destination: function destination(req, file, callback) {
    //callback thiết lập nơi lưu trữ tạm thời
    // đường link tính từ thư mục gốc của project
    callback(null, "public/tmp/");
  }
});
var upload = multer({
  storage: storage,
  // thiết lập lưu trữ (nơi lưu trữ và tên file được lưu trữ)
  fileFilter: function fileFilter(req, file, callback) {
    //callback lưu file
    // xử lý file trước khi di chuyển
    // console.log(path.extname(file.originalname))
    if (file.mimetype.startsWith("image/")) {
      // kiểm tra xem có phải file ảnh không ?
      // phải thì cho phép upload
      callback(null, true); // callback là đại diện cho hàm upload file của multer nếu true thì cho phép upload file
      // ngược lại nếu false là sẽ k upload
    } else {
      callback(new Error("File không đúng định dạng hình ảnh"), false); // sai định dạng file thì tạo một lỗi mới
      // hàm xử lý file sẽ bắt được lỗi này (xem phần add sản phẩm)
    }
  },
  limits: {
    fileSize: 10000000
  } // giới hạn file -- bé hơn 10mb

}); // xử lý form của bài post -- xử lý file trước

function handleFilesPostUpload(req, res, next) {
  var uploadResult = upload.array("imgs"); //xử lý mảng hình có name imgs

  uploadResult(req, res, function (err) {
    if (err) {
      // nếu có lỗi file thì trả về json lỗi
      return res.status(400).json({
        code: 400,
        message: err.message
      });
    } // nếu không có lỗi gì thì qua hàm kế tiếp theo
    // console.log(req.files)


    next();
  });
} //hàm kiểm tra và convert một url youtube thành một embed youtube
// nếu không phải một url youtube thì không trả về gì


function convertYoutubeUrl(url) {
  var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  var match = url.match(regExp); // kiểm tra xem có phải link youtube không

  if (match && match[2].length == 11) {
    // nếu phải
    return match[2]; // trả về id của link youtube này
  } else {
    // nếu không phải
    return;
  }
} // kiểm tra các phần còn lại của post như content - video link


function handlePostsUpload(req, res, next) {
  var _req$body = req.body,
      videos = _req$body.videos,
      content = _req$body.content; // vì có nhiều liên kết videos nên tham số đến là một mảng
  // kiểm tra content trước 

  if (!content || content.trim().length <= 0) {
    // đồng thời xóa hết file trong thư mục tạm (nếu có)
    basehandle.deleteAllFileInTmp(req);
    return res.status(400).json({
      code: 400,
      message: "Vui lòng nhập nội dung bài viết"
    });
  } // tiếp theo là kiểm tra từng liên kết youtube trong mảng youtube (nếu có)


  if (videos && videos.length) {
    var n = videos.length;

    for (var i = 0; i < n; i++) {
      var videolink = videos[i]; // kiểm tra youtube url

      if (!convertYoutubeUrl(videolink)) {
        // đồng thời xóa hết file trong thư mục tạm (nếu có)
        basehandle.deleteAllFileInTmp(req);
        return res.status(400).json({
          code: 400,
          message: "Li\xEAn k\u1EBFt ".concat(videolink, " kh\xF4ng ph\u1EA3i m\u1ED9t li\xEAn k\u1EBFt youtube, vui l\xF2ng ch\u1ECDn li\xEAn k\u1EBFt kh\xE1c")
        });
      }
    }
  }

  next();
} // đã trải qua 2 handle xử lý file hình và xử lý nội dung trước khi đến đây


route.post("/add", handleFilesPostUpload, handlePostsUpload, function _callee2(req, res) {
  var _req$body2, videos, content, files, id, value, post, result, pathToSaveArray, i, valuefile;

  return regeneratorRuntime.async(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          // console.log("pô")
          // nếu không có lỗi gì thì sẽ đến được đây
          // ta tiến hành thêm bài post vào csdl
          // lấy dữ liệu ra
          _req$body2 = req.body, videos = _req$body2.videos, content = _req$body2.content;
          files = req.files; // // lấy ra id của người dùng

          id = req.user._id; // thêm vào csdl content, videos link, người dùng trước để có id tạo thư mục
          //chuẩn bị dữ liệu

          value = {
            content: content,
            // nội dung bài post
            owner: id // người gửi bài post

          }; // thêm vào csdl

          _context2.next = 6;
          return regeneratorRuntime.awrap(postsService.add(value));

        case 6:
          post = _context2.sent;

          if (post) {
            _context2.next = 9;
            break;
          }

          return _context2.abrupt("return", res.status(500).json({
            code: 500,
            message: "Đã xảy ra lỗi trong quá trình đăng bài, vui lòng thử lại"
          }));

        case 9:
          //nếu không bị lỗi thì tiến hành di chuyển file hình và thêm đường dẫn vào csdl (nếu có)
          if (files.length) {
            result = basehandle.moveFiles(req, post._id, "posts");
            pathToSaveArray = result[0]; // mảng đường dẫn để lưu vào csdl
            // thực hiện lưu vào csdl

            for (i = 0; i < pathToSaveArray.length; i++) {
              valuefile = {
                // chuẩn bị dữ liệu
                fileurl: pathToSaveArray[i],
                // đường dẫn
                filetype: "image" // kiểu file đính kèm là hình ảnh

              }; // push vào post đã tạo ở trên

              post.attachedfiles.push(valuefile);
            }
          }

          if (videos && videos.length) {
            // thêm dữ liệu các đường dẫn video youtube
            videos.forEach(function (videolink) {
              post.attachedfiles.push({
                fileurl: videolink,
                filetype: "video" // kiểu file đính kèm là video

              });
            });
          } // xong rồi save lại


          post.save().then(function _callee(result) {
            var postVal, postnew;
            return regeneratorRuntime.async(function _callee$(_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    if (!result) {
                      _context.next = 8;
                      break;
                    }

                    _context.next = 3;
                    return regeneratorRuntime.awrap(postsService.findPost({
                      _id: result._id
                    }));

                  case 3:
                    postVal = _context.sent;
                    // map lại dữ liệu
                    postnew = {
                      id: postVal._id,
                      content: postVal.content,
                      owner: {
                        id: postVal.owner._id,
                        information: {
                          showname: postVal.owner.information.showname,
                          avatar: postVal.owner.information.avatar
                        }
                      },
                      postdate: moment(postVal.postdate).format("LLL"),
                      attachedfiles: postVal.attachedfiles.map(function (file) {
                        return {
                          id: file.id,
                          fileurl: file.fileurl,
                          filetype: file.filetype
                        };
                      })
                    };
                    res.status(200).json({
                      code: 200,
                      message: "Đăng bài thành công",
                      data: postnew
                    });
                    _context.next = 9;
                    break;

                  case 8:
                    res.status(500).json({
                      code: 500,
                      message: "Đã xảy ra lỗi khi đăng bài"
                    });

                  case 9:
                  case "end":
                    return _context.stop();
                }
              }
            });
          })["catch"](function (err) {
            console.log(err);
            res.status(500).json({
              code: 500,
              message: "Đã xảy ra lỗi khi đăng bài"
            });
          }); // res.status(200).json({
          //             code:200,
          //             message:"Ok"
          //         })

        case 12:
        case "end":
          return _context2.stop();
      }
    }
  });
}); //thực hiện edit

route.post("/edit", handleFilesPostUpload, handlePostsUpload, function _callee3(req, res) {
  var _req$body3, id, content, videos, videosdelete, imagesdelete, files, userid, rolecode, filter, post, result, pathToSaveArray, i, valuefile;

  return regeneratorRuntime.async(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _req$body3 = req.body, id = _req$body3.id, content = _req$body3.content, videos = _req$body3.videos, videosdelete = _req$body3.videosdelete, imagesdelete = _req$body3.imagesdelete;
          files = req.files; //lấy ra id người dùng hiện tại

          userid = req.user._id; //lấy ra quyền người dùng

          rolecode = req.user.rolecode; // console.log("id "+ id);
          // console.log("content "+ content)
          // if(videosdelete && videosdelete.length){
          //     console.log("videosdelete")
          //     console.log(videosdelete)
          // }
          // if(imagesdelete && imagesdelete.length){
          //     console.log("imagesdelete")
          //     console.log(imagesdelete)
          // }
          // if(files.length){
          //     console.log(files)
          // }
          // res.status(200).json({
          //     code:200,
          //     message:"ok"
          // })
          //kiểm tra sự tồn tại của bài đăng (lẫn id của bài đăng và kiểm tra chủ nhân của bài đăng có đúng là người đang thực hiện không)

          //nếu người dùng là AM thì không cần kiểm tra chủ nhân -- chỉ cần kiểm tra sự tồn tại
          if (rolecode == "AM") {
            filter = {
              _id: id
            };
          } else {
            // ngược lại không phải AM thì phải kiểm tra chủ nhân bài viết
            filter = {
              _id: id,
              owner: userid
            };
          }

          _context3.next = 7;
          return regeneratorRuntime.awrap(postsService.findPost(filter));

        case 7:
          post = _context3.sent;

          if (post) {
            _context3.next = 11;
            break;
          }

          //nếu không có bài viết thì có nghĩa bài viết không tồn tại hoặc người đang thực hiện chỉnh sửa không phải chủ nhân bài viết
          //xóa đi các file tạm
          basehandle.deleteAllFileInTmp(req);
          return _context3.abrupt("return", res.status(404).json({
            code: 404,
            message: "Không tìm thấy bài viết cần sửa"
          }));

        case 11:
          //lưu nội dung mới
          post.content = content; //tiến hành sửa lại nội dung cũng như thêm file
          //tiến hành xóa đi những videos link muốn xóa trước (nếu có)

          if (videosdelete && videosdelete.length) {
            videosdelete.forEach(function (videoid) {
              // lấy ra vị trí của video cần xóa trong mảng
              var index = post.attachedfiles.findIndex(function (t) {
                return t._id.toString() == videoid;
              });

              if (index >= 0) {
                // nếu có vị trí thì xóa trong mảng
                post.attachedfiles.splice(index, 1);
              }
            });
          } //tiến hành xóa đi những images muốn xóa (nếu có)


          if (imagesdelete && imagesdelete.length) {
            imagesdelete.forEach(function (imageid) {
              // lấy ra image cần xóa trong mảng
              var image = post.attachedfiles.find(function (t) {
                return t._id.toString() == imageid;
              }); // nếu image có tồn tại

              if (image) {
                // kiểm tra xem có tồn tại cái đường dẫn thư mục đến file hay không ?
                var pathToDelete = "public" + image.fileurl;

                if (fs.existsSync(pathToDelete)) {
                  // nếu có thì xóa
                  fs.unlinkSync(pathToDelete);
                }
              } //lấy ra vị trí image cần xóa trong mảng


              var index = post.attachedfiles.findIndex(function (t) {
                return t._id.toString() == imageid;
              });

              if (index >= 0) {
                post.attachedfiles.splice(index, 1);
              }
            });
          } //tiến hành di chuyển file hình và thêm đường dẫn hình vào (nếu có)


          if (files.length) {
            result = basehandle.moveFiles(req, post._id, "posts");
            pathToSaveArray = result[0]; // mảng đường dẫn để lưu vào csdl
            // thực hiện lưu vào csdl

            for (i = 0; i < pathToSaveArray.length; i++) {
              valuefile = {
                // chuẩn bị dữ liệu
                fileurl: pathToSaveArray[i],
                // đường dẫn
                filetype: "image" // kiểu file đính kèm là hình ảnh

              }; // push vào post đã tạo ở trên

              post.attachedfiles.push(valuefile);
            }
          } //tiến hành thêm link youtube mới (nếu có)


          if (videos && videos.length) {
            // thêm dữ liệu các đường dẫn video youtube
            videos.forEach(function (videolink) {
              post.attachedfiles.push({
                fileurl: videolink,
                filetype: "video" // kiểu file đính kèm là video

              });
            });
          } //sau đó save lại và trả về cho người dùng


          post.save().then(function (result) {
            if (result) {
              // result này đã có populate chủ nhân bài viết
              // console.log(result);
              var postVal = result; // map lại dữ liệu

              var postnew = {
                id: postVal._id,
                content: postVal.content,
                owner: {
                  id: postVal.owner._id,
                  information: {
                    showname: postVal.owner.information.showname,
                    avatar: postVal.owner.information.avatar
                  }
                },
                postdate: moment(postVal.postdate).format("LLL"),
                attachedfiles: postVal.attachedfiles.map(function (file) {
                  return {
                    id: file.id,
                    fileurl: file.fileurl,
                    filetype: file.filetype
                  };
                })
              };
              return res.status(200).json({
                code: 200,
                message: "Sửa lại bài viết thành công",
                data: postnew
              });
            } else {
              return res.status(400).json({
                code: 400,
                message: "Đã xảy ra lỗi trong quá trình chỉnh sửa bài viết"
              });
            }
          })["catch"](function (err) {
            return res.status(400).json({
              code: 400,
              message: "Đã xảy ra lỗi trong quá trình chỉnh sửa bài viết"
            });
          });

        case 17:
        case "end":
          return _context3.stop();
      }
    }
  });
}); // thực hiện xóa bài post

route.post("/delete/:id", function _callee4(req, res) {
  var id, userid, rolecode, post, result, postDirectory;
  return regeneratorRuntime.async(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          //lấy ra id của bài viết
          id = req.params.id; //lấy ra id người dùng hiện tại

          userid = req.user._id; //lấy ra quyền người dùng

          rolecode = req.user.rolecode; //lấy bài viết ra từ csdl để kiểm tra xem sự tồn tại và quyền hạn người xóa

          if (rolecode == "AM") {
            //nếu là AM thì chỉ cần kiểm tra sự tồn tại
            filter = {
              _id: id
            };
          } else {
            // ngược lại không phải AM thì phải kiểm tra chủ nhân bài viết
            filter = {
              _id: id,
              owner: userid
            };
          }

          _context4.next = 6;
          return regeneratorRuntime.awrap(postsService.findPost(filter));

        case 6:
          post = _context4.sent;

          if (post) {
            _context4.next = 10;
            break;
          }

          //nếu không có bài viết thì có nghĩa bài viết không tồn tại hoặc người đang thực hiện chỉnh sửa không phải chủ nhân bài viết
          //xóa đi các file tạm
          basehandle.deleteAllFileInTmp(req);
          return _context4.abrupt("return", res.status(404).json({
            code: 404,
            message: "Không tìm thấy bài viết cần xóa"
          }));

        case 10:
          _context4.next = 12;
          return regeneratorRuntime.awrap(postsService.deletePost({
            _id: id
          }));

        case 12:
          result = _context4.sent;

          if (!(result && result.ok === 1)) {
            _context4.next = 20;
            break;
          }

          // thì tiến hành xóa thư mục của bài post này (dựa theo id)
          postDirectory = "public/posts/".concat(id);

          if (fs.existsSync(postDirectory)) {
            // kiểm tra tồn tại của thư mục trước khi xóa
            // gọi câu lệnh để xóa thư mục và toàn bộ file trong thư mục
            fs.rmdirSync(postDirectory, {
              recursive: true
            });
          } //gửi thông báo đên user là vừa có một thông báo bị xóa (xem xét lại có nên sử dụng không ?)
          //có thể một vài user sẽ bị lỡ mất thông báo này


          sendDeletePostToAllUser(req);
          return _context4.abrupt("return", res.status(200).json({
            code: 200,
            message: "Xóa thành công"
          }));

        case 20:
          return _context4.abrupt("return", res.status(400).json({
            code: 400,
            message: "Xóa bài post thất bại, vui lòng thử lại"
          }));

        case 21:
        case "end":
          return _context4.stop();
      }
    }
  });
}); //hàm thực hiện gửi thông báo đến các user là vừa có một thông báo bị xóa
//để user cập nhật lại biến skip ( postslength) để load timeline cho chính xác hơn
// không cần phải gửi thông tin post nào bị xóa vì nó sẽ làm ảnh hưởng giao diện nếu như ta tiến hành xóa ngay trên giao diện

function sendDeletePostToAllUser(req) {
  var io, alluser;
  return regeneratorRuntime.async(function sendDeletePostToAllUser$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          //lấy ra socketio
          io = req.io; //lấy ra mảng id của tất cả người dùng đang đăng nhập

          alluser = req.alluser; //tiến hành gửi

          alluser.forEach(function (userid) {
            //gửi thông báo cho io nào ở client đang kết nối đến comment và chờ sự kiện server-send-delete-post-${userid}
            io.of("/post").emit("server-send-delete-post-".concat(userid), {
              message: "delete post"
            });
          });

        case 3:
        case "end":
          return _context5.stop();
      }
    }
  });
} // thực hiện lấy bài posts (có thể lấy 1 hoặc nhiều tùy vào người dùng muốn skip bao nhiêu)


route.get("/get", function _callee5(req, res) {
  var skipval, limitval, userid, sortval, filter, postsVal, posts;
  return regeneratorRuntime.async(function _callee5$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          skipval = req.query.skip;
          limitval = req.query.limit;
          userid = req.query.userid;
          sortval = {
            postdate: -1
          }; // console.log(skipval)

          filter = {}; // nếu có thêm id người dùng thì gán vào filter

          if (userid && userid !== "undefined") {
            // console.log(userid)
            filter["owner"] = userid;
          } //kiểm tra 2 giá trị skipval và limitval có phải số không ?


          if (isNaN(skipval) || isNaN(limitval)) {
            skipval = 0;
            limitval = 0;
          } //nếu phải thì parse tụi nó thành số


          skipval = Number(skipval);
          limitval = Number(limitval); //kiểm tra 2 giá trị skipval và limitval có phải số nguyên không

          if (!Number.isInteger(skipval) || !Number.isInteger(limitval)) {
            // không phải thì gán = 0 coi như người dùng không muốn dùng đến skip và limit
            skipval = 0;
            limitval = 0;
          } //nếu 2 số này âm thì cũng không hợp lệ


          if (!(skipval < 0 || limitval < 0)) {
            _context6.next = 12;
            break;
          }

          return _context6.abrupt("return", res.status(400).json({
            code: 400,
            message: "Giá trị không hợp lệ"
          }));

        case 12:
          _context6.next = 14;
          return regeneratorRuntime.awrap(postsService.findPostsWithoutComments(filter, skipval, limitval, sortval));

        case 14:
          postsVal = _context6.sent;
          //map dữ liệu
          posts = postsVal.map(function (post) {
            return {
              id: post.id,
              content: post.content,
              owner: {
                id: post.owner.id,
                information: {
                  showname: post.owner.information.showname,
                  avatar: post.owner.information.avatar
                }
              },
              postdate: moment(post.postdate).format("LLL"),
              attachedfiles: post.attachedfiles.map(function (file) {
                return {
                  id: file.id,
                  fileurl: file.fileurl,
                  filetype: file.filetype
                };
              })
            };
          }); //gửi lại

          return _context6.abrupt("return", res.status(200).json({
            code: 200,
            message: "Lấy dữ liệu thành công",
            data: posts
          }));

        case 17:
        case "end":
          return _context6.stop();
      }
    }
  });
}); //thực hiện lấy comments (dựa theo id bài post)

route.get("/comment/:id", function _callee6(req, res) {
  var id, post, commentsVal, comments;
  return regeneratorRuntime.async(function _callee6$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          //id của bài viết muốn lấy comment
          id = req.params.id; // kiểm tra sự tồn tại của bài viết

          _context7.next = 3;
          return regeneratorRuntime.awrap(postsService.findPost({
            _id: id
          }));

        case 3:
          post = _context7.sent;

          if (post) {
            _context7.next = 6;
            break;
          }

          return _context7.abrupt("return", res.status(404).json({
            code: 404,
            message: "Không tìm thấy bài viết"
          }));

        case 6:
          //nếu tồn tại thì lấy ra toàn bộ comments của bài viết
          commentsVal = post.comments; //map lại dữ liệu

          comments = commentsVal.map(function (comment) {
            return {
              id: comment._id,
              postid: id,
              // id của bài post
              owner: {
                id: comment.owner.id,
                information: {
                  showname: comment.owner.information.showname,
                  avatar: comment.owner.information.avatar
                }
              },
              content: comment.content,
              commentdate: moment(comment.commentdate).fromNow()
            };
          }); //trả về dữ liệu

          return _context7.abrupt("return", res.status(200).json({
            code: 200,
            message: "Lấy comment thành công",
            data: comments
          }));

        case 9:
        case "end":
          return _context7.stop();
      }
    }
  });
}); // thực hiện comment

route.post("/comment/:id", function _callee7(req, res) {
  var id, commentContent, post, userid, comment, commentnew;
  return regeneratorRuntime.async(function _callee7$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          //id của bài viết được comment
          id = req.params.id; //lấy ra nội dung comment

          commentContent = req.body.content; //nếu nội dung trống hay không tồn tại thì báo lỗi

          if (!(!commentContent || commentContent.trim().length <= 0)) {
            _context8.next = 4;
            break;
          }

          return _context8.abrupt("return", res.status(400).json({
            code: 400,
            message: "Nội dung comment không hợp lệ"
          }));

        case 4:
          _context8.next = 6;
          return regeneratorRuntime.awrap(postsService.findPost({
            _id: id
          }));

        case 6:
          post = _context8.sent;

          if (post) {
            _context8.next = 9;
            break;
          }

          return _context8.abrupt("return", res.status(404).json({
            code: 404,
            message: "Bài viết muốn comment không tồn tại"
          }));

        case 9:
          // nếu tồn tại thì thêm nội dung comment vào
          //lấy ra id người comment (là chính người dùng đang đăng nhập)
          userid = req.user._id;
          comment = {
            owner: userid,
            // chủ nhân comment
            content: commentContent // nội dung comment

          };
          post.comments.push(comment); // sau khi push thì comment đã được thêm (được tạo id cũng như các thông tin default)
          // nên ta sẽ lấy phần tử cuối cùng trong mảng comments của post vì nó là comment ta vừa mới thêm
          // lưu ý là nội dung comment mới này có cái owner chưa được populate nhưng ta có thể gán owner bằng thông tin đăng nhập hiện tại

          commentnew = post.comments[post.comments.length - 1]; // console.log(commentnew);
          // console.log("populate ne")
          // await commentnew.populate("owner").execPopulate()
          // .then(result=>{
          //     console.log(result)
          // })
          // .catch(err=>{
          //     console.log(err);
          // })
          // xong rồi thì save lại

          post.save().then(function (result) {
            if (result) {
              // console.log("result comment")
              // console.log(result);
              //lấy thêm thông tin người dùng đăng nhập hiện tại (là chủ nhân comment này)
              var information = req.user.information; //dữ liệu comment để gửi lại cho người dùng

              var commentToSend = {
                id: commentnew._id,
                //id comment
                postid: id,
                // id của bài post
                content: commentnew.content,
                commentdate: moment(commentnew.commentdate).fromNow(),
                owner: {
                  id: userid,
                  information: {
                    showname: information.showname,
                    avatar: information.avatar
                  }
                }
              }; // gọi hàm gửi comment đến người dùng khác (hàm này bất đồng bộ)

              sendCommentToAllUser(req, commentToSend);
              return res.status(200).json({
                code: 200,
                message: "Comment thành công",
                data: commentToSend
              });
            } else {
              return res.status(500).json({
                code: 500,
                message: "Đã xảy ra lỗi khi thực hiện comment"
              });
            }
          })["catch"](function (err) {
            return res.status(500).json({
              code: 500,
              message: "Đã xảy ra lỗi khi thực hiện comment"
            });
          });

        case 14:
        case "end":
          return _context8.stop();
      }
    }
  });
}); //việc gửi nên được đặt trong một hàm bất đồng bộ

function sendCommentToAllUser(req, commentToSend) {
  var io, alluser;
  return regeneratorRuntime.async(function sendCommentToAllUser$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          //lấy ra socketio
          io = req.io; //lấy ra mảng id của tất cả người dùng đang đăng nhập

          alluser = req.alluser; //tiến hành gửi

          alluser.forEach(function (userid) {
            //gửi thông báo cho io nào ở client đang kết nối đến comment và chờ sự kiện server-send-new-comment-${userid}
            io.of("/comment").emit("server-send-new-comment-".concat(userid), commentToSend);
          });

        case 3:
        case "end":
          return _context9.stop();
      }
    }
  });
} //thực hiện xóa một comment


route.post("/deletecomment/:id", function _callee8(req, res) {
  var postid, commentid, rolecode, userid, post, comment, ownercommentid, indexToDelete;
  return regeneratorRuntime.async(function _callee8$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          //lấy ra id của bài post
          postid = req.params.id; //lấy ra id của comment

          commentid = req.body.commentid; //lấy ra quyền người dùng hiện tại

          rolecode = req.user.rolecode; //lấy ra id người dùng hiện tại

          userid = req.user._id; // kiểm tra sự tồn tại của bài viết

          _context10.next = 6;
          return regeneratorRuntime.awrap(postsService.findPost({
            _id: postid
          }));

        case 6:
          post = _context10.sent;

          if (post) {
            _context10.next = 9;
            break;
          }

          return _context10.abrupt("return", res.status(404).json({
            code: 404,
            message: "Bài viết muốn xóa comment không tồn tại"
          }));

        case 9:
          //kiểm tra sự tồn tại của comment
          // tìm comment trong mảng comments của post
          comment = post.comments.find(function (t) {
            return t._id.toString() == commentid;
          });

          if (comment) {
            _context10.next = 12;
            break;
          }

          return _context10.abrupt("return", res.status(404).json({
            code: 404,
            message: "Comment không tồn tại"
          }));

        case 12:
          if (!(rolecode !== "AM")) {
            _context10.next = 16;
            break;
          }

          // lấy ra id của chủ comment
          ownercommentid = comment.owner._id; //so sánh với id người dùng đang đăng nhập
          //nếu phải chủ nhân comment thì báo lỗi liền ^^

          if (!(ownercommentid.toString() !== userid.toString())) {
            _context10.next = 16;
            break;
          }

          return _context10.abrupt("return", res.status(400).json({
            code: 400,
            message: "Không thể xóa comment"
          }));

        case 16:
          //nếu không có lỗi thì xóa comment trong mảng post
          //lấy vị trí comment
          indexToDelete = post.comments.findIndex(function (t) {
            return t._id.toString() == commentid;
          }); //xóa trong mảng comments

          post.comments.splice(indexToDelete, 1); //save lại

          post.save().then(function (result) {
            if (result) {
              // console.log(result)
              return res.status(200).json({
                code: 200,
                message: "Xóa comment thành công",
                data: {
                  // trả về dữ liệu comment bị xóa
                  commentid: commentid
                }
              });
            }

            return res.status(500).json({
              code: 500,
              message: "Xóa comment thất bại"
            });
          })["catch"](function (err) {
            return res.status(500).json({
              code: 500,
              message: "Xóa comment thất bại"
            });
          });

        case 19:
        case "end":
          return _context10.stop();
      }
    }
  });
});
module.exports = route;