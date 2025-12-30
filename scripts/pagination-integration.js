/**
 * Pagination Integration
 * 集成分页功能到现有表格渲染函数
 */

// 存储所有数据的缓存
window.allDataCache = {
    staff: [],
    users: [],
    pricing: [],
    suppliers: [],
    notifications: [],
    replenishment: [],
    stockBranch: []
};

// 存储原始渲染函数
window.originalRenderFunctions = {};

// =============================================================================
// 通用分页包装器
// =============================================================================

function wrapRenderFunctionWithPagination(functionName, managerKey, countElementId, retryCount = 0) {
    const MAX_RETRIES = 10; // 最多重试10次

    // 延迟执行以确保原始函数已定义
    setTimeout(() => {
        if (!window[functionName]) {
            if (retryCount < MAX_RETRIES) {
                console.warn(`⚠ Function ${functionName} not found, will retry (${retryCount + 1}/${MAX_RETRIES})...`);
                // 再次尝试
                setTimeout(() => wrapRenderFunctionWithPagination(functionName, managerKey, countElementId, retryCount + 1), 200);
            } else {
                console.error(`❌ Function ${functionName} not found after ${MAX_RETRIES} retries, giving up.`);
            }
            return;
        }

        // 保存原始函数
        if (!window.originalRenderFunctions[functionName]) {
            window.originalRenderFunctions[functionName] = window[functionName];
        }

        const originalFunc = window.originalRenderFunctions[functionName];

        // 创建包装函数
        window[functionName] = function(data) {
            const totalCount = (data || []).length;
            console.log(`📊 ${functionName} called with ${totalCount} items`);

            // 保存完整数据
            window.allDataCache[managerKey] = data || [];

            // 检查分页管理器是否存在
            if (window.paginationManagers && window.paginationManagers[managerKey]) {
                const manager = window.paginationManagers[managerKey];

                // 设置数据
                manager.setData(window.allDataCache[managerKey]);

                // 获取当前页数据
                const pageData = manager.getCurrentPageData();
                console.log(`   → Rendering page ${manager.currentPage} with ${pageData.length} items`);

                // 调用原始渲染函数
                originalFunc.call(this, pageData);

                // 更新总数显示
                if (countElementId) {
                    const countElement = document.getElementById(countElementId);
                    if (countElement) {
                        countElement.textContent = String(window.allDataCache[managerKey].length);
                    }
                }

                // 设置分页改变回调
                manager.onPageChange = function(page, currentPageData) {
                    console.log(`📄 Page changed to ${page}, rendering ${currentPageData.length} items`);
                    originalFunc.call(this, currentPageData);
                    if (countElementId) {
                        const countElement = document.getElementById(countElementId);
                        if (countElement) {
                            countElement.textContent = String(window.allDataCache[managerKey].length);
                        }
                    }
                };
            } else {
                console.warn(`   ⚠ Pagination manager for ${managerKey} not ready, using full data`);
                // 分页管理器未就绪，使用原始函数
                originalFunc.call(this, data);
            }
        };

        console.log(`✓ Wrapped ${functionName} with pagination (manager: ${managerKey})`);
    }, 200);
}

// =============================================================================
// Staff Management with Pagination
// =============================================================================

wrapRenderFunctionWithPagination('renderStaffTable', 'staff', 'staff-count');

// =============================================================================
// User Management with Pagination
// =============================================================================

wrapRenderFunctionWithPagination('renderUserManagementRows', 'users', null);

// =============================================================================
// Pricing Management with Pagination
// =============================================================================

wrapRenderFunctionWithPagination('renderPricingRows', 'pricing', null);

// =============================================================================
// Supplier Management with Pagination
// =============================================================================

// 延迟包装以等待supplier相关代码加载
setTimeout(() => {
    wrapRenderFunctionWithPagination('renderSupplierResults', 'suppliers', 'supplier-count');
}, 500);


// =============================================================================
// Notifications with Pagination
// =============================================================================

wrapRenderFunctionWithPagination('renderNotificationsList', 'notifications', null);

// =============================================================================
// Replenishment Requests with Pagination

wrapRenderFunctionWithPagination('renderReplenishmentRows', 'replenishment', null);

// =============================================================================

// 监听replenishment数据加载
const originalLoadReplenishmentRequests = window.loadReplenishmentRequests;
if (originalLoadReplenishmentRequests) {
    window.loadReplenishmentRequests = async function() {
        await originalLoadReplenishmentRequests();

        // 获取当前缓存的数据
        if (window.managerReplenishmentCache && window.paginationManagers && window.paginationManagers.replenishment) {
            window.paginationManagers.replenishment.setData(window.managerReplenishmentCache);
        }
    };
}

// =============================================================================
// Stock by Branch with Pagination
// =============================================================================

wrapRenderFunctionWithPagination('renderStockByBranchRows', 'stockBranch', 'branch-total-count');

// =============================================================================
// 搜索功能集成 - 添加回车键支持
// =============================================================================

function addEnterKeyToSearch(inputId, searchFunction) {
    const input = document.getElementById(inputId);
    if (input) {
        input.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchFunction(this.value);
            }
        });
    }
}

// 页面加载完成后添加回车键监听
document.addEventListener('DOMContentLoaded', function() {
    // SKU Search
    addEnterKeyToSearch('sku-search-input', function(value) {
        if (typeof performSKUSearch === 'function') {
            performSKUSearch(value);
        }
    });

    // Pricing Search
    addEnterKeyToSearch('pricing-search-input', function(value) {
        if (typeof performPricingSearch === 'function') {
            performPricingSearch(value);
        }
    });

    // Supplier Search
    addEnterKeyToSearch('supplier-search-input', function(value) {
        if (typeof performSupplierSearch === 'function') {
            performSupplierSearch(value);
        }
    });

    // Branch Stock Search (如果有)
    addEnterKeyToSearch('branch-stock-search', function(value) {
        if (typeof performBranchStockSearch === 'function') {
            performBranchStockSearch(value);
        }
    });

    // Staff Search (如果有)
    addEnterKeyToSearch('staff-search-input', function(value) {
        if (typeof performStaffSearch === 'function') {
            performStaffSearch(value);
        }
    });

    // User Search (如果有)
    addEnterKeyToSearch('user-search-input', function(value) {
        if (typeof performUserSearch === 'function') {
            performUserSearch(value);
        }
    });
});

// 如果DOM已加载，立即执行
if (document.readyState !== 'loading') {
    const event = new Event('DOMContentLoaded');
    document.dispatchEvent(event);
}

// =============================================================================
// 调试辅助函数
// =============================================================================

// 在控制台提供一个检查分页状态的函数
window.checkPaginationStatus = function() {
    console.log('=== Pagination Status ===');
    console.log('Pagination Managers:', window.paginationManagers);
    console.log('Data Cache:', window.allDataCache);
    console.log('Original Functions:', Object.keys(window.originalRenderFunctions || {}));

    if (window.paginationManagers) {
        Object.keys(window.paginationManagers).forEach(key => {
            const manager = window.paginationManagers[key];
            if (manager) {
                console.log(`${key}:`, {
                    currentPage: manager.currentPage,
                    totalPages: manager.totalPages,
                    totalItems: manager.totalItems,
                    itemsPerPage: manager.itemsPerPage
                });
            }
        });
    }
};

console.log('✅ Pagination Integration loaded successfully');
console.log('💡 Tip: Use window.checkPaginationStatus() in console to check pagination state');
