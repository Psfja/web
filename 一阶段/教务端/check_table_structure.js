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
    
    // 检查students表结构
    const checkSql = 'DESCRIBE students';
    
    db.query(checkSql, (err, results) => {
        if (err) {
            console.error('❌ 检查表结构失败:', err);
        } else {
            console.log('📋 students表结构:');
            console.table(results);
        }
        
        // 关闭数据库连接
        db.end();
    });
});
