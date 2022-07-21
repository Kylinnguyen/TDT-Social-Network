const { fn } = require("moment");
const { post } = require("../routes");

var notification_manager_show = function(rolecode, options){ //handlebar - helper
    // console.log(options.fn())
    if(rolecode === "AM" || rolecode==="PK"){
        return options.fn();
    }
}
var accounts_manager_show = function(rolecode, options){
    // console.log(options.fn())
    if(rolecode === "AM"){
        return options.fn(this);
    }
}
var change_password_show = function(rolecode, options){
    if(rolecode!="SV"){
        return options.fn();
    }
}
// hàm helper cho việc show ra danh sách phòng khoa (có kiểm tra phụ trách để check) cho view account setting (phân quyền đăng bài)
var showDepartmentForAccountSetting = function(currentDepartment, departments,accountedit, options){ 
    var returnValue = "";
    //nếu tài khoản là sinh viên thì không cần hiện lên
    if(accountedit.rolecode==="SV"){
        return;
    }
    returnValue += `<label class="blue-text">
                        Quyền đăng bài hiện tại
                    </label>`
    departments.forEach(function(depart){
        // không nền dùng === vì mặc dù là chuỗi nhưng bọn này vẫn có dinh dáng đến object id
       if(currentDepartment.find(t=>t.id==depart.id)){ // nếu phòng khoa nào đang được phân quyền cho tài khoản thì checked cho nó
           returnValue +=  `<div class="d-flex flex-row align-items-center mt-2"> <input type="checkbox" name="department[]" id="${depart.id}" value="${depart.id}" checked> <label for="${depart.id}" class="ms-2">${depart.departname}</label> </div>`
       }
       else{ // ngược lại thì không check
        returnValue +=  `<div class="d-flex flex-row align-items-center mt-2"> <input type="checkbox" name="department[]" id="${depart.id}" value="${depart.id}"> <label for="${depart.id}" class="ms-2">${depart.departname}</label> </div>`
       }
    })
    return returnValue;
}

var showDepartmentForAccountInformation = function(currentDepartment, departments, options){
    var returnValue = ""; 
    returnValue += `<option selected id="-1" value="-1">Chưa chọn khoa</option>`
    departments.forEach(function(depart){
        
        // kiểm tra nếu người dùng đã chọn khoa mình rồi thì mới kiểm tra xem chọn khoa nào để hiển thị lại trên view
        if(currentDepartment && depart.id == currentDepartment.id){
            returnValue += `<option selected id="${depart.id}" value="${depart.id}">${depart.departname}</option>`
        }
        else{
            returnValue += `<option id="${depart.id}" value="${depart.id}">${depart.departname}</option>`
        }
    })

    return returnValue;
}

//kiểm tra quyền hạn để hiện nút chỉnh sửa cho bài thông báo
var showEditNotification = function(notification, account, options){
    if(account.rolecode==="AM"){ // nếu là admin thì trả về nút hiển thị sửa luôn chứ không cần xét nữa
        return options.fn(this);
    }
    if(account.rolecode==="PK"){ // là người dùng phòng ban thì kiểm tra
        var department = notification.department; // lấy thông tin phòng ban mà bài viết phụ thuộc
        var departresponsible = account.departresponsible; //lấy thông tin
       // so sánh hai chuỗi tốt nhất nên . về toString để nhiều khi mặc dù là chuỗi nhưng nó lại khác kiểu dữ liệu
        if(departresponsible.find(t=>t.id.toString()==department.id.toString())){ // nếu người dùng có quyền hạn tương ứng
            return options.fn(this);
        }

    }
    
}

var showDepartmentsForEditNotification = function(notification, departments, options){
    var returnValue =``;
    var department = notification.department;
    departments.forEach(function(depart){
        if(depart.id.toString()==department.id.toString()){
            returnValue += `<option selected value="${depart.id}">${depart.departname}</option>`
        }
        else{
            returnValue += `<option value="${depart.id}">${depart.departname}</option>`
        }
    })
    return returnValue;
}
//show phần filter lúc quản lý thông báo
var showFilterManagerNotification = function(departments, department, field, searchvalue, options){
    var returnvalue = ``;
    // show phần select phòng khoa trước
    returnvalue+=` <label class="mt-3" for="select-manager-notification-department">Phòng-khoa</label> <br>
                        <select id="select-manager-notification-department" class="select-notification mt-1" name="department">
                            <option value="all">Tất cả</option>`;
    departments.forEach(function(depart){
        if(depart.id.toString()==department){
            returnvalue+=`<option selected value="${depart.id}">${depart.departname}</option>`
        }
        else{
            returnvalue+=`<option value="${depart.id}">${depart.departname}</option>`
        }
    })
    returnvalue+=`</select><br>
    <label class="mt-3" for="select-manager-notification-field">Kiểu dữ liệu</label><br>
    <select id="select-manager-notification-field" class="select-notification mt-1" name="field">`;
    var fieldArray = [
        {value:"none",content:"Không chọn"},
        {value:"id",content:"Id"},
        {value:"title",content:"Tiêu đề"}
    ]
    fieldArray.forEach(function(fie){
        if(fie.value==field){
            returnvalue +=`<option selected value="${fie.value}">${fie.content}</option>`
        }
        else{
            returnvalue +=`<option value="${fie.value}">${fie.content}</option>`
        }
    })
    if(!searchvalue){
        searchvalue="";
    }
    returnvalue += `</select>

    <div class="d-flex flex-row align-items-center mt-3"> <!--Tìm kiếm thông báo-->
      <input class="my-input flex-grow-1" placeholder="Nhập giá trị tìm kiếm" name="searchvalue" value="${searchvalue}">
    </div>`
    
    return returnvalue;
}
//show phần filter lúc quản lý tài khoản
function showFilterManagerAccounts(rolecode, field, searchvalue, options){
    var returnvalue = ``;
    returnvalue+=`<select class="select-accounts-manager" name="rolecode">`
    var rolecodeArray = [
        {value:"all",content:"Tất cả"},
        {value:"AM",content:"Admin"},
        {value:"PK",content:"Phòng Khoa"},
        {value:"SV",content:"Sinh Viên"}
    ]
    rolecodeArray.forEach(function(role){
        if(role.value === rolecode){
            returnvalue +=`<option selected value="${role.value}">${role.content}</option>`
        }
        else{
            returnvalue +=`<option value="${role.value}">${role.content}</option>`
        }
    })
    returnvalue += `</select>
                    <div class="mt-3 blue-text">Chọn kiểu dữ liệu</div>
                        <select class="select-accounts-manager" name="field">`;
    var fieldArray = [
        {value:"none",content:"Không chọn"},
        {value:"username",content:"Tên tài khoản"}
    ]
    fieldArray.forEach(function(fie){
        if(fie.value === field){
            returnvalue +=`<option selected value="${fie.value}">${fie.content}</option>`
        }
        else{
            returnvalue +=`<option value="${fie.value}">${fie.content}</option>`
        }
    })
    if(!searchvalue){
        searchvalue="";
    }
    returnvalue+=`</select>
                <input class="my-input flex-grow-1" placeholder="Nhập giá trị tìm kiếm" name="searchvalue" value="${searchvalue}">
                <div>
                    <button class="my-btn my-btn-1"> Tìm kiếm </button>
                </div>`;
    return returnvalue;
}

//show phần mấy ô dùng để phân trang cho phần quản lý thông báo
function showPaginationManagerNotifications(department, field, searchvalue, page, numberpage, options){
    /* start: tìm mảng số để in các ô phân trang */
    var pages = numberpage; // tổng số trang có thể có được
    var click = page; // trang mà người dùng đang chọn
    var maxPagination = 5; // số ô để chọn trang tối đa là 5
    var arrDown = [];
    var arrUp= [];
    //tìm cận dưới 
    for(var i=click-1; i%maxPagination!=0;i--){ //i=click-1 là không tính số hiện tại
        arrDown.push(i);
    }
    arrDown.reverse();//đảo mảng lại
    // tìm cận trên (bao gồm luôn số được click)
    //tìm cận dưới 
    for(var i=click; i%maxPagination!=0;i++){
        if(i <= pages){
            arrUp.push(i);
        }
    }
    // thêm giá trị cuối cho cận dưới
    if(i<=pages){
        arrUp.push(i);
    }

    // cuối cùng dùng cận dưới  + cận trên
   // kết quả cuối cùng là mảng số dùng để in ra trang
    var arrFinal = arrDown.concat(arrUp);
    if(click!==1 && click == i && i<pages){ // thêm một option nhỏ để năng cao tính trải nghiệm
                                            // (đó là khi người nhấn vào một trang cuối mà tiếp đó vẫn còn trang thì
                                            // nó sẽ cắt trang đầu tiên đi và hiện trang ở phần tiếp theo 
                                            //vd: 1 2 3 4 5 và vẫn còn 6 7 8 thì chọn 5 sẽ thành 2 3 4 5 6)
        arrFinal.splice(0,1);
        arrFinal.push(i+1)
    }
    /* end: tìm mảng số để in các ô phân trang */

    // thực hiện in dãy phân trang ra
    var returnvalue = ``;
    returnvalue += `<div class="pagination-wrapper">
                        <nav aria-label="Page navigation example">
                        <ul class="pagination mx-auto">`;
    // chuẩn bị các dữ liệu filter và đường dẫn để thêm vào phần href
    var linkHref = `/notification/manager?department=${department}&field=${field}&searchvalue=${searchvalue}`;
    // nếu trang người dùng chọn hiện tại là trang thứ 1 thì không cần thêm nút "Trước" làm gì
    // ngược lại thì có
    
    if(page !== 1){
        returnvalue += `<li class="page-item"><a class="page-link" href="${linkHref}&page=${page-1}">Trước</a></li>`
    }
    arrFinal.forEach(function(num){
        if(num==page){ // nếu num bằng cái page người dùng click thì active nó lên
            returnvalue+=`<li class="page-item active"><a class="page-link" href="${linkHref}&page=${num}">${num}</a></li>`;
        }
        else{
            returnvalue+=`<li class="page-item"><a class="page-link" href="${linkHref}&page=${num}">${num}</a></li>`;
        }
    })
    if(page < numberpage){ // nếu page mà người dùng đang click vẫn còn bé hơn số lượng page có thì hiện nút Tiếp
        returnvalue += `<li class="page-item"><a class="page-link" href="${linkHref}&page=${page+1}">Tiếp</a></li>`
    }
    returnvalue+=`</ul>
                    </nav>
                </div>`;
    return returnvalue;

}

var showListNotifications = function(notifications,options){
    // console.log(notifications)
    if(!notifications.length){
        return;
    }
    var returnValue = ``;
    notifications.forEach(function(notification){
        if(notification.department.departtype=="K"){
            returnValue += `<a href="/notification/details?id=${notification.id}"><!--1 thông báo-->
            <div class="notification notification-odd">
                <div class="ssm-text notification-introduce"> <!--Phần giới thiệu-->
                <div>Khoa ${notification.department.departcode}</div>
                <div>${notification.notificationdate}</div>
                </div>
                <div class="sm-text notification-title"> <!--Phần tiêu đề-->
                    ${notification.title}
                </div>
            </div>
            </a>`
        }
        else{
            returnValue += `<a href="/notification/details?id=${notification.id}"><!--1 thông báo-->
            <div class="notification notification-odd">
                <div class="ssm-text notification-introduce"> <!--Phần giới thiệu-->
                <div>Phòng ${notification.department.departcode}</div>
                <div>${notification.notificationdate}</div>
                </div>
                <div class="sm-text notification-title"> <!--Phần tiêu đề-->
                    ${notification.title}
                </div>
            </div>
            </a>`
        }
    })
    return returnValue;
}
//show phần mấy ô dùng để phân trang cho phần thông báo (show cho người dùng xem)
function showPaginationNotifications(department, page, numberpage, options){
    /* start: tìm mảng số để in các ô phân trang */
    var pages = numberpage; // tổng số trang có thể có được
    var click = page; // trang mà người dùng đang chọn
    var maxPagination = 5; // số ô để chọn trang tối đa là 5
    var arrDown = [];
    var arrUp= [];
    //tìm cận dưới 
    for(var i=click-1; i%maxPagination!=0;i--){ //i=click-1 là không tính số hiện tại
        arrDown.push(i);
    }
    arrDown.reverse();//đảo mảng lại
    // tìm cận trên (bao gồm luôn số được click)
    //tìm cận dưới 
    for(var i=click; i%maxPagination!=0;i++){
        if(i <= pages){
            arrUp.push(i);
        }
    }
    // thêm giá trị cuối cho cận dưới
    if(i<=pages){
        arrUp.push(i);
    }

    // cuối cùng dùng cận dưới  + cận trên
   // kết quả cuối cùng là mảng số dùng để in ra trang
    var arrFinal = arrDown.concat(arrUp);
    if(click!==1 && click == i && i<pages){ // thêm một option nhỏ để năng cao tính trải nghiệm
                                            // (đó là khi người nhấn vào một trang cuối mà tiếp đó vẫn còn trang thì
                                            // nó sẽ cắt trang đầu tiên đi và hiện trang ở phần tiếp theo 
                                            //vd: 1 2 3 4 5 và vẫn còn 6 7 8 thì chọn 5 sẽ thành 2 3 4 5 6)
        arrFinal.splice(0,1);
        arrFinal.push(i+1)
    }
    /* end: tìm mảng số để in các ô phân trang */

    // thực hiện in dãy phân trang ra
    var returnvalue = ``;
    returnvalue += `<div class="pagination-wrapper">
                        <nav aria-label="Page navigation example">
                        <ul class="pagination mx-auto">`;
    // chuẩn bị các dữ liệu filter và đường dẫn để thêm vào phần href
    var linkHref = `/notification?department=${department}`;
    // nếu trang người dùng chọn hiện tại là trang thứ 1 thì không cần thêm nút "Trước" làm gì
    // ngược lại thì có
    
    if(page !== 1){
        returnvalue += `<li class="page-item"><a class="page-link" href="${linkHref}&page=${page-1}">Trước</a></li>`
    }
    arrFinal.forEach(function(num){
        if(num==page){ // nếu num bằng cái page người dùng click thì active nó lên
            returnvalue+=`<li class="page-item active"><a class="page-link" href="${linkHref}&page=${num}">${num}</a></li>`;
        }
        else{
            returnvalue+=`<li class="page-item"><a class="page-link" href="${linkHref}&page=${num}">${num}</a></li>`;
        }
    })
    if(page < numberpage){ // nếu page mà người dùng đang click vẫn còn bé hơn số lượng page có thì hiện nút Tiếp
        returnvalue += `<li class="page-item"><a class="page-link" href="${linkHref}&page=${page+1}">Tiếp</a></li>`
    }
    returnvalue+=`</ul>
                    </nav>
                </div>`;
    return returnvalue;

}

//show phần filter phòng khoa cho người dùng xem thông báo
var showFilterNotifications = function(departments, department,options){
    var returnvalue = ``;
    returnvalue += `<select class="select-notification mt-1" name="department">
                        <option value="all">Tất cả</option>`
    departments.forEach(function(depart){
        if(depart.id.toString()==department){
            returnvalue+=`<option selected value="${depart.id}">${depart.departname}</option>`
        }
        else{
            returnvalue+=`<option value="${depart.id}">${depart.departname}</option>`
        }
    })
    returnvalue += `</select>`;
    return returnvalue;
}

//show phần posts
var showPosts = function(posts, account, options){
    //lấy ra quyền người dùng
    var rolecode = account.rolecode;
    //lấy ra id người dùng
    var userid = account.id;
    //lấy ra avatar người dùng
    var useravatar = account.information.avatar;
    var returnvalue = ``;
    //chạy mảng posts và xét từng post để thêm giá trị lên view
    posts.forEach(function(post){
        returnvalue += showPost(post,rolecode,userid,useravatar);
    })
    return returnvalue;

}
//show 1 post
function showPost(post, rolecode, userid, useravatar){
    // chủ bài post
    var owner = post.owner;
    // id của chủ bài post
    var ownerid = owner.id;
    // thông tin cá nhân của owner (tên hiển thị, ảnh đại diện)
    var information = owner.information;
    var attachedfiles = post.attachedfiles; // mảng các file đính kèm (hình ảnh và video);
    // phần lấy hình và video trong dữ liệu không nên gộp chung (ta tách riêng ra xử lý rồi gộp chung lại)
    var filesToShow=``;
    attachedfiles.forEach(function(file){
        if(file.filetype=="image"){
            filesToShow+=`<hr><div class="options-post-child" data-id="${file.id}" onclick="showModalMiniPost(this);">
                            <img id="${file.id}" src="${file.fileurl}" class="d-block w-100">
                        </div>
                        `
        }
        else{
            filesToShow+=`<hr> <div class="video-post-wrapper" data-id="${file.id}">
                                <iframe data-url="${file.fileurl}" id="${file.id}" width="100%" height="350" src="https://www.youtube.com/embed/${convertYoutubeUrl(file.fileurl)}" allowfullscreen></iframe>
                            </div>
                            `
        }
        
    })
    var editToShow = ``;
    //kiểm tra xem quyền người dùng và sở hữu bài post để quyết định thêm nút edit cho bài post
    //nếu là admin thì thêm thẳng
    //nếu là người dùng bình thường thì kiểm tra có phải chủ nhân bài post không
    if(rolecode==="AM" || (ownerid.toString()==userid.toString())){ // nếu phải thì thêm phần edit vào
        editToShow += `<div class="dropdown">
                            <button class="btn btn-secondary sm-text dropdown-post" type="button" id="dropdownPost" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="fas fa-ellipsis-h"></i>
                            </button>
                            <ul class="dropdown-menu" aria-labelledby="dropdownPost">
                            <li><a class="dropdown-item editpost" href="#" data-id="${post.id}" onclick="showModalEditPost(this,event);">Chỉnh sửa</a></li>
                            <li><a class="dropdown-item deletepost" href="#" data-id="${post.id}" onclick="showModalDeletePost(this,event);">Xóa</a></li>
                            </ul>
                        </div>`
    }
    var toview = `<div class="post p-4" id="${post.id}">
    <!--phần đầu bài-->
    <div class="top-post">
      <a href="/wall?id=${owner.id}" class="me-2 top-post-avatar">
        <img src="${information.avatar}" class="avatar-img-round">
      </a>
      <!--Phần tên hiển thị-->
      <div class="top-post-infor sm-text">
        <div class="bold-text"><a href="/wall?id=${owner.id}">${information.showname}</a></div>
        <div>${post.postdate}</div> <!--dùng sau này hiển thị thời gian-->
      </div>
      <!--Phần dropdown dùng để hiển thị lựa chọn chỉnh sửa hoặc xóa -- chỉ dành cho bài viết của bản thân-->
      ${editToShow}
    </div>
    
    <!--phần nội dung-->
    <div class="content-post-wrapper">
      <span class="content-post">${post.content}</span>
    </div>
    <!--Phần hình ảnh - video -->
    
    <div>
      <div class="img-post-wrapper options-img-videos-wrapper" data-id="${post.id}">
        ${filesToShow}  
      </div>
    </div>
    
    <!--start: Phần bình luận-->
    <hr>
    <div class="comment-post"> <!--Chỗ nhập bình luận của bản thân-->
      <a href="/wall?id=${userid}" class="me-2">
          <img src="${useravatar}" class="avatar-img-round avatar-img-round-comment">
      </a>
      <input data-id="${post.id}" type="text" class="my-input my-input-round" placeholder="Bình luận của bạn" name="comment" onkeydown="typeComment(this,event);">
    </div>
    <div class="comment-post-wrapper"> <!--Các bình luận của bài post-->
      
    </div>
    <!--end: Phần bình luận-->
    
    <div class="action-comment"> <!--Mặc định ta sẽ hiển thị ít nhất 2 comment -- nếu còn nữa thì sẽ nhấn vào đây để tải thêm comment-->
      <a data-id="${post.id}" href="#" class="blue-text more-comment" onclick="getMoreComment(this,event);">Xem thêm bình luận</a>
    </div>
  
  </div>`
    return toview;
}
//hàm lấy ra id từ url youtube (đã sử dụng)
function convertYoutubeUrl(url){
    var regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    var match = url.match(regExp);
    // kiểm tra xem có phải link youtube không
    if (match && match[2].length == 11) { // nếu phải
        return match[2]; // trả về id của link youtube này
    } else { // nếu không phải
        return;
    }
}

//helper dùng để xét xem có hiển thị phần đăng bài viết hay không (lúc vào tường nhà) ?
function showPostLocation(account, userwall,options){
    var currentId = account.id; //id người dùng đang đagnư nhập
    var userId = userwall.id; //id chủ nhân tường nhà
    if(currentId.toString()==userId.toString()){ // nếu phải thì trả về cái chỗ đăng bài
       
        return options.fn(this);
    }

}
//helper dùng để xem xét xem có hiển thị phần ô input nhập lớp hay phần hiển thị lớp hay không ?
function showClassName(rolecode, options){
    if(rolecode==="SV"){ // nếu là sinh viên mới hiển thị
        return options.fn(this);
    }
}


module.exports={
    notification_manager_show,
    accounts_manager_show,
    change_password_show,
    showDepartmentForAccountSetting,
    showDepartmentForAccountInformation,
    showEditNotification,
    showDepartmentsForEditNotification,
    showFilterManagerNotification,
    showFilterManagerAccounts,
    showPaginationManagerNotifications,
    showListNotifications,
    showPaginationNotifications,
    showFilterNotifications,
    showPosts,
    showPostLocation,
    showClassName
}