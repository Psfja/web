const http = require('http');

// 定义请求数据
const data = {
    studentId: 'S2024001',
    name: '王小明',
    major: '计算机科学',
    email: 'wangxiaoming@example.com',
    password: '123456'
};

// 请求选项
const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/student/register',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(data))
    }
};

// 创建请求
const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头: ${JSON.stringify(res.headers)}`);
    
    let responseBody = '';
    
    // 接收响应数据
    res.on('data', (chunk) => {
        responseBody += chunk;
    });
    
    // 响应结束
    res.on('end', () => {
        console.log('响应体:', responseBody);
        console.log('请求结束');
    });
});

// 处理请求错误
req.on('error', (e) => {
    console.error(`请求错误: ${e.message}`);
});

// 发送请求数据
req.write(JSON.stringify(data));
req.end();
