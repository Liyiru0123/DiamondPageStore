// scripts/book-detail.js

let currentBook = null;

// 1. 先声明对象，但不立即赋值
let elements = {};

/**
 * 核心修复：在这里统一获取 DOM 元素
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

async function showBookDetail(basicBookData) {
  if (!basicBookData) return;
  console.log("[Detail] Showing book:", basicBookData.title);

  // 确保元素已获取
  if (!elements.modal) getElements();

  currentBook = basicBookData;
  renderBookDetail(basicBookData);
  openModalUI();

  if (elements.desc) elements.desc.textContent = "Loading full details...";

  try {
    const fullBookData = await fetchBookDetail(basicBookData.isbn);
    if (fullBookData) {
      currentBook = fullBookData;
      renderBookDetail(fullBookData);
    }
  } catch (error) {
    console.error("Failed to fetch book detail:", error);
    if (elements.desc) elements.desc.textContent = "Detailed description currently unavailable.";
  }
}

function renderBookDetail(book) {
  if (!elements.title) return; // 防错检查

  elements.title.textContent = book.title || 'Unknown Title';
  elements.author.textContent = book.author || book.author_name || 'Unknown Author';
  elements.price.textContent = `¥${Number(book.price || 0).toFixed(2)}`;
  elements.favCount.textContent = (book.fav_count || book.favCount || 0).toLocaleString();
  elements.store.textContent = book.store_name || book.storeName || 'Unknown Store';
  elements.isbn.textContent = book.isbn;

  // 详情字段
  if (elements.binding) elements.binding.textContent = book.binding || 'N/A';
  if (elements.category) elements.category.textContent = book.category_name || book.category || 'General';
  if (elements.publisher) elements.publisher.textContent = book.publisher || 'N/A';
  if (elements.language) elements.language.textContent = book.language || 'N/A';
  if (elements.desc) elements.desc.textContent = book.description || 'No introduction provided.';

  // 动态库存样式处理
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

  updateFavoriteButtonUI(book.isbn);
}

function openModalUI() {
  if (!elements.modal) return;
  
  elements.overlay.classList.remove('hidden');
  elements.modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // 使用 setTimeout 或 requestAnimationFrame 确保 hidden 移除后再触发动画
  setTimeout(() => {
    elements.overlay.style.opacity = "1";
    elements.modal.style.opacity = "1";
    elements.modal.style.transform = "translate(-50%, -50%) scale(1)"; // 配合居中
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
  const isFavorited = typeof favorites !== 'undefined' && favorites.some(f => String(f.isbn) === String(isbn));
  favBtnIcon.className = isFavorited ? 'fa fa-heart text-red-500' : 'fa fa-heart-o';
}

function init() {
  getElements(); // 1. 初始化时先抓取元素
  
  // 2. 绑定事件
  if (elements.closeBtn) elements.closeBtn.onclick = hideBookDetail;
  if (elements.overlay) elements.overlay.onclick = (e) => e.target === elements.overlay && hideBookDetail();
  
  if (elements.addToCartBtn) {
    elements.addToCartBtn.onclick = () => {
      if (currentBook) {
        addToCart(currentBook.id);
        hideBookDetail();
      }
    };
  }

  if (elements.addToFavoriteBtn) {
    elements.addToFavoriteBtn.onclick = () => {
      if (currentBook) {
        toggleFavorite(currentBook.isbn);
        setTimeout(() => updateFavoriteButtonUI(currentBook.isbn), 100);
      }
    };
  }

  // 3. 挂载到全局
  window.showBookDetail = showBookDetail;
  console.log("[Detail] Module Initialized.");
}

// 确保 DOM 加载完成后运行 init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}