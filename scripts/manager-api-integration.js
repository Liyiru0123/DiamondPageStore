/**
 * Manager API Integration
 * Overrides manager.js mock data functions with API calls.
 */

const MANAGER_CURRENCY_LABEL = 'CNY';

// =============================================================================
// HTML Escaping Function (XSS Protection)
// =============================================================================

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} str - The string to escape
 * @returns {string} - The escaped string
 */
function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(str);
    return div.innerHTML;
}

// =============================================================================
// Loading State Management
// =============================================================================

let loadingCount = 0;

/**
 * Shows a loading indicator
 * @param {string} targetId - Optional ID of element to show loading on
 */
function showLoading(targetId) {
    loadingCount++;
    if (targetId) {
        const target = document.getElementById(targetId);
        if (target) {
            const spinner = document.createElement('div');
            spinner.className = 'loading-spinner';
            spinner.innerHTML = '<i class="fa fa-spinner fa-spin"></i> Loading...';
            spinner.style.cssText = 'text-align: center; padding: 20px; color: #666;';
            target.dataset.originalContent = target.innerHTML;
            target.innerHTML = '';
            target.appendChild(spinner);
        }
    }
}

/**
 * Hides the loading indicator
 * @param {string} targetId - Optional ID of element to hide loading from
 */
function hideLoading(targetId) {
    loadingCount = Math.max(0, loadingCount - 1);
    if (targetId) {
        const target = document.getElementById(targetId);
        if (target && target.dataset.originalContent) {
            target.innerHTML = target.dataset.originalContent;
            delete target.dataset.originalContent;
        }
    }
}

// =============================================================================
// Staff Management
// =============================================================================

async function loadStaffData() {
    const tableBody = document.getElementById('staff-table-body');
    if (!tableBody) return;

    showLoading('staff-table-body');
    try {
        const employees = await fetchEmployeesAPI();
        const staffCount = document.getElementById('staff-count');

        tableBody.innerHTML = '';

        employees.forEach(employee => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.dataset.storeID = String(employee.store_id);

            let position = 'staff';
            if (employee.job_title && employee.job_title.toLowerCase().includes('manager')) {
                position = 'manager';
            } else if (employee.job_title && employee.job_title.toLowerCase().includes('finance')) {
                position = 'finance';
            }
            row.dataset.position = position;

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${escapeHtml(employee.employee_id)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(employee.user_id)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(employee.store_name)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(employee.full_name)}</td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs ${position === 'manager' ? 'role-manager' : position === 'finance' ? 'role-finance' : 'role-staff'} rounded-full">
                        ${escapeHtml(employee.job_title || 'Staff')}
                    </span>
                </td>
                <td class="px-4 py-4 text-sm">${escapeHtml(employee.phone)}</td>
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
            tableBody.appendChild(row);
        });

        if (staffCount) {
            staffCount.textContent = String(employees.length);
        }

        addStaffActionButtonListeners();
    } catch (error) {
        console.error('Failed to load staff data:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-red-600">Failed to load staff data</td></tr>';
        showMessage('Failed to load staff data: ' + error.message, 'error');
    } finally {
        hideLoading('staff-table-body');
    }
}

async function deleteStaff(employeeId) {
    if (!confirm('Are you sure you want to delete this employee?')) return;

    try {
        await deleteEmployeeAPI(employeeId);
        showMessage('Employee deleted successfully', 'success');
        loadStaffData();
    } catch (error) {
        console.error('Failed to delete employee:', error);
        showMessage('Failed to delete employee: ' + error.message, 'error');
    }
}

function addStaffActionButtonListeners() {
    document.querySelectorAll('#staff-table-body .edit-staff').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = row.cells[3].textContent;
            alert(`Editing: ${name}`);
        });
    });

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

    document.querySelectorAll('#staff-table-body .delete-staff').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const employeeId = row.cells[0].textContent;
            deleteStaff(employeeId);
        });
    });
}

// =============================================================================
// Pricing Management
// =============================================================================

async function loadPricingData() {
    const tableBody = document.getElementById('pricing-table-body');
    if (!tableBody) return;

    showLoading('pricing-table-body');
    try {
        const books = await fetchBooksAPI();
        tableBody.innerHTML = '';

        books.forEach(book => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-6 py-4">${escapeHtml(book.ISBN)}</td>
                <td class="px-6 py-4">${escapeHtml(book.name)}</td>
                <td class="px-6 py-4">${escapeHtml(book.authors || 'Unknown')}</td>
                <td class="px-6 py-4">${escapeHtml(book.publisher)}</td>
                <td class="px-6 py-4">${escapeHtml(book.binding)}</td>
                <td class="px-6 py-4">${MANAGER_CURRENCY_LABEL} ${parseFloat(book.unit_price).toFixed(2)}</td>
                <td class="px-6 py-4">${escapeHtml(book.total_stock)}</td>
                <td class="px-6 py-4">
                    <button onclick="editPricing(${book.sku_id}, '${escapeHtml(book.name)}', ${book.unit_price})"
                        class="text-primary hover:text-primary-dark">
                        <i class="fa fa-edit"></i> Edit Price
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load pricing data:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-600">Failed to load pricing data</td></tr>';
        showMessage('Failed to load pricing data: ' + error.message, 'error');
    } finally {
        hideLoading('pricing-table-body');
    }
}

async function editPricing(skuId, bookName, currentPrice) {
    const newPrice = prompt(`Update price for "${bookName}":\nCurrent price: ${MANAGER_CURRENCY_LABEL} ${currentPrice}`, currentPrice);

    if (newPrice === null || newPrice.trim() === '') return;

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
        showMessage('Invalid price', 'error');
        return;
    }

    try {
        await updatePricingAPI({ sku_id: skuId, new_price: priceNum });
        showMessage('Price updated successfully', 'success');
        loadPricingData();
    } catch (error) {
        console.error('Failed to update pricing:', error);
        showMessage('Failed to update pricing: ' + error.message, 'error');
    }
}

// =============================================================================
// Notifications
// =============================================================================

async function loadNotifications() {
    try {
        const notifications = await fetchNotificationsAPI();

        const list = document.getElementById('notifications-list');
        if (!list) return;

        list.innerHTML = '';

        notifications.forEach(notif => {
            const item = document.createElement('div');
            item.className = 'p-4 border border-gray-200 rounded-lg bg-white';
            item.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <h4 class="font-semibold text-gray-900">${escapeHtml(notif.title)}</h4>
                        <p class="text-sm text-gray-600 mt-1">${escapeHtml(notif.content)}</p>
                        <p class="text-xs text-gray-500 mt-2">
                            Publish: ${escapeHtml(new Date(notif.publish_at).toLocaleString())}
                            ${notif.expire_at ? ` | Expire: ${escapeHtml(new Date(notif.expire_at).toLocaleString())}` : ''}
                        </p>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="deleteNotification(${notif.announcement_id})" class="text-red-600 hover:text-red-800">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            list.appendChild(item);
        });
    } catch (error) {
        console.error('Failed to load notifications:', error);
        showMessage('Failed to load notifications: ' + error.message, 'error');
    }
}

async function sendNotification() {
    const titleInput = document.getElementById('notification-subject');
    const contentInput = document.getElementById('notification-message');
    if (!titleInput || !contentInput) return;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (!title || !content) {
        showMessage('Please fill in all required fields', 'error');
        return;
    }

    try {
        await createNotificationAPI({ title, content });
        showMessage('Notification sent successfully', 'success');

        titleInput.value = '';
        contentInput.value = '';
        loadNotifications();
    } catch (error) {
        console.error('Failed to send notification:', error);
        showMessage('Failed to send notification: ' + error.message, 'error');
    }
}

async function deleteNotification(announcementId) {
    if (!confirm('Are you sure you want to delete this notification?')) return;

    try {
        await deleteNotificationAPI(announcementId);
        showMessage('Notification deleted successfully', 'success');
        loadNotifications();
    } catch (error) {
        console.error('Failed to delete notification:', error);
        showMessage('Failed to delete notification: ' + error.message, 'error');
    }
}

// =============================================================================
// User Management
// =============================================================================

async function loadUserManagementData() {
    const tableBody = document.getElementById('user-management-table-body');
    if (!tableBody) return;

    showLoading('user-management-table-body');
    try {
        const users = await fetchUsersAPI();
        tableBody.innerHTML = '';

        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${escapeHtml(user.user_id)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(user.username)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(user.user_type)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(user.full_name || 'N/A')}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(user.phone || 'N/A')}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(new Date(user.create_date).toLocaleDateString())}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(new Date(user.last_log_date).toLocaleDateString())}</td>
                <td class="px-4 py-4 text-sm">
                    <div class="flex gap-2">
                        <button class="text-red-600 hover:text-red-800 delete-user-btn" data-user-id="${escapeHtml(user.user_id)}" title="Delete User">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        document.querySelectorAll('#user-management-table-body .delete-user-btn').forEach(button => {
            button.addEventListener('click', function () {
                const userId = this.getAttribute('data-user-id');
                deleteUser(userId);
            });
        });
    } catch (error) {
        console.error('Failed to load user management data:', error);
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center py-4 text-red-600">Failed to load user data</td></tr>';
        showMessage('Failed to load user data: ' + error.message, 'error');
    } finally {
        hideLoading('user-management-table-body');
    }
}

async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        await deleteUserAPI(userId);
        showMessage('User deleted successfully', 'success');
        loadUserManagementData();
    } catch (error) {
        console.error('Failed to delete user:', error);
        showMessage('Failed to delete user: ' + error.message, 'error');
    }
}

// =============================================================================
// Replenishment Requests
// =============================================================================

let managerReplenishmentCache = [];

async function loadReplenishmentRequests() {
    const tableBody = document.getElementById('replenishment-table-body');
    if (!tableBody) return;

    showLoading('replenishment-table-body');
    try {
        const status = document.getElementById('request-status-filter')?.value || '';
        const urgency = document.getElementById('request-urgency-filter')?.value || '';
        const store = document.getElementById('request-branch-filter')?.value || '';
        const dateFrom = document.getElementById('request-date-from')?.value || '';
        const dateTo = document.getElementById('request-date-to')?.value || '';

        const filters = {};
        if (status && status !== 'all') filters.status = status;
        if (urgency && urgency !== 'all') filters.urgency_level = urgency;
        if (store && store !== 'all') filters.store_id = store;
        if (dateFrom) filters.date_from = dateFrom;
        if (dateTo) filters.date_to = dateTo;

        const requests = await fetchReplenishmentRequestsAPI(filters);
        managerReplenishmentCache = requests;
        tableBody.innerHTML = '';

        requests.forEach(request => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.dataset.requestId = request.request_id;

            const statusClass = request.status === 'approved'
                ? 'bg-green-100 text-green-800'
                : request.status === 'rejected'
                ? 'bg-red-100 text-red-800'
                : request.status === 'completed'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800';

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${escapeHtml(request.request_id)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(request.store_name)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(new Date(request.request_date).toLocaleString())}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(request.sku_count)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(request.total_quantity)}</td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${escapeHtml(request.status)}</span>
                </td>
                <td class="px-4 py-4 text-sm">
                    <div class="flex gap-2">
                        <button class="text-primary hover:text-primary/80 view-request-btn" title="View Details">
                            <i class="fa fa-eye"></i>
                        </button>
                        ${request.status === 'pending' ? `
                        <button class="text-green-600 hover:text-green-800 approve-request-btn" title="Approve">
                            <i class="fa fa-check"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 reject-request-btn" title="Reject">
                            <i class="fa fa-times"></i>
                        </button>
                        ` : ''}
                        ${request.status === 'approved' ? `
                        <button class="text-blue-600 hover:text-blue-800 complete-request-btn" title="Mark Completed">
                            <i class="fa fa-check-circle"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            `;
            tableBody.appendChild(row);
        });

        wireRequestActionButtons();
    } catch (error) {
        console.error('Failed to load replenishment requests:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-red-600">Failed to load requests</td></tr>';
        showMessage('Failed to load requests: ' + error.message, 'error');
    } finally {
        hideLoading('replenishment-table-body');
    }
}

function wireRequestActionButtons() {
    document.querySelectorAll('#replenishment-table-body .view-request-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const requestId = row.dataset.requestId;
            viewRequestDetail(requestId);
        });
    });

    document.querySelectorAll('#replenishment-table-body .approve-request-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const requestId = row.dataset.requestId;
            approveRequestById(requestId);
        });
    });

    document.querySelectorAll('#replenishment-table-body .reject-request-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const requestId = row.dataset.requestId;
            rejectRequestById(requestId);
        });
    });

    document.querySelectorAll('#replenishment-table-body .complete-request-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const requestId = row.dataset.requestId;
            completeRequest(requestId);
        });
    });
}

function viewRequestDetail(requestId) {
    const request = managerReplenishmentCache.find(r => String(r.request_id) === String(requestId));
    if (!request) return;

    const modal = document.getElementById('request-detail-modal');
    const content = document.getElementById('request-detail-content');
    if (!modal || !content) return;

    content.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><strong>Request ID:</strong> ${escapeHtml(request.request_id)}</div>
            <div><strong>Status:</strong> ${escapeHtml(request.status)}</div>
            <div><strong>Store:</strong> ${escapeHtml(request.store_name)}</div>
            <div><strong>SKU:</strong> ${escapeHtml(request.sku_id)}</div>
            <div><strong>Book:</strong> ${escapeHtml(request.book_name)}</div>
            <div><strong>Quantity:</strong> ${escapeHtml(request.requested_quantity)}</div>
            <div><strong>Urgency:</strong> ${escapeHtml(request.urgency_level)}</div>
            <div><strong>Date:</strong> ${escapeHtml(new Date(request.request_date).toLocaleString())}</div>
            <div class="md:col-span-2"><strong>Reason:</strong> ${escapeHtml(request.reason || 'N/A')}</div>
        </div>
    `;

    modal.dataset.currentRequestId = requestId;
    modal.classList.remove('hidden');
}

async function approveRequestById(requestId) {
    if (!confirm(`Approve request ${requestId}?`)) return;
    try {
        await approveReplenishmentRequestAPI({ request_id: requestId });
        showMessage('Request approved successfully', 'success');
        loadReplenishmentRequests();
    } catch (error) {
        console.error('Failed to approve request:', error);
        showMessage('Failed to approve request: ' + error.message, 'error');
    }
}

async function rejectRequestById(requestId) {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    try {
        await rejectReplenishmentRequestAPI({ request_id: requestId, rejection_reason: reason });
        showMessage('Request rejected successfully', 'success');
        loadReplenishmentRequests();
    } catch (error) {
        console.error('Failed to reject request:', error);
        showMessage('Failed to reject request: ' + error.message, 'error');
    }
}

async function completeRequest(requestId) {
    if (!confirm('Mark this request as completed?')) return;

    try {
        await completeReplenishmentRequestAPI(requestId);
        showMessage('Request marked as completed', 'success');
        loadReplenishmentRequests();
    } catch (error) {
        console.error('Failed to complete request:', error);
        showMessage('Failed to complete request: ' + error.message, 'error');
    }
}

// Map modal buttons to current request id
function resetRequestModalButton(buttonId, handler) {
    const button = document.getElementById(buttonId);
    if (!button || !button.parentNode) return;
    const freshButton = button.cloneNode(true);
    button.parentNode.replaceChild(freshButton, button);
    freshButton.addEventListener('click', handler);
}

resetRequestModalButton('close-request-detail', () => {
    document.getElementById('request-detail-modal')?.classList.add('hidden');
});
resetRequestModalButton('approve-request', () => {
    const modal = document.getElementById('request-detail-modal');
    const requestId = modal?.dataset.currentRequestId;
    if (requestId) approveRequestById(requestId);
});
resetRequestModalButton('reject-request', () => {
    const modal = document.getElementById('request-detail-modal');
    const requestId = modal?.dataset.currentRequestId;
    if (requestId) rejectRequestById(requestId);
});

// =============================================================================
// Inventory Management
// =============================================================================

async function loadStockOverviewByBranch(branchId = 'all') {
    try {
        const storeId = branchId === 'all' ? null : branchId;
        const inventory = await fetchInventoryByStoreAPI(storeId);

        const tableBody = document.getElementById('stock-branch-table-body');
        const totalCount = document.getElementById('branch-total-count');
        if (!tableBody) return;

        tableBody.innerHTML = '';

        inventory.forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';
            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${escapeHtml(item.sku_id)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(item.book_name)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(item.store_name)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(item.total_quantity)}</td>
                <td class="px-4 py-4 text-sm">${item.last_inbound_date ? escapeHtml(new Date(item.last_inbound_date).toLocaleDateString()) : 'N/A'}</td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs rounded-full ${
                        item.stock_status === 'High' ? 'stock-high' :
                        item.stock_status === 'Medium' ? 'stock-medium' : 'stock-low'
                    }">${escapeHtml(item.stock_status)}</span>
                </td>
            `;
            tableBody.appendChild(row);
        });

        if (totalCount) {
            totalCount.textContent = String(inventory.length);
        }
    } catch (error) {
        console.error('Failed to load inventory by branch:', error);
        showMessage('Failed to load inventory: ' + error.message, 'error');
    }
}

async function loadStockOverviewBySKU() {
    try {
        const [inventory, stores] = await Promise.all([
            fetchInventoryBySKUAPI(),
            fetchStoresAPI()
        ]);

        const tableBody = document.getElementById('stock-sku-table-body');
        if (!tableBody) return;

        const sortedStores = [...stores].sort((a, b) => a.store_id - b.store_id);

        const skuMap = new Map();
        inventory.forEach(item => {
            if (!item.sku_id) return;
            if (!skuMap.has(item.sku_id)) {
                skuMap.set(item.sku_id, {
                    sku_id: item.sku_id,
                    book_name: item.book_name,
                    store_stock: {}
                });
            }
            const entry = skuMap.get(item.sku_id);
            if (item.store_id) {
                entry.store_stock[item.store_id] = item.store_stock;
            }
        });

        tableBody.innerHTML = '';

        Array.from(skuMap.values()).forEach(item => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50';

            const storeCells = sortedStores.map(store => {
                const qty = item.store_stock[store.store_id] || 0;
                return `<td class="px-4 py-4 text-sm">${escapeHtml(qty)}</td>`;
            }).join('');

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${escapeHtml(item.sku_id)}</td>
                <td class="px-4 py-4 text-sm">${escapeHtml(item.book_name)}</td>
                ${storeCells}
            `;
            tableBody.appendChild(row);
        });
    } catch (error) {
        console.error('Failed to load inventory by SKU:', error);
        showMessage('Failed to load inventory: ' + error.message, 'error');
    }
}

// =============================================================================
// Reports
// =============================================================================

async function loadPaymentComparisonTable() {
    try {
        const paymentData = await fetchPaymentAnalysisAPI();

        const container = document.getElementById('payment-method-table');
        if (!container) return;

        const rows = paymentData.map(payment => `
            <tr class="border-b">
                <td class="px-4 py-2">${escapeHtml(payment.payment_method)}</td>
                <td class="px-4 py-2">${escapeHtml(payment.payment_count)}</td>
                <td class="px-4 py-2">${MANAGER_CURRENCY_LABEL} ${parseFloat(payment.total_amount).toFixed(2)}</td>
                <td class="px-4 py-2">${escapeHtml(payment.percentage_of_total)}%</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <table class="min-w-full text-sm">
                <thead>
                    <tr class="bg-gray-50 text-gray-600">
                        <th class="px-4 py-2 text-left">Payment Method</th>
                        <th class="px-4 py-2 text-left">Count</th>
                        <th class="px-4 py-2 text-left">Total</th>
                        <th class="px-4 py-2 text-left">Share</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load payment comparison:', error);
    }
}

async function loadBookCategoryTable() {
    try {
        const categoryData = await fetchSalesByCategoryAPI();

        const container = document.getElementById('book-category-table');
        if (!container) return;

        const rows = categoryData.map(category => `
            <tr class="border-b">
                <td class="px-4 py-2">${escapeHtml(category.category_name)}</td>
                <td class="px-4 py-2">${escapeHtml(category.total_quantity_sold)}</td>
                <td class="px-4 py-2">${MANAGER_CURRENCY_LABEL} ${parseFloat(category.total_sales).toFixed(2)}</td>
                <td class="px-4 py-2">${escapeHtml(category.revenue_percentage)}%</td>
            </tr>
        `).join('');

        container.innerHTML = `
            <table class="min-w-full text-sm">
                <thead>
                    <tr class="bg-gray-50 text-gray-600">
                        <th class="px-4 py-2 text-left">Category</th>
                        <th class="px-4 py-2 text-left">Units Sold</th>
                        <th class="px-4 py-2 text-left">Revenue</th>
                        <th class="px-4 py-2 text-left">Share</th>
                    </tr>
                </thead>
                <tbody>${rows}</tbody>
            </table>
        `;
    } catch (error) {
        console.error('Failed to load category comparison:', error);
    }
}

// =============================================================================
// Utility
// =============================================================================

function showMessage(message, type = 'info') {
    const colors = {
        success: 'bg-green-100 text-green-800',
        error: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800'
    };

    const messageDiv = document.createElement('div');
    messageDiv.className = `fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg ${colors[type]} z-50`;
    messageDiv.textContent = message;

    document.body.appendChild(messageDiv);

    setTimeout(() => {
        messageDiv.remove();
    }, 3000);
}

console.log('Manager API Integration loaded successfully');
