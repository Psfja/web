const axios = require('axios');

// 测试注册功能
async function testRegistration() {
    try {
        const testStudent = {
            studentId: 'TEST2023002',
            name: '测试学生2',
            major: '测试专业',
            email: 'test2@example.com',
            password: '123456'
        };
        
        console.log('🔍 测试注册功能...');
        console.log('测试数据:', testStudent);
        
        // 调用注册API
        const response = await axios.post('http://localhost:3000/api/student/register', testStudent, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 注册成功！响应:', response.data);
        
        // 测试登录功能
        console.log('\n🔍 测试登录功能...');
        const loginResponse = await axios.post('http://localhost:3000/api/student/login', {
            studentId: testStudent.studentId,
            password: testStudent.password
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ 登录成功！响应:', loginResponse.data);
        console.log('\n🎉 测试通过！注册和登录功能正常工作。');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response ? error.response.data : error.message);
    }
}

// 执行测试
testRegistration();