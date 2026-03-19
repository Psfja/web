const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const https = require('https');
const app = express();
const port = 3000;

// JWT密钥，实际项目中应使用环境变量配置
const JWT_SECRET = 'your-secret-key-here'; // 建议替换为更安全的密钥

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // 允许解析 JSON 请求体

// 文件上传配置
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    database: 'university_system'
});

db.connect((err) => {
    if (err) console.error('❌ 数据库连接失败:', err);
    else console.log('✅ MySQL 数据库已连接');
});

// ================= 课程管理 API =================

// 获取所有课程
app.get('/api/courses', (req, res) => {
    db.query('SELECT * FROM courses ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 获取单个课程
app.get('/api/courses/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM courses WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: '课程不存在' });
        res.json(results[0]);
    });
});

// 新增课程
app.post('/api/courses', (req, res) => {
    const { course_code, course_name, teacher, credits, location, schedule_time } = req.body;
    const sql = 'INSERT INTO courses (course_code, course_name, teacher, credits, location, schedule_time) VALUES (?, ?, ?, ?, ?, ?)';
    db.query(sql, [course_code, course_name, teacher, credits, location, schedule_time], (err, result) => {
        if (err) return res.status(500).json(err);
        res.json({ message: '课程添加成功', id: result.insertId });
    });
});

// 修改课程 (排课也用这个接口)
app.put('/api/courses/:id', (req, res) => {
    const { course_name, teacher, location, schedule_time } = req.body;
    const sql = 'UPDATE courses SET course_name=?, teacher=?, location=?, schedule_time=? WHERE id=?';
    db.query(sql, [course_name, teacher, location, schedule_time, req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: '课程更新成功' });
    });
});

// 删除课程
app.delete('/api/courses/:id', (req, res) => {
    db.query('DELETE FROM courses WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: '课程删除成功' });
    });
});

// ================= 学生管理 API =================

// 获取所有学生
app.get('/api/students', (req, res) => {
    db.query('SELECT * FROM students ORDER BY id DESC', (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// 获取单个学生
app.get('/api/students/:id', (req, res) => {
    const id = req.params.id;
    db.query('SELECT * FROM students WHERE id = ?', [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.status(404).json({ message: '学生不存在' });
        res.json(results[0]);
    });
});

// 新增学生
app.post('/api/students', (req, res) => {
    const { student_id, name, major, email } = req.body;
    const sql = 'INSERT INTO students (student_id, name, major, email) VALUES (?, ?, ?, ?)';
    db.query(sql, [student_id, name, major, email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '学生添加成功', id: result.insertId });
    });
});

// 修改学生信息
app.put('/api/students/:id', (req, res) => {
    const { name, major, email, status } = req.body;
    const sql = 'UPDATE students SET name=?, major=?, email=?, status=? WHERE id=?';
    db.query(sql, [name, major, email, status, req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '学生信息更新成功' });
    });
});

// 删除学生
app.delete('/api/students/:id', (req, res) => {
    db.query('DELETE FROM students WHERE id = ?', [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: '学生删除成功' });
    });
});

// ================= 设置 API =================

app.get('/api/settings', (req, res) => {
    db.query('SELECT * FROM settings', (err, results) => {
        if (err) return res.status(500).json(err);
        // 转换为对象格式 { system_name: "..." }
        const settings = {};
        results.forEach(row => settings[row.setting_key] = row.setting_value);
        res.json(settings);
    });
});

app.post('/api/settings', (req, res) => {
    const { system_name, current_semester } = req.body;
    // 简单起见，逐条更新
    db.query('UPDATE settings SET setting_value = ? WHERE setting_key = "system_name"', [system_name]);
    db.query('UPDATE settings SET setting_value = ? WHERE setting_key = "current_semester"', [current_semester]);
    res.json({ message: '设置已保存' });
});

// ================= 统计 API =================
app.get('/api/stats', (req, res) => {
    const sql = `
        SELECT 
            (SELECT COUNT(*) FROM courses) as totalCourses,
            (SELECT COUNT(*) FROM students) as totalStudents,
            (SELECT setting_value FROM settings WHERE setting_key = 'current_semester') as semester
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results[0]);
    });
});

// ================= 学生认证 API =================

// JWT认证中间件
function authenticateStudent(req, res, next) {
    // 从请求头获取token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // 验证token是否存在
    if (!token) {
        return res.status(401).json({ message: '未授权访问，缺少token' });
    }
    
    // 验证token有效性
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        // 将学生ID存储到请求对象中
        req.studentId = decoded.studentId;
        next();
    } catch (err) {
        return res.status(401).json({ message: '未授权访问，无效token' });
    }
}

// 学生注册 - 公开路由
app.post('/api/student/register', async (req, res) => {
    try {
        const { studentId, name, major, email, password } = req.body;
        
        // 检查学号是否已存在
        const checkSql = 'SELECT * FROM students WHERE student_id = ?';
        const [existingStudent] = await db.promise().query(checkSql, [studentId]);
        
        if (existingStudent.length > 0) {
            return res.status(400).json({ message: '该学号已注册' });
        }
        
        // 密码哈希
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // 插入学生数据
        const insertSql = 'INSERT INTO students (student_id, name, major, email, password) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.promise().query(insertSql, [studentId, name, major, email, hashedPassword]);
        
        res.status(201).json({ message: '注册成功', studentId: result.insertId });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ message: '注册失败' });
    }
});

// 学生登录 - 公开路由
app.post('/api/student/login', async (req, res) => {
    try {
        const { studentId, password } = req.body;
        
        // 查找学生
        const sql = 'SELECT * FROM students WHERE student_id = ?';
        const [students] = await db.promise().query(sql, [studentId]);
        
        if (students.length === 0) {
            return res.status(401).json({ message: '学号或密码错误' });
        }
        
        const student = students[0];
        
        // 验证密码
        const isPasswordValid = await bcrypt.compare(password, student.password);
        
        if (!isPasswordValid) {
            return res.status(401).json({ message: '学号或密码错误' });
        }
        
        // 生成JWT token
        const token = jwt.sign(
            { studentId: student.id }, // payload
            JWT_SECRET, // 密钥
            { expiresIn: '1h' } // 过期时间
        );
        
        // 返回学生信息和token
        const { password: _, ...studentInfo } = student; // 移除密码字段
        
        res.json({ 
            message: '登录成功', 
            token, 
            student: studentInfo 
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ message: '登录失败' });
    }
});

// 学生退出登录 - 公开路由
app.post('/api/student/logout', (req, res) => {
    // 客户端自行清除token，服务端无需特殊处理
    res.json({ message: '退出登录成功' });
});

// ================= 学生端专属 API =================

// 1. 获取某个学生已选的课程 (我的课表) - 需要认证
app.get('/api/student/my-courses', authenticateStudent, (req, res) => {
    const studentId = req.studentId || 1; // 从中间件获取学生ID，默认使用1
    const sql = `
        SELECT c.*, e.id as enrollment_id, e.grade 
        FROM courses c
        JOIN enrollments e ON c.id = e.course_id
        WHERE e.student_id = ?
    `;
    db.query(sql, [studentId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 2. 获取所有可选课程 (排除已选的) - 需要认证
app.get('/api/student/available-courses', authenticateStudent, (req, res) => {
    const studentId = req.studentId || 1;
    const sql = `
        SELECT * FROM courses 
        WHERE id NOT IN (SELECT course_id FROM enrollments WHERE student_id = ?)
        AND status = 'active'
    `;
    db.query(sql, [studentId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 3. 学生选课 (Insert) - 需要认证
app.post('/api/student/enroll', authenticateStudent, (req, res) => {
    const studentId = req.studentId || 1;
    const { courseId } = req.body;
    
    // 事务处理：先检查容量，再插入 (这里简化处理直接插入)
    const sql = 'INSERT INTO enrollments (course_id, student_id) VALUES (?, ?)';
    db.query(sql, [courseId, studentId], (err) => {
        if (err) {
            // 如果是重复选课
            if(err.code === 'ER_DUP_ENTRY') return res.status(400).json({message: '你已经选过这门课了'});
            return res.status(500).json(err);
        }
        
        // 同时更新课程表的已选人数 +1
        db.query('UPDATE courses SET enrolled = enrolled + 1 WHERE id = ?', [courseId]);
        res.json({ message: '选课成功' });
    });
});

// 4. 学生退课 (Delete) - 需要认证
app.delete('/api/student/drop/:courseId', authenticateStudent, (req, res) => {
    const studentId = req.studentId || 1;
    const courseId = req.params.courseId;
    
    const sql = 'DELETE FROM enrollments WHERE course_id = ? AND student_id = ?';
    db.query(sql, [courseId, studentId], (err, result) => {
        if (err) return res.status(500).json(err);
        
        // 更新课程表已选人数 -1
        db.query('UPDATE courses SET enrolled = enrolled - 1 WHERE id = ?', [courseId]);
        res.json({ message: '退课成功' });
    });
});

// 5. 获取学生个人信息 - 需要认证
app.get('/api/student/profile', authenticateStudent, (req, res) => {
    const studentId = req.studentId || 1; 
    db.query('SELECT id, student_id, name, major, email, status FROM students WHERE id = ?', [studentId], (err, result) => {
        if(err) return res.status(500).json(err);
        res.json(result[0]);
    });
});

// ================== 新增：交互功能 API ==================

// 1. 获取仪表盘图表数据（课程人数分布）
app.get('/api/stats/chart', (req, res) => {
    const sql = `
        SELECT c.course_name, COUNT(e.student_id) as count 
        FROM courses c 
        LEFT JOIN enrollments e ON c.id = e.course_id 
        GROUP BY c.id
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        // 格式化为 Chart.js 需要的数组
        const labels = results.map(r => r.course_name);
        const data = results.map(r => r.count);
        res.json({ labels, data });
    });
});

// 2. 获取某门课程的学生名单（用于打分）
app.get('/api/courses/:id/students', (req, res) => {
    const sql = `
        SELECT s.id, s.name, s.student_id, e.grade, e.feedback 
        FROM students s
        JOIN enrollments e ON s.id = e.student_id
        WHERE e.course_id = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 3. 提交成绩和评语 (核心交换功能)
app.post('/api/grade', (req, res) => {
    const { courseId, studentId, grade, feedback } = req.body;
    const sql = 'UPDATE enrollments SET grade = ?, feedback = ? WHERE course_id = ? AND student_id = ?';
    db.query(sql, [grade, feedback, courseId, studentId], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: '成绩已录入' });
    });
});

// 4. 公告相关 API
app.get('/api/announcements', (req, res) => {
    db.query('SELECT * FROM announcements ORDER BY publish_time DESC', (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

app.post('/api/announcements', (req, res) => {
    const { title, content, priority } = req.body;
    db.query('INSERT INTO announcements (title, content, priority) VALUES (?, ?, ?)', 
        [title, content, priority], 
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: '公告发布成功' });
    });
});

// ================= 文件管理系统 API (新增) =================

// 1. 上传课程资料
app.post('/api/materials', upload.single('file'), (req, res) => {
    const { courseId } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ message: '请选择文件' });

    // 计算易读的文件大小
    const size = (file.size / 1024).toFixed(1) + ' KB';
    // 获取文件后缀
    const type = path.extname(file.originalname).substring(1).toUpperCase();

    const sql = 'INSERT INTO course_materials (course_id, file_name, file_path, file_size, file_type) VALUES (?, ?, ?, ?, ?)';
    db.query(sql, [courseId, file.originalname, '/uploads/' + file.filename, size, type], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: '上传成功' });
    });
});

// 2. 获取某门课的资料列表
app.get('/api/materials/:courseId', (req, res) => {
    const sql = 'SELECT * FROM course_materials WHERE course_id = ?';
    db.query(sql, [req.params.courseId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});

// 3. 删除资料
app.delete('/api/materials/:id', (req, res) => {
    // 先查询文件路径
    const selectSql = 'SELECT file_path FROM course_materials WHERE id = ?';
    db.query(selectSql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        
        if (results.length > 0) {
            // 删除物理文件
            const filePath = path.join(__dirname, 'public', results[0].file_path);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        // 删除数据库记录
        const deleteSql = 'DELETE FROM course_materials WHERE id = ?';
        db.query(deleteSql, [req.params.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: '删除成功' });
        });
    });
});

// ================= AI 助教 API (DeepSeek) =================
app.post('/api/chat/edu', (req, res) => {
    const { message, history } = req.body;
    
    // 使用内置 https 模块替代 axios
    // 确保history存在且是数组
    const safeHistory = Array.isArray(history) ? history : [];
    
    const requestBody = {
        model: "deepseek-chat",
        messages: [
            { role: "system", content: "你是一个未来大学的AI助教，名字叫'NEXUS'。你的说话风格是理性的、科技感的，偶尔使用计算机术语。请帮助学生解答课程、选课及学术问题。请简短回答。" },
            ...safeHistory, // 包含之前的上下文
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
            'Authorization': `Bearer sk-fb33e4c518c344bc802e6da101b8fc1e`, // 用户提供的API key
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
                    res.status(500).json({ content: "ERR_RESPONSE_FORMAT // 无效的API响应格式" });
                }
            } catch (error) {
                res.status(500).json({ content: "ERR_CONNECTION_LOST // 神经网络连接中断" });
            }
        });
    });
    
    request.on('error', (error) => {
        res.status(500).json({ content: "ERR_NETWORK_ERROR // 网络连接错误" });
    });
    
    request.write(postData);
    request.end();
});

app.listen(port, () => {
    console.log(`🚀 服务运行中: http://localhost:${port}`);
});