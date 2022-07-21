var Notifications = require("../models/notifications.js");


var add = async function(value){ // thêm thông báo
    return new Notifications(value).save()
    .then(result=>{
        return result;
    })
    .catch(err=>{
        console.log(err)
    })
}

var findNotification = async function(filter){ // lấy ra một thông báo
    return Notifications.findOne(filter).populate("department").exec()
    .then(result=>{
        return result;
    })
    .catch(err=>{
        // console.log(err);
    })
}

var findNotifications = async function(filter, skipval, limitval, sortval){ 
                                                       
    return Notifications.find(filter).skip(skipval).limit(limitval).sort(sortval).populate("department").exec()
    .then(result=>{
        return result;
    })
    .catch(err=>{
        console.log(err);
    })
} 
var countNotifications = async function(filter){ //đếm tất cả các thông báo
    return Notifications.count(filter)
    .then(result=>{
        return result;
    })
    .catch(err=>{
        // console.log(err);
    })
}

//xóa một bài thông báo
var deleteNotification = async function(filter){
    return Notifications.deleteOne(filter).exec()
    .then(result=>{
        return result
    })
    .catch(err=>{
        console.log(err);
    })
}


module.exports = {
    add,
    findNotification,
    findNotifications,
    countNotifications,
    deleteNotification
}