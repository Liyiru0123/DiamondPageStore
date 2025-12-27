-- view.sql
-- 基于 new_data_book_store.sql 结构生成的视图文�?
-- 用于 Staff 页面 PHP 后端安全调用

USE book_store;

-- 1. 员工库存详情视图 (替代 PHP 中的 JOIN 查询)
-- 用于 Inventory 列表显示
CREATE OR REPLACE VIEW vw_staff_inventory_details AS
SELECT 
    ib.batch_id,
    ib.store_id,
    ib.quantity,
    ib.unit_cost,
    ib.received_date,
    ib.batch_code,
    s.sku_id,
    s.unit_price,
    s.binding,  -- 对应数据库中的实际字段名
    b.ISBN,
    b.name AS book_name, -- 对应 books 表的 name 字段
    b.publisher,
    b.language
FROM inventory_batches ib
JOIN skus s ON ib.sku_id = s.sku_id
JOIN books b ON s.ISBN = b.ISBN;

-- 2. 员工低库存预警视�?
-- 用于 Dashboard �?Low Stock Alerts
CREATE OR REPLACE VIEW vw_staff_low_stock AS
SELECT 
    s.sku_id,
    b.ISBN,
    b.name AS book_name,
    s.binding,
    ib.store_id,
    COALESCE(SUM(ib.quantity), 0) AS total_stock
FROM skus s
JOIN books b ON s.ISBN = b.ISBN
LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id
GROUP BY s.sku_id, b.ISBN, b.name, s.binding, ib.store_id;

-- 3. 员工订单列表视图
-- 用于 Order Processing 页面
CREATE OR REPLACE VIEW vw_staff_order_summary AS
SELECT
    o.order_id,
    o.store_id,
    o.order_status,
    o.order_date,
    o.note,
    m.first_name,
    m.last_name,
    m.phone AS member_phone,
    COUNT(oi.sku_id) AS item_count
FROM orders o
JOIN members m ON o.member_id = m.member_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.store_id, o.order_status, o.order_date, o.note, m.first_name, m.last_name, m.phone;

-- =========================================================================
-- CUSTOMER VIEWS
-- 以下视图用于 Customer 端功�?
-- =========================================================================

-- 4. 顾客书籍列表视图（带库存和收藏数�?
-- 用于浏览、搜索、分类筛选书�?
CREATE OR REPLACE VIEW vw_customer_books AS
SELECT
    b.ISBN,
    b.name AS title,
    b.language,
    b.publisher,
    b.introduction AS description,
    s.sku_id,
    s.unit_price AS price,
    s.binding AS binding,
    COALESCE(SUM(ib.quantity), 0) AS stock,
    st.store_id,
    st.name AS store_name,
    -- 获取书籍作者（连接字符串）
    (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS author,
    -- 获取书籍分类（连接字符串�?
    (SELECT GROUP_CONCAT(c.name SEPARATOR ', ')
     FROM book_categories bc
     JOIN catagories c ON bc.category_id = c.category_id
     WHERE bc.ISBN = b.ISBN) AS category,
    -- 计算收藏�?
    (SELECT COUNT(*)
     FROM favorites f
     WHERE f.ISBN = b.ISBN) AS fav_count
FROM books b
JOIN skus s ON b.ISBN = s.ISBN
LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id
LEFT JOIN stores st ON ib.store_id = st.store_id
GROUP BY b.ISBN, b.name, b.language, b.publisher, b.introduction,
         s.sku_id, s.unit_price, s.binding, st.store_id, st.name;

-- 5. 顾客书籍详情视图
-- 用于查看书籍详细信息
CREATE OR REPLACE VIEW vw_customer_book_detail AS
SELECT
    b.ISBN,
    b.name AS title,
    b.language,
    b.publisher,
    b.introduction AS description,
    s.sku_id,
    s.unit_price AS price,
    s.binding AS binding,
    COALESCE(SUM(ib.quantity), 0) AS stock,
    st.store_id,
    st.name AS store_name,
    -- 获取书籍作者详�?
    (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS author,
    -- 获取作者国�?
    (SELECT GROUP_CONCAT(DISTINCT a.country SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS author_country,
    -- 获取书籍分类
    (SELECT GROUP_CONCAT(c.name SEPARATOR ', ')
     FROM book_categories bc
     JOIN catagories c ON bc.category_id = c.category_id
     WHERE bc.ISBN = b.ISBN) AS category,
    -- 计算收藏�?
    (SELECT COUNT(*)
     FROM favorites f
     WHERE f.ISBN = b.ISBN) AS fav_count
FROM books b
JOIN skus s ON b.ISBN = s.ISBN
LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id
LEFT JOIN stores st ON ib.store_id = st.store_id
GROUP BY b.ISBN, b.name, b.language, b.publisher, b.introduction,
         s.sku_id, s.unit_price, s.binding, st.store_id, st.name;

-- 6. 顾客收藏列表视图
-- 用于查看用户的收藏书籍列�?
CREATE OR REPLACE VIEW vw_customer_favorites AS
SELECT
    f.member_id,
    f.ISBN,
    f.create_date,
    b.name AS title,
    b.language,
    b.publisher,
    b.introduction AS description,
    s.sku_id,
    s.unit_price AS price,
    s.binding AS binding,
    (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS author,
    (SELECT GROUP_CONCAT(c.name SEPARATOR ', ')
     FROM book_categories bc
     JOIN catagories c ON bc.category_id = c.category_id
     WHERE bc.ISBN = b.ISBN) AS category,
    COALESCE(SUM(ib.quantity), 0) AS stock,
    st.name AS store_name
FROM favorites f
JOIN books b ON f.ISBN = b.ISBN
JOIN skus s ON b.ISBN = s.ISBN
LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id
LEFT JOIN stores st ON ib.store_id = st.store_id
GROUP BY f.member_id, f.ISBN, f.create_date, b.name, b.language, b.publisher,
         b.introduction, s.sku_id, s.unit_price, s.binding, st.name;

-- 7. 顾客订单列表视图
-- 用于查看用户的订单及订单详情
CREATE OR REPLACE VIEW vw_customer_orders AS
SELECT
    o.order_id,
    o.member_id,
    o.store_id,
    o.order_status,
    o.order_date,
    o.note,
    st.name AS store_name,
    -- 计算订单总价
    (SELECT SUM(oi.quantity * s.unit_price)
     FROM order_items oi
     JOIN skus s ON oi.sku_id = s.sku_id
     WHERE oi.order_id = o.order_id) AS total_price,
    -- 计算订单商品数量
    (SELECT SUM(oi.quantity)
     FROM order_items oi
     WHERE oi.order_id = o.order_id) AS total_items
FROM orders o
JOIN stores st ON o.store_id = st.store_id;

-- 8. 顾客订单详情视图
-- 用于查看订单中的具体商品
CREATE OR REPLACE VIEW vw_customer_order_items AS
SELECT
    oi.order_id,
    oi.sku_id,
    oi.quantity,
    b.ISBN,
    b.name AS book_title,
    b.publisher,
    b.language,
    s.unit_price AS price,
    s.binding AS binding,
    (oi.quantity * s.unit_price) AS subtotal,
    (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS author
FROM order_items oi
JOIN skus s ON oi.sku_id = s.sku_id
JOIN books b ON s.ISBN = b.ISBN;

-- 9. 顾客会员信息视图
-- 用于会员中心显示会员等级和积�?
CREATE OR REPLACE VIEW vw_customer_member_info AS
SELECT
    m.member_id,
    m.user_id,
    m.first_name,
    m.last_name,
    m.phone,
    m.point AS points,
    m.address,
    m.birthday,
    mt.member_tier_id,
    mt.name AS tier_name,
    mt.discount_rate AS discount,
    mt.min_lifetime_spend AS min_total_spent,
    -- 计算累计消费（仅已支付订单）
    COALESCE((SELECT SUM(oi.quantity * s.unit_price)
              FROM orders o
              JOIN order_items oi ON o.order_id = oi.order_id
              JOIN skus s ON oi.sku_id = s.sku_id
              WHERE o.member_id = m.member_id
              AND o.order_status = 'paid'), 0) AS total_spent,
    u.username
FROM members m
JOIN member_tiers mt ON m.member_tier_id = mt.member_tier_id
JOIN users u ON m.user_id = u.user_id;

-- 10. 公告视图
-- 用于显示有效的公�?
CREATE OR REPLACE VIEW vw_customer_announcements AS
SELECT
    announcement_id,
    title,
    content,
    publish_at,
    expire_at
FROM announcements
WHERE publish_at <= NOW()
ORDER BY publish_at DESC;

-- =========================================================================
-- POINT LEDGERS VIEWS (积分记录视图)
-- 用于会员积分历史查询和统�?
-- =========================================================================

-- 11. 会员积分历史视图
-- 用于查看会员的积分变动明�?
CREATE OR REPLACE VIEW vw_customer_point_history AS
SELECT
    pl.point_ledger_id,
    pl.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    pl.points_change,
    pl.order_id,
    CASE
        WHEN pl.points_change > 0 THEN 'Earned'
        WHEN pl.points_change < 0 THEN 'Spent'
        ELSE 'Adjusted'
    END AS change_type,
    pl.change_date,
    pl.reason,
    m.point AS current_points
FROM point_ledgers pl
JOIN members m ON pl.member_id = m.member_id
ORDER BY pl.change_date DESC;

-- 12. 会员积分汇总视�?
-- 用于查看会员的积分统计数�?
CREATE OR REPLACE VIEW vw_customer_point_summary AS
SELECT
    m.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.point AS current_points,
    COALESCE(SUM(CASE WHEN pl.points_change > 0 THEN pl.points_change ELSE 0 END), 0) AS total_earned,
    COALESCE(SUM(CASE WHEN pl.points_change < 0 THEN ABS(pl.points_change) ELSE 0 END), 0) AS total_spent,
    COUNT(pl.point_ledger_id) AS total_transactions,
    MAX(pl.change_date) AS last_transaction_date
FROM members m
LEFT JOIN point_ledgers pl ON m.member_id = pl.member_id
GROUP BY m.member_id, m.first_name, m.last_name, m.point;

