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
            receivePayment: '/invoices.php?action=receive_payment',
            voidInvoice: '/invoices.php?action=void'//作废支票
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

/*async function fetchFinanceOverview() {
    const res = await financeApiRequest(FINANCE_API_CONFIG.endpoints.overview);
    return res.data;
}*/

async function fetchFinanceOverview(storeId) {
  const params = new URLSearchParams();
  if (storeId) params.append('store_id', storeId);

  const url = FINANCE_API_CONFIG.endpoints.overview + (params.toString() ? '&' + params.toString() : '');
  const res = await financeApiRequest(url);
  return res.data;
}


async function fetchPaymentMethodSummary(startDate, endDate,storeId) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (storeId) params.append('store_id', storeId);
    
    const url = FINANCE_API_CONFIG.endpoints.paymentMethods + (params.toString() ? '&' + params.toString() : '');
    const res = await financeApiRequest(url);
    return res.data;
}

async function fetchRevenueByDate(startDate, endDate,storeId) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (storeId) params.append('store_id', storeId);
    
    const url = FINANCE_API_CONFIG.endpoints.revenueByDate + (params.toString() ? '&' + params.toString() : '');
    const res = await financeApiRequest(url);
    return res.data;
}

async function fetchPurchaseCostByDate(startDate, endDate,storeId) {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (storeId) params.append('store_id', storeId);
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
    
    // 【新增】确保将 orderId 传给后端
    if (filters.orderId) params.append('order_id', filters.orderId);
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


// 文件：scripts/finance-api.js

async function fetchInvoiceList(filters = {}) {
    const params = new URLSearchParams();

    
    // 逻辑：优先用 filters 传进来的 ID，如果没有，再去找全局变量兜底
    const storeId = filters.store_id || (window.currentFinanceUser ? window.currentFinanceUser.store_id : null);

    //const storeId = 1;

    // 只要拿到了 ID，就拼接到 URL 里
    if (storeId) {
        params.append('store_id', storeId);
        // console.log("[API] 发送 Invoice 请求，store_id:", storeId); // 调试用
    }

    // 拼接其他参数 (保持不变)
    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.orderId) params.append('order_id', filters.orderId);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.minAmount) params.append('min_amount', filters.minAmount);
    if (filters.maxAmount) params.append('max_amount', filters.maxAmount);

    const url = FINANCE_API_CONFIG.endpoints.invoices.list + (params.toString() ? '&' + params.toString() : '');
    const res = await financeApiRequest(url);
    return res.data;
}
/*async function fetchInvoiceList(filters = {}) {
    const params = new URLSearchParams();

    // 自动注入当前登录用户的 store_id
    //if (window.currentFinanceUser && window.currentFinanceUser.store_id) {
    //    params.append('store_id', window.currentFinanceUser.store_id);
    //}
    const storeId = filters.store_id || (window.currentFinanceUser ? window.currentFinanceUser.store_id : null);
    
    if (storeId) {
        params.append('store_id', storeId);
        console.log("[API] fetchInvoiceList with store_id:", storeId); // 方便调试
    } else {
        console.warn("[API] Warning: No store_id provided for invoice list!");
    }

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.orderId) params.append('order_id', filters.orderId);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.minAmount) params.append('min_amount', filters.minAmount);
    if (filters.maxAmount) params.append('max_amount', filters.maxAmount);
    const url = FINANCE_API_CONFIG.endpoints.invoices.list + (params.toString() ? '&' + params.toString() : '');
    const res = await financeApiRequest(url);
    return res.data;
}*/


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


async function voidInvoiceRequest(invoiceId) {
    return financeApiRequest(FINANCE_API_CONFIG.endpoints.invoices.voidInvoice, {
        method: 'POST',
        body: JSON.stringify({ invoice_id: invoiceId })
    });
}