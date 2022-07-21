const Departments = require("../models/departments.js");

var add = async function(value){
    return new Departments(value).save()
    .then(result=>{
        return result;
    })
    .catch(err=>{
    //     err = JSON.stringify(err);
    //     err = JSON.parse(err);
    //     console.log("loi ne")
    // //    console.log(err.errors) 
    //     for(e in err.errors){ // lấy ra từng lỗi mà không cần biết nó bị ở field nào (e trong vòng lặp này là tên key -- tên cái field)
    //         console.log(err.errors[e].message) // lấy lỗi dựa theo e (là theo key - theo field)
    //     }
    })
}

var findDepartments = function(filter){
    return Departments.find(filter).exec()
    .then(result=>{
        if(result.length){ // > 0 khi có dữ liệu
            return result;
        }
    })
    .catch(err=>{
        
    })
}

var findDepartment = function(filter){
    return Departments.findOne(filter).exec()
    .then(result=>{
        if(result){
            return result;
        }
    })
    .catch(err=>{

    })
}

module.exports={
    add,
    findDepartments,
    findDepartment
}