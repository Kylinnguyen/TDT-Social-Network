const Roles = require("../models/roles.js");

var add = async function(value){
    return new Roles(value).save()
    .then(result=>{
        return result;
    })
    .catch(err=>{

    })
}


module.exports={
    add
}