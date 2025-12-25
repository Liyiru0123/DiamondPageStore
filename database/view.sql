-- view.sql
-- 基于 new_data_book_store.sql 结构生成的视图文件
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
    s.bingding,  -- 对应数据库中的实际字段名
    b.ISBN,
    b.name AS book_name, -- 对应 books 表的 name 字段
    b.publisher,
    b.language
FROM inventory_batches ib
JOIN skus s ON ib.sku_id = s.sku_id
JOIN books b ON s.ISBN = b.ISBN;

-- 2. 员工低库存预警视图
-- 用于 Dashboard 的 Low Stock Alerts
CREATE OR REPLACE VIEW vw_staff_low_stock AS
SELECT 
    s.sku_id,
    b.ISBN,
    b.name AS book_name,
    s.bingding,
    ib.store_id,
    COALESCE(SUM(ib.quantity), 0) AS total_stock
FROM skus s
JOIN books b ON s.ISBN = b.ISBN
LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id
GROUP BY s.sku_id, b.ISBN, b.name, s.bingding, ib.store_id;

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