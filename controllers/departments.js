const departmentsService = require("../services/departments.js");


// var addRes = function(result){ // thêm xử lý kết quả thêm
//     console.log(result)
// }
// var addError = function(err){ // hàm xử lý lỗi từ việc thêm
//     /* chuyển đổi 2 bước này để in ra được lỗi đẹp hơn theo dạng json */
//     err = JSON.stringify(err)
//     err = JSON.parse(err)
//     console.log("Xảy ra lỗi khi thêm dữ liệu")
//     console.log(err.errors)
// }

var add = function(){ /* thêm danh sách phòng - khoa */
    var departments = [ /* mảng danh sách phòng - khoa */
        {
            departcode: "CTHSSV",
            departname: "Phòng Công tác học sinh sinh viên",
            departtype: "P"
        },
        {
            departcode: "DH",
            departname: "Phòng Đại học",
            departtype: "P"
        },
        {
            departcode: "SDH",
            departname: "Phòng Sau đại học",
            departtype: "P"
        },
        {
            departcode: "DTVMT",
            departname: "Phòng điện toán và máy tính",
            departtype: "P"
        },
        {
            departcode: "TKVKDCL",
            departname: "Phòng khảo thí và kiểm định chất lượng",
            departtype: "P"
        },
        {
            departcode: "TC",
            departname: "Phòng tài chính",
            departtype: "P"
        },
        {
            departcode: "TDTCLC",
            departname: "TDT Creative Language Center",
            departtype: "P"
        },
        {
            departcode: "TTTH",
            departname: "Trung tâm tin học",
            departtype: "P"
        },
        {
            departcode: "SDTC",
            departname: "Trung tâm đào tạo phát triển xã hội",
            departtype: "P"
        },
        {
            departcode: "ATEM",
            departname: "Trung tâm phát triển Khoa học quản lý và Ứng dụng công nghệ",
            departtype: "P"
        },
        {
            departcode: "HTDNVCSV",
            departname: "Trung tâm hợp tác doanh nghiệp và cựu sinh viên",
            departtype: "P"
        },
        {
            departcode: "KL",
            departname: "Khoa Luật",
            departtype: "K"
        },
        {
            departcode: "TTNNTHBDVH",
            departname: "Trung tâm ngoại ngữ - tin học – bồi dưỡng văn hóa",
            departtype: "P"
        },
        {
            departcode: "VCSKTVKD",
            departname: "Viện chính sách kinh tế và kinh doanh",
            departtype: "P"
        },
        {
            departcode: "KMTCN",
            departname: "Khoa Mỹ thuật công nghiệp",
            departtype: "K"
        },
        {
            departcode: "KDDT",
            departname: "Khoa Điện – Điện tử",
            departtype: "K"
        },
        {
            departcode: "KCNTT",
            departname: "Khoa Công nghệ thông tin",
            departtype: "K"
        },
        {
            departcode: "KQTKD",
            departname: "Khoa Quản trị kinh doanh",
            departtype: "K"
        },
        {
            departcode: "KMTVBHLD",
            departname: "Khoa Môi trường và bảo hộ lao động",
            departtype: "K"
        },
        {
            departcode: "KLDCD",
            departname: "Khoa Lao động công đoàn",
            departtype: "K"
        },
        {
            departcode: "KTCNH",
            departname: "Khoa Tài chính ngân hàng",
            departtype: "K"
        },
        {
            departcode: "KGDQT",
            departname: "Khoa giáo dục quốc tế",
            departtype: "K"
        },
    ]
    departments.forEach(async function(department){ /* thực hiện thêm dữ liệu trong mảng -- nếu đã có thì sẽ có lỗi (đã xử lý là chỉ in ra ở console) */
        let departmentResult = await departmentsService.add(department);
        if(departmentResult){
            console.log(departmentResult)
        }
        else{
            console.log(`Phòng - Khoa ${department.departname} đã được tạo trước đó`);
        }
    })
}





module.exports = {
    add
}