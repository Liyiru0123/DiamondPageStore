// scripts/customer-api-integration.js
// This file overrides functions in customer.js, replacing mock data with API calls
// Must be loaded after customer.js

// ========== Global Variables ==========
let allBooks = []; // Cache all books fetched from API
let ordersCache = []; // Cache orders list from API
let favorites = favorites || [];
function getBookById(id) {
    return allBooks.find(book => book.id === id) || null;
}

// ========== Initialization Function Overrides ==========

/**
 * Initialize favorites (fetch from API)
 */
async function initFavorites() {
    try {
        favorites = await fetchFavorites();
        // Convert to frontend required format
        favorites = favorites.map(fav => ({
            id: fav.id,
            isbn: fav.isbn,
            title: fav.title,
            author: fav.author,
            price: fav.price,
            category: fav.category,
            publisher: fav.publisher,
            language: fav.language,
            description: fav.description,
            binding: fav.binding,
            stock: fav.stock,
            storeName: fav.storeName,
            favCount: 0 // Favorite count provided by book data
        }));
        updateFavoriteButtons();
    } catch (error) {
        console.error('Failed to load favorites:', error);
        showAlert('Failed to load favorites');
    }
}

/**
 * Render discount books (currently using regular book list)
 */
async function renderDiscountBooks() {
    try {
        const books = await fetchBooks({ sortBy: 'popular' });
        allBooks = books; // Cache data
        // Additional discount book rendering logic can be added here
    } catch (error) {
        console.error('Failed to load discount books:', error);
    }
}

// ========== Book-Related Function Overrides ==========

/**
 * Render category books (using API)
 */
async function renderCategoryBooks(category) {
    const container = document.getElementById('category-books');
    const sortVal = document.getElementById('category-sort-filter')?.value || 'default';

    if (!container) return;

    // Show loading state
    container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa fa-spinner fa-spin text-brown text-2xl"></i> Loading...</div>';

    try {
        const filters = {
            category: category !== 'all' ? category : undefined,
            sortBy: sortVal === 'fav-desc' ? 'fav-desc' : 'default'
        };

        const books = await fetchBooks(filters);
        allBooks = books; // Cache books data

        if (books.length === 0) {
            container.innerHTML = '<p class="text-center py-10 col-span-full text-gray-500 italic">No books found in this category.</p>';
            return;
        }

        container.innerHTML = books.map(book => bookCardTemplate(book)).join('');
        bindCartAndFavoriteEvents();
        bindBookCardClickEvents();
    } catch (error) {
        console.error('Failed to load books:', error);
        container.innerHTML = '<p class="text-center py-10 col-span-full text-red-500">Failed to load books. Please try again.</p>';
        showAlert('Failed to load books');
    }
}

/**
 * Search books (using API)
 */

async function searchBooks(keyword) {
    if (!keyword) return showAlert('Please enter keywords');

    const resultsContainer = document.getElementById('search-results');
    const noResults = document.getElementById('no-results');
    
    // 1. UI 锁定与清理
    switchPage('search');
    resultsContainer.innerHTML = `<div class="col-span-full py-20 text-center" id="search-spinner">
        <i class="fa fa-spinner fa-spin text-3xl text-brown"></i>
        <p class="mt-2 text-sm text-gray-500">Searching store...</p>
    </div>`;
    noResults.classList.add('hidden');

    try {
        const filters = {
            priceRange: document.getElementById('price-filter')?.value || 'all',
            language: document.getElementById('language-filter')?.value || 'all',
            sortBy: document.getElementById('sort-filter')?.value || 'default'
        };

        // 2. 发起请求
        const response = await searchBooksAPI(keyword, filters);
        
        // 关键逻辑：确保 response.data 是数组且存在
        const books = (response && response.success) ? response.data : [];
        allBooks = books; // 更新全局缓存供详情页使用

        // 3. 渲染
        if (books.length === 0) {
            resultsContainer.innerHTML = '';
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
            // 容错处理：确保 book 对象包含必要字段再渲染
            resultsContainer.innerHTML = books.map(book => {
                if(!book.isbn) book.isbn = `temp-${book.id}`; // 临时补齐 ISBN 防止崩溃
                return bookCardTemplate(book);
            }).join('');
            
            bindCartAndFavoriteEvents();
            bindBookCardClickEvents();
        }
    } catch (error) {
        console.error("[Search] Failed:", error);
        resultsContainer.innerHTML = `<div class="col-span-full text-center py-10 text-red-500">
            <i class="fa fa-exclamation-triangle mb-2"></i>
            <p>Service temporarily unavailable. Please try again later.</p>
        </div>`;
    } finally {
        // 无论如何移除特定的 Spinner 占位符
        const spinner = document.getElementById('search-spinner');
        if (spinner) spinner.remove();
    }
}

// ========== Favorites-Related Function Overrides ==========

/**
 * Toggle favorite status (using API)
 */
async function toggleFavorite(isbn) {
    // 根据 ISBN 查找当前缓存中的书籍数据
    const book = allBooks.find(b => b.isbn === isbn);
    if (!book) return;

    const index = favorites.findIndex(f => f.isbn === isbn);
    const isCurrentlyFavorited = index > -1;

    try {
        if (isCurrentlyFavorited) {
            await removeFavoriteAPI(isbn); // 调用 API 的唯一主键 ISBN
            favorites.splice(index, 1);
            book.favCount = Math.max(0, (book.favCount || 0) - 1);
        } else {
            await addFavoriteAPI(isbn);
            favorites.push(book);
            book.favCount = (book.favCount || 0) + 1;
        }

        // 响应式更新：自动同步全站收藏按钮和详情弹窗
        updateFavoriteButtons(); 
        if (!document.getElementById('favorites-page').classList.contains('hidden')) {
            updateFavoritesUI();
        }
    } catch (error) {
        showAlert('Action failed. Please check network.');
    }
}

/**
 * Update favorites page UI (using API data)
 */
async function updateFavoritesUI() {
    const container = document.getElementById('favorites-list');
    if (!container) return;

    // Show loading state
    container.innerHTML = '<div class="col-span-full text-center py-10"><i class="fa fa-spinner fa-spin text-brown text-2xl"></i> Loading favorites...</div>';

    try {
        favorites = await fetchFavorites();

        if (favorites.length === 0) {
            container.innerHTML = '<p class="col-span-full text-center py-10 text-gray-500">No favorite books yet. Start exploring!</p>';
            return;
        }

        // Convert to frontend format and render
        const favBooks = favorites.map(fav => ({
            id: fav.id,
            isbn: fav.isbn,
            title: fav.title,
            author: fav.author,
            price: fav.price,
            category: fav.category,
            publisher: fav.publisher,
            language: fav.language,
            description: fav.description,
            binding: fav.binding,
            stock: fav.stock,
            storeName: fav.storeName,
            favCount: 0
        }));

        allBooks = favBooks;
        container.innerHTML = favBooks.map(book => bookCardTemplate(book)).join('');
        bindCartAndFavoriteEvents();
        bindBookCardClickEvents();
    } catch (error) {
        console.error('Failed to load favorites:', error);
        container.innerHTML = '<p class="col-span-full text-center py-10 text-red-500">Failed to load favorites. Please try again.</p>';
    }
}

function updateFavoriteButtons() {
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const id = parseInt(btn.dataset.id);
        const isFav = favorites.some(f => f.id === id);
        const icon = btn.querySelector('i');
        if (icon) {
            icon.className = isFav ? 'fa fa-heart text-red-500' : 'fa fa-heart-o';
        }
    });

    document.querySelectorAll('.fav-count-display').forEach(span => {
        const id = parseInt(span.dataset.id);
        const book = getBookById(id);
        span.textContent = book ? (book.favCount || 0) : 0;
    });
}

function addToCart(bookId) {
    const id = parseInt(bookId);
    const book = getBookById(id);
    if (!book) {
        showAlert('Book not found');
        return;
    }

    const existingItemIndex = cart.findIndex(item => item.id === book.id);
    if (existingItemIndex > -1) {
        cart[existingItemIndex].quantity += 1;
    } else {
        cart.push({
            id: book.id,
            isbn: book.isbn,
            title: book.title,
            author: book.author,
            price: book.price,
            storeId: book.storeId,
            storeName: book.storeName || 'Main Headquarters',
            quantity: 1
        });
    }

    localStorage.setItem('bookCart', JSON.stringify(cart));
    updateCartUI();
    showAlert(`${book.title} added to cart`);
}

function bindBookCardClickEvents() {
    document.querySelectorAll('.book-card-item').forEach(card => {
        card.onclick = (e) => {
            if (e.target.closest('.addCartBtn') || e.target.closest('.favorite-btn') || e.target.closest('.cart-minus') || e.target.closest('.cart-plus') || e.target.closest('.cart-remove')) {
                return;
            }
            const bookId = parseInt(card.dataset.id);
            const book = getBookById(bookId);
            if (book && typeof showBookDetail === 'function') {
                showBookDetail(book);
            }
        };
    });
}

// ========== Order-Related Function Overrides ==========

/**
 * Handle checkout (using API)
 */
async function handleCheckout() {
    if (cart.length === 0) return showAlert("Cart is empty");

    const checkoutBtn = document.getElementById('proceed-checkout');
    // --- UI 锁定：开始 ---
    const originalContent = checkoutBtn.innerHTML;
    checkoutBtn.disabled = true;
    checkoutBtn.classList.add('opacity-75', 'cursor-not-allowed');
    checkoutBtn.innerHTML = `<i class="fa fa-spinner fa-spin mr-2"></i> Processing...`;

    try {
        const response = await createOrderAPI(cart);
        if (response.success) {
            cart = [];
            localStorage.setItem('bookCart', JSON.stringify(cart));
            updateCartUI();
            showAlert("Order created successfully!");
            switchPage('orders'); // 内部会自动触发响应式渲染 renderOrdersUI
        }
    } catch (error) {
        console.error('Checkout failed:', error);
        showAlert('Checkout failed. Please try again.');
    } finally {
        // --- UI 释放：结束 ---
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove('opacity-75', 'cursor-not-allowed');
        checkoutBtn.innerHTML = originalContent;
    }
}

/**
 * Render orders UI (using API)
 */
async function renderOrdersUI(filterStatus = 'all') {
    const list = document.getElementById('orders-list');
    const footer = document.getElementById('orders-footer');

    if (!list) return;

    // Show loading state
    list.innerHTML = '<div class="text-center py-10"><i class="fa fa-spinner fa-spin text-brown text-2xl"></i> Loading orders...</div>';

    try {
        const orders = await fetchOrders(filterStatus);
        ordersCache = orders;

        if (orders.length === 0) {
            list.innerHTML = `<div class="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
                <i class="fa fa-file-o text-4xl text-gray-200 mb-3"></i>
                <p class="text-gray-500">No ${filterStatus === 'all' ? '' : filterStatus} orders found.</p>
            </div>`;
            if (footer) footer.classList.add('hidden');
            return;
        }

        if (footer) footer.classList.remove('hidden');

        // Render order list
        list.innerHTML = orders.map(order => renderOrderCard(order)).join('');
        updateOrderFooterUI();
    } catch (error) {
        console.error('Failed to load orders:', error);
        list.innerHTML = '<div class="text-center py-10 text-red-500">Failed to load orders. Please try again.</div>';
    }
}

/**
 * 渲染单个订单卡片
 */
function renderOrderCard(order) {
    const statusMap = {
        'created': { text: 'Pending Payment', class: 'bg-orange-100 text-orange-700', icon: 'fa-clock-o' },
        'paid': { text: 'Paid & Processing', class: 'bg-green-100 text-green-700', icon: 'fa-check-circle' },
        'cancelled': { text: 'Cancelled', class: 'bg-red-100 text-red-700', icon: 'fa-times-circle' }
    };
    const st = statusMap[order.status] || statusMap['created'];

    return `
        <div class="border border-brown-light/20 rounded-xl p-5 shadow-sm bg-white">
            <div class="flex items-start gap-4">
                <input type="checkbox" class="order-checkbox w-5 h-5 mt-1 accent-brown"
                    ${order.status !== 'created' ? 'disabled' : ''}
                    data-id="${order.orderId}" onchange="updateOrderFooterUI()">
                <div class="flex-1">
                    <div class="flex justify-between items-center mb-4">
                        <div>
                            <span class="text-xs font-bold text-gray-400">ID: ${order.orderId}</span>
                            <p class="text-sm text-gray-500">${new Date(order.date).toLocaleString()}</p>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${st.class} flex items-center gap-1">
                                <i class="fa ${st.icon}"></i> ${st.text}
                            </span>
                        </div>
                    </div>
                    <div class="flex justify-between items-end border-t border-gray-50 pt-4">
                        <div class="text-xs text-gray-400"><i class="fa fa-map-marker"></i> ${order.storeName}</div>
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-bold text-brown">\uFFE5${order.total.toFixed(2)}</span>
                            ${order.status === 'created' ? `
                                <button onclick="handleCancelOrderClick(${order.orderId})" class="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">Cancel</button>
                                <button onclick="handlePayOrderClick(${order.orderId})" class="bg-brown text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-brown-dark transition-all">Pay Now</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
}

/**
 * Handle payment execution (using API)
 */
async function handlePaymentExecution() {
    const btnText = document.getElementById('pay-btn-text');
    const spinner = document.getElementById('pay-spinner');

    btnText.textContent = 'Processing...';
    spinner.classList.remove('hidden');

    try {
        const selectedIds = pendingPayIds;

        if (selectedIds.length === 1) {
            // Single order payment
            await payOrderAPI(selectedIds[0]);
        } else {
            // Multiple orders combined payment
            await payMultipleOrdersAPI(selectedIds);
        }

        document.getElementById('payment-modal').classList.add('hidden');
        showAlert("Payment successful!");

        // Refresh order list
        const activeStatus = document.querySelector('.order-status-btn.bg-brown')?.dataset.status || 'all';
        await renderOrdersUI(activeStatus);
    } catch (error) {
        console.error('Payment failed:', error);
        showAlert('Payment failed. Please try again.');
    } finally {
        btnText.textContent = 'Confirm Payment';
        spinner.classList.add('hidden');
    }
}

/**
 * Handle order cancellation (using API)
 */
async function handleCancelOrderClick(orderId) {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
        await cancelOrderAPI(orderId, 'User Cancelled');
        showAlert("Order cancelled.");

        // Refresh order list
        const activeStatus = document.querySelector('.order-status-btn.bg-brown')?.dataset.status || 'all';
        await renderOrdersUI(activeStatus);
    } catch (error) {
        console.error('Cancel failed:', error);
        showAlert('Failed to cancel order');
    }
}

/**
 * 处理单个订单支付点击
 */
function handlePayOrderClick(orderId) {
    openPaymentModal([orderId]);
}

async function openPaymentModal(orderIds) {
    if (!orderIds || orderIds.length === 0) return;
    pendingPayIds = orderIds;

    let targetOrders = ordersCache.filter(o => orderIds.map(String).includes(String(o.orderId)));

    if (targetOrders.length === 0 && typeof fetchOrderDetail === 'function') {
        const details = await Promise.all(orderIds.map(id => fetchOrderDetail(id)));
        targetOrders = details.map(detail => ({
            orderId: detail.order.orderId,
            total: detail.order.total,
            storeName: detail.order.storeName
        }));
    }

    const summaryList = document.getElementById('payment-summary-list');
    summaryList.innerHTML = targetOrders.map(o => `
        <div class="flex justify-between text-sm">
            <span class="text-gray-600">${o.orderId}</span>
            <span class="font-bold">\uFFE5${o.total.toFixed(2)}</span>
        </div>
    `).join('');

    const total = targetOrders.reduce((sum, o) => sum + o.total, 0);
    document.getElementById('payment-modal-total').textContent = `\uFFE5${total.toFixed(2)}`;
    document.getElementById('payment-modal').classList.remove('hidden');
}

function updateOrderFooterUI() {
    const selectedIds = getSelectedOrderIds();
    const selectedOrders = ordersCache.filter(o => selectedIds.includes(String(o.orderId)));

    const countEl = document.getElementById('selected-orders-count');
    if (countEl) countEl.textContent = selectedIds.length;

    const total = selectedOrders.reduce((sum, o) => sum + o.total, 0);
    const totalEl = document.getElementById('combined-total-price');
    if (totalEl) totalEl.textContent = `\uFFE5${total.toFixed(2)}`;

    const mergeBtn = document.getElementById('merge-payment-btn');
    if (mergeBtn) mergeBtn.disabled = selectedIds.length === 0;
}

// ========== Member-Related Function Overrides ==========

/**
 * Update member page UI (using API)
 */
async function updateMemberPageUI() {
    const memberId = getCurrentMemberId();

    try {
        const memberInfo = await fetchMemberInfo();
        const tiers = await fetchMemberTiers();

        // Populate member information
        document.getElementById('display-user-name').textContent = memberInfo.username || memberInfo.firstName;
        document.getElementById('member-total-spent').textContent = `\uFFE5${memberInfo.totalSpent.toFixed(2)}`;
        document.getElementById('member-points').textContent = memberInfo.points.toLocaleString();
        document.getElementById('member-level-badge').textContent = memberInfo.tier.name;

        // Use backend-calculated discount percentage
        document.getElementById('member-discount-text').textContent = `${memberInfo.tier.discountPercent}%`;

        // Render tier cards
        const tierContainer = document.getElementById('member-tier-cards');
        if (tierContainer) {
            tierContainer.innerHTML = tiers.map(tier => {
                const isCurrent = memberInfo.tier.tierId === tier.tierId;
                // Use backend-calculated discount percentage
                return `
                    <div class="p-4 border-2 rounded-xl transition-all ${isCurrent ? 'border-brown bg-brown/5 shadow-md' : 'border-gray-100 opacity-60'}">
                        <i class="fa fa-trophy text-${isCurrent ? 'brown' : 'gray-400'} text-2xl mb-2"></i>
                        <h4 class="font-bold text-brown-dark">${tier.name}</h4>
                        <p class="text-xs text-gray-500 mt-1">Spend \uFFE5${tier.minTotalSpent}+</p>
                        <div class="mt-3 pt-3 border-t border-gray-100">
                            <span class="text-sm font-medium text-brown">${tier.discountPercent}% OFF</span>
                        </div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Failed to load member info:', error);
        showAlert('Failed to load member information');
    }
}

// ========== Profile-Related Function Overrides ==========

/**
 * Open profile modal (fetch data from API)
 */
async function openProfileModal() {
    try {
        const profile = await fetchProfile();

        document.getElementById('profile-username').value = profile.username || '';
        document.getElementById('profile-email').value = profile.email || '';
        document.getElementById('profile-password').value = '';

        document.getElementById('profile-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load profile:', error);
        showAlert('Failed to load profile');
    }
}

/**
 * Save profile (using API)
 */
async function saveProfile() {
    const username = document.getElementById('profile-username').value;
    const email = document.getElementById('profile-email').value;
    const password = document.getElementById('profile-password').value;

    try {
        const profileData = {
            first_name: username.split(' ')[0] || username,
            last_name: username.split(' ')[1] || '',
            email: email,
            phone: 0, // TODO: Get from form
            address: '', // TODO: Get from form
            birthday: null // TODO: Get from form
        };

        await updateProfileAPI(profileData);
        showAlert("Profile updated successfully!");
        document.getElementById('profile-modal').classList.add('hidden');
    } catch (error) {
        console.error('Failed to update profile:', error);
        showAlert('Failed to update profile');
    }
}

// ========== Announcement-Related Function Overrides ==========

/**
 * Open historical announcements (using API)
 */
async function openAnnouncements() {
    const container = document.getElementById('announcement-list');

    // Show loading state
    container.innerHTML = '<div class="text-center py-10"><i class="fa fa-spinner fa-spin text-brown text-2xl"></i> Loading...</div>';

    try {
        const announcements = await fetchAnnouncements();

        container.innerHTML = announcements.map(ann => `
            <div class="p-4 bg-brown-cream/30 border-l-4 border-brown rounded-r-lg">
                <div class="flex justify-between items-center mb-1">
                    <h4 class="font-bold text-brown-dark">${ann.title}</h4>
                    <span class="text-xs text-gray-500">${new Date(ann.publishAt).toLocaleDateString()}</span>
                </div>
                <p class="text-sm text-gray-700">${ann.content}</p>
            </div>
        `).join('');

        document.getElementById('announcement-modal').classList.remove('hidden');
    } catch (error) {
        console.error('Failed to load announcements:', error);
        container.innerHTML = '<div class="text-center py-10 text-red-500">Failed to load announcements</div>';
    }
}

// ========== Shopping Cart-Related Function Overrides ==========

/**
 * Update cart UI (calculate prices using backend API)
 * Replaces frontend price calculation to prevent price tampering
 */
async function updateCartUI() {
    const cartList = document.getElementById('cart-list');
    const cartTotal = document.getElementById('cart-total');
    const cartCount = document.getElementById('cart-count');
    const cartQuickCount = document.getElementById('cart-quick-count');
    const cartEmpty = document.getElementById('cart-empty');
    const cartFooter = document.getElementById('cart-footer');

    if (!cartList || !cartTotal || !cartCount) return;

    const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCount.textContent = totalItemCount.toString();
    if (cartQuickCount) cartQuickCount.textContent = totalItemCount.toString();

    if (cart.length == 0) {
        if (cartEmpty) cartEmpty.classList.remove('hidden');
        cartList.classList.add('hidden');
        if (cartFooter) cartFooter.classList.add('hidden');
        cartTotal.textContent = '?0.00';
        return;
    }

    if (cartEmpty) cartEmpty.classList.add('hidden');
    cartList.classList.remove('hidden');
    if (cartFooter) cartFooter.classList.remove('hidden');

    cartList.innerHTML = '<div class="text-center py-10"><i class="fa fa-spinner fa-spin text-brown text-2xl"></i> Calculating prices...</div>';

    try {
        const cartItems = cart.map(item => ({
            sku_id: item.id || item.skuId || item.sku_id,
            quantity: item.quantity
        }));

        const priceData = await calculateCartTotalAPI(cartItems);

        if (!priceData.success) {
            throw new Error(priceData.message || 'Failed to calculate prices');
        }

        const calculatedItems = priceData.data.items;
        const subtotal = priceData.data.subtotal;
        const discount = priceData.data.discount;
        const totalPrice = priceData.data.total;
        const discountPercent = priceData.data.discountPercent || 0;

        cartList.innerHTML = cart.map((item) => {
            const calculatedItem = calculatedItems.find(ci => ci.sku_id == (item.id || item.skuId || item.sku_id));

            if (!calculatedItem) {
                console.error('Missing calculated data for item:', item);
                return '';
            }

            const itemTotal = calculatedItem.total;
            const title = calculatedItem.title || item.title || 'Unknown Book';
            const author = calculatedItem.author || item.author || 'Unknown Author';

            return `
                <div class="flex items-center justify-between p-4 bg-white border-b border-brown-light/30 rounded-lg shadow-sm mb-3">
                    <div class="flex flex-col flex-1 cursor-pointer book-card-item" data-id="${item.id}">
                        <h4 class="font-bold text-brown-dark">${title}</h4>
                        <p class="text-[10px] text-brown/60 flex items-center gap-1 mt-0.5">
                            <i class="fa fa-map-marker"></i> ${item.storeName || 'Main Headquarters'}
                        </p>
                        <p class="text-sm text-gray-600">${author}</p>
                    </div>
                    <div class="flex items-center gap-4">
                        <div class="flex items-center border border-brown-light rounded-full">
                            <button class="cart-minus p-1 w-8 h-8" data-id="${item.id}">-</button>
                            <span class="px-2">${item.quantity}</span>
                            <button class="cart-plus p-1 w-8 h-8" data-id="${item.id}">+</button>
                        </div>
                        <span class="font-bold text-red-600 w-20 text-right">¥${itemTotal.toFixed(2)}</span>
                        <button class="cart-remove text-gray-400 hover:text-red-500" data-id="${item.id}"><i class="fa fa-trash"></i></button>
                    </div>
                </div>
            `;
        }).join('');

        if (discount > 0) {
            cartTotal.innerHTML = `
                <div class="text-right space-y-1">
                    <p class="text-gray-600">Subtotal: <span class="font-bold">¥${subtotal.toFixed(2)}</span></p>
                    <p class="text-green-600">Member Discount (${discountPercent}%): <span class="font-bold">-¥${discount.toFixed(2)}</span></p>
                    <p class="text-xl text-brown-dark">Total: <span class="font-bold">¥${totalPrice.toFixed(2)}</span></p>
                </div>
            `;
        } else {
            cartTotal.textContent = `¥${totalPrice.toFixed(2)}`;
        }

        bindCartItemEvents();
        bindBookCardClickEvents();

    } catch (error) {
        console.error('Failed to calculate cart prices:', error);
        cartList.innerHTML = '<div class="text-center py-10 text-red-500">Failed to calculate prices. Please try again.</div>';
        showAlert('Failed to calculate cart prices');
    }
}

// ========== Data Refresh on Page Switch ==========

// Override original switchPage to add data refresh
const originalSwitchPage = switchPage;
switchPage = function(pageId) {
    originalSwitchPage(pageId);

    // Refresh data when switching pages
    if (pageId === 'favorites') {
        updateFavoritesUI();
    }
    if (pageId === 'member') {
        updateMemberPageUI();
    }
    if (pageId === 'orders') {
        renderOrdersUI('all');
    }
    if (pageId === 'categories') {
        const activeCategory = document.querySelector('.category-btn.bg-brown')?.getAttribute('data-category') || 'all';
        renderCategoryBooks(activeCategory);
    }
};

console.log('Customer API integration loaded successfully');

