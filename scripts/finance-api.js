// scripts/finance-api.js
const FINANCE_API_CONFIG = {
    baseURL: '../api/finance',
    endpoints: {
        overview: '/reports.php?action=overview',
        paymentMethods: '/reports.php?action=payment_methods',
        revenueByDate: '/reports.php?action=revenue_by_date',
        purchaseCostByDate: '/reports.php?action=purchase_cost_by_date',
        orders: {
            list: '/orders.php?action=list',
            detail: '/orders.php?action=detail',
            createInvoice: '/orders.php?action=create_invoice'
        },
        invoices: {
            list: '/invoices.php?action=list',
            detail: '/invoices.php?action=detail',
            receivePayment: '/invoices.php?action=receive_payment'
        }
    }
};

async function financeApiRequest(url, options = {}) {
    const response = await fetch(FINANCE_API_CONFIG.baseURL + url, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    });

    const data = await response.json();
    if (!data.success) {
        throw new Error(data.message || 'Finance API request failed');
    }
    return data;
}

async function fetchFinanceOverview() {
    const res = await financeApiRequest(FINANCE_API_CONFIG.endpoints.overview);
    return res.data;
}

async function fetchPaymentMethodSummary(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const url = FINANCE_API_CONFIG.endpoints.paymentMethods + (params.toString() ? '&' + params.toString() : '');
    const res = await financeApiRequest(url);
    return res.data;
}

async function fetchRevenueByDate(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const url = FINANCE_API_CONFIG.endpoints.revenueByDate + (params.toString() ? '&' + params.toString() : '');
    const res = await financeApiRequest(url);
    return res.data;
}

async function fetchPurchaseCostByDate(startDate, endDate) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const url = FINANCE_API_CONFIG.endpoints.purchaseCostByDate + (params.toString() ? '&' + params.toString() : '');
    const res = await financeApiRequest(url);
    return res.data;
}

async function fetchOrderList(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.storeId) params.append('store_id', filters.storeId);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    const url = FINANCE_API_CONFIG.endpoints.orders.list + (params.toString() ? '&' + params.toString() : '');
    const res = await financeApiRequest(url);
    return res.data;
}

async function fetchOrderDetail(orderId) {
    const url = `${FINANCE_API_CONFIG.endpoints.orders.detail}&order_id=${orderId}`;
    const res = await financeApiRequest(url);
    return res.data;
}

async function createInvoiceForOrder(orderId) {
    return financeApiRequest(FINANCE_API_CONFIG.endpoints.orders.createInvoice, {
        method: 'POST',
        body: JSON.stringify({ order_id: orderId })
    });
}

async function fetchInvoiceList(filters = {}) {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.orderId) params.append('order_id', filters.orderId);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    const url = FINANCE_API_CONFIG.endpoints.invoices.list + (params.toString() ? '&' + params.toString() : '');
    const res = await financeApiRequest(url);
    return res.data;
}

async function fetchInvoiceDetail(invoiceId) {
    const url = `${FINANCE_API_CONFIG.endpoints.invoices.detail}&invoice_id=${invoiceId}`;
    const res = await financeApiRequest(url);
    return res.data;
}

async function recordInvoicePayment(invoiceId, amount, paymentMethod) {
    return financeApiRequest(FINANCE_API_CONFIG.endpoints.invoices.receivePayment, {
        method: 'POST',
        body: JSON.stringify({ invoice_id: invoiceId, amount, payment_method: paymentMethod })
    });
}
