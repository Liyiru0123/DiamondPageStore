// Manager Dashboard JavaScript - 完整整合版
document.addEventListener('DOMContentLoaded', function () {
    // Initialize date display
    initDateDisplay();

    // Initialize charts
    initCharts();

    // Initialize event listeners
    initEventListeners();

    // Load initial data
    loadInitialData();

    // Set default page
    switchPage('overview');
});

// Initialize date display
function initDateDisplay() {
    const now = new Date();
    const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    const dateElem = document.getElementById('current-date');
    if (dateElem) dateElem.textContent = now.toLocaleDateString('en-US', options);
}

// Initialize charts
function initCharts() {
    // Sales Trend Chart
    const salesTrendCtx = document.getElementById('sales-trend-chart');
    if (salesTrendCtx) {
        new Chart(salesTrendCtx.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Sales',
                    data: [12000, 15000, 13500, 14200, 16800, 18500, 17200],
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

    // Category Sales Chart
    const categorySalesCtx = document.getElementById('category-sales-chart');
    if (categorySalesCtx) {
        new Chart(categorySalesCtx.getContext('2d'), {
            type: 'pie',
            data: {
                labels: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Children'],
                datasets: [{
                    data: [35, 25, 15, 12, 8, 5],
                    backgroundColor: ['#774b30', '#9f5933', '#a9805b', '#cca278', '#e1c7ac', '#e8dfce'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right' }
                }
            }
        });
    }
}

// Initialize event listeners
function initEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebar-toggle').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('hidden');
    });

    // Navigation
    document.querySelectorAll('.sidebar-link[data-page]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            switchPage(link.dataset.page);
        });
    });

    // Logout button
    document.getElementById('logout-btn').addEventListener('click', () => {
        if (confirm('Are you sure you want to log out?')) {
            window.location.href = 'login.html';
        }
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

    // Branch filter apply button
    document.getElementById('apply-branch-filter')?.addEventListener('click', function () {
        const branchFilterSelect = document.getElementById('branch-filter-select');
        filterInventoryByBranch(branchFilterSelect.value);
    });

    // Staff filter buttons
    document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
    document.getElementById('reset-filters')?.addEventListener('click', resetFilters);

    // Notification compose button
    document.getElementById('compose-notification-btn')?.addEventListener('click', () => {
        document.getElementById('compose-notification').classList.remove('hidden');
    });

    // Cancel notification button
    document.getElementById('cancel-notification')?.addEventListener('click', () => {
        document.getElementById('compose-notification').classList.add('hidden');
        document.getElementById('notification-form').reset();
    });

    // Create promotion button (顶部按钮)
    document.getElementById('create-promotion-btn')?.addEventListener('click', () => {
        showCreatePromotionForm();
    });

    // Add promotion button (Active Promotions部分)
    document.getElementById('add-promotion-btn')?.addEventListener('click', () => {
        showCreatePromotionForm();
    });

    // Cancel promotion button
    document.getElementById('cancel-promotion')?.addEventListener('click', () => {
        document.getElementById('create-promotion-form').classList.add('hidden');
        document.getElementById('promotion-form').reset();
    });

    // Promotion form submission
    document.getElementById('promotion-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        createPromotion();
    });

    // Cancel edit promotion button
    document.getElementById('cancel-edit-promotion')?.addEventListener('click', () => {
        document.getElementById('edit-promotion-modal').classList.add('hidden');
    });

    // Edit promotion form submission
    document.getElementById('edit-promotion-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        updatePromotion();
    });

    // Notification form submission
    document.getElementById('notification-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        sendNotification();
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

    // 添加书籍信息按钮
    document.getElementById('add-book-info-btn')?.addEventListener('click', () => {
        showAddBookModal();
    });

    // 取消添加书籍按钮
    document.getElementById('cancel-add-book')?.addEventListener('click', () => {
        document.getElementById('add-book-modal').classList.add('hidden');
        document.getElementById('add-book-form').reset();
    });

    // 添加书籍表单提交
    document.getElementById('add-book-form')?.addEventListener('submit', (e) => {
        e.preventDefault();
        addNewBook();
    });

    // 初始化搜索框
    initSearchBoxes();
}

// Show add book modal
function showAddBookModal() {
    document.getElementById('add-book-modal').classList.remove('hidden');
    
    // 清空表单
    document.getElementById('add-book-form').reset();
    
    // 生成一个新的SKU ID
    const newSkuId = generateNewSkuId();
    document.getElementById('add-book-sku').value = newSkuId;
}

// Generate new SKU ID
function generateNewSkuId() {
    const prefix = 'BK';
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${year}${month}-${randomNum}`;
}

// Add new book
function addNewBook() {
    const title = document.getElementById('add-book-title').value;
    const isbn = document.getElementById('add-book-isbn').value;
    const author = document.getElementById('add-book-author').value;
    const publisher = document.getElementById('add-book-publisher').value;
    const language = document.getElementById('add-book-language').value;
    const category = document.getElementById('add-book-category').value;
    const sku = document.getElementById('add-book-sku').value;
    const price = document.getElementById('add-book-price').value;
    const comment = document.getElementById('add-book-comment').value;

    // 检查ISBN是否已存在
    const existingBook = pricingData.find(book => book.isbn === isbn);
    if (existingBook) {
        alert('A book with this ISBN already exists! Please use a different ISBN.');
        return;
    }

    // 创建新的书籍对象
    const newBook = {
        title: title,
        isbn: isbn,
        currentPrice: price.startsWith('¥') ? price : `¥${price}`,
        author: author,
        publisher: publisher,
        language: language,
        category: category,
        comment: comment,
        skuID: sku
    };

    // 添加到定价数据
    pricingData.push(newBook);

    // 重新加载定价数据
    loadPricingData();

    // 隐藏模态框并重置表单
    document.getElementById('add-book-modal').classList.add('hidden');
    document.getElementById('add-book-form').reset();

    alert(`Book "${title}" has been added successfully!`);
    
    // 滚动到表格顶部
    document.getElementById('pricing-table-body').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Show create promotion form
function showCreatePromotionForm() {
    document.getElementById('create-promotion-form').classList.remove('hidden');
    // 设置默认日期
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('promotion-start-date').value = today;
    
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    document.getElementById('promotion-end-date').value = nextMonth.toISOString().split('T')[0];
    
    // 滚动到表单位置
    document.getElementById('create-promotion-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Show edit promotion form
function showEditPromotionForm(promotionId) {
    const promotion = promotionsData.find(p => p.id == promotionId);
    if (!promotion) return;

    // 填充表单数据
    document.getElementById('edit-promotion-id').value = promotion.id;
    document.getElementById('edit-promotion-title').value = promotion.title;
    document.getElementById('edit-promotion-discount').value = promotion.discount;
    document.getElementById('edit-promotion-start-date').value = promotion.startDate;
    document.getElementById('edit-promotion-end-date').value = promotion.endDate;
    document.getElementById('edit-promotion-status').value = promotion.status;
    document.getElementById('edit-promotion-description').value = promotion.description;

    // 显示编辑模态框
    document.getElementById('edit-promotion-modal').classList.remove('hidden');
}

// Create promotion
function createPromotion() {
    const title = document.getElementById('promotion-title').value;
    const discount = document.getElementById('promotion-discount').value;
    const startDate = document.getElementById('promotion-start-date').value;
    const endDate = document.getElementById('promotion-end-date').value;
    const status = document.getElementById('promotion-status').value;
    const description = document.getElementById('promotion-description').value;

    // 创建促销对象
    const newPromotion = {
        id: promotionsData.length > 0 ? Math.max(...promotionsData.map(p => p.id)) + 1 : 1,
        title: title,
        discount: discount,
        period: `${formatDate(startDate)} - ${formatDate(endDate)}`,
        status: status,
        startDate: startDate,
        endDate: endDate,
        description: description,
        recipients: 'Shopping System Homepage'
    };

    // 添加到促销数据
    promotionsData.push(newPromotion);

    // 创建通知对象
    const newNotification = {
        id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
        title: `${title} Promotion`,
        message: `New promotion: ${discount}. ${description}. Promotion period: ${formatDate(startDate)} to ${formatDate(endDate)}.`,
        date: new Date().toISOString().split('T')[0],
        recipients: 'Shopping System Homepage',
        type: 'promotion'
    };

    // 添加到通知数据
    notifications.unshift(newNotification);

    // 重新加载通知和促销
    loadNotifications();
    loadPromotions();

    // 隐藏表单并重置
    document.getElementById('create-promotion-form').classList.add('hidden');
    document.getElementById('promotion-form').reset();

    alert('Promotion created and sent to shopping system homepage successfully!');
}

// Update promotion
function updatePromotion() {
    const promotionId = parseInt(document.getElementById('edit-promotion-id').value);
    const title = document.getElementById('edit-promotion-title').value;
    const discount = document.getElementById('edit-promotion-discount').value;
    const startDate = document.getElementById('edit-promotion-start-date').value;
    const endDate = document.getElementById('edit-promotion-end-date').value;
    const status = document.getElementById('edit-promotion-status').value;
    const description = document.getElementById('edit-promotion-description').value;

    // 查找并更新促销
    const promotionIndex = promotionsData.findIndex(p => p.id === promotionId);
    if (promotionIndex !== -1) {
        promotionsData[promotionIndex].title = title;
        promotionsData[promotionIndex].discount = discount;
        promotionsData[promotionIndex].period = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        promotionsData[promotionIndex].status = status;
        promotionsData[promotionIndex].startDate = startDate;
        promotionsData[promotionIndex].endDate = endDate;
        promotionsData[promotionIndex].description = description;

        // 创建更新通知
        const updateNotification = {
            id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
            title: `${title} Promotion Updated`,
            message: `Promotion updated: ${discount}. ${description}. Promotion period: ${formatDate(startDate)} to ${formatDate(endDate)}.`,
            date: new Date().toISOString().split('T')[0],
            recipients: 'Shopping System Homepage',
            type: 'promotion'
        };

        // 添加到通知数据
        notifications.unshift(updateNotification);

        // 重新加载通知和促销
        loadNotifications();
        loadPromotions();

        // 隐藏编辑模态框
        document.getElementById('edit-promotion-modal').classList.add('hidden');

        alert('Promotion updated and notification sent to shopping system homepage successfully!');
    }
}

// Delete promotion
function deletePromotion(promotionId) {
    if (confirm('Are you sure you want to delete this promotion?')) {
        // 查找促销
        const promotionIndex = promotionsData.findIndex(p => p.id === promotionId);
        if (promotionIndex !== -1) {
            const promotion = promotionsData[promotionIndex];
            
            // 从促销数据中删除
            promotionsData.splice(promotionIndex, 1);
            
            // 创建删除通知
            const deleteNotification = {
                id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
                title: `${promotion.title} Promotion Ended`,
                message: `Promotion "${promotion.title}" has been ended.`,
                date: new Date().toISOString().split('T')[0],
                recipients: 'Shopping System Homepage',
                type: 'promotion'
            };
            
            // 添加到通知数据
            notifications.unshift(deleteNotification);
            
            // 重新加载通知和促销
            loadNotifications();
            loadPromotions();
            
            alert('Promotion deleted and notification sent to shopping system homepage!');
        }
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
}

// Page switching
function switchPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page-content').forEach(page => {
        page.classList.add('hidden');
    });

    // Show target page
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
    }

    // Update active link
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.classList.remove('active');
    });
    const activeLink = document.querySelector(`.sidebar-link[data-page="${pageId}"]`);
    if (activeLink) {
        activeLink.classList.add('active');
    }

    // Load page-specific data
    if (pageId === 'inventory') {
        loadInventoryData();
    } else if (pageId === 'staff') {
        loadStaffData();
    } else if (pageId === 'pricing') {
        loadPricingData();
        // 初始化书籍搜索功能
        initBookSearch();
    } else if (pageId === 'notifications') {
        loadNotifications();
        loadPromotions();
    } else if (pageId === 'branch-finance') {
        // 初始化分支财务页面
        initBranchFinancePage();
    }
}

// Load initial data
function loadInitialData() {
    loadBranchPerformance();
}

// Load branch performance data
function loadBranchPerformance() {
    const container = document.getElementById('branch-performance');
    if (container) {
        container.innerHTML = '';
        branchPerformance.forEach(branch => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';

            let performanceClass = 'bg-green-100 text-green-800';
            if (branch.performance === 'Good') performanceClass = 'bg-blue-100 text-blue-800';
            if (branch.performance === 'Average') performanceClass = 'bg-yellow-100 text-yellow-800';

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${branch.name}</td>
                <td class="px-4 py-4 text-sm">${branch.sales}</td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs ${performanceClass} rounded-full">${branch.performance}</span>
                </td>
                <td class="px-4 py-4 text-sm">
                    <span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">${branch.status}</span>
                </td>
            `;
            container.appendChild(row);
        });
    }
}

// Load inventory data
function loadInventoryData() {
    const container = document.getElementById('inventory-table-body');
    if (container) {
        container.innerHTML = '';
        inventoryData.forEach(book => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';

            // Determine stock status for color coding
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
    }

    // Add event listeners to action buttons
    addInventoryActionButtonListeners();
}

// Add event listeners to inventory action buttons
function addInventoryActionButtonListeners() {
    // Edit buttons
    document.querySelectorAll('#inventory-table-body .fa-edit').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            alert(`Editing: ${title}`);
        });
    });

    // Refresh buttons
    document.querySelectorAll('#inventory-table-body .fa-refresh').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            alert(`Refreshing stock for: ${title}`);
        });
    });

    // Delete buttons
    document.querySelectorAll('#inventory-table-body .fa-trash').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            if (confirm(`Are you sure you want to delete "${title}" from inventory?`)) {
                row.remove();
                alert(`"${title}" has been deleted from inventory.`);
            }
        });
    });
}

// Filter inventory by branch
function filterInventoryByBranch(branch) {
    // In a real app, this would filter the data
    console.log(`Filtering inventory by branch: ${branch}`);
    alert(`Filtering by branch: ${branch}`);
}

// Load staff data
function loadStaffData() {
    const container = document.getElementById('staff-table-body');
    if (container) {
        container.innerHTML = '';
        staffData.forEach(staff => {
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
                <td class="px-4 py-4 text-sm font-mono text-gray-700">${staff.password}</td>
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
    }

    // Add event listeners to action buttons
    addStaffActionButtonListeners();
}

// Add event listeners to staff action buttons
function addStaffActionButtonListeners() {
    // Edit buttons
    document.querySelectorAll('#staff-table-body .edit-staff').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = row.cells[3].textContent;
            alert(`Editing: ${name}`);
        });
    });

    // View buttons
    document.querySelectorAll('#staff-table-body .view-staff').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const employeeID = row.cells[0].textContent;
            const userID = row.cells[1].textContent;
            const branchName = row.cells[2].textContent;
            const name = row.cells[3].textContent;
            const position = row.cells[4].textContent;
            const password = row.cells[5].textContent;

            alert(`Staff Details:\n\nEmployee ID: ${employeeID}\nUser ID: ${userID}\nBranch: ${branchName}\nName: ${name}\nPosition: ${position}\nPassword: ${password}`);
        });
    });

    // Delete buttons
    document.querySelectorAll('#staff-table-body .delete-staff').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const name = row.cells[3].textContent;
            if (confirm(`Are you sure you want to delete "${name}" from staff records?`)) {
                row.remove();
                updateStaffCount();
                alert(`"${name}" has been deleted from staff records.`);
            }
        });
    });
}

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

// Load pricing data
function loadPricingData() {
    // 从 manager-data.js 中获取定价数据
    const tableContainer = document.getElementById('pricing-table-body');
    if (tableContainer) {
        tableContainer.innerHTML = '';
        pricingData.forEach(book => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors';
            row.dataset.book = JSON.stringify(book);

            row.innerHTML = `
                <td class="px-4 py-4 text-sm font-medium">${book.title}</td>
                <td class="px-4 py-4 text-sm text-gray-500">${book.isbn}</td>
                <td class="px-4 py-4 text-sm">${book.currentPrice}</td>
                <td class="px-4 py-4 text-sm">
                    <div class="flex gap-2">
                        <button class="text-primary hover:text-primary/80 edit-book-btn" title="Edit">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button class="text-blue-600 hover:text-blue-800 refresh-price-btn" title="Refresh Price">
                            <i class="fa fa-refresh"></i>
                        </button>
                    </div>
                </td>
            `;
            tableContainer.appendChild(row);
        });
    }

    // Add event listeners to edit book buttons
    document.querySelectorAll('#pricing-table-body .edit-book-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const bookData = JSON.parse(row.dataset.book);
            openEditBookModal(bookData);
        });
    });

    // Add event listeners to refresh price buttons
    document.querySelectorAll('#pricing-table-body .refresh-price-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            alert(`Refreshing price for: ${title}`);
        });
    });
}

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

// Show branch order details
function showBranchOrderDetails(orderId) {
    const order = allBranchOrderData[orderId];
    if (!order) return;
    const detailContainer = document.getElementById('branch-order-details');
    if (!detailContainer) return;

    if (!detailContainer.querySelector('#branch-detail-order-id')) {
        detailContainer.innerHTML = `
            <h4 class="font-semibold text-lg mb-3">Order Details</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h5 class="font-medium mb-2">Basic Information</h5>
                    <div class="space-y-2">
                        <div class="flex justify-between"><span class="text-sm text-gray-500">Order ID:</span><span class="text-sm font-medium" id="branch-detail-order-id">-</span></div>
                        <div class="flex justify-between"><span class="text-sm text-gray-500">Branch ID:</span><span class="text-sm" id="branch-detail-branch-id">-</span></div>
                        <div class="flex justify-between"><span class="text-sm text-gray-500">Member ID:</span><span class="text-sm" id="branch-detail-member-id">-</span></div>
                        <div class="flex justify-between"><span class="text-sm text-gray-500">Status:</span><span class="text-sm" id="branch-detail-status">-</span></div>
                    </div>
                </div>
                <div>
                    <h5 class="font-medium mb-2">Timeline</h5>
                    <div class="space-y-2">
                        <div class="flex justify-between"><span class="text-sm text-gray-500">Created Date:</span><span class="text-sm" id="branch-detail-created-date">-</span></div>
                        <div class="flex justify-between"><span class="text-sm text-gray-500">Updated Date:</span><span class="text-sm" id="branch-detail-updated-date">-</span></div>
                        <div class="flex justify-between"><span class="text-sm text-gray-500">Total Amount:</span><span class="text-sm font-medium" id="branch-detail-total-amount">-</span></div>
                    </div>
                </div>
            </div>
            <div class="mt-4">
                <h5 class="font-medium mb-2">Order Items</h5>
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Book Name</th>
                                <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ISBN</th>
                                <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                                <th class="px-4 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                            </tr>
                        </thead>
                        <tbody id="branch-order-items-list" class="bg-white divide-y divide-gray-200"></tbody>
                    </table>
                </div>
            </div>
        `;
    }

    document.getElementById('branch-detail-order-id').textContent = order.orderId;
    document.getElementById('branch-detail-branch-id').textContent = order.branchId || '-';
    document.getElementById('branch-detail-member-id').textContent = order.memberId;
    document.getElementById('branch-detail-status').textContent = order.status.charAt(0).toUpperCase() + order.status.slice(1);
    document.getElementById('branch-detail-created-date').textContent = order.createdDate;
    document.getElementById('branch-detail-updated-date').textContent = order.updatedDate;
    document.getElementById('branch-detail-total-amount').textContent = order.totalAmount;

    const itemsContainer = document.getElementById('branch-order-items-list');
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

    detailContainer.classList.remove('hidden');
    detailContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Load notifications
function loadNotifications() {
    const notificationsContainer = document.getElementById('notifications-list');
    if (notificationsContainer) {
        notificationsContainer.innerHTML = '';
        notifications.forEach(notification => {
            const notificationEl = document.createElement('div');
            notificationEl.className = 'bg-white p-4 rounded-lg border border-gray-200';

            // 为促销通知添加特殊样式
            let typeBadge = '';
            if (notification.type === 'promotion') {
                typeBadge = '<span class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full ml-2">Promotion</span>';
            }

            notificationEl.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center">
                        <h4 class="font-medium">${notification.title}</h4>
                        ${typeBadge}
                    </div>
                    <span class="text-xs text-gray-500">${notification.date}</span>
                </div>
                <p class="text-sm text-gray-600 mb-3">${notification.message}</p>
                <div class="text-xs text-gray-500">
                    <span>To: ${notification.recipients}</span>
                </div>
            `;
            notificationsContainer.appendChild(notificationEl);
        });
    }
}

// Load promotions
function loadPromotions() {
    const promotionsContainer = document.getElementById('promotions-list');
    if (promotionsContainer) {
        promotionsContainer.innerHTML = '';
        promotionsData.forEach(promo => {
            const card = document.createElement('div');
            card.className = 'bg-white p-4 rounded-lg border border-gray-200';

            let statusClass = 'bg-green-100 text-green-800';
            if (promo.status === 'Upcoming') statusClass = 'bg-yellow-100 text-yellow-800';
            if (promo.status === 'Expired') statusClass = 'bg-gray-100 text-gray-800';

            card.innerHTML = `
                <div class="flex justify-between items-start mb-2">
                    <h4 class="font-medium">${promo.title}</h4>
                    <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${promo.status}</span>
                </div>
                <p class="text-lg font-bold text-primary mb-1">${promo.discount}</p>
                <p class="text-sm text-gray-500 mb-3">${promo.period}</p>
                <p class="text-sm text-gray-600 mb-3">${promo.description}</p>
                <div class="flex justify-between items-center mt-3">
                    <div class="text-xs text-gray-500">
                        <span>Sent to: ${promo.recipients}</span>
                    </div>
                    <div class="flex gap-2">
                        <button class="text-primary hover:text-primary/80 edit-promotion-btn" title="Edit" data-promotion-id="${promo.id}">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button class="text-red-600 hover:text-red-800 delete-promotion-btn" title="Delete" data-promotion-id="${promo.id}">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
            promotionsContainer.appendChild(card);
        });

        // 为编辑按钮添加事件监听
        document.querySelectorAll('.edit-promotion-btn').forEach(button => {
            button.addEventListener('click', function () {
                const promotionId = this.dataset.promotionId;
                showEditPromotionForm(promotionId);
            });
        });

        // 为删除按钮添加事件监听
        document.querySelectorAll('.delete-promotion-btn').forEach(button => {
            button.addEventListener('click', function () {
                const promotionId = this.dataset.promotionId;
                deletePromotion(promotionId);
            });
        });
    }
}

// Send notification (修改：直接发送到购物系统首页)
function sendNotification() {
    const subject = document.getElementById('notification-subject').value;
    const message = document.getElementById('notification-message').value;

    // 创建通知对象，收件人固定为购物系统首页
    const newNotification = {
        id: notifications.length > 0 ? Math.max(...notifications.map(n => n.id)) + 1 : 1,
        title: subject,
        message: message,
        date: new Date().toISOString().split('T')[0],
        recipients: 'Shopping System Homepage',
        type: 'announcement'
    };

    // 添加到通知数据
    notifications.unshift(newNotification);

    // 重新加载通知
    loadNotifications();

    // 隐藏表单并重置
    document.getElementById('compose-notification').classList.add('hidden');
    document.getElementById('notification-form').reset();

    alert('Notification sent to shopping system homepage successfully!');
}

// ============================================
// BRANCH FINANCE PAGE FUNCTIONS
// ============================================

let branchTrendChart = null;
let currentBranchPeriod = 'month';

// 初始化分支财务页面
function initBranchFinancePage() {
    renderBranchList();
    selectBranch('1');
    
    // 添加分支事件监听器
    const branchesContainer = document.getElementById('branches-container');
    if (branchesContainer) {
        branchesContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.branch-item');
            if (item) selectBranch(item.dataset.branchId);
        });
    }

    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => switchBranchPeriod(btn.dataset.period));
    });

    const branchTransactions = document.getElementById('branch-transactions');
    if (branchTransactions) {
        branchTransactions.addEventListener('click', (e) => {
            const row = e.target.closest('tr[data-order-id]');
            if (row) showBranchOrderDetails(row.dataset.orderId);
        });
    }
}

// 渲染分支列表
function renderBranchList() {
    const container = document.getElementById('branches-container');
    if (!container) return;

    container.innerHTML = '';
    Object.keys(branchData).forEach(branchId => {
        const branch = branchData[branchId];
        const item = document.createElement('div');
        item.className = 'branch-item p-3 border border-gray-200 rounded-lg cursor-pointer transition-colors hover:bg-gray-50';
        if (parseInt(branchId) === 1) {
            item.classList.add('active', 'border-primary');
        }
        item.dataset.branchId = branchId;

        let statusColor = 'bg-green-100 text-green-800';
        if (branch.status === 'Limited') statusColor = 'bg-yellow-100 text-yellow-800';
        else if (branch.status === 'Closed') statusColor = 'bg-red-100 text-red-800';

        item.innerHTML = `
            <div class="mb-2">
                <div class="flex justify-between items-start">
                    <h4 class="font-medium">${branch.name}</h4>
                    <span class="px-2 py-1 text-xs ${statusColor} rounded-full">${branch.status}</span>
                </div>
                ${branch.isTopSales ? 
                    '<div class="mt-1"><span class="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">Top Sales</span></div>' : ''
                }
            </div>
            <p class="text-sm text-gray-500 mb-1">${branch.address}</p>
            <p class="text-sm text-gray-500">${branch.phone}</p>
            <div class="mt-2 text-xs text-gray-500">
                <span>Revenue: ¥${branch.monthly.revenue.toLocaleString()}</span>
            </div>
        `;
        container.appendChild(item);
    });
}

// 选择分支
function selectBranch(branchId) {
    document.querySelectorAll('.branch-item').forEach(item => {
        item.classList.remove('active', 'border-primary');
        item.classList.add('border-gray-200');
    });
    
    const selectedItem = document.querySelector(`.branch-item[data-branch-id="${branchId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('active', 'border-primary');
        selectedItem.classList.remove('border-gray-200');
    }

    const branch = branchData[branchId];
    if (!branch) return;

    document.getElementById('selected-branch-name').textContent = branch.name;
    document.getElementById('selected-branch-address').textContent = `${branch.address} • ${branch.phone}`;
    updateBranchFinancials(branchId, currentBranchPeriod);
    initBranchTrendChart(branchId, currentBranchPeriod);

    const transactionsContainer = document.getElementById('branch-transactions');
    if (transactionsContainer) {
        transactionsContainer.innerHTML = '';
        branch.transactions.forEach(t => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-50 transition-colors cursor-pointer';
            row.dataset.orderId = t.orderId;

            let statusClass = '';
            switch (t.status) {
                case 'created': statusClass = 'bg-blue-100 text-blue-800'; break;
                case 'paid': statusClass = 'bg-green-100 text-green-800'; break;
                case 'cancelled': statusClass = 'bg-red-100 text-red-800'; break;
                case 'refunded': statusClass = 'bg-yellow-100 text-yellow-800'; break;
                default: statusClass = 'bg-gray-100 text-gray-800';
            }

            row.innerHTML = `
                <td class="px-4 py-3 text-sm">${t.date}</td>
                <td class="px-4 py-3 text-sm font-medium">${t.orderId}</td>
                <td class="px-4 py-3 text-sm">${t.totalAmount}</td>
                <td class="px-4 py-3 text-sm">
                    <span class="px-2 py-1 text-xs ${statusClass} rounded-full">${t.status.charAt(0).toUpperCase() + t.status.slice(1)}</span>
                </td>
            `;
            transactionsContainer.appendChild(row);
        });
    }

    document.getElementById('branch-order-details')?.classList.add('hidden');
}

// 更新分支财务数据
function updateBranchFinancials(branchId, period = 'month') {
    const branch = branchData[branchId];
    if (!branch) return;

    const periodData = {
        week: branch.weekly,
        month: branch.monthly,
        quarter: branch.quarterly
    }[period] || branch.monthly;

    const revenueElem = document.getElementById('branch-revenue');
    const profitElem = document.getElementById('branch-profit');
    const revenueChangeElem = document.getElementById('branch-revenue-change');
    const profitChangeElem = document.getElementById('branch-profit-change');
    
    if (revenueElem) revenueElem.textContent = `¥${periodData.revenue.toLocaleString()}`;
    if (profitElem) profitElem.textContent = `¥${periodData.profit.toLocaleString()}`;
    if (revenueChangeElem) revenueChangeElem.textContent = periodData.change;
    if (profitChangeElem) profitChangeElem.textContent = periodData.change;
}

// 初始化分支趋势图
function initBranchTrendChart(branchId, period = 'month') {
    const branch = branchData[branchId];
    if (!branch) return;

    const periodData = {
        week: branch.weekly,
        month: branch.monthly,
        quarter: branch.quarterly
    }[period] || branch.monthly;

    let labels = [];
    let dataLabel = '';

    switch (period) {
        case 'week':
            labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            dataLabel = 'Daily Revenue';
            break;
        case 'month':
            labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            dataLabel = 'Weekly Revenue';
            break;
        case 'quarter':
            labels = ['Month 1', 'Month 2', 'Month 3'];
            dataLabel = 'Monthly Revenue';
            break;
    }

    const chartCanvas = document.getElementById('branch-trend-chart');
    if (!chartCanvas) return;

    // 销毁现有图表
    if (branchTrendChart) {
        branchTrendChart.destroy();
    }

    branchTrendChart = new Chart(chartCanvas.getContext('2d'), {
        type: 'line',
        data: {
            labels: labels.slice(0, periodData.trendData.length),
            datasets: [{
                label: dataLabel,
                data: periodData.trendData,
                borderColor: '#8B5A2B',
                backgroundColor: 'rgba(139, 90, 43, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 3,
                pointBackgroundColor: '#8B5A2B'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => '¥' + value.toLocaleString()
                    }
                }
            }
        }
    });
}

// 切换分支周期
function switchBranchPeriod(period) {
    currentBranchPeriod = period;

    // 更新按钮样式
    document.querySelectorAll('.period-btn').forEach(btn => {
        if (btn.dataset.period === period) {
            btn.classList.remove('bg-gray-100', 'hover:bg-gray-200');
            btn.classList.add('bg-primary', 'text-white');
        } else {
            btn.classList.remove('bg-primary', 'text-white');
            btn.classList.add('bg-gray-100', 'hover:bg-gray-200');
        }
    });

    // 更新当前选择的分支数据
    const activeBranch = document.querySelector('.branch-item.active');
    if (activeBranch) {
        const branchId = activeBranch.dataset.branchId;
        updateBranchFinancials(branchId, period);
        initBranchTrendChart(branchId, period);
    }
}

// 初始化书籍搜索功能
function initBookSearch() {
    const searchInput = document.getElementById('book-search-input');
    if (searchInput) {
        // 使用防抖功能
        const debouncedSearch = debounce(function(e) {
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

// 更新定价表格
function updatePricingTable(data) {
    const tableContainer = document.getElementById('pricing-table-body');
    if (!tableContainer) return;
    
    tableContainer.innerHTML = '';
    
    if (data.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                <div class="flex flex-col items-center">
                    <i class="fa fa-search text-3xl text-gray-300 mb-2"></i>
                    <p>No books found matching your search</p>
                </div>
            </td>
        `;
        tableContainer.appendChild(row);
        return;
    }
    
    data.forEach(book => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-gray-50 transition-colors';
        row.dataset.book = JSON.stringify(book);

        row.innerHTML = `
            <td class="px-4 py-4 text-sm font-medium">${book.title}</td>
            <td class="px-4 py-4 text-sm text-gray-500">${book.isbn}</td>
            <td class="px-4 py-4 text-sm">${book.currentPrice}</td>
            <td class="px-4 py-4 text-sm">
                <div class="flex gap-2">
                    <button class="text-primary hover:text-primary/80 edit-book-btn" title="Edit">
                        <i class="fa fa-edit"></i>
                    </button>
                    <button class="text-blue-600 hover:text-blue-800 refresh-price-btn" title="Refresh Price">
                        <i class="fa fa-refresh"></i>
                    </button>
                </div>
            </td>
        `;
        tableContainer.appendChild(row);
    });

    // 重新添加事件监听器
    document.querySelectorAll('#pricing-table-body .edit-book-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const bookData = JSON.parse(row.dataset.book);
            openEditBookModal(bookData);
        });
    });

    document.querySelectorAll('#pricing-table-body .refresh-price-btn').forEach(button => {
        button.addEventListener('click', function () {
            const row = this.closest('tr');
            const title = row.cells[0].textContent;
            alert(`Refreshing price for: ${title}`);
        });
    });
}

// 显示无结果消息
function showNoResultsMessage() {
    // 这个消息已经在updatePricingTable中显示
    console.log('No search results found');
}

// 初始化搜索框
function initSearchBoxes() {
    // 库存搜索
    const inventorySearch = document.querySelector('#inventory-page input[placeholder*="Search books"]');
    if (inventorySearch) {
        const debouncedSearch = debounce(function(e) {
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
        const debouncedSearch = debounce(function(e) {
            const searchTerm = e.target.value;
            if (searchTerm.length >= 2 || searchTerm.length === 0) {
                performStaffSearch(searchTerm);
            }
        }, 300);
        
        staffSearch.addEventListener('input', debouncedSearch);
    }
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

function performInventorySearch(searchTerm) {
    const results = searchTerm ? searchInventory(searchTerm) : inventoryData;
    updateInventoryTable(results);
    
    if (searchTerm && results.length === 0) {
        alert('No books found matching your search');
    }
}

function performStaffSearch(searchTerm) {
    const results = searchTerm ? searchStaff(searchTerm) : staffData;
    updateStaffTable(results);
    
    if (searchTerm && results.length === 0) {
        alert('No staff found matching your search');
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
        item.position.toLowerCase().includes(searchTerm.toLowerCase())
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
            <td class="px-4 py-4 text-sm font-mono text-gray-700">${staff.password}</td>
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
    
    // 重新添加事件监听器
    addStaffActionButtonListeners();
    updateStaffCount(data.length);
}