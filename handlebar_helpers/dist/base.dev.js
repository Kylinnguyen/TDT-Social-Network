"use strict";

var _require = require("moment"),
    fn = _require.fn;

var _require2 = require("../routes"),
    post = _require2.post;

var notification_manager_show = function notification_manager_show(rolecode, options) {
  //handlebar - helper
  // console.log(options.fn())
  if (rolecode === "AM" || rolecode === "PK") {
    return options.fn();
  }
};

var accounts_manager_show = function accounts_manager_show(rolecode, options) {
  // console.log(options.fn())
  if (rolecode === "AM") {
    return options.fn(this);
  }
};

var change_password_show = function change_password_show(rolecode, options) {
  if (rolecode != "SV") {
    return options.fn();
  }
}; // hàm helper cho việc show ra danh sách phòng khoa (có kiểm tra phụ trách để check) cho view account setting (phân quyền đăng bài)


var showDepartmentForAccountSetting = function showDepartmentForAccountSetting(currentDepartment, departments, accountedit, options) {
  var returnValue = ""; //nếu tài khoản là sinh viên thì không cần hiện lên

  if (accountedit.rolecode === "SV") {
    return;
  }

  returnValue += "<label class=\"blue-text\">\n                        Quy\u1EC1n \u0111\u0103ng b\xE0i hi\u1EC7n t\u1EA1i\n                    </label>";
  departments.forEach(function (depart) {
    // không nền dùng === vì mặc dù là chuỗi nhưng bọn này vẫn có dinh dáng đến object id
    if (currentDepartment.find(function (t) {
      return t.id == depart.id;
    })) {
      // nếu phòng khoa nào đang được phân quyền cho tài khoản thì checked cho nó
      returnValue += "<div class=\"d-flex flex-row align-items-center mt-2\"> <input type=\"checkbox\" name=\"department[]\" id=\"".concat(depart.id, "\" value=\"").concat(depart.id, "\" checked> <label for=\"").concat(depart.id, "\" class=\"ms-2\">").concat(depart.departname, "</label> </div>");
    } else {
      // ngược lại thì không check
      returnValue += "<div class=\"d-flex flex-row align-items-center mt-2\"> <input type=\"checkbox\" name=\"department[]\" id=\"".concat(depart.id, "\" value=\"").concat(depart.id, "\"> <label for=\"").concat(depart.id, "\" class=\"ms-2\">").concat(depart.departname, "</label> </div>");
    }
  });
  return returnValue;
};

var showDepartmentForAccountInformation = function showDepartmentForAccountInformation(currentDepartment, departments, options) {
  var returnValue = "";
  returnValue += "<option selected id=\"-1\" value=\"-1\">Ch\u01B0a ch\u1ECDn khoa</option>";
  departments.forEach(function (depart) {
    // kiểm tra nếu người dùng đã chọn khoa mình rồi thì mới kiểm tra xem chọn khoa nào để hiển thị lại trên view
    if (currentDepartment && depart.id == currentDepartment.id) {
      returnValue += "<option selected id=\"".concat(depart.id, "\" value=\"").concat(depart.id, "\">").concat(depart.departname, "</option>");
    } else {
      returnValue += "<option id=\"".concat(depart.id, "\" value=\"").concat(depart.id, "\">").concat(depart.departname, "</option>");
    }
  });
  return returnValue;
}; //kiểm tra quyền hạn để hiện nút chỉnh sửa cho bài thông báo


var showEditNotification = function showEditNotification(notification, account, options) {
  if (account.rolecode === "AM") {
    // nếu là admin thì trả về nút hiển thị sửa luôn chứ không cần xét nữa
    return options.fn(this);
  }

  if (account.rolecode === "PK") {
    // là người dùng phòng ban thì kiểm tra
    var department = notification.department; // lấy thông tin phòng ban mà bài viết phụ thuộc

    var departresponsible = account.departresponsible; //lấy thông tin
    // so sánh hai chuỗi tốt nhất nên . về toString để nhiều khi mặc dù là chuỗi nhưng nó lại khác kiểu dữ liệu

    if (departresponsible.find(function (t) {
      return t.id.toString() == department.id.toString();
    })) {
      // nếu người dùng có quyền hạn tương ứng
      return options.fn(this);
    }
  }
};

var showDepartmentsForEditNotification = function showDepartmentsForEditNotification(notification, departments, options) {
  var returnValue = "";
  var department = notification.department;
  departments.forEach(function (depart) {
    if (depart.id.toString() == department.id.toString()) {
      returnValue += "<option selected value=\"".concat(depart.id, "\">").concat(depart.departname, "</option>");
    } else {
      returnValue += "<option value=\"".concat(depart.id, "\">").concat(depart.departname, "</option>");
    }
  });
  return returnValue;
}; //show phần filter lúc quản lý thông báo


var showFilterManagerNotification = function showFilterManagerNotification(departments, department, field, searchvalue, options) {
  var returnvalue = ""; // show phần select phòng khoa trước

  returnvalue += " <label class=\"mt-3\" for=\"select-manager-notification-department\">Ph\xF2ng-khoa</label> <br>\n                        <select id=\"select-manager-notification-department\" class=\"select-notification mt-1\" name=\"department\">\n                            <option value=\"all\">T\u1EA5t c\u1EA3</option>";
  departments.forEach(function (depart) {
    if (depart.id.toString() == department) {
      returnvalue += "<option selected value=\"".concat(depart.id, "\">").concat(depart.departname, "</option>");
    } else {
      returnvalue += "<option value=\"".concat(depart.id, "\">").concat(depart.departname, "</option>");
    }
  });
  returnvalue += "</select><br>\n    <label class=\"mt-3\" for=\"select-manager-notification-field\">Ki\u1EC3u d\u1EEF li\u1EC7u</label><br>\n    <select id=\"select-manager-notification-field\" class=\"select-notification mt-1\" name=\"field\">";
  var fieldArray = [{
    value: "none",
    content: "Không chọn"
  }, {
    value: "id",
    content: "Id"
  }, {
    value: "title",
    content: "Tiêu đề"
  }];
  fieldArray.forEach(function (fie) {
    if (fie.value == field) {
      returnvalue += "<option selected value=\"".concat(fie.value, "\">").concat(fie.content, "</option>");
    } else {
      returnvalue += "<option value=\"".concat(fie.value, "\">").concat(fie.content, "</option>");
    }
  });

  if (!searchvalue) {
    searchvalue = "";
  }

  returnvalue += "</select>\n\n    <div class=\"d-flex flex-row align-items-center mt-3\"> <!--T\xECm ki\u1EBFm th\xF4ng b\xE1o-->\n      <input class=\"my-input flex-grow-1\" placeholder=\"Nh\u1EADp gi\xE1 tr\u1ECB t\xECm ki\u1EBFm\" name=\"searchvalue\" value=\"".concat(searchvalue, "\">\n    </div>");
  return returnvalue;
}; //show phần filter lúc quản lý tài khoản


function showFilterManagerAccounts(rolecode, field, searchvalue, options) {
  var returnvalue = "";
  returnvalue += "<select class=\"select-accounts-manager\" name=\"rolecode\">";
  var rolecodeArray = [{
    value: "all",
    content: "Tất cả"
  }, {
    value: "AM",
    content: "Admin"
  }, {
    value: "PK",
    content: "Phòng Khoa"
  }, {
    value: "SV",
    content: "Sinh Viên"
  }];
  rolecodeArray.forEach(function (role) {
    if (role.value === rolecode) {
      returnvalue += "<option selected value=\"".concat(role.value, "\">").concat(role.content, "</option>");
    } else {
      returnvalue += "<option value=\"".concat(role.value, "\">").concat(role.content, "</option>");
    }
  });
  returnvalue += "</select>\n                    <div class=\"mt-3 blue-text\">Ch\u1ECDn ki\u1EC3u d\u1EEF li\u1EC7u</div>\n                        <select class=\"select-accounts-manager\" name=\"field\">";
  var fieldArray = [{
    value: "none",
    content: "Không chọn"
  }, {
    value: "username",
    content: "Tên tài khoản"
  }];
  fieldArray.forEach(function (fie) {
    if (fie.value === field) {
      returnvalue += "<option selected value=\"".concat(fie.value, "\">").concat(fie.content, "</option>");
    } else {
      returnvalue += "<option value=\"".concat(fie.value, "\">").concat(fie.content, "</option>");
    }
  });

  if (!searchvalue) {
    searchvalue = "";
  }

  returnvalue += "</select>\n                <input class=\"my-input flex-grow-1\" placeholder=\"Nh\u1EADp gi\xE1 tr\u1ECB t\xECm ki\u1EBFm\" name=\"searchvalue\" value=\"".concat(searchvalue, "\">\n                <div>\n                    <button class=\"my-btn my-btn-1\"> T\xECm ki\u1EBFm </button>\n                </div>");
  return returnvalue;
} //show phần mấy ô dùng để phân trang cho phần quản lý thông báo


function showPaginationManagerNotifications(department, field, searchvalue, page, numberpage, options) {
  /* start: tìm mảng số để in các ô phân trang */
  var pages = numberpage; // tổng số trang có thể có được

  var click = page; // trang mà người dùng đang chọn

  var maxPagination = 5; // số ô để chọn trang tối đa là 5

  var arrDown = [];
  var arrUp = []; //tìm cận dưới 

  for (var i = click - 1; i % maxPagination != 0; i--) {
    //i=click-1 là không tính số hiện tại
    arrDown.push(i);
  }

  arrDown.reverse(); //đảo mảng lại
  // tìm cận trên (bao gồm luôn số được click)
  //tìm cận dưới 

  for (var i = click; i % maxPagination != 0; i++) {
    if (i <= pages) {
      arrUp.push(i);
    }
  } // thêm giá trị cuối cho cận dưới


  if (i <= pages) {
    arrUp.push(i);
  } // cuối cùng dùng cận dưới  + cận trên
  // kết quả cuối cùng là mảng số dùng để in ra trang


  var arrFinal = arrDown.concat(arrUp);

  if (click !== 1 && click == i && i < pages) {
    // thêm một option nhỏ để năng cao tính trải nghiệm
    // (đó là khi người nhấn vào một trang cuối mà tiếp đó vẫn còn trang thì
    // nó sẽ cắt trang đầu tiên đi và hiện trang ở phần tiếp theo 
    //vd: 1 2 3 4 5 và vẫn còn 6 7 8 thì chọn 5 sẽ thành 2 3 4 5 6)
    arrFinal.splice(0, 1);
    arrFinal.push(i + 1);
  }
  /* end: tìm mảng số để in các ô phân trang */
  // thực hiện in dãy phân trang ra


  var returnvalue = "";
  returnvalue += "<div class=\"pagination-wrapper\">\n                        <nav aria-label=\"Page navigation example\">\n                        <ul class=\"pagination mx-auto\">"; // chuẩn bị các dữ liệu filter và đường dẫn để thêm vào phần href

  var linkHref = "/notification/manager?department=".concat(department, "&field=").concat(field, "&searchvalue=").concat(searchvalue); // nếu trang người dùng chọn hiện tại là trang thứ 1 thì không cần thêm nút "Trước" làm gì
  // ngược lại thì có

  if (page !== 1) {
    returnvalue += "<li class=\"page-item\"><a class=\"page-link\" href=\"".concat(linkHref, "&page=").concat(page - 1, "\">Tr\u01B0\u1EDBc</a></li>");
  }

  arrFinal.forEach(function (num) {
    if (num == page) {
      // nếu num bằng cái page người dùng click thì active nó lên
      returnvalue += "<li class=\"page-item active\"><a class=\"page-link\" href=\"".concat(linkHref, "&page=").concat(num, "\">").concat(num, "</a></li>");
    } else {
      returnvalue += "<li class=\"page-item\"><a class=\"page-link\" href=\"".concat(linkHref, "&page=").concat(num, "\">").concat(num, "</a></li>");
    }
  });

  if (page < numberpage) {
    // nếu page mà người dùng đang click vẫn còn bé hơn số lượng page có thì hiện nút Tiếp
    returnvalue += "<li class=\"page-item\"><a class=\"page-link\" href=\"".concat(linkHref, "&page=").concat(page + 1, "\">Ti\u1EBFp</a></li>");
  }

  returnvalue += "</ul>\n                    </nav>\n                </div>";
  return returnvalue;
}

var showListNotifications = function showListNotifications(notifications, options) {
  // console.log(notifications)
  if (!notifications.length) {
    return;
  }

  var returnValue = "";
  notifications.forEach(function (notification) {
    if (notification.department.departtype == "K") {
      returnValue += "<a href=\"/notification/details?id=".concat(notification.id, "\"><!--1 th\xF4ng b\xE1o-->\n            <div class=\"notification notification-odd\">\n                <div class=\"ssm-text notification-introduce\"> <!--Ph\u1EA7n gi\u1EDBi thi\u1EC7u-->\n                <div>Khoa ").concat(notification.department.departcode, "</div>\n                <div>").concat(notification.notificationdate, "</div>\n                </div>\n                <div class=\"sm-text notification-title\"> <!--Ph\u1EA7n ti\xEAu \u0111\u1EC1-->\n                    ").concat(notification.title, "\n                </div>\n            </div>\n            </a>");
    } else {
      returnValue += "<a href=\"/notification/details?id=".concat(notification.id, "\"><!--1 th\xF4ng b\xE1o-->\n            <div class=\"notification notification-odd\">\n                <div class=\"ssm-text notification-introduce\"> <!--Ph\u1EA7n gi\u1EDBi thi\u1EC7u-->\n                <div>Ph\xF2ng ").concat(notification.department.departcode, "</div>\n                <div>").concat(notification.notificationdate, "</div>\n                </div>\n                <div class=\"sm-text notification-title\"> <!--Ph\u1EA7n ti\xEAu \u0111\u1EC1-->\n                    ").concat(notification.title, "\n                </div>\n            </div>\n            </a>");
    }
  });
  return returnValue;
}; //show phần mấy ô dùng để phân trang cho phần thông báo (show cho người dùng xem)


function showPaginationNotifications(department, page, numberpage, options) {
  /* start: tìm mảng số để in các ô phân trang */
  var pages = numberpage; // tổng số trang có thể có được

  var click = page; // trang mà người dùng đang chọn

  var maxPagination = 5; // số ô để chọn trang tối đa là 5

  var arrDown = [];
  var arrUp = []; //tìm cận dưới 

  for (var i = click - 1; i % maxPagination != 0; i--) {
    //i=click-1 là không tính số hiện tại
    arrDown.push(i);
  }

  arrDown.reverse(); //đảo mảng lại
  // tìm cận trên (bao gồm luôn số được click)
  //tìm cận dưới 

  for (var i = click; i % maxPagination != 0; i++) {
    if (i <= pages) {
      arrUp.push(i);
    }
  } // thêm giá trị cuối cho cận dưới


  if (i <= pages) {
    arrUp.push(i);
  } // cuối cùng dùng cận dưới  + cận trên
  // kết quả cuối cùng là mảng số dùng để in ra trang


  var arrFinal = arrDown.concat(arrUp);

  if (click !== 1 && click == i && i < pages) {
    // thêm một option nhỏ để năng cao tính trải nghiệm
    // (đó là khi người nhấn vào một trang cuối mà tiếp đó vẫn còn trang thì
    // nó sẽ cắt trang đầu tiên đi và hiện trang ở phần tiếp theo 
    //vd: 1 2 3 4 5 và vẫn còn 6 7 8 thì chọn 5 sẽ thành 2 3 4 5 6)
    arrFinal.splice(0, 1);
    arrFinal.push(i + 1);
  }
  /* end: tìm mảng số để in các ô phân trang */
  // thực hiện in dãy phân trang ra


  var returnvalue = "";
  returnvalue += "<div class=\"pagination-wrapper\">\n                        <nav aria-label=\"Page navigation example\">\n                        <ul class=\"pagination mx-auto\">"; // chuẩn bị các dữ liệu filter và đường dẫn để thêm vào phần href

  var linkHref = "/notification?department=".concat(department); // nếu trang người dùng chọn hiện tại là trang thứ 1 thì không cần thêm nút "Trước" làm gì
  // ngược lại thì có

  if (page !== 1) {
    returnvalue += "<li class=\"page-item\"><a class=\"page-link\" href=\"".concat(linkHref, "&page=").concat(page - 1, "\">Tr\u01B0\u1EDBc</a></li>");
  }

  arrFinal.forEach(function (num) {
    if (num == page) {
      // nếu num bằng cái page người dùng click thì active nó lên
      returnvalue += "<li class=\"page-item active\"><a class=\"page-link\" href=\"".concat(linkHref, "&page=").concat(num, "\">").concat(num, "</a></li>");
    } else {
      returnvalue += "<li class=\"page-item\"><a class=\"page-link\" href=\"".concat(linkHref, "&page=").concat(num, "\">").concat(num, "</a></li>");
    }
  });

  if (page < numberpage) {
    // nếu page mà người dùng đang click vẫn còn bé hơn số lượng page có thì hiện nút Tiếp
    returnvalue += "<li class=\"page-item\"><a class=\"page-link\" href=\"".concat(linkHref, "&page=").concat(page + 1, "\">Ti\u1EBFp</a></li>");
  }

  returnvalue += "</ul>\n                    </nav>\n                </div>";
  return returnvalue;
} //show phần filter phòng khoa cho người dùng xem thông báo


var showFilterNotifications = function showFilterNotifications(departments, department, options) {
  var returnvalue = "";
  returnvalue += "<select class=\"select-notification mt-1\" name=\"department\">\n                        <option value=\"all\">T\u1EA5t c\u1EA3</option>";
  departments.forEach(function (depart) {
    if (depart.id.toString() == department) {
      returnvalue += "<option selected value=\"".concat(depart.id, "\">").concat(depart.departname, "</option>");
    } else {
      returnvalue += "<option value=\"".concat(depart.id, "\">").concat(depart.departname, "</option>");
    }
  });
  returnvalue += "</select>";
  return returnvalue;
}; //show phần posts


var showPosts = function showPosts(posts, account, options) {
  //lấy ra quyền người dùng
  var rolecode = account.rolecode; //lấy ra id người dùng

  var userid = account.id;
  var returnvalue = ""; //chạy mảng posts và xét từng post để thêm giá trị lên view

  posts.forEach(function (post) {
    returnvalue += showPost(post, rolecode, userid);
  });
  return returnvalue;
}; //show 1 post


function showPost(post, rolecode, userid) {
  // chủ bài post
  var owner = post.owner; // id của chủ bài post

  var ownerid = owner.id; // thông tin cá nhân của owner (tên hiển thị, ảnh đại diện)

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

  var toview = "<div class=\"post p-4\" id=\"".concat(post.id, "\">\n    <!--ph\u1EA7n \u0111\u1EA7u b\xE0i-->\n    <div class=\"top-post\">\n      <a href=\"/wall?id=").concat(owner.id, "\" class=\"me-2 top-post-avatar\">\n        <img src=\"").concat(information.avatar, "\" class=\"avatar-img-round\">\n      </a>\n      <!--Ph\u1EA7n t\xEAn hi\u1EC3n th\u1ECB-->\n      <div class=\"top-post-infor sm-text\">\n        <div class=\"bold-text\"><a href=\"/wall?id=").concat(owner.id, "\">").concat(information.showname, "</a></div>\n        <div>").concat(post.postdate, "</div> <!--d\xF9ng sau n\xE0y hi\u1EC3n th\u1ECB th\u1EDDi gian-->\n      </div>\n      <!--Ph\u1EA7n dropdown d\xF9ng \u0111\u1EC3 hi\u1EC3n th\u1ECB l\u1EF1a ch\u1ECDn ch\u1EC9nh s\u1EEDa ho\u1EB7c x\xF3a -- ch\u1EC9 d\xE0nh cho b\xE0i vi\u1EBFt c\u1EE7a b\u1EA3n th\xE2n-->\n      ").concat(editToShow, "\n    </div>\n    \n    <!--ph\u1EA7n n\u1ED9i dung-->\n    <div class=\"content-post-wrapper\">\n      <span class=\"content-post\">").concat(post.content, "</span>\n    </div>\n    <!--Ph\u1EA7n h\xECnh \u1EA3nh - video -->\n    \n    <div>\n      <div class=\"img-post-wrapper options-img-videos-wrapper\" data-id=\"").concat(post.id, "\">\n        ").concat(filesToShow, "  \n      </div>\n    </div>\n    \n    <!--start: Ph\u1EA7n b\xECnh lu\u1EADn-->\n    <hr>\n    <div class=\"comment-post\"> <!--Ch\u1ED7 nh\u1EADp b\xECnh lu\u1EADn c\u1EE7a b\u1EA3n th\xE2n-->\n      <a href=\"/wall?id=").concat(owner.id, "\" class=\"me-2\">\n          <img src=\"").concat(information.avatar, "\" class=\"avatar-img-round avatar-img-round-comment\">\n      </a>\n      <input data-id=\"").concat(post.id, "\" type=\"text\" class=\"my-input my-input-round\" placeholder=\"B\xECnh lu\u1EADn c\u1EE7a b\u1EA1n\" name=\"comment\" onkeydown=\"typeComment(this,event);\">\n    </div>\n    <div class=\"comment-post-wrapper\"> <!--C\xE1c b\xECnh lu\u1EADn c\u1EE7a b\xE0i post-->\n      \n    </div>\n    <!--end: Ph\u1EA7n b\xECnh lu\u1EADn-->\n    \n    <div class=\"action-comment\"> <!--M\u1EB7c \u0111\u1ECBnh ta s\u1EBD hi\u1EC3n th\u1ECB \xEDt nh\u1EA5t 2 comment -- n\u1EBFu c\xF2n n\u1EEFa th\xEC s\u1EBD nh\u1EA5n v\xE0o \u0111\xE2y \u0111\u1EC3 t\u1EA3i th\xEAm comment-->\n      <a data-id=\"").concat(post.id, "\" href=\"#\" class=\"blue-text more-comment\" onclick=\"getMoreComment(this,event);\">Xem th\xEAm b\xECnh lu\u1EADn</a>\n    </div>\n  \n  </div>");
  return toview;
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
} //helper dùng để xét xem có hiển thị phần đăng bài viết hay không (lúc vào tường nhà) ?


function showPostLocation(account, userwall, options) {
  var currentId = account.id; //id người dùng đang đagnư nhập

  var userId = userwall.id; //id chủ nhân tường nhà

  if (currentId.toString() == userId.toString()) {
    // nếu phải thì trả về cái chỗ đăng bài
    return options.fn(this);
  }
} //helper dùng để xem xét xem có hiển thị phần ô input nhập lớp hay phần hiển thị lớp hay không ?


function showClassName(rolecode, options) {
  if (rolecode === "SV") {
    // nếu là sinh viên mới hiển thị
    return options.fn(this);
  }
}

module.exports = {
  notification_manager_show: notification_manager_show,
  accounts_manager_show: accounts_manager_show,
  change_password_show: change_password_show,
  showDepartmentForAccountSetting: showDepartmentForAccountSetting,
  showDepartmentForAccountInformation: showDepartmentForAccountInformation,
  showEditNotification: showEditNotification,
  showDepartmentsForEditNotification: showDepartmentsForEditNotification,
  showFilterManagerNotification: showFilterManagerNotification,
  showFilterManagerAccounts: showFilterManagerAccounts,
  showPaginationManagerNotifications: showPaginationManagerNotifications,
  showListNotifications: showListNotifications,
  showPaginationNotifications: showPaginationNotifications,
  showFilterNotifications: showFilterNotifications,
  showPosts: showPosts,
  showPostLocation: showPostLocation,
  showClassName: showClassName
};