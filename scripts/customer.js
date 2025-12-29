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
  const isOutOfStock = book.stock <= 0;

  return `
    <div class="book-card-item bg-white rounded-xl shadow-sm border border-brown-light/20 hover:shadow-md transition-all duration-300 group cursor-pointer" 
        data-id="${book.id}" data-isbn="${book.isbn}">
      <div class="p-5">
        <div class="flex justify-between items-start gap-2 mb-2">
          <h3 class="font-bold text-lg text-brown-dark line-clamp-2 flex-1">${book.title}</h3>
          <div class="flex flex-col items-center">
             <button class="favorite-btn text-gray-400 hover:text-red-500 transition-colors" data-isbn="${book.isbn}">
                <i class="fa ${isFav ? 'fa-heart text-red-500' : 'fa-heart-o'} text-xl"></i>
             </button>
             <span class="fav-count-display text-[10px] mt-1 text-gray-400" data-isbn="${book.isbn}">${book.favCount || 0}</span>
          </div>
        </div>
        <div class="text-sm text-gray-600 mb-3 space-y-1">
          <p><span class="font-medium">Author:</span> ${book.author}</p>
          <p><span class="font-medium">Store:</span> ${book.storeName}</p>
          <!-- 还原库存实时显示 -->
          <p class="text-[10px] ${isOutOfStock ? 'text-red-500 font-bold' : 'text-green-600'}">
            <i class="fa ${isOutOfStock ? 'fa-times-circle' : 'fa-check-circle'}"></i> 
            ${isOutOfStock ? 'Out of Stock' : `In Stock: ${book.stock}`}
          </p>
        </div>
        <p class="text-xs text-gray-500 line-clamp-3 mb-4 italic">"${book.description || 'No introduction.'}"</p>
        <div class="flex items-center justify-between pt-4 border-t border-brown-light/10">
          <span class="text-xl font-bold text-brown">¥${book.price.toFixed(2)}</span>
          <!-- 仅针对按钮做禁用处理，不影响卡片点击详情 -->
          <button class="addCartBtn ${isOutOfStock ? 'bg-gray-300 cursor-not-allowed' : 'bg-brown hover:bg-brown-dark'} text-white px-4 py-1.5 rounded-full text-sm flex items-center gap-2"
               data-id="${book.id}" ${isOutOfStock ? 'disabled' : ''}>
            <i class="fa ${isOutOfStock ? 'fa-ban' : 'fa-plus'}"></i> Cart
          </button>
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
  // 确保 isbn 是字符串
  const isbnStr = String(isbn);
  const book = allBooks.find(b => String(b.isbn) === isbnStr);

  const isFav = favorites.some(f => String(f.isbn) === isbnStr);

  try {
    if (isFav) {
      await removeFavoriteAPI(isbnStr);
      favorites = favorites.filter(f => String(f.isbn) !== isbnStr);
      if (book) book.favCount = Math.max(0, (book.favCount || 0) - 1);
    } else {
      await addFavoriteAPI(isbnStr);
      // 如果 book 不在当前缓存中，构造一个简易对象
      favorites.push(book || { isbn: isbnStr });
      if (book) book.favCount = (book.favCount || 0) + 1;
    }

    // 关键点：强制触发 UI 状态刷新
    updateFavoriteUIState(isbnStr, !isFav, book ? book.favCount : null);

    // 如果在收藏页面，则重新渲染整个列表
    if (!document.getElementById('favorites-page').classList.contains('hidden')) {
      updateFavoritesUI();
    }
  } catch (e) {
    showAlert("Action failed: Member session may be expired.");
  }
}

// 增强选择器鲁棒性
function updateFavoriteUIState(isbn, isAdded, count) {
  const isbnStr = String(isbn);
  // 更新列表页所有匹配的按钮
  document.querySelectorAll(`.favorite-btn[data-isbn="${isbnStr}"] i`).forEach(icon => {
    icon.className = isAdded ? 'fa fa-heart text-red-500' : 'fa fa-heart-o text-xl';
  });

  // 更新数字显示
  if (count !== null) {
    document.querySelectorAll(`.fav-count-display[data-isbn="${isbnStr}"]`).forEach(el => {
      el.textContent = count;
    });
  }

  // 同步更新详情弹窗（book-detail.js）里的图标
  const detailFavBtn = document.querySelector('#add-to-favorite i');
  const detailIsbn = document.getElementById('detail-book-isbn')?.textContent;
  if (detailFavBtn && detailIsbn === isbnStr) {
    detailFavBtn.className = isAdded ? 'fa fa-heart text-red-500' : 'fa fa-heart-o text-xl';
    const detailCount = document.getElementById('detail-fav-count');
    if (detailCount && count !== null) detailCount.textContent = count.toLocaleString();
  }
}

// ========== 购物车逻辑 (API 计价) ==========

function addToCart(bookId) {
  const book = allBooks.find(b => b.id === parseInt(bookId));
  if (!book) return;

  // --- 拦截 1：库存为 0 ---
  if (book.stock <= 0) {
    return showAlert("Sorry, this book is out of stock.", "warning");
  }

  const existing = cart.find(i => i.id === book.id);
  if (existing) {
    // --- 拦截 2：超过库存上限 ---
    if (existing.quantity >= book.stock) {
      return showAlert(`Only ${book.stock} copies available in total.`, "info");
    }
    existing.quantity++;
  } else {
    // 初次加入，记得把 stock 存入 cart 对象方便 UI 校验
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

    // 修改 updateCartUI 内部的模板生成逻辑
    cartList.innerHTML = result.data.items.map(item => {
      // 从本地 cart 或 allBooks 溯源完整对象，确保详情页有数据
      const fullBookData = cart.find(i => i.id === item.sku_id) || item;

      return `
        <div class="flex items-center justify-between p-4 bg-white border-b border-brown-light/30 rounded-lg shadow-sm mb-3">
          <!-- 增加点击区域：点击标题和作者触发详情 -->
          <div class="flex flex-col flex-1 cursor-pointer hover:opacity-70" 
              onclick='showBookDetail(${JSON.stringify(fullBookData).replace(/'/g, "&apos;")})'>
            <h4 class="font-bold text-brown-dark">${item.title}</h4>
            <p class="text-sm text-gray-600">${item.author}</p>
            <!-- 还原店铺显示 -->
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
    cartList.innerHTML = `<p class="text-center py-10 text-red-500">Pricing service unavailable.</p>`;
  }
}

// ========== 订单与结算 (API 驱动) ==========

async function handleCheckout() {
  if (cart.length === 0) return showAlert("Your cart is empty");

  console.log("[Checkout] Starting process with cart:", cart);

  const btn = document.getElementById('proceed-checkout');
  const originalText = btn.textContent;

  // UI 状态进入“处理中”
  btn.disabled = true;
  btn.innerHTML = `<i class="fa fa-spinner fa-spin"></i> Processing...`;

  try {
    const res = await createOrderAPI(cart);
    console.log("[Checkout] API Response Received:", res);

    // 关键修正：如果后端没有传 success，尝试兼容判断 data 是否存在
    if (res.success || res.data) {
      console.log("[Checkout] Success! Clearing cart and switching page.");

      cart = [];
      localStorage.setItem('bookCart', JSON.stringify(cart));
      updateCartUI();

      showAlert("Order created successfully!");

      // 健壮性切换页面：优先使用 customer-api 定义的跳转
      if (typeof switchPage === 'function') {
        switchPage('orders');
      } else if (window.customerSwitchPage) {
        // 尝试触发 layout.js 的钩子
        const ordersTab = document.querySelector('.sidebar-item[data-page="orders"]');
        ordersTab ? ordersTab.click() : (window.location.hash = 'orders');
      }
    } else {
      console.warn("[Checkout] API returned success=false:", res.message);
      showAlert(res.message || "Server refused to create order.");
    }
  } catch (error) {
    console.error("[Checkout] Critical Exception:", error);
    showAlert("Network Error: " + error.message);
  } finally {
    console.log("[Checkout] Process finished.");
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

/**
 * 打开支付弹窗并初始化数据
 * @param {Array|string} orderIds - 订单ID数组或单个ID
 */
function openPaymentModal(orderIds) {
  // 1. 规格化 ID 组
  pendingPayIds = Array.isArray(orderIds) ? orderIds : [orderIds];

  // 2. 获取 DOM 引用
  const modal = document.getElementById('payment-modal');
  const summaryList = document.getElementById('payment-summary-list');
  const totalDisplay = document.getElementById('payment-modal-total');

  if (!modal) return console.error("Payment modal container missing in HTML");

  // 3. 计算选定订单的总金额 (从 ordersCache 溯源)
  const selectedOrders = ordersCache.filter(o => pendingPayIds.includes(o.orderId.toString()));
  const totalAmount = selectedOrders.reduce((sum, o) => sum + o.total, 0);

  // 4. 渲染弹窗内的订单简报
  if (summaryList) {
    summaryList.innerHTML = selectedOrders.map(o => `
            <div class="flex justify-between text-sm py-1">
                <span class="text-gray-500">Order #${o.orderId}</span>
                <span class="font-medium text-brown">¥${o.total.toFixed(2)}</span>
            </div>
        `).join('');
  }

  // 5. 更新总额并显示
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

// ========== 会员与资料 (API 驱动) ==========

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
  // 侧边栏与导航
  document.getElementById('sidebarToggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('-translate-x-full');
  });

  document.addEventListener('click', (e) => {
    const sidebarItem = e.target.closest('.sidebar-item');
    if (sidebarItem) switchPage(sidebarItem.dataset.page);

    const logoutBtn = e.target.closest('#logout-btn');
    if (logoutBtn) logout();

    const profileTrigger = e.target.closest('.fa-user-circle-o');
    if (profileTrigger) openProfileModal();
  });

  // 搜索
  document.getElementById('do-search-btn')?.addEventListener('click', () => {
    searchBooks(document.getElementById('search-input').value.trim());
  });

  // 分类与排序
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => b.classList.replace('bg-brown', 'bg-white'));
      btn.classList.replace('bg-white', 'bg-brown');
      renderCategoryBooks(btn.dataset.category);
    });
  });

  document.getElementById('category-sort-filter')?.addEventListener('change', () => {
    const cat = document.querySelector('.category-btn.bg-brown')?.dataset.category || 'all';
    renderCategoryBooks(cat);
  });

  // 购物车操作
  document.getElementById('clear-cart')?.addEventListener('click', () => {
    if (confirm("Clear cart?")) { cart = []; localStorage.removeItem('bookCart'); updateCartUI(); }
  });

  document.getElementById('proceed-checkout')?.addEventListener('click', handleCheckout);

  // 订单复选框全选
  document.getElementById('select-all-orders')?.addEventListener('change', (e) => {
    document.querySelectorAll('.order-checkbox:not(:disabled)').forEach(cb => cb.checked = e.target.checked);
    updateOrderFooterUI();
  });

  // 订单页状态切换
  document.querySelectorAll('.order-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // 1. 还原所有按钮为初始“未选中”状态
      document.querySelectorAll('.order-status-btn').forEach(b => {
        b.className = "order-status-btn bg-white text-brown border border-brown px-4 py-2 rounded-full text-sm hover:bg-brown-light/20 transition-colors";
      });

      // 2. 设置当前按钮为“选中”状态（深色背景，白色文字）
      btn.className = "order-status-btn bg-brown text-white px-4 py-2 rounded-full text-sm hover:bg-brown-dark transition-colors";

      // 3. 执行过滤
      renderOrdersUI(btn.dataset.status);
    });
  });

  // 支付弹窗控制 
  // 关闭弹窗
  document.querySelectorAll('.close-payment').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('payment-modal').classList.add('hidden');
    });
  });

  // 确认支付按钮
  document.getElementById('confirm-payment-btn')?.addEventListener('click', handlePaymentExecution);

  // 合并支付按钮 (订单页底部)
  document.getElementById('merge-payment-btn')?.addEventListener('click', () => {
    const selectedIds = Array.from(document.querySelectorAll('.order-checkbox:checked'))
      .map(cb => cb.dataset.id);
    if (selectedIds.length > 0) openPaymentModal(selectedIds);
  });
}

// 动态渲染内容的事件委托 (处理卡片点击、收藏、购物车按钮)
function bindDynamicEvents() {
  // 注意：这里由于 DOM 结构，我们使用委托或直接绑定。
  // 为了确保 book-detail 能正常弹出，这里保留 bindBookCardClickEvents 逻辑。
  document.querySelectorAll('.book-card-item').forEach(card => {
    card.onclick = (e) => {
      if (e.target.closest('.addCartBtn, .favorite-btn')) return;
      const book = allBooks.find(b => b.id === parseInt(card.dataset.id));
      if (book) showBookDetail(book);
    };
  });

  document.querySelectorAll('.addCartBtn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); addToCart(btn.dataset.id); };
  });

  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); toggleFavorite(btn.dataset.isbn); };
  });

  // 购物车加减逻辑
  document.querySelectorAll('.cart-op').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id);
      const op = btn.dataset.op;
      const idx = cart.findIndex(i => i.id === id);
      if (idx === -1) return;

      if (op === 'plus') {
        // 获取当前项的库存限制
        const bookInCart = cart[idx];
        if (bookInCart.quantity < bookInCart.stock) {
          bookInCart.quantity++;
        } else {
          showAlert(`Reached maximum stock limit (${bookInCart.stock})`);
          return; // 阻止后续逻辑
        }
      }
      else if (op === 'minus' && cart[idx].quantity > 1) cart[idx].quantity--;
      else if (op === 'remove' || (op === 'minus' && cart[idx].quantity === 1)) cart.splice(idx, 1);

      localStorage.setItem('bookCart', JSON.stringify(cart));
      updateCartUI();
    };
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
  const spinner = document.getElementById('pay-spinner'); // 对齐 HTML
  const btnText = document.getElementById('pay-btn-text'); // 对齐 HTML

  btn.disabled = true;
  spinner?.classList.remove('hidden');
  if (btnText) btnText.textContent = "Processing...";

  try {
    await payMultipleOrdersAPI(pendingPayIds);
    // --- 修正点：支付成功后必须隐藏弹窗并刷新列表 ---
    document.getElementById('payment-modal').classList.add('hidden');
    showAlert("Payment Successful!");
    renderOrdersUI(); // 重新加载订单列表以更新状态为 Paid
  } catch (e) {
    showAlert("Payment failed: " + e.message);
  } finally {
    btn.disabled = false;
    spinner?.classList.add('hidden');
    if (btnText) btnText.textContent = "Confirm Payment";
  }
}

// 路由钩子增强 (由 layout.js 调用)
window.customerSwitchPage = function (pageId) {
  if (pageId === 'favorites') updateFavoritesUI();
  if (pageId === 'member') updateMemberPageUI();
  if (pageId === 'orders') renderOrdersUI();
};

async function updateFavoritesUI() {
  const container = document.getElementById('favorites-list');
  if (!container) return;
  // 直接从 API 同步
  await App.syncFavorites();
  container.innerHTML = favorites.length ? favorites.map(b => bookCardTemplate(b)).join('') : '<p class="col-span-full text-center">No favorites yet.</p>';
  bindDynamicEvents();
}