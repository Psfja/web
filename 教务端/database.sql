-- 创建数据库
CREATE DATABASE IF NOT EXISTS university_system CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE university_system;

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    teacher VARCHAR(50) NOT NULL,
    credits INT NOT NULL,
    location VARCHAR(50) DEFAULT '待定',
    schedule_time VARCHAR(100) DEFAULT '待定',
    status VARCHAR(20) DEFAULT 'active',
    enrolled INT DEFAULT 0,
    capacity INT DEFAULT 50,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 学生表
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    major VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    password VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 选课表
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    grade DECIMAL(5,2),
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_enrollment (course_id, student_id),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 系统设置表
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(50) NOT NULL UNIQUE,
    setting_value VARCHAR(255) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 公告表
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    publish_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 课程资料表
CREATE TABLE IF NOT EXISTS course_materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size VARCHAR(50) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- 插入默认设置
INSERT IGNORE INTO settings (setting_key, setting_value) VALUES
('system_name', '加立敦大学'),
('current_semester', '2024-2025 第一学期');

-- 插入示例课程数据
INSERT IGNORE INTO courses (course_code, course_name, teacher, credits) VALUES
('CS101', '计算机科学导论', '张教授', 3),
('MA101', '高等数学', '李教授', 4),
('EN101', '大学英语', '王教授', 2),
('PH101', '大学物理', '赵教授', 3),
('HI101', '中国近代史', '钱教授', 2);

-- 插入示例学生数据
INSERT IGNORE INTO students (student_id, name, major, email, password) VALUES
('S2023001', '张三', '计算机科学', 'zhangsan@example.com', '$2a$10$eCwW61n8Q4s3JZ7e9vJ99e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e'),
('S2023002', '李四', '软件工程', 'lisi@example.com', '$2a$10$eCwW61n8Q4s3JZ7e9vJ99e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e'),
('S2023003', '王五', '数据科学', 'wangwu@example.com', '$2a$10$eCwW61n8Q4s3JZ7e9vJ99e7e7e7e7e7e7e7e7e7e7e7e7e7e7e7e');

-- 插入示例选课数据
INSERT IGNORE INTO enrollments (course_id, student_id) VALUES
(1, 1),
(2, 1),
(3, 1),
(1, 2),
(2, 2),
(4, 2),
(1, 3),
(3, 3),
(5, 3);

-- 插入示例公告
INSERT IGNORE INTO announcements (title, content, priority) VALUES
('新学期开始', '欢迎大家回到学校，新学期已经开始，请大家按时上课。', 'high'),
('选课通知', '新一轮选课将于下周开始，请同学们做好准备。', 'normal'),
('图书馆开放时间', '图书馆开放时间调整为8:00-22:00，请同学们注意。', 'normal');