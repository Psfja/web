-- 创建数据库
CREATE DATABASE IF NOT EXISTS university_system;
USE university_system;

-- 关闭外键检查，以便删除表
SET FOREIGN_KEY_CHECKS = 0;

-- 删除现有表（如果存在）
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS students;
DROP TABLE IF EXISTS teachers;

-- 重新开启外键检查
SET FOREIGN_KEY_CHECKS = 1;

-- 创建课程表
CREATE TABLE courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_code VARCHAR(20) NOT NULL,
    course_name VARCHAR(100) NOT NULL,
    teacher VARCHAR(50) NOT NULL,
    credits INT DEFAULT 3,
    capacity INT DEFAULT 60,
    enrolled INT DEFAULT 0,
    status ENUM('active', 'closed') DEFAULT 'active'
);

-- 插入一些模拟的高级数据
INSERT INTO courses (course_code, course_name, teacher, credits, capacity, enrolled, status) VALUES 
('CS101', '计算机科学导论', 'Dr. Alan Turing', 4, 100, 85, 'active'),
('MATH201', '高等微积分', 'Dr. Isaac Newton', 5, 60, 45, 'active'),
('ART105', '现代设计美学', 'Prof. Zaha Hadid', 2, 40, 40, 'closed'),
('PHY303', '量子力学基础', 'Dr. Richard Feynman', 4, 50, 12, 'active'),
('AI400', '深度学习与神经网络', 'Dr. Geoffrey Hinton', 6, 80, 78, 'active');