// scripts/finance.js
const CURRENCY_SYMBOL = '\uFFE5';

// ==========================================
// 补丁：放在文件最前面
// ==========================================
window.showLoading = function(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (container) {
        container.innerHTML = `
            <tr>
                <td colspan="100%" class="px-4 py-10 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center">
                        <i class="fa fa-circle-o-notch fa-spin text-3xl text-[#8B5A2B] mb-2"></i>
                        <span class="text-sm font-medium">${message}</span>
                    </div>
                </td>
            </tr>
        `;
    }
};

window.hideLoading = function() {
    // 占位函数，防止报错
};
// ==========================================


function addStatusStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* =========================================
           1. 补全状态颜色 (对应 JS 中的 switch 逻辑)
           防止 Tailwind 未加载时颜色丢失
           ========================================= */
        
        /* PAID (绿色) */
        .bg-green-100 { background-color: #d1fae5 !important; }
        .text-green-800 { color: #065f46 !important; }

        /* PARTLY_PAID (黄色) */
        .bg-yellow-100 { background-color: #fef3c7 !important; }
        .text-yellow-800 { color: #92400e !important; }

        /* DRAFT / ISSUED (蓝色) */
        .bg-blue-50 { background-color: #eff6ff !important; }
        .bg-blue-100 { background-color: #dbeafe !important; }
        .text-blue-600 { color: #2563eb !important; }
        .text-blue-800 { color: #1e40af !important; }

        /* OVERDUE (红色) */
        .bg-red-100 { background-color: #fee2e2 !important; }
        .text-red-800 { color: #991b1b !important; }

        /* VOID (灰色) */
        .bg-gray-200 { background-color: #e5e7eb !important; }
        .text-gray-600 { color: #4b5563 !important; }
        
        /* CREDITED (紫色) */
        .bg-purple-100 { background-color: #f3e8ff !important; }
        .text-purple-800 { color: #6b21a8 !important; }
        
        /* 默认/未知 (浅灰) */
        .bg-gray-50 { background-color: #f9fafb !important; }
        .bg-gray-100 { background-color: #f3f4f6 !important; }
        .text-gray-800 { color: #1f2937 !important; }

        /* =========================================
           2. 之前的 UI 组件样式 (保留不变)
           ========================================= */
        .modal { animation: fadeIn 0.3s ease-in-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

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

        .revenue-trend-up { color: #10B981; }
        .revenue-trend-down { color: #EF4444; }

        canvas { display: block; max-width: 100%; height: auto !important; }

        .sidebar-link.active {
            background-color: rgba(210, 180, 140, 0.3) !important;
            color: #8B5A2B !important;
            font-weight: 500 !important;
        }

        @media print { .no-print { display: none !important; } }
    `;
    document.head.appendChild(style);
}



let paymentMethodPieChart = null;
let revenueByDateChart = null;
let purchaseCostByDateChart = null;

// finance.js 中的 financeSwitchPage 函数应该只包含必要的初始化
window.financeSwitchPage = function(pageId) {
    console.log('financeSwitchPage called:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        
        // 延迟初始化，确保DOM已更新
        setTimeout(() => {
            switch (pageId) {
                case 'income-stats':
                    if (!window.chartsInitialized) {  // 添加标志防止重复初始化
                        initIncomeStatsCharts();
                        window.chartsInitialized = true;
                    }
                    break;
                case 'order':
                    initOrderPage();
                    break;
                case 'invoice':
                    initInvoicePage();
                    break;
            }
        }, 50);
    }
};

function formatCurrency(value) {
    const amount = Number(value || 0);
    return `${CURRENCY_SYMBOL}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function formatDateTime(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

async function initIncomeStatsCharts() {
    try {
        const overview = await fetchFinanceOverview();
        renderTotalRevenueCard(overview);

        const paymentSummary = await fetchPaymentMethodSummary();
        initPaymentMethodPieChart(paymentSummary);

        await renderRevenueByDateChart();
        await renderPurchaseCostByDateChart();
    } catch (error) {
        console.error('Failed to load finance overview:', error);
    }
}

function renderTotalRevenueCard(data) {
    const container = document.getElementById('total-revenue-container');
    if (!container) return;

    const growth = data.growthPercent === null ? 0 : data.growthPercent;
    const growthClass = growth >= 0 ? 'revenue-trend-up' : 'revenue-trend-down';
    const growthIcon = growth >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';

    container.innerHTML = `
        <div class="total-revenue-card">
            <div class="flex flex-col md:flex-row md:items-center md:justify-between">
                <div class="w-full">
                    <p class="text-white/80 text-sm mb-1">Total Revenue (Current Month)</p>
                    <h3 class="text-3xl font-bold mb-2">${formatCurrency(data.currentMonth)}</h3>
                    <div class="flex items-center gap-2">
                        <span class="${growthClass} text-sm font-medium">
                            <i class="fa ${growthIcon} mr-1"></i>${Math.abs(growth).toFixed(2)}%
                        </span>
                        <span class="text-white/70 text-sm">vs last month (${formatCurrency(data.lastMonth)})</span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function initPaymentMethodPieChart(summaryRows) {
    const paymentMethodCtx = document.getElementById('payment-method-pie-chart');
    if (!paymentMethodCtx) return;

    const ctx = paymentMethodCtx.getContext('2d');
    if (!ctx) return;

    const labels = summaryRows.map(row => row.payment_method || 'Unknown');
    const data = summaryRows.map(row => Number(row.amount || 0));
    const colors = ['#774b30', '#a9805b', '#9f5933', '#d2b48c'];

    if (labels.length === 0) {
        labels.push('No Data');
        data.push(0);
    }

    if (paymentMethodPieChart) {
        paymentMethodPieChart.destroy();
    }

    paymentMethodPieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.slice(0, labels.length),
                borderWidth: 2,
                borderColor: '#fff',
                hoverOffset: 20,
                hoverBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { top: 15, bottom: 50, left: 15, right: 15 } },
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 25,
                        usePointStyle: true,
                        pointStyle: 'rect',
                        pointStyleWidth: 22,
                        pointStyleHeight: 22,
                        font: { size: 13, weight: '500' },
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
                        label: function (context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = total === 0 ? 0 : Math.round((value / total) * 100);
                            return `${label}: ${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// scripts/finance.js (修改后的部分)
// 只需要修改 renderRevenueByDateChart 和 renderPurchaseCostByDateChart 这两个函数

async function renderRevenueByDateChart(startDate, endDate) {
    const container = document.getElementById('revenue-by-date-chart-container');
    if (!container) return;

    const now = new Date();
    const defaultEnd = endDate || formatDateInput(now);
    const defaultStart = startDate || formatDateInput(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));

    const rows = await fetchRevenueByDate(defaultStart, defaultEnd);
    const labels = rows.map(row => row.order_day);
    const values = rows.map(row => Number(row.revenue || 0));

    container.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 class="font-semibold text-lg">Revenue by Date</h3>
            <div class="compact-date-selector mt-2 md:mt-0">
                <input type="date" class="compact-date-input" id="revenue-start-date" value="${defaultStart}">
                <span>to</span>
                <input type="date" class="compact-date-input" id="revenue-end-date" value="${defaultEnd}">
                <button class="btn-secondary text-sm px-3 py-1" id="revenue-date-filter">Apply</button>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="revenue-by-date-chart" class="chart-responsive"></canvas>
        </div>
    `;

    const ctx = document.getElementById('revenue-by-date-chart').getContext('2d');
    if (revenueByDateChart) {
        revenueByDateChart.destroy();
    }

    // 改为折线图
    revenueByDateChart = new Chart(ctx, {
        type: 'line', // 从 'bar' 改为 'line'
        data: {
            labels,
            datasets: [{
                label: 'Revenue',
                data: values,
                backgroundColor: 'rgba(139, 90, 43, 0.1)', // 添加背景色用于填充
                borderColor: '#8B5A2B',
                borderWidth: 2,
                tension: 0.3, // 添加曲线张力
                fill: true, // 填充区域
                pointBackgroundColor: '#8B5A2B',
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
                    grid: { drawBorder: false, color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: value => `${CURRENCY_SYMBOL}${value.toLocaleString()}`
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 10 // 限制显示的刻度数量
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#374151',
                    bodyColor: '#374151',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 6,
                    padding: 12,
                    callbacks: {
                        label: context => `Revenue: ${formatCurrency(context.raw)}`
                    }
                }
            }
        }
    });

    document.getElementById('revenue-date-filter').addEventListener('click', async () => {
        const start = document.getElementById('revenue-start-date').value;
        const end = document.getElementById('revenue-end-date').value;
        await renderRevenueByDateChart(start, end);
    });
}

async function renderPurchaseCostByDateChart(startDate, endDate) {
    const container = document.getElementById('purchase-cost-by-date-chart-container');
    if (!container) return;

    const now = new Date();
    const defaultEnd = endDate || formatDateInput(now);
    const defaultStart = startDate || formatDateInput(new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000));

    const rows = await fetchPurchaseCostByDate(defaultStart, defaultEnd);
    const labels = rows.map(row => row.cost_day);
    const values = rows.map(row => Number(row.cost || 0));

    container.innerHTML = `
        <div class="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h3 class="font-semibold text-lg">Purchase Cost by Date</h3>
            <div class="compact-date-selector mt-2 md:mt-0">
                <input type="date" class="compact-date-input" id="cost-start-date" value="${defaultStart}">
                <span>to</span>
                <input type="date" class="compact-date-input" id="cost-end-date" value="${defaultEnd}">
                <button class="btn-secondary text-sm px-3 py-1" id="cost-date-filter">Apply</button>
            </div>
        </div>
        <div class="chart-container">
            <canvas id="purchase-cost-by-date-chart" class="chart-responsive"></canvas>
        </div>
    `;

    const ctx = document.getElementById('purchase-cost-by-date-chart').getContext('2d');
    if (purchaseCostByDateChart) {
        purchaseCostByDateChart.destroy();
    }

    // 改为柱状图
    purchaseCostByDateChart = new Chart(ctx, {
        type: 'bar', // 从 'line' 改为 'bar'
        data: {
            labels,
            datasets: [{
                label: 'Purchase Cost',
                data: values,
                backgroundColor: '#4F7942', // 改为纯色
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
                    grid: { drawBorder: false, color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: value => `${CURRENCY_SYMBOL}${value.toLocaleString()}`
                    }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        maxTicksLimit: 10 // 限制显示的刻度数量
                    }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    titleColor: '#374151',
                    bodyColor: '#374151',
                    borderColor: '#e5e7eb',
                    borderWidth: 1,
                    cornerRadius: 6,
                    padding: 12,
                    callbacks: {
                        label: context => `Cost: ${formatCurrency(context.raw)}`
                    }
                }
            }
        }
    });

    document.getElementById('cost-date-filter').addEventListener('click', async () => {
        const start = document.getElementById('cost-start-date').value;
        const end = document.getElementById('cost-end-date').value;
        await renderPurchaseCostByDateChart(start, end);
    });
}

function initOrderPage() {
    initOrderFilters();
    loadOrderList();
}

function initOrderFilters() {
    document.getElementById('order-search-btn').addEventListener('click', filterOrders);
    document.getElementById('order-reset-btn').addEventListener('click', resetOrderFilters);
    document.getElementById('refresh-orders-btn').addEventListener('click', () => loadOrderList());
    document.getElementById('order-search').addEventListener('keypress', e => {
        if (e.key === 'Enter') filterOrders();
    });
}

async function filterOrders() {
    const filters = {
        search: document.getElementById('order-search').value.trim(),
        status: document.getElementById('order-status-filter').value,
        storeId: document.getElementById('order-store-filter').value,
        startDate: document.getElementById('order-date-from').value,
        endDate: document.getElementById('order-date-to').value
    };

    await loadOrderList(filters);
}

async function resetOrderFilters() {
    document.getElementById('order-search').value = '';
    document.getElementById('order-status-filter').value = '';
    document.getElementById('order-store-filter').value = '';
    document.getElementById('order-date-from').value = '';
    document.getElementById('order-date-to').value = '';

    await loadOrderList();
}

async function loadOrderList(filters = {}) {
    const container = document.getElementById('order-table-body');
    if (!container) return;
    
    try {
        // 显示加载状态
        showLoading('order-table-body', 'Loading orders...');
        
        // 添加性能监控
        const startTime = performance.now();
        
        const orders = await fetchOrderList(filters);
        
        const loadTime = performance.now() - startTime;
        console.log(`Orders loaded in ${loadTime.toFixed(2)}ms, count: ${orders.length}`);
        
        // 如果是首次加载且数据量大，可以考虑分页
        if (!window.orderPageInitialized && orders.length > 50) {
            console.log(`Large dataset detected: ${orders.length} orders. Consider implementing pagination.`);
        }
        
        renderOrderList(orders);
        window.orderPageInitialized = true;
        
    } catch (error) {
        console.error('Failed to load orders:', error);
        container.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center">
                        <div class="text-red-600 mb-2">
                            <i class="fa fa-exclamation-circle text-xl"></i>
                        </div>
                        <span>Failed to load orders. Please try again.</span>
                        <button class="btn-secondary mt-3 px-4 py-2" onclick="loadOrderList()">
                            Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    } finally {
        hideLoading();
    }
}

// 优化渲染函数，使用文档片段批量插入
function renderOrderList(orders) {
    const container = document.getElementById('order-table-body');
    if (!container) return;

    // 清空容器
    container.innerHTML = '';

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    No orders found matching your criteria.
                </td>
            </tr>
        `;
        updateOrderPaginationInfo(0);
        return;
    }

    // 使用文档片段提高性能
    const fragment = document.createDocumentFragment();
    
    orders.forEach(order => {
        let statusClass = 'bg-gray-100 text-gray-800';
        let statusText = order.orderStatus;
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
        }

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.orderId = order.orderId;

        // 使用innerHTML创建行
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
            <td class="px-4 py-4 text-sm">${formatDateTime(order.orderDate)}</td>
            <td class="px-4 py-4 text-sm truncate max-w-xs" title="${order.note || 'No note'}">
                ${order.note ? (order.note.length > 30 ? order.note.substring(0, 30) + '...' : order.note) : 'None'}
            </td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-[#8B5A2B] hover:text-[#8B5A2B]/80 view-order" data-order="${order.orderId}" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                </div>
            </td>
        `;
        
        fragment.appendChild(row);
    });

    // 一次性插入所有行
    container.appendChild(fragment);
    updateOrderPaginationInfo(orders.length);
    
    // 延迟添加事件监听器，避免阻塞渲染
    setTimeout(() => {
        addOrderEventListeners();
    }, 0);
}


/**
 * 渲染发票列表
 * 基于后端 JSON 数据结构 和 前端 10 列表头设计
 */
function renderInvoiceList(invoices) {
    const container = document.getElementById('invoice-table-body');
    if (!container) return;



    // 1. 清空容器
    container.innerHTML = '';

    // 2. 处理无数据情况
    if (!invoices || invoices.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="10" class="px-4 py-8 text-center text-gray-500">
                    No invoices found.
                </td>
            </tr>
        `;
        return;
    }

    const fragment = document.createDocumentFragment();

    // 3. 遍历数据生成表格行
    invoices.forEach(invoice => {
        const tr = document.createElement('tr');
        tr.className = 'hover:bg-gray-50 transition-colors border-b border-gray-100';
        tr.dataset.invoiceId = invoice.invoiceId; // 用于事件代理

        // --- A. 数据格式化处理 ---
        
        // 金额格式化 (保留2位小数，处理 undefined)
        const formatMoney = (amount) => {
            const num = parseFloat(amount || 0);
            return '$' + num.toFixed(2);
        };

        // 日期格式化 (截取 YYYY-MM-DD)
        const formatDate = (dateString) => {
            if (!dateString) return '-';
            return dateString.substring(0, 10); 
        };

        // 状态颜色逻辑 (根据 JSON 中的 status 字段)
        let badgeClass = '';
        const status = (invoice.status || '').toUpperCase();

        const displayStatus = status.replace(/_/g, ' ');
        
        switch (status) {
            case 'PAID':
                badgeClass = 'bg-green-100 text-green-800';
                break;
            case 'PARTIAL':
            case 'PARTIALLY_PAID':
            case 'PARTLY_PAID':    
                badgeClass = 'bg-yellow-100 text-yellow-800';
                break;
            case 'VOIDED':
                badgeClass = 'bg-gray-200 text-gray-600';
                break;
            case 'ISSUED':
            case 'DRAFT':
                badgeClass = 'bg-blue-100 text-blue-800';
                break;
            case 'CREDITED':
                badgeClass ='bg-purple-100 text-purple-800';
                break;
            default: 
                badgeClass = 'bg-gray-50 text-gray-600';
        }

        // --- B. 构建 HTML (严格对应 8 列) ---
        tr.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium text-gray-900">
                #${invoice.invoiceNumber}
            </td>

            <td class="px-4 py-4 text-sm text-gray-500">
                #${invoice.orderId}
            </td>

            <td class="px-4 py-4 text-sm text-gray-900">
                <span class="font-medium">${invoice.memberName || 'Guest'}</span>
            </td>

            <td class="px-4 py-4 text-sm">
                <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${badgeClass}">
                    ${status}
                </span>
            </td>

            <td class="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                ${formatDate(invoice.issueDate)}
            </td>

            <td class="px-4 py-4 text-sm text-gray-500 whitespace-nowrap">
                ${formatDate(invoice.dueDate)}
            </td>

            <td class="px-4 py-4 text-sm font-medium text-gray-900">
                ${formatMoney(invoice.invoiceAmount)}
            </td>


            <td class="px-4 py-4 text-sm">
                <div class="flex items-center gap-3">
                    <button class="text-blue-600 hover:text-blue-800 transition-colors view-invoice" 
                            title="View Details"
                            onclick="window.viewInvoiceDetail(${invoice.invoiceId})">
                        <i class="fa fa-eye"></i>
                    </button>
                    
                    <button class="text-red-600 hover:text-red-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Void Invoice"
                            onclick="voidInvoice(${invoice.invoiceId})"
                            ${(status === 'VOID' || status === 'PAID'||status === 'VOIDED'||status ==='PARTLY_PAID') ? 'disabled' : ''}>
                        <i class="fa fa-ban"></i>
                    </button>
                    
                    <button class="text-gray-500 hover:text-gray-700 transition-colors print-invoice"
                            title="Print">
                        <i class="fa fa-print"></i>
                    </button>
                </div>
            </td>
        `;

        fragment.appendChild(tr);
    });

    // 4. 一次性插入 DOM
    container.appendChild(fragment);
    //激活按钮事件
    setTimeout(() => {
        addInvoiceEventListeners();
    }, 0);
}

function updateOrderPaginationInfo(totalOrders) {
    const paginationInfo = document.getElementById('order-pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `Showing ${totalOrders} orders`;
    }
}

function addOrderEventListeners() {
    document.querySelectorAll('.view-order').forEach(btn => {
        btn.addEventListener('click', async () => {
            const orderId = btn.getAttribute('data-order');
            await viewOrderDetails(orderId);
        });
    });
}

async function viewOrderDetails(orderId) {
    try {
        const data = await fetchOrderDetail(orderId);
        if (data) {
            showOrderDetailModal(data);
        } else {
            alert(`Order ${orderId} not found.`);
        }
    } catch (error) {
        console.error('Failed to load order detail:', error);
        alert('Failed to load order detail.');
    }
}

function showOrderDetailModal(order) {
    // 如果已经存在弹窗，先移除
    const existingModal = document.getElementById('order-detail-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 确保数据存在，使用安全访问
    const orderId = order.orderId || 'N/A';
    const memberName = order.memberName || 'N/A';
    const memberId = order.memberId || 'N/A';
    const storeName = order.storeName || 'N/A';
    const orderDate = order.orderDate ? formatDateTime(order.orderDate) : 'N/A';
    const paymentMethod = order.paymentMethod || 'Not specified';
    const note = order.note || 'No note';
    const shippingAddress = order.shippingAddress || 'Not specified';

    // 计算各项数据，确保有默认值
    const grossAmount = Number(order.grossAmount) || 0;
    const discountRate = Number(order.discountRate) || 0;
    const discountedAmount = Number(order.discountedAmount) || 0;
    const redeemedPoints = Number(order.redeemedPoints) || 0;
    const pointsDiscountAmount = Number(order.pointsDiscountAmount) || 0;
    const payableAmount = Number(order.payableAmount) || 0;
    const paidAmount = Number(order.paidAmount) || 0;
    const itemCount = Number(order.itemCount) || 0;
    const totalQuantity = Number(order.totalQuantity) || 0;

    // 创建弹窗HTML - 修复标题中的undefined
    const modalHTML = `
        <div id="order-detail-modal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <div class="flex justify-between items-center mb-6">
                                    <h3 class="text-xl font-serif font-bold text-[#8B5A2B]" id="modal-title">
                                        Order Details
                                    </h3>
                                    <button type="button" class="order-modal-close text-gray-400 hover:text-gray-500">
                                        <i class="fa fa-times text-xl"></i>
                                    </button>
                                </div>
                                
                                <!-- 基本信息卡片 -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Customer</p>
                                        <p class="font-medium">${memberName} (${memberId})</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Store</p>
                                        <p class="font-medium">${storeName}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Order Date</p>
                                        <p class="font-medium">${orderDate}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Payment Method</p>
                                        <p class="font-medium">${paymentMethod}</p>
                                    </div>
                                </div>
                                
                                <!-- 订单金额详情卡片 -->
                                <div class="bg-[#F5E6D3] p-6 rounded-lg mb-6">
                                    <h4 class="font-semibold text-lg mb-4 text-[#8B5A2B]">Order Amount Details</h4>
                                    <div class="space-y-3">
                                        <div class="flex justify-between items-center border-b pb-2">
                                            <span class="text-gray-700">Gross Amount</span>
                                            <span class="font-medium">${formatCurrency(grossAmount)}</span>
                                        </div>
                                        <div class="flex justify-between items-center border-b pb-2">
                                            <span class="text-gray-700">Discount Rate</span>
                                            <span class="font-medium">${(discountRate * 100).toFixed(1)}%</span>
                                        </div>
                                        <div class="flex justify-between items-center border-b pb-2">
                                            <span class="text-gray-700">Discounted Amount</span>
                                            <span class="font-medium">${formatCurrency(discountedAmount)}</span>
                                        </div>
                                        <div class="flex justify-between items-center border-b pb-2">
                                            <span class="text-gray-700">Redeemed Points</span>
                                            <span class="font-medium">${redeemedPoints.toLocaleString()} pts</span>
                                        </div>
                                        <div class="flex justify-between items-center border-b pb-2">
                                            <span class="text-gray-700">Points Discount</span>
                                            <span class="font-medium">${formatCurrency(pointsDiscountAmount)}</span>
                                        </div>
                                        <div class="flex justify-between items-center border-b pb-2 text-lg font-semibold">
                                            <span class="text-[#8B5A2B]">Payable Amount</span>
                                            <span class="text-[#8B5A2B]">${formatCurrency(payableAmount)}</span>
                                        </div>
                                        <div class="flex justify-between items-center">
                                            <span class="text-gray-700">Paid Amount</span>
                                            <span class="font-medium ${paidAmount >= payableAmount ? 'text-green-600' : 'text-orange-600'}">
                                                ${formatCurrency(paidAmount)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 商品数量信息 -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Item Count (SKUs)</p>
                                        <p class="font-medium text-lg">${itemCount} items</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Total Quantity</p>
                                        <p class="font-medium text-lg">${totalQuantity} units</p>
                                    </div>
                                </div>
                                
                                <!-- 订单商品列表 -->
                                ${order.items && order.items.length > 0 ? `
                                <div class="mb-6">
                                    <h4 class="font-semibold text-lg mb-3 text-[#8B5A2B]">Order Items</h4>
                                    <div class="border rounded-lg overflow-hidden">
                                        <table class="min-w-full divide-y divide-gray-200">
                                            <thead class="bg-gray-100">
                                                <tr>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody class="bg-white divide-y divide-gray-200">
                                                ${order.items.map(item => {
        const sku = item.sku || 'N/A';
        const name = item.name || 'N/A';
        const quantity = item.quantity || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const subtotal = Number(item.subtotal) || 0;
        return `
                                                        <tr>
                                                            <td class="px-4 py-3 text-sm">${sku}</td>
                                                            <td class="px-4 py-3 text-sm">${name}</td>
                                                            <td class="px-4 py-3 text-sm">${quantity}</td>
                                                            <td class="px-4 py-3 text-sm">${formatCurrency(unitPrice)}</td>
                                                            <td class="px-4 py-3 text-sm font-medium">${formatCurrency(subtotal)}</td>
                                                        </tr>
                                                    `;
    }).join('')}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                ` : '<p class="text-gray-500 mb-6">No items found for this order.</p>'}
                                
                                <!-- 备注 -->
                                ${note !== 'No note' ? `
                                <div class="mb-6">
                                    <h4 class="font-semibold text-lg mb-2 text-[#8B5A2B]">Notes</h4>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-gray-700">${note}</p>
                                    </div>
                                </div>
                                ` : ''}
                                
                                <!-- 配送地址 -->
                                ${shippingAddress !== 'Not specified' ? `
                                <div class="mb-6">
                                    <h4 class="font-semibold text-lg mb-2 text-[#8B5A2B]">Shipping Address</h4>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-gray-700">${shippingAddress}</p>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="button" class="order-modal-close btn-primary w-full sm:w-auto sm:ml-3">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 将弹窗添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 添加关闭事件
    document.querySelectorAll('.order-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById('order-detail-modal');
            if (modal) {
                modal.remove();
            }
        });
    });

    // 点击背景关闭
    const modal = document.getElementById('order-detail-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // 添加ESC键关闭功能
    const handleEscKey = (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('order-detail-modal');
            if (modal) {
                modal.remove();
                document.removeEventListener('keydown', handleEscKey);
            }
        }
    };
    document.addEventListener('keydown', handleEscKey);
}

function initInvoicePage() {
    initInvoiceFilters();
    loadInvoiceList();
}


// --- 1. 初始化筛选器监听 ---
function initInvoiceFilters() {
    // 绑定搜索按钮
    const searchBtn = document.getElementById('invoice-search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', filterInvoices);
    }

    // 绑定重置按钮
    const resetBtn = document.getElementById('invoice-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetInvoiceFilters);
    }

    // 绑定顶部搜索框的回车事件 (如果有的话)
    const keywordInput = document.getElementById('invoice-search');
    if (keywordInput) {
        keywordInput.addEventListener('keypress', e => {
            if (e.key === 'Enter') filterInvoices();
        });
    }

    // 处理创建按钮
    const createBtn = document.getElementById('create-invoice-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => alert('Create Invoice is handled from Order list.'));
    }
}

// --- 2. 执行筛选 ---
async function filterInvoices() {
    // 收集所有筛选条件
    const filters = {
        // 顶部的关键字搜索
        search: document.getElementById('invoice-search') ? document.getElementById('invoice-search').value.trim() : '',
        
        // 状态筛选
        status: document.getElementById('invoice-status-filter').value,
        
        // 订单 ID
        orderId: document.getElementById('invoice-order-filter').value.trim(),
        
        // 日期范围
        startDate: document.getElementById('invoice-start-date').value,
        endDate: document.getElementById('invoice-end-date').value,
        
        // 🟢 新增：金额范围 (核心修改点)
        minAmount: document.getElementById('filter-min-amount') ? document.getElementById('filter-min-amount').value : '',
        maxAmount: document.getElementById('filter-max-amount') ? document.getElementById('filter-max-amount').value : ''
    };

    console.log("正在筛选发票，条件:", filters); // 方便你在 F12 控制台调试
    await loadInvoiceList(filters);
}

// --- 3. 重置筛选 ---
async function resetInvoiceFilters() {
    // 定义所有需要清空的输入框 ID
    const inputIds = [
        'invoice-search',        // 顶部搜索
        'invoice-status-filter', // 状态
        'invoice-order-filter',  // 订单ID
        'invoice-start-date',    // 开始日期
        'invoice-end-date',      // 结束日期
        'filter-min-amount',     // 🟢 新增：最小金额
        'filter-max-amount'      // 🟢 新增：最大金额
    ];

    // 循环清空，并在清空前检查元素是否存在(防止报错)
    inputIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });

    // 重新加载所有数据
    await loadInvoiceList();
}

async function loadInvoiceList(filters = {}) {
    const container = document.getElementById('invoice-table-body');
    if (!container) return;
    
    try {
        // 显示加载状态
        showLoading('invoice-table-body', 'Loading invoices...');
        
        // 添加性能监控
        const startTime = performance.now();
        
        const invoices = await fetchInvoiceList(filters);
        
        const loadTime = performance.now() - startTime;
        console.log(`Invoices loaded in ${loadTime.toFixed(2)}ms, count: ${invoices.length}`);
        
        renderInvoiceList(invoices);
        
    } catch (error) {
        console.error('Failed to load invoices:', error);
        container.innerHTML = `
            <tr>
                <td colspan="11" class="px-4 py-8 text-center text-gray-500">
                    <div class="flex flex-col items-center justify-center">
                        <div class="text-red-600 mb-2">
                            <i class="fa fa-exclamation-circle text-xl"></i>
                        </div>
                        <span>Failed to load invoices. Please try again.</span>
                        <button class="btn-secondary mt-3 px-4 py-2" onclick="loadInvoiceList()">
                            Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
    } finally {
        hideLoading();
    }
}


function updateInvoicePaginationInfo(totalInvoices) {
    const paginationInfo = document.getElementById('invoice-pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `Showing ${totalInvoices} invoices`;
    }
}

function addInvoiceEventListeners() {
    document.querySelectorAll('.view-invoice').forEach(btn => {
        btn.addEventListener('click', async () => {
            const invoiceId = btn.getAttribute('data-invoice');
            await viewInvoiceDetails(invoiceId);
        });
    });



    document.querySelectorAll('.print-invoice').forEach(btn => {
        btn.addEventListener('click', async () => {
            const invoiceId = btn.getAttribute('data-invoice');
            await printInvoice(invoiceId);
        });
    });
}

/*async function viewInvoiceDetails(invoiceId) {
    try {
        const data = await fetchInvoiceDetail(invoiceId);
        if (data) {
            showInvoiceDetailModal(data);
        } else {
            alert(`Invoice ${invoiceId} not found.`);
        }
    } catch (error) {
        console.error('Failed to load invoice detail:', error);
        alert('Failed to load invoice detail.');
    }
}*/


window.viewInvoiceDetail = async function(invoiceId) {
    try {
        // 1. 调用 API 获取数据
        // 返回的数据结构是: { invoice: {...}, payments: [...] }
        const data = await fetchInvoiceDetail(invoiceId);
        
        if (data && data.invoice) {
            
            // 如果后端返回了支付记录，也可以把 data.payments 传进去，
            // 但目前 showInvoiceDetailModal 似乎只接收一个参数，我们先传主数据
            showInvoiceDetailModal(data.invoice); 
        } else {
            alert(`Invoice ${invoiceId} not found.`);
        }
    } catch (error) {
        console.error('Failed to load invoice detail:', error);
        alert('Failed to load invoice detail.');
    }
};

// 创建发票详情弹窗
function showInvoiceDetailModal(invoice) {
    // 如果已经存在弹窗，先移除
    const existingModal = document.getElementById('invoice-detail-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // 确保数据存在，使用安全访问
    const invoiceId = invoice.invoiceId || 'N/A';
    const invoiceNumber = invoice.invoiceNumber || invoiceId;
    const orderId = invoice.orderId || 'N/A';
    const memberName = invoice.memberName || 'N/A';
    const memberId = invoice.memberId || 'N/A';
    const storeName = invoice.storeName || 'N/A';

    // 获取员工信息
    const createdByEmployee = employeeData[invoice.createdBy] || { name: invoice.createdBy || 'Unknown', role: 'Unknown' };

    // 计算余额
    const invoiceAmount = Number(invoice.invoiceAmount) || 0;
    const paidAmount = Number(invoice.paidAmount) || 0;
    const balanceAmount = Number(invoice.balanceAmount) || (invoiceAmount - paidAmount);

    // 确保日期数据存在
    const issuedAt = invoice.issuedAt ? formatDateTime(invoice.issuedAt) : 'N/A';
    const dueDate = invoice.dueDate ? formatDateTime(invoice.dueDate) : 'N/A';
    const lastPaidAt = invoice.lastPaidAt ? formatDateTime(invoice.lastPaidAt) : 'Not paid yet';
    const createdAt = invoice.createdAt ? formatDateTime(invoice.createdAt) : 'N/A';
    const updatedAt = invoice.updatedAt ? formatDateTime(invoice.updatedAt) : 'N/A';
    const notes = invoice.notes || '';

    // 创建弹窗HTML - 修复标题中的undefined
    const modalHTML = `
        <div id="invoice-detail-modal" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>
                <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div class="sm:flex sm:items-start">
                            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <div class="flex justify-between items-center mb-6">
                                    <h3 class="text-xl font-serif font-bold text-[#8B5A2B]" id="modal-title">
                                        Invoice Details
                                    </h3>
                                    <button type="button" class="invoice-modal-close text-gray-400 hover:text-gray-500">
                                        <i class="fa fa-times text-xl"></i>
                                    </button>
                                </div>
                                
                                <!-- 基本信息 -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Invoice Number</p>
                                        <p class="font-medium">${invoiceNumber}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Order ID</p>
                                        <p class="font-medium">${orderId}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Customer</p>
                                        <p class="font-medium">${memberName} (${memberId})</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Store</p>
                                        <p class="font-medium">${storeName}</p>
                                    </div>
                                </div>
                                
                                <!-- 金额信息卡片 -->
                                <div class="bg-[#F5E6D3] p-6 rounded-lg mb-6">
                                    <h4 class="font-semibold text-lg mb-4 text-[#8B5A2B]">Invoice Amount Details</h4>
                                    <div class="space-y-3">
                                        <div class="flex justify-between items-center border-b pb-2">
                                            <span class="text-gray-700">Invoice Amount</span>
                                            <span class="font-medium">${formatCurrency(invoiceAmount)}</span>
                                        </div>
                                        <div class="flex justify-between items-center border-b pb-2">
                                            <span class="text-gray-700">Paid Amount</span>
                                            <span class="font-medium ${paidAmount >= invoiceAmount ? 'text-green-600' : 'text-orange-600'}">
                                                ${formatCurrency(paidAmount)}
                                            </span>
                                        </div>
                                        <div class="flex justify-between items-center border-b pb-2 text-lg font-semibold">
                                            <span class="text-[#8B5A2B]">Balance Amount</span>
                                            <span class="text-[#8B5A2B]">${formatCurrency(balanceAmount)}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 日期和时间信息 -->
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Issue Date</p>
                                        <p class="font-medium">${issuedAt}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Due Date</p>
                                        <p class="font-medium">${dueDate}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Last Paid At</p>
                                        <p class="font-medium">${lastPaidAt}</p>
                                    </div>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-sm text-gray-500">Status</p>
                                        <p class="font-medium">
                                            <span class="px-2 py-1 text-xs ${invoice.status === 'UNPAID' ? 'invoice-unpaid' : invoice.status === 'PARTIAL' ? 'invoice-partial' : invoice.status === 'PAID' ? 'invoice-paid' : invoice.status === 'OVERDUE' ? 'invoice-overdue' : 'invoice-void'} rounded-full">
                                                ${invoice.status || 'UNKNOWN'}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                                
                                <!-- 审计信息 -->
                                <div class="mb-6">
                                    <h4 class="font-semibold text-lg mb-3 text-[#8B5A2B]">Audit Information</h4>
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="bg-gray-50 p-4 rounded-lg">
                                            <p class="text-sm text-gray-500">Created By</p>
                                            <p class="font-medium">${createdByEmployee.name} (${createdByEmployee.role})</p>
                                            <p class="text-xs text-gray-500">${invoice.createdBy || 'N/A'}</p>
                                        </div>
                                        <div class="bg-gray-50 p-4 rounded-lg">
                                            <p class="text-sm text-gray-500">Created At</p>
                                            <p class="font-medium">${createdAt}</p>
                                        </div>
                                        <div class="bg-gray-50 p-4 rounded-lg">
                                            <p class="text-sm text-gray-500">Updated At</p>
                                            <p class="font-medium">${updatedAt}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <!-- 发票项目 -->
                                ${invoice.items && invoice.items.length > 0 ? `
                                <div class="mb-6">
                                    <h4 class="font-semibold text-lg mb-3 text-[#8B5A2B]">Invoice Items</h4>
                                    <div class="border rounded-lg overflow-hidden">
                                        <table class="min-w-full divide-y divide-gray-200">
                                            <thead class="bg-gray-100">
                                                <tr>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody class="bg-white divide-y divide-gray-200">
                                                ${invoice.items.map(item => {
        const description = item.description || 'N/A';
        const quantity = item.quantity || 0;
        const unitPrice = Number(item.unitPrice) || 0;
        const subtotal = Number(item.subtotal) || 0;
        return `
                                                        <tr>
                                                            <td class="px-4 py-3 text-sm">${description}</td>
                                                            <td class="px-4 py-3 text-sm">${quantity}</td>
                                                            <td class="px-4 py-3 text-sm">${formatCurrency(unitPrice)}</td>
                                                            <td class="px-4 py-3 text-sm font-medium">${formatCurrency(subtotal)}</td>
                                                        </tr>
                                                    `;
    }).join('')}
                                                <tr class="bg-gray-50">
                                                    <td colspan="3" class="px-4 py-3 text-right font-medium">Subtotal</td>
                                                    <td class="px-4 py-3 font-medium">${formatCurrency(Number(invoice.subtotal) || 0)}</td>
                                                </tr>
                                                <tr class="bg-gray-50">
                                                    <td colspan="3" class="px-4 py-3 text-right font-medium">Tax (${Number(invoice.taxRate) || 0}%)</td>
                                                    <td class="px-4 py-3 font-medium">${formatCurrency(Number(invoice.taxAmount) || 0)}</td>
                                                </tr>
                                                <tr class="bg-gray-100">
                                                    <td colspan="3" class="px-4 py-3 text-right font-bold text-lg">Total</td>
                                                    <td class="px-4 py-3 font-bold text-lg text-[#8B5A2B]">${formatCurrency(invoiceAmount)}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                ` : '<p class="text-gray-500 mb-6">No items found for this invoice.</p>'}
                                
                                <!-- 备注 -->
                                ${notes ? `
                                <div class="mb-6">
                                    <h4 class="font-semibold text-lg mb-2 text-[#8B5A2B]">Notes</h4>
                                    <div class="bg-gray-50 p-4 rounded-lg">
                                        <p class="text-gray-700">${notes}</p>
                                    </div>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button type="button" class="invoice-modal-close btn-primary w-full sm:w-auto sm:ml-3">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // 将弹窗添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // 添加关闭事件
    document.querySelectorAll('.invoice-modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            const modal = document.getElementById('invoice-detail-modal');
            if (modal) {
                modal.remove();
            }
        });
    });

    // 点击背景关闭
    const modal = document.getElementById('invoice-detail-modal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // 添加ESC键关闭功能
    const handleEscKey = (e) => {
        if (e.key === 'Escape') {
            const modal = document.getElementById('invoice-detail-modal');
            if (modal) {
                modal.remove();
                document.removeEventListener('keydown', handleEscKey);
            }
        }
    };
    document.addEventListener('keydown', handleEscKey);
}

// ==========================================
// 作废发票核心函数 (挂载到 window 全局)
// ==========================================
window.voidInvoice = async function(invoiceId) {
    // 1. 安全检查：ID 是否存在
    if (!invoiceId) {
        alert('Error: Missing Invoice ID');
        return;
    }

    // 2. 状态检查：二次确认
    // (注意：HTML 里的 disabled 属性防君子不防小人，这里确认框是最后一道防线)
    if (!confirm('Are you sure you want to void this invoice? This action cannot be undone.')) {
        return;
    }

    try {
        // 3. 调用 API (注意：这里用了 voidInvoiceRequest)
        // 确保你的 finance-api.js 里已经改成了 endpoints.invoices.voidInvoice
        const response = await voidInvoiceRequest(invoiceId);
        
        if (response.success) {
            alert('Invoice has been voided successfully.');
            
            // 4. 刷新列表 (保留当前筛选条件的最佳做法是重新调用 loadInvoiceList)
            // 如果你想做得更完美，可以检查当前是否有筛选条件
            await loadInvoiceList(); 
        } else {
            alert('Failed to void invoice: ' + response.message);
        }
    } catch (error) {
        console.error('Failed to void invoice:', error);
        alert('Error: ' + (error.message || 'Failed to connect to server'));
    }
};


// 打印/导出PDF函数
async function printInvoice(invoiceId) {
    try {
        const invoice = await fetchInvoiceDetail(invoiceId);
        if (!invoice) {
            alert('Invoice not found.');
            return;
        }

        // 创建一个打印友好的窗口
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Invoice ${invoice.invoiceNumber || invoice.invoiceId}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 40px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .invoice-title { font-size: 24px; font-weight: bold; color: #8B5A2B; }
                    .company-name { font-size: 18px; margin-bottom: 10px; }
                    .details { margin-bottom: 20px; }
                    .detail-row { display: flex; margin-bottom: 5px; }
                    .detail-label { width: 150px; font-weight: bold; }
                    .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    .table th, .table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    .table th { background-color: #f5e6d3; }
                    .total-row { font-weight: bold; }
                    .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                    @media print {
                        body { margin: 0; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="company-name">Diamond Page Store</div>
                    <div class="invoice-title">INVOICE: ${invoice.invoiceNumber || invoice.invoiceId}</div>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">Customer:</span>
                        <span>${invoice.memberName} (${invoice.memberId})</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Order ID:</span>
                        <span>${invoice.orderId}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Store:</span>
                        <span>${invoice.storeName}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Issue Date:</span>
                        <span>${formatDateTime(invoice.issuedAt)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Due Date:</span>
                        <span>${formatDateTime(invoice.dueDate)}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Status:</span>
                        <span>${invoice.status}</span>
                    </div>
                </div>
                
                <table class="table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Quantity</th>
                            <th>Unit Price</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(invoice.items || []).map(item => `
                            <tr>
                                <td>${item.description || 'N/A'}</td>
                                <td>${item.quantity || 0}</td>
                                <td>${formatCurrency(item.unitPrice || 0)}</td>
                                <td>${formatCurrency(item.subtotal || 0)}</td>
                            </tr>
                        `).join('')}
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">Subtotal:</td>
                            <td>${formatCurrency(invoice.subtotal || 0)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">Tax (${invoice.taxRate || 0}%):</td>
                            <td>${formatCurrency(invoice.taxAmount || 0)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">Total Amount:</td>
                            <td>${formatCurrency(invoice.invoiceAmount || 0)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">Paid Amount:</td>
                            <td>${formatCurrency(invoice.paidAmount || 0)}</td>
                        </tr>
                        <tr class="total-row">
                            <td colspan="3" style="text-align: right;">Balance Due:</td>
                            <td>${formatCurrency(invoice.balanceAmount || (invoice.invoiceAmount - invoice.paidAmount))}</td>
                        </tr>
                    </tbody>
                </table>
                
                <div class="footer">
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                    <p>Diamond Page Store Finance System</p>
                </div>
                
                <div class="no-print" style="margin-top: 20px; text-align: center;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #8B5A2B; color: white; border: none; border-radius: 4px; cursor: pointer;">
                        Print / Save as PDF
                    </button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 10px;">
                        Close
                    </button>
                </div>
                
                <script>
                    // 自动触发打印对话框
                    setTimeout(() => {
                        window.print();
                    }, 500);
                </script>
            </body>
            </html>
        `);
        printWindow.document.close();
    } catch (error) {
        console.error('Failed to print invoice:', error);
        alert('Failed to generate print preview.');
    }
}

async function receivePayment(invoiceId, balance) {
    if (!balance || balance <= 0) {
        alert('No outstanding balance.');
        return;
    }

    try {
        await recordInvoicePayment(Number(invoiceId), balance, 'Cash');
        alert('Payment recorded.');
        await loadInvoiceList();
        await initIncomeStatsCharts();
    } catch (error) {
        console.error('Failed to record payment:', error);
        alert('Failed to record payment.');
    }
}

function initFinancePage() {
    addStatusStyles();

    document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            financeSwitchPage(link.getAttribute('data-page'));
        });
    });

    document.body.addEventListener('click', function(e) {
        // 查找是否点击了 ID 为 logout-btn 的元素（或其子元素）
        const logoutBtn = e.target.closest('#logout-btn');
        
        if (logoutBtn) {
            e.preventDefault(); // 阻止 <a href="#"> 的默认跳转
            console.log("[Finance] Force Logout triggered");
            
            // 调用 common.js 中的 logout 函数 (它负责清除 localStorage/sessionStorage)
            if (typeof logout === 'function') {
                logout(); 
            } else {
                // 兜底逻辑：如果 common.js 没加载到，手动清除并跳转
                console.warn("logout() function not found, executing manual cleanup.");
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user_role');
                localStorage.removeItem('current_user');
                sessionStorage.clear();
                window.location.href = 'login.html';
            }
        }
    });

    // 恢复之前的页面状态
    const lastPage = sessionStorage.getItem('currentPage') || 'income-stats';
    financeSwitchPage(lastPage);
}

document.addEventListener('DOMContentLoaded', () => {
    initFinancePage();
});
