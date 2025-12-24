// Add status styles
function addStatusStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .status-created { background-color: #dbeafe; color: #1e40af; }
        .status-paid { background-color: #dcfce7; color: #166534; }
        .status-cancelled { background-color: #fee2e2; color: #b91c1c; }
        .status-refunded { background-color: #fef3c7; color: #92400e; }
        .invoice-draft { background-color: #f3f4f6; color: #374151; }
        .invoice-sent { background-color: #dbeafe; color: #1e40af; }
        .invoice-paid { background-color: #dcfce7; color: #166534; }
        .invoice-overdue { background-color: #fef3c7; color: #92400e; }
        .invoice-cancelled { background-color: #fee2e2; color: #b91c1c; }
        
        /* Modal styles */
        .modal {
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        /* Notes toggle styles */
        .notes-tab {
            padding: 8px 16px;
            border: 1px solid #e5e7eb;
            background: #f9fafb;
            cursor: pointer;
            transition: all 0.3s;
        }
        
        .notes-tab.active {
            background: #8B5A2B;
            color: white;
            border-color: #8B5A2B;
        }
        
        .notes-content {
            display: none;
            min-height: 120px;
        }
        
        .notes-content.active {
            display: block;
        }
        
        .invoice-details-modal {
            width: 90%;
            max-width: 1000px;
            max-height: 90vh;
            overflow-y: auto;
        }
        
        @media print {
            .modal {
                position: static !important;
                background: white !important;
            }
            .modal > div {
                box-shadow: none !important;
                margin: 0 !important;
            }
            .btn-primary, .btn-secondary {
                display: none !important;
            }
            .notes-tabs, .edit-notes-btn {
                display: none !important;
            }
        }
    `;
    document.head.appendChild(style);
}

// Initialize date display
function initDateDisplay() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateElem = document.getElementById('current-date');
    if (dateElem) dateElem.textContent = now.toLocaleDateString('en-US', options);
}

// Global chart instances management
let overviewIncomeTrendChart = null;
let bookTypeChartInstance = null;
let trendTimePeriod = 'weekly';

// 计算待处理发票数量
function updatePendingInvoicesCount() {
    const pendingInvoices = Object.values(invoiceData).filter(invoice => 
        invoice.status === 'draft' || invoice.status === 'sent'
    ).length;
    
    const pendingInvoicesElem = document.getElementById('pending-invoices-count');
    if (pendingInvoicesElem) {
        pendingInvoicesElem.textContent = pendingInvoices;
    }
}

// Initialize Overview charts
function initOverviewCharts() {
    // Income trend chart
    const incomeTrendCtx = document.getElementById('overview-income-trend-chart');
    if (incomeTrendCtx) {
        if (overviewIncomeTrendChart) overviewIncomeTrendChart.destroy();
        updateIncomeTrendChart(trendTimePeriod);
    }

    // 添加待处理发票数量更新
    updatePendingInvoicesCount();

    // Book type pie chart
    const bookTypeCtx = document.getElementById('book-type-chart');
    if (bookTypeCtx) {
        if (bookTypeChartInstance) bookTypeChartInstance.destroy();
        bookTypeChartInstance = new Chart(bookTypeCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography'],
                datasets: [{
                    data: [35, 25, 15, 12, 13],
                    backgroundColor: ['#774b30', '#9f5933', '#a9805b', '#cca278','#e1c7ac'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    title: { display: true, text: 'Book Type Sales Distribution', font: { size: 14, weight: 'bold' } }
                }
            }
        });
    }
}

// Update income trend chart
function updateIncomeTrendChart(period) {
    const ctx = document.getElementById('overview-income-trend-chart');
    if (!ctx) return;

    const dataMap = {
        weekly: { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], values: [12000, 15000, 13500, 14200, 16800, 18500, 17200] },
        monthly: { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], values: [72000, 78000, 82000, 80000, 85000, 86420] },
        quarterly: { labels: ['Q1', 'Q2', 'Q3', 'Q4'], values: [210000, 250000, 280000, 320000] }
    };
    const data = dataMap[period];

    overviewIncomeTrendChart = new Chart(ctx.getContext('2d'), {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Income',
                data: data.values,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#3B82F6'
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

// Initialize period switcher
function initPeriodSwitcher() {
    const btns = document.querySelectorAll('.trend-period-btn');
    if (!btns.length) return;

    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            btns.forEach(b => b.classList.replace('bg-blue-600', 'bg-gray-100').classList.replace('text-white', 'text-gray-700'));
            btn.classList.replace('bg-gray-100', 'bg-blue-600').classList.replace('text-gray-700', 'text-white');
            trendTimePeriod = btn.getAttribute('data-period');
            updateIncomeTrendChart(trendTimePeriod);
        });
    });
}

// Render recent transactions
function renderRecentTransactions() {
    const container = document.getElementById('overview-recent-transactions');
    if (!container) {
        console.warn('Transaction container not found, retrying...');
        setTimeout(renderRecentTransactions, 100);
        return;
    }

    const validTransactions = Object.values(allOrderData)
        .filter(t => t.createdDate)
        .map(t => ({
            ...t,
            sortDate: new Date(t.createdDate.replace(' ', 'T'))
        }))
        .sort((a, b) => b.sortDate - a.sortDate)
        .slice(0, 5);

    container.innerHTML = '';
    validTransactions.forEach(t => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors cursor-pointer';
        row.dataset.orderId = t.orderId;

        let statusClass = 'bg-blue-100 text-blue-800';
        if (t.status === 'paid') statusClass = 'bg-green-100 text-green-800';
        else if (t.status === 'cancelled') statusClass = 'bg-red-100 text-red-800';
        else if (t.status === 'refunded') statusClass = 'bg-yellow-100 text-yellow-800';

        row.innerHTML = `
            <td class="px-4 py-3 text-sm">${t.createdDate}</td>
            <td class="px-4 py-3 text-sm font-medium">${t.orderId}</td>
            <td class="px-4 py-3 text-sm">${t.totalAmount}</td>
            <td class="px-4 py-3 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span>
            </td>
        `;
        container.appendChild(row);

        row.addEventListener('click', () => {
            switchPage('income-expense');
            setTimeout(() => showOrderDetails(t.orderId), 300);
        });
    });
}

// Switch page function - 修复
function switchPage(pageId) {
    console.log('Switching to page:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    } else {
        console.error(`Page not found: ${pageId}-page`);
        return;
    }

    // Update navigation active state
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageId) {
            link.classList.add('active');
        }
    });

    // Initialize page content based on pageId
    setTimeout(() => {
        switch (pageId) {
            case 'overview':
                console.log('Initializing Overview page...');
                initDateDisplay();
                initOverviewCharts();
                initPeriodSwitcher();
                renderRecentTransactions();
                break;
                
            case 'income-expense':
                console.log('Initializing Transaction Details page...');
                // Initialize transaction details page if needed
                break;
                
            case 'income-stats':
                console.log('Initializing Income Distribution page...');
                initIncomeStatsCharts();
                break;
                
            case 'invoice':
                console.log('Initializing Invoice Management page...');
                initInvoicePage();
                break;
        }
    }, 100);
}

// Income distribution charts - modified for book category analysis
function initIncomeStatsCharts() {
    // Book category revenue pie chart
    const bookCategoryCtx = document.getElementById('book-category-pie-chart');
    if (bookCategoryCtx) {
        if (window.bookCategoryPieChart) window.bookCategoryPieChart.destroy();
        window.bookCategoryPieChart = new Chart(bookCategoryCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: bookCategoryData.categoryDistribution.labels,
                datasets: [{
                    data: bookCategoryData.categoryDistribution.data,
                    backgroundColor: bookCategoryData.categoryDistribution.colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' },
                    tooltip: {
                        callbacks: {
                            label: ctx => `${ctx.label}: ¥${ctx.raw.toLocaleString()} (${Math.round((ctx.raw / ctx.dataset.data.reduce((a, b) => a + b, 0)) * 100)}%)`
                        }
                    }
                }
            }
        });
    }

    // Monthly revenue trend chart - single line chart
    const bookRevenueCtx = document.getElementById('book-revenue-trend-chart');
    if (bookRevenueCtx) {
        if (window.bookRevenueTrendChart) window.bookRevenueTrendChart.destroy();
        window.bookRevenueTrendChart = new Chart(bookRevenueCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: bookCategoryData.monthlyTrend.labels,
                datasets: [{
                    label: 'Total Revenue',
                    data: bookCategoryData.monthlyTrend.data,
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
                plugins: { 
                    legend: { display: false } 
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: { callback: value => '¥' + value.toLocaleString() }
                    }
                }
            }
        });
    }

    // Render book category table
    renderBookCategoryTable();
}

// Render book category table
function renderBookCategoryTable() {
    const container = document.getElementById('book-category-table-body');
    if (!container) return;

    container.innerHTML = '';
    bookCategoryData.categoryDetails.forEach(category => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${category.category}</td>
            <td class="px-4 py-4 text-sm">¥${category.thisMonth.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">¥${category.lastMonth.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm"><span class="text-green-600">+${category.growth}%</span></td>
            <td class="px-4 py-4 text-sm">${category.percentage}%</td>
            <td class="px-4 py-4 text-sm"><i class="fa fa-arrow-up text-green-500"></i></td>
        `;
        container.appendChild(row);
    });
}

// Show order details
function showOrderDetails(orderId) {
    const order = orderData[orderId];
    if (!order) return;

    const detailElems = {
        orderId: document.getElementById('detail-order-id'),
        memberId: document.getElementById('detail-member-id'),
        status: document.getElementById('detail-status'),
        createdDate: document.getElementById('detail-created-date'),
        updatedDate: document.getElementById('detail-updated-date'),
        totalAmount: document.getElementById('detail-total-amount')
    };

    Object.keys(detailElems).forEach(key => {
        if (detailElems[key]) detailElems[key].textContent = order[key];
    });

    const itemsContainer = document.getElementById('order-items-list');
    if (itemsContainer) {
        itemsContainer.innerHTML = '';
        order.items.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.innerHTML = `
                <td class="px-4 py-2 text-sm">${item.name}</td>
                <td class="px-4 py-2 text-sm text-gray-500">${item.isbn}</td>
                <td class="px-4 py-2 text-sm">${item.quantity}</td>
                <td class="px-4 py-2 text-sm">${item.unitPrice}</td>
                <td class="px-4 py-2 text-sm">${item.subtotal}</td>
            `;
            itemsContainer.appendChild(row);
        });
    }

    document.getElementById('order-details').classList.remove('hidden');
}

// Update order status
function updateOrderStatus(orderId, newStatus) {
    if (!orderData[orderId]) return;
    orderData[orderId].status = newStatus;
    orderData[orderId].updatedDate = new Date().toLocaleString('en-US', {
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
    }).replace(',', '');

    const currentOrderId = document.getElementById('detail-order-id')?.textContent;
    if (currentOrderId === orderId) showOrderDetails(orderId);
}

// Invoice management functionality
function initInvoicePage() {
    console.log('Initializing Invoice page...');
    renderInvoiceList();
    initInvoiceFilters();
}

// Render invoice list
function renderInvoiceList(invoices = Object.values(invoiceData)) {
    const container = document.getElementById('invoice-table-body');
    if (!container) return;

    container.innerHTML = '';
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.invoiceNo = invoice.invoiceNo;

        let statusClass = '';
        let statusText = '';
        switch (invoice.status) {
            case 'draft': 
                statusClass = 'invoice-draft'; 
                statusText = 'Draft';
                break;
            case 'sent': 
                statusClass = 'invoice-sent'; 
                statusText = 'Sent';
                break;
            case 'paid': 
                statusClass = 'invoice-paid'; 
                statusText = 'Paid';
                break;
            case 'overdue': 
                statusClass = 'invoice-overdue'; 
                statusText = 'Overdue';
                break;
            case 'cancelled': 
                statusClass = 'invoice-cancelled'; 
                statusText = 'Cancelled';
                break;
        }

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${invoice.invoiceNo}</td>
            <td class="px-4 py-4 text-sm">${invoice.orderId}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex flex-col">
                    <span class="font-medium">${invoice.staffId}</span>
                    <span class="text-xs text-gray-500">${staffData[invoice.staffId]?.name || 'Unknown'}</span>
                </div>
            </td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${statusText}</span>
            </td>
            <td class="px-4 py-4 text-sm">${invoice.issueDate}</td>
            <td class="px-4 py-4 text-sm">${invoice.dueDate}</td>
            <td class="px-4 py-4 text-sm font-medium">¥${invoice.amount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">¥${invoice.taxAmount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">${invoice.updateDate}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 view-invoice" data-invoice="${invoice.invoiceNo}" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 edit-invoice" data-invoice="${invoice.invoiceNo}" title="Edit Invoice">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 delete-invoice" data-invoice="${invoice.invoiceNo}" title="Delete Invoice">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });

    // Update pagination info
    updateInvoicePaginationInfo(invoices.length);
}

// Update invoice pagination info
function updateInvoicePaginationInfo(total) {
    const infoElem = document.getElementById('invoice-pagination-info');
    if (infoElem) {
        infoElem.textContent = `Showing 1 to ${total} of ${total} invoices`;
    }
}

// Initialize invoice filters
function initInvoiceFilters() {
    const searchInput = document.getElementById('invoice-search');
    const statusSelect = document.getElementById('invoice-status-filter');
    const staffSelect = document.getElementById('invoice-staff-filter');
    const orderInput = document.getElementById('invoice-order-filter');
    const searchBtn = document.getElementById('invoice-search-btn');
    const resetBtn = document.getElementById('invoice-reset-btn');

    if (searchBtn) {
        searchBtn.addEventListener('click', filterInvoices);
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', resetInvoiceFilters);
    }

    if (searchInput) {
        searchInput.addEventListener('input', filterInvoices);
    }

    if (statusSelect) {
        statusSelect.addEventListener('change', filterInvoices);
    }

    if (staffSelect) {
        staffSelect.addEventListener('change', filterInvoices);
    }

    if (orderInput) {
        orderInput.addEventListener('input', filterInvoices);
    }
}

// Filter invoices
function filterInvoices() {
    const searchInput = document.getElementById('invoice-search');
    const statusSelect = document.getElementById('invoice-status-filter');
    const staffSelect = document.getElementById('invoice-staff-filter');
    const orderInput = document.getElementById('invoice-order-filter');
    const startDateInput = document.getElementById('invoice-start-date');
    const endDateInput = document.getElementById('invoice-end-date');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = statusSelect ? statusSelect.value : '';
    const staffFilter = staffSelect ? staffSelect.value : '';
    const orderFilter = orderInput ? orderInput.value.toUpperCase() : '';
    const startDate = startDateInput ? startDateInput.value : '';
    const endDate = endDateInput ? endDateInput.value : '';

    const filteredInvoices = Object.values(invoiceData).filter(invoice => {
        const matchesSearch = invoice.invoiceNo.toLowerCase().includes(searchTerm) || 
                             (invoice.customer && invoice.customer.toLowerCase().includes(searchTerm)) ||
                             invoice.orderId.includes(searchTerm);
        const matchesStatus = !statusFilter || invoice.status === statusFilter;
        const matchesStaff = !staffFilter || invoice.staffId === staffFilter;
        const matchesOrder = !orderFilter || invoice.orderId.includes(orderFilter);
        
        // Date filtering
        let matchesDate = true;
        if (startDate || endDate) {
            const invoiceDate = new Date(invoice.issueDate);
            if (startDate) {
                const filterStartDate = new Date(startDate);
                if (invoiceDate < filterStartDate) matchesDate = false;
            }
            if (endDate && matchesDate) {
                const filterEndDate = new Date(endDate);
                if (invoiceDate > filterEndDate) matchesDate = false;
            }
        }
        
        return matchesSearch && matchesStatus && matchesStaff && matchesOrder && matchesDate;
    });

    renderFilteredInvoices(filteredInvoices);
}

// Render filtered invoices
function renderFilteredInvoices(invoices) {
    const container = document.getElementById('invoice-table-body');
    if (!container) return;

    container.innerHTML = '';
    invoices.forEach(invoice => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.invoiceNo = invoice.invoiceNo;

        let statusClass = '';
        let statusText = '';
        switch (invoice.status) {
            case 'draft': 
                statusClass = 'invoice-draft'; 
                statusText = 'Draft';
                break;
            case 'sent': 
                statusClass = 'invoice-sent'; 
                statusText = 'Sent';
                break;
            case 'paid': 
                statusClass = 'invoice-paid'; 
                statusText = 'Paid';
                break;
            case 'overdue': 
                statusClass = 'invoice-overdue'; 
                statusText = 'Overdue';
                break;
            case 'cancelled': 
                statusClass = 'invoice-cancelled'; 
                statusText = 'Cancelled';
                break;
        }

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${invoice.invoiceNo}</td>
            <td class="px-4 py-4 text-sm">${invoice.orderId}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex flex-col">
                    <span class="font-medium">${invoice.staffId}</span>
                    <span class="text-xs text-gray-500">${staffData[invoice.staffId]?.name || 'Unknown'}</span>
                </div>
            </td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${statusText}</span>
            </td>
            <td class="px-4 py-4 text-sm">${invoice.issueDate}</td>
            <td class="px-4 py-4 text-sm">${invoice.dueDate}</td>
            <td class="px-4 py-4 text-sm font-medium">¥${invoice.amount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">¥${invoice.taxAmount.toLocaleString()}</td>
            <td class="px-4 py-4 text-sm">${invoice.updateDate}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 view-invoice" data-invoice="${invoice.invoiceNo}" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 edit-invoice" data-invoice="${invoice.invoiceNo}" title="Edit Invoice">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 delete-invoice" data-invoice="${invoice.invoiceNo}" title="Delete Invoice">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });

    updateInvoicePaginationInfo(invoices.length);
}

// Reset invoice filters
function resetInvoiceFilters() {
    const searchInput = document.getElementById('invoice-search');
    const statusSelect = document.getElementById('invoice-status-filter');
    const staffSelect = document.getElementById('invoice-staff-filter');
    const orderInput = document.getElementById('invoice-order-filter');
    const startDateInput = document.getElementById('invoice-start-date');
    const endDateInput = document.getElementById('invoice-end-date');
    
    if (searchInput) searchInput.value = '';
    if (statusSelect) statusSelect.value = '';
    if (staffSelect) staffSelect.value = '';
    if (orderInput) orderInput.value = '';
    if (startDateInput) startDateInput.value = '';
    if (endDateInput) endDateInput.value = '';
    
    renderInvoiceList();
}

// Show invoice details
function showInvoiceDetails(invoiceNo) {
    const invoice = invoiceData[invoiceNo];
    if (!invoice) return;

    const staff = staffData[invoice.staffId];
    const order = allOrderData[invoice.orderId];

    const detailsHtml = `
        <div class="bg-white rounded-lg shadow-lg invoice-details-modal">
            <div class="p-6">
                <div class="flex justify-between items-start mb-6">
                    <div>
                        <h3 class="text-2xl font-bold text-gray-800">Invoice Details</h3>
                        <p class="text-gray-600">Invoice No: ${invoice.invoiceNo}</p>
                    </div>
                    <span class="px-3 py-1 text-sm ${getStatusClass(invoice.status)} rounded-full">
                        ${invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-2">Invoice Information</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Order ID:</span>
                                    <span class="font-medium">${invoice.orderId}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Staff ID:</span>
                                    <span class="font-medium">${invoice.staffId} (${staff?.name || 'Unknown'})</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Issue Date:</span>
                                    <span class="font-medium">${invoice.issueDate}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Due Date:</span>
                                    <span class="font-medium">${invoice.dueDate}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Last Updated:</span>
                                    <span class="font-medium">${invoice.updateDate}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div>
                            <h4 class="font-semibold text-gray-700 mb-2">Financial Details</h4>
                            <div class="space-y-2 text-sm">
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Subtotal:</span>
                                    <span class="font-medium">¥${(invoice.amount - invoice.taxAmount).toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between">
                                    <span class="text-gray-500">Tax (${invoice.taxRate}%):</span>
                                    <span class="font-medium">¥${invoice.taxAmount.toLocaleString()}</span>
                                </div>
                                <div class="flex justify-between border-t pt-2">
                                    <span class="text-gray-500 font-semibold">Total Amount:</span>
                                    <span class="font-bold text-lg">¥${invoice.amount.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                ${order ? `
                <div class="mb-6">
                    <h4 class="font-semibold text-gray-700 mb-3">Order Information</h4>
                    <div class="bg-gray-50 p-4 rounded-lg">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span class="text-gray-500">Order Status:</span>
                                <span class="ml-2 px-2 py-1 text-xs ${getOrderStatusClass(order.status)} rounded-full">
                                    ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                </span>
                            </div>
                            <div>
                                <span class="text-gray-500">Order Date:</span>
                                <span class="ml-2 font-medium">${order.createdDate}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Payment Method:</span>
                                <span class="ml-2 font-medium">${order.paymentMethod}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">Customer:</span>
                                <span class="ml-2 font-medium">${invoice.customer}</span>
                            </div>
                        </div>
                    </div>
                </div>
                ` : ''}

                <div class="mb-6">
                    <h4 class="font-semibold text-gray-700 mb-3">Invoice Items</h4>
                    <div class="overflow-x-auto">
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                    <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                                    <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                                    <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${invoice.items.map(item => `
                                    <tr class="hover:bg-gray-50">
                                        <td class="px-4 py-2 text-sm">${item.description}</td>
                                        <td class="px-4 py-2 text-sm">${item.quantity}</td>
                                        <td class="px-4 py-2 text-sm">¥${item.unitPrice.toLocaleString()}</td>
                                        <td class="px-4 py-2 text-sm font-medium">¥${item.subtotal.toLocaleString()}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div class="mb-6">
                    <h4 class="font-semibold text-gray-700 mb-3">Notes</h4>
                    <div class="notes-tabs flex border-b mb-4">
                        <button class="notes-tab active" data-tab="internal">Internal Notes</button>
                        <button class="notes-tab" data-tab="customer">Customer Notes</button>
                    </div>
                    <div class="notes-content active" id="internal-notes">
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700">${invoice.internalNotes}</p>
                            <div class="mt-2 text-xs text-gray-500">
                                Last edited by: ${staffData[invoice.lastEditedBy]?.name || invoice.lastEditedBy} on ${invoice.lastEditDate}
                            </div>
                        </div>
                    </div>
                    <div class="notes-content" id="customer-notes">
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <p class="text-gray-700">${invoice.customerNotes}</p>
                            <div class="mt-2 text-xs text-gray-500">
                                This note will be sent to the customer
                            </div>
                        </div>
                    </div>
                    <button class="edit-notes-btn mt-3 btn-secondary" data-invoice="${invoice.invoiceNo}">
                        <i class="fa fa-edit mr-2"></i>Edit Notes
                    </button>
                </div>

                <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
                    <button class="btn-secondary close-invoice-modal">Close</button>
                    <button class="btn-primary print-invoice" data-invoice="${invoice.invoiceNo}">
                        <i class="fa fa-print mr-2"></i>Print Invoice
                    </button>
                </div>
            </div>
        </div>
    `;

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = detailsHtml;
    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Close button
    modal.querySelector('.close-invoice-modal')?.addEventListener('click', () => {
        modal.remove();
    });

    // Notes toggle functionality
    modal.querySelectorAll('.notes-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove all active states
            modal.querySelectorAll('.notes-tab').forEach(t => t.classList.remove('active'));
            modal.querySelectorAll('.notes-content').forEach(c => c.classList.remove('active'));
            
            // Activate current tab
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            modal.querySelector(`#${tabId}-notes`).classList.add('active');
        });
    });

    // Edit notes functionality
    modal.querySelector('.edit-notes-btn')?.addEventListener('click', () => {
        editInvoiceNotes(invoiceNo, modal);
    });

    // Print functionality
    modal.querySelector('.print-invoice')?.addEventListener('click', () => {
        window.print();
    });
}

// Edit invoice notes
function editInvoiceNotes(invoiceNo, modal) {
    const invoice = invoiceData[invoiceNo];
    if (!invoice) return;

    const editFormHtml = `
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-2xl mx-auto">
            <h3 class="text-xl font-bold text-gray-800 mb-4">Edit Invoice Notes</h3>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Internal Notes (Accounting View)</label>
                    <textarea id="edit-internal-notes" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" rows="4">${invoice.internalNotes}</textarea>
                    <p class="text-xs text-gray-500 mt-1">Internal notes for accounting team reference</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Customer Notes (Client View)</label>
                    <textarea id="edit-customer-notes" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all" rows="4">${invoice.customerNotes}</textarea>
                    <p class="text-xs text-gray-500 mt-1">This note will be visible to the customer</p>
                </div>
            </div>
            
            <div class="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button class="btn-secondary cancel-edit-notes">Cancel</button>
                <button class="btn-primary save-notes" data-invoice="${invoiceNo}">
                    <i class="fa fa-save mr-2"></i>Save Changes
                </button>
            </div>
        </div>
    `;

    // Create edit modal
    const editModal = document.createElement('div');
    editModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    editModal.innerHTML = editFormHtml;
    document.body.appendChild(editModal);

    // Save notes
    editModal.querySelector('.save-notes').addEventListener('click', () => {
        const internalNotes = document.getElementById('edit-internal-notes').value;
        const customerNotes = document.getElementById('edit-customer-notes').value;
        
        // Update invoice data
        invoiceData[invoiceNo].internalNotes = internalNotes;
        invoiceData[invoiceNo].customerNotes = customerNotes;
        invoiceData[invoiceNo].lastEditedBy = "STAFF-001"; // Current user ID
        invoiceData[invoiceNo].lastEditDate = new Date().toLocaleString('en-US', {
            year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        }).replace(',', '');
        
        // Close edit modal
        editModal.remove();
        
        // Close details modal and reopen to refresh content
        modal.remove();
        showInvoiceDetails(invoiceNo);
        
        // Update invoice list
        renderInvoiceList();
    });

    // Cancel button
    editModal.querySelector('.cancel-edit-notes')?.addEventListener('click', () => {
        editModal.remove();
    });

    // Close on background click
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            editModal.remove();
        }
    });
}

// Get status class
function getStatusClass(status) {
    switch (status) {
        case 'draft': return 'invoice-draft';
        case 'sent': return 'invoice-sent';
        case 'paid': return 'invoice-paid';
        case 'overdue': return 'invoice-overdue';
        case 'cancelled': return 'invoice-cancelled';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Get order status class
function getOrderStatusClass(status) {
    switch (status) {
        case 'created': return 'bg-blue-100 text-blue-800';
        case 'paid': return 'bg-green-100 text-green-800';
        case 'cancelled': return 'bg-red-100 text-red-800';
        case 'refunded': return 'bg-yellow-100 text-yellow-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Edit invoice
function editInvoice(invoiceNo) {
    const invoice = invoiceData[invoiceNo];
    if (!invoice) return;

    // Here you can add invoice edit form
    alert(`Edit Invoice: ${invoice.invoiceNo}\n\nThis would open an edit form with fields for:\n- Order ID: ${invoice.orderId}\n- Staff ID: ${invoice.staffId}\n- Status: ${invoice.status}\n- Issue Date: ${invoice.issueDate}\n- Due Date: ${invoice.dueDate}\n- Amount: ¥${invoice.amount}\n- Tax Amount: ¥${invoice.taxAmount}`);
}

// Delete invoice
function deleteInvoice(invoiceNo) {
    if (confirm(`Are you sure you want to delete invoice ${invoiceNo}?`)) {
        // Here you can add invoice deletion logic
        delete invoiceData[invoiceNo];
        alert(`Invoice ${invoiceNo} deleted successfully!`);
        renderInvoiceList();
    }
}

// Initialize event listeners
function initEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.toggle('hidden');
    });

    // Navigation toggle
    document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(link.dataset.page);
        });
    });

    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
            window.location.href = 'login.html';
        }
    });

    // Regular order click
    const transactionTable = document.querySelector('#income-expense-page table');
    if (transactionTable) {
        transactionTable.addEventListener('click', (e) => {
            const row = e.target.closest('tr[data-order-id]');
            if (row) showOrderDetails(row.dataset.orderId);
        });
    }

    // Invoice operations
    document.addEventListener('click', (e) => {
        if (e.target.closest('.view-invoice')) {
            const invoiceNo = e.target.closest('.view-invoice').dataset.invoice;
            showInvoiceDetails(invoiceNo);
        } else if (e.target.closest('.edit-invoice')) {
            const invoiceNo = e.target.closest('.edit-invoice').dataset.invoice;
            editInvoice(invoiceNo);
        } else if (e.target.closest('.delete-invoice')) {
            const invoiceNo = e.target.closest('.delete-invoice').dataset.invoice;
            deleteInvoice(invoiceNo);
        }
    });

    // Create invoice button
    const createInvoiceBtn = document.querySelector('#invoice-page .btn-primary');
    if (createInvoiceBtn && !createInvoiceBtn.id) {
        createInvoiceBtn.addEventListener('click', () => {
            alert('Create new invoice functionality would go here');
        });
    }
}

// Page load initialization
document.addEventListener('DOMContentLoaded', () => {
    console.log('Finance page loaded');
    addStatusStyles();
    initDateDisplay();
    initOverviewCharts();
    initPeriodSwitcher();
    renderRecentTransactions();
    initEventListeners();
    
    // Ensure overview page is visible by default
    document.querySelectorAll('.page-content').forEach(page => {
        if (page.id !== 'overview-page') {
            page.classList.add('hidden');
        }
    });
});