document.addEventListener('DOMContentLoaded', () => {
    loadDashboard();
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

let currentEditingId = null;
let dashboardChart = null;

function switchView(viewName) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.style.display = 'block';
        const navIndex = ['dashboard', 'courses', 'students', 'schedule', 'resources', 'announcements', 'settings'].indexOf(viewName);
        document.querySelectorAll('.nav-item')[navIndex].classList.add('active');

        if(viewName === 'dashboard') loadDashboard();
        if(viewName === 'courses') loadCourses();
        if(viewName === 'students') loadStudents();
        if(viewName === 'schedule') loadSchedule();
        if(viewName === 'resources') loadResourceView();
        if(viewName === 'announcements') loadAnnouncements();
        if(viewName === 'settings') loadSettings();
    }
}

async function loadDashboard() {
    const res = await fetch('/api/stats');
    const data = await res.json();
    document.getElementById('stat-courses').innerText = data.totalCourses;
    document.getElementById('stat-students').innerText = data.totalStudents;
    document.getElementById('dash-semester').innerText = data.semester || '加载中...';
    document.getElementById('nav-system-name').innerText = "加立敦大学";
    
    try {
        const chartRes = await fetch('/api/stats/chart');
        const chartData = await chartRes.json();
        
        if (!chartData.labels || !chartData.data) {
            console.error('图表数据格式错误:', chartData);
            return;
        }
        
        const ctx = document.getElementById('enrollmentChart').getContext('2d');
        const canvas = ctx.canvas;
        canvas.style.height = '300px';
        
        if (dashboardChart) dashboardChart.destroy();
        
        dashboardChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: chartData.labels,
                datasets: [{
                    label: '选课人数',
                    data: chartData.data,
                    backgroundColor: 'rgba(79, 70, 229, 0.6)',
                    borderColor: 'rgba(79, 70, 229, 1)',
                    borderWidth:1
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
                        display: false
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
                events: ['click', 'mousemove', 'mouseout'],
                resizeDelay: 100
            }
        });
    } catch (error) {
        console.error('加载图表数据失败:', error);
        const ctx = document.getElementById('enrollmentChart');
        if (ctx) {
            const parent = ctx.parentElement;
            parent.innerHTML += '<p style="text-align: center; color: #ef4444; margin-top: 20px;">图表加载失败，请稍后重试</p>';
        }
    }
    
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
    
    const container = document.getElementById('schedule-container');
    
    if(!container) return;

    container.className = 'schedule-grid'; 
    container.innerHTML = '';

    courses.forEach(c => {
        const card = document.createElement('div');
        card.className = 'schedule-card';
        
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

function openModal(id) {
    document.getElementById(id).style.display = 'block';
    document.getElementById('courseForm').reset();
    currentEditingId = null;
    document.querySelector('#courseModal h2').innerText = '新增课程';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

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

    if (currentEditingId) {
        url = `/api/courses/${currentEditingId}`;
        method = 'PUT';
        const courseRes = await fetch(`/api/courses/${currentEditingId}`);
        const existingCourse = await courseRes.json();
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
            loadCourses();
            alert('保存成功！');
        }
    } catch (err) {
        alert('操作失败');
    }
}

function editCourse(id, code, name, teacher, credits) {
    currentEditingId = id;
    document.getElementById('c_code').value = code;
    document.getElementById('c_name').value = name;
    document.getElementById('c_teacher').value = teacher;
    document.getElementById('c_credits').value = credits;
    
    document.getElementById('courseModal').style.display = 'block';
    document.querySelector('#courseModal h2').innerText = '编辑课程';
}

async function deleteCourse(id) {
    if(!confirm('确定要删除这门课程吗？')) return;
    
    await fetch(`/api/courses/${id}`, { method: 'DELETE' });
    loadCourses();
}

async function saveSchedule(id, btnElement) {
    const time = document.getElementById(`time-${id}`).value;
    const loc = document.getElementById(`loc-${id}`).value;
    
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = '<i class="ri-loader-4-line ri-spin"></i> 保存中';
    btnElement.disabled = true;

    try {
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
            btnElement.style.backgroundColor = '#10b981';
            setTimeout(() => {
                btnElement.innerHTML = originalText;
                btnElement.style.backgroundColor = '';
                btnElement.disabled = false;
            }, 1500);
        } else {
            throw new Error('保存失败');
        }
    } catch (e) {
        alert('保存失败，请重试');
        btnElement.innerHTML = originalText;
        btnElement.disabled = false;
    }
}

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
    loadDashboard();
}

let selectedCourseIdForResource = null;

async function loadResourceView() {
    const res = await fetch('/api/courses');
    const courses = await res.json();
    const list = document.getElementById('resource-course-list');
    list.innerHTML = '';

    courses.forEach((c, index) => {
        const div = document.createElement('div');
        div.className = 'course-item-btn';
        div.innerText = `${c.course_code} - ${c.course_name}`;
        div.onclick = () => selectCourseForResource(c.id, c.course_name, div);
        
        if(index === 0) selectCourseForResource(c.id, c.course_name, div);
        list.appendChild(div);
    });
}

async function selectCourseForResource(id, name, element) {
    selectedCourseIdForResource = id;
    document.getElementById('current-course-title').innerText = name;
    
    document.querySelectorAll('.course-item-btn').forEach(el => el.classList.remove('active'));
    if(element) element.classList.add('active');

    loadFiles(id);
}

async function loadFiles(courseId) {
    const res = await fetch(`/api/materials/${courseId}`);
    const files = await res.json();
    const grid = document.getElementById('file-grid');
    grid.innerHTML = '';

    files.forEach(f => {
        const typeClass = f.file_type.toLowerCase().includes('pdf') ? 'pdf' : 
                          f.file_type.toLowerCase().includes('doc') ? 'doc' : 
                          f.file_type.toLowerCase().includes('zip') ? 'zip' : 'other';
        
        const div = document.createElement('div');
        div.className = 'file-card';
        div.innerHTML = `
            <i class="ri-close-circle-fill btn-delete-file" onclick="deleteFile(${f.id})" title="删除文件"></i>
            <div class="file-icon ${typeClass}">${f.file_type}</div>
            <div class="file-name" title="${f.file_name}">${f.file_name}</div>
            <div class="file-size">${f.file_size}</div>
        `;
        grid.appendChild(div);
    });
}

async function handleFileUpload(input) {
    if(!selectedCourseIdForResource) return alert('请先选择课程');
    const file = input.files[0];
    if(!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('courseId', selectedCourseIdForResource);

    const zoneContent = document.querySelector('.zone-content p');
    const originalText = zoneContent.innerText;
    zoneContent.innerText = '正在上传...';

    try {
        const res = await fetch('/api/materials', {
            method: 'POST',
            body: formData
        });

        if(res.ok) {
            loadFiles(selectedCourseIdForResource);
            input.value = '';
        } else {
            const result = await res.json();
            alert(`上传失败: ${result.message}`);
        }
    } catch (error) {
        alert('上传失败，请重试');
    } finally {
        zoneContent.innerText = originalText;
    }
}

async function deleteFile(id) {
    if(!confirm('确定删除该文件吗？')) return;
    
    try {
        const res = await fetch(`/api/materials/${id}`, { method: 'DELETE' });
        if(res.ok) {
            loadFiles(selectedCourseIdForResource);
        } else {
            const result = await res.json();
            alert(`删除失败: ${result.message}`);
        }
    } catch (error) {
        alert('删除失败，请重试');
    }
}

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

async function deleteStudent(id) {
    if(!confirm('确定要删除该学生吗？')) return;
    
    await fetch(`/api/students/${id}`, { method: 'DELETE' });
    loadStudents();
}

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
            loadStudents();
            alert('保存成功！');
        }
    } catch (err) {
        alert('操作失败');
    }
}

async function openGradingModal(courseId, courseName) {
    const res = await fetch(`/api/courses/${courseId}/students`);
    const students = await res.json();
    
    const courseNameElement = document.getElementById('grade-course-name');
    courseNameElement.innerText = courseName;
    courseNameElement.dataset.courseId = courseId;
    const tbody = document.getElementById('grading-table-body');
    tbody.innerHTML = '';
    
    students.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${s.student_id}</td>
            <td>${s.name}</td>
            <td><input type="number" class="grade-input" id="grade-${s.id}" value="${s.grade || ''}" placeholder="0-100"></td>
            <td><input type="text" class="feedback-input" id="feedback-${s.id}" value="${s.feedback || ''}" placeholder="评语"></td>
            <td>
                <button class="btn-save-grade" onclick="saveGrade(${s.id})">保存</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    document.getElementById('gradingModal').style.display = 'block';
}

async function saveGrade(studentId) {
    const grade = document.getElementById(`grade-${studentId}`).value;
    const feedback = document.getElementById(`feedback-${studentId}`).value;
    const courseId = document.getElementById('grade-course-name').dataset.courseId;
    
    try {
        const res = await fetch('/api/grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId, studentId, grade, feedback })
        });
        
        if (res.ok) {
            alert('成绩保存成功！');
        } else {
            alert('保存失败，请重试');
        }
    } catch (error) {
        alert('保存失败，请重试');
    }
}

async function loadAnnouncements() {
    const res = await fetch('/api/announcements');
    const announcements = await res.json();
    const list = document.getElementById('announcement-list');
    list.innerHTML = '';
    
    announcements.forEach(a => {
        const div = document.createElement('div');
        div.className = `msg-item ${a.priority === 'high' ? 'high' : ''}`;
        
        const publishTime = new Date(a.publish_time);
        const formattedDate = publishTime.toLocaleString('zh-CN');
        
        div.innerHTML = `
            <div class="msg-title">
                <span>${a.title}</span>
                <span class="msg-date">${formattedDate}</span>
            </div>
            <div style="font-size:13px; color:#6b7280;">${a.content}</div>
        `;
        list.appendChild(div);
    });
    
    if(announcements.length === 0) {
        list.innerHTML = '<div style="text-align:center; padding:20px; color:#6b7280;">暂无公告</div>';
    }
}

async function postAnnouncement(e) {
    e.preventDefault();
    
    const data = {
        title: document.getElementById('ann-title').value,
        content: document.getElementById('ann-content').value,
        priority: document.getElementById('ann-priority').value
    };
    
    try {
        const res = await fetch('/api/announcements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            document.getElementById('ann-title').value = '';
            document.getElementById('ann-content').value = '';
            loadAnnouncements();
            alert('公告发布成功！');
        } else {
            const result = await res.json();
            alert(`发布失败: ${result.message}`);
        }
    } catch (error) {
        alert('发布失败，请重试');
    }
}
