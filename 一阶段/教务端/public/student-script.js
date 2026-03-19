// 缓存对象，用于存储API请求结果
const apiCache = {
    studentData: null,
    courseData: null,
    availableCourses: null,
    cacheTime: 0
};

// 缓存有效期（毫秒）
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟

// 初始化文档加载完成事件
window.addEventListener('DOMContentLoaded', () => {
    // 检查登录状态
    checkLoginStatus();
    
    // 设置页面时钟
    setInterval(updateClock, 1000);
    updateClock();
    
    // 加载初始数据
    loadStudentData();
    loadCourseData();
    loadAvailableCourses();
    
    // 初始化日历
    initCalendar();
});

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('studentToken');
    if (!token) {
        // 未登录，重定向到登录页面
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// 退出登录
async function logout() {
    if (confirm('确定要退出登录吗？')) {
        try {
            const response = await fetch('/api/student/logout', {
                method: 'POST',
                headers: {
                    'Authorization': localStorage.getItem('studentToken')
                }
            });
            
            await response.json();
            
            // 清除本地存储
            localStorage.removeItem('studentToken');
            localStorage.removeItem('studentInfo');
            
            // 重定向到登录页面
            window.location.href = '/login.html';
        } catch (error) {
            console.error('退出登录失败:', error);
            // 即使API调用失败，也清除本地存储并跳转
            localStorage.removeItem('studentToken');
            localStorage.removeItem('studentInfo');
            window.location.href = '/login.html';
        }
    }
}

// 获取认证头
function getAuthHeaders() {
    const token = localStorage.getItem('studentToken');
    return {
        'Authorization': `Bearer ${token}`
    };
}

// 时钟更新函数
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('clock').textContent = timeString;
}

// 加载学生信息
async function loadStudentData() {
    // 检查缓存是否有效
    const now = Date.now();
    if (apiCache.studentData && (now - apiCache.cacheTime) < CACHE_DURATION) {
        // 使用缓存数据
        document.getElementById('nav-name').textContent = apiCache.studentData.name;
        return;
    }
    
    try {
        const response = await fetch('/api/student/profile', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch student data');
        const student = await response.json();
        
        // 更新缓存
        apiCache.studentData = student;
        apiCache.cacheTime = now;
        
        // 更新学生信息显示
        document.getElementById('nav-name').textContent = student.name;
    } catch (error) {
        console.error('Error loading student data:', error);
    }
}

// 加载已选课程数据
async function loadCourseData() {
    // 检查缓存是否有效
    const now = Date.now();
    if (apiCache.courseData && (now - apiCache.cacheTime) < CACHE_DURATION) {
        // 使用缓存数据
        document.getElementById('stat-count').textContent = apiCache.courseData.length;
        renderCourseCards(apiCache.courseData);
        return;
    }
    
    try {
        const response = await fetch('/api/student/my-courses', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch course data');
        const courses = await response.json();
        
        // 更新缓存
        apiCache.courseData = courses;
        apiCache.cacheTime = now;
        
        // 更新已选课程数量
        document.getElementById('stat-count').textContent = courses.length;
        
        // 渲染课程卡片
        renderCourseCards(courses);
    } catch (error) {
        console.error('Error loading course data:', error);
    }
}

// 渲染课程卡片
function renderCourseCards(courses) {
    const grid = document.getElementById('my-course-grid');
    grid.innerHTML = '';
    
    if (courses.length === 0) {
        grid.innerHTML = `
            <div class="cyber-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <h3 style="color: var(--primary); margin-bottom: 1rem;">NO COURSES FOUND</h3>
                <p style="color: var(--text-muted);">请前往选课中心选择课程</p>
            </div>
        `;
        return;
    }
    
    courses.forEach(course => {
        const card = document.createElement('div');
        card.className = 'cyber-card course-card';
        card.innerHTML = `
            <div class="course-header">
                <span class="code-badge">${course.course_code}</span>
                <span style="color: ${course.status === 'active' ? '#0ea5e9' : '#ef4444'}">● ${course.status.toUpperCase()}</span>
            </div>
            <h3>${course.course_name}</h3>
            <div class="course-detail">
                <span><i class="ri-user-line"></i> ${course.teacher}</span>
                <span><i class="ri-map-pin-line"></i> ${course.location || 'N/A'}</span>
            </div>
            <div class="course-detail">
                <span><i class="ri-time-line"></i> ${course.schedule_time || 'TBD'}</span>
                <span>CREDITS: ${course.credits}</span>
            </div>
            <button class="action-btn" onclick="dropCourse(${course.id})">DROP COURSE // 退课</button>
        `;
        grid.appendChild(card);
    });
}

// 加载可选课程
async function loadAvailableCourses() {
    // 检查缓存是否有效
    const now = Date.now();
    if (apiCache.availableCourses && (now - apiCache.cacheTime) < CACHE_DURATION) {
        // 使用缓存数据
        renderAvailableCourses(apiCache.availableCourses);
        return;
    }
    
    try {
        const response = await fetch('/api/student/available-courses', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch available courses');
        const courses = await response.json();
        
        // 更新缓存
        apiCache.availableCourses = courses;
        apiCache.cacheTime = now;
        
        // 渲染可选课程表格
        renderAvailableCourses(courses);
    } catch (error) {
        console.error('Error loading available courses:', error);
    }
}

// 渲染可选课程表格
function renderAvailableCourses(courses) {
    const tbody = document.getElementById('available-course-tbody');
    tbody.innerHTML = '';
    
    courses.forEach(course => {
        const tr = document.createElement('tr');
        const isFull = course.enrolled >= course.capacity;
        
        tr.innerHTML = `
            <td><span style="color: var(--primary)">${course.course_code}</span></td>
            <td>${course.course_name}</td>
            <td>${course.teacher}</td>
            <td>${course.credits}</td>
            <td>${course.enrolled} / ${course.capacity}</td>
            <td>
                ${isFull 
                    ? '<span style="color: #ef4444">FULL</span>' 
                    : `<button class="enroll-btn" onclick="enrollCourse(${course.id})">ENROLL</button>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// 清除缓存函数
function clearCache() {
    apiCache.courseData = null;
    apiCache.availableCourses = null;
    apiCache.cacheTime = 0;
}

// 课程选择函数
async function enrollCourse(courseId) {
    try {
        const response = await fetch('/api/student/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...getAuthHeaders()
            },
            body: JSON.stringify({ courseId })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Enrollment failed');
        }
        
        const result = await response.json();
        showNotification(`ACCESS GRANTED: ${result.message}`, false);
        
        // 清除缓存
        clearCache();
        
        // 重新加载数据
        loadCourseData();
        loadAvailableCourses();
    } catch (error) {
        showNotification(`ERROR: ${error.message}`);
        console.error('Error enrolling in course:', error);
    }
}

// 退课函数
async function dropCourse(courseId) {
    if (!confirm('WARNING: 确定要从该课程中注销吗？这可能会影响你的学分。')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/student/drop/${courseId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('Drop course failed');
        }
        
        const result = await response.json();
        showNotification(`SUCCESS: ${result.message}`, false);
        
        // 清除缓存
        clearCache();
        
        // 重新加载数据
        loadCourseData();
        loadAvailableCourses();
    } catch (error) {
        showNotification('ERROR: 退课失败');
        console.error('Error dropping course:', error);
    }
}

// 标签页切换函数
function switchTab(tabName) {
    // 隐藏所有标签页内容
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    // 移除所有导航按钮的激活状态
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // 显示选中的标签页内容
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    // 激活对应的导航按钮
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        if (btn.textContent.includes(tabName.charAt(0).toUpperCase() + tabName.slice(1))) {
            btn.classList.add('active');
        }
    });
}

// 闪烁效果动画
function createBlinkEffect() {
    const blinkElements = document.querySelectorAll('.blink');
    blinkElements.forEach(el => {
        el.style.animation = 'blink-animation 1.5s infinite';
    });
}

// 添加闪烁动画样式
const style = document.createElement('style');
style.textContent = `
    /* 闪烁效果 */
    .blink {
        animation: blink 1s infinite;
    }
    
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }
    
    /* 故障效果 */
    .glitch-text {
        position: relative;
    }
    
    .glitch-text::before,
    .glitch-text::after {
        content: attr(data-text);
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }
    
    .glitch-text::before {
        left: 2px;
        text-shadow: -1px 0 var(--primary);
        clip: rect(24px, 550px, 90px, 0);
        animation: glitch-anim 5s infinite linear alternate-reverse;
    }
    
    .glitch-text::after {
        left: -2px;
        text-shadow: -1px 0 var(--accent);
        clip: rect(85px, 550px, 140px, 0);
        animation: glitch-anim2 3s infinite linear alternate-reverse;
    }
    
    @keyframes glitch-anim {
        0% { clip: rect(69px, 9999px, 36px, 0); }
        20% { clip: rect(60px, 9999px, 74px, 0); }
        40% { clip: rect(61px, 9999px, 8px, 0); }
        60% { clip: rect(41px, 9999px, 20px, 0); }
        80% { clip: rect(94px, 9999px, 57px, 0); }
        100% { clip: rect(76px, 9999px, 100px, 0); }
    }
    
    @keyframes glitch-anim2 {
        0% { clip: rect(20px, 9999px, 33px, 0); }
        20% { clip: rect(30px, 9999px, 6px, 0); }
        40% { clip: rect(2px, 9999px, 44px, 0); }
        60% { clip: rect(56px, 9999px, 51px, 0); }
        80% { clip: rect(19px, 9999px, 99px, 0); }
        100% { clip: rect(13px, 9999px, 98px, 0); }
    }
    
    /* 滚动条样式 */
    ::-webkit-scrollbar {
        width: 8px;
    }
    
    ::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
    }
    
    ::-webkit-scrollbar-thumb {
        background: var(--primary);
        border-radius: 4px;
    }
    
    ::-webkit-scrollbar-thumb:hover {
        background: var(--accent);
    }
`;

document.head.appendChild(style);

// 初始化闪烁效果
createBlinkEffect();

// 显示消息提示
function showNotification(message, isError = true) {
    // 移除现有的通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // 创建通知元素
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.innerHTML = `
        <i class="ri-${isError ? 'close-circle' : 'check-circle'}-line"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="ri-close-line"></i>
        </button>
    `;
    
    // 添加到页面
    document.body.appendChild(notification);
    
    // 自动隐藏通知
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// 添加通知样式
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        animation: slideIn 0.3s ease-out;
    }
    
    .notification.error {
        background-color: #ef4444;
        border-left: 4px solid #dc2626;
    }
    
    .notification.success {
        background-color: #10b981;
        border-left: 4px solid #059669;
    }
    
    .notification i {
        font-size: 18px;
    }
    
    .notification-close {
        background: transparent;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 16px;
        margin-left: auto;
        padding: 0;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background-color 0.2s;
    }
    
    .notification-close:hover {
        background-color: rgba(255, 255, 255, 0.2);
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(notificationStyle);

// 表单提交处理
function handleFormSubmit(event) {
    event.preventDefault();
    // 这里可以添加表单提交逻辑
    console.log('Form submitted');
}

// 添加表单提交事件监听器
const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
});

// ================= 日历组件逻辑 =================

let currentDate = new Date();
let allCourses = [];

// 初始化日历
function initCalendar() {
    // 添加事件监听器
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    document.getElementById('todayBtn').addEventListener('click', goToday);
    
    // 监听标签页切换，切换到日程表时刷新日历
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.textContent.includes('课程日程')) {
                renderCalendar();
                renderTodayCourses();
            }
        });
    });
    
    // 初始渲染
    renderCalendar();
    renderTodayCourses();
}

// 更新课程数据引用
async function updateCourseData() {
    try {
        const response = await fetch('/api/student/my-courses', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch course data');
        allCourses = await response.json();
        return allCourses;
    } catch (error) {
        console.error('Error loading course data for calendar:', error);
        return [];
    }
}

// 渲染日历
async function renderCalendar() {
    // 更新课程数据
    await updateCourseData();
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // 更新当前月份显示
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月',
                      '七月', '八月', '九月', '十月', '十一月', '十二月'];
    document.getElementById('currentMonth').textContent = `${year} ${monthNames[month]}`;
    
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    // 获取当月第一天和最后一天
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(firstDay.getDate() - firstDay.getDay());
    
    // 生成42天的日历（6行7列）
    for (let i = 0; i < 42; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        // 检查是否为今天
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        // 检查是否为当前月
        if (date.getMonth() !== month) {
            dayElement.classList.add('other-month');
        }
        
        // 添加日期号
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayElement.appendChild(dayNumber);
        
        // 添加课程事件
        const courseEvents = getCoursesForDate(date);
        courseEvents.forEach((course, index) => {
            const eventElement = document.createElement('div');
            eventElement.className = `course-event ${index % 2 === 1 ? 'secondary' : ''}`;
            eventElement.textContent = `${course.course_name} (${course.teacher})`;
            dayElement.appendChild(eventElement);
        });
        
        calendarDays.appendChild(dayElement);
    }
}

// 获取指定日期的课程
function getCoursesForDate(date) {
    // 根据课程的schedule_time匹配日期
    // 假设schedule_time格式为"周一 8:00"、"周三 14:00-16:00"等
    return allCourses.filter(course => {
        if (!course.schedule_time || course.schedule_time === '待定') {
            return false;
        }
        
        const weekdayIndex = date.getDay(); // 0-6，0是周日
        const courseWeekday = getWeekdayFromSchedule(course.schedule_time);
        
        return courseWeekday === weekdayIndex;
    });
}

// 从schedule_time中提取星期几
function getWeekdayFromSchedule(scheduleTime) {
    // 定义星期映射
    const weekdayMap = {
        '日': 0,
        '一': 1,
        '二': 2,
        '三': 3,
        '四': 4,
        '五': 5,
        '六': 6,
        '周一': 1,
        '周二': 2,
        '周三': 3,
        '周四': 4,
        '周五': 5,
        '周六': 6,
        '周日': 0
    };
    
    // 查找星期关键词
    for (const [keyword, index] of Object.entries(weekdayMap)) {
        if (scheduleTime.includes(keyword)) {
            return index;
        }
    }
    
    // 如果没有匹配到完整的星期关键词，尝试匹配单个汉字
    const match = scheduleTime.match(/[日一二三四五六]/);
    if (match) {
        return weekdayMap[match[0]];
    }
    
    return -1; // 没有找到星期
}

// 切换月份
function changeMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

// 回到今天
function goToday() {
    currentDate = new Date();
    renderCalendar();
    renderTodayCourses();
}

// 渲染今日课程
async function renderTodayCourses() {
    // 更新课程数据
    await updateCourseData();
    
    const today = new Date();
    const todayCourses = allCourses.filter(course => isCourseToday(course, today));
    
    const todayCourseList = document.getElementById('todayCourseList');
    
    if (todayCourses.length === 0) {
        todayCourseList.innerHTML = '<div style="text-align: center; color: var(--text-muted); padding: 20px;">// 今天没有课程</div>';
        return;
    }
    
    todayCourseList.innerHTML = '';
    todayCourses.forEach(course => {
        const courseItem = document.createElement('div');
        courseItem.className = 'today-course-item';
        courseItem.innerHTML = `
            <div class="course-info">
                <h4>${course.course_name}</h4>
                <div class="course-time-loc">
                    <span><i class="ri-time-line"></i> ${course.schedule_time || 'TBD'}</span>
                    <span><i class="ri-map-pin-line"></i> ${course.location || 'N/A'}</span>
                </div>
            </div>
            <div class="course-credits">${course.credits} 学分</div>
        `;
        todayCourseList.appendChild(courseItem);
    });
}

// 检查课程是否在今天
function isCourseToday(course, today) {
    if (!course.schedule_time || course.schedule_time === '待定') {
        return false;
    }
    
    const todayWeekdayIndex = today.getDay(); // 0-6，0是周日
    const courseWeekday = getWeekdayFromSchedule(course.schedule_time);
    
    return courseWeekday === todayWeekdayIndex;
}