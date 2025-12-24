// scripts/customer.js

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
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

  // 3. 顶部购物车快捷入口
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
      const list = document.getElementById('orders-list');
      if(list) {
          list.innerHTML = `<p class="text-gray-600 text-center py-10">No ${status === 'all' ? '' : status} order records</p>`;
      }
    });
  });

  // 8. 清空购物车
  const clearBtn = document.getElementById('clear-cart');
  if (clearBtn) clearBtn.addEventListener('click', clearCart);
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
    
    // 如果切换到收藏页，执行刷新渲染
    if (pageId === 'favorites') {
      updateFavoritesUI();
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
  if(!container) return;

  const filteredBooks = category === 'all' 
    ? mockBooks 
    : mockBooks.filter(book => 
        book.category.toLowerCase().includes(category.toLowerCase())
      );

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
    cart.push({ id: book.id, title: book.title, author: book.author, price: book.price, quantity: 1 });
  }
  localStorage.setItem('bookCart', JSON.stringify(cart));
  updateCartUI();
  showAlert(`${book.title} added to cart`);
}

function updateCartUI() {
  const cartCount = document.getElementById('cart-count');
  const cartQuickCount = document.getElementById('cart-quick-count');
  const totalItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  if(cartCount) cartCount.textContent = totalItemCount;
  if(cartQuickCount) cartQuickCount.textContent = totalItemCount;

  const cartEmpty = document.getElementById('cart-empty');
  const cartList = document.getElementById('cart-list');
  const cartFooter = document.getElementById('cart-footer');

  if (!cartList) return;

  if (cart.length === 0) {
    if(cartEmpty) cartEmpty.classList.remove('hidden');
    cartList.classList.add('hidden');
    if(cartFooter) cartFooter.classList.add('hidden');
    return;
  }

  if(cartEmpty) cartEmpty.classList.add('hidden');
  cartList.classList.remove('hidden');
  if(cartFooter) cartFooter.classList.remove('hidden');

  cartList.innerHTML = cart.map(item => `
    <div class="flex items-center justify-between p-4 bg-white border-b border-brown-light/30 rounded-lg shadow-sm mb-3">
        <div class="flex flex-col flex-1 cursor-pointer book-card-item" data-id="${item.id}">
          <h4 class="font-bold text-brown-dark">${item.title}</h4>
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
  if(cartTotal) cartTotal.textContent = `¥${totalPrice.toFixed(2)}`;

  bindCartItemEvents();
  bindBookCardClickEvents(); 
}

function bindCartItemEvents() {
    document.querySelectorAll('.cart-minus').forEach(btn => {
        btn.onclick = () => {
            const id = parseInt(btn.dataset.id);
            const item = cart.find(i => i.id === id);
            if(item.quantity > 1) item.quantity--;
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
    if(confirm('Clear cart?')) {
        cart = [];
        localStorage.setItem('bookCart', JSON.stringify(cart));
        updateCartUI();
    }
}

// 收藏逻辑 (修复点：数值同步与状态持久化)
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
  
  // 全局同步 UI
  updateFavoriteButtons();
  
  // 如果当前在收藏页，则刷新列表
  if(!document.getElementById('favorites-page').classList.contains('hidden')) {
      updateFavoritesUI();
  }
}

function updateFavoriteButtons() {
  // 更新页面上所有对应的收藏按钮图标和数值
  document.querySelectorAll('.favorite-btn').forEach(btn => {
    const id = parseInt(btn.dataset.id);
    const isFav = favorites.some(f => f.id === id);
    const icon = btn.querySelector('i');
    if(icon) {
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
    if(!container) return;
    
    if(favorites.length === 0) {
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