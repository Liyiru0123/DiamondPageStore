// Manager Dashboard JavaScript

// 全局变量存储当前管理员信息
let currentManager = {
    user_id: null,
    full_name: '',
    email: '',
    phone: '',
    store_name: '',
    role: 'manager'
};

/**
 * 初始化管理员会话
 */
async function initManagerSession() {
    try {
        const response = await fetch('../api/manager/get_current_manager.php');
        const result = await response.json();

        if (result.success) {
            // 成功获取管理员信息
            currentManager = result.data;
            
            updateUserAvatar(currentManager, 'manager');

        } else {
            // Session 过期或无效
            console.warn("Session expired or invalid:", result.message);

            // 1. 清除前端残留的"假"登录状态
            localStorage.removeItem('auth_token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('user_role');

            // 2. 强制跳回登录页
            alert("Session expired. Please login again.");
            window.location.href = (window.buildPagePath ? window.buildPagePath('login.html') : 'login.html');
        }
    } catch (error) {
        console.error('Manager Session Init Failed:', error);
    }
}

/**
 * Manager 系统页面切换函数 (供layout.js调用)
 * 修改：添加布局修复逻辑
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
        if (typeof loadReplenishmentRequests === 'function') {
            loadReplenishmentRequests();
        }
        if (typeof loadStockOverviewByBranch === 'function') {
            loadStockOverviewByBranch('all');
        }
        if (typeof loadStockOverviewBySKU === 'function') {
            loadStockOverviewBySKU();
        }
        initInventoryTabs();
        initRequestFilters();
        // 初始化分支库存搜索
        initBranchStockSearch();
    } else if (pageId === 'staff') {
        // 使用 API 版本的函数
        if (typeof loadStaffData === 'function') {
            loadStaffData();
        }
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

                // 加载定价数据 - 使用 API 版本
                if (typeof loadPricingData === 'function') {
                    loadPricingData();
                }
            }
        }, 100);
    } else if (pageId === 'notifications') {
        // 使用 API 版本的函数
        if (typeof loadNotifications === 'function') {
            loadNotifications();
        }
    } else if (pageId === 'user-management') {
        // 使用 API 版本的函数
        if (typeof loadUserManagementData === 'function') {
            loadUserManagementData();
        }
    } else if (pageId === 'overview') {
        // 确保图表和表格已初始化 
        if (typeof initCharts === 'function') {
            setTimeout(initCharts, 100);
        }
        // 表格加载
        if (typeof loadPaymentComparisonTable === 'function') {
            setTimeout(loadPaymentComparisonTable, 150);
        }
        if (typeof loadBookCategoryTable === 'function') {
            setTimeout(loadBookCategoryTable, 200);
        }
        // 加载汇总统计卡片
        if (typeof loadSummaryStatistics === 'function') {
            setTimeout(loadSummaryStatistics, 250);
        }
    } else if (pageId === 'supplier-management') {
        // Prefer API-backed supplier loader when available.
        if (typeof window.loadSupplierData === 'function') {
            window.loadSupplierData();
        } else if (typeof loadSupplierData === 'function') {
            loadSupplierData();
        }
    }


    setTimeout(() => {
        const mainContent = document.querySelector('main');
        if (mainContent) {
            const header = document.querySelector('#layout-header');
            const headerHeight = header ? header.offsetHeight : 64;
            mainContent.style.minHeight = `calc(100vh - ${headerHeight}px)`;
        }

        document.querySelectorAll('.overflow-x-auto').forEach(container => {
            if (container.closest('.card')) {
                container.style.maxWidth = '100%';
                container.style.overflowX = 'auto';
            }
        });

        // 触发浏览器重排
        if (targetPage) {
            targetPage.style.display = 'none';
            targetPage.offsetHeight;
            targetPage.style.display = '';
        }

        // 确保滚动条正确显示
        window.scrollTo(0, 0);
    }, 150);
};

document.addEventListener('DOMContentLoaded', function () {

    // Initialize date display
    initDateDisplay();

    // Initialize charts
    if (typeof initCharts === 'function') {
        initCharts();
    }

    // 使用 API 版本的表格加载函数
    if (typeof loadPaymentComparisonTable === 'function') {
        setTimeout(loadPaymentComparisonTable, 150);
    }
    if (typeof loadBookCategoryTable === 'function') {
        setTimeout(loadBookCategoryTable, 200);
    }

    // 加载汇总统计卡片
    if (typeof loadSummaryStatistics === 'function') {
        setTimeout(loadSummaryStatistics, 250);
    }

    // Initialize event listeners
    initEventListeners();

    // 初始布局修复
    setTimeout(() => {
        fixLayoutAfterDataLoad();
    }, 300);
});

// Initialize date display
function initDateDisplay() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateElem = document.getElementById('current-date');
    if (dateElem) dateElem.textContent = now.toLocaleDateString('en-US', options);
}

// 保留基本的工具函数
function formatDate(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

// 分支库存搜索功能
function initBranchStockSearch() {
    const searchInput = document.getElementById('branch-stock-search');
    if (searchInput) {
        // 使用防抖功能
        const debouncedSearch = debounce(function (e) {
            const searchTerm = e.target.value.trim();
            performBranchStockSearch(searchTerm);
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    }
}

// 执行分支库存搜索
function performBranchStockSearch(searchTerm) {
    const tableBody = document.getElementById('stock-branch-table-body');
    if (!tableBody) return;

    // 获取当前选中的分店
    const branchFilter = document.getElementById('branch-stock-filter');
    const selectedBranch = branchFilter ? branchFilter.value : 'all';

    // 获取所有行
    const rows = tableBody.querySelectorAll('tr');

    if (!searchTerm) {
        // 显示所有行
        rows.forEach(row => {
            row.style.display = '';
        });
        // 更新计数
        updateStockSearchCount(rows.length);
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    let visibleCount = 0;

    rows.forEach(row => {
        // 获取行的数据
        const skuCell = row.cells[0];
        const titleCell = row.cells[1];

        if (!skuCell || !titleCell) {
            row.style.display = 'none';
            return;
        }

        const sku = skuCell.textContent.toLowerCase();
        const title = titleCell.textContent.toLowerCase();

        if (sku.includes(searchLower) || title.includes(searchLower)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    // 更新计数
    updateStockSearchCount(visibleCount);
}

// 更新搜索结果显示数量
function updateStockSearchCount(count) {
    const branchStockCount = document.getElementById('branch-stock-count');
    if (branchStockCount) {
        branchStockCount.textContent = count;
    }
}

// Initialize event listeners
function initEventListeners() {

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

    // 添加员工按钮事件
    document.querySelector('button:has(i.fa-plus)')?.addEventListener('click', () => {
        openAddStaffModal();
    });

    // 添加员工表单提交
    document.getElementById('add-staff-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addNewStaff();
    });

    // 取消添加员工
    document.getElementById('cancel-add-staff')?.addEventListener('click', () => {
        closeAddStaffModal();
    });

    // 账号类型变化事件
    document.getElementById('account-type')?.addEventListener('change', (e) => {
        toggleStoreIdField(e.target.value);
    });

    // 取消编辑员工
    document.getElementById('cancel-edit-staff')?.addEventListener('click', () => {
        closeEditStaffModal();
    });

    // 编辑员工表单提交
    document.getElementById('edit-staff-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        updateStaff();
    });

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
        if (typeof sendNotification === 'function') {
            sendNotification();
        }
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

    // 供应商按钮事件
    document.getElementById('add-supplier-btn')?.addEventListener('click', () => {
        openAddSupplierModal();
    });

    // 供应商表单提交
    document.getElementById('add-supplier-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (typeof window.addNewSupplier === 'function') {
            window.addNewSupplier();
        }
    });

    // 取消添加供应商
    document.getElementById('cancel-add-supplier')?.addEventListener('click', () => {
        closeAddSupplierModal();
    });

    // 取消编辑供应商
    document.getElementById('cancel-edit-supplier')?.addEventListener('click', () => {
        closeEditSupplierModal();
    });

    // 编辑供应商表单提交
    document.getElementById('edit-supplier-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        if (typeof window.updateSupplier === 'function') {
            window.updateSupplier();
        }
    });

    // 供应商搜索框
    const supplierSearch = document.getElementById('supplier-search-input');
    if (supplierSearch) {
        const debouncedSearch = debounce(function (e) {
            const searchTerm = e.target.value;
            if (typeof performSupplierSearch === 'function') {
                performSupplierSearch(searchTerm);
            }
        }, 300);

        supplierSearch.addEventListener('input', debouncedSearch);
    }
    // 初始化搜索框
    initSearchBoxes();

    // 用户管理搜索
    const userSearch = document.querySelector('#user-management-page input[placeholder*="Search users"]');
    if (userSearch) {
        const debouncedSearch = debounce(function (e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                if (typeof performUserSearch === 'function') {
                    performUserSearch(searchTerm);
                }
            }
        }, 300);

        userSearch.addEventListener('input', debouncedSearch);
    }

    // 库存管理相关事件监听器
    initInventoryEventListeners();

    // 窗口大小改变时修复布局
    window.addEventListener('resize', debounce(() => {
        fixLayoutAfterDataLoad();
    }, 250));

    // 使用事件委托处理员工表格的点击
    document.getElementById('staff-table-body')?.addEventListener('click', function (e) {
        const target = e.target;
        const button = target.closest('button');

        if (!button) return;

        const row = button.closest('tr');

        if (button.classList.contains('edit-staff-btn') || button.classList.contains('edit-staff')) {
            const staffData = {
                id: row.dataset.staffId || row.dataset.employeeId,
                employeeID: row.dataset.employeeid || row.cells[0]?.textContent,
                userID: row.dataset.userid || row.cells[1]?.textContent,
                branchName: row.dataset.branchname || row.cells[2]?.textContent,
                name: row.dataset.name || row.cells[3]?.textContent,
                position: row.dataset.position || 'staff',
                email: row.dataset.email || row.cells[5]?.textContent,
                storeID: row.dataset.storeId || ''
            };
            openEditStaffModal(staffData);
        }
    });
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

// 书籍/定价搜索

// 初始化搜索框
function initSearchBoxes() {
    // 员工搜索
    const staffSearch = document.querySelector('#staff-page input[placeholder*="Search staff"]');
    if (staffSearch) {
        const debouncedSearch = debounce(function (e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                if (typeof performStaffSearch === 'function') {
                    performStaffSearch(searchTerm);
                }
            }
        }, 300);

        staffSearch.addEventListener('input', debouncedSearch);
    }
}

// 库存/员工搜索

// ============================================
// 员工管理相关函数（UI交互部分）
// ============================================

// Apply filters
function applyFilters() {
    const branchFilter = document.getElementById('branch-filter').value;
    const positionFilter = document.getElementById('position-filter').value;

    // 从原始数据缓存中获取完整数据
    if (!window.originalDataCache || !window.originalDataCache.staff || window.originalDataCache.staff.length === 0) {
        console.warn('Original staff data cache not available');
        return;
    }

    const allStaff = window.originalDataCache.staff;

    // 根据筛选条件过滤数据
    const filteredStaff = allStaff.filter(employee => {
        const branchMatch = branchFilter === 'all' || String(employee.store_id) === branchFilter;

        let positionMatch = positionFilter === 'all';
        if (!positionMatch && employee.job_title) {
            const jobTitleLower = employee.job_title.toLowerCase();
            if (positionFilter === 'manager' && jobTitleLower.includes('manager')) {
                positionMatch = true;
            } else if (positionFilter === 'finance' && jobTitleLower.includes('finance')) {
                positionMatch = true;
            } else if (positionFilter === 'staff' && !jobTitleLower.includes('manager') && !jobTitleLower.includes('finance')) {
                positionMatch = true;
            }
        }

        return branchMatch && positionMatch;
    });

    // 使用过滤后的数据重新渲染表格，传递 isFiltered=true 参数
    if (typeof renderStaffTable === 'function') {
        renderStaffTable(filteredStaff, true);
    }

    // 添加布局修复
    fixLayoutAfterFilter();
}

// Reset filters
function resetFilters() {
    document.getElementById('branch-filter').value = 'all';
    document.getElementById('position-filter').value = 'all';

    // 从原始数据缓存中获取完整数据并重新渲染
    if (window.originalDataCache && window.originalDataCache.staff && window.originalDataCache.staff.length > 0) {
        if (typeof renderStaffTable === 'function') {
            // 传递 isFiltered=false 表示这是完整数据
            renderStaffTable(window.originalDataCache.staff, false);
        }
    } else {
        // 如果缓存不可用，重新加载数据
        if (typeof loadStaffData === 'function') {
            loadStaffData();
        }
    }

    // 添加布局修复
    fixLayoutAfterFilter();
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

// 打开添加员工模态框
function openAddStaffModal() {
    document.getElementById('add-staff-modal').classList.remove('hidden');
    // 重置表单
    document.getElementById('add-staff-form').reset();
}

// 关闭添加员工模态框
function closeAddStaffModal() {
    document.getElementById('add-staff-modal').classList.add('hidden');
}

// 根据账号类型切换 Store ID 字段
function toggleStoreIdField(accountType) {
    const storeIdContainer = document.getElementById('store-id-container');
    const storeIdSelect = document.getElementById('store-id');
    if (!storeIdContainer || !storeIdSelect) return;

    if (accountType === 'staff' || accountType === 'finance') {
        storeIdContainer.classList.remove('hidden');
        storeIdSelect.required = true;
    } else {
        storeIdContainer.classList.add('hidden');
        storeIdSelect.required = false;
        storeIdSelect.value = '';
    }
}

// 添加新员工
async function addNewStaff() {
    let createdUserId = null;
    try {
        const formData = {
            username: document.getElementById('staff-username').value.trim(),
            password: document.getElementById('staff-password').value,
            firstName: document.getElementById('staff-first-name').value.trim(),
            lastName: document.getElementById('staff-last-name').value.trim(),
            email: document.getElementById('staff-email').value.trim(),
            storeID: document.getElementById('store-id').value,
            jobTitleID: document.getElementById('job-title-id').value,
            performance: document.getElementById('staff-performance').value.trim()
        };

        if (!formData.username || !formData.password || !formData.firstName || !formData.lastName ||
            !formData.email || !formData.storeID || !formData.jobTitleID) {
            alert('Please fill in all required fields');
            return;
        }

        const normalizedUsername = formData.username.toLowerCase().trim();

        // 验证用户名格式：emp + 3位数字
        if (!/^emp\d{3}$/.test(normalizedUsername)) {
            alert('Username must be in format emp001');
            return;
        }

        // 从 username 中提取 employee_id（emp001 -> 1）
        const employeeIdFromUsername = parseInt(normalizedUsername.replace('emp', ''), 10);

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            alert('Please enter a valid email address (example: name@example.com).');
            return;
        }

        let performanceValue = null;
        if (formData.performance !== '') {
            const perfNum = Number(formData.performance);
            if (Number.isNaN(perfNum) || perfNum < 0 || perfNum > 100) {
                alert('Performance must be between 0 and 100');
                return;
            }
            performanceValue = perfNum;
        }

        if (typeof addEmployeeUserAPI !== 'function') {
            alert('Add user API is not available. Please ensure manager-api.js is loaded.');
            return;
        }

        const userResponse = await addEmployeeUserAPI({
            username: normalizedUsername,
            password: formData.password
        });
        createdUserId = userResponse.data.user_id;

        const employeeData = {
            employee_id: employeeIdFromUsername,  // 使用从 username 提取的 ID
            user_id: parseInt(createdUserId, 10),
            first_name: formData.firstName,
            last_name: formData.lastName,
            store_id: parseInt(formData.storeID, 10),
            job_title_id: parseInt(formData.jobTitleID, 10),
            email: formData.email,
            performance: performanceValue
        };

        await addEmployeeAPI(employeeData);

        if (typeof loadStaffData === 'function') {
            loadStaffData();
        }

        closeAddStaffModal();
        document.getElementById('add-staff-form').reset();

        // 使用 showMessage 显示成功提示
        if (typeof showMessage === 'function') {
            showMessage(`Staff "${formData.firstName} ${formData.lastName}" added successfully!`, 'success');
        } else {
            alert(`Staff member "${formData.firstName} ${formData.lastName}" has been added successfully!`);
        }
    } catch (error) {
        if (createdUserId && typeof deleteUserAPI === 'function') {
            try {
                await deleteUserAPI(createdUserId);
            } catch (cleanupError) {
                console.error('Failed to rollback user creation:', cleanupError);
            }
        }
        console.error('Error adding staff:', error);

        // 使用 showMessage 显示错误提示
        const errorMsg = error.message || 'Please try again';
        if (typeof showMessage === 'function') {
            showMessage(errorMsg, 'error');
        } else {
            alert('Failed to add staff: ' + errorMsg);
        }
    }
}
function openEditStaffModal(staffData) {
    const modal = document.getElementById('edit-staff-modal');

    // 填充表单数据
    document.getElementById('edit-staff-id').value = staffData.id;
    document.getElementById('edit-original-employee-id').value = staffData.employeeID;
    document.getElementById('edit-employee-id').value = staffData.employeeID;
    document.getElementById('edit-staff-user-id').value = staffData.userID;
    document.getElementById('edit-branch').value = staffData.branchName;
    document.getElementById('edit-name').value = staffData.name;
    document.getElementById('edit-position').value = staffData.position;
    document.getElementById('edit-email').value = staffData.email;

    modal.classList.remove('hidden');
}

// 关闭编辑员工模态框
function closeEditStaffModal() {
    document.getElementById('edit-staff-modal').classList.add('hidden');
    document.getElementById('edit-staff-form').reset();
}

// 更新员工信息
async function updateStaff() {
    try {
        const formData = {
            employeeID: document.getElementById('edit-employee-id').value.trim(),
            userID: document.getElementById('edit-staff-user-id').value.trim(),
            branchName: document.getElementById('edit-branch').value,
            name: document.getElementById('edit-name').value.trim(),
            position: document.getElementById('edit-position').value,
            email: document.getElementById('edit-email').value.trim()
        };

        if (!formData.employeeID || !formData.userID || !formData.branchName ||
            !formData.name || !formData.position || !formData.email) {
            alert('Please fill in all required fields');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            alert('Please enter a valid email address (example: name@example.com).');
            return;
        }

        const branchMap = {
            'Downtown Store': 1,
            'University Store': 2,
            'Community Store': 3,
            'Suburban Store': 4,
            'Airport Store': 5
        };
        const storeId = branchMap[formData.branchName];
        if (!storeId) {
            alert('Please select a valid branch');
            return;
        }

        const positionMap = {
            'staff': 1,
            'finance': 2,
            'manager': 3,
            'head office': 4
        };
        const jobTitleId = positionMap[String(formData.position || '').toLowerCase()];
        if (!jobTitleId) {
            alert('Please select a valid position');
            return;
        }

        const nameParts = formData.name.split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : nameParts[0];

        const employeeData = {
            employee_id: parseInt(formData.employeeID, 10),
            user_id: parseInt(formData.userID, 10),
            first_name: firstName,
            last_name: lastName,
            store_id: storeId,
            job_title_id: jobTitleId,
            email: formData.email,
            performance: null
        };

        if (typeof updateEmployeeAPI === 'function') {
            await updateEmployeeAPI(employeeData);
            if (typeof loadStaffData === 'function') {
                loadStaffData();
            }
            closeEditStaffModal();
            alert(`Staff member "${formData.name}" has been updated successfully!`);
        } else {
            alert('Update employee API is not available.');
        }

    } catch (error) {
        console.error('Error updating staff:', error);
        alert('Failed to update staff. Please try again.');
    }
}

// ============================================
// 定价管理相关函数（UI交互部分）
// ============================================

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

// ============================================
// 库存管理相关函数（保留UI交互部分）
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

            // 加载库存总览数据 - 使用 API 版本
            if (typeof loadStockOverviewByBranch === 'function') {
                loadStockOverviewByBranch('all');
            }
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

            // 加载定价数据 - 使用 API 版本
            if (typeof loadPricingData === 'function') {
                loadPricingData();
            }
        });
    }

    // 初始化分支库存搜索
    initBranchStockSearch();

    // 初始化库存总览的视图选项
    const viewOptions = document.querySelectorAll('input[name="view-option"]');
    const stockByBranch = document.getElementById('stock-by-branch');
    const stockBySKU = document.getElementById('stock-by-sku');
    const branchFilterContainer = document.getElementById('branch-filter-container');

    if (viewOptions.length > 0) {
        viewOptions.forEach(option => {
            option.addEventListener('change', function () {
                if (this.value === 'by-branch') {
                    if (stockByBranch) stockByBranch.classList.remove('hidden');
                    if (stockBySKU) stockBySKU.classList.add('hidden');
                    if (branchFilterContainer) branchFilterContainer.classList.remove('hidden');
                    // 加载默认的分店数据 - 使用 API 版本
                    if (typeof loadStockOverviewByBranch === 'function') {
                        loadStockOverviewByBranch('all');
                    }
                } else {
                    if (stockByBranch) stockByBranch.classList.add('hidden');
                    if (stockBySKU) stockBySKU.classList.remove('hidden');
                    if (branchFilterContainer) branchFilterContainer.classList.add('hidden');
                    // 使用 API 版本
                    if (typeof loadStockOverviewBySKU === 'function') {
                        loadStockOverviewBySKU();
                    }
                }
            });
        });
    }

    // 初始化分店筛选
    const branchStockFilter = document.getElementById('branch-stock-filter');
    if (branchStockFilter) {
        branchStockFilter.addEventListener('change', function () {
            const selectedBranch = this.value;
            // 使用 API 版本
            if (typeof loadStockOverviewByBranch === 'function') {
                loadStockOverviewByBranch(selectedBranch);
            }
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

// 应用请求筛选器
function applyRequestFilters() {
    if (typeof loadReplenishmentRequests === 'function') {
        loadReplenishmentRequests();
    }
}

// 重置请求筛选器
function resetRequestFilters() {
    const filters = [
        'request-branch-filter',
        'request-status-filter',
        'request-date-from',
        'request-date-to',
        'request-urgency-filter'
    ];

    filters.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            if (element.tagName === 'SELECT') {
                element.value = 'all';
            } else if (element.tagName === 'INPUT') {
                element.value = '';
            }
        }
    });

    if (typeof loadReplenishmentRequests === 'function') {
        loadReplenishmentRequests();
    }
}

// 初始化库存管理事件监听器
function initInventoryEventListeners() {
    // 关闭请求详情模态框
    document.getElementById('close-request-detail')?.addEventListener('click', () => {
        document.getElementById('request-detail-modal').classList.add('hidden');
    });

    // 批准请求 - 使用 API 版本
    document.getElementById('approve-request')?.addEventListener('click', function () {
        const modal = document.getElementById('request-detail-modal');
        const requestId = modal?.dataset.currentRequestId;
        if (requestId && typeof approveRequestById === 'function') {
            approveRequestById(requestId);
        }
    });

    // 拒绝请求 - 使用 API 版本
    document.getElementById('reject-request')?.addEventListener('click', function () {
        const modal = document.getElementById('request-detail-modal');
        const requestId = modal?.dataset.currentRequestId;
        if (requestId && typeof rejectRequestById === 'function') {
            rejectRequestById(requestId);
        }
    });

    // SKU搜索
    const skuSearchInput = document.getElementById('sku-search-input');
    if (skuSearchInput) {
        skuSearchInput.addEventListener('input', function () {
            performSKUSearch(this.value);
        });
    }
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



// 供应商数据与搜索

// 打开添加供应商模态框
function openAddSupplierModal() {
    document.getElementById('add-supplier-modal').classList.remove('hidden');
    document.getElementById('add-supplier-form').reset();
}

// 关闭添加供应商模态框
function closeAddSupplierModal() {
    document.getElementById('add-supplier-modal').classList.add('hidden');
}

// 打开编辑供应商模态框
function openEditSupplierModal(supplier) {
    const modal = document.getElementById('edit-supplier-modal');

    document.getElementById('edit-supplier-original-id').value = supplier.id;
    document.getElementById('edit-supplier-id').value = supplier.supplierID;
    document.getElementById('edit-supplier-name').value = supplier.name;
    document.getElementById('edit-supplier-phone').value = supplier.phone;
    document.getElementById('edit-supplier-address').value = supplier.address;
    document.getElementById('edit-supplier-email').value = supplier.email;

    modal.classList.remove('hidden');
}

// 关闭编辑供应商模态框
function closeEditSupplierModal() {
    document.getElementById('edit-supplier-modal').classList.add('hidden');
    document.getElementById('edit-supplier-form').reset();
}


// 布局修复辅助函数
function fixLayoutAfterFilter() {
    setTimeout(() => {
        // 修复表格容器
        const tables = document.querySelectorAll('.overflow-x-auto');
        tables.forEach(table => {
            table.style.overflowX = 'auto';
            table.style.maxWidth = '100%';
        });

        // 触发重排
        const mainContent = document.querySelector('main');
        if (mainContent) {
            mainContent.style.display = 'none';
            mainContent.offsetHeight;
            mainContent.style.display = '';
        }
    }, 50);
}

function fixLayoutAfterDataLoad() {
    setTimeout(() => {
        // 修复主内容区域高度
        const mainContent = document.querySelector('main');
        if (mainContent) {
            const header = document.querySelector('#layout-header');
            const headerHeight = header ? header.offsetHeight : 64;
            mainContent.style.minHeight = `calc(100vh - ${headerHeight}px)`;
        }

        // 修复表格宽度
        const tables = document.querySelectorAll('table');
        tables.forEach(table => {
            if (table.closest('.card')) {
                table.style.width = '100%';
                table.style.tableLayout = 'fixed';
            }
        });

        // 确保卡片内边距正确
        document.querySelectorAll('.card .overflow-x-auto').forEach(container => {
            container.style.margin = '-0.5rem';
            container.style.padding = '0.5rem';
        });

        // 滚动到顶部
        window.scrollTo(0, 0);
    }, 100);
}

function addInventoryActionButtonListeners() {
    console.log('Inventory action button listeners initialized');
}

document.addEventListener('DOMContentLoaded', function () {
    // 确保库存管理相关事件监听器已初始化
    initInventoryEventListeners();
});
