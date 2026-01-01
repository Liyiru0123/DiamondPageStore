/**
 * Manager - Supplier API Integration
 * 供应商管理 API 集成
 */

// =============================================================================
// 加载供应商数据（从 API）
// =============================================================================
async function loadSupplierData() {
    const tableBody = document.getElementById('supplier-table-body');
    if (!tableBody) return;

    showLoading('supplier-table-body');
    try {
        const suppliers = await fetchSuppliersAPI();

        tableBody.innerHTML = '';
        if (typeof renderSupplierResults === 'function') {
            renderSupplierResults(suppliers);
        }

        // ?? originalContent
        delete tableBody.dataset.originalContent;
    } catch (error) {
        console.error('Failed to load supplier data:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center py-4 text-red-600">Failed to load supplier data</td></tr>';
        showMessage('Failed to load supplier data: ' + error.message, 'error');
    } finally {
        hideLoading('supplier-table-body');
    }
}

// =============================================================================
// 添加供应商表格按钮事件监听器（使用事件委托，不使用 cloneNode）
// =============================================================================
function addSupplierActionButtonListeners() {
    const container = document.getElementById('supplier-table-body');
    if (!container) return;

    // 如果已经绑定过事件委托，直接返回
    if (container.dataset.supplierListenersAttached === 'true') return;
    container.dataset.supplierListenersAttached = 'true';

    // 使用事件委托，不需要 cloneNode（cloneNode 会导致 hideLoading 恢复旧内容）
    container.addEventListener('click', async function (e) {
        const button = e.target.closest('button');
        if (!button) return;

        const row = button.closest('tr');
        if (!row) return;
        const supplierId = row.dataset.supplierId;

        if (button.classList.contains('edit-supplier-btn')) {
            e.preventDefault();
            e.stopPropagation();
            await openEditSupplierModalAPI(supplierId);
        } else if (button.classList.contains('view-supplier-btn')) {
            e.preventDefault();
            e.stopPropagation();
            await viewSupplierDetailsAPI(supplierId);
        } else if (button.classList.contains('delete-supplier-btn')) {
            e.preventDefault();
            e.stopPropagation();
            await handleDeleteSupplier(supplierId);
        }
    });
}

// =============================================================================
// 打开编辑供应商模态框（从 API 加载数据）
// =============================================================================
async function openEditSupplierModalAPI(supplierId) {
    try {
        const response = await managerApiRequest(
            `${MANAGER_API_CONFIG.endpoints.suppliers.detail}&supplier_id=${supplierId}`
        );
        const supplier = response.data;

        const modal = document.getElementById('edit-supplier-modal');

        // 填充表单数据
        document.getElementById('edit-supplier-id').value = supplier.supplier_id;
        document.getElementById('edit-supplier-name').value = supplier.supplier_name || '';
        document.getElementById('edit-supplier-phone').value = supplier.phone || '';
        document.getElementById('edit-supplier-email').value = supplier.email || '';
        document.getElementById('edit-supplier-address').value = supplier.address || '';

        modal.classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load supplier data:', error);
        alert('加载供应商详情失败: ' + error.message);
    }
}

// =============================================================================
// 查看供应商详情（从 API）
// =============================================================================
async function viewSupplierDetailsAPI(supplierId) {
    try {
        const response = await managerApiRequest(
            `${MANAGER_API_CONFIG.endpoints.suppliers.detail}&supplier_id=${supplierId}`
        );
        const supplier = response.data;

        const lines = [
            `Supplier ID: ${supplier.supplier_id}`,
            `Name: ${supplier.supplier_name}`,
            `Phone: ${supplier.phone || 'N/A'}`,
            `Email: ${supplier.email || 'N/A'}`,
            `Address: ${supplier.address || 'N/A'}`,
            `Total Purchases: ${supplier.total_purchases ?? 0}`,
            `Stores Served: ${supplier.stores_served ?? 0}`,
            `Last Purchase: ${supplier.last_purchase_date ? new Date(supplier.last_purchase_date).toLocaleDateString() : 'N/A'}`,
            `Total Items Supplied: ${supplier.total_items_supplied ?? 0}`,
            `Total Purchase Value: ${MANAGER_CURRENCY_LABEL} ${parseFloat(supplier.total_purchase_value || 0).toFixed(2)}`
        ];

        alert(lines.join('\n'));
    } catch (error) {
        console.error('Failed to view supplier details:', error);
        alert('Failed to load supplier details: ' + error.message);
    }
}

// =============================================================================
// 删除供应商处理函数
// =============================================================================
async function handleDeleteSupplier(supplierId) {
    if (!confirm('Are you sure you want to delete this supplier? Suppliers with related purchases cannot be deleted.')) {
        return;
    }

    try {
        await deleteSupplierAPI(supplierId);
        showMessage('Supplier deleted successfully', 'success');
        loadSupplierData();
    } catch (error) {
        const message = String(error && error.message ? error.message : '');
        if (message.includes('associated purchase orders')) {
            showMessage('Supplier has associated orders/purchases and cannot be deleted.', 'info');
            return;
        }
        console.error('Failed to delete supplier:', error);
        showMessage('Failed to delete supplier: ' + message, 'error');
    }
}

// =============================================================================
// 添加新供应商（调用 API）
// =============================================================================

/**
 * 显示添加供应商模态框内的错误消息
 */
function showAddSupplierError(message) {
    const errorDiv = document.getElementById('add-supplier-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}

/**
 * 隐藏添加供应商模态框内的错误消息
 */
function hideAddSupplierError() {
    const errorDiv = document.getElementById('add-supplier-error');
    if (errorDiv) {
        errorDiv.textContent = '';
        errorDiv.classList.add('hidden');
    }
}

async function addNewSupplier() {
    // 先隐藏之前的错误消息
    hideAddSupplierError();

    try {
        const formData = {
            name: document.getElementById('supplier-name').value.trim(),
            phone: document.getElementById('supplier-phone').value.trim(),
            email: document.getElementById('supplier-email').value.trim(),
            address: document.getElementById('supplier-address').value.trim()
        };

        if (!formData.name || !formData.phone) {
            showAddSupplierError('Please fill in all required fields (name and phone)');
            return;
        }

        const payload = {
            name: formData.name,
            phone: formData.phone,
            email: formData.email || null,
            address: formData.address || null
        };

        if (typeof addSupplierAPI !== 'function') {
            showAddSupplierError('Add supplier API is not available.');
            return;
        }

        await addSupplierAPI(payload);

        // 成功后刷新表格
        try {
            if (typeof loadSupplierData === 'function') {
                loadSupplierData();
            }
        } catch (uiError) {
            console.warn('Failed to refresh supplier table:', uiError);
        }

        // 关闭模态框
        if (typeof closeAddSupplierModal === 'function') {
            closeAddSupplierModal();
        } else {
            const modal = document.getElementById('add-supplier-modal');
            if (modal) modal.classList.add('hidden');
        }

        // 显示成功消息
        if (typeof showMessage === 'function') {
            showMessage(`Supplier "${formData.name}" added successfully!`, 'success');
        }

        // 重置表单和错误消息
        const form = document.getElementById('add-supplier-form');
        if (form) form.reset();
        hideAddSupplierError();
    } catch (error) {
        console.error('Error adding supplier:', error);
        // 在模态框内显示错误消息，不关闭模态框
        const errorMsg = error.message || 'Unknown error';
        showAddSupplierError(errorMsg);
    }
}

async function updateSupplier() {
    try {
        const formData = {
            supplier_id: parseInt(document.getElementById('edit-supplier-id').value),
            name: document.getElementById('edit-supplier-name').value.trim(),
            phone: document.getElementById('edit-supplier-phone').value.trim(),
            email: document.getElementById('edit-supplier-email').value.trim(),
            address: document.getElementById('edit-supplier-address').value.trim()
        };

        // 调用 API 更新供应商
        if (typeof updateSupplierAPI === 'function') {
            await updateSupplierAPI(formData);

            // 更新表格显示
            loadSupplierData();

            // 关闭模态框
            closeEditSupplierModal();

            // 显示成功消息
            showMessage(`供应商 "${formData.name}" 更新成功！`, 'success');
        } else {
            alert('更新供应商 API 不可用');
        }

    } catch (error) {
        console.error('Error updating supplier:', error);
        alert('更新供应商失败: ' + (error.message || '请重试'));
    }
}

// =============================================================================
// 供应商搜索（本地过滤）
// =============================================================================
function renderSupplierResults(suppliers) {
    const tableBody = document.getElementById('supplier-table-body');
    if (!tableBody) return;

    tableBody.innerHTML = '';

    if (!suppliers || suppliers.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="px-4 py-8 text-center text-gray-500">No suppliers found.</td>
            </tr>
        `;
        updateSupplierCount(0);
        return;
    }

    suppliers.forEach(supplier => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.supplierId = supplier.supplier_id;
        row.dataset.supplierName = String(supplier.supplier_name || '').toLowerCase();
        row.dataset.supplierPhone = supplier.phone || '';
        row.dataset.supplierAddress = String(supplier.address || '').toLowerCase();

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium text-gray-900">${escapeHtml(supplier.supplier_id)}</td>
            <td class="px-4 py-4 text-sm text-gray-900">${escapeHtml(supplier.supplier_name)}</td>
            <td class="px-4 py-4 text-sm text-gray-700">${escapeHtml(supplier.phone)}</td>
            <td class="px-4 py-4 text-sm text-gray-700 max-w-xs truncate" title="${escapeHtml(supplier.address || 'N/A')}">${escapeHtml(supplier.address || 'N/A')}</td>
            <td class="px-4 py-4 text-sm text-gray-700 w-56 max-w-xs">
                <div class="min-w-0 truncate" title="${escapeHtml(supplier.email || 'N/A')}">
                    ${escapeHtml(supplier.email || 'N/A')}
                </div>
            </td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 edit-supplier-btn" title="Edit">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 view-supplier-btn" title="View Details">
                        <i class="fa fa-eye"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800 delete-supplier-btn" title="Delete">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        tableBody.appendChild(row);
    });

    updateSupplierCount(suppliers.length);
    addSupplierActionButtonListeners();

}

function updateSupplierCount(count) {
    const supplierCountElement = document.getElementById('supplier-count');
    if (supplierCountElement) {
        supplierCountElement.textContent = String(count);
    }
}

function performSupplierSearch(searchTerm) {
    if (!searchTerm || searchTerm.trim() === '') {
        loadSupplierData();
        return;
    }

    showLoading('supplier-table-body');
    searchSuppliersAPI(searchTerm)
        .then(renderSupplierResults)
        .catch(error => {
            console.error('Failed to search suppliers:', error);
            showMessage('Failed to search suppliers: ' + error.message, 'error');
        })
        .finally(() => hideLoading('supplier-table-body'));
}

// =============================================================================
// 覆盖 window 函数（确保使用 API 版本）
// =============================================================================
window.loadSupplierData = loadSupplierData;
window.addNewSupplier = addNewSupplier;
window.updateSupplier = updateSupplier;
window.performSupplierSearch = performSupplierSearch;

// =============================================================================
// 供应商模态框事件监听器初始化
// =============================================================================

/**
 * 初始化供应商模态框相关事件监听器
 * 使用 cloneNode 技术避免重复绑定
 */
function setupSupplierModalListeners() {
    // Add Supplier 按钮 - 打开模态框
    const addSupplierBtn = document.getElementById('add-supplier-btn');
    if (addSupplierBtn && !addSupplierBtn.dataset.listenerAttached) {
        addSupplierBtn.dataset.listenerAttached = 'true';
        addSupplierBtn.addEventListener('click', () => {
            const modal = document.getElementById('add-supplier-modal');
            const form = document.getElementById('add-supplier-form');
            if (modal) modal.classList.remove('hidden');
            if (form) form.reset();
            // 清除之前的错误消息
            hideAddSupplierError();
        });
    }

    // Add Supplier 表单提交
    const addSupplierForm = document.getElementById('add-supplier-form');
    if (addSupplierForm && !addSupplierForm.dataset.listenerAttached) {
        addSupplierForm.dataset.listenerAttached = 'true';
        addSupplierForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof window.addNewSupplier === 'function') {
                window.addNewSupplier();
            }
        });
    }

    // Cancel Add Supplier 按钮
    const cancelAddBtn = document.getElementById('cancel-add-supplier');
    if (cancelAddBtn && !cancelAddBtn.dataset.listenerAttached) {
        cancelAddBtn.dataset.listenerAttached = 'true';
        cancelAddBtn.addEventListener('click', () => {
            const modal = document.getElementById('add-supplier-modal');
            if (modal) modal.classList.add('hidden');
        });
    }

    // Edit Supplier 表单提交
    const editSupplierForm = document.getElementById('edit-supplier-form');
    if (editSupplierForm && !editSupplierForm.dataset.listenerAttached) {
        editSupplierForm.dataset.listenerAttached = 'true';
        editSupplierForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (typeof window.updateSupplier === 'function') {
                window.updateSupplier();
            }
        });
    }

    // Cancel Edit Supplier 按钮
    const cancelEditBtn = document.getElementById('cancel-edit-supplier');
    if (cancelEditBtn && !cancelEditBtn.dataset.listenerAttached) {
        cancelEditBtn.dataset.listenerAttached = 'true';
        cancelEditBtn.addEventListener('click', () => {
            const modal = document.getElementById('edit-supplier-modal');
            if (modal) modal.classList.add('hidden');
        });
    }
}

// 页面加载完成后初始化供应商模态框事件监听器
document.addEventListener('DOMContentLoaded', () => {
    setupSupplierModalListeners();
});

// 如果 DOM 已经加载完成，立即初始化
if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setupSupplierModalListeners();
}

console.log('Manager Supplier API loaded successfully');
