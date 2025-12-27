// 财务系统核心功能

// 立即添加样式
function addStatusStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* 发票状态样式 */
        .invoice-unpaid { background-color: #fee2e2; color: #dc2626; }
        .invoice-partial { background-color: #fef3c7; color: #d97706; }
        .invoice-paid { background-color: #d1fae5; color: #059669; }
        .invoice-overdue { background-color: #ffedd5; color: #ea580c; }
        .invoice-void { background-color: #f3f4f6; color: #6b7280; }
        
        /* 订单状态样式 */
        .order-created { background-color: #dbeafe; color: #1e40af; }
        .order-processing { background-color: #fef3c7; color: #d97706; }
        .order-paid { background-color: #d1fae5; color: #059669; }
        .order-completed { background-color: #f3e8ff; color: #7c3aed; }
        
        /* Modal styles */
        .modal {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* 总收入卡片样式 */
        .total-revenue-card {
            background: linear-gradient(135deg, #8B5A2B 0%, #D2B48C 100%);
            color: white;
            border-radius: 12px;
            padding: 24px;
            box-shadow: 0 10px 20px rgba(139, 90, 43, 0.2);
            transition: all 0.3s ease;
        }
        
        .total-revenue-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 15px 30px rgba(139, 90, 43, 0.3);
        }
        
        .revenue-trend-up {
            color: #10B981;
        }
        
        .revenue-trend-down {
            color: #EF4444;
        }
        
        .stat-card {
            background: white;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transition: all 0.3s ease;
        }
        
        .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }
        
        /* 紧凑日期选择器 */
        .compact-date-selector {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
        }
        
        .compact-date-input {
            padding: 6px 10px;
            border: 1px solid #e5e7eb;
            border-radius: 4px;
            font-size: 13px;
            max-width: 120px;
        }
        
        /* 确保图表响应式 */
        canvas {
            display: block;
            max-width: 100%;
            height: auto !important;
        }
        
        /* 侧边栏高亮样式 */
        .sidebar-link.active {
            background-color: rgba(210, 180, 140, 0.3) !important;
            color: #8B5A2B !important;
            font-weight: 500 !important;
        }
        
        /* 打印样式 */
        @media print {
            .no-print {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Global chart instances
let paymentMethodPieChart = null;
let revenueByDateChart = null;
let purchaseCostByDateChart = null;

// 支付方式数据 - 修复重复声明问题
if (typeof paymentMethodData === 'undefined') {
    var paymentMethodData = {
        distribution: {
            labels: ['Credit Card', 'Third-Party Payment', 'Cash'],
            data: [125000, 85000, 65000],
            colors: ['#774b30', '#a9805b', '#9f5933']
        }
    };
}

// 总收入统计
const totalRevenueStats = {
    currentMonth: 86420,
    lastMonth: 82000,
    growth: 5.4
};

// ====================== 页面切换功能 ======================

window.financeSwitchPage = function(pageId) {
    console.log('Switching to page:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        
        // 保存当前页面状态
        sessionStorage.setItem('currentPage', pageId);
        
        // Initialize page content based on pageId
        setTimeout(() => {
            switch (pageId) {
                case 'income-stats':
                    initIncomeStatsCharts();
                    break;
                case 'order':
                    initOrderPage();
                    break;
                case 'invoice':
                    initInvoicePage();
                    break;
            }
        }, 50);
    } else {
        console.error(`Page not found: ${pageId}-page`);
    }
};

// ====================== Financial Overview Charts ======================

function initIncomeStatsCharts() {
    console.log('Initializing financial overview charts...');
    
    // Render total revenue card
    renderTotalRevenueCard();
    
    // Payment method revenue pie chart
    initPaymentMethodPieChart();
    
    // Revenue by date chart
    renderRevenueByDateChart();

    // Purchase cost by date chart
    renderPurchaseCostByDateChart();
}

function renderTotalRevenueCard() {
    const container = document.getElementById('total-revenue-container');
    if (!container) {
        console.error('Total revenue container not found');
        return;
    }
    
    const growthClass = totalRevenueStats.growth >= 0 ? 'revenue-trend-up' : 'revenue-trend-down';
    const growthIcon = totalRevenueStats.growth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    container.innerHTML = `
        <div class="total-revenue-card">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                <div class="w-full">
                    <p class="text-white/80 text-sm mb-1">Total Revenue (Current Month)</p>
                    <h3 class="text-3xl font-bold mb-2">¥${totalRevenueStats.currentMonth.toLocaleString()}</h3>
                    <div class="flex items-center gap-2">
                        <span class="${growthClass} text-sm font-medium">
                            <i class="fa ${growthIcon} mr-1"></i>${Math.abs(totalRevenueStats.growth)}%
                        </span>
                        <span class="text-white/70 text-sm">vs last month (¥${totalRevenueStats.lastMonth.toLocaleString()})</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initPaymentMethodPieChart() {
    const paymentMethodCtx = document.getElementById('payment-method-pie-chart');
    if (!paymentMethodCtx) {
        console.error('Payment method chart canvas not found');
        return;
    }
    
    const ctx = paymentMethodCtx.getContext('2d');
    if (!ctx) {
        console.error('Cannot get 2D context for payment method chart');
        return;
    }
    
    // 销毁现有图表
    if (paymentMethodPieChart) {
        paymentMethodPieChart.destroy();
    }
    
    // 创建新图表
    paymentMethodPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: paymentMethodData.distribution.labels,
            datasets: [{
                data: paymentMethodData.distribution.data,
                backgroundColor: paymentMethodData.distribution.colors,
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 20,
                hoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    top: 15,
                    bottom: 50,
                    left: 15,
                    right: 15
                }
            },
            plugins: {
                legend: { 
                    position: 'bottom',
                    labels: {
                        padding: 25,
                        usePointStyle: true,
                        pointStyle: 'rect',
                        pointStyleWidth: 22,
                        pointStyleHeight: 22,
                        font: {
                            size: 13,
                            weight: '500'
                        },
                        color: '#374151'
                    },
                    align: 'center'
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#374151',
                    bodyColor: '#374151',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 6,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ¥${value.toLocaleString()} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function renderRevenueByDateChart() {
    const container = document.getElementById('revenue-by-date-chart-container');
    if (!container) {
        console.error('Revenue by date chart container not found');
        return;
    }
    
    // 生成示例数据 - 过去14天的收入
    const dates = [];
    const revenues = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        dates.push(formatDate(date));
        
        // 生成随机收入数据 (5000-15000之间)
        revenues.push(Math.floor(Math.random() * 10000) + 5000);
    }
    
    container.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 class="font-semibold text-lg">Revenue by Date</h3>
            <div class="compact-date-selector mt-2 md:mt-0">
                <input type="date" class="compact-date-input" id="revenue-start-date" value="${dates[0]}">
                <span>to</span>
                <input type="date" class="compact-date-input" id="revenue-end-date" value="${dates[dates.length - 1]}">
                <button class="btn-secondary text-sm px-3 py-1" id="revenue-date-filter">Apply</button>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="revenue-by-date-chart" class="chart-responsive"></canvas>
        </div>
    `;
    
    // 初始化图表
    const ctx = document.getElementById('revenue-by-date-chart').getContext('2d');
    if (revenueByDateChart) {
        revenueByDateChart.destroy();
    }
    
    revenueByDateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                label: 'Revenue',
                data: revenues,
                backgroundColor: '#8B5A2B',
                borderRadius: 6,
                barPercentage: 0.6,
                categoryPercentage: 0.7
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#374151',
                    bodyColor: '#374151',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 6,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `Revenue: ¥${context.raw.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
    
    // 添加日期筛选事件
    document.getElementById('revenue-date-filter').addEventListener('click', function() {
        // 这里可以添加实际的日期筛选逻辑
        console.log('Filtering revenue by date range');
    });
}

function renderPurchaseCostByDateChart() {
    const container = document.getElementById('purchase-cost-by-date-chart-container');
    if (!container) {
        console.error('Purchase cost chart container not found');
        return;
    }
    
    // 生成示例数据 - 过去14天的采购成本
    const dates = [];
    const costs = [];
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        dates.push(formatDate(date));
        
        // 生成随机成本数据 (3000-9000之间)
        costs.push(Math.floor(Math.random() * 6000) + 3000);
    }
    
    container.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 class="font-semibold text-lg">Purchase Cost by Date</h3>
            <div class="compact-date-selector mt-2 md:mt-0">
                <input type="date" class="compact-date-input" id="cost-start-date" value="${dates[0]}">
                <span>to</span>
                <input type="date" class="compact-date-input" id="cost-end-date" value="${dates[dates.length - 1]}">
                <button class="btn-secondary text-sm px-3 py-1" id="cost-date-filter">Apply</button>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="purchase-cost-by-date-chart" class="chart-responsive"></canvas>
        </div>
    `;
    
    // 初始化图表
    const ctx = document.getElementById('purchase-cost-by-date-chart').getContext('2d');
    if (purchaseCostByDateChart) {
        purchaseCostByDateChart.destroy();
    }
    
    purchaseCostByDateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [{
                label: 'Purchase Cost',
                data: costs,
                backgroundColor: 'rgba(79, 121, 66, 0.1)',
                borderColor: '#4F7942',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#4F7942',
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '¥' + value.toLocaleString();
                        }
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#374151',
                    bodyColor: '#374151',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 6,
                    padding: 12,
                    callbacks: {
                        label: function(context) {
                            return `Cost: ¥${context.raw.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
    
    // 添加日期筛选事件
    document.getElementById('cost-date-filter').addEventListener('click', function() {
        // 这里可以添加实际的日期筛选逻辑
        console.log('Filtering costs by date range');
    });
}

// 格式化日期为YYYY-MM-DD
const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// 订单管理初始化
function initOrderPage() {
    console.log('Initializing Order page...');
    renderOrderList();
    initOrderFilters();
}

// 初始化订单筛选器
function initOrderFilters() {
    // 搜索按钮事件
    document.getElementById('order-search-btn').addEventListener('click', filterOrders);
    
    // 重置按钮事件
    document.getElementById('order-reset-btn').addEventListener('click', resetOrderFilters);
    
    // 刷新按钮事件
    document.getElementById('refresh-orders-btn').addEventListener('click', function() {
        renderOrderList();
    });
    
    // 搜索框回车事件
    document.getElementById('order-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterOrders();
        }
    });
}

// 筛选订单
function filterOrders() {
    const searchTerm = document.getElementById('order-search').value.toLowerCase();
    const statusFilter = document.getElementById('order-status-filter').value;
    const storeFilter = document.getElementById('order-store-filter').value;
    const dateFrom = document.getElementById('order-date-from').value;
    const dateTo = document.getElementById('order-date-to').value;
    
    // 筛选逻辑
    const filteredOrders = Object.values(orderData).filter(order => {
        // 搜索词筛选
        if (searchTerm && !(
            order.orderId.toLowerCase().includes(searchTerm) ||
            order.memberId.toLowerCase().includes(searchTerm) ||
            order.memberName.toLowerCase().includes(searchTerm)
        )) {
            return false;
        }
        
        // 状态筛选
        if (statusFilter && order.orderStatus !== statusFilter) {
            return false;
        }
        
        // 门店筛选
        if (storeFilter && order.storeId !== storeFilter) {
            return false;
        }
        
        // 日期筛选
        const orderDate = new Date(order.orderDate).toISOString().split('T')[0];
        if (dateFrom && orderDate < dateFrom) {
            return false;
        }
        if (dateTo && orderDate > dateTo) {
            return false;
        }
        
        return true;
    });
    
    renderOrderList(filteredOrders);
}

// 重置订单筛选器
function resetOrderFilters() {
    document.getElementById('order-search').value = '';
    document.getElementById('order-status-filter').value = '';
    document.getElementById('order-store-filter').value = '';
    document.getElementById('order-date-from').value = '';
    document.getElementById('order-date-to').value = '';
    
    renderOrderList();
}

// 渲染订单列表
function renderOrderList(orders = Object.values(orderData)) {
    const container = document.getElementById('order-table-body');
    if (!container) {
        console.error('Order table body not found');
        return;
    }

    container.innerHTML = '';
    
    if (orders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    No orders found matching your criteria.
                </td>
            </tr>
        `;
        return;
    }
    
    orders.forEach(order => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.orderId = order.orderId;

        // 状态样式映射
        let statusClass = '';
        let statusText = '';
        switch (order.orderStatus) {
            case 'created':
                statusClass = 'order-created';
                statusText = 'Created';
                break;
            case 'processing':
                statusClass = 'order-processing';
                statusText = 'Processing';
                break;
            case 'paid':
                statusClass = 'order-paid';
                statusText = 'Paid';
                break;
            case 'completed':
                statusClass = 'order-completed';
                statusText = 'Completed';
                break;

            default:
                statusClass = 'bg-gray-100 text-gray-800';
                statusText = order.orderStatus;
        }

        // 格式化日期
        const orderDate = new Date(order.orderDate);
        const formattedDate = orderDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${order.orderId}</td>
            <td class="px-4 py-4 text-sm">${order.storeName}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex flex-col">
                    <span class="font-medium">${order.memberId}</span>
                    <span class="text-xs text-gray-500">${order.memberName}</span>
                </div>
            </td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${statusText}</span>
            </td>
            <td class="px-4 py-4 text-sm">${formattedDate}</td>
            <td class="px-4 py-4 text-sm">¥${order.payableAmount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">${order.itemCount} items</td>
            <td class="px-4 py-4 text-sm truncate max-w-xs" title="${order.note || 'No note'}">
                ${order.note ? (order.note.length > 30 ? order.note.substring(0, 30) + '...' : order.note) : '—'}
            </td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-[#8B5A2B] hover:text-[#8B5A2B]/80 view-order" data-order="${order.orderId}" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 edit-order" data-order="${order.orderId}" title="Edit Order">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-800 create-invoice" data-order="${order.orderId}" title="Create Invoice">
                        <i class="fa fa-file-text"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });

    // Update pagination info
    updateOrderPaginationInfo(orders.length);
    
    // Add event listeners to buttons
    addOrderEventListeners();
}

// 更新订单分页信息
function updateOrderPaginationInfo(totalOrders) {
    const paginationInfo = document.getElementById('order-pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `Showing ${totalOrders} orders`;
    }
}

// 添加订单事件监听器
function addOrderEventListeners() {
    // 为查看订单按钮添加事件
    document.querySelectorAll('.view-order').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order');
            viewOrderDetails(orderId);
        });
    });

    // 为编辑订单按钮添加事件
    document.querySelectorAll('.edit-order').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order');
            editOrder(orderId);
        });
    });

    // 为创建发票按钮添加事件
    document.querySelectorAll('.create-invoice').forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order');
            createInvoiceFromOrder(orderId);
        });
    });
}

// 查看订单详情
function viewOrderDetails(orderId) {
    console.log('Viewing order details:', orderId);
    // 实现查看订单详情的逻辑
}

// 编辑订单
function editOrder(orderId) {
    console.log('Editing order:', orderId);
    // 实现编辑订单的逻辑
}

// 从订单创建发票
function createInvoiceFromOrder(orderId) {
    console.log('Creating invoice for order:', orderId);
    // 实现从订单创建发票的逻辑
}

// 发票管理初始化
function initInvoicePage() {
    console.log('Initializing Invoice page...');
    renderInvoiceList();
    initInvoiceFilters();
    
    // 创建发票按钮事件
    document.getElementById('create-invoice-btn').addEventListener('click', function() {
        openCreateInvoiceModal();
    });
}

// 渲染发票列表
function renderInvoiceList(invoices = Object.values(invoiceData)) {
    const container = document.getElementById('invoice-table-body');
    if (!container) {
        console.error('Invoice table body not found');
        return;
    }

    container.innerHTML = '';
    
    if (invoices.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="11" class="px-4 py-8 text-center text-gray-500">
                    No invoices found matching your criteria.
                </td>
            </tr>
        `;
        return;
    }
    
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.invoiceId = invoice.invoiceId;

        // 状态样式映射
        let statusClass = '';
        switch (invoice.status) {
            case 'UNPAID':
                statusClass = 'invoice-unpaid';
                break;
            case 'PARTIAL':
                statusClass = 'invoice-partial';
                break;
            case 'PAID':
                statusClass = 'invoice-paid';
                break;
            case 'OVERDUE':
                statusClass = 'invoice-overdue';
                break;
            case 'VOID':
                statusClass = 'invoice-void';
                break;
            default:
                statusClass = 'bg-gray-100 text-gray-800';
        }

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${invoice.invoiceNumber}</td>
            <td class="px-4 py-4 text-sm">${invoice.orderId}</td>
            <td class="px-4 py-4 text-sm">${invoice.storeName}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex flex-col">
                    <span class="font-medium">${invoice.memberId}</span>
                    <span class="text-xs text-gray-500">${invoice.memberName}</span>
                </div>
            </td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${invoice.status}</span>
            </td>
            <td class="px-4 py-4 text-sm">${invoice.issuedAt}</td>
            <td class="px-4 py-4 text-sm">${invoice.dueDate}</td>
            <td class="px-4 py-4 text-sm font-medium">¥${invoice.invoiceAmount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">¥${invoice.paidAmount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm ${invoice.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}">
                ¥${invoice.balanceAmount.toLocaleString()}
            </td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-[#8B5A2B] hover:text-[#8B5A2B]/80 view-invoice" data-invoice="${invoice.invoiceId}" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 edit-invoice" data-invoice="${invoice.invoiceId}" title="Edit Invoice">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-800 receive-payment" data-invoice="${invoice.invoiceId}" title="Record Payment">
                        <i class="fa fa-credit-card"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 download-invoice" data-invoice="${invoice.invoiceId}" title="Download PDF">
                        <i class="fa fa-download"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });

    // Update pagination info
    updateInvoicePaginationInfo(invoices.length);
    
    // Add event listeners to buttons
    addInvoiceEventListeners();
}

// 初始化发票筛选器
function initInvoiceFilters() {
    // 搜索按钮事件
    document.getElementById('invoice-search-btn').addEventListener('click', filterInvoices);
    
    // 重置按钮事件
    document.getElementById('invoice-reset-btn').addEventListener('click', resetInvoiceFilters);
    
    // 搜索框回车事件
    document.getElementById('invoice-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            filterInvoices();
        }
    });
}

// 筛选发票
function filterInvoices() {
    const searchTerm = document.getElementById('invoice-search').value.toLowerCase();
    const statusFilter = document.getElementById('invoice-status-filter').value;
    const staffFilter = document.getElementById('invoice-staff-filter').value;
    const orderFilter = document.getElementById('invoice-order-filter').value;
    const dateFrom = document.getElementById('invoice-start-date').value;
    const dateTo = document.getElementById('invoice-end-date').value;
    
    // 筛选逻辑
    const filteredInvoices = Object.values(invoiceData).filter(invoice => {
        // 搜索词筛选
        if (searchTerm && !(
            invoice.invoiceId.toLowerCase().includes(searchTerm) ||
            invoice.invoiceNumber.toLowerCase().includes(searchTerm) ||
            invoice.memberName.toLowerCase().includes(searchTerm)
        )) {
            return false;
        }
        
        // 状态筛选
        if (statusFilter && invoice.status !== statusFilter) {
            return false;
        }
        
        // 员工筛选
        if (staffFilter && invoice.createdBy !== staffFilter) {
            return false;
        }
        
        // 订单筛选
        if (orderFilter && invoice.orderId !== orderFilter) {
            return false;
        }
        
        // 日期筛选
        if (dateFrom && invoice.issuedAt < dateFrom) {
            return false;
        }
        if (dateTo && invoice.issuedAt > dateTo) {
            return false;
        }
        
        return true;
    });
    
    renderInvoiceList(filteredInvoices);
}

// 重置发票筛选器
function resetInvoiceFilters() {
    document.getElementById('invoice-search').value = '';
    document.getElementById('invoice-status-filter').value = '';
    document.getElementById('invoice-staff-filter').value = '';
    document.getElementById('invoice-order-filter').value = '';
    document.getElementById('invoice-start-date').value = '';
    document.getElementById('invoice-end-date').value = '';
    
    renderInvoiceList();
}

// 更新发票分页信息
function updateInvoicePaginationInfo(totalInvoices) {
    const paginationInfo = document.getElementById('invoice-pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `Showing ${totalInvoices} invoices`;
    }
}

// 添加发票事件监听器
function addInvoiceEventListeners() {
    // 为查看发票按钮添加事件
    document.querySelectorAll('.view-invoice').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-invoice');
            viewInvoiceDetails(invoiceId);
        });
    });

    // 为编辑发票按钮添加事件
    document.querySelectorAll('.edit-invoice').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-invoice');
            editInvoice(invoiceId);
        });
    });

    // 为收款按钮添加事件
    document.querySelectorAll('.receive-payment').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-invoice');
            receivePayment(invoiceId);
        });
    });

    // 为下载发票按钮添加事件
    document.querySelectorAll('.download-invoice').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-invoice');
            downloadInvoice(invoiceId);
        });
    });
}

// 查看发票详情
function viewInvoiceDetails(invoiceId) {
    console.log('Viewing invoice details:', invoiceId);
    // 实现查看发票详情的逻辑
}

// 编辑发票
function editInvoice(invoiceId) {
    console.log('Editing invoice:', invoiceId);
    // 实现编辑发票的逻辑
}

// 记录收款
function receivePayment(invoiceId) {
    console.log('Recording payment for invoice:', invoiceId);
    // 实现记录收款的逻辑
}

// 下载发票
function downloadInvoice(invoiceId) {
    console.log('Downloading invoice:', invoiceId);
    // 实现下载发票的逻辑
}

// 打开创建发票模态框
function openCreateInvoiceModal() {
    console.log('Opening create invoice modal');
    // 实现打开创建发票模态框的逻辑
}

// 页面初始化
function initFinancePage() {
    console.log('Finance page initialized');
    addStatusStyles();
    
    // 尝试从sessionStorage获取最后访问的页面
    const lastPage = sessionStorage.getItem('currentPage') || 'income-stats';
    
    // 初始化布局
    initLayout('finance', lastPage);
}

// 添加侧边栏点击监听器
function addSidebarClickListeners() {
    document.querySelectorAll('[data-page]').forEach(item => {
        item.addEventListener('click', function() {
            const pageId = this.getAttribute('data-page');
            switchPage(pageId);
        });
    });
}

// 当DOM加载完成后初始化财务页面
document.addEventListener('DOMContentLoaded', function() {
    initFinancePage();
});