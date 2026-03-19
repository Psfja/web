USE university_system;

-- 创建一个默认学生账号
INSERT INTO students (student_id, name, major, email, password) 
VALUES ('S2023001', '张三', '计算机科学', 'zhangsan@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy');
-- 密码是 '123456'，已使用 bcrypt 哈希

-- 为默认学生添加一些选课记录
INSERT INTO enrollments (course_id, student_id) 
VALUES 
    (1, LAST_INSERT_ID()),
    (2, LAST_INSERT_ID());

-- 更新课程的已选人数
UPDATE courses SET enrolled = enrolled + 1 WHERE id IN (1, 2);
