// scripts/common.js

// 1. 弹窗提示
function showNotification(message) {
    console.log(`[通知] ${message}`);
    alert(message);
}

// 2. 页面切换逻辑
function switchPage(pageId) {
    // A. 处理内容区域显隐
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => {
        page.classList.add('hidden');
    });
    
    const targetPage = document.getElementById(`${pageId}-page`);
    if (targetPage) {
        targetPage.classList.remove('hidden');
        // 简单入场动画
        targetPage.style.opacity = '0';
        setTimeout(() => {
            targetPage.style.transition = 'opacity 0.3s ease';
            targetPage.style.opacity = '1';
        }, 50);
    }

    // B. 处理侧边栏高亮
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        if (item.getAttribute('data-page') === pageId) {
            item.classList.add('sidebar-item-active');
        } else {
            item.classList.remove('sidebar-item-active');
        }
    });

    // C. 移动端：切换后自动收起侧边栏
    const sidebar = document.getElementById('sidebar');
    if (sidebar && window.innerWidth < 768) {
        sidebar.classList.add('-translate-x-full');
    }
    
    // D. 滚动到顶部
    window.scrollTo(0, 0);
}

// 3. 搜索逻辑
function searchBooks(keywordInput = null) {
  // 切换到搜索页
  switchPage('search');

  const inputEl = document.getElementById('search-input');
  const priceFilter = document.getElementById('price-filter');
  const langFilter = document.getElementById('language-filter');
  const sortFilter = document.getElementById('sort-filter');
  const keywordEl = document.getElementById('search-keyword');

  // 如果是从外部（如热门标签）传入的关键词，则同步给输入框
  if (keywordInput !== null) {
      inputEl.value = keywordInput;
  }

  const keyword = inputEl.value.trim().toLowerCase();
  const priceRange = priceFilter.value; // all, 0-20, 20-50, 50+
  const language = langFilter.value;   // all, English, Chinese...
  const sortBy = sortFilter.value;     // default, popular, price-asc, price-desc

  // 更新结果标题处的关键词显示
  if(keywordEl) keywordEl.textContent = keyword ? `("${keyword}")` : '(Please enter keywords)';

  if (typeof mockBooks === 'undefined') return;

  // 1. 执行叠加筛选
  let results = mockBooks.filter(book => {
      // 关键词过滤 (标题/作者/类别)
      const matchesKeyword = !keyword || 
          book.title.toLowerCase().includes(keyword) || 
          book.author.toLowerCase().includes(keyword) ||
          book.category.toLowerCase().includes(keyword);

      // 任务 4：价格区间过滤
      let matchesPrice = true;
      if (priceRange === '0-20') matchesPrice = book.price <= 20;
      else if (priceRange === '20-40') matchesPrice = book.price > 20 && book.price <= 40;
      else if (priceRange === '50+') matchesPrice = book.price >= 50;

      // 任务 4：语言过滤
      let matchesLang = true;
      if (language !== 'all') matchesLang = book.language === language;

      return matchesKeyword && matchesPrice && matchesLang;
  });

  // 2. 任务 5：执行排序逻辑
  if (sortBy === 'popular') {
      results.sort((a, b) => (b.favCount || 0) - (a.favCount || 0));
  } else if (sortBy === 'price-asc') {
      results.sort((a, b) => a.price - b.price);
  } else if (sortBy === 'price-desc') {
      results.sort((a, b) => b.price - a.price);
  }
  // 'default' 则保持原始 mockBooks 顺序 (results 本身就是按原始索引过滤出来的)

  // 3. 渲染结果
  renderSearchResults(results);
}

// 4. 渲染搜索结果
function renderSearchResults(books) {
  const resultsContainer = document.getElementById('search-results');
  const noResults = document.getElementById('no-results');
  
  if (!resultsContainer) return;

  if (books.length === 0) {
    resultsContainer.innerHTML = '';
    noResults.classList.remove('hidden');
    return;
  }
  
  noResults.classList.add('hidden');
  
  if (typeof bookCardTemplate === 'function') {
      resultsContainer.innerHTML = books.map(bookCardTemplate).join('');
  } else {
      resultsContainer.innerHTML = books.map(book => `
        <div class="bg-white rounded-lg shadow-md overflow-hidden p-4 book-card-item" data-id="${book.id}">
          <h3 class="font-bold text-brown-dark">${book.title}</h3>
          <p class="text-sm text-gray-600">${book.author}</p>
          <div class="flex justify-between items-center mt-3">
            <span class="font-bold text-brown">¥${book.price.toFixed(2)}</span>
            <button class="addCartBtn bg-brown text-white px-3 py-1 rounded" data-id="${book.id}">Add</button>
          </div>
        </div>
      `).join('');
  }
  
  if (typeof bindCartAndFavoriteEvents === 'function') bindCartAndFavoriteEvents();
  if (typeof bindBookCardClickEvents === 'function') bindBookCardClickEvents();
}