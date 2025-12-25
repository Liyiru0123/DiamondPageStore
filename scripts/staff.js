// scripts/staff.js

/**
 * ------------------------------------------------------------------
 * 1. 全局切换页面函数 (必须挂载在 window 上，因为 layout.js 生成的 HTML onclick 会调用它)
 * ------------------------------------------------------------------
 */
window.switchPage = function(pageId) {
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
//const books = [
//    { id: 1, title: "The Great Gatsby", author: "F. Scott Fitzgerald", isbn: "9780743273565", category: "fiction", price: 15.99, stock: 12 },
//    { id: 2, title: "Sapiens: A Brief History of Humankind", author: "Yuval Noah Harari", isbn: "9780062316097", category: "non-fiction", price: 19.99, stock: 8 },
//    { id: 3, title: "A Brief History of Time", author: "Stephen Hawking", isbn: "9780553380163", category: "science", price: 14.99, stock: 3 },
//    { id: 4, title: "1984", author: "George Orwell", isbn: "9780451524935", category: "fiction", price: 12.99, stock: 25 },
//    { id: 5, title: "The Diary of a Young Girl", author: "Anne Frank", isbn: "9780553573404", category: "biography", price: 11.99, stock: 5 },
//    { id: 6, title: "To Kill a Mockingbird", author: "Harper Lee", isbn: "9780061120084", category: "fiction", price: 13.99, stock: 18 },
//    { id: 7, title: "The Theory of Everything", author: "Stephen Hawking", isbn: "9780553380163", category: "science", price: 16.99, stock: 2 },
//    { id: 8, title: "Educated", author: "Tara Westover", isbn: "9780399590504", category: "biography", price: 17.99, stock: 10 },
//    { id: 9, title: "The Guns of August", author: "Barbara W. Tuchman", isbn: "9780345476098", category: "history", price: 21.99, stock: 7 },
//    { id: 10, title: "Pride and Prejudice", author: "Jane Austen", isbn: "9780141439518", category: "fiction", price: 9.99, stock: 32 }
//];

// A. 获取库存数据的函数
async function fetchInventory() {
    try {
        // 请求 PHP API
        const response = await fetch(`../api/staff/inventory.php?store_id=${CURRENT_STORE_ID}`);
        const result = await response.json();

        if (result.success) {
            globalBooks = result.data; // 保存数据供 render 使用
            renderInventory(globalBooks);
            renderLowStockItems(globalBooks);
            updateDashboardStats(globalBooks); // 更新仪表盘数字
        } else {
            console.error('Error:', result.message);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}
//const orders = [
//    { id: 1001, customer: "John Smith", date: "2023-06-15", items: 3, total: 45.97, status: "shipped" },
//    { id: 1002, customer: "Jane Doe", date: "2023-06-16", items: 2, total: 32.50, status: "processing" },
//    { id: 1003, customer: "Robert Johnson", date: "2023-06-16", items: 1, total: 15.99, status: "pending" },
//    { id: 1004, customer: "Emily Davis", date: "2023-06-15", items: 4, total: 67.96, status: "delivered" },
//    { id: 1005, customer: "Michael Brown", date: "2023-06-14", items: 2, total: 29.98, status: "cancelled" }
//];

// B. 获取订单数据的函数
async function fetchOrders() {
    try {
        const response = await fetch(`../api/staff/orders.php?store_id=${CURRENT_STORE_ID}`);
        const result = await response.json();

        if (result.success) {
            renderOrders(result.data);
            renderRecentOrders(result.data); // 复用数据渲染仪表盘
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
    const book = {
        title: document.getElementById('book-title').value,
        author: document.getElementById('book-author').value,
        isbn: document.getElementById('book-isbn').value,
        category: document.getElementById('book-category').value,
        price: parseFloat(document.getElementById('book-price').value),
        stock: parseInt(document.getElementById('book-stock').value)
    };

    if (id) {
        // 编辑现有书籍
        const index = books.findIndex(b => b.id === parseInt(id));
        if (index !== -1) {
            book.id = parseInt(id);
            books[index] = book;
        }
    } else {
        // 新增书籍
        book.id = books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1;
        books.push(book);
    }

    // 更新界面
    renderInventory();
    renderLowStockItems();
    closeBookModal();
}

// 渲染 Dashboard: 近期订单
function renderRecentOrders() {
    const recentOrdersList = document.getElementById('recent-orders-list');
    if (!recentOrdersList) return;
    recentOrdersList.innerHTML = '';

    const recent = orders.slice(0, 5);
    recent.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.customer}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.items}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-${order.status}">${capitalize(order.status)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥${order.total.toFixed(2)}</td>
        `;
        recentOrdersList.appendChild(row);
    });
}

// 渲染 Dashboard: 低库存预警
function renderLowStockItems() {
    const lowStockList = document.getElementById('low-stock-list');
    if (!lowStockList) return;
    lowStockList.innerHTML = '';

    const lowStockItems = books.filter(book => book.stock <= 5);
    lowStockItems.forEach(book => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${book.title}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${book.isbn}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${book.stock}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button class="text-primary hover:text-primary/80 edit-book-btn" data-id="${book.id}">
                    <i class="fa fa-refresh mr-1"></i> Restock
                </button>
            </td>
        `;
        lowStockList.appendChild(row);
    });

    bindDynamicEvents(); // 绑定动态生成的按钮事件
}


// scripts/staff.js 的修正片段

function renderInventory(data) {
    const inventoryList = document.getElementById('inventory-list');
    const totalCount = document.getElementById('total-inventory-count');

    if (!inventoryList) return;
    inventoryList.innerHTML = ''; // 清空原有内容

    if (totalCount) totalCount.textContent = data.length;

    if (data.length === 0) {
        inventoryList.innerHTML = '<tr><td colspan="8" class="text-center py-4">No inventory found</td></tr>';
        return;
    }

    data.forEach(item => {
        // 根据库存数量决定颜色
        const stock = parseInt(item.quantity);
        let stockStatus = 'high';
        if (stock <= 5) stockStatus = 'low';
        else if (stock <= 20) stockStatus = 'medium';

        const row = document.createElement('tr');
        // 注意：这里使用的是 PHP 返回的字段名 (book_name, publisher 等)
        row.innerHTML = `
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${item.book_name}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${item.publisher || '-'}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${item.ISBN}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${item.bingding || 'Paperback'}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">¥${parseFloat(item.unit_price).toFixed(2)}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${stock}</td>
            <td class="px-4 py-3 whitespace-nowrap">
                <span class="status-${stockStatus}">${capitalize(stockStatus)}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm">
                <button class="text-red-600 hover:text-red-700 delete-book-btn" data-id="${item.batch_id}">
                    <i class="fa fa-trash"></i> Delete
                </button>
            </td>
        `;
        inventoryList.appendChild(row);
    });

    // 绑定新生成的按钮事件
    bindDynamicEvents();
}




function updateDashboardStats(data) {
    // Calculate totals from the live data
    const totalBooks = data.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
    const lowStockCount = data.filter(item => parseInt(item.quantity) <= 5).length;

    // Update DOM elements
    const totalEl = document.getElementById('total-books');
    const lowStockEl = document.getElementById('low-stock-books');

    if (totalEl) totalEl.textContent = totalBooks;
    if (lowStockEl) lowStockEl.textContent = lowStockCount;

    // Note: Pending orders and sales would typically come from fetchOrders()
}


// 渲染 Orders: 订单列表
function renderOrders() {
    const ordersList = document.getElementById('orders-list');
    if (!ordersList) return;
    ordersList.innerHTML = '';

    orders.forEach(order => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">#${order.id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.customer}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatDate(order.date)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${order.items}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">¥${order.total.toFixed(2)}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="status-${order.status}">${capitalize(order.status)}</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
                <button class="text-primary hover:text-primary/80 mr-3">
                    <i class="fa fa-eye"></i> View
                </button>
                <button class="text-green-600 hover:text-green-700">
                    <i class="fa fa-check"></i> Update
                </button>
            </td>
        `;
        ordersList.appendChild(row);
    });
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
        btn.onclick = function() {
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

// 筛选功能 (模拟)
function applyFilters() {
    alert('Filters applied! (Demo only)');
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