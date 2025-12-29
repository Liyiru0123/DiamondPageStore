// scripts/customer.js

// ========== 全局状态映射 ==========
let allBooks = [];      // 当前页面显示的图书缓存 (由 API 填充)
let favorites = [];    // 用户收藏列表 (由 API 填充)
let cart = [];         // 购物车列表 (由本地存储 + 后端计价同步)
let ordersCache = [];  // 订单列表缓存
let pendingPayIds = []; // 待支付订单 ID 组

const App = {
  async init() {
    console.log("[App] Initializing Storefront (Expert Mode)...");

    try {
      // 1. 基础鉴权
      checkAuth(['customer']);

      // 2. 并发初始化基础数据 (不阻塞)
      await Promise.all([
        this.syncFavorites(),
        this.syncCart()
      ]);

      // 3. 初始首屏渲染 (默认显示全部书籍)
      await renderCategoryBooks('all');

      // 4. 全局事件绑定
      bindEvents();

      console.log("[App] Integrated System Ready.");
    } catch (error) {
      console.error("[App] Initialization Failed:", error);
      showAlert("Critical Error: Failed to connect to server.");
    }
  },

  // 同步收藏夹
  async syncFavorites() {
    try {
      const data = await fetchFavorites();
      favorites = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error("Favorites sync failed");
    }
  },

  // 同步购物车本地缓存
  syncCart() {
    const saved = localStorage.getItem('bookCart');
    cart = saved ? JSON.parse(saved) : [];
    updateCartUI();
  }
};

// 入口点
document.addEventListener('DOMContentLoaded', () => App.init());

// ========== 核心业务逻辑：图书渲染 ==========

const bookCardTemplate = (book) => {
  const isFav = favorites.some(f => String(f.isbn) === String(book.isbn));
  const realStock = book.stock_count !== undefined ? book.stock_count : (book.stock || 0);
  const fCount = book.fav_count !== undefined ? book.fav_count : (book.favCount || 0);

  return `
    <div class="book-card-item bg-white rounded-xl shadow-sm border border-brown-light/20 hover:border-brown transition-all duration-300 cursor-pointer" 
        data-isbn="${book.isbn}" data-id="${book.id}">
      <div class="p-5">
        <div class="flex justify-between items-start mb-2">
          <h3 class="font-bold text-brown-dark line-clamp-2 flex-1">${book.title}</h3>
          <div class="flex flex-col items-center ml-2">
             <button class="favorite-btn text-gray-400 hover:text-red-500" data-isbn="${book.isbn}">
                <i class="fa ${isFav ? 'fa-heart text-red-500' : 'fa-heart-o'} text-xl"></i>
             </button>
             <span class="fav-count-display text-[10px] text-gray-400" data-isbn="${book.isbn}">${fCount}</span>
          </div>
        </div>
        <div class="text-sm text-gray-500 mb-4">
          <p>Author: ${book.author_name || book.author || 'N/A'}</p>
          <p class="text-[10px] ${realStock > 0 ? 'text-green-600' : 'text-red-500'}">
            ● ${realStock > 0 ? 'In Stock: ' + realStock : 'Out of Stock'}
          </p>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-lg font-bold text-brown">¥${Number(book.price).toFixed(2)}</span>
          <button class="addCartBtn bg-brown text-white px-3 py-1.5 rounded-full text-xs hover:bg-brown-dark" 
                  data-id="${book.id}">+ Cart</button>
        </div>
      </div>
    </div>
  `;
};

async function renderCategoryBooks(category) {
  const container = document.getElementById('category-books');
  const sortVal = document.getElementById('category-sort-filter')?.value || 'default';
  if (!container) return;

  container.innerHTML = `<div class="col-span-full py-20 text-center"><i class="fa fa-spinner fa-spin text-3xl text-brown"></i></div>`;

  try {
    const books = await fetchBooks({ category: category !== 'all' ? category : undefined, sortBy: sortVal });
    allBooks = books;
    container.innerHTML = books.length ? books.map(b => bookCardTemplate(b)).join('') : '<p class="col-span-full text-center py-20 text-gray-400">No books found.</p>';
    bindDynamicEvents();
  } catch (e) {
    container.innerHTML = `<p class="col-span-full text-center text-red-500">Failed to load category.</p>`;
  }
}

async function searchBooks(keyword) {
  if (!keyword) return showAlert("Please enter keywords");
  switchPage('search');
  const container = document.getElementById('search-results');
  container.innerHTML = `<div class="col-span-full py-20 text-center"><i class="fa fa-spinner fa-spin text-3xl text-brown"></i></div>`;

  try {
    const filters = {
      priceRange: document.getElementById('price-filter')?.value,
      language: document.getElementById('language-filter')?.value,
      sortBy: document.getElementById('sort-filter')?.value
    };
    const books = await searchBooksAPI(keyword, filters);
    allBooks = books;
    container.innerHTML = books.length ? books.map(b => bookCardTemplate(b)).join('') : '';
    document.getElementById('no-results').classList.toggle('hidden', books.length > 0);
    bindDynamicEvents();
  } catch (e) {
    showAlert("Search failed");
  }
}

// ========== 收藏逻辑 (API 驱动) ==========

async function toggleFavorite(isbn) {
  const isbnStr = String(isbn);
  const isCurrentlyFav = favorites.some(f => String(f.isbn) === isbnStr);
  const bookInCache = allBooks.find(b => String(b.isbn) === isbnStr);

  try {
    if (isCurrentlyFav) {
      await removeFavoriteAPI(isbnStr);
      favorites = favorites.filter(f => String(f.isbn) !== isbnStr);
      if (bookInCache) bookInCache.favCount = Math.max(0, (bookInCache.favCount || 0) - 1);
    } else {
      await addFavoriteAPI(isbnStr);
      const bookToStore = bookInCache || { isbn: isbnStr, title: 'Book' };
      favorites.push(bookToStore);
      if (bookInCache) bookInCache.favCount = (bookInCache.favCount || 0) + 1;
    }

    const newCount = bookInCache ? bookInCache.favCount : null;
    updateFavoriteUIState(isbnStr, !isCurrentlyFav, newCount);
    showAlert(isCurrentlyFav ? "Removed from Favorites" : "Added to Favorites", "success");

    if (!document.getElementById('favorites-page').classList.contains('hidden')) {
      updateFavoritesUI();
    }
  } catch (e) {
    console.error("[Favorite Error]", e);
    showAlert("Action failed. Please try again.", "error");
  }
}

function updateFavoriteUIState(isbn, isAdded, count) {
  const isbnStr = String(isbn);
  document.querySelectorAll(`.favorite-btn[data-isbn="${isbnStr}"] i`).forEach(icon => {
    icon.className = isAdded ? 'fa fa-heart text-red-500' : 'fa fa-heart-o text-xl';
  });
  if (count !== null) {
    document.querySelectorAll(`.fav-count-display[data-isbn="${isbnStr}"]`).forEach(el => {
      el.textContent = count;
    });
  }
  const detailIsbn = document.getElementById('detail-book-isbn')?.textContent;
  if (detailIsbn === isbnStr) {
    const detailFavBtnIcon = document.querySelector('#add-to-favorite i');
    const detailFavCount = document.getElementById('detail-fav-count');
    if (detailFavBtnIcon) detailFavBtnIcon.className = isAdded ? 'fa fa-heart text-red-500' : 'fa fa-heart-o text-xl';
    if (detailFavCount && count !== null) detailFavCount.textContent = count.toLocaleString();
  }
}

// ========== 购物车逻辑 (API 计价) ==========

function addToCart(bookId) {
  const book = allBooks.find(b => b.id === parseInt(bookId));
  if (!book) return;

  if (book.stock <= 0) {
    return showAlert("Sorry, this book is out of stock.", "warning");
  }

  const existing = cart.find(i => i.id === book.id);
  if (existing) {
    if (existing.quantity >= book.stock) {
      return showAlert(`Only ${book.stock} copies available.`, "info");
    }
    existing.quantity++;
  } else {
    cart.push({ ...book, quantity: 1 });
  }

  localStorage.setItem('bookCart', JSON.stringify(cart));
  updateCartUI();
  showAlert(`Added ${book.title} to cart`);
}

async function updateCartUI() {
  const cartList = document.getElementById('cart-list');
  const cartTotal = document.getElementById('cart-total');
  const countEls = [document.getElementById('cart-count'), document.getElementById('cart-quick-count')];

  const totalQty = cart.reduce((s, i) => s + i.quantity, 0);
  countEls.forEach(el => { if (el) el.textContent = totalQty });

  if (!cartList) return;
  if (cart.length === 0) {
    document.getElementById('cart-empty').classList.remove('hidden');
    cartList.classList.add('hidden');
    document.getElementById('cart-footer').classList.add('hidden');
    return;
  }

  document.getElementById('cart-empty').classList.add('hidden');
  cartList.classList.remove('hidden');
  document.getElementById('cart-footer').classList.remove('hidden');

  try {
    const apiItems = cart.map(i => ({ sku_id: i.id, quantity: i.quantity }));
    const result = await calculateCartTotalAPI(apiItems);

    cartList.innerHTML = result.data.items.map(item => {
      const fullBookData = cart.find(i => i.id === item.sku_id) || item;
      return `
        <div class="flex items-center justify-between p-4 bg-white border-b border-brown-light/30 rounded-lg shadow-sm mb-3">
          <div class="flex flex-col flex-1 cursor-pointer hover:opacity-70" 
              onclick='showBookDetail(${JSON.stringify(fullBookData).replace(/'/g, "&apos;")})'>
            <h4 class="font-bold text-brown-dark">${item.title}</h4>
            <p class="text-sm text-gray-600">${item.author}</p>
            <p class="text-[10px] text-brown/60 italic"><i class="fa fa-map-marker"></i> ${fullBookData.storeName || 'Store'}</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="flex items-center border border-brown-light rounded-full">
              <button class="cart-op p-1 w-8 h-8" data-id="${item.sku_id}" data-op="minus">-</button>
              <span class="px-2">${item.quantity}</span>
              <button class="cart-op p-1 w-8 h-8" data-id="${item.sku_id}" data-op="plus">+</button>
            </div>
            <span class="font-bold text-red-600 w-20 text-right">¥${item.total.toFixed(2)}</span>
            <button class="cart-op text-gray-400 hover:text-red-500" data-id="${item.sku_id}" data-op="remove"><i class="fa fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');

    cartTotal.textContent = `¥${result.data.total.toFixed(2)}`;
  } catch (e) {
    // 容错处理：如果计价接口失败，依然显示列表，让用户能删除物品
    console.error("Cart Pricing Error:", e);
    cartList.innerHTML = `<p class="text-center py-5 text-orange-500">Pricing sync failed. You can still modify items.</p>` + 
      cart.map(item => `
        <div class="flex items-center justify-between p-4 bg-gray-50 mb-2 rounded">
          <span>${item.title} (x${item.quantity})</span>
          <button class="cart-op text-red-500" data-id="${item.id}" data-op="remove">Remove</button>
        </div>
      `).join('');
  }
}

// ========== 订单与结算 (API 驱动) ==========

async function handleCheckout() {
  if (cart.length === 0) return showAlert("Your cart is empty");
  const btn = document.getElementById('proceed-checkout');
  const originalText = btn.textContent;
  btn.disabled = true;
  btn.innerHTML = `<i class="fa fa-spinner fa-spin"></i> Processing...`;

  try {
    const res = await createOrderAPI(cart);
    if (res.success || res.data) {
      cart = [];
      localStorage.setItem('bookCart', JSON.stringify(cart));
      updateCartUI();
      showAlert("Order created successfully!");
      if (typeof switchPage === 'function') switchPage('orders');
    } else {
      showAlert(res.message || "Server refused to create order.");
    }
  } catch (error) {
    showAlert("Checkout failed: " + error.message);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

function openPaymentModal(orderIds) {
  pendingPayIds = Array.isArray(orderIds) ? orderIds : [orderIds];
  const modal = document.getElementById('payment-modal');
  const summaryList = document.getElementById('payment-summary-list');
  const totalDisplay = document.getElementById('payment-modal-total');

  if (!modal) return;
  const selectedOrders = ordersCache.filter(o => pendingPayIds.includes(o.orderId.toString()));
  const totalAmount = selectedOrders.reduce((sum, o) => sum + o.total, 0);

  if (summaryList) {
    summaryList.innerHTML = selectedOrders.map(o => `
            <div class="flex justify-between text-sm py-1">
                <span class="text-gray-500">Order #${o.orderId}</span>
                <span class="font-medium text-brown">¥${o.total.toFixed(2)}</span>
            </div>
        `).join('');
  }
  if (totalDisplay) totalDisplay.textContent = `¥${totalAmount.toFixed(2)}`;
  modal.classList.remove('hidden');
}

async function renderOrdersUI(filterStatus = 'all') {
  const list = document.getElementById('orders-list');
  if (!list) return;
  list.innerHTML = `<div class="text-center py-10"><i class="fa fa-spinner fa-spin text-2xl text-brown"></i></div>`;

  try {
    const orders = await fetchOrders(filterStatus);
    ordersCache = orders;
    if (orders.length === 0) {
      list.innerHTML = `<p class="text-center py-20 text-gray-400">No orders found.</p>`;
      document.getElementById('orders-footer')?.classList.add('hidden');
      return;
    }
    document.getElementById('orders-footer')?.classList.remove('hidden');
    list.innerHTML = orders.map(order => renderOrderCard(order)).join('');
    updateOrderFooterUI();
  } catch (e) {
    list.innerHTML = `<p class="text-center text-red-500">Failed to load orders.</p>`;
  }
}

function renderOrderCard(order) {
  const statusMap = {
    'created': { text: 'Pending', class: 'bg-orange-100 text-orange-700' },
    'paid': { text: 'Paid', class: 'bg-green-100 text-green-700' },
    'cancelled': { text: 'Cancelled', class: 'bg-red-100 text-red-700' }
  };
  const st = statusMap[order.status] || statusMap.created;

  return `
    <div class="border border-brown-light/20 rounded-xl p-5 shadow-sm bg-white mb-4">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center gap-3">
          <input type="checkbox" class="order-checkbox w-5 h-5 accent-brown" 
            ${order.status !== 'created' ? 'disabled' : ''} data-id="${order.orderId}">
          <span class="text-xs font-bold text-gray-400">ID: ${order.orderId}</span>
        </div>
        <span class="px-3 py-1 rounded-full text-xs font-bold ${st.class}">${st.text}</span>
      </div>
      <div class="flex justify-between items-end border-t pt-4">
        <span class="text-gray-500 text-sm">${new Date(order.date).toLocaleDateString()}</span>
        <div class="flex items-center gap-3">
          <span class="text-lg font-bold text-brown">¥${order.total.toFixed(2)}</span>
          ${order.status === 'created' ? `<button onclick="openPaymentModal(['${order.orderId}'])" class="bg-brown text-white px-4 py-1.5 rounded-lg text-sm">Pay</button>` : ''}
        </div>
      </div>
    </div>`;
}

function openProfileModal() {
  const user = JSON.parse(localStorage.getItem('current_user') || '{}');
  document.getElementById('profile-username').value = user.username || '';
  document.getElementById('profile-email').value = user.email || 'customer@example.com';
  document.getElementById('profile-password').value = '';
  document.getElementById('profile-modal').classList.remove('hidden');
}

async function updateMemberPageUI() {
  try {
    const info = await fetchMemberInfo();
    const tiers = await fetchMemberTiers();
    document.getElementById('display-user-name').textContent = info.username;
    document.getElementById('member-total-spent').textContent = `¥${info.totalSpent.toFixed(2)}`;
    document.getElementById('member-points').textContent = info.points.toLocaleString();
    document.getElementById('member-level-badge').textContent = info.tier.name;
    document.getElementById('member-discount-text').textContent = `${info.tier.discountPercent}%`;
    const tierContainer = document.getElementById('member-tier-cards');
    if (tierContainer) {
      tierContainer.innerHTML = tiers.map(t => `
        <div class="p-4 border-2 rounded-xl ${info.tier.tierId === t.tierId ? 'border-brown bg-brown/5' : 'border-gray-100 opacity-60'}">
          <h4 class="font-bold text-brown-dark">${t.name}</h4>
          <p class="text-xs text-gray-500 mt-1">Spend ¥${t.minTotalSpent}+</p>
          <div class="mt-3 text-sm font-medium text-brown">${t.discountPercent}% OFF</div>
        </div>
      `).join('');
    }
  } catch (e) {
    showAlert("Failed to load member info");
  }
}

// ========== 事件绑定系统 ==========

function bindEvents() {
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('-translate-x-full');
  });

  document.addEventListener('click', (e) => {
    // A. 侧边栏菜单点击
    const sidebarItem = e.target.closest('.sidebar-item');
    if (sidebarItem) {
        const targetPage = sidebarItem.dataset.page;
        if (typeof switchPage === 'function') switchPage(targetPage);
        return;
    }

    // B. 修复购物车图标点击：
    // 逻辑：点击带 .fa-shopping-cart 的图标，或者 ID 包含 cart 的按钮
    const cartTrigger = e.target.closest('.fa-shopping-cart, [id*="cart"], [class*="cart"]');
    if (cartTrigger) {
        // 排除掉“加入购物车”按钮本身，只处理跳转按钮
        if (!cartTrigger.classList.contains('addCartBtn') && !cartTrigger.classList.contains('cart-op')) {
            console.log("[Navigation] Jumping to cart...");
            if (typeof switchPage === 'function') switchPage('cart');
            return;
        }
    }

    // C. 资料与退出
    if (e.target.closest('.fa-user-circle-o, #profile-trigger')) openProfileModal();
    if (e.target.closest('#logout-btn')) logout();
  });

  // 【新增】个人资料弹窗关闭监听
  document.querySelectorAll('.close-profile').forEach(btn => {
    btn.onclick = () => document.getElementById('profile-modal').classList.add('hidden');
  });

  // 【新增】购物车内操作的事件委托 (处理动态生成的加减按钮)
  document.getElementById('cart-list')?.addEventListener('click', (e) => {
    const btn = e.target.closest('.cart-op');
    if (!btn) return;

    const bookId = parseInt(btn.dataset.id);
    const op = btn.dataset.op;
    const itemIndex = cart.findIndex(i => i.id === bookId);
    if (itemIndex === -1) return;

    if (op === 'plus') {
      cart[itemIndex].quantity++;
    } else if (op === 'minus') {
      if (cart[itemIndex].quantity > 1) cart[itemIndex].quantity--;
      else if (confirm("Remove item?")) cart.splice(itemIndex, 1);
    } else if (op === 'remove') {
      cart.splice(itemIndex, 1);
    }
    localStorage.setItem('bookCart', JSON.stringify(cart));
    updateCartUI();
  });

  document.getElementById('do-search-btn')?.addEventListener('click', () => {
    searchBooks(document.getElementById('search-input').value.trim());
  });

  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.category-btn').forEach(b => {
        b.classList.remove('bg-brown', 'text-white');
        b.classList.add('bg-white', 'text-brown', 'border', 'border-brown');
      });
      btn.classList.remove('bg-white', 'text-brown');
      btn.classList.add('bg-brown', 'text-white');
      renderCategoryBooks(btn.dataset.category);
    };
  });

  document.getElementById('category-sort-filter')?.addEventListener('change', () => {
    const cat = document.querySelector('.category-btn.bg-brown')?.dataset.category || 'all';
    renderCategoryBooks(cat);
  });

  document.getElementById('clear-cart')?.addEventListener('click', () => {
    if (confirm("Clear cart?")) { cart = []; localStorage.removeItem('bookCart'); updateCartUI(); }
  });

  document.getElementById('proceed-checkout')?.addEventListener('click', handleCheckout);

  document.getElementById('select-all-orders')?.addEventListener('change', (e) => {
    document.querySelectorAll('.order-checkbox:not(:disabled)').forEach(cb => cb.checked = e.target.checked);
    updateOrderFooterUI();
  });

  document.querySelectorAll('.order-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-status-btn').forEach(b => {
        b.className = "order-status-btn bg-white text-brown border border-brown px-4 py-2 rounded-full text-sm hover:bg-brown-light/20 transition-colors";
      });
      btn.className = "order-status-btn bg-brown text-white px-4 py-2 rounded-full text-sm hover:bg-brown-dark transition-colors";
      renderOrdersUI(btn.dataset.status);
    });
  });

  document.querySelectorAll('.close-payment').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('payment-modal').classList.add('hidden');
    });
  });

  document.getElementById('confirm-payment-btn')?.addEventListener('click', handlePaymentExecution);

  document.getElementById('merge-payment-btn')?.addEventListener('click', () => {
    const selectedIds = Array.from(document.querySelectorAll('.order-checkbox:checked'))
      .map(cb => cb.dataset.id);
    if (selectedIds.length > 0) openPaymentModal(selectedIds);
  });
}

function bindDynamicEvents() {
  document.querySelectorAll('.book-card-item').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('.addCartBtn, .favorite-btn')) return;
      const isbn = card.dataset.isbn;
      if (window.openBookDetail) window.openBookDetail(isbn);
    };
  });
  document.querySelectorAll('.addCartBtn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); addToCart(btn.dataset.id); };
  });
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); toggleFavorite(btn.dataset.isbn); };
  });
}

// ========== 辅助功能 ==========

function updateOrderFooterUI() {
  const selected = Array.from(document.querySelectorAll('.order-checkbox:checked')).map(cb => cb.dataset.id);
  const selectedOrders = ordersCache.filter(o => selected.includes(o.orderId.toString()));
  const total = selectedOrders.reduce((s, o) => s + o.total, 0);
  if (document.getElementById('selected-orders-count')) document.getElementById('selected-orders-count').textContent = selected.length;
  if (document.getElementById('combined-total-price')) document.getElementById('combined-total-price').textContent = `¥${total.toFixed(2)}`;
  if (document.getElementById('merge-payment-btn')) document.getElementById('merge-payment-btn').disabled = selected.length === 0;
}

async function handlePaymentExecution() {
  const btn = document.getElementById('confirm-payment-btn');
  const spinner = document.getElementById('pay-spinner');
  const btnText = document.getElementById('pay-btn-text');
  btn.disabled = true;
  spinner?.classList.remove('hidden');
  if (btnText) btnText.textContent = "Processing...";
  try {
    await payMultipleOrdersAPI(pendingPayIds);
    document.getElementById('payment-modal').classList.add('hidden');
    showAlert("Payment Successful!");
    renderOrdersUI();
  } catch (e) {
    showAlert("Payment failed: " + e.message);
  } finally {
    btn.disabled = false;
    spinner?.classList.add('hidden');
    if (btnText) btnText.textContent = "Confirm Payment";
  }
}

window.customerSwitchPage = function (pageId) {
  if (pageId === 'favorites') updateFavoritesUI();
  if (pageId === 'member') updateMemberPageUI();
  if (pageId === 'orders') renderOrdersUI();
};

async function updateFavoritesUI() {
  const container = document.getElementById('favorites-list');
  if (!container) return;
  container.innerHTML = `<div class="col-span-full py-20 text-center"><i class="fa fa-spinner fa-spin text-3xl text-brown"></i></div>`;
  try {
    const data = await fetchFavorites();
    favorites = Array.isArray(data) ? data : [];
    if (favorites.length === 0) {
      container.innerHTML = `<div class="col-span-full text-center py-20"><p class="text-gray-400">No favorites yet.</p></div>`;
      return;
    }
    container.innerHTML = favorites.map(book => bookCardTemplate(book)).join('');
    bindDynamicEvents();
  } catch (e) {
    container.innerHTML = `<p class="col-span-full text-center text-red-500 py-10">Failed to load favorites.</p>`;
  }
}

function showAlert(message) {
  let alertElement = document.getElementById('customAlert');
  if (!alertElement) {
    alertElement = document.createElement('div');
    alertElement.id = 'customAlert';
    alertElement.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-brown-dark text-white px-6 py-3 rounded-lg shadow-lg z-[100] transition-all duration-300 opacity-0 pointer-events-none';
    alertElement.innerHTML = '<span id="alertText"></span>';
    document.body.appendChild(alertElement);
  }
  const text = document.getElementById('alertText');
  text.textContent = message;
  alertElement.classList.replace('opacity-0', 'opacity-100');
  setTimeout(() => alertElement.classList.replace('opacity-100', 'opacity-0'), 3000);
}

document.addEventListener('click', (e) => {
  // 查找被点击的元素是否在书籍卡片内
  const card = e.target.closest('.book-card-item');
  
  // 核心判断：
  // 1. 必须点中了卡片 
  // 2. 不能是点中了卡片里的“+ Cart”按钮
  // 3. 不能是点中了卡片里的“心形收藏”按钮
  if (card && !e.target.closest('.addCartBtn, .favorite-btn')) {
    const isbn = card.getAttribute('data-isbn');
    console.log("[Detail] Card clicked, ISBN:", isbn);
    
    if (window.openBookDetail) {
      window.openBookDetail(isbn);
    } else {
      // 如果报错说没定义，说明 book-detail.js 里的函数没挂载到全局
      console.error("Function openBookDetail not found! Check book-detail.js");
    }
  }
});