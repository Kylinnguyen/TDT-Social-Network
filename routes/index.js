const express = require("express");
const route = express.Router();


// origin: /

route.get("/",function(req,res){
    res.redirect("/login");
})

module.exports=route;