const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const https = require('https');
const cookieParser = require('cookie-parser');
const app = express();
const port = 8080; // 使用不同端口以免冲突

// 配置中间件
app.use(cookieParser());
app.use(bodyParser.json());

// 会话管理
const sessions = new Map();

// 生成会话ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// 验证登录状态的中间件
function checkLogin(req, res, next) {
    // 允许访问登录页面和API接口
    if (req.url === '/user/login.html' || req.url.startsWith('/api/') || req.url.startsWith('/user/style.css') || req.url.startsWith('/user/script.js')) {
        next();
        return;
    }

    // 检查Cookie中的会话ID
    const sessionId = req.cookies.sessionId;
    if (sessionId && sessions.has(sessionId)) {
        req.user = sessions.get(sessionId);
        next();
    } else {
        // 未登录，重定向到登录页面
        res.redirect('/user/login.html');
    }
}

// 应用静态文件和访问控制

// 用户端路由
app.use('/user', express.static(path.join(__dirname, 'public', 'user'), { index: false }));
app.get('/user', checkLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user', 'index.html'));
});
app.get('/user/index.html', checkLogin, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user', 'index.html'));
});
app.get('/user/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user', 'login.html'));
});

// 商家端路由
app.use('/merchant', express.static(path.join(__dirname, 'public', 'merchant')));
app.get('/merchant', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'merchant', 'login.html'));
});
app.get('/merchant/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'merchant', 'index.html'));
});
app.get('/merchant/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'merchant', 'login.html'));
});

// 根路径重定向到用户端
app.get('/', (req, res) => {
    res.redirect('/user');
});

// 数据库连接
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'food_delivery_db'
});

db.connect(err => {
    if (err) console.error('❌ 数据库连接失败:', err);
    else console.log('✅ 外卖数据库已连接');
});

// ================= API 接口 =================

// 1. 获取所有菜品
app.get('/api/foods', (req, res) => {
    db.query('SELECT * FROM foods', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 2. 提交订单 (修改版：增加地址)
app.post('/api/orders', (req, res) => {
    // 接收 address 字段
    const { items, total, address } = req.body;

    db.beginTransaction(err => {
        if (err) return res.status(500).json(err);

        // 插入时带上 address
        const sqlOrder = 'INSERT INTO orders (total_amount, address) VALUES (?, ?)';
        db.query(sqlOrder, [total, address || '门店自提'], (err, result) => {
            if (err) {
                return db.rollback(() => res.status(500).json(err));
            }
            const orderId = result.insertId;

            const orderItems = items.map(item => [orderId, item.id, item.quantity, item.price]);
            const sqlItems = 'INSERT INTO order_items (order_id, food_id, quantity, price_snapshot) VALUES ?';
            
            db.query(sqlItems, [orderItems], (err) => {
                if (err) {
                    return db.rollback(() => res.status(500).json(err));
                }
                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json(err));
                    res.json({ message: '下单成功', orderId });
                });
            });
        });
    });
});

// 3. 后台：添加菜品
app.post('/api/foods', (req, res) => {
    const { name, price, category, description, image_url } = req.body;
    const sql = 'INSERT INTO foods (name, price, category, description, image_url) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [name, price, category, description, image_url], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: '菜品添加成功' });
    });
});

// 4. 后台：获取所有订单
app.get('/api/orders', (req, res) => {
    const sql = `
        SELECT o.id, o.total_amount, o.status, o.created_at,
        GROUP_CONCAT(CONCAT(f.name, ' x', oi.quantity) SEPARATOR ', ') as details
        FROM orders o
        JOIN order_items oi ON o.id = oi.order_id
        JOIN foods f ON oi.food_id = f.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// ================= 用户认证 API =================

// 微信登录（模拟版本，用于测试）
app.post('/api/auth/wechat', async (req, res) => {
    const { code, userInfo } = req.body;
    
    // 注意：真实环境中需要使用微信AppID和AppSecret来换取openid
    // 这里使用模拟数据用于测试
    try {
        // 模拟微信返回的openid（实际开发中需要调用微信API）
        const mockOpenid = 'wechat_' + Date.now();
        const nickname = userInfo?.nickName || '微信用户';
        const avatarUrl = userInfo?.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=wechat';
        
        // 查询用户是否已存在
        const [existingUser] = await db.promise().query(
            'SELECT * FROM users WHERE wechat_openid = ?',
            [mockOpenid]
        );
        
        let user;
        if (existingUser.length > 0) {
            // 用户已存在
            user = existingUser[0];
        } else {
            // 新用户，创建记录
            const username = 'wechat_' + Date.now();
            const [result] = await db.promise().query(
                'INSERT INTO users (username, nickname, avatar_url, wechat_openid, login_type) VALUES (?, ?, ?, ?, ?)',
                [username, nickname, avatarUrl, mockOpenid, 'wechat']
            );
            
            const [newUser] = await db.promise().query(
                'SELECT * FROM users WHERE id = ?',
                [result.insertId]
            );
            user = newUser[0];
        }
        
        // 生成会话ID并存储会话
        const sessionId = generateSessionId();
        sessions.set(sessionId, user);
        
        // 设置Cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
            path: '/'
        });
        
        res.json({
            success: true,
            user: user,
            message: '登录成功'
        });
    } catch (err) {
        console.error('微信登录错误:', err);
        res.status(500).json({ success: false, message: '登录失败' });
    }
});

// QQ登录（模拟版本，用于测试）
app.post('/api/auth/qq', async (req, res) => {
    const { code, userInfo } = req.body;
    
    // 注意：真实环境中需要使用QQ AppID和AppSecret来换取openid
    try {
        // 模拟QQ返回的openid
        const mockOpenid = 'qq_' + Date.now();
        const nickname = userInfo?.nickname || 'QQ用户';
        const avatarUrl = userInfo?.figureurl_qq_2 || 'https://api.dicebear.com/7.x/avataaars/svg?seed=qq';
        
        // 查询用户是否已存在
        const [existingUser] = await db.promise().query(
            'SELECT * FROM users WHERE qq_openid = ?',
            [mockOpenid]
        );
        
        let user;
        if (existingUser.length > 0) {
            user = existingUser[0];
        } else {
            const username = 'qq_' + Date.now();
            const [result] = await db.promise().query(
                'INSERT INTO users (username, nickname, avatar_url, qq_openid, login_type) VALUES (?, ?, ?, ?, ?)',
                [username, nickname, avatarUrl, mockOpenid, 'qq']
            );
            
            const [newUser] = await db.promise().query(
                'SELECT * FROM users WHERE id = ?',
                [result.insertId]
            );
            user = newUser[0];
        }
        
        // 生成会话ID并存储会话
        const sessionId = generateSessionId();
        sessions.set(sessionId, user);
        
        // 设置Cookie
        res.cookie('sessionId', sessionId, {
            httpOnly: true,
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7天
            path: '/'
        });
        
        res.json({
            success: true,
            user: user,
            message: '登录成功'
        });
    } catch (err) {
        console.error('QQ登录错误:', err);
        res.status(500).json({ success: false, message: '登录失败' });
    }
});

// 获取当前用户信息
app.get('/api/auth/user', (req, res) => {
    // 从会话中获取用户信息
    const sessionId = req.cookies.sessionId;
    if (sessionId && sessions.has(sessionId)) {
        const user = sessions.get(sessionId);
        res.json({ success: true, user: user });
    } else {
        res.status(401).json({ success: false, message: '未登录' });
    }
});

// 退出登录
app.post('/api/auth/logout', (req, res) => {
    // 清除会话
    const sessionId = req.cookies.sessionId;
    if (sessionId) {
        sessions.delete(sessionId);
        // 清除Cookie
        res.clearCookie('sessionId', { path: '/' });
    }
    res.json({ success: true, message: '退出成功' });
});

// 更新用户信息
app.put('/api/auth/user', async (req, res) => {
    const sessionId = req.cookies.sessionId;
    if (!sessionId || !sessions.has(sessionId)) {
        return res.status(401).json({ success: false, message: '未登录' });
    }
    
    const user = sessions.get(sessionId);
    const { nickname, phone } = req.body;
    
    try {
        await db.promise().query(
            'UPDATE users SET nickname = ?, phone = ? WHERE id = ?',
            [nickname, phone, user.id]
        );
        
        const [updatedUser] = await db.promise().query(
            'SELECT id, username, nickname, avatar_url, phone, created_at FROM users WHERE id = ?',
            [user.id]
        );
        
        // 更新会话中的用户信息
        sessions.set(sessionId, updatedUser[0]);
        
        res.json({ success: true, user: updatedUser[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: '更新失败' });
    }
});
app.post('/api/chat/food', (req, res) => {
    const { message } = req.body;
    
    // 使用内置 https 模块替代 axios
    const requestBody = {
        model: "deepseek-chat",
        messages: [
            { role: "system", content: "你是一个外卖平台'FlavorDash'的智能客服。态度要非常热情、亲切，多用emoji。请回答关于订单查询、菜品推荐、退款规则等问题。如果用户问无法解决的问题，请回复'正在为您转接人工客服...'。" },
            { role: "user", content: message || "你好" }
        ],
        stream: false
    };
    
    const postData = JSON.stringify(requestBody);
    
    const options = {
        hostname: 'api.deepseek.com',
        port: 443,
        path: '/v1/chat/completions',
        method: 'POST',
        headers: {
            'Authorization': `Bearer sk-fb33e4c518c344bc802e6da101b8fc1e`,
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Length': Buffer.byteLength(postData, 'utf8')
        }
    };
    
    const request = https.request(options, (response) => {
        let data = '';
        
        response.on('data', (chunk) => {
            data += chunk;
        });
        
        response.on('end', () => {
            try {
                const result = JSON.parse(data);
                if (result.choices && result.choices[0] && result.choices[0].message) {
                    res.json(result.choices[0].message);
                } else {
                    res.status(500).json({ content: "客服小妹暂时掉线了，请稍后再试~ 😭" });
                }
            } catch (error) {
                res.status(500).json({ content: "客服小妹暂时掉线了，请稍后再试~ 😭" });
            }
        });
    });
    
    request.on('error', (error) => {
        res.status(500).json({ content: "客服小妹暂时掉线了，请稍后再试~ 😭" });
    });
    
    request.write(postData);
    request.end();
});

app.listen(port, () => {
    console.log(`🍔 FlavorDash 运行在 http://localhost:${port}`);
});
