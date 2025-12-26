// Manager Dashboard JavaScript - 与layout.js整合版

/**
 * Manager 系统页面切换函数 (供layout.js调用)
 */
window.managerSwitchPage = function (pageId) {
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
        loadReplenishmentRequests();
        loadStockOverviewByBranch('all');
        loadStockOverviewBySKU();
        initInventoryTabs();
        initRequestFilters();
    } else if (pageId === 'staff') {
        loadStaffData();
    } else if (pageId === 'pricing') {
        // 定价管理已整合到库存管理中，重定向到库存页面
        window.switchPage('inventory');
        // 等待页面加载完成后切换到定价标签
        setTimeout(() => {
            const pricingTab = document.getElementById('pricing-tab');
            const pricingContent = document.getElementById('pricing-content');
            if (pricingTab && pricingContent) {
                // 移除所有标签的活动状态
                document.querySelectorAll('.tab-button').forEach(tab => {
                    tab.classList.remove('active', 'border-primary', 'text-primary');
                    tab.classList.add('border-transparent', 'text-gray-500');
                });

                // 隐藏所有内容
                document.querySelectorAll('.inventory-content').forEach(content => {
                    content.classList.add('hidden');
                });

                // 设置定价标签和内容
                pricingTab.classList.add('active', 'border-primary', 'text-primary');
                pricingTab.classList.remove('border-transparent', 'text-gray-500');
                pricingContent.classList.remove('hidden');

                // 加载定价数据
                loadPricingData();
            }
        }, 100);
    } else if (pageId === 'notifications') {
        loadNotifications();
    } else if (pageId === 'user-management') {
        loadUserManagementData();
    } else if (pageId === 'overview') {
        // 确保图表和表格已初始化
        if (typeof initCharts === 'function') {
            setTimeout(initCharts, 100);
        }
        if (typeof loadPaymentComparisonTable === 'function') {
            setTimeout(loadPaymentComparisonTable, 150);
        }
        if (typeof loadBookCategoryTable === 'function') {
            setTimeout(loadBookCategoryTable, 200);
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    // Initialize date display
    initDateDisplay();

    // Initialize charts and tables
    initCharts();
    loadPaymentComparisonTable();
    loadBookCategoryTable();

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

// Initialize charts (只保留订单数对比图表，移除热销图书分类图表)
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
                            label: function (context) {
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
                            callback: function (value) {
                                return value;
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

// Load payment comparison table
function loadPaymentComparisonTable() {
    const tableContainer = document.getElementById('payment-method-table');
    if (!tableContainer) return;

    const paymentData = overviewData.branchPaymentComparison;

    // 创建表格HTML
    let tableHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Branch</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credit Card</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Third-party Payment</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Cash</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
    `;

    // 添加数据行
    paymentData.forEach(branch => {
        const creditCard = branch.payments.find(p => p.method === 'Credit Card');
        const thirdParty = branch.payments.find(p => p.method === 'Third-party payment');
        const cash = branch.payments.find(p => p.method === 'Cash');

        tableHTML += `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-4 text-sm font-medium">${branch.branch}</td>
                <td class="px-4 py-4 text-sm">
                    <div class="font-semibold">¥${creditCard.amount.toLocaleString()}</div>
                    <div class="text-xs text-gray-500">${creditCard.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div class="font-semibold">¥${thirdParty.amount.toLocaleString()}</div>
                    <div class="text-xs text-gray-500">${thirdParty.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div class="font-semibold">¥${cash.amount.toLocaleString()}</div>
                    <div class="text-xs text-gray-500">${cash.percentage}%</div>
                </td>
            </tr>
        `;
    });

    // 添加总计行
    const totals = calculatePaymentTotals(paymentData);
    tableHTML += `
            <tr class="bg-primary/5 font-semibold">
                <td class="px-4 py-4 text-sm">Total</td>
                <td class="px-4 py-4 text-sm">
                    <div>¥${totals.creditCard.amount.toLocaleString()}</div>
                    <div class="text-xs">${totals.creditCard.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div>¥${totals.thirdParty.amount.toLocaleString()}</div>
                    <div class="text-xs">${totals.thirdParty.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div>¥${totals.cash.amount.toLocaleString()}</div>
                    <div class="text-xs">${totals.cash.percentage}%</div>
                </td>
            </tr>
        </tbody>
    </table>
</div>`;

    tableContainer.innerHTML = tableHTML;
}

// Calculate payment totals across all branches
function calculatePaymentTotals(paymentData) {
    let creditCardTotal = 0;
    let thirdPartyTotal = 0;
    let cashTotal = 0;
    let grandTotal = 0;

    paymentData.forEach(branch => {
        const creditCard = branch.payments.find(p => p.method === 'Credit Card');
        const thirdParty = branch.payments.find(p => p.method === 'Third-party payment');
        const cash = branch.payments.find(p => p.method === 'Cash');

        creditCardTotal += creditCard.amount;
        thirdPartyTotal += thirdParty.amount;
        cashTotal += cash.amount;
        grandTotal += branch.total;
    });

    return {
        creditCard: {
            amount: creditCardTotal,
            percentage: Math.round((creditCardTotal / grandTotal) * 100 * 10) / 10
        },
        thirdParty: {
            amount: thirdPartyTotal,
            percentage: Math.round((thirdPartyTotal / grandTotal) * 100 * 10) / 10
        },
        cash: {
            amount: cashTotal,
            percentage: Math.round((cashTotal / grandTotal) * 100 * 10) / 10
        }
    };
}

// Load book category comparison table
function loadBookCategoryTable() {
    const tableContainer = document.getElementById('book-category-table');
    if (!tableContainer) return;

    const categoryData = overviewData.branchCategoryComparison;

    // 定义分类颜色
    const categoryColors = {
        'Fiction': '#8B5A2B',
        'Non-Fiction': '#A0522D',
        'Science': '#D2691E',
        'History': '#CD853F',
        'Biography': '#D2B48C',
        'Children': '#F5DEB3'
    };

    // 创建表格HTML
    let tableHTML = `
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr class="bg-gray-50">
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tl-lg">Branch</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fiction</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Non-Fiction</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Science</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">History</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biography</th>
                        <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider rounded-tr-lg">Children</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
    `;

    // 添加数据行
    categoryData.forEach(branch => {
        const fiction = branch.categories.find(c => c.category === 'Fiction');
        const nonFiction = branch.categories.find(c => c.category === 'Non-Fiction');
        const science = branch.categories.find(c => c.category === 'Science');
        const history = branch.categories.find(c => c.category === 'History');
        const biography = branch.categories.find(c => c.category === 'Biography');
        const children = branch.categories.find(c => c.category === 'Children');

        tableHTML += `
            <tr class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-4 text-sm font-medium">${branch.branch}</td>
                <td class="px-4 py-4 text-sm">
                    <div class="font-semibold">¥${fiction.sales.toLocaleString()}</div>
                    <div class="text-xs text-gray-500">${fiction.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div class="font-semibold">¥${nonFiction.sales.toLocaleString()}</div>
                    <div class="text-xs text-gray-500">${nonFiction.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div class="font-semibold">¥${science.sales.toLocaleString()}</div>
                    <div class="text-xs text-gray-500">${science.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div class="font-semibold">¥${history.sales.toLocaleString()}</div>
                    <div class="text-xs text-gray-500">${history.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div class="font-semibold">¥${biography.sales.toLocaleString()}</div>
                    <div class="text-xs text-gray-500">${biography.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div class="font-semibold">¥${children.sales.toLocaleString()}</div>
                    <div class="text-xs text-gray-500">${children.percentage}%</div>
                </td>
            </tr>
        `;
    });

    // 添加总计行
    const totals = calculateCategoryTotals(categoryData);
    tableHTML += `
            <tr class="bg-primary/5 font-semibold">
                <td class="px-4 py-4 text-sm">Total</td>
                <td class="px-4 py-4 text-sm">
                    <div>¥${totals.fiction.amount.toLocaleString()}</div>
                    <div class="text-xs">${totals.fiction.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div>¥${totals.nonFiction.amount.toLocaleString()}</div>
                    <div class="text-xs">${totals.nonFiction.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div>¥${totals.science.amount.toLocaleString()}</div>
                    <div class="text-xs">${totals.science.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div>¥${totals.history.amount.toLocaleString()}</div>
                    <div class="text-xs">${totals.history.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div>¥${totals.biography.amount.toLocaleString()}</div>
                    <div class="text-xs">${totals.biography.percentage}%</div>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div>¥${totals.children.amount.toLocaleString()}</div>
                    <div class="text-xs">${totals.children.percentage}%</div>
                </td>
            </tr>
        </tbody>
    </table>
</div>`;

    tableContainer.innerHTML = tableHTML;
}

// Calculate category totals across all branches
function calculateCategoryTotals(categoryData) {
    let fictionTotal = 0;
    let nonFictionTotal = 0;
    let scienceTotal = 0;
    let historyTotal = 0;
    let biographyTotal = 0;
    let childrenTotal = 0;
    let grandTotal = 0;

    categoryData.forEach(branch => {
        const fiction = branch.categories.find(c => c.category === 'Fiction');
        const nonFiction = branch.categories.find(c => c.category === 'Non-Fiction');
        const science = branch.categories.find(c => c.category === 'Science');
        const history = branch.categories.find(c => c.category === 'History');
        const biography = branch.categories.find(c => c.category === 'Biography');
        const children = branch.categories.find(c => c.category === 'Children');

        fictionTotal += fiction.sales;
        nonFictionTotal += nonFiction.sales;
        scienceTotal += science.sales;
        historyTotal += history.sales;
        biographyTotal += biography.sales;
        childrenTotal += children.sales;
        grandTotal += branch.total;
    });

    return {
        fiction: {
            amount: fictionTotal,
            percentage: Math.round((fictionTotal / grandTotal) * 100 * 10) / 10
        },
        nonFiction: {
            amount: nonFictionTotal,
            percentage: Math.round((nonFictionTotal / grandTotal) * 100 * 10) / 10
        },
        science: {
            amount: scienceTotal,
            percentage: Math.round((scienceTotal / grandTotal) * 100 * 10) / 10
        },
        history: {
            amount: historyTotal,
            percentage: Math.round((historyTotal / grandTotal) * 100 * 10) / 10
        },
        biography: {
            amount: biographyTotal,
            percentage: Math.round((biographyTotal / grandTotal) * 100 * 10) / 10
        },
        children: {
            amount: childrenTotal,
            percentage: Math.round((childrenTotal / grandTotal) * 100 * 10) / 10
        }
    };
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
        const debouncedSearch = debounce(function (e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                performUserSearch(searchTerm);
            }
        }, 300);

        userSearch.addEventListener('input', debouncedSearch);
    }

    // 库存管理相关事件监听器
    initInventoryEventListeners();
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
    const pricingTableBody = document.getElementById('pricing-table-body');
    if (pricingTableBody) {
        pricingTableBody.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
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
        const branchPerformance = [
            { name: 'Central Plaza', sales: '¥42,000', performance: 'Excellent', status: 'Active' },
            { name: 'Riverside', sales: '¥35,000', performance: 'Good', status: 'Active' },
            { name: 'Westside', sales: '¥28,000', performance: 'Average', status: 'Active' }
        ];
        
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
        const debouncedSearch = debounce(function (e) {
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
        const debouncedSearch = debounce(function (e) {
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
        const debouncedSearch = debounce(function (e) {
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

// ============================================
// INVENTORY MANAGEMENT FUNCTIONS (NEW)
// ============================================

// 初始化库存标签页
function initInventoryTabs() {
    const requestsTab = document.getElementById('requests-tab');
    const overviewTab = document.getElementById('overview-tab');
    const pricingTab = document.getElementById('pricing-tab'); // 添加定价标签页
    const requestsContent = document.getElementById('requests-content');
    const overviewContent = document.getElementById('overview-content');
    const pricingContent = document.getElementById('pricing-content');
    
    // 修复库存总览标签页点击事件
    if (overviewTab) {
        overviewTab.addEventListener('click', () => {
            // 移除所有标签的活动状态
            if (requestsTab) {
                requestsTab.classList.remove('active', 'border-primary', 'text-primary');
                requestsTab.classList.add('border-transparent', 'text-gray-500');
            }
            if (overviewTab) {
                overviewTab.classList.remove('border-transparent', 'text-gray-500');
            }
            if (pricingTab) {
                pricingTab.classList.remove('active', 'border-primary', 'text-primary');
                pricingTab.classList.add('border-transparent', 'text-gray-500');
            }
            
            // 添加当前标签的活动状态
            overviewTab.classList.add('active', 'border-primary', 'text-primary');
            
            // 隐藏所有内容
            if (requestsContent) requestsContent.classList.add('hidden');
            if (overviewContent) overviewContent.classList.remove('hidden');
            if (pricingContent) pricingContent.classList.add('hidden');
            
            // 加载库存总览数据
            loadStockOverviewByBranch('all');
        });
    }
    
    // 补货申请标签页
    if (requestsTab) {
        requestsTab.addEventListener('click', () => {
            // 移除所有标签的活动状态
            if (requestsTab) {
                requestsTab.classList.remove('border-transparent', 'text-gray-500');
            }
            if (overviewTab) {
                overviewTab.classList.remove('active', 'border-primary', 'text-primary');
                overviewTab.classList.add('border-transparent', 'text-gray-500');
            }
            if (pricingTab) {
                pricingTab.classList.remove('active', 'border-primary', 'text-primary');
                pricingTab.classList.add('border-transparent', 'text-gray-500');
            }
            
            // 添加当前标签的活动状态
            requestsTab.classList.add('active', 'border-primary', 'text-primary');
            
            // 隐藏所有内容
            if (requestsContent) requestsContent.classList.remove('hidden');
            if (overviewContent) overviewContent.classList.add('hidden');
            if (pricingContent) pricingContent.classList.add('hidden');
        });
    }
    
    // 定价管理标签页（如果存在）
    if (pricingTab && pricingContent) {
        pricingTab.addEventListener('click', () => {
            // 移除所有标签的活动状态
            if (requestsTab) {
                requestsTab.classList.remove('active', 'border-primary', 'text-primary');
                requestsTab.classList.add('border-transparent', 'text-gray-500');
            }
            if (overviewTab) {
                overviewTab.classList.remove('active', 'border-primary', 'text-primary');
                overviewTab.classList.add('border-transparent', 'text-gray-500');
            }
            if (pricingTab) {
                pricingTab.classList.remove('border-transparent', 'text-gray-500');
            }
            
            // 添加当前标签的活动状态
            pricingTab.classList.add('active', 'border-primary', 'text-primary');
            
            // 隐藏所有内容
            if (requestsContent) requestsContent.classList.add('hidden');
            if (overviewContent) overviewContent.classList.add('hidden');
            if (pricingContent) pricingContent.classList.remove('hidden');
            
            // 加载定价数据
            loadPricingData();
        });
    }
    
    // 初始化库存总览的视图选项
    const viewOptions = document.querySelectorAll('input[name="view-option"]');
    const stockByBranch = document.getElementById('stock-by-branch');
    const stockBySKU = document.getElementById('stock-by-sku');
    const branchFilterContainer = document.getElementById('branch-filter-container');
    
    if (viewOptions.length > 0) {
        viewOptions.forEach(option => {
            option.addEventListener('change', function() {
                if (this.value === 'by-branch') {
                    if (stockByBranch) stockByBranch.classList.remove('hidden');
                    if (stockBySKU) stockBySKU.classList.add('hidden');
                    if (branchFilterContainer) branchFilterContainer.classList.remove('hidden');
                    // 加载默认的分店数据
                    loadStockOverviewByBranch('all');
                } else {
                    if (stockByBranch) stockByBranch.classList.add('hidden');
                    if (stockBySKU) stockBySKU.classList.remove('hidden');
                    if (branchFilterContainer) branchFilterContainer.classList.add('hidden');
                    loadStockOverviewBySKU();
                }
            });
        });
    }
    
    // 初始化分店筛选
    const branchStockFilter = document.getElementById('branch-stock-filter');
    if (branchStockFilter) {
        branchStockFilter.addEventListener('change', function() {
            const selectedBranch = this.value;
            loadStockOverviewByBranch(selectedBranch);
        });
    }
    
    // 初始化请求筛选器
    initRequestFilters();
}

// 初始化请求筛选器
function initRequestFilters() {
    const applyRequestFiltersBtn = document.getElementById('apply-request-filters');
    const resetRequestFiltersBtn = document.getElementById('reset-request-filters');
    
    if (applyRequestFiltersBtn) {
        applyRequestFiltersBtn.addEventListener('click', applyRequestFilters);
    }
    
    if (resetRequestFiltersBtn) {
        resetRequestFiltersBtn.addEventListener('click', resetRequestFilters);
    }
}

// 初始化库存管理事件监听器
function initInventoryEventListeners() {
    // 关闭请求详情模态框
    document.getElementById('close-request-detail')?.addEventListener('click', () => {
        document.getElementById('request-detail-modal').classList.add('hidden');
    });
    
    // 批准请求
    document.getElementById('approve-request')?.addEventListener('click', approveRequest);
    
    // 拒绝请求
    document.getElementById('reject-request')?.addEventListener('click', rejectRequest);
    
    // SKU搜索
    const skuSearchInput = document.getElementById('sku-search-input');
    if (skuSearchInput) {
        skuSearchInput.addEventListener('input', function() {
            performSKUSearch(this.value);
        });
    }
}

// 加载补货申请数据
function loadReplenishmentRequests() {
    const container = document.getElementById('replenishment-table-body');
    if (!container) return;
    
    container.innerHTML = '';
    
    replenishmentRequests.forEach(request => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.requestId = request.id;
        
        // 状态样式
        let statusClass = '';
        let statusText = '';
        switch (request.status) {
            case 'pending':
                statusClass = 'bg-yellow-100 text-yellow-800';
                statusText = 'Pending';
                break;
            case 'approved':
                statusClass = 'bg-blue-100 text-blue-800';
                statusText = 'Approved';
                break;
            case 'rejected':
                statusClass = 'bg-red-100 text-red-800';
                statusText = 'Rejected';
                break;
            case 'completed':
                statusClass = 'bg-green-100 text-green-800';
                statusText = 'Completed';
                break;
        }
        
        // 紧急程度指示器
        let urgencyIndicator = '';
        switch (request.urgency) {
            case 'high':
                urgencyIndicator = '<span class="ml-2 text-red-500"><i class="fa fa-exclamation-triangle"></i></span>';
                break;
            case 'medium':
                urgencyIndicator = '<span class="ml-2 text-yellow-500"><i class="fa fa-exclamation-circle"></i></span>';
                break;
            case 'low':
                urgencyIndicator = '<span class="ml-2 text-green-500"><i class="fa fa-info-circle"></i></span>';
                break;
        }
        
        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${request.id}</td>
            <td class="px-4 py-4 text-sm">${request.branchName} ${urgencyIndicator}</td>
            <td class="px-4 py-4 text-sm">${formatDateTime(request.requestTime)}</td>
            <td class="px-4 py-4 text-sm">${request.skuCount}</td>
            <td class="px-4 py-4 text-sm">${request.totalQuantity}</td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${statusText}</span>
            </td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 view-request-btn" title="View Details">
                        <i class="fa fa-eye"></i> View
                    </button>
                    <button class="text-green-600 hover:text-green-800 approve-request-btn" title="Approve">
                        <i class="fa fa-check"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 reject-request-btn" title="Reject">
                        <i class="fa fa-times"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 complete-request-btn" title="Mark Completed">
                        <i class="fa fa-check-circle"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });
    
    // 添加事件监听器
    addRequestActionButtonListeners();
}

// 添加补货申请操作按钮监听器
function addRequestActionButtonListeners() {
    // 查看详情按钮
    document.querySelectorAll('#replenishment-table-body .view-request-btn').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const requestId = row.dataset.requestId;
            viewRequestDetail(requestId);
        });
    });
    
    // 批准按钮
    document.querySelectorAll('#replenishment-table-body .approve-request-btn').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const requestId = row.dataset.requestId;
            if (confirm(`Approve request ${requestId}?`)) {
                updateRequestStatus(requestId, 'approved');
            }
        });
    });
    
    // 拒绝按钮
    document.querySelectorAll('#replenishment-table-body .reject-request-btn').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const requestId = row.dataset.requestId;
            if (confirm(`Reject request ${requestId}?`)) {
                updateRequestStatus(requestId, 'rejected');
            }
        });
    });
    
    // 标记完成按钮
    document.querySelectorAll('#replenishment-table-body .complete-request-btn').forEach(button => {
        button.addEventListener('click', function() {
            const row = this.closest('tr');
            const requestId = row.dataset.requestId;
            if (confirm(`Mark request ${requestId} as completed?`)) {
                updateRequestStatus(requestId, 'completed');
            }
        });
    });
}

// 查看请求详情
function viewRequestDetail(requestId) {
    const request = replenishmentRequests.find(r => r.id === requestId);
    if (!request) return;
    
    const modal = document.getElementById('request-detail-modal');
    const content = document.getElementById('request-detail-content');
    
    // 状态样式
    let statusClass = '';
    let statusText = '';
    switch (request.status) {
        case 'pending':
            statusClass = 'bg-yellow-100 text-yellow-800';
            statusText = 'Pending';
            break;
        case 'approved':
            statusClass = 'bg-blue-100 text-blue-800';
            statusText = 'Approved';
            break;
        case 'rejected':
            statusClass = 'bg-red-100 text-red-800';
            statusText = 'Rejected';
            break;
        case 'completed':
            statusClass = 'bg-green-100 text-green-800';
            statusText = 'Completed';
            break;
    }
    
    // 紧急程度样式
    let urgencyClass = '';
    let urgencyText = '';
    switch (request.urgency) {
        case 'high':
            urgencyClass = 'bg-red-100 text-red-800';
            urgencyText = 'High';
            break;
        case 'medium':
            urgencyClass = 'bg-yellow-100 text-yellow-800';
            urgencyText = 'Medium';
            break;
        case 'low':
            urgencyClass = 'bg-green-100 text-green-800';
            urgencyText = 'Low';
            break;
    }
    
    // 创建详情内容
    let itemsHtml = '';
    request.items.forEach(item => {
        itemsHtml += `
            <tr class="hover:bg-gray-50">
                <td class="px-4 py-3 text-sm font-medium">${item.title}</td>
                <td class="px-4 py-3 text-sm">${item.isbn}</td>
                <td class="px-4 py-3 text-sm font-mono">${item.sku}</td>
                <td class="px-4 py-3 text-sm">${item.requested}</td>
                <td class="px-4 py-3 text-sm">¥${item.suggestedCost.toFixed(2)}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Available: 25</span>
                </td>
            </tr>
        `;
    });
    
    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
                <h4 class="font-medium text-gray-700 mb-2">Request Information</h4>
                <div class="space-y-2">
                    <div class="flex justify-between">
                        <span class="text-gray-600">Request ID:</span>
                        <span class="font-medium">${request.id}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Branch:</span>
                        <span class="font-medium">${request.branchName}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Request Time:</span>
                        <span>${formatDateTime(request.requestTime)}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">SKU Count:</span>
                        <span>${request.skuCount}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-600">Total Quantity:</span>
                        <span>${request.totalQuantity}</span>
                    </div>
                </div>
            </div>
            <div>
                <h4 class="font-medium text-gray-700 mb-2">Status & Urgency</h4>
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Status:</span>
                        <span class="px-3 py-1 text-sm ${statusClass} rounded-full">${statusText}</span>
                    </div>
                    <div class="flex justify-between items-center">
                        <span class="text-gray-600">Urgency:</span>
                        <span class="px-3 py-1 text-sm ${urgencyClass} rounded-full">${urgencyText}</span>
                    </div>
                    <div class="mt-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">Note:</label>
                        <div class="bg-gray-50 p-3 rounded border border-gray-200 text-sm">
                            ${request.note}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <h4 class="font-medium text-gray-700 mb-3">Request Items</h4>
        <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
                <thead>
                    <tr>
                        <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Book Title</th>
                        <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">ISBN</th>
                        <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                        <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Requested Qty</th>
                        <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Suggested Cost</th>
                        <th class="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Available</th>
                    </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                    ${itemsHtml}
                </tbody>
            </table>
        </div>
        
        <div class="mt-6 p-4 bg-blue-50 rounded-lg">
            <p class="text-sm text-blue-600 mb-1"><i class="fa fa-info-circle"></i> Approving this request will generate an inbound batch for inventory tracking.</p>
        </div>
    `;
    
    // 设置模态框的请求ID
    modal.dataset.currentRequestId = requestId;
    
    // 根据当前状态显示/隐藏按钮
    const approveBtn = document.getElementById('approve-request');
    const rejectBtn = document.getElementById('reject-request');
    
    if (request.status === 'pending') {
        approveBtn.classList.remove('hidden');
        rejectBtn.classList.remove('hidden');
    } else {
        approveBtn.classList.add('hidden');
        rejectBtn.classList.add('hidden');
    }
    
    modal.classList.remove('hidden');
}

// 批准请求
function approveRequest() {
    const modal = document.getElementById('request-detail-modal');
    const requestId = modal.dataset.currentRequestId;
    
    if (confirm(`Approve request ${requestId} and generate inbound batch?`)) {
        updateRequestStatus(requestId, 'approved');
        alert(`Request ${requestId} approved successfully! Inbound batch generated.`);
        modal.classList.add('hidden');
    }
}

// 拒绝请求
function rejectRequest() {
    const modal = document.getElementById('request-detail-modal');
    const requestId = modal.dataset.currentRequestId;
    
    const reason = prompt('Please enter rejection reason:');
    if (reason !== null) {
        updateRequestStatus(requestId, 'rejected');
        alert(`Request ${requestId} rejected. Reason: ${reason}`);
        modal.classList.add('hidden');
    }
}

// 更新请求状态
function updateRequestStatus(requestId, newStatus) {
    const request = replenishmentRequests.find(r => r.id === requestId);
    if (request) {
        request.status = newStatus;
        loadReplenishmentRequests();
    }
}

// 应用补货申请过滤器
function applyRequestFilters() {
    const branchFilter = document.getElementById('request-branch-filter').value;
    const statusFilter = document.getElementById('request-status-filter').value;
    const dateFrom = document.getElementById('request-date-from').value;
    const dateTo = document.getElementById('request-date-to').value;
    const urgencyFilter = document.getElementById('request-urgency-filter').value;
    
    // 在实际应用中，这里会向后端发送过滤请求
    // 这里我们只是模拟一下
    console.log('Applying filters:', { branchFilter, statusFilter, dateFrom, dateTo, urgencyFilter });
    
    // 重新加载数据（在实际应用中，这里应该是过滤后的数据）
    loadReplenishmentRequests();
}

// 重置补货申请过滤器
function resetRequestFilters() {
    document.getElementById('request-branch-filter').value = 'all';
    document.getElementById('request-status-filter').value = 'all';
    document.getElementById('request-date-from').value = '';
    document.getElementById('request-date-to').value = '';
    document.getElementById('request-urgency-filter').value = 'all';
    
    // 重新加载所有数据
    loadReplenishmentRequests();
}

// 加载按分店的库存总览（支持筛选）
function loadStockOverviewByBranch(branchId = 'all') {
    const container = document.getElementById('stock-branch-table-body');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 过滤数据
    let filteredData;
    if (branchId === 'all') {
        filteredData = stockOverviewByBranchDetail;
    } else {
        filteredData = stockOverviewByBranchDetail.filter(item => item.branchId === branchId);
    }
    
    // 更新计数
    updateStockSummary(filteredData, branchId);
    
    // 如果没有数据
    if (filteredData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <i class="fa fa-inbox text-3xl text-gray-300 mb-2"></i>
                    <p>No inventory data found</p>
                </div>
            </td>
        `;
        container.appendChild(row);
        return;
    }
    
    // 渲染数据
    filteredData.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.sku = item.sku;
        row.dataset.branchId = item.branchId;
        row.dataset.stockStatus = item.stockStatus;
        
        // 库存状态样式
        let statusClass = '';
        let statusIcon = '';
        switch (item.stockStatus) {
            case 'Low':
                statusClass = 'bg-red-100 text-red-800';
                statusIcon = '<i class="fa fa-exclamation-triangle mr-1"></i>';
                break;
            case 'Medium':
                statusClass = 'bg-yellow-100 text-yellow-800';
                statusIcon = '<i class="fa fa-exclamation-circle mr-1"></i>';
                break;
            case 'Good':
                statusClass = 'bg-green-100 text-green-800';
                statusIcon = '<i class="fa fa-check-circle mr-1"></i>';
                break;
        }
        
        // 分店样式
        const branchInfo = branchMap[item.branchId];
        const branchColor = branchInfo ? branchInfo.color : 'bg-gray-100 text-gray-800';
        
        // 库存数量样式
        let stockClass = '';
        if (item.currentStock <= 5) {
            stockClass = 'text-red-600 font-medium';
        } else if (item.currentStock <= 10) {
            stockClass = 'text-yellow-600';
        } else {
            stockClass = 'text-green-600';
        }
        
        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-mono">${item.sku}</td>
            <td class="px-4 py-4 text-sm font-medium">${item.title}</td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${branchColor} rounded-full">${item.branchName}</span>
            </td>
            <td class="px-4 py-4 text-sm ${stockClass} font-medium">${item.currentStock}</td>
            <td class="px-4 py-4 text-sm">${formatDate(item.lastInbound)}</td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full inline-flex items-center">
                    ${statusIcon}${item.stockStatus}
                </span>
            </td>
        `;
        container.appendChild(row);
    });
    
    // 添加点击事件，可以查看详情
    addStockRowClickListeners();
}

// 更新库存摘要
function updateStockSummary(data, selectedBranchId) {
    const totalItems = data.length;
    const lowStock = data.filter(item => item.stockStatus === 'Low').length;
    const mediumStock = data.filter(item => item.stockStatus === 'Medium').length;
    const goodStock = data.filter(item => item.stockStatus === 'Good').length;
    
    // 更新计数
    const totalItemsCount = document.getElementById('total-items-count');
    const lowStockCount = document.getElementById('low-stock-count');
    const mediumStockCount = document.getElementById('medium-stock-count');
    const goodStockCount = document.getElementById('good-stock-count');
    const branchStockCount = document.getElementById('branch-stock-count');
    const branchTotalCount = document.getElementById('branch-total-count');
    const selectedBranchName = document.getElementById('selected-branch-name');
    
    if (totalItemsCount) totalItemsCount.textContent = totalItems;
    if (lowStockCount) lowStockCount.textContent = lowStock;
    if (mediumStockCount) mediumStockCount.textContent = mediumStock;
    if (goodStockCount) goodStockCount.textContent = goodStock;
    if (branchStockCount) branchStockCount.textContent = totalItems;
    if (branchTotalCount) branchTotalCount.textContent = totalItems;
    
    // 更新选中的分店名称
    const branchStockFilter = document.getElementById('branch-stock-filter');
    if (selectedBranchName && branchStockFilter) {
        const selectedBranchNameText = branchStockFilter.options[branchStockFilter.selectedIndex].text;
        selectedBranchName.textContent = selectedBranchNameText;
    }
}

// 添加库存行点击监听器
function addStockRowClickListeners() {
    document.querySelectorAll('#stock-branch-table-body tr[data-sku]').forEach(row => {
        row.addEventListener('click', function() {
            const sku = this.dataset.sku;
            const branchId = this.dataset.branchId;
            const stockStatus = this.dataset.stockStatus;
            
            // 在实际应用中，这里可以打开详情模态框
            // 这里我们只是显示一个提示
            const item = stockOverviewByBranchDetail.find(item => 
                item.sku === sku && item.branchId === branchId
            );
            
            if (item) {
                alert(`SKU: ${item.sku}\nTitle: ${item.title}\nBranch: ${item.branchName}\nStock: ${item.currentStock}\nStatus: ${item.stockStatus}\nLast Inbound: ${formatDate(item.lastInbound)}\nCategory: ${item.category}\nPrice: ¥${item.price.toFixed(2)}`);
            }
        });
    });
}

// 加载按SKU的库存总览
function loadStockOverviewBySKU() {
    const container = document.getElementById('stock-sku-table-body');
    if (!container) return;
    
    container.innerHTML = '';
    
    // 为每个SKU创建数据
    const skuData = {};
    
    // 初始化所有SKU
    allSKUs.forEach(sku => {
        skuData[sku] = {
            sku: sku,
            title: getBookTitleBySKU(sku),
            centralPlaza: 0,
            riverside: 0,
            westside: 0,
            northgate: 0,
            southpoint: 0,
            eastview: 0,
            downtown: 0
        };
    });
    
    // 填充数据
    stockOverviewByBranchDetail.forEach(item => {
        if (skuData[item.sku]) {
            switch (item.branchId) {
                case 'ST001':
                    skuData[item.sku].centralPlaza = item.currentStock;
                    break;
                case 'ST002':
                    skuData[item.sku].riverside = item.currentStock;
                    break;
                case 'ST003':
                    skuData[item.sku].westside = item.currentStock;
                    break;
                case 'ST004':
                    skuData[item.sku].northgate = item.currentStock;
                    break;
                case 'ST005':
                    skuData[item.sku].southpoint = item.currentStock;
                    break;
                case 'ST006':
                    skuData[item.sku].eastview = item.currentStock;
                    break;
                case 'ST007':
                    skuData[item.sku].downtown = item.currentStock;
                    break;
            }
        }
    });
    
    // 渲染表格
    Object.values(skuData).forEach(sku => {
        if (sku.title) { // 只显示有标题的SKU
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.dataset.sku = sku.sku;
            
            // 计算每个分店的库存状态样式
            const getStockStatusClass = (quantity) => {
                if (quantity <= 5) return 'text-red-600 font-medium';
                if (quantity <= 10) return 'text-yellow-600';
                return 'text-green-600';
            };
            
            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-mono">${sku.sku}</td>
                <td class="px-4 py-4 text-sm font-medium">${sku.title}</td>
                <td class="px-4 py-4 text-sm ${getStockStatusClass(sku.centralPlaza)}">${sku.centralPlaza}</td>
                <td class="px-4 py-4 text-sm ${getStockStatusClass(sku.riverside)}">${sku.riverside}</td>
                <td class="px-4 py-4 text-sm ${getStockStatusClass(sku.westside)}">${sku.westside}</td>
                <td class="px-4 py-4 text-sm ${getStockStatusClass(sku.northgate)}">${sku.northgate}</td>
                <td class="px-4 py-4 text-sm ${getStockStatusClass(sku.southpoint)}">${sku.southpoint}</td>
                <td class="px-4 py-4 text-sm ${getStockStatusClass(sku.eastview)}">${sku.eastview}</td>
                <td class="px-4 py-4 text-sm ${getStockStatusClass(sku.downtown)}">${sku.downtown}</td>
            `;
            container.appendChild(row);
        }
    });
    
    // 添加SKU行点击监听器
    addSKURowClickListeners();
}

// 根据SKU获取书名
function getBookTitleBySKU(sku) {
    const item = stockOverviewByBranchDetail.find(item => item.sku === sku);
    return item ? item.title : '';
}

// 添加SKU行点击监听器
function addSKURowClickListeners() {
    document.querySelectorAll('#stock-sku-table-body tr[data-sku]').forEach(row => {
        row.addEventListener('click', function() {
            const sku = this.dataset.sku;
            
            // 获取该SKU在所有分店的库存
            const branchStocks = stockOverviewByBranchDetail.filter(item => item.sku === sku);
            
            if (branchStocks.length > 0) {
                let message = `SKU: ${sku}\nTitle: ${branchStocks[0].title}\n\nStock Distribution:\n`;
                
                branchStocks.forEach(stock => {
                    message += `${stock.branchName}: ${stock.currentStock} (${stock.stockStatus})\n`;
                });
                
                const totalStock = branchStocks.reduce((sum, stock) => sum + stock.currentStock, 0);
                message += `\nTotal Stock: ${totalStock}`;
                
                alert(message);
            }
        });
    });
}

// 按状态筛选库存
function filterStockByStatus(status) {
    const branchStockFilter = document.getElementById('branch-stock-filter');
    const selectedBranch = branchStockFilter.value;
    
    let filteredData;
    if (selectedBranch === 'all') {
        filteredData = stockOverviewByBranchDetail.filter(item => item.stockStatus === status);
    } else {
        filteredData = stockOverviewByBranchDetail.filter(item => 
            item.branchId === selectedBranch && item.stockStatus === status
        );
    }
    
    // 更新表格
    updateStockTable(filteredData);
    
    // 更新计数
    updateStockSummary(filteredData, selectedBranch);
    
    // 显示筛选状态
    const statusNames = {
        'Low': 'Low Stock',
        'Medium': 'Medium Stock',
        'Good': 'Good Stock'
    };
    
    alert(`Showing ${filteredData.length} items with ${statusNames[status]} status${selectedBranch !== 'all' ? ` in ${branchMap[selectedBranch]?.name || selectedBranch}` : ''}`);
}

// 更新库存表格
function updateStockTable(data) {
    const container = document.getElementById('stock-branch-table-body');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="6" class="px-4 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <i class="fa fa-inbox text-3xl text-gray-300 mb-2"></i>
                    <p>No items found with the selected criteria</p>
                </div>
            </td>
        `;
        container.appendChild(row);
        return;
    }
    
    // 渲染数据
    data.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.sku = item.sku;
        row.dataset.branchId = item.branchId;
        row.dataset.stockStatus = item.stockStatus;
        
        // 库存状态样式
        let statusClass = '';
        let statusIcon = '';
        switch (item.stockStatus) {
            case 'Low':
                statusClass = 'bg-red-100 text-red-800';
                statusIcon = '<i class="fa fa-exclamation-triangle mr-1"></i>';
                break;
            case 'Medium':
                statusClass = 'bg-yellow-100 text-yellow-800';
                statusIcon = '<i class="fa fa-exclamation-circle mr-1"></i>';
                break;
            case 'Good':
                statusClass = 'bg-green-100 text-green-800';
                statusIcon = '<i class="fa fa-check-circle mr-1"></i>';
                break;
        }
        
        // 分店样式
        const branchInfo = branchMap[item.branchId];
        const branchColor = branchInfo ? branchInfo.color : 'bg-gray-100 text-gray-800';
        
        // 库存数量样式
        let stockClass = '';
        if (item.currentStock <= 5) {
            stockClass = 'text-red-600 font-medium';
        } else if (item.currentStock <= 10) {
            stockClass = 'text-yellow-600';
        } else {
            stockClass = 'text-green-600';
        }
        
        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-mono">${item.sku}</td>
            <td class="px-4 py-4 text-sm font-medium">${item.title}</td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${branchColor} rounded-full">${item.branchName}</span>
            </td>
            <td class="px-4 py-4 text-sm ${stockClass} font-medium">${item.currentStock}</td>
            <td class="px-4 py-4 text-sm">${formatDate(item.lastInbound)}</td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full inline-flex items-center">
                    ${statusIcon}${item.stockStatus}
                </span>
            </td>
        `;
        container.appendChild(row);
    });
    
    // 重新添加点击事件
    addStockRowClickListeners();
}

// SKU搜索
function performSKUSearch(searchTerm) {
    const container = document.getElementById('stock-sku-table-body');
    if (!container) return;
    
    const rows = container.querySelectorAll('tr[data-sku]');
    
    if (!searchTerm) {
        // 显示所有行
        rows.forEach(row => {
            row.style.display = '';
        });
        return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const sku = row.dataset.sku.toLowerCase();
        const title = row.cells[1].textContent.toLowerCase();
        
        if (sku.includes(searchLower) || title.includes(searchLower)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// 导出库存到Excel
function exportStockToExcel() {
    const branchStockFilter = document.getElementById('branch-stock-filter');
    const selectedBranch = branchStockFilter.value;
    
    let dataToExport;
    if (selectedBranch === 'all') {
        dataToExport = stockOverviewByBranchDetail;
    } else {
        dataToExport = stockOverviewByBranchDetail.filter(item => item.branchId === selectedBranch);
    }
    
    // 在实际应用中，这里会生成Excel文件
    // 这里我们只是模拟一下
    const branchName = selectedBranch === 'all' ? 'All Branches' : branchMap[selectedBranch]?.name;
    
    alert(`Exporting ${dataToExport.length} items from ${branchName} to Excel...\n\nIn a real application, this would generate and download an Excel file.`);
    
    // 模拟导出
    console.log('Exporting data:', dataToExport);
}

// 格式化日期时间
function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// 格式化日期
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
    });
}

// 修复缺失的函数
function addInventoryActionButtonListeners() {
    // 这里可以添加库存表格按钮的事件监听器
    console.log('Inventory action button listeners initialized');
}

// 初始化布局后调用
document.addEventListener('DOMContentLoaded', function() {
    // 确保库存管理相关事件监听器已初始化
    initInventoryEventListeners();
});