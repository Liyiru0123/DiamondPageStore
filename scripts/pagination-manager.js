/**
 * Pagination Manager
 * 通用分页管理器
 */

class PaginationManager {
    constructor(options) {
        this.containerId = options.containerId; // 分页控件容器ID
        this.itemsPerPage = options.itemsPerPage || 10; // 每页显示数量
        this.currentPage = 1; // 当前页码
        this.totalItems = 0; // 总条目数
        this.totalPages = 0; // 总页数
        this.onPageChange = options.onPageChange || (() => {}); // 页码改变回调
        this.data = []; // 所有数据
        this.init();
    }

    init() {
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Pagination container not found: ${this.containerId}`);
            return;
        }
    }

    setData(data) {
        this.data = data;
        this.totalItems = data.length;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        this.currentPage = 1;
        this.render();
    }

    getCurrentPageData() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        return this.data.slice(startIndex, endIndex);
    }

    goToPage(page) {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.render();
        this.onPageChange(this.currentPage, this.getCurrentPageData());
    }

    nextPage() {
        this.goToPage(this.currentPage + 1);
    }

    prevPage() {
        this.goToPage(this.currentPage - 1);
    }

    render() {
        if (!this.container) return;

        const startItem = this.totalItems === 0 ? 0 : (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);

        // 查找或创建信息文本元素
        let infoText = this.container.querySelector('.pagination-info');
        if (!infoText) {
            infoText = this.container.querySelector('p');
        }
        if (infoText) {
            const originalText = infoText.textContent;
            const match = originalText.match(/of\s+\d+\s+(.*)$/i);
            const suffix = match ? match[1] : 'items';
            infoText.textContent = `Showing ${startItem} to ${endItem} of ${this.totalItems} ${suffix}`;
        }

        // 查找或创建按钮容器
        let buttonsContainer = this.container.querySelector('.pagination-buttons');
        if (!buttonsContainer) {
            buttonsContainer = this.container.querySelector('div.flex.gap-1');
        }

        if (!buttonsContainer) return;

        // 清空现有按钮
        buttonsContainer.innerHTML = '';

        // 创建按钮
        const prevButton = this.createButton('prev', '<i class="fa fa-chevron-left text-xs"></i>', this.currentPage === 1);
        const nextButton = this.createButton('next', '<i class="fa fa-chevron-right text-xs"></i>', this.currentPage === this.totalPages || this.totalPages === 0);

        // 页码按钮
        const pageButtons = this.createPageButtons();

        buttonsContainer.appendChild(prevButton);
        pageButtons.forEach(btn => buttonsContainer.appendChild(btn));
        buttonsContainer.appendChild(nextButton);
    }

    createButton(type, html, disabled) {
        const button = document.createElement('button');
        button.className = 'w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed';
        button.innerHTML = html;
        button.disabled = disabled;

        if (type === 'prev') {
            button.addEventListener('click', () => this.prevPage());
        } else if (type === 'next') {
            button.addEventListener('click', () => this.nextPage());
        }

        return button;
    }

    createPageButtons() {
        const buttons = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

        // 调整起始页以确保显示足够的页码
        if (endPage - startPage < maxVisiblePages - 1) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        // 第一页
        if (startPage > 1) {
            buttons.push(this.createPageButton(1));
            if (startPage > 2) {
                buttons.push(this.createEllipsis());
            }
        }

        // 中间页码
        for (let i = startPage; i <= endPage; i++) {
            buttons.push(this.createPageButton(i));
        }

        // 最后一页
        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                buttons.push(this.createEllipsis());
            }
            buttons.push(this.createPageButton(this.totalPages));
        }

        return buttons;
    }

    createPageButton(page) {
        const button = document.createElement('button');
        const isActive = page === this.currentPage;

        button.className = isActive
            ? 'w-8 h-8 flex items-center justify-center rounded border border-primary bg-primary text-white'
            : 'w-8 h-8 flex items-center justify-center rounded border border-gray-300 text-gray-500 hover:bg-gray-50';

        button.textContent = page;
        button.addEventListener('click', () => this.goToPage(page));

        return button;
    }

    createEllipsis() {
        const span = document.createElement('span');
        span.className = 'w-8 h-8 flex items-center justify-center text-gray-400';
        span.textContent = '...';
        return span;
    }

    // 更新总条目数（用于搜索过滤后）
    updateTotalItems(count) {
        this.totalItems = count;
        this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
            this.currentPage = this.totalPages;
        }
        if (this.currentPage < 1) {
            this.currentPage = 1;
        }
        this.render();
    }
}

// 全局分页管理器实例
window.paginationManagers = {
    staff: null,
    users: null,
    pricing: null,
    suppliers: null,
    notifications: null,
    replenishment: null,
    stockBranch: null,
    stockSKU: null
};

// 初始化所有分页管理器
function initializePaginationManagers() {
    console.log('🔧 Initializing pagination managers...');

    // Staff Management
    if (document.getElementById('staff-pagination-controls')) {
        window.paginationManagers.staff = new PaginationManager({
            containerId: 'staff-pagination-controls',
            itemsPerPage: 10,
            onPageChange: (page, data) => {
                // 页面改变时的回调（可选）
                console.log('Staff page changed to:', page);
            }
        });
        console.log('✓ Staff pagination manager created');
    } else {
        console.warn('⚠ Staff pagination controls not found');
    }

    // User Management
    if (document.getElementById('user-management-pagination-controls')) {
        window.paginationManagers.users = new PaginationManager({
            containerId: 'user-management-pagination-controls',
            itemsPerPage: 10,
            onPageChange: (page, data) => {
                console.log('Users page changed to:', page);
            }
        });
        console.log('✓ Users pagination manager created');
    } else {
        console.warn('⚠ Users pagination controls not found');
    }

    // Pricing Management
    if (document.getElementById('pricing-pagination-controls')) {
        window.paginationManagers.pricing = new PaginationManager({
            containerId: 'pricing-pagination-controls',
            itemsPerPage: 10,
            onPageChange: (page, data) => {
                console.log('Pricing page changed to:', page);
            }
        });
        console.log('✓ Pricing pagination manager created');
    } else {
        console.warn('⚠ Pricing pagination controls not found');
    }

    // Supplier Management
    if (document.getElementById('supplier-pagination-controls')) {
        window.paginationManagers.suppliers = new PaginationManager({
            containerId: 'supplier-pagination-controls',
            itemsPerPage: 10,
            onPageChange: (page, data) => {
                console.log('Suppliers page changed to:', page);
            }
        });
        console.log('✓ Suppliers pagination manager created');
    } else {
        console.warn('⚠ Suppliers pagination controls not found');
    }

    
    // Notifications
    if (document.getElementById('notifications-pagination-controls')) {
        window.paginationManagers.notifications = new PaginationManager({
            containerId: 'notifications-pagination-controls',
            itemsPerPage: 6,
            onPageChange: (page, data) => {
                console.log('Notifications page changed to:', page);
            }
        });
        console.log('? Notifications pagination manager created');
    } else {
        console.warn('? Notifications pagination controls not found');
    }

// Replenishment Requests
    if (document.getElementById('replenishment-pagination-controls')) {
        window.paginationManagers.replenishment = new PaginationManager({
            containerId: 'replenishment-pagination-controls',
            itemsPerPage: 10,
            onPageChange: (page, data) => {
                console.log('Replenishment page changed to:', page);
            }
        });
        console.log('✓ Replenishment pagination manager created');
    } else {
        console.warn('⚠ Replenishment pagination controls not found');
    }

    // Stock by Branch
    if (document.getElementById('stock-branch-pagination-controls')) {
        window.paginationManagers.stockBranch = new PaginationManager({
            containerId: 'stock-branch-pagination-controls',
            itemsPerPage: 10,
            onPageChange: (page, data) => {
                console.log('Stock branch page changed to:', page);
            }
        });
        console.log('✓ Stock branch pagination manager created');
    } else {
        console.warn('⚠ Stock branch pagination controls not found');
    }

    console.log('✅ Pagination managers initialization complete');
    console.log('📊 Active managers:', Object.keys(window.paginationManagers).filter(k => window.paginationManagers[k]));
}

// DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePaginationManagers);
} else {
    initializePaginationManagers();
}

console.log('Pagination Manager loaded successfully');
