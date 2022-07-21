$(document).ready(startweb)
var options = 0; // 0 là chưa chọn options nào -- 1 là hình ảnh -- 2 là video
var edit_options = 0; // 0 là chưa chọn options nào -- 1 là hình ảnh -- 2 là video
function startweb(){
    console.log("start");
    // khi click vào cái input của khung đăng bài thì hiện lên một form để đăng bài
    $(".click-to-new-post").bind("click",function(event){
        event.preventDefault();
        WhenClickToNewPost();
    })

    //khi click vào nút hình ảnh trong phần tạo bài đăng thì ẩn đi lựa chọn video và hiển thị lựa chọn hình ảnh
    $("#post-img-options").bind("click",function(){
        HideVideoInput();
        ShowImgInput();
        options=1;
    })
     //khi click vào nút video trong phần chỉnh sửa bài đăng thì ẩn đi lựa chọn hình ảnh và hiển thị lựa chọn video
    $("#post-video-options").bind("click",function(){
        HideImgInput();
        ShowVideoInput();
        options=2;
    })
    //khi click vào nút hình ảnh trong phần chỉnh sửa bài đăng thì ẩn đi lựa chọn video và hiển thị lựa chọn hình ảnh
    $("#edit-post-img-options").bind("click",function(){
        HideEditVideoInput();
        ShowEditImgInput();
        edit_options=1;
    })
     //khi click vào nút video trong phần tạo bài đăng thì ẩn đi lựa chọn hình ảnh và hiển thị lựa chọn video
    $("#edit-post-video-options").bind("click",function(){
        HideEditImgInput();
        ShowEditVideoInput();
        edit_options=2;
    })

    // khi nhấn vào nút xóa một bài đăng
    $(".deletepost").bind("click",function(event){
        event.preventDefault(); // ngưng các hđ hiện tại lại
        ShowPostDeleteConfirm(this);
    })
    // khi nhấn vào nút chỉnh sửa một bài đăng
    $(".editpost").bind("click",function(event){
        event.preventDefault(); // ngưng các hđ hiện tại lại
        ShowPostEditConfirm(this);
    })
    // khi nhấn vào nút xóa một comment
    $(".deletecomment").bind("click",function(event){
        event.preventDefault(); // ngưng các hđ hiện tại lại
        ShowCommentDeleteConfirm(this);
    })
    // hàm ẩn đi alert thông báo về có thông báo mới sau 800 mili giây
    hideNotificationNotify();


    // khi màn hình scroll thì xử lý ẩn - hiện một số thành phần trên header
    $(window).on("scroll",ChangeHeaderWhenScroll);

    // khi nhấn nút xóa file đính kèm của thông báo
    $(".deleteattachnotificationfile").bind("click",function(event){
        event.preventDefault();
        ShowAttachNotificationFileDeleteConfirm(this);
    })

    //khi nhấn nút xóa thông báo
    $("#delete-notification").bind("click",function(event){
        console.log("dsfdfdsfdsf");
        event.preventDefault();
        ShowNotificationDeleteConfirm(this);
    })
    
    //khi nhấn nút sửa thông báo
    $("#edit-notification").bind("click",function(){
        ShowNotificationEditConfirm(this);
    })
    

}

// khi click vào cái input của khung đăng bài thì hiện lên một form để đăng bài
function WhenClickToNewPost(){
    var postModal = new bootstrap.Modal(document.getElementById('postModal'), {
        keyboard: false
      })
      postModal.show();
    HideImgInput(); // ẩn đi lựa chọn hình -- vì khi tắt khung thêm mở lại thì lựa chọn cuối cùng vẫn được lưu
    HideVideoInput(); // tương tự như trên
}
//ẩn lựa chọn video
function HideVideoInput(){
    if(!$("#video-input").hasClass("component-hide")){
        $("#video-input").addClass("component-hide")
    }
    
}
//hiển thị lựa chọn video
function ShowVideoInput(){
    $("#video-input ").removeClass("component-hide")
}
//ẩn lựa chọn hình ảnh
function HideImgInput(){
    if(!$("#img-input").hasClass("component-hide")){
        $("#img-input").addClass("component-hide")
    }
    
}
//hiển thị lựa chọn hình ảnh - cho chỉnh sửa
function ShowImgInput(){
    $("#img-input").removeClass("component-hide")
}

//hiển thị modal chỉnh sửa bài đăng
function ShowPostEditConfirm(post){// post = this 
    var mymodal = new bootstrap.Modal(document.getElementById('editpostModal'), {
        keyboard: false
      })
      mymodal.show();
    HideEditImgInput();// ẩn đi lựa chọn hình -- vì khi tắt khung thêm mở lại thì lựa chọn cuối cùng vẫn được lưu
    HideEditVideoInput(); // như trên
}

//ẩn lựa chọn video - cho chỉnh sửa
function HideEditVideoInput(){
    if(!$("#edit-video-input").hasClass("component-hide")){
        $("#edit-video-input").addClass("component-hide")
    }
    
}
//hiển thị lựa chọn video - cho chỉnh sửa
function ShowEditVideoInput(){
    $("#edit-video-input ").removeClass("component-hide")
}
//ẩn lựa chọn hình ảnh - cho chỉnh sửa
function HideEditImgInput(){
    if(!$("#edit-img-input").hasClass("component-hide")){
        $("#edit-img-input").addClass("component-hide")
    }
    
}
//hiển thị lựa chọn hình ảnh - cho chỉnh sửa
function ShowEditImgInput(){
    $("#edit-img-input").removeClass("component-hide")
}



//hiển thị modal xác nhận xóa bài đăng
function ShowPostDeleteConfirm(post){ // post = this 
    var postDeleteConfirmModal = new bootstrap.Modal(document.getElementById('confirmdeletepostModal'), {
        keyboard: false
      })
      postDeleteConfirmModal.show();
}

//hiển thị modal xác nhận xóa comment
function ShowCommentDeleteConfirm(comment){ // comment=this
    var commentDeleteConfirmModal = new bootstrap.Modal(document.getElementById('confirmdeletecommentModal'), {
        keyboard: false
      })
      commentDeleteConfirmModal.show();
}

//hiển thị modal xác nhận xóa file đính kèm của thông báo
function ShowAttachNotificationFileDeleteConfirm(attachfile){ //this=attachfile
    var mymodal = new bootstrap.Modal(document.getElementById('confirmdeletenotificationfileModal'), {
        keyboard: false
      })
      mymodal.show();
}

//hiển thị modal xác nhận xóa thông báo
function ShowNotificationDeleteConfirm(notification){
    
    var mymodal = new bootstrap.Modal(document.getElementById('confirmdeletenotificationModal'), {
        keyboard: false
      })
      mymodal.show();
}
//hiển thị modal xác nhận sửa thông báo
function ShowNotificationEditConfirm(notification){
    
    var mymodal = new bootstrap.Modal(document.getElementById('confirmeditnotificationModal'), {
        keyboard: false
      })
      mymodal.show();
}

// hàm ẩn đi alert thông báo về có thông báo mới sau 800 mili giây
function hideNotificationNotify(){
    setTimeout(function(){
      var myAlert = new bootstrap.Alert(document.getElementById("notificationNotify"));
      myAlert.close();
    },800)
}
//hàm xử lý khi header scroll
function ChangeHeaderWhenScroll(){
  
    if($(window).scrollTop() > 50) {
        $(".header-scroll").removeClass("component-hide");

    } else { 
        //remove the background property so it comes transparent again (defined in your css)
       $(".header-scroll").addClass("component-hide");
     
    }
}
