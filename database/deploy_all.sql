-- deploy_all.sql
-- 一键部署脚本：升级表结构 + 创建视图 + 创建存储过程
-- 使用方法：导入 new_data_book_store.sql 后，执行此文件

USE book_store;

-- =============================================================================
-- 第一部分：升级 point_ledgers 表结构
-- =============================================================================

-- 清空表数据（旧数据无法匹配新结构）
TRUNCATE TABLE point_ledgers;

-- 添加新列
ALTER TABLE point_ledgers
ADD COLUMN member_id INT NOT NULL AFTER point_ledger_id;

ALTER TABLE point_ledgers
ADD COLUMN points_change INT NOT NULL AFTER member_id;

-- 修改 order_id 为可为 NULL
ALTER TABLE point_ledgers
MODIFY COLUMN order_id INT NULL;

-- 重命名列
ALTER TABLE point_ledgers
CHANGE COLUMN create_date change_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE point_ledgers
CHANGE COLUMN note reason VARCHAR(255) NULL;

-- 添加外键约束
ALTER TABLE point_ledgers
ADD CONSTRAINT fk_point_ledgers_members
FOREIGN KEY (member_id) REFERENCES members(member_id) ON UPDATE CASCADE;

ALTER TABLE point_ledgers
ADD CONSTRAINT fk_point_ledgers_orders
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE ON UPDATE CASCADE;

SELECT '✅ 步骤1/3: point_ledgers 表升级完成' AS status;

-- =============================================================================
-- 第二部分：创建视图（从 view.sql 复制）
-- =============================================================================

-- 1. 员工库存详情视图
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
    s.binding,
    b.ISBN,
    b.name AS book_name,
    b.publisher,
    b.language
FROM inventory_batches ib
JOIN skus s ON ib.sku_id = s.sku_id
JOIN books b ON s.ISBN = b.ISBN;

-- 2. 员工低库存预警视图
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

-- 4. 顾客书籍列表视图
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
    (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS author,
    (SELECT GROUP_CONCAT(c.name SEPARATOR ', ')
     FROM book_categories bc
     JOIN catagories c ON bc.category_id = c.category_id
     WHERE bc.ISBN = b.ISBN) AS category,
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
    (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS author,
    (SELECT GROUP_CONCAT(DISTINCT a.country SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS author_country,
    (SELECT GROUP_CONCAT(c.name SEPARATOR ', ')
     FROM book_categories bc
     JOIN catagories c ON bc.category_id = c.category_id
     WHERE bc.ISBN = b.ISBN) AS category,
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
CREATE OR REPLACE VIEW vw_customer_orders AS
SELECT
    o.order_id,
    o.member_id,
    o.store_id,
    o.order_status,
    o.order_date,
    o.note,
    st.name AS store_name,
    (SELECT SUM(oi.quantity * s.unit_price)
     FROM order_items oi
     JOIN skus s ON oi.sku_id = s.sku_id
     WHERE oi.order_id = o.order_id) AS total_price,
    (SELECT SUM(oi.quantity)
     FROM order_items oi
     WHERE oi.order_id = o.order_id) AS total_items
FROM orders o
JOIN stores st ON o.store_id = st.store_id;

-- 8. 顾客订单详情视图
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

-- 11. 会员积分历史视图
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

-- 12. 会员积分汇总视图
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

SELECT '✅ 步骤2/3: 12个视图创建完成' AS status;

-- =============================================================================
-- 第三部分：不包含存储过程（因为太长，需要单独执行 procedures.sql）
-- =============================================================================

SELECT '✅ 数据库部署完成！' AS final_status;
SELECT '⚠️  请继续执行 database/procedures.sql 创建存储过程' AS next_step;
