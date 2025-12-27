// scripts/layout.js

/**
 * 1. Tailwind 配置 (合并了 Customer 和 Finance 的风格)
 */
tailwind.config = {
    theme: {
        extend: {
            colors: {
                // Customer 风格色系
                brown: {
                    dark: '#8B4513',
                    DEFAULT: '#A0522D',
                    light: '#D2B48C',
                    cream: '#F5F5DC'
                },
                // Admin/Finance 风格色系 (源自 finance.html)
                primary: '#8B5A2B',      // Dark brown - Primary
                secondary: '#F5F5DC',    // Beige - Secondary
                accent: '#D2B48C',       // Tan - Accent
                neutral: '#F8F8FF',      // Off-white - Neutral
                dark: '#3E2723',         // Dark brown - Text
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Merriweather', 'Georgia', 'serif'],
            },
        },
    }
};

/**
 * 2. 菜单配置 (数据源)
 */
const MENU_CONFIG = {
    // === 用户端菜单 ===
    customer: [
        { id: 'home', icon: 'fa-home', text: 'Home', type: 'public' },
        { id: 'search', icon: 'fa-search', text: 'Book Search', type: 'public' },
        { id: 'categories', icon: 'fa-th-large', text: 'Book Categories', type: 'public' },
        { id: 'separator', type: 'separator' },
        { id: 'cart', icon: 'fa-shopping-cart', text: 'Shopping Cart', type: 'personal', badgeId: 'cart-count' },
        { id: 'orders', icon: 'fa-list-alt', text: 'My Orders', type: 'personal' },
        { id: 'favorites', icon: 'fa-star', text: 'My Favorites', type: 'personal' },
        { id: 'member', icon: 'fa-user', text: 'Membership Center', type: 'personal' }
    ],

    // === 财务端菜单 (源自 finance.html) ===
    finance: [
        { id: 'overview', icon: 'fa-tachometer', text: 'Overview', type: 'admin' },
        { id: 'income-expense', icon: 'fa-money', text: 'Transaction Details', type: 'admin' },
        { id: 'income-stats', icon: 'fa-pie-chart', text: 'Income Distribution', type: 'admin' },
        { id: 'branch-finance', icon: 'fa-building', text: 'Branch Finance', type: 'admin' },
        { id: 'invoice', icon: 'fa-file-text', text: 'Invoice Management', type: 'admin' }
    ],

    // === 店长/经理 (Manager) - 拥有最高权限 ===
    manager: [
        { id: 'overview', icon: 'fa-tachometer', text: 'Dashboard', type: 'admin' },
        { id: 'books', icon: 'fa-book', text: 'Book Management', type: 'admin' },
        { id: 'staff', icon: 'fa-users', text: 'Staff Management', type: 'admin' },
        { id: 'orders', icon: 'fa-list', text: 'Order Management', type: 'admin' },
        { id: 'finance-report', icon: 'fa-line-chart', text: 'Financial Reports', type: 'admin' }
    ],

    // === 普通店员 (Staff) - 主要是销售和库存 ===
    staff: [
        { id: 'dashboard', icon: 'fa-home', text: 'Dashboard', type: 'admin' },
        { id: 'inventory', icon: 'fa-book', text: 'Inventory Management', type: 'admin' },
        { id: 'orders', icon: 'fa-shopping-cart', text: 'Order Processing', type: 'admin' },
        { id: 'stock-request', icon: 'fa-truck', text: 'Stock Requests', type: 'admin' }
    ],
};

/**
 * 3. 渲染逻辑：前台 (Customer)
 */
function renderStoreSidebar(role, activePage) {
    const container = document.getElementById('layout-sidebar');
    if (!container) return;
    const items = MENU_CONFIG[role] || [];

    const menuHtml = items.map(item => {
        if (item.type === 'separator') return '<div class="my-3 border-t border-brown-light/20"></div>';

        // 初始高亮逻辑
        const activeClass = (item.id === activePage) ? 'sidebar-item-active' : '';
        const badgeHtml = item.badgeId ? `<span id="${item.badgeId}" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>` : '';

        return `
            <div class="sidebar-item sidebar-item-public-hover ${activeClass} relative" 
                 data-page="${item.id}"
                 onclick="switchPage('${item.id}')"> <!-- 添加这一行 -->
                <i class="fa ${item.icon} text-xl w-6 text-center"></i>
                <span class="sidebar-text ml-3">${item.text}</span>
                ${badgeHtml}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <aside id="sidebar" class="bg-gradient-to-b from-brown-dark to-brown min-h-screen flex-shrink-0 shadow-lg transform -translate-x-full md:translate-x-0 fixed md:static top-0 left-0 z-40 transition-all duration-300 w-64 h-full">
            <div class="p-4 border-b border-brown-light/30 flex items-center justify-between">
                <h2 class="text-white text-lg font-bold font-serif">Diamond Store</h2>
                <button class="text-white md:hidden" onclick="document.getElementById('sidebar').classList.add('-translate-x-full')">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            <nav class="mt-4">${menuHtml}</nav>
        </aside>
    `;
}

function renderStoreHeader(role) {
    const container = document.getElementById('layout-header');
    if (!container) return;
    container.innerHTML = `
        <header class="bg-white shadow-md py-3 px-6 sticky top-0 z-30">
            <div class="container mx-auto flex items-center justify-between">
                <div class="flex items-center gap-3 cursor-pointer" onclick="switchPage('home')">
                    <img src="../assets/images/logo.png" alt="LOGO" class="w-10 h-10 object-contain">
                    <h1 class="text-2xl font-bold text-brown-dark font-serif">Diamond Page Store</h1>
                </div>
                <div class="flex items-center gap-2">
                    <div id="cart-quick-entry" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brown-light/20 transition-colors cursor-pointer text-brown-dark relative">
                        <i class="fa fa-shopping-cart text-xl"></i>
                        <span id="cart-quick-count" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">0</span>
                    </div>
                    <div class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brown-light/20 transition-colors cursor-pointer text-brown-dark">
                        <i class="fa fa-user-circle-o text-xl"></i>
                    </div>
                </div>
            </div>
        </header>
    `;
}

/**
 * 4. 渲染逻辑：后台 (Admin - Finance/Manager)
 */
function renderAdminSidebar(role, activePage) {
    const container = document.getElementById('layout-sidebar');
    if (!container) return;
    const items = MENU_CONFIG[role] || [];

    const baseLinkStyle = "sidebar-item flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg transition-all duration-300 hover:bg-accent/20 hover:text-primary cursor-pointer mb-1";
    const activeLinkStyle = "sidebar-item-active bg-accent/30 text-primary font-medium";

    const menuHtml = items.map(item => {
        const isActive = item.id === activePage;
        // 修复点：在 div 标签中添加 onclick="switchPage('${item.id}')"
        return `
            <div class="${baseLinkStyle} ${isActive ? activeLinkStyle : ''}" 
                 data-page="${item.id}" 
                 onclick="switchPage('${item.id}')">
                <i class="fa ${item.icon} w-5 text-center"></i>
                <span>${item.text}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <aside id="sidebar" class="w-full h-full bg-white border-r border-gray-200 flex flex-col justify-between overflow-y-auto overflow-x-hidden">
            <nav class="p-4 space-y-1">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Main Menu</p>
                ${menuHtml}
            </nav>
            <div class="p-4 border-t border-gray-200">
                <a href="#" class="flex items-center gap-3 px-4 py-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all duration-300" id="logout-btn">
                    <i class="fa fa-sign-out w-5 text-center"></i>
                    <span>Logout</span>
                </a>
            </div>
        </aside>
    `;

}

function renderAdminHeader(role) {
    const container = document.getElementById('layout-header');
    if (!container) return;

    const roleTitles = {
        finance: 'Finance Staff',
        manager: 'Store Manager',
        staff: 'Sales Staff'
    };
    const displayRole = roleTitles[role] || 'Staff';

    container.innerHTML = `
        <header class="bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0">
            <div class="flex items-center justify-between px-4 h-16">
                <!-- 左侧区域：Toggle + Logo + Title -->
                <div class="flex items-center gap-3">
                    <button id="sidebar-toggle" class=" text-gray-600 hover:text-primary p-2 rounded-md hover:bg-gray-100 transition-colors" onclick="toggleSidebar()">
                        <i class="fa fa-bars text-xl"></i>
                    </button>
                    <div class="flex items-center gap-3 cursor-pointer" onclick="location.reload()">
                        <img src="../assets/images/logo.png" alt="Bookstore Logo" class="w-10 h-10 object-contain">
                        <h1 class="text-xl font-serif font-bold text-primary">Diamond Page Store</h1>
                    </div>
                </div>

                <!-- 右侧区域：通知 + 用户信息 -->
                <div class="flex items-center gap-4">
                    <button class="text-gray-600 hover:text-primary relative">
                        <i class="fa fa-bell text-xl"></i>
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">2</span>
                    </button>
                    <div class="flex items-center gap-2 cursor-pointer group">
                        <img src="https://picsum.photos/id/64/40/40" alt="Avatar" class="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-all">
                        <div class="hidden md:block text-left">
                            <p class="text-sm font-medium">CurrentUser</p>
                            <p class="text-xs text-gray-500">${displayRole}</p>
                        </div>
                        <i class="fa fa-chevron-down text-xs text-gray-500 group-hover:text-primary transition-colors"></i>
                    </div>
                </div>
            </div>
        </header>
    `;
}

window.initLayout = function (role = 'customer', defaultPage = 'home') {
    const backOfficeRoles = ['finance', 'manager', 'staff'];
    const isBackOffice = backOfficeRoles.includes(role);

    if (isBackOffice) {
        document.body.classList.remove('bg-brown-cream');
        document.body.classList.add('bg-gray-50', 'text-dark');
        renderAdminHeader(role);
        renderAdminSidebar(role, defaultPage);
    } else {
        document.body.classList.add('bg-brown-cream');
        renderStoreHeader(role);
        renderStoreSidebar(role, defaultPage);
    }
};

/**
 * 切换侧边栏状态（全屏可用）
 */
// 在 layout.js 的末尾修改 toggleSidebar 函数
window.toggleSidebar = function () {
    const sidebarContainer = document.getElementById('layout-sidebar');
    const sidebar = document.getElementById('sidebar');
    if (!sidebarContainer || !sidebar) return;

    // 判断当前是否处于收缩状态 (通过检查 w-64 类名)
    const isCollapsed = !sidebarContainer.classList.contains('w-64');

    if (isCollapsed) {
        // 【展开逻辑】
        sidebarContainer.classList.remove('w-0');
        sidebarContainer.classList.add('w-64');
        sidebar.classList.remove('-translate-x-full', 'opacity-0');
    } else {
        // 【收缩逻辑】
        sidebarContainer.classList.remove('w-64');
        sidebarContainer.classList.add('w-0');
        sidebar.classList.add('-translate-x-full', 'opacity-0');
    }
};