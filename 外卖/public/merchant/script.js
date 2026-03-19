document.addEventListener('DOMContentLoaded', () => {
    switchTab('dashboard');
    loadDashboardData();
});

function switchTab(tabName) {
    document.querySelectorAll('.view-section').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    
    const target = document.getElementById(`view-${tabName}`);
    if (target) {
        target.style.display = 'block';
        const navIndex = ['dashboard', 'foods', 'categories', 'orders'].indexOf(tabName);
        document.querySelectorAll('.nav-item')[navIndex].classList.add('active');

        if(tabName === 'dashboard') loadDashboardData();
        if(tabName === 'foods') loadFoods();
        if(tabName === 'categories') loadCategories();
        if(tabName === 'orders') loadOrders();
    }
}

async function loadDashboardData() {
    try {
        // 加载菜品数量
        const foodsRes = await fetch('/api/foods');
        const foods = await foodsRes.json();
        document.getElementById('stat-foods').innerText = foods.length;
        
        // 加载订单数据
        const ordersRes = await fetch('/api/orders');
        const orders = await ordersRes.json();
        
        // 计算今日订单
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayOrders = orders.filter(order => {
            const orderDate = new Date(order.created_at);
            return orderDate >= today;
        });
        document.getElementById('stat-orders-today').innerText = todayOrders.length;
        
        // 计算今日营收
        const todayRevenue = todayOrders.reduce((total, order) => total + parseFloat(order.total_amount), 0);
        document.getElementById('stat-revenue-today').innerText = `¥${todayRevenue.toFixed(2)}`;
        
        // 加载用户数量（模拟数据）
        document.getElementById('stat-users').innerText = '128';
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
    }
}

async function loadFoods() {
    try {
        const res = await fetch('/api/foods');
        const foods = await res.json();
        const foodList = document.getElementById('food-list');
        foodList.innerHTML = '';
        
        foods.forEach(food => {
            const foodItem = document.createElement('div');
            foodItem.className = 'food-item';
            foodItem.innerHTML = `
                <img src="${food.image_url || 'https://placehold.co/300x200?text=No+Image'}" alt="${food.name}" class="food-item-img">
                <h4>${food.name}</h4>
                <p>${food.category || '未分类'}</p>
                <p>${food.description || '无描述'}</p>
                <p class="price">¥${food.price.toFixed(2)}</p>
                <div class="actions">
                    <button onclick="editFood(${food.id})">编辑</button>
                    <button class="delete" onclick="deleteFood(${food.id})">删除</button>
                </div>
            `;
            foodList.appendChild(foodItem);
        });
    } catch (error) {
        console.error('加载菜品失败:', error);
    }
}

async function loadOrders() {
    try {
        const res = await fetch('/api/orders');
        const orders = await res.json();
        const orderList = document.getElementById('order-list');
        orderList.innerHTML = '';
        
        orders.forEach(order => {
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.innerHTML = `
                <div class="order-header">
                    <span class="order-id">订单 #${order.id}</span>
                    <span class="order-time">${new Date(order.created_at).toLocaleString()}</span>
                </div>
                <div class="order-details">
                    <p>商品: ${order.details}</p>
                    <p>地址: ${order.address || '门店自提'}</p>
                </div>
                <div class="order-footer">
                    <span class="order-total">¥${order.total_amount.toFixed(2)}</span>
                    <div class="order-status-section">
                        <span class="order-status ${order.status || 'pending'}">${order.status === 'completed' ? '已完成' : '待处理'}</span>
                        <button class="status-btn" onclick="updateOrderStatus(${order.id}, '${order.status || 'pending'}')">
                            ${order.status === 'completed' ? '标记为待处理' : '标记为已完成'}
                        </button>
                    </div>
                </div>
            `;
            orderList.appendChild(orderItem);
        });
    } catch (error) {
        console.error('加载订单失败:', error);
    }
}

async function updateOrderStatus(orderId, currentStatus) {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
    
    // 简单的订单状态更新逻辑，实际项目中应该在后端实现
    alert(`订单 #${orderId} 状态已更新为 ${newStatus === 'completed' ? '已完成' : '待处理'}`);
    loadOrders();
}

async function addFood(event) {
    event.preventDefault();
    
    const data = {
        name: document.getElementById('f_name').value,
        price: parseFloat(document.getElementById('f_price').value),
        category: document.getElementById('f_cat').value,
        description: document.getElementById('f_desc').value,
        image_url: document.getElementById('f_img').value
    };
    
    try {
        const res = await fetch('/api/foods', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (res.ok) {
            alert('菜品添加成功！');
            event.target.reset();
            loadFoods();
        }
    } catch (err) {
        alert('操作失败');
    }
}

async function deleteFood(id) {
    if(!confirm('确定要删除这道菜品吗？')) return;
    
    try {
        const res = await fetch(`/api/foods/${id}`, { method: 'DELETE' });
        if (res.ok) {
            loadFoods();
        }
    } catch (error) {
        alert('删除失败');
    }
}

async function editFood(id) {
    // 这里可以实现编辑功能
    alert('编辑功能开发中...');
}

async function loadCategories() {
    try {
        // 从菜品数据中提取分类
        const res = await fetch('/api/foods');
        const foods = await res.json();
        
        // 提取所有分类
        const categoriesSet = new Set();
        foods.forEach(food => {
            if (food.category) {
                categoriesSet.add(food.category);
            }
        });
        
        const categories = Array.from(categoriesSet);
        const categoryList = document.getElementById('category-list');
        categoryList.innerHTML = '';
        
        categories.forEach(category => {
            const categoryItem = document.createElement('div');
            categoryItem.className = 'category-item';
            categoryItem.innerHTML = `
                <span>${category}</span>
                <button class="delete" onclick="deleteCategory('${category}')">删除</button>
            `;
            categoryList.appendChild(categoryItem);
        });
    } catch (error) {
        console.error('加载分类失败:', error);
    }
}

async function addCategory(event) {
    event.preventDefault();
    const categoryName = document.getElementById('category-name').value;
    
    // 简单的分类添加逻辑，实际项目中应该在后端实现
    alert(`分类 "${categoryName}" 添加成功！`);
    event.target.reset();
    loadCategories();
}

async function deleteCategory(category) {
    if(!confirm(`确定要删除分类 "${category}" 吗？`)) return;
    
    // 简单的分类删除逻辑，实际项目中应该在后端实现
    alert(`分类 "${category}" 删除成功！`);
    loadCategories();
}

function logout() {
    window.location.href = '/merchant/login.html';
}