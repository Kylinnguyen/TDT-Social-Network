const fs = require("fs");

//gọi module để tương tác firebase storage
var admin = require("firebase-admin");
//module xử lý đường dẫn file
const path = require("path");
//module dùng để tạo tên file tránh bị trúng
const saltedMd5=require('salted-md5'); //DÙNG ĐỂ MÃ HÓA TÊN FILE để tránh bị trùng
//module dùng để tạo mã token access cho file khi up lên firebase storage
const uuidv4 = require('uuid-v4');//dùng để tạo một token access cho file khi up lên firebase storage


var serviceAccount = require("./tretre-4726b-firebase-adminsdk-jt8x0-d1385bb946.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://tretre-4726b.firebaseio.com",
  storageBucket: "gs://tretre-4726b.appspot.com"
});









function deleteAllFileInTmp(req){ // hàm dùng để xóa hết file trong thư mục tạm nếu có
    var files = req.files;
    if(files.length){
        files.forEach(function(file){
            fs.unlinkSync(file.path);
        })
    }
}

function deleteFileInTmp(file){ //hàm dùng để xóa một file trong file tạm
    fs.unlinkSync(file.path);
}

async function moveFile(file, id, modelname){
    console.log(file)
    //tạo một mã access token cho file khi up lên firebase storage
    var uuid = uuidv4();
    //chuẩn bị name cho file
    const filename = Date.now() + saltedMd5(file.originalname, 'SUPER-S@LT!') + "_" +file.originalname; //tên file chưa có đuôi
    
    
    //đường dẫn để upload lên firebase (và dùng để tương tác sau này)
    var path = `${modelname}/${id}/${filename}`;
    //tiến hành up load lên server
    var result = await admin.storage().bucket().upload(file.path,{ //file.path là đường dẫn file tạm
        destination:path, //là đường dẫn muốn lưu trên filebase storage
        metadata:{ //thêm dữ liệu này để tạo một access token cho phép xem file
            metadata: {
                firebaseStorageDownloadTokens: uuid,
            }
        }
    })
    //xóa file trong thư mục tạm
    deleteFileInTmp(file)
    // console.log(result[0].metadata.bucket);
    // var bucketname = result[0].metadata.bucket;
    //đường dẫn cuối cùng dùng để hiển thị lên view
    
    var dataUpload = result[0]; //dữ liệu được trả về sau khi upload
    // console.log(dataUpload)
    var bucketname = dataUpload.metadata.bucket; //lấy ra tên bucket
    var newfilename = encodeURIComponent(dataUpload.name); //lấy ra tên file được lưu trên server và mã hóa nó cho phù hợp với đường dẫn
    var urlToSave = "https://firebasestorage.googleapis.com/v0/b/" + bucketname + "/o/" + newfilename + "?alt=media&token=" + uuid;
    //tên file ban đầu lúc chưa chuyển đổi
    var originalname = file.originalname;
    //trả về 3 giá trị
    // urlToSave: đường dẫn để hiển thị lên view
    // originalname: tên file ban đầu người dùng up lên chưa được chuyển đổi
    // path: đường dẫn dùng để tương tác với dịch vụ lưu trữ (dùng để xóa chẳng hạn)
    return {urlToSave:urlToSave,originalname:originalname,path:path}
}


async function moveFiles(req,id,modelname){
    //req dùng để lấy files từ req.files
    //id: id của bài viết hoặc thông báo (hoặc của một đối tượng nào đó)
    //modelname: tên của một đối tượng (ví dụ như: posts, notifications,...)
    
    var files = req.files;
    var pathToSaveArray = []; // mảng chưa đường dẫn để lưu vào csdl
    var originFileNameArray = []; // mảng chứa tên file lúc chưa chuyển đổi để hiển thị lên view cho đẹp
    var pathToInteract = []; // mảng dùng để chứa path tương tác với dịch vụ lưu trữ
    for(indexfile in files){ //lấy từng index (lưu ý là index chứ không phải một file)
        var file = files[indexfile];
        var {urlToSave,originalname,path} = await moveFile(file,id,modelname);
        //ép vào từng mảng
        pathToSaveArray.push(urlToSave);
        originFileNameArray.push(originalname);
        pathToInteract.push(path);
        
    }
    
    //trả về các đường dẫn để lưu vào csdl
    return [pathToSaveArray,originFileNameArray,pathToInteract];
}

//dùng để delete một file trên server
async function deleteFile(path){
    //nếu không tồn tại thì có thể bị lỗi, do đó ta đặt then catch để có lỗi cũng bị bỏ qua
    admin.storage().bucket().file(path).delete()
    .then(result=>{

    })
    .catch(err=>{

    })
}

module.exports = {
    deleteAllFileInTmp,
    moveFiles,
    moveFile,
    deleteFile
}