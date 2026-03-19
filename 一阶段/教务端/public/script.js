// 初始化
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
});

// 全局变量，用于存储当前编辑的课程和图表实例
let currentEditingId = null;
let dashboardChart = null;

// ================= 视图切换逻辑 =================
function switchView(viewName) {
    // 1. 隐藏所有 section
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    // 2. 移除侧边栏 active 状态
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    // 3. 显示目标 section 并激活侧边栏
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.style.display = 'block';
        // 找到对应的 nav-item 并高亮 (这里简单处理，遍历匹配)
        // 实际操作中可以通过点击事件传递 this 更好，这里为了代码简洁
        const navIndex = ['dashboard', 'courses', 'students', 'schedule', 'announcements', 'settings'].indexOf(viewName);
        document.querySelectorAll('.nav-item')[navIndex].classList.add('active');

        // 4. 根据视图加载数据
        if(viewName === 'dashboard') loadDashboard();
        if(viewName === 'courses') loadCourses();
        if(viewName === 'students') loadStudents();
        if(viewName === 'schedule') loadSchedule();
        if(viewName === 'announcements') loadAnnouncements();
        if(viewName === 'settings') loadSettings();
    }
}

// ================= 数据加载函数 =================

async function loadDashboard() {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('stat-courses').innerText = data.totalCourses;
    document.getElementById('stat-students').innerText = data.totalStudents;
    document.getElementById('dash-semester').innerText = data.semester || '加载中...';
    // 同时更新左上角系统名
    document.getElementById('nav-system-name').innerText = "Lumina";
    
    // 获取图表数据
    try {
        const chartRes = await fetch('/api/stats/chart');
        const chartData = await chartRes.json();
        
        // 检查数据是否有效
        if (!chartData.labels || !chartData.data) {
            console.error('图表数据格式错误:', chartData);
            return;
        }
        
        const ctx = document.getElementById('enrollmentChart').getContext('2d');
        
        // 确保canvas元素有正确的高度
        const canvas = ctx.canvas;
        canvas.style.height = '300px';
        
        // 销毁旧图表防止重叠
        if (dashboardChart) dashboardChart.destroy();
        
        dashboardChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: '选课人数',
                    data: chartData.data,
                    backgroundColor: 'rgba(79, 70, 229, 0.6)', // 靛蓝色半透明
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                aspectRatio: 2.5,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            maxTicksLimit: 6
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 12
                            },
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false // 隐藏图例
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        },
                        borderColor: 'rgba(79, 70, 229, 1)',
                        borderWidth: 1
                    }
                },
                animation: {
                    duration: 500,
                    easing: 'easeInOutQuad',
                    loop: false
                },
                // 防止图表无限增长
                events: ['click', 'mousemove', 'mouseout'],
                resizeDelay: 100
            }
        });
    } catch (error) {
        console.error('加载图表数据失败:', error);
        // 显示错误信息
        const ctx = document.getElementById('enrollmentChart');
        if (ctx) {
            const parent = ctx.parentElement;
            parent.innerHTML += '<p style="text-align: center; color: #ef4444; margin-top: 20px;">图表加载失败，请稍后重试</p>';
        }
    }
    
    // 模拟最新动态
    const activities = [
        "系统备份成功 - 10分钟前",
        "新学生 S2023005 注册 - 2小时前",
        "计算机科学导论 课程信息已更新 - 昨天"
    ];
    document.getElementById('recent-activities').innerHTML = activities.map(a => `<li style="margin-bottom:8px; font-size:13px; color:#6b7280; display:flex; gap:8px;"><i class="ri-checkbox-circle-line" style="color:green"></i> ${a}</li>`).join('');
}

async function loadCourses() {
    const res = await fetch('/api/courses');
    const courses = await res.json();
    const tbody = document.getElementById('course-table-body');
    tbody.innerHTML = '';
    
    courses.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight:600">${c.course_code}</td>
            <td>${c.course_name}</td>
            <td>${c.teacher}</td>
            <td>${c.credits}</td>
            <td>${c.location || '-'}</td>
            <td>
                <button class="btn-icon edit" onclick="editCourse(${c.id}, '${c.course_code}', '${c.course_name}', '${c.teacher}', ${c.credits})"><i class="ri-edit-line"></i></button>
                <button class="btn-icon delete" onclick="deleteCourse(${c.id})"><i class="ri-delete-bin-line"></i></button>
                <button class="btn-primary" style="padding: 6px 12px; font-size: 12px; margin-left: 8px;" onclick="openGradingModal(${c.id}, '${c.course_name}')">
                    <i class="ri-group-line"></i> 学生管理 & 评分
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function loadStudents() {
    const res = await fetch('/api/students');
    const students = await res.json();
    const tbody = document.getElementById('student-table-body');
    tbody.innerHTML = '';
    
    students.forEach(s => {
        const tr = document.createElement('tr');
        const statusBadge = s.status === 'active' 
            ? '<span style="background:#d1fae5; color:#065f46; padding:2px 8px; border-radius:10px; font-size:12px;">在读</span>' 
            : '<span style="background:#fee2e2; color:#991b1b; padding:2px 8px; border-radius:10px; font-size:12px;">已毕业</span>';
        
        tr.innerHTML = `
            <td>${s.student_id}</td>
            <td style="font-weight:500">${s.name}</td>
            <td>${s.major}</td>
            <td>${s.email}</td>
            <td>${statusBadge}</td>
            <td>
                <button class="btn-icon edit" onclick="editStudent(${s.id}, '${s.student_id}', '${s.name}', '${s.major}', '${s.email}', '${s.status}')"><i class="ri-edit-line"></i></button>
                <button class="btn-icon delete" onclick="deleteStudent(${s.id})"><i class="ri-delete-bin-line"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    if(students.length === 0) tbody.innerHTML = '<tr><td colspan="6">暂无学生数据</td></tr>';
}

async function loadSchedule() {
    const res = await fetch('/api/courses');
    const courses = await res.json();
    
    // 注意：这里我们要在HTML里把之前的 id="schedule-container" 改个名字或者对应上
    // 建议在 index.html 里把 id="schedule-container" 对应的 div 清空，
    // 并确保它有一个 class="schedule-grid" (见第3步)
    const container = document.getElementById('schedule-container');
    
    // 如果容器不存在，防止报错
    if(!container) return;

    // 清空容器并添加 Grid 类名（确保样式生效）
    container.className = 'schedule-grid'; 
    container.innerHTML = '';

    courses.forEach(c => {
        const card = document.createElement('div');
        card.className = 'schedule-card';
        
        // 构建卡片内部 HTML
        card.innerHTML = `
            <div class="schedule-header">
                <span class="course-badge">${c.course_code}</span>
                <h3 title="${c.course_name}">${c.course_name}</h3>
                <p><i class="ri-user-line"></i> ${c.teacher}</p>
            </div>
            
            <div class="schedule-body">
                <div class="input-wrapper">
                    <i class="ri-time-line"></i>
                    <input type="text" class="schedule-input" 
                           id="time-${c.id}" 
                           value="${c.schedule_time && c.schedule_time !== '待定' ? c.schedule_time : ''}" 
                           placeholder="上课时间 (如: 周一 08:00)">
                </div>
                <div class="input-wrapper">
                    <i class="ri-map-pin-line"></i>
                    <input type="text" class="schedule-input" 
                           id="loc-${c.id}" 
                           value="${c.location && c.location !== '待定' ? c.location : ''}" 
                           placeholder="上课地点 (如: A-101)">
                </div>
            </div>

            <div class="schedule-footer">
                <button class="btn-save-schedule" onclick="saveSchedule(${c.id}, this)">
                    <i class="ri-save-3-line"></i> 保存排课
                </button>
            </div>
        `;
        container.appendChild(card);
    });
}

async function loadSettings() {
    const res = await fetch('/api/settings');
    const settings = await res.json();
    document.getElementById('set-sys-name').value = settings.system_name || '';
    document.getElementById('set-semester').value = settings.current_semester || '';
}

// ================= 操作逻辑 (CRUD) =================

// 1. 打开/关闭模态框
function openModal(id) {
    document.getElementById(id).style.display = 'block';
    // 重置表单
    document.getElementById('courseForm').reset();
    currentEditingId = null;
    document.querySelector('#courseModal h2').innerText = '新增课程';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// 2. 提交课程表单 (新增或编辑)
async function handleCourseSubmit(e) {
    e.preventDefault();
    
    const data = {
        course_code: document.getElementById('c_code').value,
        course_name: document.getElementById('c_name').value,
        teacher: document.getElementById('c_teacher').value,
        credits: document.getElementById('c_credits').value,
        location: '待定',
        schedule_time: '待定'
    };

    let url = '/api/courses';
    let method = 'POST';

    // 如果是编辑模式
    if (currentEditingId) {
        url = `/api/courses/${currentEditingId}`;
        method = 'PUT';
        // 编辑模式下，我们需要获取现有课程数据，因为PUT接口需要所有字段
        const courseRes = await fetch(`/api/courses/${currentEditingId}`);
        const existingCourse = await courseRes.json();
        // 合并数据，保留原有location和schedule_time
        data.location = existingCourse.location;
        data.schedule_time = existingCourse.schedule_time;
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            closeModal('courseModal');
            loadCourses(); // 刷新列表
            alert('保存成功！');
        }
    } catch (err) {
        alert('操作失败');
    }
}

// 3. 点击编辑按钮，回填数据到模态框
function editCourse(id, code, name, teacher, credits) {
    currentEditingId = id;
    document.getElementById('c_code').value = code;
    document.getElementById('c_name').value = name;
    document.getElementById('c_teacher').value = teacher;
    document.getElementById('c_credits').value = credits;
    
    document.getElementById('courseModal').style.display = 'block';
    document.querySelector('#courseModal h2').innerText = '编辑课程';
}

// 4. 删除课程
async function deleteCourse(id) {
    if(!confirm('确定要删除这门课程吗？')) return;
    
    await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    loadCourses();
}

// 5. 保存排课信息
async function saveSchedule(id, btnElement) {
    const time = document.getElementById(`time-${id}`).value;
    const loc = document.getElementById(`loc-${id}`).value;
    
    // 简单的按钮加载状态
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> 保存中';
    btnElement.disabled = true;

    try {
        // 先获取旧数据（为了保持其他字段不变）
        // 注意：实际项目中后端应该提供 PATCH 接口只更新部分字段
        const allCoursesRes = await fetch('/api/courses');
        const allCourses = await allCoursesRes.json();
        const currentCourse = allCourses.find(c => c.id === id);

        const updateData = {
            course_name: currentCourse.course_name,
            teacher: currentCourse.teacher,
            location: loc || '待定',
            schedule_time: time || '待定'
        };

        const res = await fetch(`/api/courses/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updateData)
        });

        if (res.ok) {
            btnElement.innerHTML = '<i class="ri-check-line"></i> 已保存';
            btnElement.style.backgroundColor = '#10b981'; // 绿色
            setTimeout(() => {
                btnElement.innerHTML = originalText;
                btnElement.style.backgroundColor = ''; // 恢复原色
                btnElement.disabled = false;
            }, 1500);
        } else {
            throw new Error('Save failed');
        }
    } catch (e) {
        alert('保存失败，请重试');
        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
    }
}

// 6. 保存设置
async function saveSettings(e) {
    e.preventDefault();
    const data = {
        system_name: document.getElementById('set-sys-name').value,
        current_semester: document.getElementById('set-semester').value
    };
    
    await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
    
    alert('系统设置已更新');
    loadDashboard(); // 刷新头部显示
}

// ================= 学生管理交互 =================

// 1. 点击编辑按钮，回填数据到学生模态框
function editStudent(id, student_id, name, major, email, status) {
    currentEditingId = id;
    document.getElementById('studentId').value = id;
    document.getElementById('s_id').value = student_id;
    document.getElementById('s_name').value = name;
    document.getElementById('s_major').value = major;
    document.getElementById('s_email').value = email;
    document.getElementById('s_status').value = status;
    
    document.getElementById('studentModal').style.display = 'block';
    document.querySelector('#studentModal h2').innerText = '编辑学生';
}

// 2. 删除学生
async function deleteStudent(id) {
    if(!confirm('确定要删除这个学生吗？')) return;
    
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    loadStudents();
}

// 3. 提交学生表单 (新增或编辑)
async function handleStudentSubmit(e) {
    e.preventDefault();
    
    const data = {
        student_id: document.getElementById('s_id').value,
        name: document.getElementById('s_name').value,
        major: document.getElementById('s_major').value,
        email: document.getElementById('s_email').value,
        status: document.getElementById('s_status').value
    };

    let url = '/api/students';
    let method = 'POST';

    // 如果是编辑模式
    if (currentEditingId) {
        url = `/api/students/${currentEditingId}`;
        method = 'PUT';
    }

    try {
        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            closeModal('studentModal');
            loadStudents(); // 刷新列表
            alert('保存成功！');
        } else {
            const error = await res.json();
            alert('操作失败: ' + error.error);
        }
    } catch (err) {
        alert('操作失败: ' + err.message);
    }
}

// ================= 公告发布系统 =================

async function loadAnnouncements() {
    const res = await fetch('/api/announcements');
    const list = await res.json();
    const container = document.getElementById('announcement-list');
    
    container.innerHTML = list.map(item => `
        <div class="msg-item ${item.priority}">
            <div class="msg-title">
                <span>${item.title}</span>
                ${item.priority === 'high' ? '<span style="color:#ef4444; font-size:12px;">紧急</span>' : ''}
            </div>
            <p style="font-size:13px; color:#4b5563; margin-top:4px;">${item.content}</p>
            <span class="msg-date">${new Date(item.publish_time).toLocaleString()}</span>
        </div>
    `).join('');
}

async function postAnnouncement(e) {
    e.preventDefault();
    const data = {
        title: document.getElementById('ann-title').value,
        content: document.getElementById('ann-content').value,
        priority: document.getElementById('ann-priority').value
    };

    await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    // 清空表单并刷新
    e.target.reset();
    loadAnnouncements();
    alert('公告发布成功');
}

// ================= 成绩录入系统 =================

async function openGradingModal(courseId, courseName) {
    document.getElementById('gradingModal').style.display = 'block';
    document.getElementById('grade-course-name').innerText = courseName;
    
    const res = await fetch(`/api/courses/${courseId}/students`);
    const students = await res.json();
    const tbody = document.getElementById('grading-table-body');
    tbody.innerHTML = '';

    if (students.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#9ca3af;">暂无学生选修此课</td></tr>';
        return;
    }

    students.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.student_id}</td>
            <td>${s.name}</td>
            <td><input type="text" class="grade-input" id="grade-${s.id}" value="${s.grade || ''}" placeholder="0-100"></td>
            <td><input type="text" class="feedback-input" id="feed-${s.id}" value="${s.feedback || ''}" placeholder="填写评语..."></td>
            <td>
                <button class="btn-save-grade" onclick="saveGrade(${courseId}, ${s.id})"><i class="ri-check-line"></i> 保存</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function saveGrade(courseId, studentId) {
    const grade = document.getElementById(`grade-${studentId}`).value;
    const feedback = document.getElementById(`feed-${studentId}`).value;

    const res = await fetch('/api/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, studentId, grade, feedback })
    });

    if (res.ok) {
        // 简单提示，实际可用 Toast
        const btn = event.target;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="ri-check-line"></i> 已保存';
        btn.style.background = '#059669';
        setTimeout(() => { 
            btn.innerHTML = originalText; 
            btn.style.background = '';
        }, 1000);
    }
}

// ================= 通用功能 =================

// 点击模态框外部关闭模态框
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}