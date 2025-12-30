// Manager Dashboard JavaScript - 与layout.js整合版

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
        // 这些函数现在由 manager-api-integration.js 提供
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
        // 确保图表和表格已初始化 - 使用 API 版本
        if (typeof initCharts === 'function') {
            setTimeout(initCharts, 100);
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
    } else if (pageId === 'supplier-management') {
        // Prefer API-backed supplier loader when available.
        if (typeof window.loadSupplierData === 'function') {
            window.loadSupplierData();
        } else if (typeof loadSupplierData === 'function') {
            loadSupplierData();
        }
    }

    // 添加布局修复 - 延迟执行确保内容已渲染
    setTimeout(() => {
        // 修复主内容区域高度
        const mainContent = document.querySelector('main');
        if (mainContent) {
            const header = document.querySelector('#layout-header');
            const headerHeight = header ? header.offsetHeight : 64;
            mainContent.style.minHeight = `calc(100vh - ${headerHeight}px)`;
        }

        // 修复表格容器宽度
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

    // Initialize charts - 使用 API 版本
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

    // 加载汇总统计卡片 - 使用 API 版本
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

// 只保留基本的布局和UI相关函数，数据加载函数已移动到 API 集成文件

// 只保留通用的工具函数和UI交互函数

// ============================================
// 保留基本的工具函数
// ============================================

// Initialize date display
function initDateDisplay() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateElem = document.getElementById('current-date');
    if (dateElem) dateElem.textContent = now.toLocaleDateString('en-US', options);
}

// initCharts 函数已移至 manager-api-integration.js，使用 API 数据

// 保留基本的工具函数
function formatDate(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

// loadBranchPerformance 函数已删除（已从 HTML 中移除）
// loadInitialData 函数不再需要

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

// Initialize event listeners (移除与layout.js冲突的部分)
function initEventListeners() {
    // 注意: 侧边栏切换、导航、登出按钮现在由layout.js处理

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

    // Staff filter buttons - 保留过滤功能
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

    // Notification form submission - 使用 API 版本
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

    // 添加供应商按钮事件
    document.getElementById('add-supplier-btn')?.addEventListener('click', () => {
        openAddSupplierModal();
    });

    // 添加供应商表单提交 - 使用 window 版本确保调用 API
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

    // 编辑供应商表单提交 - 使用 window 版本确保调用 API
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
                storeID: row.dataset.storeid || ''
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

// 初始化书籍搜索功能
function initBookSearch() {
    const searchInput = document.getElementById('book-search-input');
    if (searchInput) {
        // 使用防抖功能
        const debouncedSearch = debounce(function (e) {
            const searchTerm = e.target.value.trim();
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                performBookSearch(searchTerm);
            }
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    }
}

// 执行书籍搜索
function performBookSearch(searchTerm) {
    let results;

    if (searchTerm) {
        // 搜索书名或ISBN
        results = pricingData.filter(book =>
            book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            book.isbn.toLowerCase().includes(searchTerm.toLowerCase())
        );
    } else {
        // 如果没有搜索词，显示所有书籍
        results = pricingData;
    }

    // 更新表格
    updatePricingTable(results);

    // 如果没有搜索结果，显示提示
    if (searchTerm && results.length === 0) {
        showNoResultsMessage();
    }
}

// 显示无结果消息
function showNoResultsMessage() {
    console.log('No search results found');
}

// 初始化搜索框
function initSearchBoxes() {
    // 库存搜索
    const inventorySearch = document.querySelector('#inventory-page input[placeholder*="Search books"]');
    if (inventorySearch) {
        const debouncedSearch = debounce(function (e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                performInventorySearch(searchTerm);
            }
        }, 300);

        inventorySearch.addEventListener('input', debouncedSearch);
    }

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

function performInventorySearch(searchTerm) {
    const results = searchTerm ? searchInventory(searchTerm) : inventoryData;
    updateInventoryTable(results);

    if (searchTerm && results.length === 0) {
        alert('No books found matching your search');
    }
}

// 搜索库存
function searchInventory(searchTerm) {
    const filtered = inventoryData.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.isbn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.branch.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered;
}

// 搜索员工
function searchStaff(searchTerm) {
    const filtered = staffData.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.employeeID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.userID.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.branchName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered;
}

// 更新库存表格
function updateInventoryTable(data) {
    const container = document.getElementById('inventory-table-body');
    if (!container) return;

    container.innerHTML = '';

    data.forEach(book => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';

        let stockClass = '';
        let stockText = '';
        if (book.stock <= 5) {
            stockClass = 'text-red-600 font-medium';
            stockText = `${book.stock} (Low)`;
        } else if (book.stock <= 10) {
            stockClass = 'text-yellow-600';
            stockText = `${book.stock} (Medium)`;
        } else {
            stockClass = 'text-green-600';
            stockText = `${book.stock} (Good)`;
        }

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${book.title}</td>
            <td class="px-4 py-4 text-sm text-gray-500">${book.isbn}</td>
            <td class="px-4 py-4 text-sm font-mono">${book.sku}</td>
            <td class="px-4 py-4 text-sm">${book.branch}</td>
            <td class="px-4 py-4 text-sm ${stockClass}">${stockText}</td>
            <td class="px-4 py-4 text-sm">${book.lastRestock}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80" title="Edit">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800" title="Refresh Stock">
                        <i class="fa fa-refresh"></i>
                    </button>
                    <button class="text-red-600 hover:text-red-800" title="Delete">
                        <i class="fa fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
        container.appendChild(row);
    });

    // 重新添加事件监听器
    addInventoryActionButtonListeners();
}

// 更新员工表格
function updateStaffTable(data) {
    const container = document.getElementById('staff-table-body');
    if (!container) return;

    container.innerHTML = '';

    data.forEach(staff => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.staffId = staff.id;
        row.dataset.storeID = staff.storeID;
        row.dataset.position = staff.position;

        let roleClass = 'role-staff';
        if (staff.position === 'manager') roleClass = 'role-manager';
        if (staff.position === 'finance') roleClass = 'role-finance';

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${staff.employeeID}</td>
            <td class="px-4 py-4 text-sm">${staff.userID}</td>
            <td class="px-4 py-4 text-sm">${staff.branchName}</td>
            <td class="px-4 py-4 text-sm">${staff.name}</td>
            <td class="px-4 py-4 text-sm">
                <span class="px-2 py-1 text-xs ${roleClass} rounded-full">${staff.position}</span>
            </td>
            <td class="px-4 py-4 text-sm">${staff.email}</td>
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
        container.appendChild(row);
    });

    updateStaffCount(data.length);
}

// ============================================
// 员工管理相关函数（保留UI交互部分）
// ============================================

// Apply filters
function applyFilters() {
    const branchFilter = document.getElementById('branch-filter').value;
    const positionFilter = document.getElementById('position-filter').value;

    const rows = document.querySelectorAll('#staff-table-body tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const branchMatch = branchFilter === 'all' || row.dataset.storeID === branchFilter;
        const positionMatch = positionFilter === 'all' || row.dataset.position === positionFilter;

        if (branchMatch && positionMatch) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    updateStaffCount(visibleCount);

    // 添加布局修复
    fixLayoutAfterFilter();
}

// Reset filters
function resetFilters() {
    document.getElementById('branch-filter').value = 'all';
    document.getElementById('position-filter').value = 'all';

    const rows = document.querySelectorAll('#staff-table-body tr');
    rows.forEach(row => {
        row.style.display = '';
    });

    updateStaffCount(rows.length);

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

        const normalizedUsername = formData.username.toLowerCase();
        if (!/^emp\d{3}$/.test(normalizedUsername)) {
            alert('Username must be in format emp001');
            return;
        }

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
        alert(`Staff member "${formData.firstName} ${formData.lastName}" has been added successfully!`);
        document.getElementById('add-staff-form').reset();
    } catch (error) {
        if (createdUserId && typeof deleteUserAPI === 'function') {
            try {
                await deleteUserAPI(createdUserId);
            } catch (cleanupError) {
                console.error('Failed to rollback user creation:', cleanupError);
            }
        }
        console.error('Error adding staff:', error);
        alert('Failed to add staff: ' + (error.message || 'Please try again.'));
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
// 定价管理相关函数（保留UI交互部分）
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



// 加载供应商数据
function loadSupplierData() {
    updateSupplierTable(supplierData);
}

// 更新供应商表格
function updateSupplierTable(data) {
    const container = document.getElementById('supplier-table-body');
    if (!container) return;

    container.innerHTML = '';

    data.forEach(supplier => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.supplierId = supplier.id;
        row.dataset.supplierName = supplier.name.toLowerCase();
        row.dataset.supplierPhone = supplier.phone;
        row.dataset.supplierAddress = supplier.address.toLowerCase();

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium text-gray-900">${supplier.supplierID}</td>
            <td class="px-4 py-4 text-sm text-gray-900">${supplier.name}</td>
            <td class="px-4 py-4 text-sm text-gray-700">${supplier.phone}</td>
            <td class="px-4 py-4 text-sm text-gray-700 max-w-xs truncate" title="${supplier.address}">${supplier.address}</td>
            <td class="px-4 py-4 text-sm text-gray-700">${supplier.email}</td>
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
        container.appendChild(row);
    });

    updateSupplierCount(data.length);

    // 添加事件监听器到新创建的行
    addSupplierActionButtonListeners();
}

// 添加供应商表格按钮事件监听器
function addSupplierActionButtonListeners() {
    const container = document.getElementById('supplier-table-body');
    if (!container) return;

    // 避免重复绑定事件
    if (container.dataset.supplierListenersBound === 'true') return;
    container.dataset.supplierListenersBound = 'true';

    container.addEventListener('click', async function (e) {
        const button = e.target.closest('button');
        if (!button) return;

        const row = button.closest('tr');
        const supplierId = row.dataset.supplierId;

        // 尝试从本地数组查找，如果找不到则创建一个包含id的对象
        let supplier = supplierData.find(s => s.id == supplierId || s.supplier_id == supplierId);
        if (!supplier) {
            supplier = { id: supplierId, supplier_id: supplierId };
        }

        if (button.classList.contains('edit-supplier-btn')) {
            // 使用API版本的编辑功能
            if (typeof openEditSupplierModalAPI === 'function') {
                await openEditSupplierModalAPI(supplierId);
            } else {
                openEditSupplierModal(supplier);
            }
        } else if (button.classList.contains('view-supplier-btn')) {
            // 使用API版本的查看功能
            if (typeof viewSupplierDetailsAPI === 'function') {
                await viewSupplierDetailsAPI(supplierId);
            } else {
                viewSupplierDetails(supplier);
            }
        } else if (button.classList.contains('delete-supplier-btn')) {
            await deleteSupplier(supplier);
        }
    });
}

// 执行供应商搜索
function performSupplierSearch(searchTerm) {
    const container = document.getElementById('supplier-table-body');
    if (!container) return;

    if (!searchTerm) {
        // 显示所有行
        const rows = container.querySelectorAll('tr');
        rows.forEach(row => {
            row.style.display = '';
        });
        updateSupplierCount(rows.length);
        return;
    }

    const searchLower = searchTerm.toLowerCase();
    const rows = container.querySelectorAll('tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const name = row.dataset.supplierName || '';
        const phone = row.dataset.supplierPhone || '';
        const address = row.dataset.supplierAddress || '';

        if (name.includes(searchLower) ||
            phone.includes(searchLower) ||
            address.includes(searchLower)) {
            row.style.display = '';
            visibleCount++;
        } else {
            row.style.display = 'none';
        }
    });

    updateSupplierCount(visibleCount);
}

// 更新供应商计数
function updateSupplierCount(count) {
    const supplierCountElement = document.getElementById('supplier-count');
    if (supplierCountElement) {
        supplierCountElement.textContent = count;
    }
}

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

// 查看供应商详情
function viewSupplierDetails(supplier) {
    alert(`Supplier Details:\n\n` +
        `ID: ${supplier.supplierID}\n` +
        `Name: ${supplier.name}\n` +
        `Phone: ${supplier.phone}\n` +
        `Address: ${supplier.address}\n` +
        `Email: ${supplier.email}\n` +
        `Contact Person: ${supplier.contactPerson || 'N/A'}\n` +
        `Category: ${supplier.category || 'N/A'}\n` +
        `Status: ${supplier.status}`);
}

// 删除供应商 - 调用API版本
async function deleteSupplier(supplier) {
    // 获取supplierId - 兼容不同数据格式
    const supplierId = supplier.supplier_id || supplier.id;

    if (!confirm('Are you sure you want to delete this supplier? Suppliers with related purchases cannot be deleted.')) {
        return;
    }

    try {
        // 调用API删除供应商
        if (typeof deleteSupplierAPI === 'function') {
            await deleteSupplierAPI(supplierId);
            showMessage('Supplier deleted successfully', 'success');
            loadSupplierData();
        } else {
            // 备用：如果deleteSupplierAPI不存在，尝试直接调用managerApiRequest
            const response = await managerApiRequest(
                MANAGER_API_CONFIG.endpoints.suppliers.delete,
                'POST',
                { supplier_id: supplierId }
            );
            showMessage('Supplier deleted successfully', 'success');
            loadSupplierData();
        }
    } catch (error) {
        const message = String(error && error.message ? error.message : '');
        // 检查是否是关联订单导致无法删除
        if (message.includes('associated purchase orders') || message.includes('cannot delete')) {
            showMessage('Cannot delete supplier: This supplier has associated purchase orders.', 'info');
            return;
        }
        console.error('Failed to delete supplier:', error);
        showMessage('Failed to delete supplier: ' + message, 'error');
    }
}

// 添加新供应商 - 已移至 manager-supplier-api.js，使用 API 版本
// 此函数由 window.addNewSupplier 在 manager-supplier-api.js 中定义

// 更新供应商信息 - 已移至 manager-supplier-api.js，使用 API 版本
// 此函数由 window.updateSupplier 在 manager-supplier-api.js 中定义

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

// 修复缺失的函数
function addInventoryActionButtonListeners() {
    // 这里可以添加库存表格按钮的事件监听器
    console.log('Inventory action button listeners initialized');
}

// 初始化布局后调用
document.addEventListener('DOMContentLoaded', function () {
    // 确保库存管理相关事件监听器已初始化
    initInventoryEventListeners();
});
