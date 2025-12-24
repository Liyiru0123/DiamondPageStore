// scripts/customer-mock-data.js

// 模拟书籍数据（完整字段版）
const mockBooks = [
  {
    id: 1,
    isbn: '9780140283334',
    title: "Moby Dick",
    author: "Herman Melvile",
    authorNationality: "USA",
    language: "English",
    category: "Literature",
    publisher: "Ace Books",
    price: 59.00,
    coverUrl: "https://picsum.photos/id/24/400/600",
    description: "The obsessive quest of Ahab, captain of the whaling ship Pequod, for revenge on Moby Dick, the giant white sperm whale.",
    favCount: 1240,
    storeName: "Main Headquarters",
    stock: 45,
    binding: "Hardcover",
    pages: 624
  },
  {
    id: 2,
    isbn: "9780393045215",
    title: "Dream of the Red Chamber",
    author: "Cao Xueqin",
    authorNationality: "CHN",
    language: "Chinese",
    category: "Literature",
    publisher: "Ballantine Books",
    price: 39.00,
    coverUrl: "https://picsum.photos/id/21/400/600",
    description: "A detailed, episodic record of the lives of the members of the Jia family, whose fortune is in decline.",
    favCount: 3500,
    storeName: "Downtown Branch",
    stock: 12,
    binding: "Paperback",
    pages: 2500
  },
  {
    id: 3,
    isbn: "9780439023480",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    authorNationality: "GBR",
    language: "English",
    category: "Science",
    publisher: "Doubleday",
    price: 69.00,
    coverUrl: "https://picsum.photos/id/22/400/600",
    description: "Bilbo Baggins, a hobbit, journeys to the Lonely Mountain accompanied by a group of dwarves to reclaim a treasure.",
    favCount: 890,
    storeName: "North Square Store",
    stock: 0,
    binding: "Hardcover",
    pages: 310
  },
  {
    id: 4,
    isbn: "9780345805928",
    title: "Circe",
    author: "Madeline Miller",
    authorNationality: "USA",
    language: "English",
    category: "Literature",
    publisher: "Avon Books",
    price: 88.00,
    coverUrl: "https://picsum.photos/id/20/400/600",
    description: "In the house of Helios, god of the sun and mightiest of the Titans, a daughter is born.",
    favCount: 2100,
    storeName: "Main Headquarters",
    stock: 88,
    binding: "Paperback",
    pages: 400
  },
  {
    id: 5,
    isbn: "9780525478812",
    title: "The Testaments",
    author: "Margaret Atwood",
    authorNationality: "CAN",
    language: "English",
    category: "Science",
    publisher: "Cambridge University Press",
    price: 39.00,
    coverUrl: "https://picsum.photos/id/15/400/600",
    description: "The sequel to The Handmaid's Tale, set fifteen years after Offred's final scene.",
    favCount: 1560,
    storeName: "East Lake Branch",
    stock: 25,
    binding: "Hardcover",
    pages: 432
  },
  {
    id: 6,
    isbn: "9780307387899",
    title: "Girl with Dragon Tattoo",
    author: "Stieg Larsson",
    authorNationality: "CHE",
    language: "English",
    category: "History",
    publisher: "Gallery Books",
    price: 52.00,
    coverUrl: "https://picsum.photos/id/18/400/600",
    description: "A psychological thriller about the disappearance of a young woman from a wealthy family.",
    favCount: 4200,
    storeName: "Main Headquarters",
    stock: 5,
    binding: "Paperback",
    pages: 465
  },
  {
    id: 7,
    isbn: "9781982137274",
    title: "Seven Husbands Evelyn Hugo",
    author: "Taylor Jenkins Reid",
    authorNationality: "USA",
    language: "English",
    category: "Literature",
    publisher: "McGraw-Hill Education",
    price: 45.00,
    coverUrl: "https://picsum.photos/id/25/400/600",
    description: "Aging Hollywood movie icon Evelyn Hugo is ready to tell the truth about her glamorous and scandalous life.",
    favCount: 3100,
    storeName: "South Port Store",
    stock: 19,
    binding: "Paperback",
    pages: 389
  },
  {
    id: 8,
    isbn: "9780441172719",
    title: "Dune",
    author: "Frank Herbert",
    authorNationality: "USA",
    language: "English",
    category: "Science",
    publisher: "Bloomsbury Publishing",
    price: 65.00,
    coverUrl: "https://picsum.photos/id/12/400/600",
    description: "Set in the far future amidst a sprawling feudal interstellar empire, Paul Atreides becomes a hero on the desert planet Arrakis.",
    favCount: 5600,
    storeName: "Main Headquarters",
    stock: 120,
    binding: "Hardcover",
    pages: 617
  }
];

// 模拟订单数据
const mockOrders = [];

/**
 * 渲染函数保持与 customer.js 互通
 */
function renderBooks(books) {
  const categoryContainer = document.querySelector('#categories-page .grid');
  if (!categoryContainer) return;
  categoryContainer.innerHTML = books.map(book => bookCardTemplate(book)).join('');
  if (typeof bindCartAndFavoriteEvents === 'function') bindCartAndFavoriteEvents();
  if (typeof bindBookCardClickEvents === 'function') bindBookCardClickEvents();
}

document.addEventListener('DOMContentLoaded', () => {
  // 注意：在实际项目中，customer.js 也会调用渲染逻辑，这里确保初次加载有数据
  const container = document.getElementById('category-books');
  if (container && container.innerHTML.trim() === "") {
      renderBooks(mockBooks);
  }
});