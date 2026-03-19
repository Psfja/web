const mysql = require('mysql2');

// 创建数据库连接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'university_system'
});

// 连接数据库
db.connect((err) => {
    if (err) {
        console.error('❌ 数据库连接失败:', err);
        return;
    }
    console.log('✅ MySQL 数据库已连接');
    
    // 创建默认学生账号
    const studentSql = `
        INSERT INTO students (student_id, name, major, email, password) 
        VALUES ('S2023001', '张三', '计算机科学', 'zhangsan@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy')
        ON DUPLICATE KEY UPDATE 
        name = VALUES(name), 
        major = VALUES(major), 
        email = VALUES(email), 
        password = VALUES(password);
    `;
    
    db.query(studentSql, (err, results) => {
        if (err) {
            console.error('❌ 创建默认学生失败:', err);
        } else {
            console.log('✅ 默认学生账号已创建');
            console.log('📝 学生账号信息:');
            console.log('   学号: S2023001');
            console.log('   姓名: 张三');
            console.log('   密码: 123456');
            console.log('   邮箱: zhangsan@example.com');
        }
        
        // 关闭数据库连接
        db.end();
    });
});
