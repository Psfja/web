USE university_system;

-- 1. 创建公告表
CREATE TABLE IF NOT EXISTS announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    content TEXT,
    publish_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    priority ENUM('normal', 'high') DEFAULT 'normal'
);

-- 2. 确保选课表有成绩和评语字段（如果没有则添加）
-- 注意：移除IF NOT EXISTS，MySQL 5.7不支持
ALTER TABLE enrollments ADD COLUMN feedback TEXT;
-- 注意：之前如果grade是varchar，保持原样即可，这里我们假设用 score (int) 更方便计算，或者继续用 grade

-- 插入一条测试公告
INSERT INTO announcements (title, content, priority) VALUES 
('期末考试通知', '请所有教师在下周五之前完成成绩录入。', 'high');
