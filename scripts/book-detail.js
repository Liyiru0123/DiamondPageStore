// scripts/book-detail.js

let currentBook = null;
let elements = {};

/**
 * 统一获取 DOM 元素
 */
function getElements() {
  elements = {
    overlay: document.getElementById('detail-overlay'),
    modal: document.getElementById('book-detail-modal'),
    closeBtn: document.getElementById('close-detail'),
    addToCartBtn: document.getElementById('add-to-cart'),
    addToFavoriteBtn: document.getElementById('add-to-favorite'),

    title: document.getElementById('detail-book-title'),
    author: document.getElementById('detail-book-author'),
    price: document.getElementById('detail-book-price'),
    favCount: document.getElementById('detail-fav-count'),
    store: document.getElementById('detail-store-name'),
    binding: document.getElementById('detail-binding'),
    stock: document.getElementById('detail-book-stock'),
    category: document.getElementById('detail-book-category'),
    publisher: document.getElementById('detail-book-publisher'),
    language: document.getElementById('detail-book-language'),
    isbn: document.getElementById('detail-book-isbn'),
    desc: document.getElementById('detail-book-desc'),
  };
}

/**
 * 核心修改：直接接收从 customer.js 传来的完整数据对象
 */
function showBookDetail(bookData) {
  if (!bookData) return;

  // 确保 DOM 元素已初始化
  if (!elements.modal) getElements();

  console.log("[Detail] Directly rendering local data for:", bookData.title);

  // 1. 设置当前操作的书籍引用
  currentBook = bookData;

  // 2. 执行渲染（因为是本地数据，无需 await）
  renderBookDetail(bookData);

  // 3. 打开 UI 动画
  openModalUI();
}

function renderBookDetail(book) {
  if (!elements.title) return;

  // 基础字段填充 (利用 customer.js 中已经存在的字段名)
  elements.title.textContent = book.title || 'Unknown Title';
  elements.author.textContent = book.author_name || book.author || 'Unknown Author';
  elements.price.textContent = `￡${Number(book.price || 0).toFixed(2)}`;
  
  // 收藏数渲染
  const fCount = book.fav_count !== undefined ? book.fav_count : (book.favCount || 0);
  elements.favCount.textContent = fCount.toLocaleString();
  
  elements.store.textContent = book.storeName || book.store_name || 'Unknown Store';
  elements.isbn.textContent = book.isbn;

  // 详情字段
  elements.binding.textContent = book.binding || 'Paperback';
  elements.category.textContent = book.category_name || book.category || 'General';
  elements.publisher.textContent = book.publisher || 'Publisher Info N/A';
  elements.language.textContent = book.language || 'English';
  elements.desc.textContent = book.description || 'No introduction provided.';

  // 库存样式处理 (逻辑与 customer.js 保持一致)
  const stockCount = book.stock_count !== undefined ? book.stock_count : (book.stock || 0);
  if (elements.stock) {
    if (stockCount > 0) {
      elements.stock.innerHTML = `<i class="fa fa-check-circle"></i> In Stock (${stockCount})`;
      elements.stock.className = "text-sm font-bold text-green-600";
    } else {
      elements.stock.innerHTML = `<i class="fa fa-times-circle"></i> Out of Stock`;
      elements.stock.className = "text-sm font-bold text-red-500";
    }
  }

  // 同步收藏按钮的“红心”状态
  updateFavoriteButtonUI(book.isbn);
}

// --- 以下 UI 控制逻辑保持不变 ---

function openModalUI() {
  if (!elements.modal) return;
  elements.overlay.classList.remove('hidden');
  elements.modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => {
    elements.overlay.style.opacity = "1";
    elements.modal.style.opacity = "1";
    elements.modal.style.transform = "translate(-50%, -50%) scale(1)";
  }, 10);
}

function hideBookDetail() {
  if (!elements.modal) return;
  elements.overlay.style.opacity = "0";
  elements.modal.style.opacity = "0";
  elements.modal.style.transform = "translate(-50%, -50%) scale(0.95)";
  setTimeout(() => {
    elements.overlay.classList.add('hidden');
    elements.modal.classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
}

function updateFavoriteButtonUI(isbn) {
  const favBtnIcon = elements.addToFavoriteBtn?.querySelector('i');
  if (!favBtnIcon) return;
  // 访问 customer.js 中的全局 favorites 数组
  const isFavorited = typeof favorites !== 'undefined' && favorites.some(f => String(f.isbn) === String(isbn));
  favBtnIcon.className = isFavorited ? 'fa fa-heart text-red-500 text-xl' : 'fa fa-heart-o text-xl';
}

function init() {
  getElements();
  
  if (elements.closeBtn) elements.closeBtn.onclick = hideBookDetail;
  if (elements.overlay) elements.overlay.onclick = (e) => e.target === elements.overlay && hideBookDetail();
  
  // 购物车点击
  if (elements.addToCartBtn) {
    elements.addToCartBtn.onclick = () => {
      if (currentBook && typeof addToCart === 'function') {
        addToCart(currentBook.id);
        // hideBookDetail(); // 如果你想保持弹窗不关闭可以注释掉
      }
    };
  }

  // 收藏点击
  if (elements.addToFavoriteBtn) {
    elements.addToFavoriteBtn.onclick = () => {
      if (currentBook && typeof toggleFavorite === 'function') {
        toggleFavorite(currentBook.isbn);
        // 注意：toggleFavorite 内部会调用 updateFavoriteUIState，
        // 而 updateFavoriteUIState 已经写了处理详情页按钮的逻辑。
      }
    };
  }

  window.showBookDetail = showBookDetail;
  console.log("[Detail] Local-first module initialized.");
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}