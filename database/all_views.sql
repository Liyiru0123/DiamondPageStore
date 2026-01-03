-- all_views.sql
-- Combined views (auth, customer, staff, manager, finance)

USE book_store;

-- ============================================================================
-- Source: auth_views.sql
-- ============================================================================
DELIMITER //

-- ---------------------------------------------------------
-- View: vw_auth_details
-- 作用: 聚合用户基本信息和员工职位信息。
-- 注意: 这里的 password_hash 字段实际上存储的是明文密码。
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_auth_details AS
SELECT 
    u.user_id,
    u.username,
    u.password_hash, -- 明文密码
    u.user_types,    -- 'member' 或 'employee'
    u.status,        -- 'active' 或 'disabled'
    j.name AS job_title -- 关联查出具体的职位，如 'Store Manager', 'Staff'
FROM 
    users u
LEFT JOIN 
    employees e ON u.user_id = e.user_id
LEFT JOIN 
    job_titles j ON e.job_title_id = j.job_title_id;
//

DELIMITER ;

-- ============================================================================
-- Source: customer_view.sql
-- ============================================================================
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
    m.email AS member_email,
    COUNT(oi.sku_id) AS item_count
FROM orders o
JOIN members m ON o.member_id = m.member_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
GROUP BY o.order_id, o.store_id, o.order_status, o.order_date, o.note, m.first_name, m.last_name, m.email;

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
    m.email,
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

-- ============================================================================
-- Source: staff_views.sql
-- ============================================================================
-- ---------------------------------------------------------
-- View: vw_staff_details
-- 作用: 聚合 用户(users) -> 员工(employees) -> 门店(stores) 的信息
-- 用于: 登录后获取当前员工所属门店 ID、名称、职位等，避免前端硬编码
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_staff_details AS
SELECT
    u.user_id,
    u.username,
    e.email as email,
    u.status as account_status,
    e.employee_id,
    e.first_name,
    e.last_name,
    CONCAT(e.first_name, ' ', e.last_name) AS full_name,
    j.name AS job_title,
    s.store_id,
    s.name AS store_name,
    s.status AS store_status
FROM users u
JOIN employees e ON u.user_id = e.user_id
JOIN stores s ON e.store_id = s.store_id
JOIN job_titles j ON e.job_title_id = j.job_title_id;

-- ---------------------------------------------------------
-- View: vw_staff_book_categories
-- 作用: 获取所有书籍类别列表
-- 用于: 前端下拉框动态加载类别选项
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_staff_book_categories AS
SELECT
    category_id,
    name AS category_name
FROM catagories
ORDER BY name ASC;

-- ---------------------------------------------------------
-- View: vw_staff_order_status_list
-- 作用: 获取订单状态枚举列表
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_staff_order_status_list AS
SELECT 'created' AS status_name
UNION SELECT 'paid'
UNION SELECT 'cancelled'
UNION SELECT 'refunded'
UNION SELECT 'finished';

-- ---------------------------------------------------------
-- View: vw_staff_order_details_full
-- 作用: 获取订单详情及其包含的商品
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_staff_order_details_full AS
SELECT 
    o.order_id,
    o.store_id,
    o.order_status,
    o.order_date,
    o.note,
    CONCAT(m.first_name, ' ', m.last_name) AS customer_name,
    oi.sku_id,
    oi.quantity,
    b.name AS book_title,
    s.ISBN,
    s.unit_price,
    (oi.quantity * s.unit_price) AS subtotal
FROM orders o
JOIN members m ON o.member_id = m.member_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN skus s ON oi.sku_id = s.sku_id
JOIN books b ON s.ISBN = b.ISBN;

-- ============================================================================
-- Source: manager_views.sql
-- ============================================================================
-- manager_views.sql
-- Manager views

USE book_store;

DROP VIEW IF EXISTS vm_manager_employees;
DROP VIEW IF EXISTS vw_manager_employees;
DROP VIEW IF EXISTS vm_manager_employee_performance;
DROP VIEW IF EXISTS vw_manager_employee_performance;
DROP VIEW IF EXISTS vm_manager_staff_by_store;
DROP VIEW IF EXISTS vw_manager_staff_by_store;
DROP VIEW IF EXISTS vm_manager_inventory_overview;
DROP VIEW IF EXISTS vw_manager_inventory_overview;
DROP VIEW IF EXISTS vm_manager_inventory_by_store;
DROP VIEW IF EXISTS vw_manager_inventory_by_store;
DROP VIEW IF EXISTS vm_manager_inventory_by_sku;
DROP VIEW IF EXISTS vw_manager_inventory_by_sku;
DROP VIEW IF EXISTS vm_manager_replenishment_requests;
DROP VIEW IF EXISTS vw_manager_replenishment_requests;
DROP VIEW IF EXISTS vm_manager_purchases;
DROP VIEW IF EXISTS vw_manager_purchases;
DROP VIEW IF EXISTS vm_manager_suppliers;
DROP VIEW IF EXISTS vw_manager_suppliers;
DROP VIEW IF EXISTS vm_manager_orders_summary;
DROP VIEW IF EXISTS vw_manager_orders_summary;
DROP VIEW IF EXISTS vm_manager_sales_by_store;
DROP VIEW IF EXISTS vw_manager_sales_by_store;
DROP VIEW IF EXISTS vm_manager_sales_by_category;
DROP VIEW IF EXISTS vw_manager_sales_by_category;
DROP VIEW IF EXISTS vm_manager_payment_analysis;
DROP VIEW IF EXISTS vw_manager_payment_analysis;
DROP VIEW IF EXISTS vm_manager_bestsellers;
DROP VIEW IF EXISTS vw_manager_bestsellers;
DROP VIEW IF EXISTS vm_manager_store_performance;
DROP VIEW IF EXISTS vw_manager_store_performance;

-- ============================================================================
-- Employee management views
-- ============================================================================

CREATE OR REPLACE VIEW vm_manager_employees AS
SELECT
    e.employee_id,
    e.user_id,
    e.first_name,
    e.last_name,
    CONCAT(e.first_name, ' ', e.last_name) AS full_name,
    e.email,
    e.performance,
    e.store_id,
    s.name AS store_name,
    s.address AS store_address,
    s.status AS store_status,
    e.job_title_id,
    jt.name AS job_title,
    jt.base_salary,
    u.username,
    u.user_types AS user_type
FROM employees e
JOIN stores s ON e.store_id = s.store_id
JOIN job_titles jt ON e.job_title_id = jt.job_title_id
LEFT JOIN users u ON e.user_id = u.user_id
ORDER BY e.store_id, jt.base_salary DESC, e.last_name;

CREATE OR REPLACE VIEW vm_manager_employee_performance AS
SELECT
    e.employee_id,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    e.performance,
    jt.name AS job_title,
    s.name AS store_name,
    CASE
        WHEN e.performance >= 90 THEN 'Excellent'
        WHEN e.performance >= 75 THEN 'Good'
        WHEN e.performance >= 60 THEN 'Average'
        ELSE 'Needs Improvement'
    END AS performance_rating,
    jt.base_salary,
    ROUND(e.performance * jt.base_salary * 0.001, 2) AS potential_bonus
FROM employees e
JOIN job_titles jt ON e.job_title_id = jt.job_title_id
JOIN stores s ON e.store_id = s.store_id
ORDER BY e.performance DESC;

CREATE OR REPLACE VIEW vm_manager_staff_by_store AS
SELECT
    s.store_id,
    s.name AS store_name,
    s.status AS store_status,
    COUNT(DISTINCT e.employee_id) AS total_employees,
    SUM(CASE WHEN jt.name = 'General Manager' THEN 1 ELSE 0 END) AS managers_count,
    SUM(CASE WHEN jt.name = 'Finance' THEN 1 ELSE 0 END) AS finance_count,
    SUM(CASE WHEN jt.name = 'Staff' THEN 1 ELSE 0 END) AS staff_count,
    ROUND(AVG(e.performance), 2) AS avg_performance,
    SUM(jt.base_salary) AS total_salary_cost
FROM stores s
LEFT JOIN employees e ON s.store_id = e.store_id
LEFT JOIN job_titles jt ON e.job_title_id = jt.job_title_id
GROUP BY s.store_id, s.name, s.status
ORDER BY total_employees DESC;

-- ============================================================================
-- Inventory management views
-- ============================================================================

CREATE OR REPLACE VIEW vm_manager_inventory_overview AS
SELECT
    b.ISBN,
    b.name AS book_name,
    b.publisher,
    b.language,
    s.sku_id,
    s.binding AS binding,
    s.unit_price,
    COALESCE(SUM(ib.quantity), 0) AS total_stock,
    COUNT(DISTINCT ib.store_id) AS stores_count,
    AVG(ib.unit_cost) AS avg_cost,
    MIN(ib.received_date) AS earliest_received,
    MAX(ib.received_date) AS latest_received,
    (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS authors,
    (SELECT GROUP_CONCAT(c.name SEPARATOR ', ')
     FROM book_categories bc
     JOIN catagories c ON bc.category_id = c.category_id
     WHERE bc.ISBN = b.ISBN) AS categories,
    CASE
        WHEN COALESCE(SUM(ib.quantity), 0) > 50 THEN 'High'
        WHEN COALESCE(SUM(ib.quantity), 0) > 20 THEN 'Medium'
        WHEN COALESCE(SUM(ib.quantity), 0) > 0 THEN 'Low'
        ELSE 'Out of Stock'
    END AS stock_level
FROM books b
JOIN skus s ON b.ISBN = s.ISBN
LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id
GROUP BY b.ISBN, b.name, b.publisher, b.language, s.sku_id, s.binding, s.unit_price
ORDER BY total_stock DESC;

CREATE OR REPLACE VIEW vm_manager_inventory_by_store AS
SELECT
    st.store_id,
    st.name AS store_name,
    b.ISBN,
    b.name AS book_name,
    s.sku_id,
    s.binding AS binding,
    s.unit_price,
    COALESCE(SUM(ib.quantity), 0) AS total_quantity,
    AVG(ib.unit_cost) AS avg_cost,
    COUNT(DISTINCT ib.batch_id) AS batch_count,
    MAX(ib.received_date) AS last_inbound_date,
    CASE
        WHEN COALESCE(SUM(ib.quantity), 0) > 20 THEN 'High'
        WHEN COALESCE(SUM(ib.quantity), 0) > 10 THEN 'Medium'
        WHEN COALESCE(SUM(ib.quantity), 0) > 0 THEN 'Low'
        ELSE 'Out of Stock'
    END AS stock_status
FROM stores st
LEFT JOIN inventory_batches ib ON st.store_id = ib.store_id
LEFT JOIN skus s ON ib.sku_id = s.sku_id
LEFT JOIN books b ON s.ISBN = b.ISBN
GROUP BY st.store_id, st.name, b.ISBN, b.name, s.sku_id, s.binding, s.unit_price
ORDER BY st.store_id, total_quantity DESC;

CREATE OR REPLACE VIEW vm_manager_inventory_by_sku AS
SELECT
    s.sku_id,
    b.ISBN,
    b.name AS book_name,
    s.binding AS binding,
    s.unit_price,
    ib.store_id,
    st.name AS store_name,
    COALESCE(SUM(ib.quantity), 0) AS store_stock,
    AVG(ib.unit_cost) AS avg_cost,
    MIN(ib.received_date) AS earliest_batch,
    MAX(ib.received_date) AS latest_batch,
    COUNT(ib.batch_id) AS batch_count
FROM skus s
JOIN books b ON s.ISBN = b.ISBN
LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id
LEFT JOIN stores st ON ib.store_id = st.store_id
GROUP BY s.sku_id, b.ISBN, b.name, s.binding, s.unit_price, ib.store_id, st.name
ORDER BY s.sku_id, store_stock DESC;

CREATE OR REPLACE VIEW vm_manager_replenishment_requests AS
SELECT
    rr.request_id,
    rr.store_id,
    st.name AS store_name,
    rr.sku_id,
    sk.ISBN,
    b.name AS book_name,
    sk.binding AS binding,
    rr.requested_quantity,
    1 AS sku_count,
    rr.requested_quantity AS total_quantity,
    rr.urgency_level,
    rr.status,
    rr.request_date,
    rr.requested_by,
    CONCAT(e1.first_name, ' ', e1.last_name) AS requested_by_name,
    rr.reason,
    rr.approved_by,
    CONCAT(e2.first_name, ' ', e2.last_name) AS approved_by_name,
    rr.approval_date,
    rr.rejection_reason,
    rr.rejection_date,
    rr.completed_date,
    rr.note,
    COALESCE(SUM(ib.quantity), 0) AS current_stock
FROM replenishment_requests rr
JOIN stores st ON rr.store_id = st.store_id
JOIN skus sk ON rr.sku_id = sk.sku_id
JOIN books b ON sk.ISBN = b.ISBN
LEFT JOIN employees e1 ON rr.requested_by = e1.employee_id
LEFT JOIN employees e2 ON rr.approved_by = e2.employee_id
LEFT JOIN inventory_batches ib ON rr.sku_id = ib.sku_id AND rr.store_id = ib.store_id
GROUP BY rr.request_id, rr.store_id, st.name, rr.sku_id, sk.ISBN, b.name, sk.binding,
         rr.requested_quantity, rr.urgency_level, rr.status, rr.request_date,
         rr.requested_by, e1.first_name, e1.last_name, rr.reason,
         rr.approved_by, e2.first_name, e2.last_name, rr.approval_date,
         rr.rejection_reason, rr.rejection_date, rr.completed_date, rr.note
ORDER BY rr.request_date DESC;

-- ============================================================================
-- Purchase management views
-- ============================================================================

CREATE OR REPLACE VIEW vm_manager_purchases AS
SELECT
    p.purchase_id,
    p.store_id,
    st.name AS store_name,
    p.supplier_id,
    sup.name AS supplier_name,
    sup.phone AS supplier_phone,
    p.purchase_date,
    p.note,
    COUNT(DISTINCT pi.sku_id) AS items_count,
    COALESCE(SUM(pi.quantity), 0) AS total_quantity,
    COALESCE(SUM(pi.quantity * ib.unit_cost), 0) AS estimated_cost
FROM purchases p
JOIN stores st ON p.store_id = st.store_id
JOIN suppliers sup ON p.supplier_id = sup.supplier_id
LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
LEFT JOIN inventory_batches ib ON pi.sku_id = ib.sku_id AND p.purchase_id = ib.purchase_id
GROUP BY p.purchase_id, p.store_id, st.name, p.supplier_id, sup.name, sup.phone, p.purchase_date, p.note
ORDER BY p.purchase_date DESC;

CREATE OR REPLACE VIEW vm_manager_suppliers AS
SELECT
    s.supplier_id,
    s.name AS supplier_name,
    s.phone,
    s.address,
    s.email,
    COUNT(DISTINCT p.purchase_id) AS total_purchases,
    COUNT(DISTINCT p.store_id) AS stores_served,
    MAX(p.purchase_date) AS last_purchase_date,
    COALESCE(SUM(pi.quantity), 0) AS total_items_supplied,
    COALESCE(SUM(pi.quantity * ib.unit_cost), 0) AS total_purchase_value
FROM suppliers s
LEFT JOIN purchases p ON s.supplier_id = p.supplier_id
LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
LEFT JOIN inventory_batches ib ON pi.sku_id = ib.sku_id AND p.purchase_id = ib.purchase_id
GROUP BY s.supplier_id, s.name, s.phone, s.address, s.email
ORDER BY total_purchase_value DESC;

-- ============================================================================
-- Orders and sales views
-- ============================================================================

CREATE OR REPLACE VIEW vm_manager_orders_summary AS
SELECT
    o.order_id,
    o.store_id,
    st.name AS store_name,
    o.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.email AS member_email,
    o.order_status,
    o.order_date,
    o.note,
    COUNT(DISTINCT oi.sku_id) AS items_count,
    COALESCE(SUM(oi.quantity), 0) AS total_items,
    COALESCE(SUM(oi.quantity * s.unit_price), 0) AS order_total,
    p.payment_method,
    p.amount AS paid_amount,
    p.create_date AS payment_date
FROM orders o
JOIN stores st ON o.store_id = st.store_id
JOIN members m ON o.member_id = m.member_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN skus s ON oi.sku_id = s.sku_id
LEFT JOIN invoices inv ON o.order_id = inv.order_id
LEFT JOIN payment_allocations pa ON inv.invoice_id = pa.invoice_id
LEFT JOIN payments p ON pa.payment_id = p.payment_id
GROUP BY o.order_id, o.store_id, st.name, o.member_id, m.first_name, m.last_name,
         m.email, o.order_status, o.order_date, o.note, p.payment_method, p.amount, p.create_date
ORDER BY o.order_date DESC;

CREATE OR REPLACE VIEW vm_manager_sales_by_store AS
SELECT
    st.store_id,
    st.name AS store_name,
    st.status AS store_status,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT CASE WHEN o.order_status IN ('paid', 'finished') THEN o.order_id END) AS paid_orders,
    COUNT(DISTINCT o.member_id) AS unique_customers,
    COALESCE(SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price ELSE 0 END), 0) AS total_revenue,
    AVG(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price END) AS avg_order_value,
    COALESCE(SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity ELSE 0 END), 0) AS total_items_sold,
    DATE(MAX(o.order_date)) AS last_order_date
FROM stores st
LEFT JOIN orders o ON st.store_id = o.store_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN skus s ON oi.sku_id = s.sku_id
GROUP BY st.store_id, st.name, st.status
ORDER BY total_revenue DESC;

CREATE OR REPLACE VIEW vm_manager_sales_by_category AS
SELECT
    c.category_id,
    c.name AS category_name,
    COUNT(DISTINCT o.order_id) AS orders_count,
    COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
    COALESCE(SUM(
        (oi.quantity * s.unit_price) /
        NULLIF((SELECT COUNT(*) FROM book_categories bc2 WHERE bc2.ISBN = b.ISBN), 0)
    ), 0) AS total_sales,
    AVG(s.unit_price) AS avg_price,
    COUNT(DISTINCT b.ISBN) AS books_in_category,
    ROUND(
        COALESCE(SUM(
            (oi.quantity * s.unit_price) /
            NULLIF((SELECT COUNT(*) FROM book_categories bc2 WHERE bc2.ISBN = b.ISBN), 0)
        ), 0) /
        NULLIF((SELECT SUM(oi2.quantity * s2.unit_price)
                FROM order_items oi2
                JOIN skus s2 ON oi2.sku_id = s2.sku_id
                JOIN orders o2 ON oi2.order_id = o2.order_id
                WHERE o2.order_status IN ('paid', 'finished')), 0) * 100, 2
    ) AS revenue_percentage
FROM catagories c
JOIN book_categories bc ON c.category_id = bc.category_id
JOIN books b ON bc.ISBN = b.ISBN
JOIN skus s ON b.ISBN = s.ISBN
LEFT JOIN order_items oi ON s.sku_id = oi.sku_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status IN ('paid', 'finished')
GROUP BY c.category_id, c.name
ORDER BY total_sales DESC;

-- ============================================================================
-- Analytics views
-- ============================================================================

CREATE OR REPLACE VIEW vm_manager_payment_analysis AS
SELECT
    payment_method,
    COUNT(*) AS payment_count,
    COALESCE(SUM(amount), 0) AS total_amount,
    ROUND(AVG(amount), 2) AS avg_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount,
    (SELECT COUNT(DISTINCT o.store_id)
     FROM payment_allocations pa
     JOIN invoices inv ON pa.invoice_id = inv.invoice_id
     JOIN orders o ON inv.order_id = o.order_id
     WHERE pa.payment_id IN (SELECT payment_id FROM payments p2 WHERE p2.payment_method = p.payment_method)
    ) AS stores_count,
    DATE(MIN(create_date)) AS first_payment_date,
    DATE(MAX(create_date)) AS last_payment_date,
    ROUND(
        COALESCE(SUM(amount), 0) /
        NULLIF((SELECT SUM(amount) FROM payments), 0) * 100, 2
    ) AS percentage_of_total
FROM payments p
GROUP BY payment_method
ORDER BY total_amount DESC;

CREATE OR REPLACE VIEW vm_manager_bestsellers AS
SELECT
    b.ISBN,
    b.name AS book_name,
    b.publisher,
    b.language,
    (SELECT GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ')
     FROM book_categories bc
     JOIN catagories c ON bc.category_id = c.category_id
     WHERE bc.ISBN = b.ISBN) AS categories,
    COUNT(DISTINCT o.order_id) AS orders_count,
    COALESCE(SUM(oi.quantity), 0) AS total_sold,
    COALESCE(SUM(oi.quantity * s.unit_price), 0) AS total_revenue,
    AVG(s.unit_price) AS avg_price,
    COUNT(DISTINCT o.store_id) AS stores_sold_in,
    COUNT(DISTINCT o.member_id) AS unique_buyers,
    RANK() OVER (ORDER BY SUM(oi.quantity) DESC) AS sales_rank
FROM books b
JOIN skus s ON b.ISBN = s.ISBN
JOIN order_items oi ON s.sku_id = oi.sku_id
JOIN orders o ON oi.order_id = o.order_id AND o.order_status IN ('paid', 'finished')
GROUP BY b.ISBN, b.name, b.publisher, b.language
ORDER BY total_sold DESC
LIMIT 50;

CREATE OR REPLACE VIEW vm_manager_store_performance AS
SELECT
    st.store_id,
    st.name AS store_name,
    st.status,
    st.telephone,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price ELSE 0 END), 0) AS revenue,
    COUNT(DISTINCT o.member_id) AS unique_customers,
    (SELECT COUNT(*) FROM employees e WHERE e.store_id = st.store_id) AS staff_count,
    (SELECT ROUND(AVG(performance), 2) FROM employees e WHERE e.store_id = st.store_id) AS avg_employee_performance,
    (SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM inventory_batches ib WHERE ib.store_id = st.store_id) AS inventory_value,
    (SELECT COALESCE(SUM(quantity), 0) FROM inventory_batches ib WHERE ib.store_id = st.store_id) AS total_inventory,
    ROUND(
        COALESCE(SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price ELSE 0 END), 0) /
        NULLIF((SELECT COUNT(*) FROM employees e WHERE e.store_id = st.store_id), 0), 2
    ) AS revenue_per_employee,
    RANK() OVER (ORDER BY SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price ELSE 0 END) DESC) AS revenue_rank
FROM stores st
LEFT JOIN orders o ON st.store_id = o.store_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN skus s ON oi.sku_id = s.sku_id
GROUP BY st.store_id, st.name, st.status, st.telephone
ORDER BY revenue DESC;

-- Compatibility views for existing code paths
CREATE OR REPLACE VIEW vw_manager_employees AS
SELECT * FROM vm_manager_employees;

CREATE OR REPLACE VIEW vw_manager_employee_performance AS
SELECT * FROM vm_manager_employee_performance;

CREATE OR REPLACE VIEW vw_manager_staff_by_store AS
SELECT * FROM vm_manager_staff_by_store;

CREATE OR REPLACE VIEW vw_manager_inventory_overview AS
SELECT * FROM vm_manager_inventory_overview;

CREATE OR REPLACE VIEW vw_manager_inventory_by_store AS
SELECT * FROM vm_manager_inventory_by_store;

CREATE OR REPLACE VIEW vw_manager_inventory_by_sku AS
SELECT * FROM vm_manager_inventory_by_sku;

CREATE OR REPLACE VIEW vw_manager_replenishment_requests AS
SELECT * FROM vm_manager_replenishment_requests;

CREATE OR REPLACE VIEW vw_manager_purchases AS
SELECT * FROM vm_manager_purchases;

CREATE OR REPLACE VIEW vw_manager_suppliers AS
SELECT * FROM vm_manager_suppliers;

CREATE OR REPLACE VIEW vw_manager_orders_summary AS
SELECT * FROM vm_manager_orders_summary;

CREATE OR REPLACE VIEW vw_manager_sales_by_store AS
SELECT * FROM vm_manager_sales_by_store;

CREATE OR REPLACE VIEW vw_manager_sales_by_category AS
SELECT * FROM vm_manager_sales_by_category;

CREATE OR REPLACE VIEW vw_manager_payment_analysis AS
SELECT * FROM vm_manager_payment_analysis;

CREATE OR REPLACE VIEW vw_manager_bestsellers AS
SELECT * FROM vm_manager_bestsellers;

CREATE OR REPLACE VIEW vw_manager_store_performance AS
SELECT * FROM vm_manager_store_performance;

SELECT 'manager views created' AS message;

-- ============================================================================
-- Source: finance_views.sql
-- ============================================================================
-- finance_views.sql
USE book_store;

CREATE OR REPLACE VIEW vm_finance_invoice_base AS
SELECT
    i.invoice_id,
    i.order_id,
    o.store_id,
    o.member_id,
    o.order_status,
    o.order_date,
    i.invoice_status,
    i.invoice_number,
    i.issue_date,
    i.due_date,
    i.update_date,
    i.note
FROM invoices i
JOIN orders o ON o.order_id = i.order_id;

CREATE OR REPLACE VIEW vm_finance_invoice_paid_sum AS
SELECT
    pa.invoice_id,
    ROUND(SUM(pa.allocated_amount), 2) AS paid_amount,
    MAX(pa.create_date) AS last_paid_at
FROM payment_allocations pa
GROUP BY pa.invoice_id;

CREATE OR REPLACE VIEW vm_finance_invoice_payment_allocation_detail AS
SELECT
    pa.invoice_id,
    pa.payment_id,
    pa.create_date AS allocation_date,
    pa.allocated_amount AS allocated_amount,
    pa.note AS allocation_note,
    p.member_id,
    p.payment_method,
    p.amount AS payment_amount,
    p.create_date AS payment_create_date,
    p.update_date AS payment_update_date,
    p.note AS payment_note
FROM payment_allocations pa
JOIN payments p ON p.payment_id = pa.payment_id;

CREATE OR REPLACE VIEW vm_finance_order_amount_base AS
SELECT
    o.order_id,
    o.store_id,
    o.member_id,
    o.order_status,
    o.order_date,
    o.note,
    IFNULL(SUM(oi.quantity * s.unit_price), 0) AS gross_amount
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.order_id
LEFT JOIN skus s ON s.sku_id = oi.sku_id
GROUP BY o.order_id, o.store_id, o.member_id, o.order_status, o.order_date, o.note;

CREATE OR REPLACE VIEW vm_finance_order_member_rate AS
SELECT
    o.order_id,
    m.member_tier_id,
    t.discount_rate,
    t.earn_point_rate,
    t.min_lifetime_spend
FROM orders o
JOIN members m ON m.member_id = o.member_id
JOIN member_tiers t ON t.member_tier_id = m.member_tier_id;

CREATE OR REPLACE VIEW vm_finance_order_paid_sum AS
SELECT
    i.order_id,
    IFNULL(SUM(pa.allocated_amount), 0) AS paid_amount,
    MAX(pa.create_date) AS last_paid_at
FROM invoices i
LEFT JOIN payment_allocations pa ON pa.invoice_id = i.invoice_id
GROUP BY i.order_id;

CREATE OR REPLACE VIEW vm_finance_order_points_summary AS
SELECT
    pl.order_id,
    SUM(pl.points_delta) AS points_net,
    SUM(CASE WHEN pl.points_delta > 0 THEN pl.points_delta ELSE 0 END) AS points_earned,
    SUM(CASE WHEN pl.points_delta < 0 THEN -pl.points_delta ELSE 0 END) AS points_redeemed
FROM point_ledgers pl
GROUP BY pl.order_id;

CREATE OR REPLACE VIEW vw_finance_order_settlement AS
SELECT
    b.order_id,
    b.store_id,
    b.member_id,
    b.order_status,
    b.order_date,
    b.note,
    r.discount_rate,
    r.earn_point_rate,
    b.gross_amount,
    ROUND((b.gross_amount * r.discount_rate), 2) AS discounted_amount,
    IFNULL(p.points_earned, 0) AS earned_points,
    IFNULL(p.points_redeemed, 0) AS redeemed_points,
    ROUND(
        CASE
            WHEN r.earn_point_rate IS NULL OR r.earn_point_rate = 0 THEN 0
            ELSE (IFNULL(p.points_redeemed, 0) / r.earn_point_rate)
        END,
        2
    ) AS points_discount_amount,
    ROUND(
        GREATEST(
            (b.gross_amount * r.discount_rate)
            - (
                CASE
                    WHEN r.earn_point_rate IS NULL OR r.earn_point_rate = 0 THEN 0
                    ELSE (IFNULL(p.points_redeemed, 0) / r.earn_point_rate)
                END
            ),
            0
        ),
        2
    ) AS payable_amount,
    IFNULL(ps.paid_amount, 0) AS paid_amount,
    ps.last_paid_at,
    CASE
        WHEN IFNULL(ps.paid_amount, 0) >= ROUND(
            GREATEST(
                (b.gross_amount * r.discount_rate)
                - (
                    CASE
                        WHEN r.earn_point_rate IS NULL OR r.earn_point_rate = 0 THEN 0
                        ELSE (IFNULL(p.points_redeemed, 0) / r.earn_point_rate)
                    END
                ),
                0
            ),
            2
        ) THEN 1
        ELSE 0
    END AS is_settled,
    FLOOR((ROUND(GREATEST((b.gross_amount * r.discount_rate), 0), 2) * r.earn_point_rate)) AS expected_earned_points
FROM vm_finance_order_amount_base b
LEFT JOIN vm_finance_order_member_rate r ON r.order_id = b.order_id
LEFT JOIN vm_finance_order_points_summary p ON p.order_id = b.order_id
LEFT JOIN vm_finance_order_paid_sum ps ON ps.order_id = b.order_id;

CREATE OR REPLACE VIEW vm_invoice_settlement AS
SELECT
    b.invoice_id,
    b.invoice_number,
    b.invoice_status,
    b.issue_date,
    b.due_date,
    b.update_date,
    b.note,
    b.order_id,
    b.store_id,
    b.member_id,
    b.order_status,
    b.order_date,
    s.payable_amount AS invoice_amount,
    IFNULL(ps.paid_amount, 0) AS paid_amount,
    ROUND(GREATEST((IFNULL(s.payable_amount, 0) - IFNULL(ps.paid_amount, 0)), 0), 2) AS outstanding_amount,
    ps.last_paid_at,
    CASE
        WHEN (IFNULL(ps.paid_amount, 0) >= IFNULL(s.payable_amount, 0)) AND (s.payable_amount IS NOT NULL) THEN 1
        ELSE 0
    END AS is_settled
FROM vm_finance_invoice_base b
LEFT JOIN vm_finance_invoice_paid_sum ps ON ps.invoice_id = b.invoice_id
LEFT JOIN vw_finance_order_settlement s ON s.order_id = b.order_id;

CREATE OR REPLACE VIEW vw_finance_order_list AS
SELECT
    o.order_id,
    o.store_id,
    st.name AS store_name,
    o.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    o.order_status,
    o.order_date,
    o.note,
    o.payable_amount,
    o.paid_amount,
    o.is_settled,
    COUNT(oi.sku_id) AS item_count,
    COALESCE(SUM(oi.quantity), 0) AS total_quantity
FROM vw_finance_order_settlement o
JOIN stores st ON st.store_id = o.store_id
JOIN members m ON m.member_id = o.member_id
LEFT JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY
    o.order_id,
    o.store_id,
    st.name,
    o.member_id,
    m.first_name,
    m.last_name,
    o.order_status,
    o.order_date,
    o.note,
    o.payable_amount,
    o.paid_amount,
    o.is_settled;

CREATE OR REPLACE VIEW vw_finance_invoice_list AS
SELECT
    i.invoice_id,
    i.invoice_number,
    i.order_id,
    i.store_id,
    st.name AS store_name,
    i.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    i.invoice_status,
    i.issue_date,
    i.due_date,
    i.invoice_amount,
    i.paid_amount,
    i.outstanding_amount,
    i.last_paid_at,
    i.is_settled,
    CASE
        WHEN i.invoice_status IN ('voided', 'credited') THEN 'VOID'
        WHEN i.is_settled = 1 THEN 'PAID'
        WHEN i.paid_amount > 0 THEN 'PARTIAL'
        WHEN i.due_date < NOW() THEN 'OVERDUE'
        ELSE 'UNPAID'
    END AS display_status
FROM vm_invoice_settlement i
JOIN stores st ON st.store_id = i.store_id
JOIN members m ON m.member_id = i.member_id;

CREATE OR REPLACE VIEW vw_finance_revenue_by_date AS
SELECT
    DATE(order_date) AS order_day,
    SUM(payable_amount) AS revenue
FROM vw_finance_order_settlement
WHERE is_settled = 1
GROUP BY DATE(order_date);

CREATE OR REPLACE VIEW vw_finance_purchase_cost_by_date AS
SELECT
    DATE(received_date) AS cost_day,
    SUM(unit_cost * quantity) AS cost
FROM inventory_batches
GROUP BY DATE(received_date);
