DELIMITER //

-- =============================================
-- 1. 获取指定门店的库存列表 (包含低库存逻辑)
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_get_inventory //
CREATE PROCEDURE sp_staff_get_inventory(
    IN p_store_id INT
)
BEGIN
    SELECT 
        b.name AS title,
        GROUP_CONCAT(DISTINCT a.last_name SEPARATOR ', ') AS author, -- 聚合作者名
        s.ISBN,
        s.binding AS category, -- 使用 binding 作为分类展示
        s.unit_price AS price,
        s.sku_id,
        COALESCE(SUM(ib.quantity), 0) AS stock, -- 计算该 SKU 在该店的总库存
        CASE 
            WHEN COALESCE(SUM(ib.quantity), 0) <= 5 THEN 'low'
            WHEN COALESCE(SUM(ib.quantity), 0) <= 20 THEN 'medium'
            ELSE 'high'
        END AS stock_status
    FROM skus s
    JOIN books b ON s.ISBN = b.ISBN
    LEFT JOIN book_authors ba ON b.ISBN = ba.ISBN
    LEFT JOIN authors a ON ba.author_id = a.author_id
    LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id AND ib.store_id = p_store_id
    GROUP BY s.sku_id, b.name, s.ISBN, s.binding, s.unit_price;
END //

-- =============================================
-- 2. 获取指定门店的订单列表
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_get_orders //
CREATE PROCEDURE sp_staff_get_orders(
    IN p_store_id INT
)
BEGIN
    SELECT 
        o.order_id,
        CONCAT(m.first_name, ' ', m.last_name) AS customer_name,
        o.order_date,
        o.order_status,
        COUNT(oi.sku_id) AS items_count, -- 订单包含几种商品
        SUM(oi.quantity * s.unit_price) AS total_amount -- 计算订单总价
    FROM orders o
    JOIN members m ON o.member_id = m.member_id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN skus s ON oi.sku_id = s.sku_id
    WHERE o.store_id = p_store_id
    GROUP BY o.order_id, m.first_name, m.last_name, o.order_date, o.order_status
    ORDER BY o.order_date DESC;
END //

-- =============================================
-- 3. 创建进货申请单 (事务的第一步：创建头信息)
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_create_purchase_header //
CREATE PROCEDURE sp_staff_create_purchase_header(
    IN p_store_id INT,
    IN p_supplier_id INT,
    IN p_note VARCHAR(255),
    OUT p_new_purchase_id INT
)
BEGIN
    -- 插入主表
    INSERT INTO purchases (store_id, supplier_id, purchase_date, note, status)
    VALUES (p_store_id, p_supplier_id, NOW(), p_note, 'pending');
    
    -- 返回生成的 ID
    SET p_new_purchase_id = LAST_INSERT_ID();
END //

-- =============================================
-- 4. 添加进货项 (事务的第二步：循环插入详情)
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_add_purchase_item //
CREATE PROCEDURE sp_staff_add_purchase_item(
    IN p_purchase_id INT,
    IN p_sku_id INT,
    IN p_quantity INT
)
BEGIN
    INSERT INTO purchase_items (purchase_id, sku_id, quantity)
    VALUES (p_purchase_id, p_sku_id, p_quantity);
END //

DELIMITER ;