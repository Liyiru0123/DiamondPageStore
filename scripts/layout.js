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
    
    // === 财务端菜单 (更新：只保留 income-stats 和 invoice) ===
    finance: [
        { id: 'income-stats', icon: 'fa-pie-chart', text: 'Financial Overview', type: 'admin' },
        { id: 'invoice', icon: 'fa-file-text', text: 'Invoice Management', type: 'admin' }
    ],

    // === 店长/经理 (Manager) - 更新为 manager.html 中的菜单 ===
    manager: [
        { id: 'overview', icon: 'fa-tachometer', text: 'Overview', type: 'admin' },
        { id: 'inventory', icon: 'fa-cubes', text: 'Inventory Management', type: 'admin' },
        { id: 'staff', icon: 'fa-users', text: 'Staff Management', type: 'admin' },
        { id: 'pricing', icon: 'fa-tags', text: 'Sales Management', type: 'admin' },
        { id: 'user-management', icon: 'fa-user', text: 'User Management', type: 'admin' },
        { id: 'notifications', icon: 'fa-bullhorn', text: 'Notifications', type: 'admin' }
    ],

    // === 普通店员 (Clerk/Staff) - 主要是销售和库存 ===
    clerk: [
        { id: 'pos', icon: 'fa-shopping-basket', text: 'POS Terminal', type: 'admin' },
        { id: 'books', icon: 'fa-book', text: 'Book Search', type: 'admin' },
        { id: 'orders', icon: 'fa-list-alt', text: 'Order Pickup', type: 'admin' }
    ]
};

/**
 * 3. 页面切换辅助函数
 */
window.switchPage = function(pageId) {
    console.log('Layout switchPage called:', pageId);
    
    // 保存当前页面到sessionStorage，以便刷新后保持
    sessionStorage.setItem('currentPage', pageId);
    
    // 更新菜单激活状态
    updateActiveMenu(pageId);
    
    // 检查是否有角色特定的页面切换函数
    if (typeof window.financeSwitchPage === 'function') {
        window.financeSwitchPage(pageId);
    } else if (typeof window.managerSwitchPage === 'function') {
        window.managerSwitchPage(pageId);
    } else {
        // 如果没有特定函数，则使用通用页面切换
        handlePageSwitch(pageId);
    }
};

/**
 * 4. 更新菜单激活状态 - 修复高亮问题
 */
function updateActiveMenu(activePageId) {
    console.log('Updating active menu for:', activePageId);
    
    // 更新sidebar链接激活状态
    document.querySelectorAll('[data-page]').forEach(link => {
        const page = link.getAttribute('data-page');
        // 移除所有active相关类
        link.classList.remove('active', 'bg-accent/30', 'text-primary', 'font-medium');
        
        // 添加前台系统的active类
        link.classList.remove('bg-brown-dark', 'border-l-4', 'border-white');
        
        // 如果是当前页面，添加active类
        if (page === activePageId) {
            link.classList.add('active');
            
            // 根据系统类型添加不同的active样式
            if (link.closest('#sidebar')?.classList.contains('bg-gradient-to-b')) {
                // 前台系统样式
                link.classList.add('bg-brown-dark', 'border-l-4', 'border-white');
            } else {
                // 后台系统样式
                link.classList.add('bg-accent/30', 'text-primary', 'font-medium');
            }
        }
    });
}

/**
 * 5. 直接处理页面切换（当没有特定switchPage函数时）
 */
function handlePageSwitch(pageId) {
    console.log('Handling page switch directly:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error(`Page not found: ${pageId}-page`);
        return;
    }
}

/**
 * 6. 渲染逻辑：前台 (Customer)
 */
function renderStoreSidebar(role, activePage) {
    const container = document.getElementById('layout-sidebar');
    if (!container) return;
    const items = MENU_CONFIG[role] || [];
    
    const menuHtml = items.map(item => {
        if (item.type === 'separator') return '<div class="my-3 border-t border-brown-light/20"></div>';
        
        const activeClass = (item.id === activePage) ? 'bg-brown-dark border-l-4 border-white' : '';
        const hoverClass = item.type === 'personal' ? 'hover:bg-brown-dark/90' : 'hover:bg-brown-dark/70';
        const badgeHtml = item.badgeId ? `<span id="${item.badgeId}" class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">0</span>` : '';

        return `
            <div class="flex items-center gap-3 px-4 py-3 text-white transition-all duration-200 cursor-pointer ${hoverClass} ${activeClass} relative" data-page="${item.id}">
                <i class="fa ${item.icon} text-xl w-6 text-center"></i>
                <span class="sidebar-text">${item.text}</span>
                ${badgeHtml}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <aside id="sidebar" class="bg-gradient-to-b from-brown-dark to-brown min-h-screen flex-shrink-0 shadow-lg transform -translate-x-full md:translate-x-0 fixed md:static top-0 left-0 z-40 transition-all duration-300 w-64 h-full">
            <div class="p-4 border-b border-brown-light/30 flex items-center justify-between">
                <h2 class="text-white text-lg font-bold font-serif">Diamond Store</h2>
                <button class="text-white hover:text-brown-cream md:hidden" onclick="document.getElementById('sidebar').classList.add('-translate-x-full')">
                    <i class="fa fa-angle-double-left"></i>
                </button>
            </div>
            <nav class="mt-4">${menuHtml}</nav>
        </aside>
    `;
    
    // 添加点击事件监听器
    addSidebarClickListeners();
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
                    <div class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brown-light/20 transition-colors cursor-pointer text-brown-dark relative" onclick="switchPage('cart')">
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
 * 7. 渲染逻辑：后台 (Admin - Finance/Manager/Clerk)
 */
function renderAdminSidebar(role, activePage) {
    const container = document.getElementById('layout-sidebar');
    if (!container) return;
    const items = MENU_CONFIG[role] || [];

    // 样式常量 (与finance.html保持一致)
    const baseLinkStyle = "sidebar-link flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg transition-all duration-300 hover:bg-accent/20 hover:text-primary cursor-pointer mb-1";
    const activeLinkStyle = "active bg-accent/30 text-primary font-medium";

    const menuHtml = items.map(item => {
        const isActive = item.id === activePage;
        return `
            <div class="${baseLinkStyle} ${isActive ? activeLinkStyle : ''}" data-page="${item.id}">
                <i class="fa ${item.icon} w-5 text-center"></i>
                <span>${item.text}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <aside id="sidebar" class="w-64 bg-white border-r border-gray-200 flex-shrink-0 hidden lg:block transition-all duration-300 ease-in-out overflow-y-auto h-full">
            <nav class="p-4 space-y-1">
                <p class="text-xs font-medium text-gray-500 uppercase tracking-wider px-4 py-2">Main Menu</p>
                ${menuHtml}
            </nav>
            <div class="p-4 border-t border-gray-200">
                <div class="${baseLinkStyle} text-red-600 hover:text-red-700 hover:bg-red-50" id="logout-btn">
                    <i class="fa fa-sign-out w-5 text-center"></i>
                    <span>Logout</span>
                </div>
            </div>
        </aside>
    `;
    
    // 添加点击事件监听器
    addSidebarClickListeners();
}

/**
 * 7.1 添加侧边栏点击事件监听器
 */
function addSidebarClickListeners() {
    // 使用事件委托处理侧边栏点击
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                const pageId = link.getAttribute('data-page');
                console.log('Sidebar link clicked:', pageId);
                window.switchPage(pageId);
            }
            
            // 处理登出按钮
            if (e.target.closest('#logout-btn')) {
                e.preventDefault();
                if (confirm('Are you sure you want to log out?')) {
                    sessionStorage.clear();
                    window.location.href = 'login.html';
                }
            }
        });
    }
}

function renderAdminHeader(role) {
    const container = document.getElementById('layout-header');
    if (!container) return;
    
    // 角色名称映射
    const roleTitles = {
        finance: 'Finance Staff',
        manager: 'Store Manager',
        clerk: 'Sales Clerk'
    };
    const displayRole = roleTitles[role] || 'Staff';

    container.innerHTML = `
        <header class="bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0">
            <div class="flex items-center justify-between px-4 h-16">
                <!-- Left: Logo & Toggle -->
                <div class="flex items-center gap-3">
                    <button id="sidebar-toggle" class="lg:hidden text-gray-600 hover:text-primary" onclick="toggleSidebar()">
                        <i class="fa fa-bars text-xl"></i>
                    </button>
                    <div class="flex items-center gap-3">
                        <img src="../assets/images/logo.png" alt="Bookstore Logo" class="w-10 h-10 object-contain">
                        <h1 class="text-xl font-serif font-bold text-primary">Diamond Page Store</h1>
                    </div>
                </div>

                <!-- Right: User Info -->
                <div class="flex items-center gap-4">
                    <button class="text-gray-600 hover:text-primary relative">
                        <i class="fa fa-bell text-xl"></i>
                        <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">2</span>
                    </button>

                    <div class="flex items-center gap-2 cursor-pointer group">
                        <img src="https://picsum.photos/id/64/40/40" alt="Avatar" class="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-all">
                        <div class="hidden md:block text-left">
                            <p class="text-sm font-medium">John Accountant</p>
                            <p class="text-xs text-gray-500">${displayRole}</p>
                        </div>
                        <i class="fa fa-chevron-down text-xs text-gray-500 group-hover:text-primary transition-colors"></i>
                    </div>
                </div>
            </div>
        </header>
    `;
}

/**
 * 8. 全局初始化入口
 */
window.initLayout = function(role = 'customer', defaultPage = null) {
    // 获取当前页面，优先使用sessionStorage中的，其次使用传入的defaultPage
    const savedPage = sessionStorage.getItem('currentPage');
    const activePage = savedPage || defaultPage || (role === 'finance' ? 'income-stats' : 'overview');
    
    console.log('Initializing layout with role:', role, 'active page:', activePage);
    
    // 定义后台系统角色
    const backOfficeRoles = ['finance', 'manager', 'clerk'];
    const isBackOffice = backOfficeRoles.includes(role);

    // 设置Body样式
    if (isBackOffice) {
        document.body.classList.remove('bg-brown-cream');
        document.body.classList.add('bg-gray-50', 'text-dark', 'min-h-screen', 'flex', 'flex-col');
        renderAdminHeader(role);
        renderAdminSidebar(role, activePage);
    } else {
        document.body.classList.add('bg-brown-cream');
        renderStoreHeader(role);
        renderStoreSidebar(role, activePage);
    }
    
    // 更新菜单激活状态
    setTimeout(() => {
        updateActiveMenu(activePage);
    }, 100);
    
    // 触发页面切换以显示默认页面
    setTimeout(() => {
        window.switchPage(activePage);
    }, 150);
};

/**
 * 9. 移动端侧边栏切换
 */
window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
        sidebar.classList.toggle('hidden');
        sidebar.classList.toggle('lg:hidden');
    }
};

// 导出函数供外部使用
window.updateActiveMenu = updateActiveMenu;
window.handlePageSwitch = handlePageSwitch;