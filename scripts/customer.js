// scripts/customer.js

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
  checkAuth(['customer']);
  initCart();
  initFavorites();
  renderDiscountBooks();
  renderCategoryBooks('all');
  bindEvents();
});

// 绑定所有事件
function bindEvents() {
  // 1. 移动端侧边栏开关
  const toggleBtn = document.getElementById('sidebarToggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.getElementById('sidebar').classList.remove('-translate-x-full');
    });
  }

  // 2. 侧边栏导航切换
  document.addEventListener('click', (e) => {
    const sidebarItem = e.target.closest('.sidebar-item');
    if (sidebarItem) {
      const pageId = sidebarItem.getAttribute('data-page');
      if (pageId) {
        switchPage(pageId);
      }
    }
  });

  // 3. 顶部购物车快捷�¥口
  const quickCart = document.getElementById('cart-quick-entry');
  if (quickCart) {
    quickCart.addEventListener('click', () => {
      switchPage('cart');
    });
  }

  // 4. 搜索功能绑定
  const doSearchBtn = document.getElementById('do-search-btn');
  if (doSearchBtn) {
    doSearchBtn.addEventListener('click', () => {
      const keyword = document.getElementById('search-input').value.trim();
      searchBooks(keyword);
    });
  }

  // 5. 热门搜索标签
  document.querySelectorAll('[data-hot]').forEach(tag => {
    tag.addEventListener('click', () => {
      const keyword = tag.getAttribute('data-hot');
      searchBooks(keyword);
    });
  });

  // 6. 分类筛选逻辑
  document.querySelectorAll('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-btn').forEach(b => {
        b.classList.remove('bg-brown', 'text-white', 'shadow-sm');
        b.classList.add('bg-white', 'text-brown', 'border', 'border-brown');
      });
      btn.classList.remove('bg-white', 'text-brown', 'border', 'border-brown');
      btn.classList.add('bg-brown', 'text-white', 'shadow-sm');

      const category = btn.getAttribute('data-category');
      renderCategoryBooks(category);
    });
  });

  // 7. 订单状态筛选
  document.querySelectorAll('.order-status-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.order-status-btn').forEach(b => {
        b.classList.remove('bg-brown', 'text-white');
        b.classList.add('bg-white', 'text-brown', 'border', 'border-brown');
      });
      btn.classList.remove('bg-white', 'text-brown', 'border', 'border-brown');
      btn.classList.add('bg-brown', 'text-white');

      const status = btn.getAttribute('data-status');
      renderOrdersUI(status); // 关键：传�¥状态进行筛选渲染
    });
  });

  // 8. 清空购物车
  const clearBtn = document.getElementById('clear-cart');
  if (clearBtn) clearBtn.addEventListener('click', clearCart);

  // 9. 个人信息弹窗触发 (通过 ID 寻找 layout.js 中生成的头像容器)
  document.addEventListener('click', (e) => {
    if (e.target.closest('.fa-user-circle-o') || e.target.closest('#user-profile-trigger')) {
      openProfileModal();
    }
  });

  // 10. 历史公告触发 (Learn More 按钮)
  const learnMoreBtn = document.querySelector('#home-page button');
  if (learnMoreBtn && learnMoreBtn.textContent.includes('Learn More')) {
    learnMoreBtn.addEventListener('click', openAnnouncements);
  }

  // 11. 弹窗关闭通用逻辑
  document.querySelectorAll('.close-profile, #close-announcement').forEach(btn => {
    btn.onclick = () => {
      document.getElementById('profile-modal').classList.add('hidden');
      document.getElementById('announcement-modal').classList.add('hidden');
    };
  });

  // 12. 个人信息保存
  const profileForm = document.getElementById('profile-form');
  if (profileForm) {
    profileForm.onsubmit = (e) => {
      e.preventDefault();
      saveProfile();
    };
  }

  // 结算按钮绑定
  const checkoutBtn = document.getElementById('proceed-checkout');
  if (checkoutBtn) checkoutBtn.addEventListener('click', handleCheckout);

  // 支付弹窗关闭
  document.querySelectorAll('.close-payment').forEach(btn => {
    btn.onclick = () => document.getElementById('payment-modal').classList.add('hidden');
  });

  // 合并支付按钮
  const mergeBtn = document.getElementById('merge-payment-btn');
  if (mergeBtn) mergeBtn.addEventListener('click', () => openPaymentModal(getSelectedOrderIds()));

  // 确认支付
  const confirmPayBtn = document.getElementById('confirm-payment-btn');
  if (confirmPayBtn) confirmPayBtn.addEventListener('click', handlePaymentExecution);

  // 全选逻辑
  const selectAll = document.getElementById('select-all-orders');
  if (selectAll) {
    selectAll.onchange = (e) => {
      document.querySelectorAll('.order-checkbox').forEach(cb => cb.checked = e.target.checked);
      updateOrderFooterUI();
    };
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  }

  const categorySort = document.getElementById('category-sort-filter');
  if (categorySort) {
    categorySort.addEventListener('change', () => {
      // 获取当前激活的分类按钮
      const activeCategory = document.querySelector('.category-btn.bg-brown')?.getAttribute('data-category') || 'all';
      renderCategoryBooks(activeCategory);
    });
  }
}

/**
 * 核心：页面切换与侧边栏高亮修复
 */
function switchPage(pageId) {
  const pages = document.querySelectorAll('.page-content');
  pages.forEach(page => page.classList.add('hidden'));

  const targetPage = document.getElementById(`${pageId}-page`);
  if (targetPage) {
    targetPage.classList.remove('hidden');
    targetPage.style.opacity = '0';
    setTimeout(() => {
      targetPage.style.transition = 'opacity 0.3s ease';
      targetPage.style.opacity = '1';
    }, 50);

    //执行刷新渲染
    if (pageId === 'favorites') {
      updateFavoritesUI();
    }
    if (pageId === 'member') {
      updateMemberPageUI();
    }
  }

  const sidebarItems = document.querySelectorAll('.sidebar-item');
  sidebarItems.forEach(item => {
    if (item.getAttribute('data-page') === pageId) {
      item.classList.add('sidebar-item-active');
    } else {
      item.classList.remove('sidebar-item-active');
    }
  });

  const sidebar = document.getElementById('sidebar');
  if (window.innerWidth < 768 && sidebar) {
    sidebar.classList.add('-translate-x-full');
  }

  window.scrollTo(0, 0);
}

// 书籍卡片模板 (确保 favCount 实时读取 book 对象)
const bookCardTemplate = (book) => `
  <div class="book-card-item bg-white rounded-xl shadow-sm border border-brown-light/20 hover:shadow-md transition-all duration-300 group cursor-pointer" data-id="${book.id}">
    <div class="p-5">
      <div class="flex justify-between items-start gap-2 mb-2">
        <h3 class="font-bold text-lg text-brown-dark line-clamp-2 flex-1">${book.title}</h3>
        <div class="flex flex-col items-center text-gray-400 group-hover:text-red-500 transition-colors">
           <button class="favorite-btn" data-id="${book.id}">
              <i class="fa ${favorites.some(f => f.id === book.id) ? 'fa-heart text-red-500' : 'fa-heart-o'} text-xl"></i>
           </button>
           <span class="fav-count-display text-[10px] mt-1" data-id="${book.id}">${book.favCount || 0}</span>
        </div>
      </div>
      <div class="text-sm text-gray-600 mb-3 space-y-1">
        <p><span class="font-medium">Author:</span> ${book.author}</p>
        <p><span class="font-medium">Publisher:</span> ${book.publisher}</p>
        <p><span class="font-medium">Language:</span> ${book.language || 'English'}</p>
      </div>
      <p class="text-xs text-gray-500 line-clamp-3 mb-4 italic">
        "${book.description || 'No introduction available.'}"
      </p>
      <div class="flex items-center justify-between pt-4 border-t border-brown-light/10">
        <span class="text-xl font-bold text-brown">¥${book.price.toFixed(2)}</span>
        <button class="addCartBtn bg-brown hover:bg-brown-dark text-white px-4 py-1.5 rounded-full text-sm transition-colors flex items-center gap-2" data-id="${book.id}">
          <i class="fa fa-plus"></i> Cart
        </button>
      </div>
    </div>
  </div>
`;

function renderCategoryBooks(category) {
  const container = document.getElementById('category-books');
  const sortVal = document.getElementById('category-sort-filter')?.value || 'default';
  if (!container) return;

  // 1. 过滤逻辑
  let filteredBooks = category === 'all'
    ? [...mockBooks]
    : mockBooks.filter(book =>
      book.category.toLowerCase().includes(category.toLowerCase())
    );

  // 2. 排序逻辑 (TODO: 待替换为后端�¥口)
  // 此处目前为前端纯逻辑排序
  if (sortVal === 'fav-desc') {
    filteredBooks.sort((a, b) => (b.favCount || 0) - (a.favCount || 0));
  }

  if (filteredBooks.length === 0) {
    container.innerHTML = '<p class="text-center py-10 col-span-full text-gray-500 italic">No books found in this category.</p>';
    return;
  }

  container.innerHTML = filteredBooks.map(bookCardTemplate).join('');

  bindCartAndFavoriteEvents();
  bindBookCardClickEvents();
}

function renderDiscountBooks() {
  // 逻辑同上
}

// 购物车逻辑
let cart = [];
function initCart() {
  const savedCart = localStorage.getItem('bookCart');
  cart = savedCart ? JSON.parse(savedCart) : [];
  updateCartUI();
}

function addToCart(bookId) {
  const book = mockBooks.find(b => b.id === parseInt(bookId));
  if (!book) return;
  const existingItemIndex = cart.findIndex(item => item.id === book.id);
  if (existingItemIndex > -1) {
    cart[existingItemIndex].quantity += 1;
  } else {
    cart.push({ id: book.id, title: book.title, author: book.author, price: book.price, storeName: book.storeName || "Main Headquarters", quantity: 1 });
  }
  localStorage.setItem('bookCart', JSON.stringify(cart));
  updateCartUI();
  showAlert(`${book.title} added to cart`);
}

function updateCartUI() {
  const cartCount = document.getElementById('cart-count');
  const cartQuickCount = document.getElementById('cart-quick-count');
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if (cartCount) cartCount.textContent = totalItemCount;
  if (cartQuickCount) cartQuickCount.textContent = totalItemCount;

  const cartEmpty = document.getElementById('cart-empty');
  const cartList = document.getElementById('cart-list');
  const cartFooter = document.getElementById('cart-footer');

  if (!cartList) return;

  if (cart.length === 0) {
    if (cartEmpty) cartEmpty.classList.remove('hidden');
    cartList.classList.add('hidden');
    if (cartFooter) cartFooter.classList.add('hidden');
    return;
  }

  if (cartEmpty) cartEmpty.classList.add('hidden');
  cartList.classList.remove('hidden');
  if (cartFooter) cartFooter.classList.remove('hidden');

  cartList.innerHTML = cart.map(item => `
    <div class="flex items-center justify-between p-4 bg-white border-b border-brown-light/30 rounded-lg shadow-sm mb-3">
        <div class="flex flex-col flex-1 cursor-pointer book-card-item" data-id="${item.id}">
          <h4 class="font-bold text-brown-dark">${item.title}</h4>
          <p class="text-[10px] text-brown/60 flex items-center gap-1 mt-0.5">
            <i class="fa fa-map-marker"></i> ${item.storeName}
          </p>
          <p class="text-sm text-gray-600">${item.author}</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center border border-brown-light rounded-full">
            <button class="cart-minus p-1 w-8 h-8" data-id="${item.id}">-</button>
            <span class="px-2">${item.quantity}</span>
            <button class="cart-plus p-1 w-8 h-8" data-id="${item.id}">+</button>
          </div>
          <span class="font-bold text-red-600 w-20 text-right">¥${(item.price * item.quantity).toFixed(2)}</span>
          <button class="cart-remove text-gray-400 hover:text-red-500" data-id="${item.id}"><i class="fa fa-trash"></i></button>
        </div>
      </div>
  `).join('');

  const cartTotal = document.getElementById('cart-total');
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  if (cartTotal) cartTotal.textContent = `¥${totalPrice.toFixed(2)}`;

  bindCartItemEvents();
  bindBookCardClickEvents();
}

function bindCartItemEvents() {
  document.querySelectorAll('.cart-minus').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id);
      const item = cart.find(i => i.id === id);
      if (item.quantity > 1) item.quantity--;
      else cart = cart.filter(i => i.id !== id);
      localStorage.setItem('bookCart', JSON.stringify(cart));
      updateCartUI();
    };
  });
  document.querySelectorAll('.cart-plus').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id);
      cart.find(i => i.id === id).quantity++;
      localStorage.setItem('bookCart', JSON.stringify(cart));
      updateCartUI();
    };
  });
  document.querySelectorAll('.cart-remove').forEach(btn => {
    btn.onclick = () => {
      const id = parseInt(btn.dataset.id);
      cart = cart.filter(i => i.id !== id);
      localStorage.setItem('bookCart', JSON.stringify(cart));
      updateCartUI();
    };
  });
}

function clearCart() {
  if (confirm('Clear cart?')) {
    cart = [];
    localStorage.setItem('bookCart', JSON.stringify(cart));
    updateCartUI();
  }
}

// 收藏逻辑 (修复点：数值同�¥与状态持久化)
let favorites = [];
function initFavorites() {
  const saved = localStorage.getItem('bookFavorites');
  favorites = saved ? JSON.parse(saved) : [];
  updateFavoriteButtons();
}

function toggleFavorite(bookId) {
  const id = parseInt(bookId);
  const book = mockBooks.find(b => b.id === id);
  if (!book) return;

  const index = favorites.findIndex(f => f.id === id);
  if (index > -1) {
    // 取消收藏
    favorites.splice(index, 1);
    book.favCount = Math.max(0, (book.favCount || 0) - 1); // 数值即时 -1
    showAlert('Removed from favorites.');
  } else {
    // 添加收藏
    favorites.push(book);
    book.favCount = (book.favCount || 0) + 1; // 数值即时 +1
    showAlert('Added to favorites!');
  }

  // 状态持久化
  localStorage.setItem('bookFavorites', JSON.stringify(favorites));

  // 全局同�¥ UI
  updateFavoriteButtons();

  // 如果当前在收藏页，则刷新列表
  if (!document.getElementById('favorites-page').classList.contains('hidden')) {
    updateFavoritesUI();
  }
}

function updateFavoriteButtons() {
  // 更新页面上所有对应的收藏按钮图标和数值
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const id = parseInt(btn.dataset.id);
    const isFav = favorites.some(f => f.id === id);
    const icon = btn.querySelector('i');
    if (icon) {
      icon.className = isFav ? 'fa fa-heart text-red-500' : 'fa fa-heart-o';
    }
  });

  // 关键：更新页面上所有显示的收藏数值显示器
  document.querySelectorAll('.fav-count-display').forEach(span => {
    const id = parseInt(span.dataset.id);
    const book = mockBooks.find(b => b.id === id);
    if (book) {
      span.textContent = book.favCount || 0;
    }
  });
}

function updateFavoritesUI() {
  const container = document.getElementById('favorites-list');
  if (!container) return;

  if (favorites.length === 0) {
    container.innerHTML = '<p class="col-span-full text-center py-10 text-gray-500">No favorite books yet. Start exploring!</p>';
    return;
  }

  // 使用统一卡片模板，确保样式互通
  container.innerHTML = favorites.map(book => bookCardTemplate(book)).join('');

  // 重新绑定交互互通事件
  bindCartAndFavoriteEvents();
  bindBookCardClickEvents();
}

// 通用绑定
function bindCartAndFavoriteEvents() {
  document.querySelectorAll('.addCartBtn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); addToCart(btn.dataset.id); };
  });
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.onclick = (e) => { e.stopPropagation(); toggleFavorite(btn.dataset.id); };
  });
}

function bindBookCardClickEvents() {
  document.querySelectorAll('.book-card-item').forEach(card => {
    card.onclick = (e) => {
      // 排除掉所有按钮和计数器的点击冒泡
      if (e.target.closest('.addCartBtn') || e.target.closest('.favorite-btn') || e.target.closest('.cart-minus') || e.target.closest('.cart-plus') || e.target.closest('.cart-remove')) {
        return;
      }
      const bookId = parseInt(card.dataset.id);
      const book = mockBooks.find(b => b.id === bookId);
      if (book && typeof showBookDetail === 'function') {
        showBookDetail(book);
      }
    };
  });
}

function showAlert(message) {
  let alertElement = document.getElementById('customAlert');
  if (!alertElement) {
    alertElement = document.createElement('div');
    alertElement.id = 'customAlert';
    alertElement.className = 'fixed top-20 left-1/2 -translate-x-1/2 bg-brown-dark text-white px-6 py-3 rounded-lg shadow-lg z-[100] opacity-0 transition-opacity duration-300 pointer-events-none';
    alertElement.innerHTML = '<span id="alertText"></span>';
    document.body.appendChild(alertElement);
  }
  document.getElementById('alertText').textContent = message;
  alertElement.classList.replace('opacity-0', 'opacity-100');
  setTimeout(() => alertElement.classList.replace('opacity-100', 'opacity-0'), 3000);
}

/**
 * 任务 3.1：结算逻辑
 */
function handleCheckout() {
  if (cart.length === 0) return showAlert("Cart is empty");

  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const newOrder = {
    orderId: 'ORD-' + Date.now().toString().slice(-8),
    items: [...cart],
    total: totalPrice,
    date: new Date().toLocaleString(),
    status: 'created', // 状态：created, paid, cancelled
    cancelReason: null, // 取消原因
    storeName: cart[0].storeName
  };

  let orders = JSON.parse(localStorage.getItem('bookOrders') || '[]');
  orders.unshift(newOrder);
  localStorage.setItem('bookOrders', JSON.stringify(orders));

  cart = [];
  localStorage.setItem('bookCart', JSON.stringify(cart));
  updateCartUI();

  showAlert("Order created! Please pay within 30 minutes.");
  switchPage('orders'); // switchPage 会触发 renderOrdersUI('all')
}

/**
 * 任务 3.2：订单页 UI 渲染
 */
function renderOrdersUI(filterStatus = 'all') {
  console.log(`[Debug] Rendering orders with filter: ${filterStatus}`);
  const list = document.getElementById('orders-list');
  const footer = document.getElementById('orders-footer');

  const allOrders = JSON.parse(localStorage.getItem('bookOrders') || '[]');

  // 执行筛选逻辑
  const filteredOrders = filterStatus === 'all'
    ? allOrders
    : allOrders.filter(o => o.status === filterStatus);

  if (filteredOrders.length === 0) {
    list.innerHTML = `<div class="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <i class="fa fa-file-o text-4xl text-gray-200 mb-3"></i>
            <p class="text-gray-500">No ${filterStatus === 'all' ? '' : filterStatus} orders found.</p>
        </div>`;
    if (footer) footer.classList.add('hidden');
    return;
  }

  if (footer) footer.classList.remove('hidden');

  list.innerHTML = filteredOrders.map(order => {
    // 状态样式映射
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
                            <p class="text-sm text-gray-500">${order.date}</p>
                        </div>
                        <div class="flex flex-col items-end">
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${st.class} flex items-center gap-1">
                                <i class="fa ${st.icon}"></i> ${st.text}
                            </span>
                            ${order.cancelReason ? `<span class="text-[10px] text-red-400 mt-1">Reason: ${order.cancelReason}</span>` : ''}
                        </div>
                    </div>
                    <div class="flex items-center gap-2 mb-4 overflow-x-auto py-1">
                        ${order.items.map(item => `<div class="w-12 h-16 bg-brown-cream rounded border flex-shrink-0 flex items-center justify-center text-[8px] p-1 text-center">${item.title}</div>`).join('')}
                    </div>
                    <div class="flex justify-between items-end border-t border-gray-50 pt-4">
                        <div class="text-xs text-gray-400"><i class="fa fa-map-marker"></i> ${order.storeName}</div>
                        <div class="flex items-center gap-3">
                            <span class="text-lg font-bold text-brown">¥${order.total.toFixed(2)}</span>
                            ${order.status === 'created' ? `
                                <button onclick="handleCancelOrder('${order.orderId}')" class="text-gray-400 hover:text-red-500 text-sm font-medium transition-colors">Cancel</button>
                                <button onclick="openPaymentModal(['${order.orderId}'])" class="bg-brown text-white px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-brown-dark transition-all">Pay Now</button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>`;
  }).join('');
}

function getSelectedOrderIds() {
  return Array.from(document.querySelectorAll('.order-checkbox:checked')).map(cb => cb.dataset.id);
}

function updateOrderFooterUI() {
  const selectedIds = getSelectedOrderIds();
  const orders = JSON.parse(localStorage.getItem('bookOrders') || '[]');
  const selectedOrders = orders.filter(o => selectedIds.includes(o.orderId));

  document.getElementById('selected-orders-count').textContent = selectedIds.length;
  const total = selectedOrders.reduce((sum, o) => sum + o.total, 0);
  document.getElementById('combined-total-price').textContent = `¥${total.toFixed(2)}`;
  document.getElementById('merge-payment-btn').disabled = selectedIds.length === 0;
}

/**
 * 任务 3.3：支付逻辑
 */
let pendingPayIds = [];
function openPaymentModal(orderIds) {
  if (!orderIds || orderIds.length === 0) return;
  pendingPayIds = orderIds;
  const orders = JSON.parse(localStorage.getItem('bookOrders') || '[]');
  const targetOrders = orders.filter(o => orderIds.includes(o.orderId));

  const summaryList = document.getElementById('payment-summary-list');
  summaryList.innerHTML = targetOrders.map(o => `
        <div class="flex justify-between text-sm">
            <span class="text-gray-600">${o.orderId}</span>
            <span class="font-bold">¥${o.total.toFixed(2)}</span>
        </div>
    `).join('');

  const total = targetOrders.reduce((sum, o) => sum + o.total, 0);
  document.getElementById('payment-modal-total').textContent = `¥${total.toFixed(2)}`;
  document.getElementById('payment-modal').classList.remove('hidden');
}

async function handlePaymentExecution() {
  const btnText = document.getElementById('pay-btn-text');
  const spinner = document.getElementById('pay-spinner');

  // UI Loading
  btnText.textContent = 'Processing...';
  spinner.classList.remove('hidden');

  // TODO: 待替换为 payOrderAPI
  // 模拟 1.5s 网络延迟
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 更新本地订单状态
  let orders = JSON.parse(localStorage.getItem('bookOrders') || '[]');
  orders = orders.map(o => {
    if (pendingPayIds.includes(o.orderId)) {
      o.status = 'paid';
    }
    return o;
  });
  localStorage.setItem('bookOrders', JSON.stringify(orders));

  // 完成处理
  document.getElementById('payment-modal').classList.add('hidden');
  btnText.textContent = 'Confirm Payment';
  spinner.classList.add('hidden');

  showAlert("Payment successful!");
  renderOrdersUI();
  updateOrderFooterUI();
}

/**
 * 处理取消订单
 */
function handleCancelOrder(orderId) {
  if (!confirm("Are you sure you want to cancel this order?")) return;

  let orders = JSON.parse(localStorage.getItem('bookOrders') || '[]');
  const orderIndex = orders.findIndex(o => o.orderId === orderId);

  if (orderIndex > -1) {
    orders[orderIndex].status = 'cancelled';
    orders[orderIndex].cancelReason = 'User Cancelled'; // TODO: 可扩展为弹窗选择原因
    localStorage.setItem('bookOrders', JSON.stringify(orders));

    showAlert("Order cancelled.");
    // 获取当前处于激活状态的标签
    const activeStatus = document.querySelector('.order-status-btn.bg-brown')?.dataset.status || 'all';
    renderOrdersUI(activeStatus);
  }
}
/**
 * 任务：会员等级与积分逻辑
 */

// 1. 等级配置表
const MEMBER_TIERS = [
  { level: 'Basic', minSpent: 0, discount: 1.0, icon: 'fa-user-o', color: 'text-gray-400' },
  { level: 'Silver', minSpent: 500, discount: 0.9, icon: 'fa-shield', color: 'text-blue-400' },
  { level: 'Gold', minSpent: 2000, discount: 0.85, icon: 'fa-trophy', color: 'text-yellow-500' },
  { level: 'Diamond', minSpent: 5000, discount: 0.8, icon: 'fa-diamond', color: 'text-purple-500' }
];

// 2. 根据消费金额获取会员信息
function getMemberStatus(totalSpent) {
  let currentTier = MEMBER_TIERS[0];
  for (let i = MEMBER_TIERS.length - 1; i >= 0; i--) {
    if (totalSpent >= MEMBER_TIERS[i].minSpent) {
      currentTier = MEMBER_TIERS[i];
      break;
    }
  }
  return currentTier;
}

// 3. 更新会员中心 UI
function updateMemberPageUI() {
  // TODO: 待替换为获取当前登录用户信息的后端�¥口
  const mockUser = JSON.parse(localStorage.getItem('current_user')) || { name: 'Guest' };
  const orders = JSON.parse(localStorage.getItem('bookOrders') || '[]');

  /**
     * TODO: 待替换为后端�¥口返回对象
     * const response = await fetch('/api/user/profile');
     * const userData = await response.json();
     */
  const userData = {
    userId: 1001,
    username: "ZhangSan",
    totalSpent: 2850.50, // 核心字段：累计消费总额
    points: 2850,        // 核心字段：当前可用积分
    memberLevel: "Gold", // 冗余字段
    nextTierProgress: 150
  };

  // 计算累计消费（仅已支付订单）
  const totalSpent = userData.totalSpent || orders
    .filter(o => o.status === 'paid')
    .reduce((sum, o) => sum + o.total, 0);

  // 积分逻辑：1元 = 1积分
  const points = Math.floor(totalSpent);
  const status = getMemberStatus(totalSpent);

  // 填充数据
  document.getElementById('display-user-name').textContent = mockUser.username || mockUser.name;
  document.getElementById('member-total-spent').textContent = `¥${totalSpent.toFixed(2)}`;
  document.getElementById('member-points').textContent = points.toLocaleString();
  document.getElementById('member-level-badge').textContent = status.level;
  document.getElementById('member-discount-text').textContent = `${Math.round((1 - status.discount) * 100)}%`;

  // 渲染等级卡片
  const tierContainer = document.getElementById('member-tier-cards');
  if (tierContainer) {
    tierContainer.innerHTML = MEMBER_TIERS.map(tier => {
      const isCurrent = status.level === tier.level;
      const isLocked = totalSpent < tier.minSpent;
      return `
                <div class="p-4 border-2 rounded-xl transition-all ${isCurrent ? 'border-brown bg-brown/5 shadow-md' : 'border-gray-100 opacity-60'}">
                    <i class="fa ${tier.icon} ${tier.color} text-2xl mb-2"></i>
                    <h4 class="font-bold text-brown-dark">${tier.level}</h4>
                    <p class="text-xs text-gray-500 mt-1">Spend ¥${tier.minSpent}+</p>
                    <div class="mt-3 pt-3 border-t border-gray-100">
                        <span class="text-sm font-medium text-brown">${Math.round(tier.discount * 100) / 10} 折 Discount</span>
                    </div>
                </div>
            `;
    }).join('');
  }
}

/**
 * 个人信息：打开弹窗并填充数据
 */
function openProfileModal() {
  const user = JSON.parse(localStorage.getItem('current_user') || '{}');
  document.getElementById('profile-username').value = user.username || '';
  document.getElementById('profile-email').value = user.email || 'customer@example.com';
  document.getElementById('profile-password').value = '';
  document.getElementById('profile-modal').classList.remove('hidden');
}

/**
 * 个人信息：保存逻辑
 */
function saveProfile() {
  const newUsername = document.getElementById('profile-username').value;
  const newEmail = document.getElementById('profile-email').value;
  const newPassword = document.getElementById('profile-password').value;

  // 模拟更新本地存储
  const user = JSON.parse(localStorage.getItem('current_user') || '{}');
  user.username = newUsername;
  user.email = newEmail;
  if(newPassword) user.password = newPassword; // 实际场景需加密

  localStorage.setItem('current_user', JSON.stringify(user));
  
  // TODO: 待替换为后端�¥口 updateProfileAPI({userId: user.id, username: newUsername, email: newEmail, password: newPassword})
  
  showAlert("Profile updated successfully!");
  document.getElementById('profile-modal').classList.add('hidden');
  
  // 如果 Header 有显示用户名，此处可触发刷新逻辑
}

/**
 * 历史公告：渲染并展示
 */
function openAnnouncements() {
  const container = document.getElementById('announcement-list');
  const mockAnnouncements = [
    { title: "Autumn Reading Festival", date: "2024-10-01", content: "Gold members enjoy 20% off all selected fiction." },
    { title: "Store System Upgrade", date: "2024-09-15", content: "Our membership system is now upgraded for faster checkout." },
    { title: "New Branch Opening", date: "2024-08-20", content: "Visit our new South Port Store for exclusive opening gifts." }
  ];

  container.innerHTML = mockAnnouncements.map(ann => `
    <div class="p-4 bg-brown-cream/30 border-l-4 border-brown rounded-r-lg">
      <div class="flex justify-between items-center mb-1">
        <h4 class="font-bold text-brown-dark">${ann.title}</h4>
        <span class="text-xs text-gray-500">${ann.date}</span>
      </div>
      <p class="text-sm text-gray-700">${ann.content}</p>
    </div>
  `).join('');

  document.getElementById('announcement-modal').classList.remove('hidden');
}