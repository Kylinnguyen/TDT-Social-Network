var Posts = require("../models/posts.js");



// thêm một bài post
var add = async function(value){
    return new Posts(value).save()
    .then(result=>{
        console.log(result)
        return result;
    })
    .catch(err=>{
        console.log(err)
    })
}

// tìm một bài post
var findPost = async function(filter){
    //nếu một đối tượng nằm trong một mảng ta cũng có thể populate như comments.owner
    return Posts.findOne(filter).populate("owner").populate("comments.owner").exec()
    .then(result=>{
        return result
    })
    .catch(err=>{
        console.log(err)
    })
}

// tìm nhiều bài posts
var findPosts = async function(filter, skipval, limitval, sortval){
    return Posts.find(filter).skip(skipval).limit(limitval).sort(sortval)
    .populate("owner").populate("comments.owner").exec() 
    .then(result=>{
        return result
    })
    .catch(err=>{
        console.log(err)
    })
}
// tìm nhiều bài posts nhưng không lấy comment (comment sẽ được load sau)
var findPostsWithoutComments = async function(filter, skipval, limitval, sortval){
    return Posts.find(filter).skip(skipval).limit(limitval).sort(sortval).select("-comments")
    .populate("owner").exec() 
    .then(result=>{
        return result
    })
    .catch(err=>{
        console.log(err)
    })
}

var deletePost = function(filter){
    return Posts.deleteOne(filter).exec()
    .then(result=>{
        return result;
    })
    .catch(err=>{
        console.log(err);
    })
}



module.exports = {
    add,
    findPost,
    findPosts,
    deletePost,
    findPostsWithoutComments
}