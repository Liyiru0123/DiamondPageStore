// Manager Dashboard JavaScript - 与layout.js整合版

/**
 * Manager 系统页面切换函数 (供layout.js调用)
 */
window.managerSwitchPage = function(pageId) {
    console.log('Manager switchPage called:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Load page-specific data
    if (pageId === 'inventory') {
        loadInventoryData();
    } else if (pageId === 'staff') {
        loadStaffData();
    } else if (pageId === 'pricing') {
        loadPricingData();
        initBookSearch();
    } else if (pageId === 'notifications') {
        loadNotifications();
    } else if (pageId === 'user-management') {
        loadUserManagementData();
    } else if (pageId === 'overview') {
        // 确保图表已初始化
        if (typeof initCharts === 'function') {
            setTimeout(initCharts, 100);
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Initialize date display
    initDateDisplay();

    // Initialize charts
    initCharts();

    // Initialize event listeners (移除与layout.js冲突的监听器)
    initEventListeners();

    // Load initial data
    loadInitialData();
});

// Initialize date display
function initDateDisplay() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateElem = document.getElementById('current-date');
    if (dateElem) dateElem.textContent = now.toLocaleDateString('en-US', options);
}

// Initialize charts
function initCharts() {
    // 1. 订单数对比图表
    const orderComparisonCtx = document.getElementById('order-comparison-chart');
    if (orderComparisonCtx) {
        const orderData = overviewData.branchOrderComparison;
        
        new Chart(orderComparisonCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: orderData.map(item => item.branch),
                datasets: [{
                    label: '订单数',
                    data: orderData.map(item => item.orders),
                    backgroundColor: [
                        'rgba(139, 90, 43, 0.7)',
                        'rgba(160, 82, 45, 0.7)',
                        'rgba(210, 105, 30, 0.7)',
                        'rgba(205, 133, 63, 0.7)',
                        'rgba(210, 180, 140, 0.7)',
                        'rgba(245, 222, 179, 0.7)'
                    ],
                    borderColor: [
                        '#8B5A2B',
                        '#A0522D',
                        '#D2691E',
                        '#CD853F',
                        '#D2B48C',
                        '#F5DEB3'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const data = orderData[context.dataIndex];
                                return `订单数: ${data.orders} (${data.trend} vs last month)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return value;
                            }
                        }
                    }
                }
            }
        });
    }

    // 2. 销售分析 - 支付方式对比图表
    const paymentMethodCtx = document.getElementById('payment-method-chart');
    if (paymentMethodCtx) {
        const paymentData = overviewData.paymentMethodComparison;
        
        new Chart(paymentMethodCtx.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: paymentData.map(item => `${item.method} (${item.percentage}%)`),
                datasets: [{
                    data: paymentData.map(item => item.amount),
                    backgroundColor: [
                        '#8B5A2B',  // Credit Card
                        '#A0522D',  // WeChat Pay
                        '#D2691E',  // Alipay
                        '#CD853F'   // Cash
                    ],
                    borderWidth: 0,
                    hoverOffset: 15
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle'
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const data = paymentData[context.dataIndex];
                                return `${data.method}: ¥${data.amount.toLocaleString()} (${data.percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // 3. 热销图书分类对比图表
    const bookCategoryCtx = document.getElementById('book-category-chart');
    if (bookCategoryCtx) {
        const categoryData = overviewData.bookCategoryComparison;
        
        new Chart(bookCategoryCtx.getContext('2d'), {
            type: 'bar',
            data: {
                labels: categoryData.map(item => item.category),
                datasets: [{
                    label: '销售额 (¥)',
                    data: categoryData.map(item => item.sales),
                    backgroundColor: categoryData.map(item => item.color),
                    borderColor: categoryData.map(item => {
                        // 深色边框
                        const hex = item.color.substring(1);
                        const r = parseInt(hex.substr(0, 2), 16);
                        const g = parseInt(hex.substr(2, 2), 16);
                        const b = parseInt(hex.substr(4, 2), 16);
                        return `rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`;
                    }),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const data = categoryData[context.dataIndex];
                                return `¥${data.sales.toLocaleString()} (${data.percentage}%)`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '¥' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    // 4. Sales Trend Chart (保留原有图表)
    const salesTrendCtx = document.getElementById('sales-trend-chart');
    if (salesTrendCtx) {
        new Chart(salesTrendCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Sales',
                    data: [12000, 15000, 13500, 14200, 16800, 18500, 17200],
                    borderColor: '#8B5A2B',
                    backgroundColor: 'rgba(139, 90, 43, 0.1)',
                    tension: 0.3,
                    fill: true,
                    pointRadius: 4,
                    pointBackgroundColor: '#8B5A2B'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: value => '¥' + value.toLocaleString() }
                    }
                }
            }
        });
    }

    // 5. Category Sales Chart (保留原有图表)
    const categorySalesCtx = document.getElementById('category-sales-chart');
    if (categorySalesCtx) {
        new Chart(categorySalesCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Children'],
                datasets: [{
                    data: [35, 25, 15, 12, 8, 5],
                    backgroundColor: ['#774b30', '#9f5933', '#a9805b', '#cca278', '#e1c7ac', '#e8dfce'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
}

// Initialize event listeners (移除与layout.js冲突的部分)
function initEventListeners() {
    // 注意: 侧边栏切换、导航、登出按钮现在由layout.js处理
    // 移除了以下冲突的监听器:
    // - sidebar-toggle
    // - sidebar-link[data-page]
    // - logout-btn

    // Trend period buttons
    document.querySelectorAll('.trend-period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.trend-period-btn').forEach(b => {
                b.classList.remove('bg-blue-600', 'text-white');
                b.classList.add('bg-gray-100', 'text-gray-700');
            });
            btn.classList.remove('bg-gray-100', 'text-gray-700');
            btn.classList.add('bg-blue-600', 'text-white');
        });
    });

    // Branch filter apply button
    document.getElementById('apply-branch-filter')?.addEventListener('click', function () {
        const branchFilterSelect = document.getElementById('branch-filter-select');
        filterInventoryByBranch(branchFilterSelect.value);
    });

    // Staff filter buttons
    document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
    document.getElementById('reset-filters')?.addEventListener('click', resetFilters);

    // Notification compose button
    document.getElementById('compose-notification-btn')?.addEventListener('click', () => {
        document.getElementById('compose-notification').classList.remove('hidden');
    });

    // Cancel notification button
    document.getElementById('cancel-notification')?.addEventListener('click', () => {
        document.getElementById('compose-notification').classList.add('hidden');
        document.getElementById('notification-form').reset();
    });

    // Notification form submission
    document.getElementById('notification-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        sendNotification();
    });

    // Edit book modal
    document.getElementById('cancel-edit-book')?.addEventListener('click', () => {
        document.getElementById('edit-book-modal').classList.add('hidden');
    });

    // Edit book form submission
    document.getElementById('edit-book-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        const bookTitle = document.getElementById('edit-book-title').value;
        alert(`Book "${bookTitle}" has been updated successfully!`);
        document.getElementById('edit-book-modal').classList.add('hidden');
    });

    // 添加书籍信息按钮
    document.getElementById('add-book-info-btn')?.addEventListener('click', () => {
        showAddBookModal();
    });

    // 取消添加书籍按钮
    document.getElementById('cancel-add-book')?.addEventListener('click', () => {
        document.getElementById('add-book-modal').classList.add('hidden');
        document.getElementById('add-book-form').reset();
    });

    // 添加书籍表单提交
    document.getElementById('add-book-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addNewBook();
    });

    // 初始化搜索框
    initSearchBoxes();

    // 用户管理搜索
    const userSearch = document.querySelector('#user-management-page input[placeholder*="Search users"]');
    if (userSearch) {
        const debouncedSearch = debounce(function(e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                performUserSearch(searchTerm);
            }
        }, 300);
        
        userSearch.addEventListener('input', debouncedSearch);
    }
}

// Show add book modal
function showAddBookModal() {
    document.getElementById('add-book-modal').classList.remove('hidden');
    
    // 清空表单
    document.getElementById('add-book-form').reset();
    
    // 生成一个新的SKU ID
    const newSkuId = generateNewSkuId();
    document.getElementById('add-book-sku').value = newSkuId;
}

// Generate new SKU ID
function generateNewSkuId() {
    const prefix = 'BK';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${year}${month}-${randomNum}`;
}

// Add new book
function addNewBook() {
    const title = document.getElementById('add-book-title').value;
    const isbn = document.getElementById('add-book-isbn').value;
    const author = document.getElementById('add-book-author').value;
    const publisher = document.getElementById('add-book-publisher').value;
    const language = document.getElementById('add-book-language').value;
    const category = document.getElementById('add-book-category').value;
    const sku = document.getElementById('add-book-sku').value;
    const price = document.getElementById('add-book-price').value;
    const comment = document.getElementById('add-book-comment').value;

    // 检查ISBN是否已存在
    const existingBook = pricingData.find(book => book.isbn === isbn);
    if (existingBook) {
        alert('A book with this ISBN already exists! Please use a different ISBN.');
        return;
    }

    // 创建新的书籍对象
    const newBook = {
        title: title,
        isbn: isbn,
        currentPrice: price.startsWith('¥') ? price : `¥${price}`,
        author: author,
        publisher: publisher,
        language: language,
        category: category,
        comment: comment,
        skuID: sku
    };

    // 添加到定价数据
    pricingData.push(newBook);

    // 重新加载定价数据
    loadPricingData();

    // 隐藏模态框并重置表单
    document.getElementById('add-book-modal').classList.add('hidden');
    document.getElementById('add-book-form').reset();

    alert(`Book "${title}" has been added successfully!`);
    
    // 滚动到表格顶部
    document.getElementById('pricing-table-body').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

// Load initial data
function loadInitialData() {
    // Overview页面数据会在图表初始化时自动加载
    loadBranchPerformance();
}

// Load branch performance data
function loadBranchPerformance() {
    const container = document.getElementById('branch-performance');
    if (container) {
        container.innerHTML = '';
        branchPerformance.forEach(branch => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';

            let performanceClass = 'bg-green-100 text-green-800';
            if (branch.performance === 'Good') performanceClass = 'bg-blue-100 text-blue-800';
            if (branch.performance === 'Average') performanceClass = 'bg-yellow-100 text-yellow-800';

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${branch.name}</td>
                <td class="px-4 py-4 text-sm">${branch.sales}</td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs ${performanceClass} rounded-full">${branch.performance}</span>
                </td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">${branch.status}</span>
                </td>
            `;
            container.appendChild(row);
        });
    }
}

// Load inventory data
function loadInventoryData() {
    const container = document.getElementById('inventory-table-body');
    if (container) {
        container.innerHTML = '';
        inventoryData.forEach(book => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';

            // Determine stock status for color coding
            let stockClass = '';
            let stockText = '';
            if (book.stock <= 5) {
                stockClass = 'text-red-600 font-medium';
                stockText = `${book.stock} (Low)`;
            } else if (book.stock <= 10) {
                stockClass = 'text-yellow-600';
                stockText = `${book.stock} (Medium)`;
            } else {
                stockClass = 'text-green-600';
                stockText = `${book.stock} (Good)`;
            }

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${book.title}</td>
                <td class="px-4 py-4 text-sm text-gray-500">${book.isbn}</td>
                <td class="px-4 py-4 text-sm font-mono">${book.sku}</td>
                <td class="px-4 py-4 text-sm">${book.branch}</td>
                <td class="px-4 py-4 text-sm ${stockClass}">${stockText}</td>
                <td class="px-4 py-4 text-sm">${book.lastRestock}</td>
                <td class="px-4 py-4 text-sm">
                    <div class="flex gap-2">
                        <button class="text-primary hover:text-primary/80" title="Edit">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button class="text-blue-600 hover:text-blue-800" title="Refresh Stock">
                            <i class="fa fa-refresh"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800" title="Delete">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            container.appendChild(row);
        });
    }

    // Add event listeners to action buttons
    addInventoryActionButtonListeners();
}

// Add event listeners to inventory action buttons
function addInventoryActionButtonListeners() {
    // Edit buttons
    document.querySelectorAll('#inventory-table-body .fa-edit').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            alert(`Editing: ${title}`);
        });
    });

    // Refresh buttons
    document.querySelectorAll('#inventory-table-body .fa-refresh').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            alert(`Refreshing stock for: ${title}`);
        });
    });

    // Delete buttons
    document.querySelectorAll('#inventory-table-body .fa-trash').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            if (confirm(`Are you sure you want to delete "${title}" from inventory?`)) {
                row.remove();
                alert(`"${title}" has been deleted from inventory.`);
            }
        });
    });
}

// Filter inventory by branch
function filterInventoryByBranch(branch) {
    // In a real app, this would filter the data
    console.log(`Filtering inventory by branch: ${branch}`);
    alert(`Filtering by branch: ${branch}`);
}

// Load staff data
function loadStaffData() {
    const container = document.getElementById('staff-table-body');
    if (container) {
        container.innerHTML = '';
        staffData.forEach(staff => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.dataset.staffId = staff.id;
            row.dataset.storeID = staff.storeID;
            row.dataset.position = staff.position;

            let roleClass = 'role-staff';
            if (staff.position === 'manager') roleClass = 'role-manager';
            if (staff.position === 'finance') roleClass = 'role-finance';

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${staff.employeeID}</td>
                <td class="px-4 py-4 text-sm">${staff.userID}</td>
                <td class="px-4 py-4 text-sm">${staff.branchName}</td>
                <td class="px-4 py-4 text-sm">${staff.name}</td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs ${roleClass} rounded-full">${staff.position}</span>
                </td>
                <td class="px-4 py-4 text-sm">${staff.phone}</td>
                <td class="px-4 py-4 text-sm">
                    <div class="flex gap-2">
                        <button class="text-primary hover:text-primary/80 edit-staff" title="Edit">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button class="text-blue-600 hover:text-blue-800 view-staff" title="View Details">
                            <i class="fa fa-eye"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 delete-staff" title="Delete">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            container.appendChild(row);
        });
    }

    // Add event listeners to action buttons
    addStaffActionButtonListeners();
}

// Add event listeners to staff action buttons
function addStaffActionButtonListeners() {
    // Edit buttons
    document.querySelectorAll('#staff-table-body .edit-staff').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = row.cells[3].textContent;
            alert(`Editing: ${name}`);
        });
    });

    // View buttons
    document.querySelectorAll('#staff-table-body .view-staff').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const employeeID = row.cells[0].textContent;
            const userID = row.cells[1].textContent;
            const branchName = row.cells[2].textContent;
            const name = row.cells[3].textContent;
            const position = row.cells[4].textContent;
            const phone = row.cells[5].textContent;

            alert(`Staff Details:\n\nEmployee ID: ${employeeID}\nUser ID: ${userID}\nBranch: ${branchName}\nName: ${name}\nPosition: ${position}\nPhone: ${phone}`);
        });
    });

    // Delete buttons
    document.querySelectorAll('#staff-table-body .delete-staff').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = row.cells[3].textContent;
            if (confirm(`Are you sure you want to delete "${name}" from staff records?`)) {
                row.remove();
                updateStaffCount();
                alert(`"${name}" has been deleted from staff records.`);
            }
        });
    });
}

// Apply filters
function applyFilters() {
    const branchFilter = document.getElementById('branch-filter').value;
    const positionFilter = document.getElementById('position-filter').value;

    const rows = document.querySelectorAll('#staff-table-body tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const branchMatch = branchFilter === 'all' || row.dataset.storeID === branchFilter;
        const positionMatch = positionFilter === 'all' || row.dataset.position === positionFilter;

        if (branchMatch && positionMatch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    updateStaffCount(visibleCount);
}

// Reset filters
function resetFilters() {
    document.getElementById('branch-filter').value = 'all';
    document.getElementById('position-filter').value = 'all';

    const rows = document.querySelectorAll('#staff-table-body tr');
    rows.forEach(row => {
        row.style.display = '';
    });

    updateStaffCount(rows.length);
}

// Update staff count
function updateStaffCount(count) {
    const staffCountElement = document.getElementById('staff-count');
    if (staffCountElement) {
        if (count !== undefined) {
            staffCountElement.textContent = count;
        } else {
            // If no count provided, calculate from visible rows
            const visibleRows = document.querySelectorAll('#staff-table-body tr:not([style*="display: none"])');
            staffCountElement.textContent = visibleRows.length;
        }
    }
}

// Load pricing data
function loadPricingData() {
    // 从 manager-data.js 中获取定价数据
    const tableContainer = document.getElementById('pricing-table-body');
    if (tableContainer) {
        tableContainer.innerHTML = '';
        pricingData.forEach(book => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.dataset.book = JSON.stringify(book);

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${book.title}</td>
                <td class="px-4 py-4 text-sm text-gray-500">${book.isbn}</td>
                <td class="px-4 py-4 text-sm">${book.currentPrice}</td>
                <td class="px-4 py-4 text-sm">
                    <div class="flex gap-2">
                        <button class="text-primary hover:text-primary/80 edit-book-btn" title="Edit">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button class="text-blue-600 hover:text-blue-800 refresh-price-btn" title="Refresh Price">
                            <i class="fa fa-refresh"></i>
                        </button>
                    </div>
                </td>
            `;
            tableContainer.appendChild(row);
        });
    }

    // Add event listeners to edit book buttons
    document.querySelectorAll('#pricing-table-body .edit-book-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const bookData = JSON.parse(row.dataset.book);
            openEditBookModal(bookData);
        });
    });

    // Add event listeners to refresh price buttons
    document.querySelectorAll('#pricing-table-body .refresh-price-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            alert(`Refreshing price for: ${title}`);
        });
    });
}

// Open edit book modal
function openEditBookModal(bookData) {
    document.getElementById('edit-book-title').value = bookData.title;
    document.getElementById('edit-book-isbn').value = bookData.isbn;
    document.getElementById('edit-book-author').value = bookData.author;
    document.getElementById('edit-book-publisher').value = bookData.publisher;
    document.getElementById('edit-book-language').value = bookData.language;
    document.getElementById('edit-book-category').value = bookData.category;
    document.getElementById('edit-book-sku').value = bookData.skuID;
    document.getElementById('edit-book-price').value = bookData.currentPrice;
    document.getElementById('edit-book-comment').value = bookData.comment;

    document.getElementById('edit-book-modal').classList.remove('hidden');
}

// Load notifications with edit and delete functionality
function loadNotifications() {
    const notificationsContainer = document.getElementById('notifications-list');
    if (notificationsContainer) {
        notificationsContainer.innerHTML = '';
        notifications.forEach(notification => {
            const notificationEl = document.createElement('div');
            notificationEl.className = 'bg-white p-4 rounded-lg border border-gray-200 relative';
            notificationEl.dataset.notificationId = notification.id;

            notificationEl.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center">
                        <h4 class="font-medium">${notification.title}</h4>
                    </div>
                    <span class="text-xs text-gray-500">${notification.date}</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">${notification.message}</p>
                <div class="flex justify-between items-center">
                    <div class="text-xs text-gray-500">
                        <span>To: ${notification.recipients}</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="text-primary hover:text-primary/80 edit-notification-btn" 
                                title="Edit" data-notification-id="${notification.id}">
                            <i class="fa fa-edit"></i> Edit
                        </button>
                        <button class="text-red-600 hover:text-red-800 delete-notification-btn" 
                                title="Delete" data-notification-id="${notification.id}">
                            <i class="fa fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
            notificationsContainer.appendChild(notificationEl);
        });

        // Add event listeners to edit notification buttons
        document.querySelectorAll('.edit-notification-btn').forEach(button => {
            button.addEventListener('click', function () {
                const notificationId = this.dataset.notificationId;
                editNotification(notificationId);
            });
        });

        // Add event listeners to delete notification buttons
        document.querySelectorAll('.delete-notification-btn').forEach(button => {
            button.addEventListener('click', function () {
                const notificationId = this.dataset.notificationId;
                deleteNotification(notificationId);
            });
        });
    }
}

// Edit notification
function editNotification(notificationId) {
    const notification = notifications.find(n => n.id == notificationId);
    if (!notification) return;

    // Create edit modal if it doesn't exist
    if (!document.getElementById('edit-notification-modal')) {
        createEditNotificationModal();
    }

    // Fill form with notification data
    document.getElementById('edit-notification-id').value = notification.id;
    document.getElementById('edit-notification-subject').value = notification.title;
    document.getElementById('edit-notification-message').value = notification.message;
    
    // Show modal
    document.getElementById('edit-notification-modal').classList.remove('hidden');
}

// Create edit notification modal
function createEditNotificationModal() {
    const modal = document.createElement('div');
    modal.id = 'edit-notification-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center hidden z-50';
    
    modal.innerHTML = `
        <div class="bg-white rounded-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <h3 class="text-lg font-semibold mb-4">Edit Notification</h3>
                <form id="edit-notification-form">
                    <input type="hidden" id="edit-notification-id">
                    <div class="grid grid-cols-1 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                            <input type="text" class="form-input" placeholder="Enter notification subject"
                                id="edit-notification-subject" required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Message</label>
                            <textarea class="form-input" rows="5" placeholder="Enter your message"
                                id="edit-notification-message" required></textarea>
                        </div>
                        <div class="flex gap-2">
                            <button type="submit" class="btn-primary">Update</button>
                            <button type="button" class="btn-secondary" id="cancel-edit-notification">Cancel</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add event listeners
    document.getElementById('edit-notification-form').addEventListener('submit', (e) => {
        e.preventDefault();
        updateNotification();
    });
    
    document.getElementById('cancel-edit-notification').addEventListener('click', () => {
        document.getElementById('edit-notification-modal').classList.add('hidden');
    });
}

// Update notification
function updateNotification() {
    const notificationId = parseInt(document.getElementById('edit-notification-id').value);
    const subject = document.getElementById('edit-notification-subject').value;
    const message = document.getElementById('edit-notification-message').value;
    
    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    if (notificationIndex !== -1) {
        notifications[notificationIndex].title = subject;
        notifications[notificationIndex].message = message;
        notifications[notificationIndex].date = new Date().toISOString().split('T')[0];
        
        loadNotifications();
        document.getElementById('edit-notification-modal').classList.add('hidden');
        
        alert('Notification updated successfully!');
    }
}

// Delete notification
function deleteNotification(notificationId) {
    if (confirm('Are you sure you want to delete this notification?')) {
        const notificationIndex = notifications.findIndex(n => n.id == notificationId);
        if (notificationIndex !== -1) {
            notifications.splice(notificationIndex, 1);
            loadNotifications();
            alert('Notification deleted successfully!');
        }
    }
}

// Send notification
function sendNotification() {
    const subject = document.getElementById('notification-subject').value;
    const message = document.getElementById('notification-message').value;

    // 创建通知对象，收件人固定为购物系统首页
    const newNotification = {
        id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
        title: subject,
        message: message,
        date: new Date().toISOString().split('T')[0],
        recipients: 'Shopping System Homepage',
        type: 'announcement'
    };

    // 添加到通知数据
    notifications.unshift(newNotification);

    // 重新加载通知
    loadNotifications();

    // 隐藏表单并重置
    document.getElementById('compose-notification').classList.add('hidden');
    document.getElementById('notification-form').reset();

    alert('Notification sent to shopping system homepage successfully!');
}

// ============================================
// USER MANAGEMENT PAGE FUNCTIONS
// ============================================

// Load user management data
function loadUserManagementData() {
    const tableContainer = document.getElementById('user-management-table-body');
    if (tableContainer) {
        tableContainer.innerHTML = '';
        userManagementData.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.dataset.userId = user.id;

            // 账号状态样式
            let statusClass = '';
            if (user.accountStatus === 'Active') {
                statusClass = 'bg-green-100 text-green-800';
            } else if (user.accountStatus === 'Suspended') {
                statusClass = 'bg-yellow-100 text-yellow-800';
            } else if (user.accountStatus === 'Inactive') {
                statusClass = 'bg-red-100 text-red-800';
            } else {
                statusClass = 'bg-gray-100 text-gray-800';
            }

            // 用户权限样式
            let roleClass = '';
            if (user.userRole === 'Admin') {
                roleClass = 'bg-purple-100 text-purple-800';
            } else {
                roleClass = 'bg-blue-100 text-blue-800';
            }

            // 用户身份样式
            let typeClass = '';
            if (user.userType === 'Manager') {
                typeClass = 'bg-primary text-white';
            } else if (user.userType === 'Finance') {
                typeClass = 'bg-yellow-100 text-yellow-800';
            } else {
                typeClass = 'bg-gray-100 text-gray-800';
            }

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${user.userId}</td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs ${roleClass} rounded-full">${user.userRole}</span>
                </td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${user.accountStatus}</span>
                </td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs ${typeClass} rounded-full">${user.userType}</span>
                </td>
                <td class="px-4 py-4 text-sm">${user.email}</td>
                <td class="px-4 py-4 text-sm">${user.joinDate}</td>
                <td class="px-4 py-4 text-sm">
                    <div class="flex gap-2">
                        <button class="text-primary hover:text-primary/80 edit-user-btn" title="Edit User">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 delete-user-btn" title="Delete User">
                            <i class="fa fa-trash"></i>
                        </button>
                        <button class="text-blue-600 hover:text-blue-800 toggle-status-btn" title="Toggle Status">
                            <i class="fa fa-power-off"></i>
                        </button>
                    </div>
                </td>
            `;
            tableContainer.appendChild(row);
        });

        // Add event listeners to user action buttons
        addUserActionButtonListeners();
    }
}

// Add event listeners to user action buttons
function addUserActionButtonListeners() {
    // Edit buttons
    document.querySelectorAll('#user-management-table-body .edit-user-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const userId = row.cells[0].textContent;
            alert(`Editing user: ${userId}`);
        });
    });

    // Delete buttons
    document.querySelectorAll('#user-management-table-body .delete-user-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const userId = row.cells[0].textContent;
            if (confirm(`Are you sure you want to delete user "${userId}"?`)) {
                row.remove();
                alert(`User "${userId}" has been deleted.`);
            }
        });
    });

    // Toggle status buttons
    document.querySelectorAll('#user-management-table-body .toggle-status-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const userId = row.cells[0].textContent;
            const statusElement = row.cells[2].querySelector('span');
            const currentStatus = statusElement.textContent;
            
            let newStatus = 'Active';
            let newClass = 'bg-green-100 text-green-800';
            
            if (currentStatus === 'Active') {
                newStatus = 'Suspended';
                newClass = 'bg-yellow-100 text-yellow-800';
            } else if (currentStatus === 'Suspended') {
                newStatus = 'Inactive';
                newClass = 'bg-red-100 text-red-800';
            } else {
                newStatus = 'Active';
                newClass = 'bg-green-100 text-green-800';
            }
            
            statusElement.textContent = newStatus;
            statusElement.className = `px-2 py-1 text-xs ${newClass} rounded-full`;
            
            alert(`User "${userId}" status changed to ${newStatus}`);
        });
    });
}

// Perform user search
function performUserSearch(searchTerm) {
    let results;
    
    if (searchTerm) {
        results = userManagementData.filter(user => 
            user.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.userType.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.accountStatus.toLowerCase().includes(searchTerm.toLowerCase())
        );
    } else {
        results = userManagementData;
    }
    
    updateUserManagementTable(results);
}

// Update user management table
function updateUserManagementTable(data) {
    const tableContainer = document.getElementById('user-management-table-body');
    if (!tableContainer) return;
    
    tableContainer.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <i class="fa fa-user-times text-3xl text-gray-300 mb-2"></i>
                    <p>No users found matching your search</p>
                </div>
            </td>
        `;
        tableContainer.appendChild(row);
        return;
    }
    
    data.forEach(user => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.userId = user.id;

        // 账号状态样式
        let statusClass = '';
        if (user.accountStatus === 'Active') {
            statusClass = 'bg-green-100 text-green-800';
        } else if (user.accountStatus === 'Suspended') {
            statusClass = 'bg-yellow-100 text-yellow-800';
        } else if (user.accountStatus === 'Inactive') {
            statusClass = 'bg-red-100 text-red-800';
        } else {
            statusClass = 'bg-gray-100 text-gray-800';
        }

        // 用户权限样式
        let roleClass = '';
        if (user.userRole === 'Admin') {
            roleClass = 'bg-purple-100 text-purple-800';
        } else {
            roleClass = 'bg-blue-100 text-blue-800';
        }

        // 用户身份样式
        let typeClass = '';
        if (user.userType === 'Manager') {
            typeClass = 'bg-primary text-white';
        } else if (user.userType === 'Finance') {
            typeClass = 'bg-yellow-100 text-yellow-800';
        } else {
            typeClass = 'bg-gray-100 text-gray-800';
        }

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${user.userId}</td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${roleClass} rounded-full">${user.userRole}</span>
            </td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${user.accountStatus}</span>
            </td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${typeClass} rounded-full">${user.userType}</span>
            </td>
            <td class="px-4 py-4 text-sm">${user.email}</td>
            <td class="px-4 py-4 text-sm">${user.joinDate}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 edit-user-btn" title="Edit User">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 delete-user-btn" title="Delete User">
                        <i class="fa fa-trash"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 toggle-status-btn" title="Toggle Status">
                        <i class="fa fa-power-off"></i>
                    </button>
                </div>
            </td>
        `;
        tableContainer.appendChild(row);
    });

    // Re-add event listeners
    addUserActionButtonListeners();
}

// 初始化书籍搜索功能
function initBookSearch() {
    const searchInput = document.getElementById('book-search-input');
    if (searchInput) {
        // 使用防抖功能
        const debouncedSearch = debounce(function(e) {
            const searchTerm = e.target.value.trim();
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                performBookSearch(searchTerm);
            }
        }, 300);
        
        searchInput.addEventListener('input', debouncedSearch);
    }
}

// 执行书籍搜索
function performBookSearch(searchTerm) {
    let results;
    
    if (searchTerm) {
        // 搜索书名或ISBN
        results = pricingData.filter(book => 
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
        );
    } else {
        // 如果没有搜索词，显示所有书籍
        results = pricingData;
    }
    
    // 更新表格
    updatePricingTable(results);
    
    // 如果没有搜索结果，显示提示
    if (searchTerm && results.length === 0) {
        showNoResultsMessage();
    }
}

// 更新定价表格
function updatePricingTable(data) {
    const tableContainer = document.getElementById('pricing-table-body');
    if (!tableContainer) return;
    
    tableContainer.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <i class="fa fa-search text-3xl text-gray-300 mb-2"></i>
                    <p>No books found matching your search</p>
                </div>
            </td>
        `;
        tableContainer.appendChild(row);
        return;
    }
    
    data.forEach(book => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.book = JSON.stringify(book);

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${book.title}</td>
            <td class="px-4 py-4 text-sm text-gray-500">${book.isbn}</td>
            <td class="px-4 py-4 text-sm">${book.currentPrice}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 edit-book-btn" title="Edit">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 refresh-price-btn" title="Refresh Price">
                        <i class="fa fa-refresh"></i>
                    </button>
                </div>
            </td>
        `;
        tableContainer.appendChild(row);
    });

    // 重新添加事件监听器
    document.querySelectorAll('#pricing-table-body .edit-book-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const bookData = JSON.parse(row.dataset.book);
            openEditBookModal(bookData);
        });
    });

    document.querySelectorAll('#pricing-table-body .refresh-price-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            alert(`Refreshing price for: ${title}`);
        });
    });
}

// 显示无结果消息
function showNoResultsMessage() {
    // 这个消息已经在updatePricingTable中显示
    console.log('No search results found');
}

// 初始化搜索框
function initSearchBoxes() {
    // 库存搜索
    const inventorySearch = document.querySelector('#inventory-page input[placeholder*="Search books"]');
    if (inventorySearch) {
        const debouncedSearch = debounce(function(e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                performInventorySearch(searchTerm);
            }
        }, 300);
        
        inventorySearch.addEventListener('input', debouncedSearch);
    }
    
    // 员工搜索
    const staffSearch = document.querySelector('#staff-page input[placeholder*="Search staff"]');
    if (staffSearch) {
        const debouncedSearch = debounce(function(e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                performStaffSearch(searchTerm);
            }
        }, 300);
        
        staffSearch.addEventListener('input', debouncedSearch);
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function performInventorySearch(searchTerm) {
    const results = searchTerm ? searchInventory(searchTerm) : inventoryData;
    updateInventoryTable(results);
    
    if (searchTerm && results.length === 0) {
        alert('No books found matching your search');
    }
}

function performStaffSearch(searchTerm) {
    const results = searchTerm ? searchStaff(searchTerm) : staffData;
    updateStaffTable(results);
    
    if (searchTerm && results.length === 0) {
        alert('No staff found matching your search');
    }
}

// 搜索库存
function searchInventory(searchTerm) {
    const filtered = inventoryData.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.branch.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered;
}

// 搜索员工
function searchStaff(searchTerm) {
    const filtered = staffData.filter(item => 
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.phone.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered;
}

// 更新库存表格
function updateInventoryTable(data) {
    const container = document.getElementById('inventory-table-body');
    if (!container) return;
    
    container.innerHTML = '';
    
    data.forEach(book => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        
        let stockClass = '';
        let stockText = '';
        if (book.stock <= 5) {
            stockClass = 'text-red-600 font-medium';
            stockText = `${book.stock} (Low)`;
        } else if (book.stock <= 10) {
            stockClass = 'text-yellow-600';
            stockText = `${book.stock} (Medium)`;
        } else {
            stockClass = 'text-green-600';
            stockText = `${book.stock} (Good)`;
        }
        
        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${book.title}</td>
            <td class="px-4 py-4 text-sm text-gray-500">${book.isbn}</td>
            <td class="px-4 py-4 text-sm font-mono">${book.sku}</td>
            <td class="px-4 py-4 text-sm">${book.branch}</td>
            <td class="px-4 py-4 text-sm ${stockClass}">${stockText}</td>
            <td class="px-4 py-4 text-sm">${book.lastRestock}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80" title="Edit">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800" title="Refresh Stock">
                        <i class="fa fa-refresh"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800" title="Delete">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
    
    // 重新添加事件监听器
    addInventoryActionButtonListeners();
}

// 更新员工表格
function updateStaffTable(data) {
    const container = document.getElementById('staff-table-body');
    if (!container) return;
    
    container.innerHTML = '';
    
    data.forEach(staff => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.staffId = staff.id;
        row.dataset.storeID = staff.storeID;
        row.dataset.position = staff.position;
        
        let roleClass = 'role-staff';
        if (staff.position === 'manager') roleClass = 'role-manager';
        if (staff.position === 'finance') roleClass = 'role-finance';
        
        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${staff.employeeID}</td>
            <td class="px-4 py-4 text-sm">${staff.userID}</td>
            <td class="px-4 py-4 text-sm">${staff.branchName}</td>
            <td class="px-4 py-4 text-sm">${staff.name}</td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${roleClass} rounded-full">${staff.position}</span>
            </td>
            <td class="px-4 py-4 text-sm">${staff.phone}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 edit-staff" title="Edit">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 view-staff" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 delete-staff" title="Delete">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
    
    // 重新添加事件监听器
    addStaffActionButtonListeners();
    updateStaffCount(data.length);
}