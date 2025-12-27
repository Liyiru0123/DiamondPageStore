// scripts/staff.js

// 管理各功能区的当前页码
let staffPageState = {
    inventory: 1,
    orders: 1
};

/**
 * ------------------------------------------------------------------
 * 1. 全局切换页面函数 (必须挂载在 window 上，因为 layout.js 生成的 HTML onclick 会调用它)
 * ------------------------------------------------------------------
 */
window.switchPage = function (pageId) {
    // 1. 隐藏所有页面内容
    document.querySelectorAll('.page-content').forEach(el => {
        el.classList.add('hidden');
    });

    // 2. 显示目标页面
    const targetPage = document.getElementById(pageId + '-page');
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error(`Page ID "${pageId}-page" not found.`);
    }

    // 3. 更新侧边栏激活状态
    // 基础样式 (必须与 layout.js 中的定义一致)
    const baseClasses = "flex items-center gap-3 px-4 py-3 text-gray-700 rounded-lg transition-all duration-300 hover:bg-accent/20 hover:text-primary cursor-pointer mb-1";
    const activeClasses = "bg-accent/30 text-primary font-medium";

    const allLinks = document.querySelectorAll('#sidebar div[data-page]');
    allLinks.forEach(link => {
        // 重置样式
        link.className = baseClasses;
        // 如果是当前页，追加激活样式
        if (link.getAttribute('data-page') === pageId) {
            link.className = `${baseClasses} ${activeClasses}`;
        }
    });
};

const CURRENT_STORE_ID = 1; // 假设当前登录的是 1号店 (Downtown Store)
let globalBooks = [];       // 用于前端搜索和过滤的本地缓存
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

// A. 获取库存数据的函数
async function fetchInventory() {
    try {
        // TODO: 待替换为后端接口 - 需传递 CURRENT_STORE_ID
        // const response = await fetch(`../api/staff/inventory.php?store_id=${CURRENT_STORE_ID}`);
        // const result = await response.json();

        // 模拟 API 延迟响应
        const result = { success: true, data: mockInventory };

        if (result.success) {
            globalBooks = result.data;
            renderInventory(globalBooks);
            renderLowStockItems(globalBooks);
            // 这里只传库存数据，等 fetchOrders 执行后再更新仪表盘完整状态
            updateDashboardStats(globalBooks, []);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// B. 获取订单数据的函数
async function fetchOrders() {
    try {
        // TODO: 待替换为后端接口
        // const response = await fetch(`../api/staff/orders.php?store_id=${CURRENT_STORE_ID}`);
        // const result = await response.json();

        const result = { success: true, data: mockOrders }; // 使用刚才定义的 mockOrders

        if (result.success) {
            renderOrders(result.data);
            renderRecentOrders(result.data);
            updateDashboardStats(globalBooks, result.data);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

const stockRequests = [
    { id: 501, dateRequested: "2023-06-10", items: 5, status: "pending", expectedDelivery: "2023-06-20" },
    { id: 502, dateRequested: "2023-06-05", items: 3, status: "delivered", expectedDelivery: "2023-06-12" },
    { id: 503, dateRequested: "2023-05-28", items: 7, status: "delivered", expectedDelivery: "2023-06-05" }
];

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
}

/**
 * ------------------------------------------------------------------
 * 5. 业务逻辑函数 (Helper Functions)
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

// 保存书籍 (新增或编辑)
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

// 渲染 Dashboard: 近期订单 (仅本门店)
function renderRecentOrders(data) {
    const recentOrdersList = document.getElementById('recent-orders-list');
    if (!recentOrdersList || !data) return;
    recentOrdersList.innerHTML = '';

    // 取传入数据的前 5 笔
    const recent = data.slice(0, 5);

    recent.forEach(order => {
        const row = document.createElement('tr');
        // 兼容后端字段 order_id 或前端模拟字段 id
        const displayId = order.order_id || order.id;
        const displayDate = order.order_date || order.date;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${displayId}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-${order.status.toLowerCase()}">${capitalize(order.status)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(displayDate)}</td>
        `;
        recentOrdersList.appendChild(row);
    });

    if (recent.length === 0) {
        recentOrdersList.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-400">No recent orders</td></tr>';
    }
}

// 渲染 Dashboard: 低库存预警
function renderLowStockItems(inventoryData) {
    const lowStockList = document.getElementById('low-stock-list');
    if (!lowStockList) return;
    lowStockList.innerHTML = '';

    // 严格筛选库存等于 1 的书籍
    const criticalItems = inventoryData.filter(item => parseInt(item.quantity) === 1);

    criticalItems.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${item.book_name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.category || item.binding || 'General'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button class="text-primary hover:text-primary/80" onclick="switchPage('inventory')">
                    <i class="fa fa-plus-square mr-1"></i> Restock
                </button>
            </td>
        `;
        lowStockList.appendChild(row);
    });

    if (criticalItems.length === 0) {
        lowStockList.innerHTML = '<tr><td colspan="3" class="text-center py-4 text-gray-400">No critical stock items</td></tr>';
    }
}


// scripts/staff.js 的修正片段
function renderInventory(data) {
    const inventoryList = document.getElementById('inventory-list');
    if (!inventoryList) return;

    // 1. 确定数据源
    const sourceData = data || globalBooks;
    const pageSize = 10;

    // 2. 获取分页后的切片数据 (使用 common.js 中的工具函数)
    const paginatedData = getPaginatedData(sourceData, staffPageState.inventory, pageSize);

    // 3. 直接渲染行内容
    inventoryList.innerHTML = paginatedData.map(item => {
        // 兼容处理：字段可能来自后端 (book_name) 或前端 mock (title)
        const title = item.book_name || item.title || 'Unknown Title';
        const batch = item.batch_number || item.batch_id || '-';
        const author = item.publisher || item.author || '-';
        const isbn = item.ISBN || item.isbn || '-';
        const category = item.category || item.binding || '-';
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
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${category}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-semibold">¥${price}</td>
                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${stock}</td>
                <td class="px-4 py-3 whitespace-nowrap">
                    <span class="status-${stockStatus}">${capitalize(stockStatus)}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap text-sm">
                    <button class="text-primary hover:text-primary/80 mr-3 edit-book-btn" data-id="${item.batch_id || item.id}">
                        <i class="fa fa-edit"></i> Edit
                    </button>
                    <button class="text-red-600 hover:text-red-700 delete-book-btn" data-id="${item.batch_id || item.id}">
                        <i class="fa fa-trash"></i> Delete
                    </button>
                </td>
            </tr>`;
    }).join('');

    // 4. 更新分页控制条 (确保 staff.html 中有 inventory-pagination-controls 容器)
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

    // 5. 重新绑定动态生成的按钮事件 (Edit/Delete)
    bindDynamicEvents();
}


function updateDashboardStats(inventoryData = [], ordersData = []) {
    // 统计总库存件数
    const totalBooks = inventoryData.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
    // 统计库存严格等于 1 的书籍
    const lowStockCount = inventoryData.filter(item => parseInt(item.quantity) === 1).length;
    // 统计本门店订单总数
    const totalOrders = ordersData.length;

    const totalEl = document.getElementById('total-books');
    const lowStockEl = document.getElementById('low-stock-books');
    const ordersEl = document.getElementById('total-orders-count');

    if (totalEl) totalEl.textContent = totalBooks.toLocaleString();
    if (lowStockEl) lowStockEl.textContent = lowStockCount;
    if (ordersEl) ordersEl.textContent = totalOrders.toLocaleString();
}


// 渲染 Orders: 订单列表 (完整列表页)
function renderOrders(data) {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;

    const sourceData = data || mockOrders;
    const pageSize = 10;

    const paginatedData = getPaginatedData(sourceData, staffPageState.orders, pageSize);

    // 修改 staff.js 中的 renderOrders 函数片段
    ordersList.innerHTML = paginatedData.map(order => {
        // 确保内外数据统一：如果 book_list 存在，重新计算 items 和 total（可选，增加健壮性）
        const itemCount = order.book_list ? order.book_list.reduce((sum, b) => sum + b.qty, 0) : order.items;
        const totalAmount = order.book_list ? order.book_list.reduce((sum, b) => sum + (b.qty * b.price), 0) : order.total;

        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.order_id || order.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.customer || 'Guest'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(order.order_date || order.date)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${itemCount} items</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-semibold">¥${totalAmount.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-${order.status.toLowerCase()} border px-2 py-1 rounded-full text-xs font-medium">
                    ${order.status.toUpperCase()}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button onclick="viewOrderDetails(${order.order_id || order.id})" class="btn-secondary py-1 px-3 text-xs flex items-center gap-1">
                    <i class="fa fa-eye"></i> View Details
                </button>
            </td>
        </tr>`;
    }).join('');

    renderPaginationControls(
        'orders-pagination-controls',
        sourceData.length,
        staffPageState.orders,
        (newPage) => {
            staffPageState.orders = newPage;
            renderOrders(sourceData);
        }
    );
}

// 渲染 Stock Requests
function renderStockRequests() {
    const pendingList = document.getElementById('pending-requests-list');
    const prevList = document.getElementById('previous-requests-list');

    if (!pendingList || !prevList) return;

    pendingList.innerHTML = '';
    prevList.innerHTML = '';

    stockRequests.forEach(request => {
        const row = document.createElement('tr');
        const isPending = request.status === 'pending';
        const dateField = isPending ? 'expectedDelivery' : 'deliveredDate';
        const displayDate = request[dateField] || request.expectedDelivery;

        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">#${request.id}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatDate(request.dateRequested)}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${request.items}</td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="status-${request.status}">${capitalize(request.status)}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatDate(displayDate)}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
                <button class="text-primary hover:text-primary/80">
                    <i class="fa fa-eye"></i> View
                </button>
                ${isPending ? `
                    <button class="text-green-600 hover:text-green-700 ml-2">
                        <i class="fa fa-check"></i> Complete
                    </button>
                ` : ''}
            </td>
        `;

        if (isPending) pendingList.appendChild(row);
        else prevList.appendChild(row);
    });
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