/**
 * Manager API Configuration and Functions
 * 管理端API配置和封装函数
 */

const MANAGER_API_CONFIG = {
    baseURL: '../api/manager',
    endpoints: {
        stores: {
            list: '/stores.php?action=list',
            detail: '/stores.php?action=detail',
            stats: '/stores.php?action=stats'
        },
        employees: {
            list: '/employees.php?action=list',
            detail: '/employees.php?action=detail',
            performance: '/employees.php?action=performance',
            byStore: '/employees.php?action=by_store',
            add: '/employees.php?action=add',
            update: '/employees.php?action=update',
            delete: '/employees.php?action=delete',
            search: '/employees.php?action=search'
        },
        books: {
            list: '/books.php?action=list',
            detail: '/books.php?action=detail',
            add: '/books.php?action=add',
            updatePricing: '/books.php?action=update_pricing',
            search: '/books.php?action=search',
            categories: '/books.php?action=categories',
            authors: '/books.php?action=authors'
        },
        users: {
            list: '/users.php?action=list',
            detail: '/users.php?action=detail',
            add: '/users.php?action=add',
            update: '/users.php?action=update',
            delete: '/users.php?action=delete',
            toggleStatus: '/users.php?action=toggle_status',
            search: '/users.php?action=search',
            resetPassword: '/users.php?action=reset_password'
        },
        profile: {
            getCurrentUser: '/profile.php?action=get_current_user',
            updateProfile: '/profile.php?action=update_profile',
            changePassword: '/profile.php?action=change_password'
        },
        notifications: {
            list: '/notifications.php?action=list',
            detail: '/notifications.php?action=detail',
            create: '/notifications.php?action=create',
            update: '/notifications.php?action=update',
            delete: '/notifications.php?action=delete'
        },
        inventory: {
            overview: '/inventory.php?action=overview',
            byStore: '/inventory.php?action=by_store',
            bySKU: '/inventory.php?action=by_sku',
            searchByStore: '/inventory.php?action=search_by_store',
            searchBySKU: '/inventory.php?action=search_by_sku',
            transfer: '/inventory.php?action=transfer'
        },
        replenishment: {
            list: '/replenishment.php?action=list',
            detail: '/replenishment.php?action=detail',
            create: '/replenishment.php?action=create',
            approve: '/replenishment.php?action=approve',
            reject: '/replenishment.php?action=reject',
            complete: '/replenishment.php?action=complete'
        },
        purchases: {
            list: '/purchases.php?action=list',
            detail: '/purchases.php?action=detail',
            create: '/purchases.php?action=create'
        },
        suppliers: {
            list: '/suppliers.php?action=list',
            detail: '/suppliers.php?action=detail',
            add: '/suppliers.php?action=add',
            update: '/suppliers.php?action=update',
            delete: '/suppliers.php?action=delete',
            search: '/suppliers.php?action=search'
        },
        reports: {
            overview: '/reports.php?action=overview',
            salesByStore: '/reports.php?action=sales_by_store',
            salesByCategory: '/reports.php?action=sales_by_category',
            paymentAnalysis: '/reports.php?action=payment_analysis',
            bestsellers: '/reports.php?action=bestsellers',
            storePerformance: '/reports.php?action=store_performance',
            ordersSummary: '/reports.php?action=orders_summary'
        }
    }
};

/**
 * 通用API请求函数
 */
async function managerApiRequest(url, options = {}) {
    try {
        const response = await fetch(MANAGER_API_CONFIG.baseURL + url, {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// =============================================================================
// Stores API Functions
// =============================================================================

async function fetchStoresAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.stores.list);
    return response.data;
}

async function fetchStoreDetailAPI(storeId) {
    const response = await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.stores.detail}&store_id=${storeId}`
    );
    return response.data;
}

async function fetchStoreStatsAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.stores.stats);
    return response.data;
}

// =============================================================================
// Employees API Functions
// =============================================================================

async function fetchEmployeesAPI(filters = {}) {
    let url = MANAGER_API_CONFIG.endpoints.employees.list;
    const params = new URLSearchParams();

    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.job_title_id) params.append('job_title_id', filters.job_title_id);

    const queryString = params.toString();
    if (queryString) url += '&' + queryString;

    const response = await managerApiRequest(url);
    return response.data;
}

async function fetchEmployeePerformanceAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.employees.performance);
    return response.data;
}

async function fetchStaffByStoreAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.employees.byStore);
    return response.data;
}

async function addEmployeeAPI(employeeData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.employees.add, {
        method: 'POST',
        body: JSON.stringify(employeeData)
    });
}

async function updateEmployeeAPI(employeeData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.employees.update, {
        method: 'POST',
        body: JSON.stringify(employeeData)
    });
}

async function deleteEmployeeAPI(employeeId) {
    return await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.employees.delete}&employee_id=${employeeId}`,
        { method: 'GET' }
    );
}

async function searchEmployeesAPI(keyword) {
    const response = await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.employees.search}&keyword=${encodeURIComponent(keyword)}`
    );
    return response.data;
}

// =============================================================================
// Books API Functions
// =============================================================================

async function fetchBooksAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.books.list);
    return response.data;
}

async function fetchBookDetailAPI(ISBN) {
    const response = await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.books.detail}&ISBN=${ISBN}`
    );
    return response.data;
}

async function addBookAPI(bookData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.books.add, {
        method: 'POST',
        body: JSON.stringify(bookData)
    });
}

async function updatePricingAPI(pricingData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.books.updatePricing, {
        method: 'POST',
        body: JSON.stringify(pricingData)
    });
}

async function searchBooksAPI(keyword) {
    const response = await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.books.search}&keyword=${encodeURIComponent(keyword)}`
    );
    return response.data;
}

async function fetchCategoriesAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.books.categories);
    return response.data;
}

async function fetchAuthorsAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.books.authors);
    return response.data;
}

// =============================================================================
// Users API Functions
// =============================================================================

async function fetchUsersAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.users.list);
    return response.data;
}

async function addEmployeeUserAPI(userData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.users.add, {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

async function updateUserAPI(userData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.users.update, {
        method: 'POST',
        body: JSON.stringify(userData)
    });
}

async function deleteUserAPI(userId) {
    return await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.users.delete}&user_id=${userId}`,
        { method: 'GET' }
    );
}

async function toggleUserStatusAPI(userId) {
    return await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.users.toggleStatus}&user_id=${userId}`,
        { method: 'GET' }
    );
}

async function searchUsersAPI(keyword) {
    const response = await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.users.search}&keyword=${encodeURIComponent(keyword)}`
    );
    return response.data;
}

async function resetUserPasswordAPI(userId) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.users.resetPassword, {
        method: 'POST',
        body: JSON.stringify({ user_id: userId })
    });
}

// =============================================================================
// Notifications API Functions
// =============================================================================

async function fetchNotificationsAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.notifications.list);
    return response.data;
}

async function createNotificationAPI(notificationData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.notifications.create, {
        method: 'POST',
        body: JSON.stringify(notificationData)
    });
}

async function updateNotificationAPI(notificationData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.notifications.update, {
        method: 'POST',
        body: JSON.stringify(notificationData)
    });
}

async function deleteNotificationAPI(announcementId) {
    return await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.notifications.delete}&announcement_id=${announcementId}`,
        { method: 'GET' }
    );
}

// =============================================================================
// Inventory API Functions
// =============================================================================

async function fetchInventoryOverviewAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.inventory.overview);
    return response.data;
}

async function fetchInventoryByStoreAPI(storeId = null) {
    let url = MANAGER_API_CONFIG.endpoints.inventory.byStore;
    if (storeId) url += `&store_id=${storeId}`;

    const response = await managerApiRequest(url);
    return response.data;
}

async function searchInventoryByStoreAPI(keyword, storeId = null) {
    let url = `${MANAGER_API_CONFIG.endpoints.inventory.searchByStore}&keyword=${encodeURIComponent(keyword)}`;
    if (storeId) url += `&store_id=${storeId}`;

    const response = await managerApiRequest(url);
    return response.data;
}

async function fetchInventoryBySKUAPI(skuId = null) {
    let url = MANAGER_API_CONFIG.endpoints.inventory.bySKU;
    if (skuId) url += `&sku_id=${skuId}`;

    const response = await managerApiRequest(url);
    return response.data;
}

async function searchInventoryBySKUAPI(keyword) {
    const response = await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.inventory.searchBySKU}&keyword=${encodeURIComponent(keyword)}`
    );
    return response.data;
}
async function transferInventoryAPI(transferData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.inventory.transfer, {
        method: 'POST',
        body: JSON.stringify(transferData)
    });
}

// =============================================================================
// Replenishment API Functions
// =============================================================================

async function fetchReplenishmentRequestsAPI(filters = {}) {
    let url = MANAGER_API_CONFIG.endpoints.replenishment.list;
    const params = new URLSearchParams();

    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.status) params.append('status', filters.status);
    if (filters.urgency_level) params.append('urgency_level', filters.urgency_level);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    const queryString = params.toString();
    if (queryString) url += '&' + queryString;

    const response = await managerApiRequest(url);
    return response.data;
}

async function createReplenishmentRequestAPI(requestData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.replenishment.create, {
        method: 'POST',
        body: JSON.stringify(requestData)
    });
}

async function approveReplenishmentRequestAPI(requestData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.replenishment.approve, {
        method: 'POST',
        body: JSON.stringify(requestData)
    });
}

async function rejectReplenishmentRequestAPI(requestData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.replenishment.reject, {
        method: 'POST',
        body: JSON.stringify(requestData)
    });
}

async function completeReplenishmentRequestAPI(requestId) {
    return await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.replenishment.complete}&request_id=${requestId}`,
        { method: 'GET' }
    );
}

// =============================================================================
// Purchases API Functions
// =============================================================================

async function fetchPurchasesAPI(supplierId = null) {
    let url = MANAGER_API_CONFIG.endpoints.purchases.list;
    if (supplierId) url += `&supplier_id=${supplierId}`;

    const response = await managerApiRequest(url);
    return response.data;
}

async function createPurchaseAPI(purchaseData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.purchases.create, {
        method: 'POST',
        body: JSON.stringify(purchaseData)
    });
}

// =============================================================================
// Suppliers API Functions
// =============================================================================

async function fetchSuppliersAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.suppliers.list);
    return response.data;
}

async function addSupplierAPI(supplierData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.suppliers.add, {
        method: 'POST',
        body: JSON.stringify(supplierData)
    });
}

async function updateSupplierAPI(supplierData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.suppliers.update, {
        method: 'POST',
        body: JSON.stringify(supplierData)
    });
}

async function deleteSupplierAPI(supplierId) {
    return await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.suppliers.delete}&supplier_id=${supplierId}`,
        { method: 'GET' }
    );
}

async function searchSuppliersAPI(keyword) {
    const response = await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.suppliers.search}&keyword=${encodeURIComponent(keyword)}`
    );
    return response.data;
}

// =============================================================================
// Reports API Functions
// =============================================================================

async function fetchOverviewStatsAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.reports.overview);
    return response.data;
}

async function fetchSalesByStoreAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.reports.salesByStore);
    return response.data;
}

async function fetchSalesByCategoryAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.reports.salesByCategory);
    return response.data;
}

async function fetchPaymentAnalysisAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.reports.paymentAnalysis);
    return response.data;
}

async function fetchBestsellersAPI(limit = 10) {
    const response = await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.reports.bestsellers}&limit=${limit}`
    );
    return response.data;
}

async function fetchStorePerformanceAPI() {
    const response = await managerApiRequest(MANAGER_API_CONFIG.endpoints.reports.storePerformance);
    return response.data;
}

async function fetchOrdersSummaryAPI(filters = {}) {
    let url = MANAGER_API_CONFIG.endpoints.reports.ordersSummary;
    const params = new URLSearchParams();

    if (filters.store_id) params.append('store_id', filters.store_id);
    if (filters.order_status) params.append('order_status', filters.order_status);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);

    const queryString = params.toString();
    if (queryString) url += '&' + queryString;

    const response = await managerApiRequest(url);
    return response.data;
}

// =============================================================================
// Profile API Functions (当前用户账户管理)
// =============================================================================

async function getCurrentUserProfileAPI(userId) {
    const response = await managerApiRequest(
        `${MANAGER_API_CONFIG.endpoints.profile.getCurrentUser}&user_id=${userId}`
    );
    return response.data;
}

async function updateProfileAPI(profileData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.profile.updateProfile, {
        method: 'POST',
        body: JSON.stringify(profileData)
    });
}

async function changePasswordAPI(passwordData) {
    return await managerApiRequest(MANAGER_API_CONFIG.endpoints.profile.changePassword, {
        method: 'POST',
        body: JSON.stringify(passwordData)
    });
}

console.log('Manager API functions loaded successfully');
