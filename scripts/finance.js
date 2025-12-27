// scripts/finance.js
const CURRENCY_SYMBOL = '\uFFE5';

function addStatusStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .invoice-unpaid { background-color: #fee2e2; color: #dc2626; }
        .invoice-partial { background-color: #fef3c7; color: #d97706; }
        .invoice-paid { background-color: #d1fae5; color: #059669; }
        .invoice-overdue { background-color: #ffedd5; color: #ea580c; }
        .invoice-void { background-color: #f3f4f6; color: #6b7280; }

        .order-created { background-color: #dbeafe; color: #1e40af; }
        .order-processing { background-color: #fef3c7; color: #d97706; }
        .order-paid { background-color: #d1fae5; color: #059669; }
        .order-completed { background-color: #f3e8ff; color: #7c3aed; }

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

window.financeSwitchPage = function(pageId) {
    document.querySelectorAll('.page-content').forEach(page => page.classList.add('hidden'));

    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        sessionStorage.setItem('currentPage', pageId);

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
                        label: function(context) {
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

    revenueByDateChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Revenue',
                data: values,
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
                    grid: { drawBorder: false, color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: value => `${CURRENCY_SYMBOL}${value.toLocaleString()}`
                    }
                },
                x: { grid: { display: false } }
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

    purchaseCostByDateChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Purchase Cost',
                data: values,
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
                    grid: { drawBorder: false, color: 'rgba(0, 0, 0, 0.05)' },
                    ticks: {
                        callback: value => `${CURRENCY_SYMBOL}${value.toLocaleString()}`
                    }
                },
                x: { grid: { display: false } }
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
    try {
        const orders = await fetchOrderList(filters);
        renderOrderList(orders);
    } catch (error) {
        console.error('Failed to load orders:', error);
    }
}

function renderOrderList(orders) {
    const container = document.getElementById('order-table-body');
    if (!container) return;

    container.innerHTML = '';

    if (!orders || orders.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="9" class="px-4 py-8 text-center text-gray-500">
                    No orders found matching your criteria.
                </td>
            </tr>
        `;
        updateOrderPaginationInfo(0);
        return;
    }

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
            <td class="px-4 py-4 text-sm">${formatCurrency(order.payableAmount)}</td>
            <td class="px-4 py-4 text-sm">${order.itemCount} items</td>
            <td class="px-4 py-4 text-sm truncate max-w-xs" title="${order.note || 'No note'}">
                ${order.note ? (order.note.length > 30 ? order.note.substring(0, 30) + '...' : order.note) : 'None'}
            </td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-[#8B5A2B] hover:text-[#8B5A2B]/80 view-order" data-order="${order.orderId}" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-800 create-invoice" data-order="${order.orderId}" title="Create Invoice">
                        <i class="fa fa-file-text"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });

    updateOrderPaginationInfo(orders.length);
    addOrderEventListeners();
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

    document.querySelectorAll('.create-invoice').forEach(btn => {
        btn.addEventListener('click', async () => {
            const orderId = btn.getAttribute('data-order');
            await createInvoice(orderId);
        });
    });
}

async function viewOrderDetails(orderId) {
    try {
        const data = await fetchOrderDetail(orderId);
        console.log('Order detail:', data);
        alert(`Order ${orderId} detail loaded. Check console for full data.`);
    } catch (error) {
        console.error('Failed to load order detail:', error);
        alert('Failed to load order detail.');
    }
}

async function createInvoice(orderId) {
    try {
        const res = await createInvoiceForOrder(Number(orderId));
        alert(res.message || 'Invoice created');
        await loadInvoiceList();
    } catch (error) {
        console.error('Failed to create invoice:', error);
        alert('Failed to create invoice.');
    }
}

function initInvoicePage() {
    initInvoiceFilters();
    loadInvoiceList();
}

function initInvoiceFilters() {
    document.getElementById('invoice-search-btn').addEventListener('click', filterInvoices);
    document.getElementById('invoice-reset-btn').addEventListener('click', resetInvoiceFilters);
    document.getElementById('invoice-search').addEventListener('keypress', e => {
        if (e.key === 'Enter') filterInvoices();
    });
    const createBtn = document.getElementById('create-invoice-btn');
    if (createBtn) {
        createBtn.addEventListener('click', () => alert('Create Invoice is handled from Order list.'));
    }
}

async function filterInvoices() {
    const filters = {
        search: document.getElementById('invoice-search').value.trim(),
        status: document.getElementById('invoice-status-filter').value,
        orderId: document.getElementById('invoice-order-filter').value.trim(),
        startDate: document.getElementById('invoice-start-date').value,
        endDate: document.getElementById('invoice-end-date').value
    };

    await loadInvoiceList(filters);
}

async function resetInvoiceFilters() {
    document.getElementById('invoice-search').value = '';
    document.getElementById('invoice-status-filter').value = '';
    document.getElementById('invoice-order-filter').value = '';
    document.getElementById('invoice-start-date').value = '';
    document.getElementById('invoice-end-date').value = '';

    await loadInvoiceList();
}

async function loadInvoiceList(filters = {}) {
    try {
        const invoices = await fetchInvoiceList(filters);
        renderInvoiceList(invoices);
    } catch (error) {
        console.error('Failed to load invoices:', error);
    }
}

function renderInvoiceList(invoices) {
    const container = document.getElementById('invoice-table-body');
    if (!container) return;

    container.innerHTML = '';

    if (!invoices || invoices.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="11" class="px-4 py-8 text-center text-gray-500">
                    No invoices found matching your criteria.
                </td>
            </tr>
        `;
        updateInvoicePaginationInfo(0);
        return;
    }

    invoices.forEach(invoice => {
        let statusClass = 'invoice-unpaid';
        let statusText = invoice.status;
        switch (invoice.status) {
            case 'PAID':
                statusClass = 'invoice-paid';
                break;
            case 'PARTIAL':
                statusClass = 'invoice-partial';
                break;
            case 'OVERDUE':
                statusClass = 'invoice-overdue';
                break;
            case 'VOID':
                statusClass = 'invoice-void';
                break;
        }

        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.invoiceId = invoice.invoiceId;

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${invoice.invoiceNumber || invoice.invoiceId}</td>
            <td class="px-4 py-4 text-sm">${invoice.orderId}</td>
            <td class="px-4 py-4 text-sm">${invoice.storeName}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex flex-col">
                    <span class="font-medium">${invoice.memberId}</span>
                    <span class="text-xs text-gray-500">${invoice.memberName}</span>
                </div>
            </td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${statusText}</span>
            </td>
            <td class="px-4 py-4 text-sm">${formatDateTime(invoice.issueDate)}</td>
            <td class="px-4 py-4 text-sm">${formatDateTime(invoice.dueDate)}</td>
            <td class="px-4 py-4 text-sm">${formatCurrency(invoice.invoiceAmount)}</td>
            <td class="px-4 py-4 text-sm">${formatCurrency(invoice.paidAmount)}</td>
            <td class="px-4 py-4 text-sm">${formatCurrency(invoice.balanceAmount)}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-[#8B5A2B] hover:text-[#8B5A2B]/80 view-invoice" data-invoice="${invoice.invoiceId}" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-green-600 hover:text-green-800 receive-payment" data-invoice="${invoice.invoiceId}" data-balance="${invoice.balanceAmount}" title="Receive Payment">
                        <i class="fa fa-credit-card"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });

    updateInvoicePaginationInfo(invoices.length);
    addInvoiceEventListeners();
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

    document.querySelectorAll('.receive-payment').forEach(btn => {
        btn.addEventListener('click', async () => {
            const invoiceId = btn.getAttribute('data-invoice');
            const balance = Number(btn.getAttribute('data-balance') || 0);
            await receivePayment(invoiceId, balance);
        });
    });
}

async function viewInvoiceDetails(invoiceId) {
    try {
        const data = await fetchInvoiceDetail(invoiceId);
        console.log('Invoice detail:', data);
        alert(`Invoice ${invoiceId} detail loaded. Check console for full data.`);
    } catch (error) {
        console.error('Failed to load invoice detail:', error);
        alert('Failed to load invoice detail.');
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

    const lastPage = sessionStorage.getItem('currentPage') || 'income-stats';
    financeSwitchPage(lastPage);
}

document.addEventListener('DOMContentLoaded', () => {
    initFinancePage();
});
