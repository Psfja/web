// 表单切换功能
function switchForm(formType) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (formType === 'register') {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
    } else {
        registerForm.classList.remove('active');
        loginForm.classList.add('active');
    }
    
    // 清除所有消息
    clearMessages();
}

// 密码显示/隐藏切换
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const icon = input.parentElement.querySelector('.toggle-password i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'ri-eye-off-line';
    } else {
        input.type = 'password';
        icon.className = 'ri-eye-line';
    }
}

// 清除消息
function clearMessages() {
    const messages = document.querySelectorAll('.error-message, .success-message');
    messages.forEach(msg => msg.remove());
}

// 显示消息
function showMessage(form, message, isError = true) {
    clearMessages();
    const messageDiv = document.createElement('div');
    messageDiv.className = isError ? 'error-message' : 'success-message';
    messageDiv.innerHTML = `
        <i class="ri-${isError ? 'close-circle' : 'check-circle'}-line"></i>
        <span>${message}</span>
    `;
    form.insertBefore(messageDiv, form.firstChild);
    
    // 自动隐藏成功消息
    if (!isError) {
        setTimeout(() => {
            clearMessages();
        }, 3000);
    }
}

// 登录表单提交处理
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.auth-btn');
    
    // 禁用按钮防止重复提交
    btn.disabled = true;
    btn.classList.add('loading');
    clearMessages();
    
    try {
        const formData = new FormData(form);
        const data = {
            studentId: formData.get('studentId'),
            password: formData.get('password')
        };
        
        // 调用登录API
        const response = await fetch('/api/student/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || '登录失败');
        }
        
        // 保存用户信息到本地存储
        localStorage.setItem('studentToken', result.token);
        localStorage.setItem('studentInfo', JSON.stringify(result.student));
        
        // 跳转到学生主页
        window.location.href = '/student.html';
        
    } catch (error) {
        showMessage(form, error.message);
    } finally {
        // 恢复按钮状态
        btn.disabled = false;
        btn.classList.remove('loading');
    }
});

// 注册表单提交处理
document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('.auth-btn');
    
    // 禁用按钮防止重复提交
    btn.disabled = true;
    btn.classList.add('loading');
    clearMessages();
    
    try {
        const formData = new FormData(form);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        
        // 密码验证
        if (password !== confirmPassword) {
            throw new Error('两次输入的密码不一致');
        }
        
        if (password.length < 6) {
            throw new Error('密码长度不能少于6位');
        }
        
        const data = {
            studentId: formData.get('studentId'),
            name: formData.get('name'),
            major: formData.get('major'),
            email: formData.get('email'),
            password: password
        };
        
        // 调用注册API
        const response = await fetch('/api/student/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.message || '注册失败');
        }
        
        // 显示成功消息
        showMessage(form, '注册成功！正在跳转登录...', false);
        
        // 2秒后切换到登录表单
        setTimeout(() => {
            switchForm('login');
            // 清空注册表单
            form.reset();
        }, 2000);
        
    } catch (error) {
        showMessage(form, error.message);
    } finally {
        // 恢复按钮状态
        btn.disabled = false;
        btn.classList.remove('loading');
    }
});

// 检查是否已登录
function checkLogin() {
    const token = localStorage.getItem('studentToken');
    if (token) {
        // 如果已经登录，跳转到学生主页
        window.location.href = '/student.html';
    }
}

// 页面加载时检查登录状态
window.addEventListener('load', checkLogin);

// 忘记密码处理
document.querySelector('.forgot-password').addEventListener('click', (e) => {
    e.preventDefault();
    alert('请联系管理员重置密码');
});

// 表单验证：学号格式
document.getElementById('login-student-id').addEventListener('input', (e) => {
    const value = e.target.value;
    // 简单的学号格式验证，只允许字母和数字
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
        e.target.setCustomValidity('学号只能包含字母和数字');
    } else {
        e.target.setCustomValidity('');
    }
});

document.getElementById('reg-student-id').addEventListener('input', (e) => {
    const value = e.target.value;
    if (!/^[a-zA-Z0-9]+$/.test(value)) {
        e.target.setCustomValidity('学号只能包含字母和数字');
    } else {
        e.target.setCustomValidity('');
    }
});

// 表单验证：密码强度
document.getElementById('reg-password').addEventListener('input', (e) => {
    const value = e.target.value;
    if (value.length < 6) {
        e.target.setCustomValidity('密码长度不能少于6位');
    } else {
        e.target.setCustomValidity('');
    }
});

document.getElementById('reg-confirm-password').addEventListener('input', (e) => {
    const password = document.getElementById('reg-password').value;
    if (e.target.value !== password) {
        e.target.setCustomValidity('两次输入的密码不一致');
    } else {
        e.target.setCustomValidity('');
    }
});