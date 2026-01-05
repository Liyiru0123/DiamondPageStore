// scripts/customer-api.js

// API配置
const API_CONFIG = {
    baseURL: '../api/customer',
    endpoints: {
        books: {
            list: '/books.php?action=list',
            search: '/search.php',
            detail: '/books.php?action=detail'
        },
        favorites: {
            list: '/favorites.php?action=list',
            add: '/favorites.php?action=add',
            remove: '/favorites.php?action=remove',
            check: '/favorites.php?action=check'
        },
        orders: {
            list: '/orders.php?action=list',
            detail: '/orders.php?action=detail',
            create: '/orders.php?action=create',
            pay: '/orders.php?action=pay',
            payMultiple: '/orders.php?action=pay_multiple',
            cancel: '/orders.php?action=cancel'
        },
        profile: {
            get: '/profile.php?action=get',
            update: '/profile.php?action=update'
        },
        member: {
            info: '/member.php?action=info',
            tiers: '/member.php?action=tiers',
            updateTier: '/member.php?action=update_tier'
        },
        announcements: '/announcements.php',
        cart: {
            calculate: '/cart.php?action=calculate'
        }
    }
};

// 获取当前登录用户的member_id
function getCurrentMemberId() {
    const userData = localStorage.getItem('current_user');
    if (!userData) {
        console.error("用户未登录，找不到 current_user");
        return 1; // 临时返回1，但实际应引导去登录
    }
    
    try {
        const user = JSON.parse(userData);
        const id = user.member_id || user.user_id || user.user_name; 
        if (!id) {
            console.warn("解析到了用户对象，但找不到 ID 字段", user);
            console.log(userObject);
            return 1;
        }
        return id;
    } catch (e) {
        console.error("解析用户信息失败", e);
        return 1;
    }
}

// 通用API请求函数

async function apiRequest(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒强制超时

    try {
        const response = await fetch(API_CONFIG.baseURL + url, {
            ...options,
            signal: controller.signal, // 绑定超时信号
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        return data; // 这里确保返回的是后端定义的 {success, data, message}
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('--- API 请求崩溃 ---', error);
        throw error; // 必须抛出，否则调用者会以为请求还在进行
    }
}

// ========== 书籍相关API ==========

/**
 * 获取书籍列表
 */
async function fetchBooks(filters = {}) {
    const params = new URLSearchParams();

    if (filters.category && filters.category !== 'all') {
        params.append('category', filters.category);
    }
    if (filters.language && filters.language !== 'all') {
        params.append('language', filters.language);
    }
    if (filters.priceRange && filters.priceRange !== 'all') {
        params.append('price_range', filters.priceRange);
    }
    if (filters.sortBy) {
        params.append('sort_by', filters.sortBy);
    }

    const url = API_CONFIG.endpoints.books.list + (params.toString() ? '&' + params.toString() : '');
    const response = await apiRequest(url);
    return response.data;
}

/**
 * 搜索书籍
 */
async function searchBooksAPI(keyword, filters = {}) {
    const params = new URLSearchParams({ keyword });

    if (filters.priceRange && filters.priceRange !== 'all') {
        params.append('price_range', filters.priceRange);
    }
    if (filters.language && filters.language !== 'all') {
        params.append('language', filters.language);
    }
    if (filters.sortBy) {
        params.append('sort_by', filters.sortBy);
    }

    const url = API_CONFIG.endpoints.books.search + '?' + params.toString();
    const response = await apiRequest(url);
    return response.data;
}

/**
 * 获取书籍详情
 */
async function fetchBookDetail(isbn) {
    const url = `${API_CONFIG.endpoints.books.detail}&isbn=${isbn}`;
    const response = await apiRequest(url);
    return response.data;
}

// ========== 收藏相关API ==========

/**
 * 获取用户收藏列表
 */
async function fetchFavorites() {
    const memberId = getCurrentMemberId();
    const url = `${API_CONFIG.endpoints.favorites.list}&member_id=${memberId}`;
    const response = await apiRequest(url);
    return response.data;
}

/**
 * 添加收藏
 */
async function addFavoriteAPI(isbn) {
    const memberId = getCurrentMemberId();
    const response = await apiRequest(API_CONFIG.endpoints.favorites.add, {
        method: 'POST',
        body: JSON.stringify({ member_id: memberId, isbn })
    });
    return response;
}

/**
 * 取消收藏
 */
async function removeFavoriteAPI(isbn) {
    const memberId = getCurrentMemberId();
    const response = await apiRequest(API_CONFIG.endpoints.favorites.remove, {
        method: 'POST',
        body: JSON.stringify({ member_id: memberId, isbn })
    });
    return response;
}

/**
 * 检查是否已收藏
 */
async function checkFavoriteAPI(isbn) {
    const memberId = getCurrentMemberId();
    const url = `${API_CONFIG.endpoints.favorites.check}&member_id=${memberId}&isbn=${isbn}`;
    const response = await apiRequest(url);
    return response.is_favorite;
}

// ========== 订单相关API ==========

/**
 * 获取订单列表
 */
async function fetchOrders(status = 'all') {
    const memberId = getCurrentMemberId();
    const url = `${API_CONFIG.endpoints.orders.list}&member_id=${memberId}&status=${status}`;
    const response = await apiRequest(url);
    return response.data;
}

/**
 * 获取订单详情
 */
async function fetchOrderDetail(orderId) {
    const url = `${API_CONFIG.endpoints.orders.detail}&order_id=${orderId}`;
    const response = await apiRequest(url);
    return response.data;
}

/**
 * 创建订单
 */
async function createOrderAPI(cartItems, note = '') {
    const memberId = getCurrentMemberId();
    const storeIds = cartItems
        .map(item => item.storeId ?? item.store_id ?? '')
        .filter(id => id !== '' && id !== null && id !== undefined)
        .map(id => parseInt(id, 10))
        .filter(id => Number.isFinite(id) && id > 0);

    const uniqueStoreIds = [...new Set(storeIds)];
    if (storeIds.length !== cartItems.length) {
        throw new Error('Missing store information for some items. Please remove and re-add them.');
    }
    if (uniqueStoreIds.length !== 1) {
        throw new Error('Please checkout items from one store at a time.');
    }
    const storeId = uniqueStoreIds[0];

    // 转换购物车格式为API需要的格式
    const items = cartItems.map(item => ({
        sku_id: item.id,
        quantity: item.quantity
    }));

    const response = await apiRequest(API_CONFIG.endpoints.orders.create, {
        method: 'POST',
        body: JSON.stringify({
            member_id: memberId,
            store_id: storeId,
            cart_items: items,
            note
        })
    });
    return response;
}

/**
 * 支付订单
 */
async function payOrderAPI(orderId, paymentMethod = 'Credit Card') {
    const response = await apiRequest(API_CONFIG.endpoints.orders.pay, {
        method: 'POST',
        body: JSON.stringify({
            order_id: orderId,
            payment_method: paymentMethod
        })
    });
    return response;
}

/**
 * 合并支付多个订单
 */
async function payMultipleOrdersAPI(orderIds, paymentMethod = 'Credit Card') {
    const response = await apiRequest(API_CONFIG.endpoints.orders.payMultiple, {
        method: 'POST',
        body: JSON.stringify({
            order_ids: orderIds,
            payment_method: paymentMethod
        })
    });
    return response;
}

/**
 * 取消订单
 */
async function cancelOrderAPI(orderId, reason = 'User cancelled') {
    const response = await apiRequest(API_CONFIG.endpoints.orders.cancel, {
        method: 'POST',
        body: JSON.stringify({
            order_id: orderId,
            reason
        })
    });
    return response;
}

// ========== 个人资料相关API ==========

/**
 * 获取个人资料
 */
async function fetchProfile() {
    const memberId = getCurrentMemberId();
    const url = `${API_CONFIG.endpoints.profile.get}&member_id=${memberId}`;
    const response = await apiRequest(url);
    return response.data;
}

/**
 * 更新个人资料
 */

async function updateProfileAPI(profileData) {
    // 1. 获取当前用户信息
    const user = JSON.parse(localStorage.getItem('current_user') || '{}');
    
    console.log("[Profile Update] Current User Data:", user);

    const userId = user.user_id || user.id;

    if (!userId) {
        console.error("Critical: User ID missing in localStorage object");
        throw new Error("User ID not found. Please try logging in again.");
    }

    const payload = {
        user_id: userId,
        username: profileData.username,
        contact: profileData.contact,
        password: profileData.password
    };

    const response = await fetch('../api/customer/update_profile.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!result.success) {
        throw new Error(result.message);
    }
    return result;
}

// ========== 会员相关API ==========

/**
 * 获取会员信息
 */
async function fetchMemberInfo() {
    const memberId = getCurrentMemberId();
    const url = `${API_CONFIG.endpoints.member.info}&member_id=${memberId}`;
    const response = await apiRequest(url);
    return response.data;
}

/**
 * 获取会员等级列表
 */
async function fetchMemberTiers() {
    const url = API_CONFIG.endpoints.member.tiers;
    const response = await apiRequest(url);
    return response.data;
}

/**
 * 更新会员等级
 */
async function updateMemberTierAPI() {
    const memberId = getCurrentMemberId();
    const response = await apiRequest(API_CONFIG.endpoints.member.updateTier, {
        method: 'POST',
        body: JSON.stringify({ member_id: memberId })
    });
    return response;
}

// ========== 公告相关API ==========

/**
 * 获取公告列表
 */
async function fetchAnnouncements() {
    const response = await apiRequest(API_CONFIG.endpoints.announcements);
    return response.data;
}

// ========== 购物车相关API ==========

/**
 * 计算购物车总价
 * @param {Array} cartItems - 购物车商品列表 [{sku_id, quantity}, ...]
 * @returns {Promise} 返回计算后的价格信息
 */
async function calculateCartTotalAPI(cartItems) {
    const memberId = getCurrentMemberId();
    const response = await apiRequest(API_CONFIG.endpoints.cart.calculate, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            cart_items: cartItems,
            member_id: memberId
        })
    });
    return response;
}
