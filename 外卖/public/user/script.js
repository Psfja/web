let cart = [];
let foods = [];
let currentCategory = 'all';
let currentUser = null;

// 更新用户界面
function updateUserUI() {
    const navProfile = document.getElementById('nav-profile');
    const userInfoSection = document.getElementById('userInfoSection');
    
    if (currentUser) {
        navProfile.style.display = 'block';
        userInfoSection.style.display = 'block';
        
        document.getElementById('userAvatar').src = currentUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
        document.getElementById('userNickname').innerText = currentUser.nickname || currentUser.username;
        
        document.getElementById('profileAvatar').src = currentUser.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
        document.getElementById('profileNickname').innerText = currentUser.nickname || currentUser.username;
        document.getElementById('profileUsername').innerText = currentUser.username;
        document.getElementById('profileNicknameInput').value = currentUser.nickname || '';
        document.getElementById('profilePhone').value = currentUser.phone || '';
    }
}

// 获取当前用户信息
async function fetchCurrentUser() {
    try {
        const res = await fetch('/api/auth/user');
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            updateUserUI();
        } else {
            // 未登录，重定向到登录页面
            window.location.href = '/user/login.html?error=' + encodeURIComponent('请先登录');
        }
    } catch (err) {
        console.error('获取用户信息失败:', err);
        window.location.href = '/user/login.html?error=' + encodeURIComponent('获取用户信息失败，请重新登录');
    }
}

// 退出登录
async function logout() {
    // 添加确认对话框，防止误操作
    if (confirm('确定要退出登录吗？')) {
        try {
            const res = await fetch('/api/auth/logout', {
                method: 'POST'
            });
            
            const data = await res.json();
            if (data.success) {
                // 清除本地存储
                localStorage.removeItem('flavordash_user');
                currentUser = null;
                
                // 重定向到登录页面
                window.location.href = '/user/login.html?error=' + encodeURIComponent('已成功退出登录');
            }
        } catch (err) {
            console.error('退出登录失败:', err);
            alert('退出登录失败，请稍后重试');
        }
    }
}

// 更新个人资料
async function updateProfile() {
    if (!currentUser) {
        alert('请先登录');
        return;
    }
    
    const nickname = document.getElementById('profileNicknameInput').value;
    const phone = document.getElementById('profilePhone').value;
    
    try {
        const res = await fetch('/api/auth/user', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nickname, phone })
        });
        
        const data = await res.json();
        
        if (data.success) {
            currentUser = data.user;
            updateUserUI();
            alert('✅ 个人信息更新成功');
        } else {
            alert('更新失败：' + data.message);
        }
    } catch (err) {
        alert('更新失败，请稍后重试');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchFoods();
    loadOrders();
    fetchCurrentUser();
    
    // 绑定搜索事件
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        // 简单的前端搜索过滤
        const filtered = foods.filter(f => f.name.toLowerCase().includes(keyword));
        renderFilteredMenu(filtered);
    });
    
    // 初始化拖拽购物车
    initDraggableCart();
});

// 1. 获取菜单
async function fetchFoods() {
    const res = await fetch('/api/foods');
    foods = await res.json();
    renderMenu();
}

// 修改：过滤菜单渲染函数
function renderFilteredMenu(list) {
    const grid = document.getElementById('food-list');
    grid.innerHTML = '';
    
    if(list.length === 0) {
        grid.innerHTML = '<p style="color:#999; grid-column:1/-1; text-align:center;">没有找到相关美食</p>';
        return;
    }
    
    list.forEach(food => {
        const div = document.createElement('div');
        div.className = 'food-card';
        div.innerHTML = `
            <img src="${food.image_url}" alt="${food.name}" class="food-img" onerror="this.src='https://placehold.co/600x400?text=No+Image'">
            <div class="food-info" style="transform: translateZ(30px); padding: 15px;">
                <span class="food-cat">${food.category}</span>
                <h3 class="food-name" style="margin: 10px 0;">${food.name}</h3>
                <p class="food-desc" style="color: #666;">${food.description || '暂无描述'}</p>
                <div class="food-bottom" style="display:flex; justify-content:space-between; align-items:center; margin-top:15px;">
                    <span class="food-price" style="font-size:20px; font-weight:bold; color:var(--primary);">¥${food.price}</span>
                    <button class="add-btn" onclick="addToCart(${food.id})"><i class="ri-add-line"></i></button>
                </div>
            </div>
        `;
        
        // ===== 新增：绑定 3D 视差与探照灯交互 =====
        div.addEventListener('mousemove', e => {
            const rect = div.getBoundingClientRect();
            // 1. 探照灯坐标计算 (传给 CSS 变量)
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            div.style.setProperty("--mouse-x", `${x}px`);
            div.style.setProperty("--mouse-y", `${y}px`);

            // 2. 3D 倾斜计算
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            // 系数 15 控制倾斜幅度，数值越大倾斜越小
            const rotateX = ((y - centerY) / centerY) * -15; 
            const rotateY = ((x - centerX) / centerX) * 15;
            
            div.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        // 鼠标离开恢复原状
        div.addEventListener('mouseleave', () => {
            div.style.transform = `rotateX(0deg) rotateY(0deg)`;
            div.style.transition = 'transform 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)';
        });
        
        // 鼠标进入取消过渡，让跟随零延迟
        div.addEventListener('mouseenter', () => {
            div.style.transition = 'none';
        });

        grid.appendChild(div);
    });
}

// 新增：分类筛选逻辑
function filterMenu(category, btn) {
    currentCategory = category;
    
    // 1. 切换按钮样式
    document.querySelectorAll('.cat-pill').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    
    // 2. 筛选数据
    if (category === 'all') {
        renderFilteredMenu(foods);
    } else {
        const filtered = foods.filter(f => f.category === category);
        renderFilteredMenu(filtered);
    }
}

// 修改原有的 renderMenu
function renderMenu() {
    renderFilteredMenu(foods);
}

// 2. 购物车逻辑
function addToCart(id) {
    const food = foods.find(f => f.id === id);
    const existing = cart.find(item => item.id === id);
    
    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...food, quantity: 1 });
    }
    updateCartUI();
}

function changeQty(id, change) {
    const item = cart.find(i => i.id === id);
    item.quantity += change;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    updateCartUI();
}

function clearCart() {
    cart = [];
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items-container');
    const totalEl = document.getElementById('cart-total');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="empty-cart-tip">
                <i class="ri-shopping-basket-2-line" style="font-size:40px; color:#ddd"></i>
                <p>购物车空空如也</p>
            </div>`;
        totalEl.innerText = '0.00';
        return;
    }

    container.innerHTML = '';
    let total = 0;

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <span>¥${item.price}</span>
            </div>
            <div class="cart-qty-ctrl">
                <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
                <span style="font-size:13px; font-weight:bold; min-width:20px; text-align:center;">${item.quantity}</span>
                <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
            </div>
        `;
        container.appendChild(div);
    });

    totalEl.innerText = total.toFixed(2);
}

// 修改 submitOrder，不再直接提交，而是打开弹窗
function submitOrder() {
    if (cart.length === 0) return alert('请先选择菜品');
    
    // 打开模态框
    const modal = document.getElementById('checkoutModal');
    modal.style.display = 'flex';
    
    // 更新模态框数据
    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalPrice = document.getElementById('cart-total').innerText;
    
    document.getElementById('modal-count').innerText = totalCount;
    document.getElementById('modal-total-price').innerText = totalPrice;
}

function closeCheckout() {
    document.getElementById('checkoutModal').style.display = 'none';
}

// 全局变量，用于临时存储待提交的订单数据
let pendingOrderData = null; 

// 1. 修改 confirmPayment：只做验证和弹窗，不提交
function confirmPayment() {
    const address = document.getElementById('delivery-address').value;
    if(!address) return alert('请填写配送地址');
    
    const total = document.getElementById('cart-total').innerText;
    
    // 把数据存到全局变量，等下扫码完了用
    pendingOrderData = {
        items: cart.map(i => ({ id: i.id, quantity: i.quantity, price: i.price })),
        total: total,
        address: address
    };

    // 关闭地址弹窗
    document.getElementById('checkoutModal').style.display = 'none';
    
    // 打开二维码弹窗
    showQrCode(total);
}

// 显示二维码弹窗
function showQrCode(total) {
    document.getElementById('qr-total-amount').innerText = '¥' + total;
    document.getElementById('qrModal').style.display = 'flex';
}

function closeQr() {
    document.getElementById('qrModal').style.display = 'none';
}

// 2. 新增 finishOrder：真正的提交逻辑
async function finishOrder() {
    if(!pendingOrderData) return;

    // 显示加载状态
    const btn = document.querySelector('.btn-paid');
    const originalText = btn.innerHTML;
    btn.innerHTML = '正在确认支付结果...';
    btn.disabled = true;

    // 模拟网络延迟，让用户感觉系统在查账
    setTimeout(async () => {
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pendingOrderData)
            });

            if (res.ok) {
                closeQr(); // 关闭二维码
                alert('🎉 支付成功！商家已接单，正在为您准备美食。');
                clearCart();
                loadOrders();
                switchTab('orders');
                
                // 清空数据
                pendingOrderData = null;
                document.getElementById('delivery-address').value = ''; // 清空地址框
            }
        } catch (err) {
            alert('系统繁忙，请联系客服');
        } finally {
            // 恢复按钮（虽然弹窗关了，但为了代码健壮性）
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }, 1500); // 延迟 1.5秒
}

// 修改 loadOrders 显示地址
async function loadOrders() {
    const res = await fetch('/api/orders');
    const orders = await res.json();
    const container = document.getElementById('order-history');
    container.innerHTML = '';

    orders.forEach(o => {
        // 增加地址显示
        const addressText = o.address || '门店自提';
        
        const div = document.createElement('div');
        div.className = 'order-card';
        div.innerHTML = `
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <strong>订单 #${o.id}</strong>
                <span style="color:#28a745; font-weight:bold; font-size:12px; background:#e8f5e9; padding:2px 8px; border-radius:4px;">${o.status.toUpperCase()}</span>
            </div>
            <p style="color:#666; font-size:14px; margin-bottom:5px;">${o.details}</p>
            <div style="font-size:12px; color:#555; background:#f8f9fa; padding:8px; border-radius:6px; margin-bottom:10px;">
                <i class="ri-map-pin-line"></i> 配送至：${addressText}
            </div>
            <div style="margin-top:10px; padding-top:10px; border-top:1px solid #eee; display:flex; justify-content:space-between;">
                <span style="font-size:12px; color:#999;">${new Date(o.created_at).toLocaleString()}</span>
                <span style="font-weight:bold; font-size:16px;">¥${o.total_amount}</span>
            </div>
        `;
        container.appendChild(div);
    });
}

// 工具：Tab切换
function switchTab(tabId) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${tabId}`).style.display = 'block';
    
    // 简单匹配按钮高亮
    const btnMap = { 'menu':0, 'orders':1, 'profile':2 };
    document.querySelectorAll('.nav-item')[btnMap[tabId]].classList.add('active');
}

// ================= 悬浮窗拖拽逻辑 (新增) =================

function initDraggableCart() {
    const cartPanel = document.getElementById('draggable-cart');
    const header = document.getElementById('cart-header');
    
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.addEventListener('mousedown', (e) => {
        if (e.target.classList.contains('clear-cart')) return;
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        
        const rect = cartPanel.getBoundingClientRect();
        initialLeft = rect.left;
        initialTop = rect.top;
        
        cartPanel.style.right = 'auto';
        cartPanel.style.left = `${initialLeft}px`;
        cartPanel.style.top = `${initialTop}px`;
        
        header.style.cursor = 'grabbing';
        
        // 新增：添加拖拽态 CSS 类，触发倾斜阴影效果
        cartPanel.classList.add('dragging');
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        e.preventDefault(); 
        
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        
        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;
        
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        const panelRect = cartPanel.getBoundingClientRect();
        
        if (newLeft < 0) newLeft = 0;
        if (newLeft + panelRect.width > windowWidth) newLeft = windowWidth - panelRect.width;
        if (newTop < 0) newTop = 0;
        if (newTop + panelRect.height > windowHeight) newTop = windowHeight - panelRect.height;
        
        cartPanel.style.left = `${newLeft}px`;
        cartPanel.style.top = `${newTop}px`;
    });

    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            header.style.cursor = 'grab';
            // 新增：移除拖拽态，触发果冻回弹效果
            cartPanel.classList.remove('dragging');
        }
    });
}

// ================= DS 客服逻辑 =================

function toggleChat() {
    const win = document.getElementById('ds-window');
    win.classList.toggle('open');
    if(win.classList.contains('open')) {
        document.getElementById('ds-input').focus();
    }
}

async function sendDsMessage() {
    const input = document.getElementById('ds-input');
    const msg = input.value.trim();
    if(!msg) return;

    // 添加用户消息
    addDsBubble('user', msg);
    input.value = '';

    // loading
    const loadingId = addDsBubble('bot', '<i class="ri-loader-4-line ri-spin"></i> 正在输入...');

    try {
        const res = await fetch('/api/chat/food', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: msg })
        });
        const data = await res.json();
        
        // 移除loading，显示回复
        document.getElementById(loadingId).remove();
        addDsBubble('bot', data.content);
        
    } catch (e) {
        document.getElementById(loadingId).remove();
        addDsBubble('bot', '网络有点卡，请重试~');
    }
}

function addDsBubble(role, html) {
    const container = document.getElementById('ds-messages');
    const div = document.createElement('div');
    const id = 'ds-' + Date.now();
    div.id = id;
    div.className = `ds-msg ${role}`;
    div.innerHTML = `<p>${html}</p>`;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

// 回车发送
document.getElementById('ds-input')?.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') sendDsMessage();
});
