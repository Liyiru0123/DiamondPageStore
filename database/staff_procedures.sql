DELIMITER //

-- =============================================
-- 1. 获取指定门店的库存列表 (包含低库存逻辑)
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_get_inventory //
CREATE PROCEDURE sp_staff_get_inventory(
    IN p_store_id INT,
    IN p_search_term VARCHAR(255),
    IN p_category VARCHAR(100),
    IN p_stock_level VARCHAR(20),
    IN p_hide_zero BOOLEAN,
    IN p_sort_by VARCHAR(20)
)
BEGIN
    -- 确保清理旧的临时表，防止架构不一致
    DROP TEMPORARY TABLE IF EXISTS temp_inventory;

    -- 临时表存储计算后的库存
    CREATE TEMPORARY TABLE temp_inventory AS
    SELECT
        b.ISBN,
        b.name AS book_name,
        b.publisher,
        b.language,
        b.introduction,
        
        -- 获取作者信息 (取第一个作者)
        (
            SELECT a.first_name 
            FROM authors a 
            JOIN book_authors ba ON a.author_id = ba.author_id 
            WHERE ba.ISBN = b.ISBN 
            LIMIT 1
        ) AS author_first,
        (
            SELECT a.last_name 
            FROM authors a 
            JOIN book_authors ba ON a.author_id = ba.author_id 
            WHERE ba.ISBN = b.ISBN 
            LIMIT 1
        ) AS author_last,
        (
            SELECT a.country 
            FROM authors a 
            JOIN book_authors ba ON a.author_id = ba.author_id 
            WHERE ba.ISBN = b.ISBN 
            LIMIT 1
        ) AS author_country,
        
        -- 获取分类名称（逗号分隔）
        (
            SELECT GROUP_CONCAT(c.name SEPARATOR ', ')
            FROM book_categories bc
            JOIN catagories c ON bc.category_id = c.category_id
            WHERE bc.ISBN = b.ISBN
        ) AS category,
        
        s.binding,
        s.unit_price,
        s.sku_id,
        
        -- 计算库存
        COALESCE(SUM(ib.quantity), 0) AS quantity,
        
        -- 获取批次号
        (
            SELECT batch_code
            FROM inventory_batches ib2
            WHERE ib2.sku_id = s.sku_id AND ib2.store_id = p_store_id
            ORDER BY ib2.received_date DESC LIMIT 1
        ) AS batch_number,
        
        -- 获取最新的 batch_id 用于编辑
        (
            SELECT batch_id
            FROM inventory_batches ib3
            WHERE ib3.sku_id = s.sku_id AND ib3.store_id = p_store_id
            ORDER BY ib3.received_date DESC LIMIT 1
        ) AS batch_id

    FROM
        books b
    JOIN
        skus s ON b.ISBN = s.ISBN
    LEFT JOIN
        inventory_batches ib ON s.sku_id = ib.sku_id AND ib.store_id = p_store_id
    GROUP BY
        s.sku_id, b.ISBN, b.name, b.publisher, b.language, b.introduction, s.binding, s.unit_price;
    
    -- 应用筛选条件并返回结果
    SELECT * FROM temp_inventory
    WHERE
        -- 搜索条件：书名或ISBN包含搜索词 (增加 COLLATE 修复字符集冲突)
        (p_search_term IS NULL OR p_search_term = '' OR
         book_name LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_general_ci OR
         ISBN LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_general_ci)
        
        -- 类别条件：使用FIND_IN_SET或LIKE匹配逗号分隔的类别
        AND (p_category IS NULL OR p_category = '' OR
             FIND_IN_SET(p_category, REPLACE(category, ', ', ',')) > 0)
        
        -- 库存等级条件
        AND (p_stock_level IS NULL OR p_stock_level = '' OR
             (p_stock_level = 'low' AND quantity <= 5) OR
             (p_stock_level = 'medium' AND quantity > 5 AND quantity <= 20) OR
             (p_stock_level = 'high' AND quantity > 20))
        
        -- 隐藏库存为0
        AND (p_hide_zero = FALSE OR quantity > 0)
    
    ORDER BY
        CASE
            WHEN p_sort_by = 'title-asc' THEN book_name
        END ASC,
        CASE
            WHEN p_sort_by = 'title-desc' THEN book_name
        END DESC,
        CASE
            WHEN p_sort_by = 'price-asc' THEN unit_price
        END ASC,
        CASE
            WHEN p_sort_by = 'price-desc' THEN unit_price
        END DESC,
        CASE
            WHEN p_sort_by = 'stock-asc' THEN quantity
        END ASC,
        CASE
            WHEN p_sort_by = 'stock-desc' THEN quantity
        END DESC,
        -- 默认排序
        book_name ASC;
    
    -- 清理临时表
    DROP TEMPORARY TABLE IF EXISTS temp_inventory;
END //

-- =============================================
-- 2. 获取指定门店的订单列表 (支持筛选)
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_get_orders //
CREATE PROCEDURE sp_staff_get_orders(
    IN p_store_id INT,
    IN p_search_term VARCHAR(255),
    IN p_status VARCHAR(50),
    IN p_date_from DATE,
    IN p_date_to DATE
)
BEGIN
    SELECT 
        o.order_id,
        CONCAT(m.first_name, ' ', m.last_name) AS customer_name,
        o.order_date,
        o.order_status,
        COUNT(oi.sku_id) AS items_count,
        COALESCE(SUM(oi.quantity * s.unit_price), 0) AS total_amount
    FROM orders o
    JOIN members m ON o.member_id = m.member_id
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN skus s ON oi.sku_id = s.sku_id
    WHERE o.store_id = p_store_id
        AND (p_search_term IS NULL OR p_search_term = '' OR 
             CAST(o.order_id AS CHAR) LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_general_ci OR 
             CONCAT(m.first_name, ' ', m.last_name) LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_general_ci)
        AND (p_status IS NULL OR p_status = '' OR o.order_status = p_status)
        AND (p_date_from IS NULL OR DATE(o.order_date) >= p_date_from)
        AND (p_date_to IS NULL OR DATE(o.order_date) <= p_date_to)
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

-- =============================================
-- 5. 更新库存批次数量
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_update_inventory //
CREATE PROCEDURE sp_staff_update_inventory(
    IN p_sku_id INT,
    IN p_store_id INT,
    IN p_quantity INT,
    IN p_batch_code VARCHAR(50)
)
BEGIN
    DECLARE v_batch_id INT;
    DECLARE v_purchase_id INT;
    DECLARE v_unit_price DECIMAL(9,2);
    
    -- 查找该SKU在该门店的最新批次
    SELECT batch_id INTO v_batch_id
    FROM inventory_batches
    WHERE sku_id = p_sku_id AND store_id = p_store_id
    ORDER BY received_date DESC
    LIMIT 1;
    
    IF v_batch_id IS NOT NULL THEN
        -- 更新现有批次
        UPDATE inventory_batches
        SET quantity = p_quantity,
            batch_code = COALESCE(p_batch_code, batch_code)
        WHERE batch_id = v_batch_id;
    ELSE
        -- 获取单价作为成本
        SELECT unit_price INTO v_unit_price FROM skus WHERE sku_id = p_sku_id;

        -- 创建一个已完成的进货记录
        INSERT INTO purchases (store_id, supplier_id, purchase_date, note, status)
        SELECT p_store_id, supplier_id, NOW(), 'Manual inventory update', 'completed'
        FROM suppliers LIMIT 1;
        SET v_purchase_id = LAST_INSERT_ID();

        -- 创建新批次
        INSERT INTO inventory_batches (sku_id, store_id, purchase_id, quantity, unit_cost, batch_code, received_date)
        VALUES (p_sku_id, p_store_id, v_purchase_id, p_quantity, COALESCE(v_unit_price, 0), p_batch_code, NOW());
    END IF;
END //

-- =============================================
-- 6. 添加新书 (涉及多表操作)
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_add_new_book //
CREATE PROCEDURE sp_staff_add_new_book(
    IN p_isbn CHAR(13),
    IN p_name VARCHAR(50),
    IN p_language VARCHAR(50),
    IN p_publisher VARCHAR(50),
    IN p_introduction VARCHAR(255),
    IN p_author_first VARCHAR(50),
    IN p_author_last VARCHAR(50),
    IN p_author_country VARCHAR(50),
    IN p_category_id INT,
    IN p_binding ENUM('Hardcover','Paperback','Mass Market Paperback'),
    IN p_unit_price DECIMAL(9,2),
    IN p_store_id INT,
    IN p_initial_quantity INT,
    IN p_batch_code VARCHAR(50)
)
BEGIN
    DECLARE v_author_id INT;
    DECLARE v_sku_id INT;
    DECLARE v_purchase_id INT;
    
    -- 开启事务 (由 PHP 层控制或在此处控制，根据规范建议在存储过程内处理逻辑)
    
    -- 1. 插入 books 表 (如果不存在)
    INSERT IGNORE INTO books (ISBN, name, language, publisher, introduction)
    VALUES (p_isbn, p_name, p_language, p_publisher, p_introduction);
    
    -- 2. 处理作者 (查找或创建)
    SELECT author_id INTO v_author_id 
    FROM authors 
    WHERE first_name = p_author_first AND last_name = p_author_last 
    LIMIT 1;
    
    IF v_author_id IS NULL THEN
        INSERT INTO authors (first_name, last_name, country)
        VALUES (p_author_first, p_author_last, p_author_country);
        SET v_author_id = LAST_INSERT_ID();
    END IF;
    
    -- 3. 关联书籍与作者 (如果未关联)
    INSERT IGNORE INTO book_authors (author_id, ISBN)
    VALUES (v_author_id, p_isbn);
    
    -- 4. 关联书籍与分类 (如果未关联)
    IF p_category_id IS NOT NULL AND p_category_id > 0 THEN
        INSERT IGNORE INTO book_categories (category_id, ISBN)
        VALUES (p_category_id, p_isbn);
    END IF;
    
    -- 5. 创建 SKU (如果该装订方式不存在)
    SELECT sku_id INTO v_sku_id 
    FROM skus 
    WHERE ISBN = p_isbn AND binding = p_binding 
    LIMIT 1;
    
    IF v_sku_id IS NULL THEN
        INSERT INTO skus (ISBN, unit_price, binding)
        VALUES (p_isbn, p_unit_price, p_binding);
        SET v_sku_id = LAST_INSERT_ID();
    ELSE
        -- 如果 SKU 已存在，更新价格
        UPDATE skus SET unit_price = p_unit_price WHERE sku_id = v_sku_id;
    END IF;
    
    -- 6. 创建初始库存批次 (如果数量 > 0)
    IF p_initial_quantity > 0 THEN
        -- 6.1 创建一个已完成的进货记录作为初始库存来源
        -- 这里假设至少有一个供应商，或者使用一个默认供应商
        INSERT INTO purchases (store_id, supplier_id, purchase_date, note, status)
        SELECT p_store_id, supplier_id, NOW(), 'Initial stock for new book', 'completed'
        FROM suppliers LIMIT 1;
        
        SET v_purchase_id = LAST_INSERT_ID();

        -- 6.2 插入批次
        INSERT INTO inventory_batches (sku_id, store_id, purchase_id, quantity, unit_cost, received_date, batch_code)
        VALUES (v_sku_id, p_store_id, v_purchase_id, p_initial_quantity, p_unit_price, NOW(), p_batch_code);
    END IF;
    
END //

-- =============================================
-- 7. 更新订单状态
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_update_order_status //
CREATE PROCEDURE sp_staff_update_order_status(
    IN p_order_id INT,
    IN p_status ENUM('created','paid','cancelled','refunded','finished')
)
BEGIN
    UPDATE orders 
    SET order_status = p_status 
    WHERE order_id = p_order_id;
END //

-- =============================================
-- 8. 获取指定门店的补货请求列表
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_get_stock_requests //
CREATE PROCEDURE sp_staff_get_stock_requests(
    IN p_store_id INT
)
BEGIN
    SELECT 
        request_id,
        request_date,
        requested_quantity,
        status,
        book_name,
        ISBN,
        urgency_level,
        note
    FROM vw_manager_replenishment_requests
    WHERE store_id = p_store_id
    ORDER BY request_date DESC;
END //

-- =============================================
-- 9. 创建补货请求
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_create_replenishment_request //
CREATE PROCEDURE sp_staff_create_replenishment_request(
    IN p_store_id INT,
    IN p_sku_id INT,
    IN p_quantity INT,
    IN p_requested_by INT,
    IN p_reason VARCHAR(500),
    IN p_note VARCHAR(500)
)
BEGIN
    INSERT INTO replenishment_requests (
        store_id, 
        sku_id, 
        requested_quantity, 
        requested_by, 
        reason, 
        note, 
        status, 
        request_date
    )
    VALUES (
        p_store_id, 
        p_sku_id, 
        p_quantity, 
        p_requested_by, 
        p_reason, 
        p_note, 
        'pending', 
        NOW()
    );
END //

-- =============================================
-- 10. 完成补货请求 (收货)
-- =============================================
DROP PROCEDURE IF EXISTS sp_staff_complete_replenishment_request //
CREATE PROCEDURE sp_staff_complete_replenishment_request(
    IN p_request_id INT
)
BEGIN
    UPDATE replenishment_requests 
    SET status = 'completed',
        completed_date = NOW()
    WHERE request_id = p_request_id;
END //

DELIMITER ;
