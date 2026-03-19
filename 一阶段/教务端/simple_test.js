const http = require('http');

// 测试数据
const testData = JSON.stringify({
    studentId: 'TEST2023003',
    name: '测试学生3',
    major: '测试专业',
    email: 'test3@example.com',
    password: '123456'
});

// 配置请求选项
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/student/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(testData)
    }
};

// 发送请求
const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头: ${JSON.stringify(res.headers)}`);
    
    res.on('data', (chunk) => {
        console.log(`响应体: ${chunk}`);
    });
    
    res.on('end', () => {
        console.log('响应结束');
    });
});

req.on('error', (e) => {
    console.error(`请求错误: ${e.message}`);
});

// 写入请求数据
req.write(testData);
req.end();