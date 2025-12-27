// scripts/common.js

// 1. 弹窗提示
function showNotification(message) {
    console.log(`[通知] ${message}`);
    alert(message);
}

// 2. 页面切换逻辑
function switchPage(pageId) {
    // A. 处理内容区域显隐
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.add('hidden');
    });

    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        // 简单入场动画
        targetPage.style.opacity = '0';
        setTimeout(() => {
            targetPage.style.transition = 'opacity 0.3s ease';
            targetPage.style.opacity = '1';
        }, 50);

        if (pageId === 'favorites') {
            updateFavoritesUI();
        } else if (pageId === 'orders') {
            renderOrdersUI();
        }
    }

    // B. 处理侧边栏高亮
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('sidebar-item-active');
        } else {
            item.classList.remove('sidebar-item-active');
        }
    });

    // C. 移动端：切换后自动收起侧边栏
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
    }

    // D. 滚动到顶部
    window.scrollTo(0, 0);
}

// 3. 搜索逻辑
function searchBooks(keywordInput = null) {
    // 切换到搜索页
    switchPage('search');

    const inputEl = document.getElementById('search-input');
    const priceFilter = document.getElementById('price-filter');
    const langFilter = document.getElementById('language-filter');
    const sortFilter = document.getElementById('sort-filter');
    const keywordEl = document.getElementById('search-keyword');

    // 如果是从外部（如热门标签）传入的关键词，则同步给输入框
    if (keywordInput !== null) {
        inputEl.value = keywordInput;
    }

    const keyword = inputEl.value.trim().toLowerCase();
    const priceRange = priceFilter.value; // all, 0-20, 20-50, 50+
    const language = langFilter.value;   // all, English, Chinese...
    const sortBy = sortFilter.value;     // default, popular, price-asc, price-desc

    // 更新结果标题处的关键词显示
    if (keywordEl) keywordEl.textContent = keyword ? `("${keyword}")` : '(Please enter keywords)';

    if (typeof mockBooks === 'undefined') return;

    // 1. 执行叠加筛选
    let results = mockBooks.filter(book => {
        // 关键词过滤 (标题/作者/类别)
        const matchesKeyword = !keyword ||
            book.title.toLowerCase().includes(keyword) ||
            book.author.toLowerCase().includes(keyword) ||
            book.category.toLowerCase().includes(keyword);

        // 任务 4：价格区间过滤
        let matchesPrice = true;
        if (priceRange === '0-20') matchesPrice = book.price <= 20;
        else if (priceRange === '20-40') matchesPrice = book.price > 20 && book.price <= 40;
        else if (priceRange === '50+') matchesPrice = book.price >= 50;

        // 任务 4：语言过滤
        let matchesLang = true;
        if (language !== 'all') matchesLang = book.language === language;

        return matchesKeyword && matchesPrice && matchesLang;
    });

    // 2. 任务 5：执行排序逻辑
    if (sortBy === 'popular') {
        results.sort((a, b) => (b.favCount || 0) - (a.favCount || 0));
    } else if (sortBy === 'price-asc') {
        results.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
        results.sort((a, b) => b.price - a.price);
    }
    // 'default' 则保持原始 mockBooks 顺序 (results 本身就是按原始索引过滤出来的)

    // 3. 渲染结果
    renderSearchResults(results);
}

// 4. 渲染搜索结果
function renderSearchResults(books) {
    const resultsContainer = document.getElementById('search-results');
    const noResults = document.getElementById('no-results');

    if (!resultsContainer) return;

    if (books.length === 0) {
        resultsContainer.innerHTML = '';
        noResults.classList.remove('hidden');
        return;
    }

    noResults.classList.add('hidden');

    if (typeof bookCardTemplate === 'function') {
        resultsContainer.innerHTML = books.map(bookCardTemplate).join('');
    } else {
        resultsContainer.innerHTML = books.map(book => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden p-4 book-card-item" data-id="${book.id}">
          <h3 class="font-bold text-brown-dark">${book.title}</h3>
          <p class="text-sm text-gray-600">${book.author}</p>
          <div class="flex justify-between items-center mt-3">
            <span class="font-bold text-brown">¥${book.price.toFixed(2)}</span>
            <button class="addCartBtn bg-brown text-white px-3 py-1 rounded" data-id="${book.id}">Add</button>
          </div>
        </div>
      `).join('');
    }

    if (typeof bindCartAndFavoriteEvents === 'function') bindCartAndFavoriteEvents();
    if (typeof bindBookCardClickEvents === 'function') bindBookCardClickEvents();
}

/**
 * 全局鉴权检查逻辑
 * @param {Array} allowedRoles 允许访问该页面的角色列表
 */
// 在 common.js 的 checkAuth 函数中修改内容
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
 * 登出逻辑
 */
function logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
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
 * 通用组件：渲染分页控制按钮
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