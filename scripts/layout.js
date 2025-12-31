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
        { id: 'income-stats', icon: 'fa-pie-chart', text: 'Financial Overview', type: 'admin' },
        { id: 'order', icon: 'fa-shopping-cart', text: 'Order Management', type: 'admin' },
        { id: 'invoice', icon: 'fa-file-text', text: 'Invoice Management', type: 'admin' }
    ],

    // === 店长/经理 (Manager)  ===
    manager: [
        { id: 'overview', icon: 'fa-tachometer', text: 'Dashboard', type: 'admin' },
        { id: 'inventory', icon: 'fa-cubes', text: 'Inventory Management', type: 'admin' },
        { id: 'staff', icon: 'fa-users', text: 'Staff Management', type: 'admin' },
        { id: 'user-management', icon: 'fa-user-md', text: 'User Management', type: 'admin' },
        { id: 'supplier-management', icon: 'fa-truck', text: 'Supplier Management', type: 'admin' },
        { id: 'notifications', icon: 'fa-bell', text: 'Notifications', type: 'admin' }
    ],

    // === 普通店员 (Staff) - 主要是销售和库存 ===
    staff: [
        { id: 'dashboard', icon: 'fa-home', text: 'Dashboard', type: 'admin' },
        { id: 'inventory', icon: 'fa-book', text: 'Inventory Management', type: 'admin' },
        { id: 'orders', icon: 'fa-shopping-cart', text: 'Order Processing', type: 'admin' },
        { id: 'stock-request', icon: 'fa-truck', text: 'Stock Requests', type: 'admin' }
    ],

    guest: [
        { id: 'home', icon: 'fa-home', text: 'Home', type: 'public' },
        { id: 'search', icon: 'fa-search', text: 'Book Search', type: 'public' },
        { id: 'categories', icon: 'fa-th-large', text: 'Book Categories', type: 'public' }
    ]
};

/**
 * [文件名]: scripts/layout.js
 * [修改说明]: 
 * 1. 修复了变量提升导致的 ReferenceError。
 * 2. 增加了页面不存在时的强制回退逻辑，解决首屏空白问题。
 * 3. 优化了入场动画的执行顺序。
 */
window.switchPage = function (pageId) {
    if (!pageId) return;
    console.log(`[Router] Switching to: ${pageId}`);

    // 1. 优先获取目标元素并进行容错处理
    let targetPage = document.getElementById(`${pageId}-page`);

    if (!targetPage) {
        console.warn(`[Router] Page "${pageId}-page" not found, falling back to home.`);
        pageId = 'home';
        targetPage = document.getElementById('home-page');

        // 如果连 home 都没有，说明页面结构有问题，中断执行避免崩溃
        if (!targetPage) {
            console.error('[Router] Critical: Home page not found in DOM.');
            return;
        }
    }

    // 2. 状态持久化 (确保刷新后能停留在当前有效页面)
    sessionStorage.setItem('currentPage', pageId);

    // 3. 统一侧边栏高亮处理 (兼容 Customer 和 Admin 两套样式系统)
    document.querySelectorAll('[data-page]').forEach(el => {
        const isMatch = el.getAttribute('data-page') === pageId;

        // 移除所有高亮类名
        el.classList.remove(
            'sidebar-item-active', 'bg-brown-dark', 'border-l-4', 'border-white', // Customer 风格
            'bg-accent/30', 'text-primary', 'font-medium' // Admin 风格
        );

        if (isMatch) {
            // 根据父容器样式判断应用哪套高亮类
            const sidebarEl = el.closest('#sidebar');
            const isCustomerSidebar = sidebarEl && sidebarEl.classList.contains('bg-gradient-to-b');

            if (isCustomerSidebar) {
                el.classList.add('sidebar-item-active');
            } else {
                el.classList.add('bg-accent/30', 'text-primary', 'font-medium');
            }
        }
    });

    // 4. 执行内容显隐切换
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => {
        p.classList.add('hidden');
        p.style.opacity = '0'; // 为淡入动画做准备
    });

    // 5. 触发入场动画 (微调：使用 transition-all 配合 opacity)
    targetPage.classList.remove('hidden');
    requestAnimationFrame(() => {
        targetPage.style.transition = 'opacity 300ms ease-in-out';
        targetPage.style.opacity = '1';
    });

    // 6. 数据刷新钩子 (解耦触发各模块初始化)
    const triggerHooks = {
        'favorites': () => typeof updateFavoritesUI === 'function' && updateFavoritesUI(),
        'member': () => typeof updateMemberPageUI === 'function' && updateMemberPageUI(),
        'orders': () => typeof renderOrdersUI === 'function' && renderOrdersUI('all'),
        'search': () => {
            const kw = document.getElementById('search-input')?.value;
            if (kw && typeof searchBooks === 'function') searchBooks();
        }
    };

    if (triggerHooks[pageId]) {
        try {
            triggerHooks[pageId]();
        } catch (e) {
            console.error(`[Router] Hook error for ${pageId}:`, e);
        }
    }

    // 7. 调用角色特定的页面切换函数（如 managerSwitchPage, financeSwitchPage 等）
    const roleSwitchFunctions = {
        'managerSwitchPage': window.managerSwitchPage,
        'financeSwitchPage': window.financeSwitchPage,
        'staffSwitchPage': window.staffSwitchPage,
        'customerSwitchPage': window.customerSwitchPage
    };

    for (const [name, fn] of Object.entries(roleSwitchFunctions)) {
        if (typeof fn === 'function') {
            try {
                fn(pageId);
            } catch (e) {
                console.error(`[Router] Error in ${name}:`, e);
            }
        }
    }

    // 8. 移动端适配：切换后自动收起侧边栏
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
    }

    // 9. 交互调优：平滑滚动补偿
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

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

/**
 * 全局点击事件监听 (处理动态生成的元素)
 */
document.addEventListener('click', function (e) {
    // 监听所有 ID 为 logout-btn 的元素点击事件 (侧边栏登出按钮)
    if (e.target.closest('#logout-btn')) {
        e.preventDefault(); // 阻止 <a href="#"> 的默认跳转行为

        console.log("[Layout] Logout clicked");

        // 调用 common.js 中定义的 logout() 函数
        if (typeof logout === 'function') {
            logout();
        } else {
            // 兜底逻辑：万一 common.js 没加载
            console.warn("logout() function not found, forcing clear.");
            localStorage.clear();
            sessionStorage.clear();
            window.location.href = 'login.html';
        }
    }
});


/**
 * 3. 渲染逻辑：前台 (Customer)
 */
function renderStoreSidebar(role, activePage) {
    const container = document.getElementById('layout-sidebar');
    if (!container) return;
    const items = MENU_CONFIG[role] || [];

    const menuHtml = items.map(item => {
        if (item.type === 'separator') return '<div class="my-3 border-t border-brown-light/20"></div>';
        const activeClass = (item.id === activePage) ? 'sidebar-item-active' : '';
        const badgeHtml = item.badgeId ? `<span id="${item.badgeId}" class="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">0</span>` : '';

        return `
            <div class="sidebar-item sidebar-item-public-hover ${activeClass} relative group" 
                 data-page="${item.id}"
                 onclick="switchPage('${item.id}')">
                <i class="fa ${item.icon} text-xl w-6 text-center group-hover:scale-110 transition-transform"></i>
                <span class="sidebar-text ml-3">${item.text}</span>
                ${badgeHtml}
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <aside id="sidebar" class="bg-gradient-to-b from-brown-dark/95 to-brown min-h-screen flex-shrink-0 shadow-lg transform -translate-x-full md:translate-x-0 fixed md:static top-0 left-0 z-40 transition-all duration-300 w-64 flex flex-col h-full">
            <div class="p-4 border-b border-brown-light/30 flex items-center justify-between">
                <h2 class="text-white text-lg font-bold font-serif tracking-tight">Diamond Store</h2>
                <button class="text-white md:hidden hover:rotate-90 transition-transform" onclick="document.getElementById('sidebar').classList.add('-translate-x-full')">
                    <i class="fa fa-times"></i>
                </button>
            </div>
            
            <!-- 导航区域 -->
            <nav class="mt-4 flex-1">${menuHtml}</nav>
            
            <!-- 任务标准化：侧边栏底部登出按钮 -->
            <div class="p-4 border-t border-brown-light/20">
                <button onclick="logout()" class="flex items-center gap-3 px-4 py-3 w-full text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200">
                    <i class="fa fa-sign-out text-lg"></i>
                    <span class="font-medium">Logout</span>
                </button>
            </div>
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
 * 4. 渲染逻辑：后台 (Admin - Finance/Manager/Staff)
 */
function renderAdminSidebar(role, activePage) {
    const container = document.getElementById('layout-sidebar');
    if (!container) return;
    const items = MENU_CONFIG[role] || [];

    const baseLinkStyle = "sidebar-item flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg transition-all duration-300 hover:bg-accent/20 hover:text-primary cursor-pointer mb-1";
    const activeLinkStyle = "sidebar-item-active bg-accent/30 text-primary font-medium";

    const menuHtml = items.map(item => {
        const isActive = item.id === activePage;
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

    // 移除 roleTitles 定义，因为我们不再显示职位
    // const roleTitles = {
    //     finance: 'Finance Staff',
    //     manager: 'Stores Manager',
    //     staff: 'Sales Staff'
    // };
    // const displayRole = roleTitles[role] || 'Staff';

    // 生成头像名称 - 使用角色名或默认
    const avatarName = role.charAt(0).toUpperCase() + role.slice(1);

    container.innerHTML = `
        <header class="bg-white border-b border-gray-200 shadow-sm z-10 flex-shrink-0">
            <div class="flex items-center justify-between px-4 h-16">
                <!-- 左侧区域：Toggle + Logo + Title -->
                <div class="flex items-center gap-3">
                    <button id="sidebar-toggle" class="text-gray-600 hover:text-primary p-2 rounded-md hover:bg-gray-100 transition-colors" onclick="toggleSidebar()">
                        <i class="fa fa-bars text-xl"></i>
                    </button>
                    <div class="flex items-center gap-2 cursor-pointer" onclick="location.reload()">
                        <img src="../assets/images/logo.png" alt="Bookstore Logo" class="w-10 h-10 object-contain">
                        <h1 class="text-xl font-serif font-bold text-primary flex items-center">
                            Diamond Page Store
                        </h1>
                    </div>
                </div>

                <!-- 右侧区域：用户信息 - 只显示头像和下拉箭头 -->
                <div class="flex items-center">
                    <div class="relative">
                        <div id="user-menu-btn" class="flex items-center gap-2 cursor-pointer group px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                            <!-- 只保留头像 -->
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random" alt="Avatar" 
                                class="w-8 h-8 rounded-full object-cover border-2 border-transparent group-hover:border-primary transition-all">
                            <!-- 移除用户名和职位显示 -->
                            <i class="fa fa-chevron-down text-xs text-gray-500 group-hover:text-primary transition-colors"></i>
                        </div>

                        <!-- 下拉菜单 - 统一结构 -->
                        <div id="user-menu-dropdown" 
                            class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 hidden z-50 transition-all duration-200">
                            <div class="p-2">
                                <a href="#" id="edit-profile-btn"
                                    class="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                    <i class="fa fa-user text-sm"></i>
                                    <span>Edit Profile</span>
                                </a>
                                <a href="#" id="change-password-btn"
                                    class="flex items-center gap-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                                    <i class="fa fa-key text-sm"></i>
                                    <span>Change Password</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    `;
}

/**
 * 加载当前用户信息（用于所有后台角色）
 */
async function loadCurrentUserInfo(role) {
    try {
        let apiEndpoint = '';
        let userData = {};

        // 根据角色确定API端点
        switch (role) {
            case 'manager':
                apiEndpoint = '../api/manager/get_current_user.php';
                break;
            case 'finance':
                apiEndpoint = '../api/finance/get_current_user.php';
                break;
            case 'staff':
                apiEndpoint = '../api/staff/get_current_staff.php';
                break;
            default:
                console.warn('Unknown role:', role);
                return;
        }

        const response = await fetch(apiEndpoint);
        const result = await response.json();

        if (result.success) {
            userData = result.data;
            // 更新头像
            updateUserAvatar(userData, role);
        } else {
            console.warn('Failed to load user info:', result.message);
            // 使用默认角色头像
            updateUserAvatar({}, role);
        }

        // 存储到localStorage
        localStorage.setItem('current_user', JSON.stringify({
            ...userData,
            role: role
        }));
    } catch (error) {
        console.error('Error loading user info:', error);
        // 使用默认角色头像
        updateUserAvatar({}, role);
    }
}

/**
 * 更新用户头像
 */
function updateUserAvatar(userData, role) {
    const avatarElement = document.querySelector('#user-menu-btn img');
    if (!avatarElement) return;

    // 优先使用用户全名，其次使用用户名，最后使用角色名
    const name = userData.full_name || userData.name || userData.username || 
                 role.charAt(0).toUpperCase() + role.slice(1);
    
    avatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`;
}

/**
 * 全局头像更新函数
 * 可以从任何地方调用更新当前用户的头像
 */
window.updateUserAvatar = function(userData, role) {
    const avatarElement = document.querySelector('#user-menu-btn img');
    if (!avatarElement) return;
    
    // 确定显示名称
    let displayName = '';
    if (userData && (userData.full_name || userData.name || userData.username)) {
        displayName = userData.full_name || userData.name || userData.username;
    } else if (role) {
        displayName = role.charAt(0).toUpperCase() + role.slice(1);
    } else {
        displayName = 'User';
    }
    
    avatarElement.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
};

/**
 * 用户区域下拉菜单控制（简化版，确保可点击）
 */
function initUserMenu() {
    console.log('[Layout] Initializing user menu...');

    // 延迟执行，确保DOM已渲染
    setTimeout(() => {
        const userMenuBtn = document.getElementById('user-menu-btn');
        const userMenuDropdown = document.getElementById('user-menu-dropdown');

        if (!userMenuBtn || !userMenuDropdown) {
            console.warn('[Layout] User menu elements not found');
            return;
        }

        console.log('[Layout] Found user menu elements, binding events...');

        // 确保初始状态是隐藏的
        userMenuDropdown.classList.add('hidden');

        // 简单的点击切换逻辑
        userMenuBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();

            console.log('[Layout] User menu clicked');

            // 切换显示状态
            userMenuDropdown.classList.toggle('hidden');
        });

        // 点击其他地方关闭菜单
        document.addEventListener('click', function (e) {
            if (!userMenuBtn.contains(e.target) && !userMenuDropdown.contains(e.target)) {
                userMenuDropdown.classList.add('hidden');
            }
        });

        // 阻止下拉菜单内的点击事件关闭菜单
        userMenuDropdown.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        // 绑定编辑个人资料按钮
        const editProfileBtn = document.getElementById('edit-profile-btn');
        if (editProfileBtn) {
            editProfileBtn.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('[Layout] Edit profile clicked');

                // 关闭下拉菜单
                userMenuDropdown.classList.add('hidden');

                // 调用编辑个人资料函数
                showEditProfileModal();
            });
        }

        // 绑定修改密码按钮
        const changePasswordBtn = document.getElementById('change-password-btn');
        if (changePasswordBtn) {
            changePasswordBtn.addEventListener('click', function (e) {
                e.preventDefault();
                console.log('[Layout] Change password clicked');

                // 关闭下拉菜单
                userMenuDropdown.classList.add('hidden');

                // 调用修改密码函数
                showChangePasswordModal();
            });
        }

        console.log('[Layout] User menu initialized successfully');
    }, 300);
}

/**
 * 显示编辑个人资料模态框
 */
function showEditProfileModal() {
    // 从localStorage获取当前用户信息
    const storedUser = localStorage.getItem('current_user');
    let currentUser = { username: 'User', email: '' };

    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
        } catch (e) {
            console.error('Failed to parse user data:', e);
        }
    }

    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl w-full max-w-md">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-bold">Edit Profile</h3>
                        <button class="text-gray-500 hover:text-gray-700 close-modal">
                            <i class="fa fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <form id="edit-profile-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Username</label>
                            <input type="text" id="edit-username" class="form-input" 
                                   value="${currentUser.username || currentUser.full_name || ''}" 
                                   required placeholder="Enter your username">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input type="email" id="edit-email" class="form-input" 
                                   value="${currentUser.email || ''}" 
                                   required placeholder="Enter your email">
                        </div>
                        <div class="flex justify-end gap-3 mt-6">
                            <button type="button" class="btn-secondary close-modal">Cancel</button>
                            <button type="submit" class="btn-primary">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 绑定关闭事件
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });

    // 绑定表单提交事件
    modal.querySelector('#edit-profile-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('edit-username').value;
        const email = document.getElementById('edit-email').value;

        // 简单演示 - 实际应该调用API
        console.log('Saving profile:', { username, email });

        // 更新localStorage
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser);
                userData.username = username;
                userData.full_name = username;
                userData.email = email;
                localStorage.setItem('current_user', JSON.stringify(userData));

                // 更新页面显示
                const userNameElement = document.getElementById('header-user-name');
                if (userNameElement) {
                    userNameElement.textContent = username;
                }
            } catch (e) {
                console.error('Failed to update user data:', e);
            }
        }

        // 显示成功消息
        showSimpleMessage('Profile updated successfully');

        modal.remove();
    });
}

/**
 * 显示修改密码模态框
 */
function showChangePasswordModal() {
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl w-full max-w-md">
                <div class="p-6 border-b border-gray-200">
                    <div class="flex justify-between items-center">
                        <h3 class="text-xl font-bold">Change Password</h3>
                        <button class="text-gray-500 hover:text-gray-700 close-modal">
                            <i class="fa fa-times text-xl"></i>
                        </button>
                    </div>
                </div>
                <div class="p-6">
                    <form id="change-password-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                            <input type="password" id="current-password" class="form-input" 
                                   required placeholder="Enter current password">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                            <input type="password" id="new-password" class="form-input" 
                                   required placeholder="At least 6 characters">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                            <input type="password" id="confirm-password" class="form-input" 
                                   required placeholder="Confirm new password">
                        </div>
                        <div class="flex justify-end gap-3 mt-6">
                            <button type="button" class="btn-secondary close-modal">Cancel</button>
                            <button type="submit" class="btn-primary">Update Password</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 绑定关闭事件
    modal.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => modal.remove());
    });

    // 绑定表单提交事件
    modal.querySelector('#change-password-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const currentPassword = document.getElementById('current-password').value;
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        // 简单验证
        if (!currentPassword || !newPassword || !confirmPassword) {
            showSimpleMessage('Please fill in all fields', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showSimpleMessage('New password must be at least 6 characters', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showSimpleMessage('New passwords do not match', 'error');
            return;
        }

        if (newPassword === currentPassword) {
            showSimpleMessage('New password cannot be the same as current password', 'error');
            return;
        }

        // 简单演示 - 实际应该调用API
        console.log('Changing password:', { currentPassword, newPassword });

        // 显示成功消息
        showSimpleMessage('Password changed successfully');

        modal.remove();
    });
}

/**
 * 显示简单消息
 */
function showSimpleMessage(message, type = 'success') {
    const colors = {
        success: 'bg-green-100 text-green-800',
        error: 'bg-red-100 text-red-800'
    };

    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg ${colors[type]} z-50`;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

/**
 * 5. 入口函数。页面加载时调用它，它负责判断角色、渲染对应的头和侧边栏，并切换到默认页面。
 */
window.initLayout = function (role = 'customer', defaultPage = 'home') {
    // 1. 角色安全检查
    const validRoles = Object.keys(MENU_CONFIG);
    const userRole = validRoles.includes(role) ? role : 'customer';

    // 2. 获取目标页面
    let savedPage = sessionStorage.getItem('currentPage');
    const roleMenuIds = MENU_CONFIG[userRole].map(item => item.id);

    if (!savedPage || !roleMenuIds.includes(savedPage)) {
        savedPage = defaultPage;
    }

    const backOfficeRoles = ['finance', 'manager', 'staff'];
    const isBackOffice = backOfficeRoles.includes(userRole);

    // 3. 执行布局渲染
    if (isBackOffice) {
        document.body.className = 'bg-gray-50 text-dark min-h-screen flex overflow-x-hidden font-sans';
        renderAdminHeader(userRole);
        renderAdminSidebar(userRole, savedPage);

        // 初始化用户菜单（所有后台角色统一使用）
        setTimeout(() => {
            // 加载当前用户信息（可选）
            loadCurrentUserInfo(userRole);

            // 初始化用户菜单
            initUserMenu();
        }, 500);

    } else {
        document.body.className = 'bg-brown-cream min-h-screen flex overflow-x-hidden font-serif';
        renderStoreHeader(userRole);
        renderStoreSidebar(userRole, savedPage);
    }

    // 4. 立即执行首次切换
    requestAnimationFrame(() => {
        window.switchPage(savedPage);
    });
};
