const Accounts = require("../models/accounts.js");

var add = async function(value){ // thêm tài khoản
    return new Accounts(value).save()
    .then(result=>{
        return result;
    })
    .catch(err=>{
        // console.log(err)
    })
}
var findOne = async function(filter){ // trả về một tài khoản
    return Accounts.findOne(filter).select("username password rolecode email information departresponsible").populate("information.department").populate("departresponsible").exec()
    .then(result=>{
        
        if(result){
            
            return result;
        }
    })
    .catch(err=>{
        
    })
}


var findAccounts = async function(filter){ // trả về nhiều tài khoản
    return Accounts.find(filter).select("username password rolecode email information departresponsible").populate("information.department").populate("departresponsible").exec()
    .then(result=>{
        return result;
    })
    .catch(err=>{
        
    })
}

module.exports={
    add,
    findOne,
    findAccounts
}