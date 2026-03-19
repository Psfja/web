USE university_system;

-- 1. 扩展课程表，增加排课相关字段
ALTER TABLE courses ADD COLUMN location VARCHAR(50) DEFAULT '待定';
ALTER TABLE courses ADD COLUMN schedule_time VARCHAR(50) DEFAULT '待定';

-- 2. 创建学生表
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    major VARCHAR(50) DEFAULT '未分配',
    email VARCHAR(100),
    password VARCHAR(255) NOT NULL,
    status ENUM('active', 'graduated') DEFAULT 'active'
);

-- 3. 创建选课关联表 (学生-课程 多对多)
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    student_id INT,
    grade VARCHAR(5),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 4. 创建设置表
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(50) PRIMARY KEY,
    setting_value VARCHAR(255)
);

-- 初始化设置数据
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES 
('system_name', 'Lumina 教务系统'), 
('current_semester', '2023-2024 秋季学期');

-- 插入一些模拟学生数据
INSERT IGNORE INTO students (student_id, name, major, email) VALUES 
('S2023001', '张伟', '计算机科学', 'zhangwei@edu.com'),
('S2023002', '李娜', '数字媒体', 'lina@edu.com'),
('S2023003', '王强', '应用数学', 'wangqiang@edu.com');