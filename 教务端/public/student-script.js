const apiCache = {
    studentData: null,
    courseData: null,
    availableCourses: null,
    cacheTime: 0
};

const CACHE_DURATION = 5 * 60 * 1000;

window.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
    setInterval(updateClock, 1000);
    updateClock();
    loadStudentData();
    loadCourseData();
    loadAvailableCourses();
    loadAnnouncements();
    initCalendar();
    initSpotlightEffect();
    initCursorGlow();
});

// --- 探照灯核心逻辑 (Spotlight) ---
function initSpotlightEffect() {
    // 监听鼠标在网页上的移动，为每一个光晕卡片注入相对于自身的坐标
    document.querySelectorAll('.spotlight-card').forEach(card => {
        card.addEventListener('mousemove', e => {
            const rect = card.getBoundingClientRect();
            // 计算鼠标相对于当前卡片内部的 X 和 Y 坐标
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 将坐标传递给 CSS 变量，CSS radial-gradient 会用到这个坐标画圆
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// --- 全局背景光标跟随追踪器 ---
function initCursorGlow() {
    const glow = document.getElementById('cursor-glow');
    if (!glow) return;
    
    document.addEventListener('mousemove', (e) => {
        // 利用 requestAnimationFrame 保证动画流畅不卡顿
        requestAnimationFrame(() => {
            glow.style.left = `${e.clientX}px`;
            glow.style.top = `${e.clientY}px`;
        });
    });
    
    // 鼠标点击时，背景光晕产生水波纹收缩特效
    document.addEventListener('mousedown', () => {
        glow.style.width = '200px';
        glow.style.height = '200px';
        glow.style.background = 'radial-gradient(circle, rgba(14, 165, 233, 0.3), transparent 70%)';
    });
    document.addEventListener('mouseup', () => {
        glow.style.width = '400px';
        glow.style.height = '400px';
        glow.style.background = 'radial-gradient(circle, rgba(139, 92, 246, 0.15), transparent 60%)';
    });
}

async function loadAnnouncements() {
    try {
        const response = await fetch('/api/announcements');
        const announcements = await response.json();
        
        const announcementList = document.getElementById('announcement-list');
        
        if (announcements.length === 0) {
            announcementList.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">// 暂无公告</div>';
            return;
        }
        
        announcementList.innerHTML = '';
        
        announcements.forEach(announcement => {
            const announcementItem = document.createElement('div');
            announcementItem.className = `announcement-item announcement-priority-${announcement.priority}`;
            
            const publishTime = new Date(announcement.publish_time);
            const formattedDate = publishTime.toLocaleString('zh-CN');
            
            announcementItem.innerHTML = `
                <div class="announcement-title">
                    <span>${announcement.title}</span>
                    <span class="announcement-date">${formattedDate}</span>
                </div>
                <div class="announcement-content">${announcement.content}</div>
            `;
            
            announcementList.appendChild(announcementItem);
        });
    } catch (error) {
        console.error('加载公告失败:', error);
    }
}

function checkLoginStatus() {
    const token = localStorage.getItem('studentToken');
    if (!token) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

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
            
            localStorage.removeItem('studentToken');
            localStorage.removeItem('studentInfo');
            
            window.location.href = '/login.html';
        } catch (error) {
            console.error('退出登录失败:', error);
            localStorage.removeItem('studentToken');
            localStorage.removeItem('studentInfo');
            window.location.href = '/login.html';
        }
    }
}

function getAuthHeaders() {
    const token = localStorage.getItem('studentToken');
    return {
        'Authorization': `Bearer ${token}`
    };
}

function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN', { 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    document.getElementById('clock').textContent = timeString;
}

async function loadStudentData() {
    const now = Date.now();
    if (apiCache.studentData && (now - apiCache.cacheTime) < CACHE_DURATION) {
        document.getElementById('nav-name').textContent = apiCache.studentData.name;
        return;
    }
    
    try {
        const response = await fetch('/api/student/profile', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('获取学生数据失败');
        const student = await response.json();
        
        apiCache.studentData = student;
        apiCache.cacheTime = now;
        
        document.getElementById('nav-name').textContent = student.name;
    } catch (error) {
        console.error('加载学生数据错误:', error);
    }
}

async function loadCourseData() {
    const now = Date.now();
    if (apiCache.courseData && (now - apiCache.cacheTime) < CACHE_DURATION) {
        document.getElementById('stat-count').textContent = apiCache.courseData.length;
        renderCourseCards(apiCache.courseData);
        return;
    }
    
    try {
        const response = await fetch('/api/student/my-courses', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('获取课程数据失败');
        const courses = await response.json();
        
        apiCache.courseData = courses;
        apiCache.cacheTime = now;
        
        document.getElementById('stat-count').textContent = courses.length;
        
        renderCourseCards(courses);
    } catch (error) {
        console.error('加载课程数据错误:', error);
    }
}

function renderCourseCards(courses) {
    const grid = document.getElementById('my-course-grid');
    grid.innerHTML = '';
    
    if (courses.length === 0) {
        grid.innerHTML = `
            <div class="cyber-card" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                <h3 style="color: var(--primary); margin-bottom: 1rem;">未找到课程</h3>
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
                <span style="color: ${course.status === 'active' ? '#0ea5e9' : '#ef4444'}">● ${course.status === 'active' ? '进行中' : '已结束'}</span>
            </div>
            <h3>${course.course_name}</h3>
            <div class="course-detail">
                <span><i class="ri-user-line"></i> ${course.teacher}</span>
                <span><i class="ri-map-pin-line"></i> ${course.location || '未定'}</span>
            </div>
            <div class="course-detail">
                <span><i class="ri-time-line"></i> ${course.schedule_time || '待定'}</span>
                <span>学分: ${course.credits}</span>
            </div>
            <button class="action-btn" onclick="dropCourse(${course.id})">退课</button>
        `;
        grid.appendChild(card);
    });
}

async function loadAvailableCourses() {
    const now = Date.now();
    if (apiCache.availableCourses && (now - apiCache.cacheTime) < CACHE_DURATION) {
        renderAvailableCourses(apiCache.availableCourses);
        return;
    }
    
    try {
        const response = await fetch('/api/student/available-courses', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('获取可选课程失败');
        const courses = await response.json();
        
        apiCache.availableCourses = courses;
        apiCache.cacheTime = now;
        
        renderAvailableCourses(courses);
    } catch (error) {
        console.error('加载可选课程错误:', error);
    }
}

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
                    ? '<span style="color: #ef4444">已满</span>' 
                    : `<button class="enroll-btn" onclick="enrollCourse(${course.id})">选课</button>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function clearCache() {
    apiCache.courseData = null;
    apiCache.availableCourses = null;
    apiCache.cacheTime = 0;
}

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
            throw new Error(errorData.message || '选课失败');
        }
        
        const result = await response.json();
        showNotification(`选课成功: ${result.message}`, false);
        
        clearCache();
        
        loadCourseData();
        loadAvailableCourses();
    } catch (error) {
        showNotification(`错误: ${error.message}`);
        console.error('选课错误:', error);
    }
}

async function dropCourse(courseId) {
    if (!confirm('警告: 确定要从该课程中注销吗？这可能会影响你的学分。')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/student/drop/${courseId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('退课失败');
        }
        
        const result = await response.json();
        showNotification(`成功: ${result.message}`, false);
        
        clearCache();
        
        loadCourseData();
        loadAvailableCourses();
    } catch (error) {
        showNotification('错误: 退课失败');
        console.error('退课错误:', error);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        if (btn.textContent.includes(tabName.charAt(0).toUpperCase() + tabName.slice(1))) {
            btn.classList.add('active');
        }
    });
    
    if (tabName === 'resources') {
        loadStudentResources();
    }
}

async function loadStudentResources() {
    const res = await fetch('/api/student/my-courses', {
        headers: getAuthHeaders()
    });
    const courses = await res.json();
    
    const tabs = document.getElementById('student-resource-tabs');
    tabs.innerHTML = '';
    
    if (courses.length === 0) {
        tabs.innerHTML = '<div style="color:#64748b">无权限: 请先选课</div>';
        return;
    }

    courses.forEach((c, idx) => {
        const btn = document.createElement('button');
        btn.className = 'cyber-tab-btn';
        btn.innerText = c.course_code;
        btn.onclick = () => {
            document.querySelectorAll('.cyber-tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            loadStudentFiles(c.id);
        };
        tabs.appendChild(btn);
        
        if (idx === 0) {
            btn.classList.add('active');
            loadStudentFiles(c.id);
        }
    });
}

async function loadStudentFiles(courseId) {
    const res = await fetch(`/api/materials/${courseId}`);
    const files = await res.json();
    const grid = document.getElementById('student-file-list');
    grid.innerHTML = '';
    
    if (files.length === 0) {
        grid.innerHTML = '<div style="color:#64748b; grid-column:1/-1">// 系统: 该频道暂无数据传输</div>';
        return;
    }

    files.forEach(f => {
        const a = document.createElement('a');
        a.className = 'cyber-file-card';
        a.href = f.file_path;
        a.download = f.file_name;
        a.innerHTML = `
            <div class="cyber-file-icon"><i class="ri-file-download-line"></i></div>
            <div class="cyber-file-name">${f.file_name}</div>
            <div class="cyber-file-meta">
                <span>${f.file_type}</span>
                <span>${f.file_size}</span>
            </div>
        `;
        grid.appendChild(a);
    });
}

function createBlinkEffect() {
    const blinkElements = document.querySelectorAll('.blink');
    blinkElements.forEach(el => {
        el.style.animation = 'blink-animation 1.5s infinite';
    });
}

const style = document.createElement('style');
style.textContent = `
    .blink {
        animation: blink 1s infinite;
    }
    
    @keyframes blink {
        0%, 50% { opacity: 1; }
        51%, 100% { opacity: 0; }
    }
    
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

createBlinkEffect();

function showNotification(message, isError = true) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : 'success'}`;
    notification.innerHTML = `
        <i class="ri-${isError ? 'close-circle' : 'check-circle'}-line"></i>
        <span>${message}</span>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="ri-close-line"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

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

function handleFormSubmit(event) {
    event.preventDefault();
    console.log('表单已提交');
}

const forms = document.querySelectorAll('form');
forms.forEach(form => {
    form.addEventListener('submit', handleFormSubmit);
});

let currentDate = new Date();
let allCourses = [];

function initCalendar() {
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    document.getElementById('todayBtn').addEventListener('click', goToday);
    
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (e.target.textContent.includes('课程日程')) {
                renderCalendar();
                renderTodayCourses();
            }
        });
    });
    
    renderCalendar();
    renderTodayCourses();
}

async function updateCourseData() {
    try {
        const response = await fetch('/api/student/my-courses', {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('获取课程数据失败');
        allCourses = await response.json();
        return allCourses;
    } catch (error) {
        console.error('更新课程数据错误:', error);
        return [];
    }
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
}

function goToday() {
    currentDate = new Date();
    renderCalendar();
}

function renderCalendar() {
    updateCourseData().then(courses => {
        allCourses = courses;
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                           '七月', '八月', '九月', '十月', '十一月', '十二月'];
        document.getElementById('currentMonth').textContent = `${year}年 ${monthNames[month]}`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDayOfWeek = firstDay.getDay();
        const totalDays = lastDay.getDate();
        
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.innerHTML = `<div class="day-number">${prevMonthLastDay - i}</div>`;
            calendarDays.appendChild(dayDiv);
        }
        
        const today = new Date();
        for (let day = 1; day <= totalDays; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            
            const currentDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            
            if (day === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayDiv.classList.add('today');
            }
            
            dayDiv.innerHTML = `<div class="day-number">${day}</div>`;
            
            const dayCourses = allCourses.filter(course => {
                if (course.schedule_time) {
                    const courseDate = course.schedule_time.split(' ')[0];
                    return courseDate === currentDateStr;
                }
                return false;
            });
            
            dayCourses.forEach((course, index) => {
                const eventDiv = document.createElement('div');
                eventDiv.className = `course-event ${index > 0 ? 'secondary' : ''}`;
                eventDiv.textContent = course.course_name;
                dayDiv.appendChild(eventDiv);
            });
            
            calendarDays.appendChild(dayDiv);
        }
        
        const remainingDays = 42 - (startDayOfWeek + totalDays);
        for (let i = 1; i <= remainingDays; i++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day other-month';
            dayDiv.innerHTML = `<div class="day-number">${i}</div>`;
            calendarDays.appendChild(dayDiv);
        }
    });
}

function renderTodayCourses() {
    updateCourseData().then(courses => {
        allCourses = courses;
        const today = new Date();
        const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        const todayCourses = allCourses.filter(course => {
            if (course.schedule_time) {
                const courseDate = course.schedule_time.split(' ')[0];
                return courseDate === todayStr;
            }
            return false;
        });
        
        const container = document.getElementById('todayCourseList');
        container.innerHTML = '';
        
        if (todayCourses.length === 0) {
            container.innerHTML = '<div style="color: var(--text-muted); text-align: center; padding: 20px;">今日无课程</div>';
            return;
        }
        
        todayCourses.forEach(course => {
            const courseItem = document.createElement('div');
            courseItem.className = 'today-course-item';
            courseItem.innerHTML = `
                <div class="course-info">
                    <h4>${course.course_name}</h4>
                    <div class="course-time-loc">
                        <span><i class="ri-time-line"></i> ${course.schedule_time ? course.schedule_time.split(' ')[1] : '待定'}</span>
                        <span><i class="ri-map-pin-line"></i> ${course.location || '未定'}</span>
                    </div>
                </div>
                <div class="course-credits">${course.credits}学分</div>
            `;
            container.appendChild(courseItem);
        });
    });
}

// ================= AI 助教聊天逻辑 =================

let chatHistory = [];

async function sendAiMessage() {
    const input = document.getElementById('ai-input');
    const msg = input.value.trim();
    if (!msg) return;

    // 1. 添加用户消息到界面
    appendMessage('user', msg);
    input.value = '';
    
    // 禁用发送防止重复
    const btn = document.querySelector('.cyber-send-btn');
    btn.disabled = true;
    btn.innerText = 'PROCESSING...';

    // 2. 添加 AI 正在输入动画 (简单的)
    const loadingId = appendMessage('ai', 'Thinking...');

    try {
        // 3. 调用后端
        const res = await fetch('/api/chat/edu', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: msg,
                history: chatHistory.slice(-5) // 只保留最近5条记录节省 Token
            })
        });
        const data = await res.json();

        // 4. 更新界面
        removeMessage(loadingId); // 移除 loading
        appendMessage('ai', data.content); // 显示真消息
        
        // 更新历史
        chatHistory.push({ role: 'user', content: msg });
        chatHistory.push({ role: 'assistant', content: data.content });

    } catch (err) {
        removeMessage(loadingId);
        appendMessage('ai', 'ERROR: 神经连接中断，无法连接主机。');
    } finally {
        btn.disabled = false;
        btn.innerText = 'EXECUTE';
    }
}

// 辅助：添加消息到 DOM
function appendMessage(role, text) {
    const viewport = document.getElementById('chat-viewport');
    const id = 'msg-' + Date.now();
    
    const div = document.createElement('div');
    div.className = `chat-msg ${role}`;
    div.id = id;
    
    div.innerHTML = `
        <div class="avatar">${role === 'user' ? 'ME' : 'AI'}</div>
        <div class="bubble">${text}</div>
    `;
    
    viewport.appendChild(div);
    viewport.scrollTop = viewport.scrollHeight;
    return id;
}

function removeMessage(id) {
    const el = document.getElementById(id);
    if(el) el.remove();
}

// 监听回车发送
document.getElementById('ai-input')?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendAiMessage();
});
