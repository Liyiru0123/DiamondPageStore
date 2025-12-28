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
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('current_user');
    sessionStorage.removeItem('currentPage');
    
    // 按照指令跳转至特定参数页面
    window.location.href = 'login.html?role=customer&stage=2';
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