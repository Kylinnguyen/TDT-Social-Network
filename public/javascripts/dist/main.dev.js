"use strict";

$(document).ready(startweb);
var options = 0; // 0 là chưa chọn options nào -- 1 là hình ảnh -- 2 là video

var edit_options = 0; // 0 là chưa chọn options nào -- 1 là hình ảnh -- 2 là video

var reader_information_image = new FileReader(); // dùng để cho việc đọc hình ảnh trước khi upload

var reader_information_images_edit_posts = new FileReader();
var ionotification = io.connect("/home"); //  chỉ tương tác với socket có of("/home") trên server

var iocomment = io.connect("/comment"); // chỉ tương tác với socket có of("/comment") trên server

var iopost = io.connect("/post"); // chỉ tương tác với socket có of("/post") trên server

var socket = io();
var socketlogin = io();
var filesToUpload = []; // mảng chứa file để upload lên server (tạo mảng riêng thế này để người dùng có thể tương tác tốt hơn)

var filesToUploadEdit = []; // mảng chứa file để upload lên server khi chỉnh sửa (tạo mảng riêng thế này để người dùng có thể tương tác tốt hơn)

var idImagesToDelete = []; // mảng chứa id của những tấm hình đã up lên server sẽ bị xóa khi nhấn vào nút xóa lúc chỉnh sửa

var idVideosToDelete = []; // mảng chứa id của những videos link đã up lên server sẽ bị xóa khi nhấn vào nút xóa lúc chỉnh sửa

var loadingTimeline = 0; // biến để kiểm tra xem có phải là đang loadtimeline không ?

function startweb() {
  console.log("start"); // khi click vào cái input của khung đăng bài thì hiện lên một form để đăng bài

  $(".click-to-new-post").bind("click", function (event) {
    event.preventDefault();
    WhenClickToNewPost();
  }); //khi click vào nút hình ảnh trong phần tạo bài đăng thì ẩn đi lựa chọn video và hiển thị lựa chọn hình ảnh
  // $("#post-img-options").bind("click",function(){
  //     HideVideoInput();
  //     ShowImgInput();
  //     options=1;
  // })
  //khi click vào nút video trong phần chỉnh sửa bài đăng thì ẩn đi lựa chọn hình ảnh và hiển thị lựa chọn video
  // $("#post-video-options").bind("click",function(){
  //     HideImgInput();
  //     ShowVideoInput();
  //     options=2;
  // })
  //khi click vào nút hình ảnh trong phần chỉnh sửa bài đăng thì ẩn đi lựa chọn video và hiển thị lựa chọn hình ảnh
  // $("#edit-post-img-options").bind("click",function(){
  //     HideEditVideoInput();
  //     ShowEditImgInput();
  //     edit_options=1;
  // })
  //khi click vào nút video trong phần tạo bài đăng thì ẩn đi lựa chọn hình ảnh và hiển thị lựa chọn video
  // $("#edit-post-video-options").bind("click",function(){
  //     HideEditImgInput();
  //     ShowEditVideoInput();
  //     edit_options=2;
  // })
  // // khi nhấn vào nút xóa một bài đăng
  // $(".deletepost").bind("click",function(event){
  //     event.preventDefault(); // ngưng các hđ hiện tại lại
  //     ShowPostDeleteConfirm(this);
  // })
  // // khi nhấn vào nút chỉnh sửa một bài đăng
  // $(".editpost").bind("click",function(event){
  //     event.preventDefault(); // ngưng các hđ hiện tại lại
  //     ShowPostEditConfirm(this);
  // })
  // // khi nhấn vào nút xóa một comment
  // $(".deletecomment").bind("click",function(event){
  //     event.preventDefault(); // ngưng các hđ hiện tại lại
  //     ShowCommentDeleteConfirm(this);
  // })

  try {
    // hàm ẩn đi alert thông báo về có thông báo mới sau 800 mili giây (đã sử dụng nhưng phải sửa lại cho tự động hóa)
    hideNotificationNotify();
  } catch (e) {} // khi màn hình scroll thì xử lý ẩn - hiện một số thành phần trên header (đã sử dụng)


  $(window).on("scroll", ChangeHeaderWhenScroll); // khi nhấn nút xóa file đính kèm của thông báo

  $(".deleteattachnotificationfile").bind("click", function (event) {
    event.preventDefault();
    ShowAttachNotificationFileDeleteConfirm(this);
  }); // $("#delete-notification").bind("click",function(event){
  //     console.log("dsfdfdsfdsf");
  //     event.preventDefault();
  //     ShowNotificationDeleteConfirm(this);
  // })
  // //khi nhấn nút sửa thông báo
  // $("#edit-notification").bind("click",function(){
  //     ShowNotificationEditConfirm(this);
  // })
  // khi upload file hình ảnh (ở chỗ thay đổi thông tin cá nhân) thì cho phép hiện lên xem trước khi up lên server (đã sử dụng)

  $("#information-files-input").bind("change", function () {
    showImageBefor(this); // gọi hàm xử lý việc up ảnh
  }); // khi nhấn vào biểu tượng xóa một file trong phần chỉnh sửa chi tiết thông báo (đã sử dụng)

  $(".notification-file-delete").bind("click", function (event) {
    event.preventDefault(); //gọi hàm hiển thị modal

    showConfirmDeleteNotificationFile(this);
  }); // khi nhấn nút xác nhận xóa file của một thông báo khi chỉnh sửa (đã sử dụng)

  $(".confirmed-delete-notification-file").bind("click", function () {
    // gọi hàm xóa
    confirmedDeleteNotificationFile(this.dataset);
  }); //Khi nhấn nút xóa một bài thông báo (đã sử dụng)

  $("#delete-notification").bind("click", function () {
    // gọi hàm hiển thị modal xác nhận xóa
    showConfirmDeleteNotification(this);
  }); //khi nhấn nút xác nhận xóa bài thông báo (đã sử dụng)

  $(".confirmed-delete-notification").bind("click", function () {
    //gọi hàm xóa
    confirmedDeleteNotification(this);
  }); // socket.emit("client-test-send","tín đẹp trai")
  // thiết lập socket để nhận thông báo
  // setBroastCastNotification();
  // thiết lập socket để gửi userid (id của tài khoản) lên server để lưu vào mảng người dùng đã đăng nhập
  // console.log(window.location.pathname)
  // thiết lập nhận thông báo khi có bài thông báo mới từ server qua socket

  setGiveNotification();

  if ($(".post-wrapper").length) {
    //đối với những trang có phần bài post thì:
    // thiết lập nhận comment thì có comment mới từ server qua socket
    setGiveComment(); // thiết lập nhận thông báo có bài viết bị xóa từ server qua socket

    setGiveDeletePost();
  } // thiết lập sự kiện khi nhấn nút tắt của một toast (đã sử dụng)


  $(".btn-toast-close").bind("click", function () {
    //this là cái button bấm tắt -- ta parent 2 lần để đến được cái toast bao quanh và xóa class show để ẩn đi cái toast
    $(this).parent().parent().removeClass("show");
  }); // khi nhấn vào một hình ảnh (thực chất là nhấn vào cái thẻ div bao quanh hình) của bài post thì hiện lên modal show các nội dung hình ảnh và video theo dạng slide
  // $(".options-post-child").bind("click",function(){
  //     // $("#show-options-imgs-videos-post").modal("show")
  //     showModalMiniPost(this)
  // })
  //khi nhấn vào nút tạo thêm vị trí để điền liên kết video (có thể dùng khi tạo hoặc chỉnh sửa video) (đã sử dụng)

  $(".add-new-index-video").bind("click", function () {
    console.log("clck");
    var data = $(this).data();
    addNewVideoIndex(data);
  }); //khi upload file hình lúc thêm hoặc chỉnh sửa bài post (đã sử dụng)

  $(".add-imgs-post").bind("change", function () {
    var data = $(this).data(); // $(this).val(null)

    showImagesBefor(this, data);
  }); // //khi bấm nút xóa một file hình trong cái modal (đã sử dụng)
  // $(".delete-file-show-input").bind("click",function(){
  //     //lấy ra cái id của cái hình bị xóa
  //     var data = $(this).data();
  //     console.log("ok");
  //     deleteImagesFromPostInput(data)
  // })
  // khi nhấn nút vào xác nhận của modal thêm bài post khi bắt đầu thêm nội dung bài post lên server (đã sử dụng)

  $("#add-post-confirm").bind("click", function () {
    // gọi hàm thêm bài post
    addPost();
  }); // khi vào nút xác nhận xác nhận của modal sửa bài post thì bắt đầu sửa nội dung bài post lên server (đã sử dụng)
  // $("#editpostconfirm").bind("click",function(){
  //     // gọi hàm sửa bài post
  //     editPost(this);
  // })
  //nếu giao diện người dùng có class post-wrapper (class chứa bài viết) thì mới thiết lập sự kiện scroll cho timeline
  //thiết lập loading timeline (đã sử dụng)

  var post_wrapper = $(".post-wrapper");

  if (post_wrapper.length > 0) {
    // khi scroll đến gần cuối khi load thêm timeline
    window.onscroll = function () {
      if (window.innerHeight + window.pageYOffset >= document.body.offsetHeight - 100) {
        // alert("bottom")
        //nếu không đang quá trình load thì mới load -- còn đang trong quá trình load (loadingTimeline=1)
        // thì giữ nguyên
        if (loadingTimeline == 0) {
          loadMorePost();
        }
      }
    };
  }
} //hàm để tạo thêm vị trí điền liên kết video


function addNewVideoIndex(data) {
  var idmodal = data.id; //thêm một input mới vào cái khu vực thêm liên kết video

  var newVideoInput = "<div class=\"d-flex flex-row\">\n                            <input class=\"my-input me-2\" type=\"text\" placeholder=\"Li\xEAn k\u1EBFt video\" name=\"videos[]\">\n                         <div onclick=\"deleteIndexVideoBefore(this);\" class=\"delete-index-video-show mt-2\"><i class=\"fas fa-trash\"></i></div>\n                         </div>"; // console.log($(`#${idmodal} .input-video-group .add-new-index-video`))

  $("#".concat(idmodal, " .input-video-group")).append(newVideoInput);
}
/*start: phần đăng nhập (không sử dụng nữa - thay thế = passport trong backedn) */

/* định dạng cho cái google button */


function onSuccess(googleUser) {
  // khi đăng nhập thành công -- chỉ khi ta thay đổi email hay đăng nhập một cái mới
  // thì hàm này sẽ chạy đầu tiên -- nếu ta không đăng xuất 
  // và refresh lại hàm onSignIn và hàm này cũng sẽ chạy
  // hàm onSignIn chạy trước nếu đã đăng nhập
  console.log('Logged in as: ' + googleUser.getBasicProfile().getName()); // khi nhấn nút đăng nhập và đăng nhập bằng một google email

  var id_token = googleUser.getAuthResponse().id_token; // lấy id_token

  verifyGoogleEmail(id_token); // kiểm tra id_token để đăng nhập
}

function onFailure(error) {
  // khi đăng nhập thất bại
  console.log(error);
}

function renderButton() {
  gapi.signin2.render('my-signin2', {
    'scope': 'profile email',
    'width': 240,
    'longtitle': true,
    'theme': 'dark',
    'onsuccess': onSuccess,

    /* chỉ định tên hàm khi đăng nhập thành công */
    'onfailure': onFailure
    /* chỉ định tên hàm khi đăng nhập thất bại */

  });
}
/* định dạng cho cái google button */


function onSignIn(googleUser) {
  /* khi đang đăng nhập -- đăng nhập lần đầu hàm này sẽ không chạy mà hàm onSuccess sẽ chạy */
  var profile = googleUser.getBasicProfile();
  console.log("id_token: " + googleUser.getAuthResponse().id_token);
  console.log('ID: ' + profile.getId()); // Do not send to your backend! Use an ID token instead.

  console.log('Name: ' + profile.getName());
  console.log('Image URL: ' + profile.getImageUrl());
  console.log('Email: ' + profile.getEmail()); // This is null if the 'email' scope is not present.

  var id_token = googleUser.getAuthResponse().id_token; // var checkmail = checkStudentEmail(profile.getEmail());
  // verifyGoogleEmail(id_token);
}

function signOut() {
  var auth2 = gapi.auth2.getAuthInstance();
  auth2.signOut().then(function () {
    console.log('User signed out.');
  });
}

function verifyGoogleEmail(id_token) {
  /* gửi id_token của google email để backend kiểm tra trước khi đăng nhập */
  $.post("/verify", {
    id_token: id_token
  }).then(function (result) {
    // có result => code >=200 và <300 nghĩa là cái id_token (dùng để kiểm tra xác thực và kiểm email) ổn
    // sau đó tiến hành đi đến trang đăng nhập
    // do ta đã lưu thông tin tài khoản gmail vào session trên backend khi verify thành công
    // nên khi ta gọi lại trang / này lần nữa, nó sẽ kiểm tra session và chuyển ta vào home
    location.assign("/");
    signOut();
  })["catch"](function (err) {
    // vào đây => code != 20x => có lỗi
    var errjson = JSON.stringify(err); // chuyển err object thành chuỗi json

    var errjson = JSON.parse(errjson); // chuyển chuỗi json thành đối tượng json

    var errValue = errjson.responseJSON; // lấy giá trị lỗi được gửi từ server

    var errCode = errValue.code; // lấy ra mã lỗi

    var errMessage = errValue.err.message; // lấy ra tin nhắn lỗi
    // thực hiện đăng xuất google email hiện tại

    signOut();
    var idAlert = "indexAlert";
    showAlert(idAlert, errMessage); // gửi tin nhắn đến giao diện người dùng
  });
}

function showAlert(idAlert, content, action) {
  //action (k bắt buộc) là một hàm thực hiện chức năng khác -- như ẩn đi alert
  if (!$("#".concat(idAlert)).hasClass("show")) {
    $("#".concat(idAlert)).addClass("show");
  }

  $("#".concat(idAlert)).empty();
  $("#".concat(idAlert)).text(content);

  if (action) {
    // nếu có một hàm hành động thì thực hiện nó
    action;
  }
}

function hideAlert(idAlert, content, action) {
  $("#".concat(idAlert)).html(null);
  $("#".concat(idAlert)).removeClass("show");
} //   function checkStudentEmail(email){
//       let emailSplit = email.split("@");
//       if(emailSplit[2]==="student.tdtu.edu.vn"){
//         return true;
//       }
//       return false;
//   }

/*end: phần đăng nhập */
// khi click vào cái input của khung đăng bài thì hiện lên một form để đăng bài


function WhenClickToNewPost() {
  var postModal = new bootstrap.Modal(document.getElementById('postModal'), {
    keyboard: false
  });
  postModal.show();
  HideImgInput(); // ẩn đi lựa chọn hình -- vì khi tắt khung thêm mở lại thì lựa chọn cuối cùng vẫn được lưu

  HideVideoInput(); // tương tự như trên
} //ẩn lựa chọn video


function HideVideoInput() {
  if (!$("#video-input").hasClass("component-hide")) {
    $("#video-input").addClass("component-hide");
  }
} //hiển thị lựa chọn video


function ShowVideoInput() {
  $("#video-input ").removeClass("component-hide");
} //ẩn lựa chọn hình ảnh


function HideImgInput() {
  if (!$("#img-input").hasClass("component-hide")) {
    $("#img-input").addClass("component-hide");
  }
} //hiển thị lựa chọn hình ảnh - cho chỉnh sửa


function ShowImgInput() {
  $("#img-input").removeClass("component-hide");
} // hàm ẩn đi alert thông báo về có thông báo mới sau 800 mili giây (đã sử dụng -- nhưng phải sửa lại cho tự động hóa)


function hideNotificationNotify() {
  setTimeout(function () {
    var myAlert = new bootstrap.Alert(document.getElementById("notificationNotify"));
    myAlert.close();
  }, 800);
} //hàm xử lý khi header scroll (đã sử dụng)


function ChangeHeaderWhenScroll() {
  if ($(window).scrollTop() > 50) {
    $(".header-scroll").removeClass("component-hide");
  } else {
    //remove the background property so it comes transparent again (defined in your css)
    $(".header-scroll").addClass("component-hide");
  }
}

function showImageBefor(input) {
  // khi input file hình được up lên html thì hiện lên lên cho người dùng (đã sử dụng)
  if (input.files && input.files[0]) {
    reader_information_image.readAsDataURL(input.files[0]);
  }
} //(đã sử dụng)


function showImagesBefor(input, data) {
  var modalid, n, i, file;
  return regeneratorRuntime.async(function showImagesBefor$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          // khi input file hình được up lên html thì hiện lên cho nguiowf dùng
          // hàm này dùng cho trường hợp up nhiều hình một lúc (khi thêm hoặc chỉnh sửa bài post)
          //modalid: id của modal (thêm hoặc sửa) sẽ được nhận hình
          modalid = data.id; //id của cái modal (thêm hoặc sửa)

          if (!(input.files && input.files.length)) {
            _context.next = 12;
            break;
          }

          n = input.files.length;
          i = 0;

        case 4:
          if (!(i < n)) {
            _context.next = 11;
            break;
          }

          // tạo một reader -- ta phải tạo trong đây bởi vì một reader chỉ có thể xử lý một hình trong một thời điểm
          // nếu ta tạo global thì nó sẽ bị lỗi
          // nên tốt nhất chạy vòng lặp và tạo từng cái
          //suy nghĩ tiếp là (cách xóa hình và thêm hình vào mảng -- dùng biến global để tiện cho việc upload server )
          // let reader_information_images_posts = new FileReader(); // dùng để cho việc đọc hình ảnh (nhiều hình) trước khi upload
          file = input.files[i]; // gọi promise đọc file và await chờ nó

          _context.next = 8;
          return regeneratorRuntime.awrap(myreadfiles(file).then(function (result) {
            var e = result;
            var fileidtmp = Date.now(); // tạo ra một id theo thiowf gian để không bị trùng

            var content = "<div class=\"file-show-input file-add-before-upload\" id=\"file-add-upload-".concat(fileidtmp, "\">\n                                    <img src=\"").concat(e.target.result, "\" class=\"d-block w-100\">\n                                    <div onclick=\"deleteImagesFromPostInput(this);\" class=\"delete-file-show-input\" data-id=\"file-add-upload-").concat(fileidtmp, "\" data-modalid=\"").concat(modalid, "\"><i class=\"far fa-times-circle\"></i></div>\n                                    <hr>\n                                </div>");
            $("#".concat(modalid, " .img-input-after")).append(content); // thêm vào một giá trị json để dễ dàng có thể tương tác thông qua id

            var fileinfor = {
              id: "file-add-upload-".concat(fileidtmp),
              file: file
            }; //vì có 2 dạng thêm và sửa nên mảng input cũng sẽ khác nhau -- do đó tùy thuộc thêm hay sửa mà làm cho phù hợp

            if (modalid == "editpostModal") {
              //nếu là sửa
              filesToUploadEdit.push(fileinfor);
              console.log("file to upload edit");
              console.log(filesToUploadEdit);
            } else {
              filesToUpload.push(fileinfor); //nếu là thêm

              console.log("file to upload");
              console.log(filesToUpload);
            }
          })["catch"](function (err) {
            console.log(err);
          }));

        case 8:
          i++;
          _context.next = 4;
          break;

        case 11:
          // làm rỗng đi cái ô input hình (vì dữ liệu hình để upload ta sẽ thêm vào một mảng global để dễ tương tác)
          $(input).val(null);

        case 12:
        case "end":
          return _context.stop();
      }
    }
  });
} // tạo một promise để đọc file dễ hơn (đã sử dụng)


var myreadfiles = function myreadfiles(file) {
  return new Promise(function (resolve, reject) {
    var reader_information_images_posts = new FileReader(); // dùng để cho việc đọc hình ảnh (nhiều hình) trước khi upload

    reader_information_images_posts.readAsDataURL(file);

    reader_information_images_posts.onload = function (e) {
      resolve(e);
    };
  });
};

reader_information_image.onload = function (e) {
  // khi load xong thì hiện lên (đã sử dụng)
  $('#information-image').attr('src', e.target.result);
}; // hiển thị modal xác nhận xóa file khi chỉnh sửa một bài thông báo (đã sử dụng)


function showConfirmDeleteNotificationFile(file) {
  //file = this
  var data = file.dataset; // lấy id bài thông báo được gắn ở form

  var notificationid = $(file).parent().parent().parent().parent().parent().attr("data-id"); // lấy thông tin tên file và id file để hiển thị lên view cho người dùng xem

  var fileid = data.fileid,
      originfilename = data.originfilename;
  $("#confirm-delete-notification-file .modal-body").html(originfilename); // gắn id file

  $("#confirm-delete-notification-file .confirmed-delete-notification-file").attr("data-fileid", fileid); // gắn id bài thông báo

  $("#confirm-delete-notification-file .confirmed-delete-notification-file").attr("data-notificationid", notificationid); //hiện modal lên

  $("#confirm-delete-notification-file").modal("show");
} // khi nhấn đồng ý xóa file bài thông báo khi chỉnh sửa -- xác nhận xóa (đã sử dụng)


function confirmedDeleteNotificationFile(data) {
  // lấy ra id của file
  var id = data.fileid; // lấy ra id của bài thông báo

  var notificationid = data.notificationid; // sử dụng href để xóa (fileid - là id của file, còn id là id của bài thông báo)

  window.location.href = "/notification/deletefile?fileid=".concat(id, "&id=").concat(notificationid);
} //hiển thị modal xác nhận xóa bài thông báo (đã sử dụng)


function showConfirmDeleteNotification(notification) {
  // notification = this
  var data = notification.dataset; //lấy ra id thông báo

  var id = data.id;
  $("#confirm-delete-notification").modal("show"); // thêm nội dung

  $("#confirm-delete-notification .modal-body").html("Bạn có chắc muốn xóa bài thông báo này không ? Việc xóa này có thể xóa đi tất cả nội dung và file liên quan."); // gán id thông báo để xóa

  $("#confirm-delete-notification .confirmed-delete-notification").attr("data-id", id);
} //khi nhấn đồng ý xác nhận xóa bài thông báo - thực hiện xóa (đã sử dụng)


function confirmedDeleteNotification(notification) {
  console.log(notification);
  var data = notification.dataset; //lấy ra id bài thông báo

  var id = data.id; // tiến hành gọi href để xóa

  window.location.href = "/notification/delete?id=".concat(id);
} // thiết lập kênh nhận dữ liệu từ server (đã sử dụng)


socket.on("server-test-send", function (data) {
  console.log(data);
}); //thiết lập kênh nhận dữ liệu thông báo từ server (đã sử dụng)

function setGiveNotification() {
  //thiết lập nhận thông báo realtime khi có một thông báo mới được thêm vào
  var userid = $("#user").attr("data-id");
  ionotification.on("server-send-new-notification-".concat(userid), function (data) {
    // console.log(data);
    // data được gửi là một thông báo
    var notification = data;
    var returnValue = "";

    if (window.location.pathname === "/home") {
      // nếu người dùng đang ở trang home thì thêm thông báo mới vào cái ô các thông báo nằm bên phải
      if (notification.department.departtype == "K") {
        returnValue += "<a href=\"/notification/details?id=".concat(notification.id, "\"><!--1 th\xF4ng b\xE1o-->\n                <div class=\"notification notification-odd\">\n                    <div class=\"ssm-text notification-introduce\"> <!--Ph\u1EA7n gi\u1EDBi thi\u1EC7u-->\n                    <div>Khoa ").concat(notification.department.departcode, "</div>\n                    <div>").concat(notification.notificationdate, "</div>\n                    </div>\n                    <div class=\"sm-text notification-title\"> <!--Ph\u1EA7n ti\xEAu \u0111\u1EC1-->\n                        ").concat(notification.title, " <span class=\"badge my-badege-1\">M\u1EDBi</span>\n                    </div>\n                </div>\n                </a>");
      } else {
        returnValue += "<a href=\"/notification/details?id=".concat(notification.id, "\"><!--1 th\xF4ng b\xE1o-->\n                <div class=\"notification notification-odd\">\n                    <div class=\"ssm-text notification-introduce\"> <!--Ph\u1EA7n gi\u1EDBi thi\u1EC7u-->\n                    <div>Ph\xF2ng ").concat(notification.department.departcode, "</div>\n                    <div>").concat(notification.notificationdate, "</div>\n                    </div>\n                    <div class=\"sm-text notification-title\"> <!--Ph\u1EA7n ti\xEAu \u0111\u1EC1-->\n                        ").concat(notification.title, "\n                    </div>\n                </div>\n                </a>");
      }

      $(".body-notification").prepend(returnValue);
    } // hiển thị thông báo mới là có một bài thông báo mới được đăng


    var message = "";

    if (notification.department.departtype == "K") {
      message += "Khoa ";
    } else {
      message += "Phòng ";
    }

    message += "".concat(notification.department.departcode, " v\u1EEBa \u0111\u0103ng m\u1ED9t th\xF4ng b\xE1o m\u1EDBi: \n        <a class=\"blue-text\" href=\"/notification/details?id=").concat(notification.id, "\">").concat(notification.title, "</a>");
    showToast("new-notification-toast", message);
  });
} //hiển thị một toast (đã sử dụng)


function showToast(toastid, message) {
  if (!$("#".concat(toastid)).hasClass("show")) {
    $("#".concat(toastid)).addClass("show");
  }

  $("#".concat(toastid, " .toast-body")).html(message);
} //show bài viết theo một dạng khác khi nhấn vào hình ảnh của nó (đã sử dụng)


function showModalMiniPost(post) {
  //post = this
  var data = $(post).parent().data(); // lấy dataset của cái thẻ bao quanh các nội dung hình ảnh và video
  //data này có chứa id của bài viết

  var clickid = $(post).data().id; // lấy ra id của cái hình được click để lát nữa so sánh rồi active cái hình được click trong slide
  //clickid là id của cái hình được click

  var id = data.id; // lấy ra id của bài viết để từ jquery lấy nội dung bài viết ra
  //lấy phần top-post (thông tin)

  var top_post = $("#".concat(id, " .top-post")).html();
  $("#show-options-imgs-videos-post .top-post").html(top_post); //xóa đi cái khung chỉnh sửa - xóa

  $("#show-options-imgs-videos-post .dropdown").remove(); //lấy phần nội dung

  var content_post_wrapper = $("#".concat(id, " .content-post-wrapper")).html();
  $("#show-options-imgs-videos-post .content-post-wrapper").html(content_post_wrapper); //lấy phần hỉnh ảnh và video để hiển thị dạng slide

  var options_img_videos_wrapper = $("#".concat(id, " .options-img-videos-wrapper div")); //    options_img_videos_wrapper.forEach(function(child){
  //        console.log(child)
  //    })
  //xóa đi dữ liệu cũ trước

  $("#show-options-imgs-videos-post .carousel-inner").html(null);

  if (options_img_videos_wrapper.length) {
    var n = options_img_videos_wrapper.length;

    for (var i = 0; i < n; i++) {
      // console.log(options_img_videos_wrapper[i])
      //lấy hình ảnh hoặc video ra
      var childcontent = $(options_img_videos_wrapper[i]).html();
      $(childcontent).addClass("d-block"); // console.log(childcontent.html())
      //chuẩn bị dữ liệu để thêm vào slide

      var childcontentid = $(childcontent).attr("id"); // lấy ra id của mấy ảnh hoặc video

      var contentToAppend = ""; // so sánh để hiển thị hình được click đầu tiên

      if (childcontentid == clickid) {
        contentToAppend += "<div class=\"active carousel-item\">\n                                        ".concat(childcontent, "\n                                    </div>");
      } else {
        contentToAppend += "<div class=\"carousel-item\">\n                                        ".concat(childcontent, "\n                                    </div>");
      } // console.log(contentToAppend)


      $("#show-options-imgs-videos-post .carousel-inner").append(contentToAppend);
    }
  }

  $("#show-options-imgs-videos-post").modal("show");
} // hàm xóa hình xem trước khi thêm - sửa post (có thể ap dụng cho cả hình lúc up lên từ input và hình từ csdl)(đã sử dụng)


function deleteImagesFromPostInput(image) {
  console.log("ok");
  var data = image.dataset; // và id của cái modal (modal của thêm post hoặc sửa post)

  var id = data.id; // id là id của cái hình

  var modalid = data.modalid; // và modalid của cái modal (modal của thêm post hoặc sửa post)
  //xóa khỏi mảng input hình (nếu có bởi vì có thể nếu xóa hình từ csdl thì trong mảng input không có)
  //vì có 2 dạng thêm và sửa nên mảng input cũng sẽ khác nhau -- do đó tùy thuộc thêm hay sửa mà làm cho phù hợp

  if (modalid == "editpostModal") {
    //nếu là modal sửa
    //tìm vị trí trước
    var indexToDelete = filesToUploadEdit.findIndex(function (t) {
      return t.id == id;
    }); // nếu có mới xóa

    if (indexToDelete >= 0) {
      filesToUploadEdit.splice(indexToDelete, 1);
    }

    console.log("files to upload edit");
    console.log(filesToUploadEdit);
  } else {
    // nếu là modal thêm
    //tìm vị trí trước
    var indexToDelete = filesToUpload.findIndex(function (t) {
      return t.id == id;
    }); // nếu có mới xóa

    if (indexToDelete >= 0) {
      filesToUpload.splice(indexToDelete, 1);
    }

    console.log("files to upload");
    console.log(filesToUpload);
  } //xóa khỏi mảng xong thì xóa view khỏi khu vực của cái modalid


  $("#".concat(modalid, " #").concat(id)).remove();
} // khi nhấn vào nút xóa một hình (đã upload trên csdl) lúc chỉnh sửa thì xóa hình này ra khỏi view chỉnh sửa
// và thêm id của hình này vào mảng id hình để xóa
// (đã sử dụng)


function deleteImagesFromPostInputAfter(image) {
  var data = image.dataset; // và id của cái modal (modal của thêm post hoặc sửa post)

  var id = data.id; // id là id của cái hình
  //thêm vào mảng id hình để xóa

  idImagesToDelete.push(id);
  console.log("idImagesToDelete");
  console.log(idImagesToDelete); //xóa khỏi view (khác với xóa hình khi mới upload khi thêm mới)

  $(image).parent().remove();
} // khi nhấn nút xóa một vị trí để điền liên kết video (liên kết này chưa có up lên server -- liên kết đã up lên server sẽ xử lý khác)
//(đã sử dụng)


function deleteIndexVideoBefore(videoindex) {
  $(videoindex).parent().remove();
} // khi nhấn nút xóa một vị trí liên kết video (đã có giá trị của liên kết được upload trên server)
// việc đơn giản là ta sẽ lưu lại cái id muốn xóa


function deleteIndexVideoAfter(videoindex) {
  // lấy ra id của cái video muốn xóa và lưu vào mảng
  var videoid = $(videoindex).data().id;
  idVideosToDelete.push(videoid); //xóa đó gọi hàm xóa đi cái ô input

  deleteIndexVideoBefore(videoindex);
  console.log(idVideosToDelete);
} //addpost lên server (đã sử dụng)


function addPost() {
  //chuẩn bị một formdata
  var formData = new FormData(); //nếu có file hình để gửi thì thêm vào form (mảng hình lấy từ filesToUpload)

  if (filesToUpload.length) {
    filesToUpload.forEach(function (f, index) {
      // lấy file ra và append vào form data
      formData.append("imgs", f.file);
    });
  } // tiếp theo là thêm nội dung


  var content = $("#add-post-content").val();
  console.log("content: " + content);
  formData.set("content", content); // tiếp theo là duyệt các ô input videos xem ô nào có value thì lấy ra và append vào form data

  var inputVideos = $("#add-post-videos input");

  if (inputVideos.length) {
    var n = inputVideos.length;

    for (var i = 0; i < n; i++) {
      var videolink = $(inputVideos[i]).val();
      console.log(videolink);

      if (videolink.trim().length > 0) {
        formData.append("videos[]", videolink);
      }
    }
  } // sau đó dùng ajax để thêm lên server


  $.ajax({
    type: "post",
    url: "/post/add",
    data: formData,
    processData: false,
    // nếu muốn post form data lên backend = ajax thì nhớ thêm 2 thông số này
    contentType: false
  }).then(function (result) {
    // khi đăng bài thành công thì tiến hành thêm lên view
    var post = result.data;
    addPostView(post); // clear (làm sạch) cái modal thêm

    clearPostModal("postModal"); // clear cái mảng input files global

    filesToUpload = []; // hạ modal thêm xuống

    $("#postModal").modal("hide"); // console.log("f"+filesToUpload)
  })["catch"](function (err) {
    // nếu có lỗi thì thông báo lỗi bằng alert
    err = JSON.stringify(err);
    err = JSON.parse(err);
    var mess = err.responseJSON.message;
    showAlert("add-post-alert", mess);
  });
} // làm sạch postmodal (thêm hoặc sửa)


function clearPostModal(postmodalid, option) {
  // cho tất cả ô input trở về rỗng giá trị
  $("#".concat(postmodalid, " input")).val(null);
  $("#".concat(postmodalid, " textarea")).val(null); // làm mới lại mấy ô thêm input videos

  if (option == 2) {
    // nếu == 2( nghĩa là làm mới form chỉnh sửa bài post -- ta không cần thêm cái input video)
    $("#".concat(postmodalid, " .input-video-group")).html("<label class=\"blue-text\">Li\xEAn k\u1EBFt video</label>");
  } else {
    //ngược lại thì thêm
    $("#".concat(postmodalid, " .input-video-group")).html("<label class=\"blue-text\">Li\xEAn k\u1EBFt video</label>\n        <div class=\"d-flex flex-row\">\n        <input class=\"my-input me-2\" type=\"text\" placeholder=\"Li\xEAn k\u1EBFt video\" name=\"videos[]\">\n        \n        </div>");
  } // làm mới khu ảnh xem trước


  $("#".concat(postmodalid, " .img-input-after")).html(null); // ẩn luôn cái alert

  hideAlert("add-post-alert");
} //hàm lấy ra id từ url youtube (đã sử dụng)


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
} //hàm thêm bài post lên view (đã sử dụng)


function addPostView(post, option) {
  // result.data = post
  // option là gán post vào views kiểu nào (option =2 là gán vào cuối view -- dành cho load timeline)
  // ngược lại là gán vào đầu view (dành cho lúc thêm post)
  //thông tin người dùng hiện tại
  var rolecode = $("#roleuser").data().rolename; // quyền

  var userid = $("#user").data().id; // id
  // chủ bài post

  var owner = post.owner; // thông tin cá nhân của owner (tên hiển thị, ảnh đại diện)

  var ownerid = owner.id;
  var information = owner.information;
  var attachedfiles = post.attachedfiles; // mảng các file đính kèm (hình ảnh và video);
  // phần lấy hình và video trong dữ liệu không nên gộp chung (ta tách riêng ra xử lý rồi gộp chung lại)

  var filesToShow = "";
  attachedfiles.forEach(function (file) {
    if (file.filetype == "image") {
      filesToShow += "<hr><div class=\"options-post-child\" data-id=\"".concat(file.id, "\" onclick=\"showModalMiniPost(this);\">\n                            <img id=\"").concat(file.id, "\" src=\"").concat(file.fileurl, "\" class=\"d-block w-100\">\n                        </div>\n                        ");
    } else {
      filesToShow += "<hr> <div class=\"video-post-wrapper\" data-id=\"".concat(file.id, "\">\n                                <iframe data-url=\"").concat(file.fileurl, "\" id=\"").concat(file.id, "\" width=\"100%\" height=\"350\" src=\"https://www.youtube.com/embed/").concat(convertYoutubeUrl(file.fileurl), "\" allowfullscreen></iframe>\n                            </div>\n                            ");
    }
  });
  var editToShow = ""; //kiểm tra xem quyền người dùng và sở hữu bài post để quyết định thêm nút edit cho bài post
  //nếu là admin thì thêm thẳng
  //nếu là người dùng bình thường thì kiểm tra có phải chủ nhân bài post không

  if (rolecode === "AM" || ownerid.toString() == userid.toString()) {
    // nếu phải thì thêm phần edit vào
    editToShow += "<div class=\"dropdown\">\n                            <button class=\"btn btn-secondary sm-text dropdown-post\" type=\"button\" id=\"dropdownPost\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">\n                            <i class=\"fas fa-ellipsis-h\"></i>\n                            </button>\n                            <ul class=\"dropdown-menu\" aria-labelledby=\"dropdownPost\">\n                            <li><a class=\"dropdown-item editpost\" href=\"#\" data-id=\"".concat(post.id, "\" onclick=\"showModalEditPost(this,event);\">Ch\u1EC9nh s\u1EEDa</a></li>\n                            <li><a class=\"dropdown-item deletepost\" href=\"#\" data-id=\"").concat(post.id, "\" onclick=\"showModalDeletePost(this,event);\">X\xF3a</a></li>\n                            </ul>\n                        </div>");
  }

  var toview = "<div class=\"post p-4\" id=\"".concat(post.id, "\">\n    <!--ph\u1EA7n \u0111\u1EA7u b\xE0i-->\n    <div class=\"top-post\">\n      <a href=\"/wall?id=").concat(owner.id, "\" class=\"me-2 top-post-avatar\">\n        <img src=\"").concat(information.avatar, "\" class=\"avatar-img-round\">\n      </a>\n      <!--Ph\u1EA7n t\xEAn hi\u1EC3n th\u1ECB-->\n      <div class=\"top-post-infor sm-text\">\n        <div class=\"bold-text\"><a href=\"/wall?id=").concat(owner.id, "\">").concat(information.showname, "</a></div>\n        <div>").concat(post.postdate, "</div> <!--d\xF9ng sau n\xE0y hi\u1EC3n th\u1ECB th\u1EDDi gian-->\n      </div>\n      <!--Ph\u1EA7n dropdown d\xF9ng \u0111\u1EC3 hi\u1EC3n th\u1ECB l\u1EF1a ch\u1ECDn ch\u1EC9nh s\u1EEDa ho\u1EB7c x\xF3a -- ch\u1EC9 d\xE0nh cho b\xE0i vi\u1EBFt c\u1EE7a b\u1EA3n th\xE2n-->\n      ").concat(editToShow, "\n    </div>\n    \n    <!--ph\u1EA7n n\u1ED9i dung-->\n    <div class=\"content-post-wrapper\">\n      <span class=\"content-post\">").concat(post.content, "</span>\n    </div>\n    <!--Ph\u1EA7n h\xECnh \u1EA3nh - video -->\n    \n    <div>\n      <div class=\"img-post-wrapper options-img-videos-wrapper\" data-id=\"").concat(post.id, "\">\n        ").concat(filesToShow, "  \n      </div>\n    </div>\n    \n    <!--start: Ph\u1EA7n b\xECnh lu\u1EADn-->\n    <hr>\n    <div class=\"comment-post\"> <!--Ch\u1ED7 nh\u1EADp b\xECnh lu\u1EADn c\u1EE7a b\u1EA3n th\xE2n-->\n      <a href=\"/wall?id=").concat(owner.id, "\" class=\"me-2\">\n          <img src=\"").concat(information.avatar, "\" class=\"avatar-img-round avatar-img-round-comment\">\n      </a>\n      <input data-id=\"").concat(post.id, "\" type=\"text\" class=\"my-input my-input-round\" placeholder=\"B\xECnh lu\u1EADn c\u1EE7a b\u1EA1n\" name=\"comment\" onkeydown=\"typeComment(this,event);\">\n    </div>\n    <div class=\"comment-post-wrapper\"> <!--C\xE1c b\xECnh lu\u1EADn c\u1EE7a b\xE0i post-->\n      \n    </div>\n    <!--end: Ph\u1EA7n b\xECnh lu\u1EADn-->\n    <!-- -->\n    <div class=\"action-comment\"> <!--M\u1EB7c \u0111\u1ECBnh ta s\u1EBD hi\u1EC3n th\u1ECB \xEDt nh\u1EA5t 2 comment -- n\u1EBFu c\xF2n n\u1EEFa th\xEC s\u1EBD nh\u1EA5n v\xE0o \u0111\xE2y \u0111\u1EC3 t\u1EA3i th\xEAm comment-->\n      <a data-id=\"").concat(post.id, "\" href=\"#\" class=\"blue-text more-comment\" onclick=\"getMoreComment(this,event);\">Xem th\xEAm b\xECnh lu\u1EADn</a>\n    </div>\n  \n  </div>");

  if (option == 2) {
    // gán lên view dành cho lúc load timeline (gán vào cuối view)
    $(".post-wrapper").append(toview);
  } else {
    // gán lên view dành cho lúc tạo mới post (gán vào đầu view)
    $(".post-wrapper").prepend(toview);
  }
} //hàm hiển thị modal sửa bài post khi người dùng nhấn chỉnh sửa một bài viết (onclick trong html) (đã sử dụng)


function showModalEditPost(post, event) {
  // post = this
  event.preventDefault(); //ẩn đi cái modal hiển thị bài post dạng khác

  $("#show-options-imgs-videos-post").modal("hide"); //ẩn cái alert

  hideAlert("edit-post-alert");
  clearPostModal("editpostModal", 2);
  idImagesToDelete = []; // làm mới mảng chứa id của những tấm hình đã up lên server sẽ bị xóa khi nhấn vào nút xóa lúc chỉnh sửa

  idVideosToDelete = []; // làm mới mảng chứa id của những videos link đã up lên server sẽ bị xóa khi nhấn vào nút xóa lúc chỉnh sửa

  filesToUploadEdit = []; // làm mới chứa files để upload khi chỉnh sửa

  var postid = post.dataset.id; // id của bài viết được chỉnh sửa

  console.log("postid: " + postid); // gắn id của bài viết vào nút xác nhận sửa để tiện cho việc lấy thông tin

  $("#editpostModal #editpostconfirm").attr("data-postid", postid); //lấy dữ liệu từ post được thêm
  //lấy content

  var content = $("#".concat(postid, " .content-post")).html(); //lấy ra hình ảnh và video

  var images = $("#".concat(postid, " .options-img-videos-wrapper .options-post-child img"));
  var videos = $("#".concat(postid, " .options-img-videos-wrapper .video-post-wrapper iframe")); //thêm dữ liệu cho modal chỉnh sửa
  //thêm content bài post

  $("#editpostModal textarea").val(content); //thêm các liên kết videos vào ô input (nếu có)

  if (videos.length) {
    var n = videos.length;

    for (var i = 0; i < n; i++) {
      var video = videos[i];
      var videolink = $(video).data().url; // lấy liên kết thô (lúc chưa chuyển đổi) để hiển thị

      var videoid = $(video).attr("id"); //thêm vào khu vực hiển thị

      var newVideoInput = "<div class=\"d-flex flex-row\">\n                                    <input disabled class=\"my-input me-2\" type=\"text\" placeholder=\"Li\xEAn k\u1EBFt video\" value=\"".concat(videolink, "\">\n                                    <div data-id=\"").concat(videoid, "\" onclick=\"deleteIndexVideoAfter(this);\" class=\"delete-index-video-show mt-2\"><i class=\"fas fa-trash\"></i></div>\n                                </div>");
      $("#editpostModal .input-video-group").append(newVideoInput);
    }
  } //thêm các hình ảnh vào khu vực hienr thị (nếu có)


  if (images.length) {
    var n = images.length;

    for (var i = 0; i < n; i++) {
      var image = images[i];
      var imagelink = $(image).attr("src");
      var imageid = $(image).attr("id"); //thêm vào khu vực hiển thị

      var newImageInput = "<div class=\"file-show-input file-add-before-upload\" id=\"".concat(imageid, "\">\n                                    <img src=\"").concat(imagelink, "\" class=\"d-block w-100\">\n                                    <div onclick=\"deleteImagesFromPostInputAfter(this);\" class=\"delete-file-show-input\" data-id=\"").concat(imageid, "\" data-modalid=\"editpostModal\"><i class=\"far fa-times-circle\"></i></div>\n                                    <hr>\n                                </div>");
      $("#editpostModal .img-input-after").append(newImageInput);
    }
  }

  $("#editpostModal").modal("show"); // console.log(post.dataset.id)
} //hàm hiển thị xác nhận xóa một comment khi người dùng nhấn xóa một comment (onclick trong html) (đã sử dụng)


function showModalDeleteComment(comment, event) {
  // comment = this
  event.preventDefault();
  console.log(comment.dataset.id);
} //hàm thực hiện sửa bài post (đã sử dụng)


function editPost(post) {
  // console.log(post)
  //lấy ra id bài post muốn sửa
  var postid = post.dataset.postid; // console.log(postid)
  //chuẩn bị một formdata

  var formData = new FormData(); //nếu có file hình để gửi thì thêm vào form (mảng hình lấy từ filesToUploadEdit)

  if (filesToUploadEdit.length) {
    filesToUploadEdit.forEach(function (f, index) {
      // lấy file ra và append vào form data
      formData.append("imgs", f.file);
    });
  } //đầu tiên là thêm id bài viết


  formData.set("id", postid);
  console.log(postid); //tiếp theo là thêm nội dung

  var content = $("#edit-post-content").val();
  formData.set("content", content);
  console.log(content); // tiếp theo là duyệt các ô input videos xem, nếu người dùng có thêm videos mới thì lấy ra
  // những input có name=videos[] là những input mới được thêm vào (còn không có thì ra những input cũ đã đc upload)

  var inputVideos = $("#edit-post-videos input[name=\"videos[]\"]");

  if (inputVideos.length) {
    var n = inputVideos.length;

    for (var i = 0; i < n; i++) {
      var videolink = $(inputVideos[i]).val();
      console.log(videolink);

      if (videolink.trim().length > 0) {
        formData.append("videos[]", videolink);
      }
    }
  } //Tiếp theo là thêm mảng các id của videos link để xóa


  if (idVideosToDelete.length) {
    idVideosToDelete.forEach(function (videoid) {
      console.log(videoid);
      formData.append("videosdelete[]", videoid);
    });
  } //Tiếp theo là thêm mảng các id của file hình để xóa


  if (idImagesToDelete.length) {
    idImagesToDelete.forEach(function (imageid) {
      console.log(imageid);
      formData.append("imagesdelete[]", imageid);
    });
  } // tiến hành gửi lên server


  $.ajax({
    type: "post",
    url: "/post/edit",
    data: formData,
    processData: false,
    // nếu muốn post form data lên backend = ajax thì nhớ thêm 2 thông số này
    contentType: false
  }).then(function (result) {
    // khi up load thành công thì ta tiến hành hiển thị lại giao diện
    // console.log(result)
    var post = result.data;
    editPostView(post);
    idImagesToDelete = []; // làm mới mảng chứa id của những tấm hình đã up lên server sẽ bị xóa khi nhấn vào nút xóa lúc chỉnh sửa

    idVideosToDelete = []; // làm mới mảng chứa id của những videos link đã up lên server sẽ bị xóa khi nhấn vào nút xóa lúc chỉnh sửa

    filesToUploadEdit = []; // làm mới chứa files để upload khi chỉnh sửa
    //làm sạch modal

    clearPostModal("editpostModal", 2); //hạ modal xuống

    $("#editpostModal").modal("hide");
  })["catch"](function (err) {
    // nếu có lỗi thì thông báo lỗi bằng alert
    err = JSON.stringify(err);
    err = JSON.parse(err);
    var mess = err.responseJSON.message;
    showAlert("edit-post-alert", mess);
  });
} //hiển thị lại nội dung chỉnh sửa lên view


function editPostView(post) {
  var postid = post.id; // lấy ra id bài post

  var content = post.content; // lấy ra nội dung bài viết

  var attachedfiles = post.attachedfiles; // mảng các file đính kèm (hình ảnh và video);
  // dữ liệu thay đổi qua lại nên ta khó nắm chắc là cái nào sẽ thay đổi
  // nên ta chỉ cần lấy tất cả dữ liệu hình ảnh, video mới được gửi và thay thế trong view là được

  var filesToShow = "";
  attachedfiles.forEach(function (file) {
    if (file.filetype == "image") {
      filesToShow += "<div class=\"options-post-child\" data-id=\"".concat(file.id, "\" onclick=\"showModalMiniPost(this);\">\n                            <img id=\"").concat(file.id, "\" src=\"").concat(file.fileurl, "\" class=\"d-block w-100\">\n                        </div>\n                        <hr>");
    } else {
      filesToShow += " <div class=\"video-post-wrapper\" data-id=\"".concat(file.id, "\">\n                                <iframe data-url=\"").concat(file.fileurl, "\" id=\"").concat(file.id, "\" width=\"100%\" height=\"350\" src=\"https://www.youtube.com/embed/").concat(convertYoutubeUrl(file.fileurl), "\" allowfullscreen></iframe>\n                            </div>\n                            <hr>");
    }
  }); // ta chỉ cần cập nhật lại các nội dung như content và hình ảnh và video thôi -- mấy thứ khác vẫn giữ nguyên

  $("#".concat(postid, " .content-post")).html(content); // cập nhật content mới

  $("#".concat(postid, " .options-img-videos-wrapper")).html(filesToShow); // cập nhật hình ảnh và video mới
} //hàm hiển thị modal xác nhận xóa bài post khi người dùng nhấn xóa một bài post (onclick trong html) (đã sử dụng)


function showModalDeletePost(post, event) {
  // post = this
  event.preventDefault();
  var postid = post.dataset.id; //gắn id bài viết vào nút confirmed để xóa dễ dàng

  $("#confirm-delete-post-modal #confirmed-delete-post-modal").attr("data-id", postid);
  $("#confirm-delete-post-modal").modal("show");
} //hàm xóa khi đã nhấn xác nhận (đã sử dụng) (onclick từ html)


function confirmedDeletPost(post) {
  //post = this
  //lấy ra id bài post
  var id = post.dataset.id; //gọi ajax để xóa

  $.ajax({
    type: "post",
    url: "/post/delete/".concat(id)
  }).then(function (result) {
    //nếu thành công thì xóa bài viết trên view
    deletePost(id); //ẩn đi cái modal

    $("#confirm-delete-post-modal").modal("hide"); //hiển thị một htonog báo thành công

    showToast("post-toast", "Xóa bài viết thành công");
  })["catch"](function (err) {
    // nếu có lỗi thì show lên toast
    err = JSON.stringify(err);
    err = JSON.parse(err);
    var mess = err.responseJSON.message;
    showToast("post-toast", mess);
  });
} //thực hiện xóa bài post ra khỏi giao diện (Đã sử dụng)


function deletePost(postid) {
  $("#".concat(postid)).remove();
} //hàm thực hiện comment khi người dùng comment vào một bài viết (có lấy ra được id bài viết) (onkeydown trong html)


function typeComment(inputtype, event) {
  //inputtype = this
  var keycode = event.keyCode ? event.keyCode : event.which; // lấy keycode của nút được nhấn

  if (keycode == '13') {
    // 13 là nút Enter -- Enter mới thực hiện việc lấy value ra
    //lấy ra id của bài viết được comment
    var postid = inputtype.dataset.id; // lấy ra nội dung comment sau khi nhấn nút enter

    var commentContent = $(inputtype).val();
    $(inputtype).val(null); // nếu nội dung comment không bị rỗng mới thực hiện up lên server

    if (commentContent.trim().length > 0) {
      postComment(postid, commentContent);
    }
  }
} //hàm thực hiện gửi comment lên serever (đã sử dụng)


function postComment(postid, commentContent) {
  $.ajax({
    url: "/post/comment/".concat(postid),
    type: "post",
    data: {
      content: commentContent // nội dung comment

    }
  }).then(function (result) {//nếu thành công thì cập nhật lên view người dùng
    // không cần thực hiện hàm này ở đây -- dữ liệu comment khi được post lên sẽ được gửi đến tất cả người dùng
    // bao gồm cả người gửi
    // và lúc đó comment sẽ tự lên view mà ta không cần phải thêm
    // postCommentView(postid,result.data);
  })["catch"](function (err) {
    //nếu thất bại thì hiện một thông báo lỗi
    err = JSON.stringify(err);
    err = JSON.parse(err);
    var mess = err.responseJSON.message;
    showToast("post-toast", mess);
  });
} //hàm thực hiện comment lên view (đã sử dụng)


function postCommentView(postid, comment) {
  // xóa đi cái thông báo không có comment
  $("#".concat(postid, " .comment-post-wrapper .not-comment-alert")).remove(); // console.log(comment)

  var rolecode = $("#roleuser").attr("data-rolename");
  var userid = $("#user").attr("data-id"); // lấy userid (được gắn đầu đó trên head)

  var owner = comment.owner; // thông tin người comment

  var information = owner.information; //thông tin về tên hiển thị và ảnh đại diện
  //kiểm tra xem chủ nhân của comment này có phải là người dùng hiện tại không để hiển thị cái chỗ xóa comment

  var editadd = ""; //nếu người dùng hiện tại là chủ nhân comment

  if (rolecode == "AM" || userid == owner.id) {
    editadd += "<div class=\"comment-edit\"> <!--CH\u1EC9 hi\u1EC3n th\u1ECB \u0111\u1ED1i v\u1EDBi comment c\u1EE7a b\u1EA3n th\xE2n ho\u1EB7c admin-->\n                    <!--Ph\u1EA7n dropdown d\xF9ng \u0111\u1EC3 hi\u1EC3n th\u1ECB l\u1EF1a ch\u1ECDn ch\u1EC9nh s\u1EEDa ho\u1EB7c x\xF3a -- ch\u1EC9 d\xE0nh cho b\xE0i vi\u1EBFt c\u1EE7a b\u1EA3n th\xE2n-->\n                    <div class=\"dropdown\">\n                    <button class=\"btn btn-secondary sm-text dropdown-post\" type=\"button\" id=\"dropdownPost\" data-bs-toggle=\"dropdown\" aria-expanded=\"false\">\n                        <i class=\"fas fa-ellipsis-h comment-edit-symbol\"></i>\n                    </button>\n                    <ul class=\"dropdown-menu\" aria-labelledby=\"dropdownPost\">\n                        <li><a class=\"dropdown-item deletecomment\" href=\"#\" data-id=\"".concat(comment.id, "\" onclick=\"confirmDeleteComment(this,event)\">X\xF3a</a></li>\n                    </ul>\n                    </div>\n                </div>");
  }

  var contentToAdd = "<div class=\"comment-post\" id=\"".concat(comment.id, "\">\n    <a href=\"/wall?id=").concat(owner.id, "\" class=\"avatar-post-wrapper me-2\">\n        <img src=\"").concat(information.avatar, "\" class=\"avatar-img-round avatar-img-round-comment\">\n    </a>\n    <div class=\"comment me-2\">\n      <div class=\"content-comment\"> <!--n\u1ED9i dung comment g\u1ED3m t\xEAn ng\u01B0\u1EDDi cmt v\xE0 n\u1ED9i dung cmt-->\n        <div class=\"bold-text\"><a href=\"/wall?id=").concat(owner.id, "\">").concat(information.showname, "</a></div>\n        <div>").concat(comment.content, "</div>\n      </div>\n      <div class=\"time-comment ssm-text bold-text\"> <!--Th\u1EDDi gian comment-->\n        ").concat(comment.commentdate, "\n      </div>\n    </div>\n    ").concat(editadd, "\n  </div>");
  $("#".concat(postid, " .comment-post-wrapper")).prepend(contentToAdd);
} //hàm hiển thị modal xác nhận xóa comment (đã sử dụng)


function confirmDeleteComment(comment, event) {
  // this=comment
  event.preventDefault(); //lấy ra id của comment

  var commentid = comment.dataset.id; //gắn id vào nút xác nhận xóa của modal xác nhận xóa comment

  $("#confirm-delete-comment-modal #confirmed-delete-comment-modal").attr("data-id", commentid); //hiển thị modal xác nhận xóa

  $("#confirm-delete-comment-modal").modal("show");
} //khi nhấn nút xác nhận xóa một comment (đã sử dụng)


function confirmedDeleteComment(comment) {
  // comment = this
  //lấy ra id của comment
  var commentid = comment.dataset.id; //lấy ra id của bài post

  var postid = $("#".concat(commentid)).parent().parent().attr("id"); //thực hiện gọi ajax xóa comment

  $.ajax({
    url: "/post/deletecomment/".concat(postid),
    type: "post",
    data: {
      commentid: commentid
    }
  }).then(function (result) {
    //thực hiện xóa comment trên view
    deleteCommentView(result.data); //ẩn đi cái modal xác nhận

    $("#confirm-delete-comment-modal").modal("hide");
  })["catch"](function (err) {
    //nếu thất bại thì hiện một thông báo lỗi
    err = JSON.stringify(err);
    err = JSON.parse(err);
    var mess = err.responseJSON.message; //gọi hàm hiển thị modal lưu ý lỗi và ẩn đi cái modal xác nhận

    showLocalModal(mess, "confirm-delete-comment-modal");
  });
} //hàm thực hiện xóa comment trên view (đã sử dụng)


function deleteCommentView(comment) {
  var commentid = comment.commentid; // thực hiện xóa trên view

  $("#".concat(commentid)).remove();
} // hiển thị một modal dùng chung cho một số thông báo về hành động của người dùng (đã sử dụng)


function showLocalModal(message, anothermodalid) {
  //ẩn đi một số modal khác nếu có giá trị
  $("#".concat(anothermodalid)).modal("hide");
  $("#local-modal .modal-body").html(message);
  $("#local-modal").modal("show");
} // hàm thiết lập socket nhận comment mới từ user khác -- browser gửi comment sẽ cũng sẽ nhận được dữ liệu này


function setGiveComment() {
  //thiết lập nhận thông báo realtime khi có một thông báo mới được thêm vào
  var userid = $("#user").attr("data-id");
  iocomment.on("server-send-new-comment-".concat(userid), function (data) {
    var comment = data;
    var postid = comment.postid; // hiển thị lên view
    // console.log("tindeptrai")

    postCommentView(postid, comment);
  });
} //hàm lấy thêm comment -- dựa vào id lấy được (id lấy được là id của bài post) (đã sử dụng) (onclick trong html)


function getMoreComment(commentclick, event) {
  //commentclick = this
  //event = event
  event.preventDefault(); // console.log(commentclick.dataset)

  var postid = commentclick.dataset.id; //tạm thời ẩn đi cái chữ "Xem thêm bình luận" để người dùng không nhấn lần 2

  $("#".concat(postid, " .action-comment")).html(null); //dùng ajax để lấy tất cả comments của bài viết

  $.ajax({
    url: "/post/comment/".concat(postid),
    type: "get"
  }).then(function (result) {
    //clear khu vực hiển thị comment trước
    $("#".concat(postid, " .comment-post-wrapper")).html(null);
    var comments = result.data; //nếu không có giá trị gì thì gắn vào khu vực comment này một câu lưu ý

    if (!comments.length) {
      $("#".concat(postid, " .comment-post-wrapper")).html("<div class=\"text-center red-text not-comment-alert\"> Kh\xF4ng c\xF3 comment \u0111\u1EC3 hi\u1EC3n th\u1ECB </div>"); //hiển thị lại chữ "Xem thêm bình luận"

      $("#".concat(postid, " .action-comment")).html("<a data-id=\"".concat(postid, "\" href=\"#\" class=\"blue-text more-comment\" onclick=\"getMoreComment(this,event);\">Xem th\xEAm b\xECnh lu\u1EADn</a>"));
    } else {
      // nếu có thì hiện lên view
      //comments đang chứa comment theo dữ liệu thời gian giảm dần (mới nhất trước)
      //duyệt mảng comment
      comments.forEach(function (comment) {
        // gọi hàm gán từng comment lên view
        postCommentView(postid, comment);
      }); //hiển thị comment xong thì hiển thị chữ "Ẩn bớt bình luận" để xóa bình luận trong khu vực bình luận

      $("#".concat(postid, " .action-comment")).html("<a data-id=\"".concat(postid, "\" href=\"#\" class=\"blue-text more-comment\" onclick=\"hideComments(this,event);\">\u1EA8n b\u1EDBt b\xECnh lu\u1EADn</a>"));
    }
  })["catch"](function (err) {
    //nếu thất bại thì hiện một thông báo lỗi
    err = JSON.stringify(err);
    err = JSON.parse(err);
    var mess = err.responseJSON.message; //gọi hàm hiển thị modal lưu ý lỗi

    showLocalModal(mess);
  });
} //hàm ẩn bớt bình luận bằng cách xóa đi các bình luận trong khu vực hiển thị bình luận và hiển thị lại chữ "Xem thêm bình luận"


function hideComments(commentclick, event) {
  //event = event
  event.preventDefault();
  var postid = commentclick.dataset.id; //ẩn đi tất cả bình luận

  $("#".concat(postid, " .comment-post-wrapper")).html(null); //hiển thị lại chữ "Xem thêm bình luận"

  $("#".concat(postid, " .action-comment")).html("<a data-id=\"".concat(postid, "\" href=\"#\" class=\"blue-text more-comment\" onclick=\"getMoreComment(this,event);\">Xem th\xEAm b\xECnh lu\u1EADn</a>"));
} //thực hiện lấy 10 post (nhiều nhất 10 post - chạy for get mỗi lần 1 bài cho dễ kiểm soát)
//không nên get 1 lần luôn 10 bài bởi vì ví dụ có bài mới hay bài cũ bị xóa thì sẽ rất khó kiểm soát
// (đã sử dụng)


function loadMorePost() {
  var isWall, userid, queryval, post_wrapper, postsLength, maxPostsToGet, postsArray, i, skip, limit, posts, post;
  return regeneratorRuntime.async(function loadMorePost$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          //kiểm tra xem có phải đang ở tường nhà của người khác không ? nếu phải thì
          //lấy id người đó ra để load bài theo id của người đó
          isWall = location.pathname;

          if (isWall.includes("/wall")) {
            queryval = location.search; // lấy tham số trên url (có bao gồm phần ?..=)

            userid = queryval.split("?id=")[1];
          }

          loadingTimeline = 1; // gán giá trị thể hiện là đang thực hiện load
          //lấy giá trị số lượng bài viết hiện tại (được gắn trên html khi mới khởi động trang)
          // ta sẽ không sài jquery vì nó rất dễ lỗi khi get, set các giá trị dataset

          post_wrapper = document.getElementsByClassName("post-wrapper"); // lấy ra số lượng bài post hiện tại được gắn trên html

          postsLength = post_wrapper[0].dataset.postslength;
          postsLength = parseInt(postsLength); // dùng ajax tiếp tục gọi thêm bài post từ server (nhiều nhất là 10)

          maxPostsToGet = 10; // tạo mảng chứa các bài posts sẽ được up lên

          postsArray = [];
          i = 0;

        case 9:
          if (!(i < maxPostsToGet)) {
            _context2.next = 26;
            break;
          }

          skip = postsLength;
          limit = 1; // thực hiện lấy bài post (ta gọi api lấy số nhiều nhưng limit 1 thì mảng sẽ có 1 phân tử)

          _context2.next = 14;
          return regeneratorRuntime.awrap(loadPostBySkipAndLimit(skip, limit, userid));

        case 14:
          posts = _context2.sent;

          if (posts.length) {
            _context2.next = 17;
            break;
          }

          return _context2.abrupt("break", 26);

        case 17:
          post = posts[0]; //mảng posts chỉ có 1 phần tử là post ta cần tìm nên ta lấy nó ra ở vị trí 0
          // console.log($(`#${post.id}`))
          //nếu post này được lấy về mà bị trùng với cái đã có thì bỏ qua nó và tằng giá trị tiếp tục lấy cái khác

          if (!$("#".concat(post.id)).length) {
            _context2.next = 21;
            break;
          }

          // kiểm tra phần tử có tồn tại chưa bằng cách thêm .length
          postsLength += 1; // tăng giá trị để skip

          return _context2.abrupt("continue", 9);

        case 21:
          //còn nếu có mà không bị trùng thì tăng giá trị lên và thêm vào mảng posts
          postsArray.push(post);
          i += 1;
          postsLength += 1;
          _context2.next = 9;
          break;

        case 26:
          console.log(postsArray); //hiển thị lên view

          postsArray.forEach(function (post) {
            addPostView(post, 2); // thêm 2 để gán post vào cuối view
          }); //cập nhật giá trị postsLength trên html để có thể sử dụng cho skip tiếp

          $(".post-wrapper").attr("data-postslength", postsLength); // mở khóa giá trị loading

          loadingTimeline = 0;

        case 30:
        case "end":
          return _context2.stop();
      }
    }
  });
} //hàm thực hiện lấy 1 post từ server dựa theo giá trị skip, limit và id của người dùng (khi vào tường nhà sẽ có giá trị này)
// (đã sử dụng)


function loadPostBySkipAndLimit(skip, limit, userid) {
  return regeneratorRuntime.async(function loadPostBySkipAndLimit$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          return _context3.abrupt("return", $.ajax({
            url: "/post/get?skip=".concat(skip, "&limit=").concat(limit, "&userid=").concat(userid),
            type: "get"
          }).then(function (result) {
            var posts = result.data;
            return posts;
          })["catch"](function (err) {
            return [];
          }));

        case 1:
        case "end":
          return _context3.stop();
      }
    }
  });
}

function setGiveDeletePost() {
  //thiết lập nhận thông báo realtime khi có một thông báo bị xóa -- và cập nhật lại postsLength (dùng cho giá trị skip trong việc loadtimeline)
  var userid = $("#user").attr("data-id");
  iopost.on("server-send-delete-post-".concat(userid), function (data) {
    //lấy giá trị số lượng bài viết hiện tại (được gắn trên html khi mới khởi động trang)
    // ta sẽ không sài jquery vì nó rất dễ lỗi khi get, set các giá trị dataset
    var post_wrapper = document.getElementsByClassName("post-wrapper"); // lấy ra số lượng bài post hiện tại được gắn trên html

    var postsLength = post_wrapper[0].dataset.postslength; //giảm giá trị postsLength để lát skip cho phần timeline chính xác hơn

    postsLength = postsLength - 1; //cập nhật giá trị postsLength trên html để có thể sử dụng cho skip tiếp

    $(".post-wrapper").attr("data-postslength", postsLength);
    console.log("postlength: " + $(".post-wrapper").attr("data-postslength"));
  });
}