"use strict";

var Posts = require("../models/posts.js"); // thêm một bài post


var add = function add(value) {
  return regeneratorRuntime.async(function add$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          return _context.abrupt("return", new Posts(value).save().then(function (result) {
            console.log(result);
            return result;
          })["catch"](function (err) {
            console.log(err);
          }));

        case 1:
        case "end":
          return _context.stop();
      }
    }
  });
}; // tìm một bài post


var findPost = function findPost(filter) {
  return regeneratorRuntime.async(function findPost$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          return _context2.abrupt("return", Posts.findOne(filter).populate("owner").populate("comments.owner").exec().then(function (result) {
            return result;
          })["catch"](function (err) {
            console.log(err);
          }));

        case 1:
        case "end":
          return _context2.stop();
      }
    }
  });
}; // tìm nhiều bài posts


var findPosts = function findPosts(filter, skipval, limitval, sortval) {
  return regeneratorRuntime.async(function findPosts$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          return _context3.abrupt("return", Posts.find(filter).skip(skipval).limit(limitval).sort(sortval).populate("owner").populate("comments.owner").exec().then(function (result) {
            return result;
          })["catch"](function (err) {
            console.log(err);
          }));

        case 1:
        case "end":
          return _context3.stop();
      }
    }
  });
}; // tìm nhiều bài posts nhưng không lấy comment (comment sẽ được load sau)


var findPostsWithoutComments = function findPostsWithoutComments(filter, skipval, limitval, sortval) {
  return regeneratorRuntime.async(function findPostsWithoutComments$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          return _context4.abrupt("return", Posts.find(filter).skip(skipval).limit(limitval).sort(sortval).select("-comments").populate("owner").exec().then(function (result) {
            return result;
          })["catch"](function (err) {
            console.log(err);
          }));

        case 1:
        case "end":
          return _context4.stop();
      }
    }
  });
};

var deletePost = function deletePost(filter) {
  return Posts.deleteOne(filter).exec().then(function (result) {
    return result;
  })["catch"](function (err) {
    console.log(err);
  });
};

module.exports = {
  add: add,
  findPost: findPost,
  findPosts: findPosts,
  deletePost: deletePost,
  findPostsWithoutComments: findPostsWithoutComments
};