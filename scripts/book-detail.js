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
  elements.favCount.textContent = (book.favCount || 0).toLocaleString();
  elements.store.textContent = book.storeName;
  elements.isbn.textContent = book.isbn;

  // CHANGED: 修正主键一致性。后端接口以 isbn 为主键进行收藏校验
  const favBtnIcon = elements.addToFavoriteBtn.querySelector('i');
  const isFavorited = typeof favorites !== 'undefined' && favorites.some(f => f.isbn === book.isbn);
  
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
  if (!currentBook || !currentBook.isbn) return; // 使用 ISBN 对齐后端
  
  if (typeof toggleFavorite === 'function') {
    // 路径：用户点击详情窗收藏 -> 调用 toggleFavorite(isbn) -> 内部调用 removeFavoriteAPI(isbn)
    toggleFavorite(currentBook.isbn); 
    
    // UI 实时响应逻辑
    const favBtnIcon = elements.addToFavoriteBtn.querySelector('i');
    if (favBtnIcon) {
        const isFavorited = favorites.some(f => f.isbn === currentBook.isbn);
        favBtnIcon.className = isFavorited ? 'fa fa-heart text-red-500' : 'fa fa-heart-o';
    }
    elements.favCount.textContent = currentBook.favCount.toLocaleString();
  }
}

function init() {
  initEventListeners();
  window.showBookDetail = showBookDetail;
}

document.addEventListener('DOMContentLoaded', init);