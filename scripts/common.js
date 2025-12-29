// scripts/common.js

// 1. 弹窗提示 (统一使用更美观的样式，废弃原生 alert)
function showNotification(message) {
    if (typeof showAlert === 'function') {
        showAlert(message);
    } else {
        console.log(`[通知] ${message}`);
        alert(message);
    }
}

window.showAlert = function(message, type = 'info') {
    // 1. 尝试获取现有的弹窗元素，如果没有则创建
    let alertElement = document.getElementById('customAlert');
    if (!alertElement) {
        alertElement = document.createElement('div');
        alertElement.id = 'customAlert';
        // 初始状态为 opacity-0 (不可见)
        alertElement.className = 'fixed top-20 left-1/2 -translate-x-1/2 text-white px-6 py-3 rounded-lg shadow-lg z-[100] transition-all duration-300 pointer-events-none opacity-0';
        alertElement.innerHTML = '<span id="alertText"></span>';
        document.body.appendChild(alertElement);
    }

    const alertText = document.getElementById('alertText');
    alertText.innerText = message;

    // 2. 根据 type 动态调整背景颜色 (可选，增加视觉反馈)
    const typeColors = {
        'info': 'bg-brown-dark',   // 你原本定义的棕色
        'success': 'bg-green-600',
        'error': 'bg-red-600',
        'warning': 'bg-orange-500'
    };
    
    // 清除之前的背景类，添加当前的背景类
    alertElement.className = alertElement.className.replace(/bg-\S+/g, '');
    alertElement.classList.add(typeColors[type] || 'bg-gray-800');

    // 3. 显示弹窗 (修改透明度和位置)
    alertElement.classList.remove('opacity-0', 'pointer-events-none');
    alertElement.classList.add('opacity-100');
    console.log(`[Alert] ${type}: ${message}`);

    // 4. 设定 3 秒后自动消失
    // 清除之前的定时器，防止快速连续点击导致显示异常
    if (window.alertTimer) clearTimeout(window.alertTimer);
    
    window.alertTimer = setTimeout(() => {
        alertElement.classList.remove('opacity-100');
        alertElement.classList.add('opacity-0', 'pointer-events-none');
    }, 3000);
};

/**
 * 全局鉴权检查逻辑，检查用户是否登录以及是否有权限
 * @param {Array} allowedRoles 允许访问该页面的角色列表
 */
function checkAuth(allowedRoles = []) {
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');

    // 如果没有 Token 或 角色不匹配
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        alert("Access Denied: You do not have permission for this area.");
        // 根据实际角色遣返
        const fallback = {
            'customer': 'customer.html',
            'staff': 'staff.html',
            'manager': 'manager.html',
            'finance': 'finance.html'
        };
        window.location.href = fallback[userRole] || 'login.html';
    }
}

/**
 * 标准化登出逻辑
 * 路径：用户点击 [Logout按钮] -> 触发 [logout()] -> 清除缓存 -> 跳转登录页
 */
function logout() {
    console.log("[Auth] Logging out...");
    
    // 1. 清除所有认证相关的本地存储
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_user');
    
    // 2. 清除会话存储（页面状态记忆）
    sessionStorage.removeItem('currentPage');
    
    // 3. (可选) 清除可能存在的购物车缓存，如果你希望登出后清空购物车
    // localStorage.removeItem('bookCart'); 

    // 4. 跳转回纯净的登录页，不带任何参数
    // 这样 login.html 就会显示“Identity Yourself”选择界面，而不是直接进入输入密码界面
    window.location.href = 'login.html';
}

/**
 * 核心逻辑：数据切片工具
 */
function getPaginatedData(data, currentPage, pageSize = 10) {
    const startIndex = (currentPage - 1) * pageSize;
    return data.slice(startIndex, startIndex + pageSize);
}

/**
 * 通用组件：生成分页按钮（上一页、1、2、3、下一页）的 HTML
 * @param {string} containerId 分页按钮所在的父容器 ID
 * @param {number} totalItems 总数据量
 * @param {number} currentPage 当前页码
 * @param {Function} onPageChange 点击页码时的回调函数 (page) => { ... }
 * @param {number} pageSize 每页条数
 */
function renderPaginationControls(containerId, totalItems, currentPage, onPageChange, pageSize = 10) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    let buttonsHtml = '';

    // A. 统计信息 (左侧)
    const start = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalItems);
    const infoHtml = `<p class="text-sm text-gray-500">Showing ${start} to ${end} of <span class="font-bold">${totalItems}</span> records</p>`;

    // B. 数字按钮 (右侧)
    // 上一页
    buttonsHtml += `
        <button class="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50" 
                ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">
            <i class="fa fa-chevron-left text-xs"></i>
        </button>`;

    // 页码数字 (这里只做简单的 1, 2, 3...)
    for (let i = 1; i <= totalPages; i++) {
        const isActive = i === currentPage;
        buttonsHtml += `
            <button class="w-8 h-8 flex items-center justify-center rounded border ${isActive ? 'border-primary bg-primary text-white' : 'border-gray-300 hover:bg-gray-50'}" 
                    data-page="${i}">${i}</button>`;
    }

    // 下一页
    buttonsHtml += `
        <button class="w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50" 
                ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">
            <i class="fa fa-chevron-right text-xs"></i>
        </button>`;

    container.innerHTML = `
        <div class="flex justify-between items-center mt-5">
            ${infoHtml}
            <div class="flex gap-1 pagination-buttons-wrapper">${buttonsHtml}</div>
        </div>
    `;

    // 绑定点击事件 (利用冒泡)
    container.querySelector('.pagination-buttons-wrapper').onclick = (e) => {
        const btn = e.target.closest('button');
        if (btn && !btn.disabled) {
            onPageChange(parseInt(btn.dataset.page));
        }
    };
}