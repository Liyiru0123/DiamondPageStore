// scripts/book-detail.js

let currentBook = null;

const elements = {
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
  pages: document.getElementById('detail-book-pages'),
  isbn: document.getElementById('detail-book-isbn'),
  desc: document.getElementById('detail-book-desc')
};

function initEventListeners() {
  if (elements.closeBtn) elements.closeBtn.addEventListener('click', hideBookDetail);
  if (elements.overlay) {
    elements.overlay.addEventListener('click', (e) => {
      if (e.target === elements.overlay) hideBookDetail();
    });
  }
  if (elements.addToCartBtn) elements.addToCartBtn.addEventListener('click', handleAddToCart);
  if (elements.addToFavoriteBtn) elements.addToFavoriteBtn.addEventListener('click', handleAddToFavorite);
}

function showBookDetail(bookData) {
  if (!bookData) return;
  currentBook = bookData;
  renderBookDetail(bookData);
  
  elements.overlay.classList.remove('hidden');
  elements.modal.classList.remove('hidden');
  
  requestAnimationFrame(() => {
    elements.overlay.classList.remove('opacity-0');
    elements.overlay.classList.add('opacity-100');
    
    elements.modal.classList.remove('opacity-0', 'scale-95');
    elements.modal.classList.add('opacity-100', 'scale-100');
  });
  
  document.body.style.overflow = 'hidden';
}

/**
 * 详情弹窗数据填充
 */
function renderBookDetail(book) {
  elements.title.textContent = book.title;
  elements.author.textContent = book.author;
  elements.price.textContent = `¥${book.price.toFixed(2)}`;
  
  // 关键：实时显示最新的收藏数
  elements.favCount.textContent = (book.favCount || 0).toLocaleString();
  
  elements.store.textContent = book.storeName || "Main Headquarters";
  elements.binding.textContent = book.binding || "Paperback";
  
  if (book.stock > 0) {
    elements.stock.innerHTML = `<i class="fa fa-check-circle"></i> In Stock (${book.stock})`;
    elements.stock.className = "text-sm font-bold text-green-600";
  } else {
    elements.stock.innerHTML = `<i class="fa fa-times-circle"></i> Out of Stock`;
    elements.stock.className = "text-sm font-bold text-red-600";
  }

  elements.desc.textContent = book.description || "No description available for this book.";
  elements.category.textContent = book.category;
  elements.publisher.textContent = book.publisher;
  elements.language.textContent = book.language || "English";
  elements.pages.textContent = book.pages || "N/A";
  elements.isbn.textContent = book.isbn;

  // 收藏按钮状态同步
  const favBtnIcon = elements.addToFavoriteBtn.querySelector('i');
  const isFavorited = typeof favorites !== 'undefined' && favorites.some(f => f.id === book.id);
  if (favBtnIcon) {
    favBtnIcon.className = isFavorited ? 'fa fa-heart text-red-500' : 'fa fa-heart-o';
  }
}

function hideBookDetail() {
  elements.overlay.classList.remove('opacity-100');
  elements.overlay.classList.add('opacity-0');
  
  elements.modal.classList.remove('opacity-100', 'scale-100');
  elements.modal.classList.add('opacity-0', 'scale-95');
  
  setTimeout(() => {
    elements.overlay.classList.add('hidden');
    elements.modal.classList.add('hidden');
    document.body.style.overflow = '';
  }, 300);
}

function handleAddToCart() {
  if (!currentBook) return;
  if (typeof addToCart === 'function') {
    addToCart(currentBook.id);
    hideBookDetail();
  }
}

function handleAddToFavorite() {
  if (!currentBook) return;
  if (typeof toggleFavorite === 'function') {
    toggleFavorite(currentBook.id);
    
    // 同步弹窗内的图标和收藏数值
    const favBtnIcon = elements.addToFavoriteBtn.querySelector('i');
    if (favBtnIcon) {
        const isFavorited = favorites.some(f => f.id === currentBook.id);
        favBtnIcon.className = isFavorited ? 'fa fa-heart text-red-500' : 'fa fa-heart-o';
    }
    // 弹窗内的数值也同步
    elements.favCount.textContent = currentBook.favCount.toLocaleString();
  }
}

function init() {
  initEventListeners();
  window.showBookDetail = showBookDetail;
}

document.addEventListener('DOMContentLoaded', init);