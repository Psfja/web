const mysql = require('mysql2');

// 连接到MySQL服务器（不指定数据库）
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456'
});

db.connect(err => {
    if (err) {
        console.error('❌ 无法连接到MySQL服务器:', err);
        process.exit(1);
    }
    console.log('✅ 已连接到MySQL服务器');
    
    // 创建数据库
    createDatabase();
});

function createDatabase() {
    db.query('CREATE DATABASE IF NOT EXISTS food_delivery_db', (err) => {
        if (err) {
            console.error('❌ 创建数据库失败:', err);
            db.end();
            return;
        }
        console.log('✅ 数据库 food_delivery_db 创建成功');
        
        // 切换到新创建的数据库
        db.changeUser({ database: 'food_delivery_db' }, (err) => {
            if (err) {
                console.error('❌ 切换数据库失败:', err);
                db.end();
                return;
            }
            console.log('✅ 已切换到 food_delivery_db 数据库');
            
            // 创建表
            createTables();
        });
    });
}

function createTables() {
    // 1. 创建菜品表
    const createFoodsTable = `
        CREATE TABLE IF NOT EXISTS foods (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            price DECIMAL(10, 2) NOT NULL,
            description TEXT,
            category VARCHAR(50) DEFAULT '热销',
            image_url VARCHAR(255) DEFAULT 'https://source.unsplash.com/random/300x200/?food',
            stock INT DEFAULT 999
        )
    `;
    
    db.query(createFoodsTable, (err) => {
        if (err) {
            console.error('❌ 创建菜品表失败:', err);
            db.end();
            return;
        }
        console.log('✅ 菜品表创建成功');
        
        // 2. 创建用户表
        const createUsersTable = `
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                nickname VARCHAR(100),
                avatar_url VARCHAR(255),
                phone VARCHAR(20),
                wechat_openid VARCHAR(100) UNIQUE,
                qq_openid VARCHAR(100) UNIQUE,
                login_type ENUM('wechat', 'qq', 'phone') NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `;
        
        db.query(createUsersTable, (err) => {
            if (err) {
                console.error('❌ 创建用户表失败:', err);
                db.end();
                return;
            }
            console.log('✅ 用户表创建成功');
            
            // 3. 创建订单表
            const createOrdersTable = `
                CREATE TABLE IF NOT EXISTS orders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT,
                    total_amount DECIMAL(10, 2) NOT NULL,
                    status ENUM('pending', 'preparing', 'delivering', 'completed') DEFAULT 'pending',
                    address VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )
            `;
            
            db.query(createOrdersTable, (err) => {
                if (err) {
                    console.error('❌ 创建订单表失败:', err);
                    db.end();
                    return;
                }
                console.log('✅ 订单表创建成功');
                
                // 4. 创建订单详情表
                const createOrderItemsTable = `
                    CREATE TABLE IF NOT EXISTS order_items (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        order_id INT,
                        food_id INT,
                        quantity INT,
                        price_snapshot DECIMAL(10, 2),
                        FOREIGN KEY (order_id) REFERENCES orders(id),
                        FOREIGN KEY (food_id) REFERENCES foods(id)
                    )
                `;
                
                db.query(createOrderItemsTable, (err) => {
                    if (err) {
                        console.error('❌ 创建订单详情表失败:', err);
                        db.end();
                        return;
                    }
                    console.log('✅ 订单详情表创建成功');
                    
                    // 插入初始数据
                    insertInitialData();
                });
            });
        });
    });
}

function insertInitialData() {
    const initialFoods = [
        ['澳洲M5和牛汉堡', 68.00, '精选澳洲进口和牛，搭配黑松露酱', '主食', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=500&q=60'],
        ['牛油果大虾沙拉', 45.00, '低脂健康，新鲜基围虾配特调油醋汁', '轻食', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=500&q=60'],
        ['法式奶油蘑菇汤', 28.00, '浓郁奶香，搭配现烤法棍切片', '汤品', 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=500&q=60'],
        ['黑金炸鸡块', 32.00, '外酥里嫩，秘制墨鱼汁脆皮', '小吃', 'https://images.unsplash.com/photo-1562967960-f55430f772f7?auto=format&fit=crop&w=500&q=60']
    ];
    
    const insertSql = 'INSERT INTO foods (name, price, description, category, image_url) VALUES ?';
    
    db.query(insertSql, [initialFoods], (err) => {
        if (err) {
            console.error('❌ 插入初始数据失败:', err);
            db.end();
            return;
        }
        console.log('✅ 初始数据插入成功');
        db.end();
        console.log('🎉 数据库初始化完成！');
    });
}
