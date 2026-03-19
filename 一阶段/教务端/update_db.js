const mysql = require('mysql2');
const fs = require('fs');

// 创建与MySQL的连接
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    multipleStatements: true // 启用多语句查询
});

// 连接到MySQL
connection.connect((err) => {
    if (err) {
        console.error('❌ 连接到MySQL失败:', err);
        return;
    }
    console.log('✅ 已连接到MySQL');

    // 读取SQL文件
    const sql = fs.readFileSync('./database_update.sql', 'utf8');

    // 执行SQL文件
    connection.query(sql, (err, results) => {
        if (err) {
            console.error('❌ 执行SQL脚本失败:', err);
            connection.end();
            return;
        }
        console.log('✅ 数据库更新成功');
        connection.end();
    });
});