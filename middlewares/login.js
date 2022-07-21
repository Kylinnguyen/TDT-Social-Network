var checkLogin = function(req,res,next){
    if(req.user){
      
        return res.redirect("/home");
    }
   
  
    
    
    next();
}

module.exports = {
    checkLogin
}