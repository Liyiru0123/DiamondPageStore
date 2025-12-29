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
let globalBooks = [];
let globalOrders = [];      // 用于前端搜索和过滤的本地缓存

/**
 * ------------------------------------------------------------------
 * 1. 初始化逻辑 (入口)
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
            // 成功逻辑保持不变
            currentStaff = result.data;
            const headerStoreEl = document.getElementById('header-store-name');
            if (headerStoreEl) headerStoreEl.textContent = currentStaff.store_name;
            const headerUserEl = document.getElementById('header-user-name');
            if (headerUserEl) headerUserEl.textContent = currentStaff.full_name;

            fetchInventory(currentStaff.store_id);
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
// A. 获取库存数据的函数
async function fetchInventory(storeId) {
    if (!storeId) return;
    try {
        // GET 请求可以通过 URL 参数传递 store_id
        const response = await fetch(`../api/staff/get_inventory.php?store_id=${storeId}`);
        const result = await response.json();

        if (result.success) {
            globalBooks = result.data;
            renderInventory(globalBooks);
            renderLowStockItems(globalBooks);
            updateDashboardStats(globalBooks, globalOrders);
        }
    } catch (error) {
        console.error('Inventory Error:', error);
    }
}

// B. 获取订单数据的函数
async function fetchOrders(storeId) {
    if (!storeId) return;
    try {
        const response = await fetch(`../api/staff/get_orders.php?store_id=${storeId}`);
        const result = await response.json();

        if (result.success) {
            globalOrders = result.data;

            console.log("Orders Fetched:", globalOrders.length);

            // 渲染表格
            renderOrders(globalOrders);
            renderRecentOrders(globalOrders);

            // 再次调用统计更新，把刚才拿到的 Orders 传进去
            // (注意：这里要传 globalBooks，以防库存数据被覆盖为空)
            updateDashboardStats(globalBooks, globalOrders);
        }
    } catch (error) {
        console.error('Orders Error:', error);
    }
}

// C. 获取进货申请的函数
async function fetchStockRequests(storeId) {
    if (!storeId) return;
    try {
        const response = await fetch(`../api/staff/get_stock_requests.php?store_id=${storeId}`);
        const result = await response.json();

        if (result.success) {
            renderStockRequests(result.data);
        }
    } catch (error) {
        console.error('Requests Error:', error);
    }
}

/**
 * ------------------------------------------------------------------
 * 3. 页面初始化 (DOM Ready)
 * ------------------------------------------------------------------
 */
document.addEventListener('DOMContentLoaded', () => {
    // 设置当前日期
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const now = new Date();
        currentDateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    // 渲染所有数据表格
    // 替换原来的 render 调用，改为 fetch
    fetchInventory();
    fetchOrders();
    renderStockRequests();

    // 绑定页面内部的事件 (Modal, Filters 等)
    setupInternalEventListeners();
});

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

    // 在 setupInternalEventListeners 函数中插入
    const newRequestBtn = document.getElementById('new-request-btn');
    if (newRequestBtn) {
        newRequestBtn.addEventListener('click', () => {
            const modal = document.getElementById('stock-request-modal');
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        });
    }

    const submitRequestBtn = document.getElementById('submit-request-btn');
    if (submitRequestBtn) {
        submitRequestBtn.addEventListener('click', submitStockRequest);
    }
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

    // 3. 渲染行内容
    inventoryList.innerHTML = paginatedData.map(item => {
        const title = item.book_name || item.title || 'Unknown Title';
        const batch = item.batch_number || item.batch_id || '-';
        const author = item.publisher || item.author || '-';
        const isbn = item.ISBN || item.isbn || '-';
        
        // 确保 category 存在，如果为空显示 Uncategorized
        const category = item.category || 'Uncategorized';
        
        const price = parseFloat(item.unit_price || item.price || 0).toFixed(2);
        const stock = parseInt(item.quantity || item.stock || 0);

        // 库存状态颜色逻辑
        let stockStatus = stock <= 5 ? 'low' : (stock <= 20 ? 'medium' : 'high');

        return `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div class="font-bold text-brown-dark">${title}</div>
                    <div class="text-[10px] text-gray-400 uppercase tracking-tighter">Batch: ${batch}</div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${author}</td>
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
                    <button class="text-primary hover:text-primary/80 edit-book-btn" data-id="${item.batch_id || item.id}">
                        <i class="fa fa-edit"></i> Edit
                    </button>
                </td>
            </tr>`;
    }).join('');

    // 4. 更新分页控制条
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

    // 5. 重新绑定事件
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
    ordersList.innerHTML = paginatedData.map(order => {
        // 数据库返回的 total_amount 可能是字符串，转换成浮点数以防万一
        const total = parseFloat(order.total_amount || 0);

        // 状态样式兼容：数据库是 created/paid，CSS 类名是 status-created 等
        const statusClass = `status-${(order.order_status || 'created').toLowerCase()}`;

        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                #${order.order_id}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${order.customer_name || 'Guest'}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${formatDate(order.order_date)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                ${order.items_count} items
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">
                ¥${total.toFixed(2)}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="${statusClass} border px-2 py-1 rounded-full text-xs font-medium">
                    ${(order.order_status || '').toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="viewOrderDetails(${order.order_id})" class="btn-secondary py-1 px-3 text-xs flex items-center gap-1">
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

    // 数据源：如果是从 API 获取的 data 则使用，否则暂时为空 (不再使用 stockRequests mock 数据)
    const sourceData = data || [];

    sourceData.forEach(request => {
        const row = document.createElement('tr');

        // 数据库状态: pending, approved, rejected, completed
        const isPending = request.status === 'pending';

        // 数据库里没有 delivery_date，如果是 completed 我们可以用 update_date (如果有的话)，否则暂无
        // 这里暂时统一显示 purchase_date
        const displayDate = formatDate(request.purchase_date);

        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                #${request.purchase_id}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                ${displayDate}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <!-- 这里假设后端SQL使用了 COUNT(*) as total_items -->
                ${request.total_items || request.items || 0} 
            </td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="status-${(request.status || 'pending').toLowerCase()}">
                    ${capitalize(request.status)}
                </span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                ${isPending ? 'Pending Approval' : displayDate}
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
                <button class="text-primary hover:text-primary/80">
                    <i class="fa fa-eye"></i> View
                </button>
                ${request.status === 'approved' ? `
                    <button class="text-green-600 hover:text-green-700 ml-2" onclick="completePurchase(${request.purchase_id})">
                        <i class="fa fa-check"></i> Receive
                    </button>
                ` : ''}
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


// 绑定动态生成的按钮事件 (Edit/Delete)
function bindDynamicEvents() {
    document.querySelectorAll('.edit-book-btn').forEach(btn => {
        btn.onclick = function () {
            const id = this.getAttribute('data-id');
            editBook(id);
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
function saveBook() {
    const id = document.getElementById('book-id').value;
    // 获取批次号字段
    const batchNum = document.getElementById('book-batch').value;

    const bookData = {
        batch_id: id || Date.now(), // 模拟主键
        batch_number: batchNum,     // 批次号
        book_name: document.getElementById('book-title').value,
        publisher: document.getElementById('book-author').value,
        ISBN: document.getElementById('book-isbn').value,
        category: document.getElementById('book-category').value,
        unit_price: parseFloat(document.getElementById('book-price').value),
        quantity: parseInt(document.getElementById('book-stock').value)
    };

    if (id) {
        const index = globalBooks.findIndex(b => (b.batch_id || b.id) == id);
        if (index !== -1) globalBooks[index] = bookData;
    } else {
        globalBooks.unshift(bookData);
    }

    // TODO: 待对接后端接口 (POST /api/inventory/save)
    renderInventory(globalBooks);
    closeBookModal();
    showNotification(id ? "Record Updated" : "New Batch Added");
}

// 编辑书籍：填充表单
function editBook(id) {
    const book = globalBooks.find(b => b.batch_id == id);
    const bookModal = document.getElementById('book-modal');
    if (book && bookModal) {
        document.getElementById('modal-title').textContent = 'Edit Book';
        document.getElementById('book-id').value = book.id;
        document.getElementById('book-title').value = book.title;
        document.getElementById('book-author').value = book.author;
        document.getElementById('book-isbn').value = book.isbn;
        document.getElementById('book-category').value = book.category;
        document.getElementById('book-price').value = book.price;
        document.getElementById('book-stock').value = book.stock;

        bookModal.classList.remove('hidden');
        bookModal.classList.add('flex');
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

// 筛选功能
function applyFilters() {
    const searchTerm = document.getElementById('inventory-search').value.toLowerCase();
    const category = document.getElementById('category-filter').value;
    const stockLevel = document.getElementById('stock-filter').value;
    const sortBy = document.getElementById('sort-filter').value;

    let filtered = globalBooks.filter(item => {
        const title = (item.book_name || item.title || '').toLowerCase();
        const isbn = (item.ISBN || item.isbn || '');
        const matchesSearch = title.includes(searchTerm) || isbn.includes(searchTerm);

        const matchesCategory = !category || (item.category === category);

        let matchesStock = true;
        const stock = parseInt(item.quantity || item.stock || 0);
        if (stockLevel === 'low') matchesStock = stock <= 5;
        else if (stockLevel === 'medium') matchesStock = stock > 5 && stock <= 20;
        else if (stockLevel === 'high') matchesStock = stock > 20;

        return matchesSearch && matchesCategory && matchesStock;
    });

    // 执行排序逻辑
    filtered.sort((a, b) => {
        const priceA = parseFloat(a.unit_price || a.price || 0);
        const priceB = parseFloat(b.unit_price || b.price || 0);
        const stockA = parseInt(a.quantity || a.stock || 0);
        const stockB = parseInt(b.quantity || b.stock || 0);
        const titleA = (a.book_name || a.title || '');
        const titleB = (b.book_name || b.title || '');

        switch (sortBy) {
            case 'title-asc': return titleA.localeCompare(titleB);
            case 'title-desc': return titleB.localeCompare(titleA);
            case 'price-asc': return priceA - priceB;
            case 'price-desc': return priceB - priceA;
            case 'stock-asc': return stockA - stockB;
            case 'stock-desc': return stockB - stockA;
            default: return 0;
        }
    });

    staffPageState.inventory = 1; // 筛选后重置到第一页
    renderInventory(filtered);
}

// 重置筛选
function resetFilters() {
    document.getElementById('inventory-search').value = '';
    document.getElementById('category-filter').value = '';
    document.getElementById('stock-filter').value = '';
    document.getElementById('sort-filter').value = 'title';
    renderInventory();
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
window.viewOrderDetails = function (orderId) {
    const order = mockOrders.find(o => (o.order_id || o.id) == orderId);
    if (!order) return;

    // A. 填充基本信息
    document.getElementById('detail-order-id').textContent = `#${orderId}`;
    document.getElementById('detail-customer-name').textContent = order.customer;
    document.getElementById('detail-order-total').textContent = `¥${order.total.toFixed(2)}`;

    // B. 更新状态显示样式 (只读)
    const statusBadge = document.getElementById('detail-order-status-badge');
    statusBadge.className = `status-${order.status.toLowerCase()} inline-block px-3 py-1 rounded-full text-sm font-medium border`;
    statusBadge.textContent = order.status.toUpperCase();

    // C. 渲染书籍清单 (增加 ISBN 列)
    const tableBody = document.getElementById('order-items-table');
    tableBody.innerHTML = (order.book_list || []).map(item => `
        <tr>
            <td class="px-4 py-2 text-sm text-gray-800 font-medium">${item.title}</td>
            <td class="px-4 py-2 text-sm text-gray-500 font-mono">${item.isbn}</td>
            <td class="px-4 py-2 text-sm text-center text-gray-600">x${item.qty}</td>
            <td class="px-4 py-2 text-sm text-right text-gray-800 font-semibold">¥${(item.qty * item.price).toFixed(2)}</td>
        </tr>
    `).join('');

    // D. 显示弹窗
    const modal = document.getElementById('order-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeOrderModal = function () {
    const modal = document.getElementById('order-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.updateOrderStatus = function () {
    const orderId = document.getElementById('detail-order-id').textContent.replace('#', '');
    const newStatus = document.getElementById('detail-order-status').value;

    // TODO: 待替换为后端更新接口 API (PATCH /api/orders/status)
    const orderIndex = mockOrders.findIndex(o => (o.order_id || o.id) == orderId);
    if (orderIndex !== -1) {
        mockOrders[orderIndex].status = newStatus;
        showNotification(`Order #${orderId} status updated to ${newStatus}`);
        renderOrders(); // 刷新列表
        closeOrderModal();
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
            <td class="p-2"><input type="text" class="form-input text-sm item-title" placeholder="Enter book title or ISBN" required></td>
            <td class="p-2"><input type="number" class="form-input text-sm text-center item-qty" min="1" value="10" required></td>
            <td class="p-2 text-center"><button type="button" class="text-red-500 hover:text-red-700" onclick="this.closest('tr').remove()"><i class="fa fa-trash"></i></button></td>
        </tr>`;
};

// 动态添加一行请求项
window.addRequestRow = function () {
    const tbody = document.getElementById('request-items-body');
    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td class="p-1"><input type="text" class="form-input text-xs item-title" placeholder="Title" required></td>
        <td class="p-1"><input type="text" class="form-input text-xs item-isbn" placeholder="ISBN"></td>
        <td class="p-1"><input type="text" class="form-input text-xs item-sku" placeholder="SKU"></td>
        <td class="p-1"><input type="number" class="form-input text-xs text-center item-qty" min="1" value="10" required></td>
        <td class="p-1 text-center">
            <button type="button" class="text-red-500 hover:text-red-700" onclick="this.closest('tr').remove()"><i class="fa fa-trash"></i></button>
        </td>
    `;
    tbody.appendChild(tr);
};

// 提交库存请求
async function submitStockRequest() {
    const rows = document.querySelectorAll('#request-items-body tr');
    const items = [];

    rows.forEach(row => {
        // 假设我们在输入框加了 data-sku-id 属性，或者用户直接输入了 SKU ID
        // 为了简化，这里假设输入框 class="item-sku" 填的就是 SKU ID (数字)
        const skuInput = row.querySelector('.item-sku');
        const qtyInput = row.querySelector('.item-qty');

        const skuId = skuInput.value;
        const qty = qtyInput.value;

        if (skuId && qty) {
            items.push({
                sku_id: parseInt(skuId),
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
            alert("Stock Request Submitted! ID: " + result.id);
            closeRequestModal();
            // 可以在这里刷新一下申请列表 fetchStockRequests()
        } else {
            alert("Error: " + result.message);
        }
    } catch (e) {
        console.error(e);
    }
}

function capitalize(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}