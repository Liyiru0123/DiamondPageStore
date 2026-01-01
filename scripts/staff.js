// scripts/staff.js

// 管理各功能区的当前页码
let staffPageState = {
    inventory: 1,
    orders: 1
};


// 全局变量存储当前员工信息
let currentStaff = {
    store_id: null,
    store_name: '',
    employee_id: null,
    name: ''
};
let globalBooks = [];       // 当前显示的数据
let globalOrders = [];      // 用于前端搜索和过滤的本地缓存
let globalCategories = [];  // 存储类别列表
let globalOrderStatuses = []; // 存储订单状态列表

/**
 * ------------------------------------------------------------------
 * 3. 页面初始化 (DOM Ready)
 * ------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
    // 设置日期
    setupDate();

    // 关键改变：先获取当前员工信息，成功后再加载数据
    initStaffSession();

    // 绑定通用事件
    setupInternalEventListeners();
});

function setupDate() {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const now = new Date();
        currentDateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }
}

/**
 * 获取当前登录员工信息
 */
async function initStaffSession() {
    try {
        const response = await fetch('../api/staff/get_current_staff.php');
        const result = await response.json();

        if (result.success) {
            // 兼容性处理：有些数据库环境返回大写字段名
            const rawData = result.data;
            currentStaff = {
                user_id: rawData.user_id || rawData.USER_ID,
                store_id: rawData.store_id || rawData.STORE_ID,
                store_name: rawData.store_name || rawData.STORE_NAME,
                full_name: rawData.full_name || rawData.FULL_NAME,
                job_title: rawData.job_title || rawData.JOB_TITLE
            };

            console.log("Staff Session Initialized:", currentStaff);

            const headerStoreEl = document.getElementById('header-store-name');
            if (headerStoreEl) headerStoreEl.textContent = currentStaff.store_name;
            const headerUserEl = document.getElementById('header-user-name');
            if (headerUserEl) headerUserEl.textContent = currentStaff.full_name;

            fetchCategories();  // 先加载类别
            fetchOrderStatuses(); // 加载订单状态
            fetchInventory();   // 加载库存（使用默认筛选）
            fetchOrders(currentStaff.store_id);
            fetchStockRequests(currentStaff.store_id);

        } else {
            // --- 核心修复 ---
            // 如果后端返回 success: false (说明 Session 过期或无效)
            console.warn("Session expired or invalid:", result.message);
            
            // 1. 清除前端残留的“假”登录状态
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('user_role');
            
            // 2. 强制跳回登录页
            alert("Session expired. Please login again.");
            window.location.href = 'login.html';
        }
    } catch (error) {
        console.error('Session Init Failed:', error);
        // 如果是网络错误，可以保留在页面但显示断网提示
    }
}

/**
 * ------------------------------------------------------------------
 * 2. 模拟数据 (Sample Data)
 * ------------------------------------------------------------------
 */
const books = [
    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", category: "fiction", price: 15.99, stock: 12 },
    { id: 2, title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", isbn: "9780062316097", category: "non-fiction", price: 19.99, stock: 8 },
    { id: 3, title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", category: "science", price: 14.99, stock: 3 },
    { id: 4, title: "1984", author: "George Orwell", isbn: "9780451524935", category: "fiction", price: 12.99, stock: 25 },
    { id: 5, title: "The Diary of a Young Girl", author: "Anne Frank", isbn: "9780553573404", category: "biography", price: 11.99, stock: 5 },
    { id: 6, title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", category: "fiction", price: 13.99, stock: 18 },
    { id: 7, title: "The Theory of Everything", author: "Stephen Hawking", isbn: "9780553380163", category: "science", price: 16.99, stock: 2 },
    { id: 8, title: "Educated", author: "Tara Westover", isbn: "9780399590504", category: "biography", price: 17.99, stock: 10 },
    { id: 9, title: "The Guns of August", author: "Barbara W. Tuchman", isbn: "9780345476098", category: "history", price: 21.99, stock: 7 },
    { id: 10, title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518", category: "fiction", price: 9.99, stock: 32 }
];

const mockInventory = [
    { batch_id: 1, book_name: "The Great Gatsby", publisher: "Scribner", ISBN: "9780743273565", binding: "Hardcover", unit_price: 15.99, quantity: 1, category: "Fiction" },
    { batch_id: 2, book_name: "Sapiens", publisher: "Harper", ISBN: "9780062316097", binding: "Paperback", unit_price: 19.99, quantity: 12, category: "Non-Fiction" },
    { batch_id: 3, book_name: "A Brief History of Time", publisher: "Bantam", ISBN: "9780553380163", binding: "Paperback", unit_price: 14.99, quantity: 1, category: "Science" },
    { batch_id: 4, book_name: "1984", publisher: "Signet", ISBN: "9780451524935", binding: "Mass Market", unit_price: 12.99, quantity: 25, category: "Fiction" },
    { batch_id: 5, book_name: "Educated", publisher: "Random House", ISBN: "9780399590504", binding: "Hardcover", unit_price: 17.99, quantity: 8, category: "Biography" }
];

const mockOrders = [
    {
        order_id: 1001,
        customer: "John Smith",
        order_date: "2023-12-01 10:30:00",
        items: 3,
        total: 45.97,
        status: "paid",
        book_list: [
            { title: "The Great Gatsby", isbn: "9780743273565", qty: 2, price: 15.99 },
            { title: "1984", isbn: "9780451524935", qty: 1, price: 13.99 }
        ]
    },
    {
        order_id: 1002,
        customer: "Jane Doe",
        order_date: "2023-12-25 14:20:00",
        items: 1,
        total: 19.99,
        status: "created",
        book_list: [
            { title: "Sapiens", isbn: "9780062316097", qty: 1, price: 19.99 }
        ]
    },
    {
        order_id: 1003,
        customer: "Robert Johnson",
        order_date: "2023-12-26 09:15:00",
        items: 1,
        total: 15.99,
        status: "cancelled",
        book_list: [
            { title: "The Great Gatsby", isbn: "9780743273565", qty: 1, price: 15.99 }
        ]
    }
];

const stockRequests = [
    { id: 501, dateRequested: "2023-06-10", items: 5, status: "pending", expectedDelivery: "2023-06-20" },
    { id: 502, dateRequested: "2023-06-05", items: 3, status: "delivered", expectedDelivery: "2023-06-12" },
    { id: 503, dateRequested: "2023-05-28", items: 7, status: "delivered", expectedDelivery: "2023-06-05" }
];

/**
 * ------------------------------------------------------------------
 * 3. 获取数据
 * ------------------------------------------------------------------
 */
// A. 获取库存数据的函数（带筛选参数）
async function fetchInventory(filters = {}) {
    const storeId = currentStaff.store_id;
    if (!storeId) return;
    
    try {
        // 构建查询参数
        const params = new URLSearchParams({
            store_id: storeId,
            search: filters.search || '',
            category: filters.category || '',
            stock_level: filters.stock_level || '',
            hide_zero: filters.hide_zero || false,
            sort_by: filters.sort_by || 'title-asc'
        });

        const response = await fetch(`../api/staff/get_inventory.php?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
            globalBooks = result.data;
            
            // 渲染库存列表
            renderInventory(globalBooks);
            
            // 更新总数显示
            const totalCountEl = document.getElementById('total-inventory-count');
            if (totalCountEl && result.total !== undefined) {
                totalCountEl.textContent = result.total;
            }
            
            // 只在初始加载或过滤为空时更新Dashboard
            if (!filters.search && !filters.category && !filters.stock_level && !filters.hide_zero) {
                renderLowStockItems(globalBooks);
                updateDashboardStats(globalBooks, globalOrders);
            }
        }
    } catch (error) {
        console.error('Inventory Error:', error);
    }
}

// B. 获取类别列表
async function fetchCategories() {
    try {
        const response = await fetch('../api/staff/get_categories.php');
        const result = await response.json();

        if (result.success) {
            globalCategories = result.data;
            populateCategoryDropdowns();
        }
    } catch (error) {
        console.error('Categories Error:', error);
    }
}

// B2. 获取订单状态列表
async function fetchOrderStatuses() {
    try {
        const response = await fetch('../api/staff/get_order_statuses.php');
        const result = await response.json();

        if (result.success) {
            globalOrderStatuses = result.data;
            populateOrderStatusDropdowns();
        }
    } catch (error) {
        console.error('Order Statuses Error:', error);
    }
}

// C. 填充类别下拉框
function populateCategoryDropdowns() {
    // 填充筛选器中的类别下拉框
    const filterSelect = document.getElementById('category-filter');
    if (filterSelect && globalCategories.length > 0) {
        // 保留"All Categories"选项，添加数据库中的类别
        const currentValue = filterSelect.value;
        const options = '<option value="">All Categories</option>' +
            globalCategories.map(cat =>
                `<option value="${cat.category_name}">${cat.category_name}</option>`
            ).join('');
        filterSelect.innerHTML = options;
        filterSelect.value = currentValue;
    }

    // 填充编辑模态框中的类别下拉框
    const modalSelect = document.getElementById('book-category');
    if (modalSelect && globalCategories.length > 0) {
        const currentValue = modalSelect.value;
        const options = '<option value="">Select Category</option>' +
            globalCategories.map(cat =>
                `<option value="${cat.category_name}">${cat.category_name}</option>`
            ).join('');
        modalSelect.innerHTML = options;
        modalSelect.value = currentValue;
    }
}

// C2. 填充订单状态下拉框
function populateOrderStatusDropdowns() {
    // 填充筛选器中的状态下拉框
    const filterSelect = document.getElementById('order-status-filter');
    if (filterSelect && globalOrderStatuses.length > 0) {
        const currentValue = filterSelect.value;
        const options = '<option value="">All Statuses</option>' +
            globalOrderStatuses.map(status =>
                `<option value="${status}">${capitalize(status)}</option>`
            ).join('');
        filterSelect.innerHTML = options;
        filterSelect.value = currentValue;
    }

    // 填充详情模态框中的状态下拉框
    const modalSelect = document.getElementById('detail-order-status-select');
    if (modalSelect && globalOrderStatuses.length > 0) {
        const options = globalOrderStatuses.map(status =>
            `<option value="${status}">${capitalize(status)}</option>`
        ).join('');
        modalSelect.innerHTML = options;
    }
}

// D. 获取订单数据的函数
async function fetchOrders(storeId, filters = {}) {
    if (!storeId) return;
    try {
        const params = new URLSearchParams({
            store_id: storeId,
            search: filters.search || '',
            status: filters.status || '',
            date_from: filters.date_from || '',
            date_to: filters.date_to || ''
        });

        const response = await fetch(`../api/staff/get_orders.php?${params.toString()}`);
        const result = await response.json();

        if (result.success) {
            globalOrders = result.data || [];
            console.log("Orders Fetched:", globalOrders.length);

            // 渲染表格
            renderOrders(globalOrders);
            renderRecentOrders(globalOrders);

            // 再次调用统计更新
            updateDashboardStats(globalBooks, globalOrders);
        } else {
            console.error('Orders API Error:', result.message);
            globalOrders = [];
            renderOrders([]);
            renderRecentOrders([]);
            updateDashboardStats(globalBooks, []);
        }
    } catch (error) {
        console.error('Orders Fetch Exception:', error);
        globalOrders = [];
        renderOrders([]);
        renderRecentOrders([]);
    }
}

let globalStockRequests = []; // 存储补货请求数据

// E. 获取进货申请的函数
async function fetchStockRequests(storeId) {
    if (!storeId) return;
    try {
        const response = await fetch(`../api/staff/get_stock_requests.php?store_id=${storeId}`);
        const result = await response.json();

        if (result.success) {
            globalStockRequests = result.data;
            renderStockRequests(globalStockRequests);
        }
    } catch (error) {
        console.error('Requests Error:', error);
    }
}

/**
 * ------------------------------------------------------------------
 * 4. 事件监听设置
 * ------------------------------------------------------------------
 */
function setupInternalEventListeners() {
    // 模态框相关元素
    const addBookBtn = document.getElementById('add-book-btn');
    const bookModal = document.getElementById('book-modal');
    const closeModal = document.getElementById('close-modal');
    const cancelBook = document.getElementById('cancel-book');
    const bookForm = document.getElementById('book-form');

    // 打开模态框
    if (addBookBtn) {
        addBookBtn.addEventListener('click', () => {
            document.getElementById('modal-title').textContent = 'Add New Book';
            if (bookForm) bookForm.reset();
            document.getElementById('book-id').value = '';
            if (bookModal) {
                bookModal.classList.remove('hidden');
                bookModal.classList.add('flex');
            }
        });
    }

    // 关闭模态框
    if (closeModal) closeModal.addEventListener('click', closeBookModal);
    if (cancelBook) cancelBook.addEventListener('click', closeBookModal);

    // 表单提交
    if (bookForm) {
        bookForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveBook();
        });
    }

    // 筛选按钮
    const filterBtn = document.getElementById('filter-inventory');
    if (filterBtn) filterBtn.addEventListener('click', applyFilters);

    const resetBtn = document.getElementById('reset-inventory');
    if (resetBtn) resetBtn.addEventListener('click', resetFilters);

    // 隐藏库存为0的复选框 - 触发后端筛选
    const hideZeroCheckbox = document.getElementById('hide-zero-stock');
    if (hideZeroCheckbox) {
        hideZeroCheckbox.addEventListener('change', () => {
            applyFilters();
        });
    }

    // 在 setupInternalEventListeners 函数中插入
    const newRequestBtn = document.getElementById('new-request-btn');
    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', () => {
            const modal = document.getElementById('stock-request-modal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');

            // 绑定初始行的事件
            const initialTitleInput = document.querySelector('#request-items-body .item-title');
            if (initialTitleInput && !initialTitleInput._bound) {
                initialTitleInput.addEventListener('input', () => searchBooksForRequest(initialTitleInput));
                initialTitleInput.addEventListener('change', () => handleBookSelection(initialTitleInput));
                initialTitleInput._bound = true;
            }
        });
    }

    const submitRequestBtn = document.getElementById('submit-request-btn');
    if (submitRequestBtn) {
        submitRequestBtn.addEventListener('click', submitStockRequest);
    }

    // 订单筛选按钮
    const applyOrderFiltersBtn = document.getElementById('apply-order-filters');
    const orderSearchInput = document.getElementById('order-search');

    const performOrderSearch = () => {
        staffPageState.orders = 1;
        const filters = {
            search: orderSearchInput.value.trim(),
            status: document.getElementById('order-status-filter').value,
            date_from: document.getElementById('order-date-from').value,
            date_to: document.getElementById('order-date-to').value
        };
        fetchOrders(currentStaff.store_id, filters);
    };

    if (applyOrderFiltersBtn) {
        applyOrderFiltersBtn.addEventListener('click', performOrderSearch);
    }

    if (orderSearchInput) {
        orderSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performOrderSearch();
            }
        });
    }

    const resetOrderFiltersBtn = document.getElementById('reset-order-filters');
    if (resetOrderFiltersBtn) {
        resetOrderFiltersBtn.addEventListener('click', () => {
            document.getElementById('order-search').value = '';
            document.getElementById('order-date-from').value = '';
            document.getElementById('order-date-to').value = '';
            document.getElementById('order-status-filter').value = '';
            staffPageState.orders = 1;
            fetchOrders(currentStaff.store_id);
        });
    }

    // 注销逻辑
    document.body.addEventListener('click', function(e) {
        // 查找是否点击了 ID 为 logout-btn 的元素（或其子元素）
        const logoutBtn = e.target.closest('#logout-btn');
        if (logoutBtn) {
            e.preventDefault(); // 阻止默认链接跳转
            console.log("[Staff] Force Logout triggered");
            
            // 调用 common.js 中的 logout 函数
            if (typeof logout === 'function') {
                logout(); 
            } else {
                // 兜底逻辑：如果 common.js 没加载到，手动清除并跳转
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        }
    });
}

/**
 * ------------------------------------------------------------------
 * 5. 业务逻辑函数
 * ------------------------------------------------------------------
 */

// 关闭模态框
function closeBookModal() {
    const bookModal = document.getElementById('book-modal');
    if (bookModal) {
        bookModal.classList.add('hidden');
        bookModal.classList.remove('flex');
        
        // 重新启用所有字段
        const fields = [
            'book-title', 'book-isbn', 'book-category', 'book-price',
            'book-language', 'book-binding', 'book-publisher',
            'book-author-first', 'book-author-last', 'book-author-country',
            'book-intro'
        ];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = false;
        });
    }
}

/**
 * 5.1 Dashboard 相关渲染函数
 */

// 渲染 Dashboard: 只取前 5 条数据，画在首页的简略表格里。
function renderRecentOrders(data) {
    const recentOrdersList = document.getElementById('recent-orders-list');
    if (!recentOrdersList || !data) return;
    recentOrdersList.innerHTML = '';

    const recent = data.slice(0, 10);

    recent.forEach(order => {
        const row = document.createElement('tr');

        // --- 修复重点 START ---
        // 1. 兼容字段名: 数据库可能是 order_id, 也可能是 id
        const displayId = order.order_id || order.id;

        // 2. 兼容字段名: 数据库可能是 order_date, 也可能是 date
        const displayDate = order.order_date || order.date;

        // 3. 修复报错核心: 获取状态字符串，如果为空则给默认值 'created'
        // 同时兼容数据库字段 order_status 和前端字段 status
        const rawStatus = order.order_status || order.status || 'created';
        const safeStatus = rawStatus.toLowerCase(); // 确保它是小写
        // --- 修复重点 END ---

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${displayId}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-${safeStatus}">${capitalize(safeStatus)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(displayDate)}</td>
        `;
        recentOrdersList.appendChild(row);
    });

    if (recent.length === 0) {
        recentOrdersList.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-400">No recent orders</td></tr>';
    }
}

// A. 渲染 Dashboard: 低库存预警列表 (Dashboard 修正)
function renderLowStockItems(inventoryData) {
    const lowStockList = document.getElementById('low-stock-list');
    if (!lowStockList) return;
    lowStockList.innerHTML = '';

    // 修改筛选逻辑：qty == 1 (根据之前的需求)
    const criticalItems = inventoryData.filter(item => {
        const qty = parseInt(item.quantity || item.stock || 0);
        return qty === 1;
    });

    criticalItems.forEach(item => {
        const row = document.createElement('tr');

        const name = item.book_name || item.title || 'Unknown';
        // 修正：优先使用 category，如果没有则显示 binding
        const cat = item.category || item.binding || 'General';

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 overflow-hidden text-ellipsis max-w-[200px]" title="${name}">
                ${name}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${cat}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button class="text-primary hover:text-primary/80" onclick="switchPage('inventory')">
                    <i class="fa fa-plus-square mr-1"></i> Restock
                </button>
            </td>
        `;
        lowStockList.appendChild(row);
    });

    if (criticalItems.length === 0) {
        lowStockList.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-400">No low stock items (Qty: 1)</td></tr>';
    }
}

// 渲染 Inventory：接收书籍数组，生成 HTML
function renderInventory(data) {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;

    // 1. 确定数据源
    const sourceData = data || globalBooks;
    const pageSize = 10;

    // 2. 获取分页后的切片数据
    const paginatedData = getPaginatedData(sourceData, staffPageState.inventory, pageSize);

    // 4. 渲染行内容
    inventoryList.innerHTML = paginatedData.map(item => {
        const title = item.book_name || item.title || 'Unknown Title';
        const batch = item.batch_number || '-';
        const binding = item.binding || '';
        
        // 优先显示作者全名，如果没有则显示出版社
        let authorDisplay = '-';
        if (item.author_first || item.author_last) {
            authorDisplay = `${item.author_first || ''} ${item.author_last || ''}`.trim();
        } else {
            authorDisplay = item.publisher || item.author || '-';
        }
        
        const isbn = item.ISBN || item.isbn || '-';
        
        // 确保 category 存在，如果为空显示 Uncategorized
        const category = item.category || 'Uncategorized';
        
        const price = parseFloat(item.unit_price || item.price || 0).toFixed(2);
        const stock = parseInt(item.quantity || item.stock || 0);
        const skuId = item.sku_id || '';

        // 库存状态颜色逻辑
        let stockStatus = stock <= 5 ? 'low' : (stock <= 20 ? 'medium' : 'high');

        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div class="font-bold text-brown-dark">${title}</div>
                    <div class="text-[10px] text-gray-400 uppercase tracking-tighter">
                        ${binding ? `${binding} · ` : ''}Batch: ${batch}
                    </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${authorDisplay}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">${isbn}</td>
                
                <!-- 修改点：添加 max-w-[150px] 和 truncate 实现省略号 -->
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-[150px] truncate" title="${category}">
                    ${category}
                </td>
                
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-semibold">¥${price}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${stock}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="status-${stockStatus}">${capitalize(stockStatus)}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <button class="text-primary hover:text-primary/80 edit-book-btn" data-sku="${skuId}">
                        <i class="fa fa-edit"></i> Edit
                    </button>
                </td>
            </tr>`;
    }).join('');

    // 5. 更新分页控制条
    renderPaginationControls(
        'inventory-pagination-controls',
        sourceData.length,
        staffPageState.inventory,
        (newPage) => {
            staffPageState.inventory = newPage;
            renderInventory(sourceData);
        },
        pageSize
    );

    // 6. 重新绑定事件
    bindDynamicEvents();
}

// 计算首页三项统计数据
function updateDashboardStats(inventoryData = [], ordersData = []) {
    console.log("Updating Stats...", { inv: inventoryData.length, ord: ordersData.length });

    // A. 统计总库存
    const totalBooks = inventoryData.reduce((sum, item) => {
        const qty = parseInt(item.quantity || item.stock || 0);
        return sum + qty;
    }, 0);

    // B. 统计低库存
    const lowStockCount = inventoryData.filter(item => {
        const qty = parseInt(item.quantity || item.stock || 0);
        return qty === 1;
    }).length;

    // C. 统计总订单数 (增加安全性检查)
    const totalOrders = Array.isArray(ordersData) ? ordersData.length : 0;


    // 4. 更新 DOM
    const totalEl = document.getElementById('total-books');
    const lowStockEl = document.getElementById('low-stock-books');
    const ordersEl = document.getElementById('total-orders-count');

    if (totalEl) totalEl.textContent = totalBooks.toLocaleString();
    if (lowStockEl) lowStockEl.textContent = lowStockCount;
    if (ordersEl) ordersEl.textContent = totalOrders.toLocaleString();
}

/**
 * 5.2 Orders 相关渲染函数
 */

// 渲染 Orders: 订单列表
function renderOrders(data) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    // 1. 数据源：优先使用传入的 data，否则为空数组 (不再使用 mockOrders)
    const sourceData = data || [];
    const pageSize = 10;

    // 2. 分页逻辑
    const paginatedData = getPaginatedData(sourceData, staffPageState.orders, pageSize);

    // 3. 渲染 HTML
    if (paginatedData.length === 0) {
        ordersList.innerHTML = '<tr><td colspan="7" class="text-center py-10 text-gray-400">No orders found</td></tr>';
        return;
    }

    ordersList.innerHTML = paginatedData.map(order => {
        // 兼容性处理：支持多种可能的字段名
        const displayId = order.order_id || order.id || '-';
        const displayCustomer = order.customer_name || order.customer || 'Guest';
        const displayDate = order.order_date || order.date;
        const displayItemsCount = order.items_count !== undefined ? order.items_count : (order.items || 0);
        const rawStatus = order.order_status || order.status || 'created';
        const safeStatus = rawStatus.toLowerCase();

        // 数据库返回的 total_amount 可能是字符串，转换成浮点数以防万一
        const total = parseFloat(order.total_amount || order.total || 0);

        // 状态样式样式
        const statusClass = `status-${safeStatus}`;

        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #${displayId}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${displayCustomer}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(displayDate)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${displayItemsCount} items
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                ¥${total.toFixed(2)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="${statusClass} border px-2 py-1 rounded-full text-xs font-medium">
                    ${rawStatus.toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="viewOrderDetails(${displayId})" class="btn-secondary py-1 px-3 text-xs flex items-center gap-1">
                    <i class="fa fa-eye"></i> View Details
                </button>
            </td>
        </tr>`;
    }).join('');

    // 4. 更新分页控件
    renderPaginationControls(
        'orders-pagination-controls',
        sourceData.length,
        staffPageState.orders,
        (newPage) => {
            staffPageState.orders = newPage;
            renderOrders(sourceData);
        },
        pageSize
    );
}
/**
 * 5.3 Stock Requests 相关渲染函数
 */
// 渲染 Stock Requests (进货申请)
function renderStockRequests(data) {
    const pendingList = document.getElementById('pending-requests-list');
    const prevList = document.getElementById('previous-requests-list');

    if (!pendingList || !prevList) return;

    pendingList.innerHTML = '';
    prevList.innerHTML = '';

    // 数据源
    const sourceData = data || globalStockRequests || [];

    sourceData.forEach(request => {
        const row = document.createElement('tr');

        // 兼容大小写字段名
        const requestId = request.request_id || request.REQUEST_ID;
        const requestDate = request.request_date || request.REQUEST_DATE;
        const bookName = request.book_name || request.BOOK_NAME || 'Unknown';
        const requestedQuantity = request.requested_quantity || request.REQUESTED_QUANTITY || 0;
        const status = (request.status || request.STATUS || 'pending').toLowerCase();
        const completedDate = request.completed_date || request.COMPLETED_DATE;

        const isPending = status === 'pending';
        const displayDate = formatDate(requestDate);

        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                #${requestId}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
                <button class="text-primary hover:text-primary/80" onclick="viewRequestDetails(${requestId})">
                    <i class="fa fa-eye"></i> View
                </button>
                ${status === 'approved' ? `
                    <button class="text-green-600 hover:text-green-700 ml-2" onclick="completeRequest(${requestId})">
                        <i class="fa fa-check"></i> Receive
                    </button>
                ` : ''}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                ${displayDate}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 max-w-[200px] truncate" title="${bookName}">
                ${requestedQuantity}*${bookName}
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="status-${status}">
                    ${capitalize(status)}
                </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                ${isPending ? 'Pending Approval' : (completedDate ? formatDate(completedDate) : 'In Progress')}
            </td>
        `;

        // 根据状态分栏显示
        if (isPending) {
            pendingList.appendChild(row);
        } else {
            prevList.appendChild(row);
        }
    });

    // 如果没有数据，显示提示
    if (pendingList.children.length === 0) {
        pendingList.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-gray-400">No pending requests</td></tr>';
    }
}

/**
 * 查看请求详情
 */
window.viewRequestDetails = function(id) {
    const request = globalStockRequests.find(r => (r.request_id || r.REQUEST_ID) == id);
    if (request) {
        const requestId = request.request_id || request.REQUEST_ID;
        const bookName = request.book_name || request.BOOK_NAME || 'Unknown';
        const qty = request.requested_quantity || request.REQUESTED_QUANTITY || 0;
        const status = request.status || request.STATUS || 'pending';
        const date = request.request_date || request.REQUEST_DATE;
        const note = request.note || request.NOTE || '-';
        
        alert(`Request Details:\n------------------\nID: #${requestId}\nBook: ${bookName}\nQuantity: ${qty}\nStatus: ${status.toUpperCase()}\nDate: ${date}\nNote: ${note}`);
    }
};


// 绑定动态生成的按钮事件 (Edit/Delete)
function bindDynamicEvents() {
    document.querySelectorAll('.edit-book-btn').forEach(btn => {
        btn.onclick = function () {
            const skuId = this.getAttribute('data-sku');
            editBook(skuId);
        };
    });

    document.querySelectorAll('.delete-book-btn').forEach(btn => {
        btn.onclick = function () {
            const id = this.getAttribute('data-id');
            deleteBook(id);
        };
    });
}
/**
 * ------------------------------------------------------------------
 * 6. 数据库相关函数
 * ------------------------------------------------------------------
 */
// 保存书籍 (新增或编辑) 表单提交
async function saveBook() {
    const skuId = document.getElementById('book-id').value;
    const isEdit = skuId !== '';
    
    let url = '';
    let body = {};

    if (isEdit) {
        // 编辑模式只更新库存和批次
        url = '../api/staff/update_inventory.php';
        body = {
            sku_id: parseInt(skuId),
            store_id: currentStaff.store_id,
            quantity: parseInt(document.getElementById('book-stock').value),
            batch_code: document.getElementById('book-batch').value.trim()
        };
    } else {
        // 新增模式需要完整数据
        url = '../api/staff/add_book.php';
        const formData = {
            isbn: document.getElementById('book-isbn').value.trim(),
            name: document.getElementById('book-title').value.trim(),
            language: document.getElementById('book-language').value.trim(),
            publisher: document.getElementById('book-publisher').value.trim(),
            introduction: document.getElementById('book-intro').value.trim(),
            author_first: document.getElementById('book-author-first').value.trim(),
            author_last: document.getElementById('book-author-last').value.trim(),
            author_country: document.getElementById('book-author-country').value.trim(),
            category_id: 0,
            binding: document.getElementById('book-binding').value,
            unit_price: parseFloat(document.getElementById('book-price').value),
            store_id: currentStaff.store_id,
            initial_quantity: parseInt(document.getElementById('book-stock').value),
            batch_code: document.getElementById('book-batch').value.trim()
        };

        // 处理 category_id
        const categoryName = document.getElementById('book-category').value;
        const categoryObj = globalCategories.find(c => c.category_name === categoryName);
        if (categoryObj) {
            formData.category_id = categoryObj.category_id;
        }
        body = formData;
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        const result = await response.json();

        if (result.success) {
            closeBookModal();
            showNotification(isEdit ? "Inventory updated successfully" : "New book added successfully");
            // 重新加载库存数据
            fetchInventory();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error('Save Error:', error);
        alert("Failed to save book/inventory");
    }
}

// 编辑书籍：填充表单（只编辑库存数量）
function editBook(skuId) {
    const book = globalBooks.find(b => b.sku_id == skuId);
    console.log("Editing book data:", book); // 添加调试日志
    const bookModal = document.getElementById('book-modal');
    if (book && bookModal) {
        document.getElementById('modal-title').textContent = 'Edit Inventory';
        // 使用sku_id作为标识
        document.getElementById('book-id').value = book.sku_id || '';
        document.getElementById('book-batch').value = book.batch_number || '';
        document.getElementById('book-title').value = book.book_name || '';
        document.getElementById('book-isbn').value = book.ISBN || '';
        
        // 处理类别：可能是逗号分隔的多个类别，取第一个
        let categoryValue = book.category || '';
        if (categoryValue.includes(',')) {
            categoryValue = categoryValue.split(',')[0].trim();
        }
        document.getElementById('book-category').value = categoryValue;
        
        document.getElementById('book-price').value = book.unit_price || '';
        document.getElementById('book-stock').value = book.quantity || '';
        document.getElementById('book-binding').value = book.binding || '';
        document.getElementById('book-language').value = book.language || '';
        document.getElementById('book-publisher').value = book.publisher || '';
        document.getElementById('book-author-first').value = book.author_first || '';
        document.getElementById('book-author-last').value = book.author_last || '';
        document.getElementById('book-author-country').value = book.author_country || '';
        document.getElementById('book-intro').value = book.introduction || '';

        // 禁用除了库存和批次号以外的字段
        const lockedFields = [
            'book-title', 'book-isbn', 'book-category', 'book-price',
            'book-language', 'book-binding', 'book-publisher',
            'book-author-first', 'book-author-last', 'book-author-country',
            'book-intro'
        ];
        lockedFields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });

        bookModal.classList.remove('hidden');
        bookModal.classList.add('flex');
    } else {
        console.warn('Book not found with sku_id:', skuId);
    }
}

// 删除书籍
function deleteBook(id) {
    if (confirm('Are you sure you want to delete this book?')) {
        const index = books.findIndex(b => b.id === parseInt(id));
        if (index !== -1) {
            books.splice(index, 1);
            renderInventory();
            renderLowStockItems();
        }
    }
}

// 筛选功能 - 调用后端API
function applyFilters() {
    const searchTerm = document.getElementById('inventory-search').value.trim();
    const category = document.getElementById('category-filter').value;
    const stockLevel = document.getElementById('stock-filter').value;
    const sortBy = document.getElementById('sort-filter').value;
    const hideZeroCheckbox = document.getElementById('hide-zero-stock');
    const hideZero = hideZeroCheckbox ? hideZeroCheckbox.checked : false;

    // 重置到第一页
    staffPageState.inventory = 1;
    
    // 调用后端API，传递所有筛选参数
    fetchInventory({
        search: searchTerm,
        category: category,
        stock_level: stockLevel,
        hide_zero: hideZero,
        sort_by: sortBy
    });
}

// 重置筛选
function resetFilters() {
    document.getElementById('inventory-search').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('stock-filter').value = '';
    document.getElementById('sort-filter').value = 'title-asc';
    
    // 取消勾选hideZeroStock
    const hideZeroCheckbox = document.getElementById('hide-zero-stock');
    if (hideZeroCheckbox) {
        hideZeroCheckbox.checked = false;
    }
    
    // 重新从后端获取数据（不带任何筛选）
    fetchInventory();
}

// 工具函数：格式化日期
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US');
}

// 工具函数：首字母大写
function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * 订单详情弹窗交互
 */
window.viewOrderDetails = async function (orderId) {
    try {
        const response = await fetch(`../api/staff/get_order_details.php?order_id=${orderId}`);
        const result = await response.json();

        if (result.success) {
            const order = result.data;

            // A. 填充基本信息
            document.getElementById('detail-order-id').textContent = `#${order.order_id}`;
            document.getElementById('detail-customer-name').textContent = order.customer_name;
            document.getElementById('detail-order-total').textContent = `¥${parseFloat(order.total_amount).toFixed(2)}`;

            // B. 更新状态显示样式
            const statusBadge = document.getElementById('detail-order-status-badge');
            const status = order.order_status.toLowerCase();
            statusBadge.className = `status-${status} inline-block px-3 py-1 rounded-full text-sm font-medium border`;
            statusBadge.textContent = status.toUpperCase();

            // 设置下拉菜单当前值
            const statusSelect = document.getElementById('detail-order-status-select');
            if (statusSelect) {
                statusSelect.value = status;
            }

            // C. 渲染书籍清单
            const tableBody = document.getElementById('order-items-table');
            tableBody.innerHTML = (order.items || []).map(item => `
                <tr>
                    <td class="px-4 py-2 text-sm text-gray-800 font-medium">${item.book_title}</td>
                    <td class="px-4 py-2 text-sm text-gray-500 font-mono">${item.isbn}</td>
                    <td class="px-4 py-2 text-sm text-center text-gray-600">x${item.quantity}</td>
                    <td class="px-4 py-2 text-sm text-right text-gray-800 font-semibold">¥${parseFloat(item.subtotal).toFixed(2)}</td>
                </tr>
            `).join('');

            // D. 显示弹窗
            const modal = document.getElementById('order-modal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error('Order Details Error:', error);
        alert("Failed to fetch order details");
    }
};

window.closeOrderModal = function () {
    const modal = document.getElementById('order-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.updateOrderStatus = async function () {
    const orderId = document.getElementById('detail-order-id').textContent.replace('#', '');
    const newStatus = document.getElementById('detail-order-status-select').value;

    if (!confirm(`Are you sure you want to update order #${orderId} status to ${newStatus}?`)) {
        return;
    }

    try {
        const response = await fetch('../api/staff/update_order_status.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order_id: orderId, status: newStatus })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`Order #${orderId} status updated to ${newStatus}`);
            fetchOrders(currentStaff.store_id); // 刷新列表
            closeOrderModal();
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error('Update Status Error:', error);
        alert("Failed to update order status");
    }
};

/**
 * 库存请求功能函数块
 */

// 关闭请求模态框
window.closeRequestModal = function () {
    const modal = document.getElementById('stock-request-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    // 重置表单
    document.getElementById('stock-request-form').reset();
    document.getElementById('request-items-body').innerHTML = `
        <tr>
            <td class="p-1">
                <input type="text" class="form-input text-xs item-title" placeholder="Search book..." list="book-suggestions" required>
            </td>
            <td class="p-1"><input type="text" class="form-input text-xs item-isbn" placeholder="ISBN" readonly></td>
            <td class="p-1"><input type="text" class="form-input text-xs item-sku" placeholder="SKU" readonly></td>
            <td class="p-1"><input type="number" class="form-input text-xs text-center item-qty" min="1" value="10" required></td>
            <td class="p-1 text-center">
                <button type="button" class="text-red-500 hover:text-red-700" onclick="this.closest('tr').remove()"><i class="fa fa-trash"></i></button>
            </td>
        </tr>`;
    
    // 重新绑定初始行的事件
    const initialTitleInput = document.querySelector('#request-items-body .item-title');
    if (initialTitleInput) {
        initialTitleInput.addEventListener('input', () => searchBooksForRequest(initialTitleInput));
        initialTitleInput.addEventListener('change', () => handleBookSelection(initialTitleInput));
    }
};

// 动态添加一行请求项
window.addRequestRow = function () {
    const tbody = document.getElementById('request-items-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="p-1">
            <input type="text" class="form-input text-xs item-title" placeholder="Search book..." list="book-suggestions" required>
        </td>
        <td class="p-1"><input type="text" class="form-input text-xs item-isbn" placeholder="ISBN" readonly></td>
        <td class="p-1"><input type="text" class="form-input text-xs item-sku" placeholder="SKU" readonly></td>
        <td class="p-1"><input type="number" class="form-input text-xs text-center item-qty" min="1" value="10" required></td>
        <td class="p-1 text-center">
            <button type="button" class="text-red-500 hover:text-red-700" onclick="this.closest('tr').remove()"><i class="fa fa-trash"></i></button>
        </td>
    `;
    tbody.appendChild(tr);

    // 绑定搜索建议事件
    const titleInput = tr.querySelector('.item-title');
    titleInput.addEventListener('input', () => searchBooksForRequest(titleInput));
    titleInput.addEventListener('change', () => handleBookSelection(titleInput));
};

// 搜索书籍并填充建议列表
async function searchBooksForRequest(input) {
    const term = input.value.trim();
    if (term.length < 2) return;

    try {
        const response = await fetch(`../api/staff/get_inventory.php?search=${encodeURIComponent(term)}&store_id=${currentStaff.store_id}`);
        const result = await response.json();

        if (result.success) {
            const datalist = document.getElementById('book-suggestions');
            const suggestions = result.data.slice(0, 10);
            datalist.innerHTML = suggestions.map(book => 
                `<option value="${book.book_name}">`
            ).join('');
            
            // 存储这些数据以便后续填充
            input._suggestions = suggestions;
        }
    } catch (error) {
        console.error('Search Error:', error);
    }
}

// 当用户选择建议时填充字段
function handleBookSelection(input) {
    const val = input.value;
    const suggestions = input._suggestions || [];
    const book = suggestions.find(b => b.book_name === val);
    
    if (book) {
        const row = input.closest('tr');
        row.querySelector('.item-isbn').value = book.ISBN || '';
        row.querySelector('.item-sku').value = book.sku_id || '';
    }
}

// 提交库存请求
async function submitStockRequest() {
    const rows = document.querySelectorAll('#request-items-body tr');
    const items = [];

    rows.forEach(row => {
        const skuInput = row.querySelector('.item-sku');
        const isbnInput = row.querySelector('.item-isbn');
        const qtyInput = row.querySelector('.item-qty');

        const skuId = skuInput ? skuInput.value.trim() : '';
        const isbn = isbnInput ? isbnInput.value.trim() : '';
        const qty = qtyInput ? qtyInput.value.trim() : '';

        if ((skuId || isbn) && qty) {
            items.push({
                sku_id: skuId ? parseInt(skuId) : null,
                isbn: isbn,
                quantity: parseInt(qty)
            });
        }
    });

    const notes = document.getElementById('request-notes').value;

    if (items.length === 0) {
        alert("Please add items.");
        return;
    }

    try {
        const response = await fetch('../api/staff/create_stock_request.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: items, note: notes })
        });

        const result = await response.json();

        if (result.success) {
            alert("Stock Request Submitted Successfully!");
            closeRequestModal();
            fetchStockRequests(currentStaff.store_id);
        } else {
            alert("Error: " + result.message);
        }
    } catch (e) {
        console.error(e);
    }
}

/**
 * 完成补货请求 (收货)
 */
window.completeRequest = async function (requestId) {
    if (!confirm(`Are you sure you have received the items for request #${requestId}?`)) {
        return;
    }

    try {
        const response = await fetch('../api/staff/complete_stock_request.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ request_id: requestId })
        });

        const result = await response.json();

        if (result.success) {
            showNotification(`Request #${requestId} marked as completed`);
            fetchStockRequests(currentStaff.store_id); // 刷新列表
        } else {
            alert("Error: " + result.message);
        }
    } catch (error) {
        console.error('Complete Request Error:', error);
        alert("Failed to complete request");
    }
};

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}