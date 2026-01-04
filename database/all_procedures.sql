-- all_procedures.sql
-- Combined procedures (auth, customer, staff, manager, finance)

USE book_store;

-- ============================================================================
-- Source: auth_procedures.sql
-- ============================================================================
DELIMITER //

-- ---------------------------------------------------------
-- Procedure: sp_auth_get_user
-- 作用: 登录时根据用户名查询用户信息（包含明文密码）。
-- ---------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_auth_get_user//
CREATE PROCEDURE sp_auth_get_user(
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT 
        user_id,
        username,
        password_hash,
        user_types,
        status,
        job_title
    FROM vw_auth_details 
    WHERE username = p_username 
    LIMIT 1;
END //

-- ---------------------------------------------------------
-- Procedure: sp_auth_register_customer
-- 作用: 注册新顾客 (明文存储)。
-- 逻辑: 开启事务，同时向 users 表和 members 表插入数据。
-- ---------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_auth_register_customer//
CREATE PROCEDURE sp_auth_register_customer(
    IN p_username VARCHAR(50),
    IN p_password VARCHAR(50),   -- 接收明文密码，长度需符合数据库限制
    OUT p_message VARCHAR(100),
    OUT p_success BOOLEAN
)
BEGIN
    DECLARE v_user_id INT;
    
    -- 异常处理：回滚事务
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database Error: Registration failed.';
    END;

    -- 1. 检查用户名是否已存在
    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        SET p_success = FALSE;
        SET p_message = 'Username already exists.';
    ELSE
        -- 2. 开启事务
        START TRANSACTION;
        
        -- A. 插入 users 表
        -- 注意：直接将明文密码 p_password 存入 password_hash 字段
        -- 类型强制设为 'member'
        INSERT INTO users (username, password_hash, user_types, status, create_date)
        VALUES (p_username, p_password, 'member', 'active', NOW());
        
        SET v_user_id = LAST_INSERT_ID();
        
        -- B. 插入 members 表
        -- 填充必要的默认数据 (member_tier_id 设为 1, 积分为 0)
        INSERT INTO members (user_id, member_tier_id, first_name, last_name, point)
        VALUES (v_user_id, 1, p_username, 'Member', 0);
        
        -- 3. 提交事务
        COMMIT;
        
        SET p_success = TRUE;
        SET p_message = 'Registration successful.';
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- Source: customer_procedures.sql
-- ============================================================================
-- procedures.sql
-- 基于书店数据库的存储过程
-- 用于封装业务逻辑和事务处�?
-- Customer 端功能的存储过程

USE book_store;

DELIMITER $$

-- =========================================================================
-- CUSTOMER STORED PROCEDURES
-- 以下存储过程用于 Customer 端功能，包含事务处理确保数据一致�?
-- =========================================================================

-- 1. 添加收藏
-- 功能：将书籍添加到用户的收藏列表
DROP PROCEDURE IF EXISTS sp_customer_add_favorite$$
CREATE PROCEDURE sp_customer_add_favorite(
    IN p_member_id INT,
    IN p_isbn CHAR(13),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to add favorite';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 检查是否已收藏
    IF EXISTS (SELECT 1 FROM favorites WHERE member_id = p_member_id AND ISBN = p_isbn) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Book already in favorites';
        ROLLBACK;
    ELSE
        -- 添加收藏
        INSERT INTO favorites (member_id, ISBN, create_date)
        VALUES (p_member_id, p_isbn, NOW());

        SET p_result_code = 1;
        SET p_result_message = 'Favorite added successfully';
        COMMIT;
    END IF;
END$$

-- 2. 取消收藏
-- 功能：从用户的收藏列表中移除书籍
DROP PROCEDURE IF EXISTS sp_customer_remove_favorite$$
CREATE PROCEDURE sp_customer_remove_favorite(
    IN p_member_id INT,
    IN p_isbn CHAR(13),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to remove favorite';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 检查收藏是否存�?
    IF NOT EXISTS (SELECT 1 FROM favorites WHERE member_id = p_member_id AND ISBN = p_isbn) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Favorite not found';
        ROLLBACK;
    ELSE
        -- 删除收藏
        DELETE FROM favorites
        WHERE member_id = p_member_id AND ISBN = p_isbn;

        SET p_result_code = 1;
        SET p_result_message = 'Favorite removed successfully';
        COMMIT;
    END IF;
END$$

-- 3. 创建订单
-- 功能：从购物车数据创建订单（包含多个订单项）
-- 输入格式：p_cart_items �?JSON 格式，例如：[{"sku_id": 1, "quantity": 2}, {"sku_id": 3, "quantity": 1}]
DROP PROCEDURE IF EXISTS sp_customer_create_order$$
CREATE PROCEDURE sp_customer_create_order(
    IN p_member_id INT,
    IN p_store_id INT,
    IN p_cart_items JSON,
    IN p_note VARCHAR(255),
    OUT p_order_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_sku_id INT;
    DECLARE v_quantity INT;
    DECLARE v_stock INT;
    DECLARE v_book_name VARCHAR(255);
    DECLARE v_index INT DEFAULT 0;
    DECLARE v_items_count INT;
    DECLARE v_failed INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to create order';
        SET p_order_id = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 创建订单主记�?
    INSERT INTO orders (store_id, member_id, order_status, order_date, note)
    VALUES (p_store_id, p_member_id, 'created', NOW(), p_note);

    SET p_order_id = LAST_INSERT_ID();

    -- 获取购物车项数量
    SET v_items_count = JSON_LENGTH(p_cart_items);

    -- 循环处理每个购物车项
    item_loop: WHILE v_index < v_items_count DO
        -- 提取 sku_id �?quantity
        SET v_sku_id = JSON_UNQUOTE(JSON_EXTRACT(p_cart_items, CONCAT('$[', v_index, '].sku_id')));
        SET v_quantity = JSON_UNQUOTE(JSON_EXTRACT(p_cart_items, CONCAT('$[', v_index, '].quantity')));

        -- 检查库�?
        SELECT COALESCE(SUM(quantity), 0) INTO v_stock
        FROM inventory_batches
        WHERE sku_id = v_sku_id AND store_id = p_store_id;

        IF v_stock < v_quantity THEN
            SELECT b.name INTO v_book_name
            FROM skus s
            JOIN books b ON s.ISBN = b.ISBN
            WHERE s.sku_id = v_sku_id
            LIMIT 1;

            SET p_result_code = 0;
            SET p_result_message = CONCAT(
                '库存不足：',
                IFNULL(v_book_name, 'Unknown Book'),
                ' (SKU ',
                v_sku_id,
                ')，可用 ',
                v_stock,
                ' 本'
            );
            SET p_order_id = NULL;
            SET v_failed = 1;
            LEAVE item_loop;
        END IF;

        -- 添加订单�?
        INSERT INTO order_items (sku_id, order_id, quantity)
        VALUES (v_sku_id, p_order_id, v_quantity);

        SET v_index = v_index + 1;
    END WHILE item_loop;

    IF v_failed = 1 THEN
        ROLLBACK;
    ELSE
        SET p_result_code = 1;
        SET p_result_message = 'Order created successfully';
        COMMIT;
    END IF;
END$$

-- 4. 支付单个订单
-- 功能：处理订单支付，更新订单状态并扣减库存
DROP PROCEDURE IF EXISTS sp_customer_pay_order$$
CREATE PROCEDURE sp_customer_pay_order(
    IN p_order_id INT,
    IN p_payment_method VARCHAR(50),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_order_status VARCHAR(20);
    DECLARE v_store_id INT;
    DECLARE v_member_id INT;
    DECLARE v_sku_id INT;
    DECLARE v_quantity INT;
    DECLARE v_stock INT;
    DECLARE v_book_name VARCHAR(255);
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_payment_id INT;
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_failed INT DEFAULT 0;
    DECLARE v_invoice_id INT;
    DECLARE v_payment_method VARCHAR(50);
    DECLARE v_sqlstate CHAR(5);
    DECLARE v_errno INT;
    DECLARE v_errmsg TEXT;

    -- 声明游标
    DECLARE cur_order_items CURSOR FOR
        SELECT sku_id, quantity
        FROM order_items
        WHERE order_id = p_order_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_sqlstate = RETURNED_SQLSTATE, v_errno = MYSQL_ERRNO, v_errmsg = MESSAGE_TEXT;
        SET p_result_code = -1;
        SET p_result_message = CONCAT('Error: Failed to process payment (', v_sqlstate, '/', v_errno, '): ', v_errmsg);
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 检查订单是否存在且状态为 'created'
    SELECT order_status, store_id, member_id INTO v_order_status, v_store_id, v_member_id
    FROM orders
    WHERE order_id = p_order_id;

    IF v_order_status IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'Order not found';
        ROLLBACK;
    ELSEIF v_order_status != 'created' THEN
        SET p_result_code = 0;
        SET p_result_message = CONCAT('Order cannot be paid, status is: ', v_order_status);
        ROLLBACK;
    ELSE
        -- 计算订单总金�?
        SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0) INTO v_total_amount
        FROM order_items oi
        JOIN skus s ON oi.sku_id = s.sku_id
        WHERE oi.order_id = p_order_id;

        SET v_payment_method = CASE
            WHEN p_payment_method IN ('Credit Card', 'Third-Party Payment', 'Cash') THEN p_payment_method
            ELSE 'Credit Card'
        END;

        -- 创建支付记录
        INSERT INTO payments (member_id, create_date, update_date, amount, payment_method)
        VALUES (v_member_id, NOW(), NOW(), v_total_amount, v_payment_method);

        SET v_payment_id = LAST_INSERT_ID();

        -- 创建发票记录
        INSERT INTO invoices (order_id, invoice_status, invoice_number, issue_date, due_date, update_date, note)
        VALUES (p_order_id, 'issued', p_order_id, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW(), NULL);

        SET v_invoice_id = LAST_INSERT_ID();

        -- 关联支付和发�?
        INSERT INTO payment_allocations (invoice_id, payment_id, create_date, allocated_amount, note)
        VALUES (v_invoice_id, v_payment_id, NOW(), v_total_amount, NULL);

        -- 打开游标，扣减库�?
        OPEN cur_order_items;

        read_loop: LOOP
            FETCH cur_order_items INTO v_sku_id, v_quantity;

            IF v_done THEN
                LEAVE read_loop;
            END IF;

            -- 检查库存是否足�?
            SELECT COALESCE(SUM(quantity), 0) INTO v_stock
            FROM inventory_batches
            WHERE sku_id = v_sku_id AND store_id = v_store_id;

            IF v_stock < v_quantity THEN
                SELECT b.name INTO v_book_name
                FROM skus s
                JOIN books b ON s.ISBN = b.ISBN
                WHERE s.sku_id = v_sku_id
                LIMIT 1;

                SET p_result_code = 0;
                SET p_result_message = CONCAT(
                    '库存不足：',
                    IFNULL(v_book_name, 'Unknown Book'),
                    ' (SKU ',
                    v_sku_id,
                    ')，可用 ',
                    v_stock,
                    ' 本'
                );
                SET v_failed = 1;
                LEAVE read_loop;
            END IF;

            -- 扣减库存（FIFO - 先进先出原则�?
            IF v_failed = 1 THEN
                LEAVE read_loop;
            END IF;
        END LOOP;

        CLOSE cur_order_items;

        IF v_failed = 1 THEN
            ROLLBACK;
        ELSE

        -- 更新订单状态为已支�?
        UPDATE orders
        SET order_status = 'paid'
        WHERE order_id = p_order_id;


        SET p_result_code = 1;
        SET p_result_message = 'Payment processed successfully';
        COMMIT;
        END IF;
    END IF;
END$$

-- 5. 合并支付多个订单
-- 功能：一次性支付多个订�?
DROP PROCEDURE IF EXISTS sp_customer_pay_orders$$
CREATE PROCEDURE sp_customer_pay_orders(
    IN p_order_ids JSON,
    IN p_payment_method VARCHAR(50),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_order_id INT;
    DECLARE v_index INT DEFAULT 0;
    DECLARE v_count INT;
    DECLARE v_temp_result_code INT;
    DECLARE v_temp_result_message VARCHAR(255);
    DECLARE v_failed INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to process multiple payments';
        ROLLBACK;
    END;

    START TRANSACTION;

    SET v_count = JSON_LENGTH(p_order_ids);

    -- 循环处理每个订单
    pay_loop: WHILE v_index < v_count DO
        SET v_order_id = JSON_UNQUOTE(JSON_EXTRACT(p_order_ids, CONCAT('$[', v_index, ']')));

        -- 调用单个订单支付过程
        CALL sp_customer_pay_order(v_order_id, p_payment_method, v_temp_result_code, v_temp_result_message);

        IF v_temp_result_code != 1 THEN
            SET p_result_code = v_temp_result_code;
            SET p_result_message = CONCAT('Order ', v_order_id, ': ', v_temp_result_message);
            SET v_failed = 1;
            LEAVE pay_loop;
        END IF;

        SET v_index = v_index + 1;
    END WHILE pay_loop;

    IF v_failed = 1 THEN
        ROLLBACK;
    ELSE
        SET p_result_code = 1;
        SET p_result_message = 'All orders paid successfully';
        COMMIT;
    END IF;
END$$

-- 6. 取消订单
-- 功能：取消未支付的订�?
DROP PROCEDURE IF EXISTS sp_customer_cancel_order$$
CREATE PROCEDURE sp_customer_cancel_order(
    IN p_order_id INT,
    IN p_cancel_reason VARCHAR(255),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_order_status VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to cancel order';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 检查订单状�?
    SELECT order_status INTO v_order_status
    FROM orders
    WHERE order_id = p_order_id;

    IF v_order_status IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'Order not found';
        ROLLBACK;
    ELSEIF v_order_status != 'created' THEN
        SET p_result_code = 0;
        SET p_result_message = 'Only unpaid orders can be cancelled';
        ROLLBACK;
    ELSE
        -- 更新订单状�?
        UPDATE orders
        SET order_status = 'cancelled',
            note = CONCAT(COALESCE(note, ''), ' | Cancelled: ', p_cancel_reason)
        WHERE order_id = p_order_id;

        SET p_result_code = 1;
        SET p_result_message = 'Order cancelled successfully';
        COMMIT;
    END IF;
END$$


-- 8. 自动更新会员等级
-- 功能：根据会员的累计消费金额自动更新会员等级
-- 7. customer book search
-- Feature: full-text search with filters and sorting
DROP PROCEDURE IF EXISTS sp_customer_search_books$$
CREATE PROCEDURE sp_customer_search_books(
    IN p_keyword VARCHAR(255),
    IN p_language VARCHAR(50),
    IN p_bucket VARCHAR(10),
    IN p_sort VARCHAR(20)
)
BEGIN
    DECLARE v_keyword VARCHAR(255);
    DECLARE v_language VARCHAR(50);
    DECLARE v_bucket VARCHAR(10);
    DECLARE v_sort VARCHAR(20);

    SET v_keyword = NULLIF(TRIM(p_keyword), '');
    SET v_language = NULLIF(TRIM(p_language), '');
    SET v_bucket = NULLIF(TRIM(p_bucket), '');
    SET v_sort = NULLIF(TRIM(p_sort), '');

    IF v_language = 'all' THEN
        SET v_language = NULL;
    END IF;

    IF v_language IS NOT NULL AND v_language NOT IN (
        'English',
        'Chinese',
        'French',
        'Janpenese',
        'Japanese',
        'Russian',
        'Korean',
        'Italian'
    ) THEN
        SET v_language = NULL;
    END IF;

    IF v_bucket IS NOT NULL AND v_bucket NOT IN ('0-20', '20-50', '50+') THEN
        SET v_bucket = NULL;
    END IF;

    IF v_sort IS NOT NULL AND v_sort NOT IN ('fav', 'price_asc', 'price_desc') THEN
        SET v_sort = NULL;
    END IF;

    IF v_keyword IS NOT NULL THEN
        WITH hits AS (
            SELECT
                b.ISBN,
                MATCH(b.name, b.introduction, b.publisher)
                    AGAINST (v_keyword IN NATURAL LANGUAGE MODE) AS score
            FROM books b
            WHERE MATCH(b.name, b.introduction, b.publisher)
                AGAINST (v_keyword IN NATURAL LANGUAGE MODE)

            UNION ALL

            SELECT
                b.ISBN,
                MATCH(a.first_name, a.last_name)
                    AGAINST (v_keyword IN NATURAL LANGUAGE MODE) AS score
            FROM authors a
            JOIN book_authors ba ON ba.author_id = a.author_id
            JOIN books b ON b.ISBN = ba.ISBN
            WHERE MATCH(a.first_name, a.last_name)
                AGAINST (v_keyword IN NATURAL LANGUAGE MODE)
        ),
        hit_books AS (
            SELECT ISBN, MAX(score) AS score
            FROM hits
            GROUP BY ISBN
        )
        SELECT
            v.sku_id,
            v.ISBN,
            v.title,
            v.author,
            v.language,
            v.category,
            v.publisher,
            v.description,
            v.price,
            v.binding,
            v.stock,
            v.store_id,
            v.store_name,
            v.fav_count,
            hb.score
        FROM hit_books hb
        JOIN vw_customer_books v ON v.ISBN = hb.ISBN
        WHERE (v_language IS NULL OR v.language = v_language)
            AND (
                v_bucket IS NULL
                OR (v_bucket = '0-20' AND v.price >= 0 AND v.price < 20)
                OR (v_bucket = '20-50' AND v.price >= 20 AND v.price < 50)
                OR (v_bucket = '50+' AND v.price >= 50)
            )
        ORDER BY
            CASE WHEN v_sort = 'fav' THEN v.fav_count END DESC,
            CASE WHEN v_sort = 'fav' THEN hb.score END DESC,
            CASE WHEN v_sort = 'price_asc' THEN v.price END ASC,
            CASE WHEN v_sort = 'price_asc' THEN hb.score END DESC,
            CASE WHEN v_sort = 'price_desc' THEN v.price END DESC,
            CASE WHEN v_sort = 'price_desc' THEN hb.score END DESC,
            CASE WHEN v_sort IS NULL THEN hb.score END DESC;
    ELSE
        SELECT
            v.sku_id,
            v.ISBN,
            v.title,
            v.author,
            v.language,
            v.category,
            v.publisher,
            v.description,
            v.price,
            v.binding,
            v.stock,
            v.store_id,
            v.store_name,
            v.fav_count,
            NULL AS score
        FROM vw_customer_books v
        WHERE (v_language IS NULL OR v.language = v_language)
            AND (
                v_bucket IS NULL
                OR (v_bucket = '0-20' AND v.price >= 0 AND v.price < 20)
                OR (v_bucket = '20-50' AND v.price >= 20 AND v.price < 50)
                OR (v_bucket = '50+' AND v.price >= 50)
            )
        ORDER BY
            CASE WHEN v_sort = 'fav' THEN v.fav_count END DESC,
            CASE WHEN v_sort = 'price_asc' THEN v.price END ASC,
            CASE WHEN v_sort = 'price_desc' THEN v.price END DESC,
            CASE WHEN v_sort IS NULL THEN v.ISBN END ASC;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_customer_update_member_tier$$
CREATE PROCEDURE sp_customer_update_member_tier(
    IN p_member_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_total_spent DECIMAL(10,2);
    DECLARE v_new_tier_id INT;
    DECLARE v_current_tier_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to update member tier';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 获取当前会员等级
    SELECT member_tier_id INTO v_current_tier_id
    FROM members
    WHERE member_id = p_member_id;

    -- 计算累计消费
    SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0) INTO v_total_spent
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN skus s ON oi.sku_id = s.sku_id
    WHERE o.member_id = p_member_id
    AND o.order_status = 'paid';

    -- 根据消费金额确定新等�?
    SELECT member_tier_id INTO v_new_tier_id
    FROM member_tiers
    WHERE v_total_spent >= min_lifetime_spend
    ORDER BY min_lifetime_spend DESC
    LIMIT 1;

    -- 如果等级有变化，则更�?
    IF v_new_tier_id != v_current_tier_id THEN
        UPDATE members
        SET member_tier_id = v_new_tier_id
        WHERE member_id = p_member_id;

        SET p_result_code = 1;
        SET p_result_message = 'Member tier updated successfully';
    ELSE
        SET p_result_code = 1;
        SET p_result_message = 'Member tier unchanged';
    END IF;

    COMMIT;
END$$

-- =============================================
-- 更新顾客个人资料 (用户名, 密码, 电话)
-- =============================================
-- 修正点：将结束符 // 改为 $$ 以匹配文件开头的设定
DROP PROCEDURE IF EXISTS sp_customer_update_profile$$

CREATE PROCEDURE sp_customer_update_profile(
    IN p_user_id INT,
    IN p_username VARCHAR(50),
    IN p_password VARCHAR(50), 
    IN p_contact VARCHAR(100),  -- 对应 Email
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(100)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_email_exists INT DEFAULT 0;
    
    -- 异常处理：出错回滚
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error: Update failed.';
    END;

    START TRANSACTION;

    -- 1. 检查新用户名是否被其他人占用
    SELECT COUNT(*) INTO v_exists 
    FROM users 
    WHERE username = p_username AND user_id != p_user_id;

    -- 2. 检查新邮箱是否被其他人占用
    SELECT COUNT(*) INTO v_email_exists
    FROM members
    WHERE email = p_contact AND user_id != p_user_id;

    IF v_exists > 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Username already taken.';
        ROLLBACK;
    ELSEIF v_email_exists > 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Email already used by another account.';
        ROLLBACK;
    ELSE
        -- 3. 更新 Users 表 (用户名和密码)
        -- 如果密码为空，则保持原密码不变
        UPDATE users 
        SET username = p_username,
            password_hash = IF(p_password = '' OR p_password IS NULL, password_hash, p_password)
        WHERE user_id = p_user_id;

        -- 4. 更新 Members 表 (Email)
        UPDATE members 
        SET email = p_contact
        WHERE user_id = p_user_id;

        COMMIT;
        SET p_success = TRUE;
        SET p_message = 'Profile updated successfully.';
    END IF;

END$$

DELIMITER ;

-- 说明�?
-- 1. 所有存储过程都包含事务处理（START TRANSACTION, COMMIT, ROLLBACK�?
-- 2. 所有存储过程都包含错误处理（DECLARE EXIT HANDLER FOR SQLEXCEPTION�?
-- 3. 输出参数统一使用 p_result_code �?p_result_message
--    - p_result_code: 1=成功, 0=业务逻辑失败, -1=系统错误
--    - p_result_message: 详细的结果信�?
-- 4. 订单支付时自动扣减库存，使用FIFO原则
-- 5. 支付成功后自动增加会员积分并记录到积分账�?
-- 6. 支持合并支付多个订单

-- ============================================================================
-- Source: staff_procedures.sql
-- ============================================================================
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
         book_name LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_0900_ai_ci OR
         ISBN LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_0900_ai_ci)
        
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
             CAST(o.order_id AS CHAR) LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_0900_ai_ci OR 
             CONCAT(m.first_name, ' ', m.last_name) LIKE CONCAT('%', p_search_term, '%') COLLATE utf8mb4_0900_ai_ci)
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
    -- 逻辑已移至触发器 trg_replenishment_complete_add_inventory
    UPDATE replenishment_requests 
    SET status = 'completed',
        completed_date = NOW()
    WHERE request_id = p_request_id;
END //

DELIMITER ;

-- ============================================================================
-- Source: manager_procedures.sql
-- ============================================================================

-- manager_procedures.sql
-- Manager procedures

USE book_store;

DELIMITER $$

-- =============================================================================
-- Employee management
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_manager_add_employee$$
CREATE PROCEDURE sp_manager_add_employee(
    IN p_user_id INT,
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_store_id INT,
    IN p_job_title_id INT,
    IN p_email VARCHAR(100),
    IN p_performance DECIMAL(5,2),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255),
    OUT p_employee_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to add employee';
        SET p_employee_id = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id AND user_types = 'employee') THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: User does not exist or is not employee';
        SET p_employee_id = NULL;
        ROLLBACK;
    ELSEIF EXISTS (SELECT 1 FROM employees WHERE user_id = p_user_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: User already linked to an employee';
        SET p_employee_id = NULL;
        ROLLBACK;
    ELSEIF NOT EXISTS (SELECT 1 FROM stores WHERE store_id = p_store_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Store does not exist';
        SET p_employee_id = NULL;
        ROLLBACK;
    ELSEIF NOT EXISTS (SELECT 1 FROM job_titles WHERE job_title_id = p_job_title_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Job title does not exist';
        SET p_employee_id = NULL;
        ROLLBACK;
    ELSEIF EXISTS (SELECT 1 FROM employees WHERE email = p_email) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Email already exists';
        SET p_employee_id = NULL;
        ROLLBACK;
    ELSE
        INSERT INTO employees (user_id, first_name, last_name, store_id, job_title_id, email, performance)
        VALUES (p_user_id, p_first_name, p_last_name, p_store_id, p_job_title_id, p_email, COALESCE(p_performance, 75));

        SET p_employee_id = LAST_INSERT_ID();
        SET p_result_code = 1;
        SET p_result_message = 'Success: Employee added';
        COMMIT;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_manager_update_employee$$
CREATE PROCEDURE sp_manager_update_employee(
    IN p_employee_id INT,
    IN p_user_id INT,
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_store_id INT,
    IN p_job_title_id INT,
    IN p_email VARCHAR(100),
    IN p_performance DECIMAL(5,2),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to update employee';
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = p_employee_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Employee does not exist';
        ROLLBACK;
    ELSEIF NOT EXISTS (SELECT 1 FROM stores WHERE store_id = p_store_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Store does not exist';
        ROLLBACK;
    ELSEIF NOT EXISTS (SELECT 1 FROM job_titles WHERE job_title_id = p_job_title_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Job title does not exist';
        ROLLBACK;
    ELSEIF EXISTS (SELECT 1 FROM employees WHERE email = p_email AND employee_id != p_employee_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Email already exists';
        ROLLBACK;
    ELSEIF p_user_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id AND user_types = 'employee') THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: User does not exist or is not employee';
        ROLLBACK;
    ELSEIF p_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM employees WHERE user_id = p_user_id AND employee_id != p_employee_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: User already linked to an employee';
        ROLLBACK;
    ELSE
        UPDATE employees
        SET user_id = COALESCE(p_user_id, user_id),
            first_name = p_first_name,
            last_name = p_last_name,
            store_id = p_store_id,
            job_title_id = p_job_title_id,
            email = p_email,
            performance = p_performance
        WHERE employee_id = p_employee_id;

        SET p_result_code = 1;
        SET p_result_message = 'Success: Employee updated';
        COMMIT;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_manager_delete_employee$$
CREATE PROCEDURE sp_manager_delete_employee(
    IN p_employee_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to delete employee';
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = p_employee_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Employee does not exist';
        ROLLBACK;
    ELSEIF EXISTS (SELECT 1 FROM replenishment_requests WHERE requested_by = p_employee_id OR approved_by = p_employee_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Employee has associated replenishment requests';
        ROLLBACK;
    ELSE
        DELETE FROM employees WHERE employee_id = p_employee_id;
        SET p_result_code = 1;
        SET p_result_message = 'Success: Employee deleted';
        COMMIT;
    END IF;
END$$

-- =============================================================================
-- Books and pricing
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_manager_add_book$$
CREATE PROCEDURE sp_manager_add_book(
    IN p_ISBN VARCHAR(20),
    IN p_name VARCHAR(200),
    IN p_publisher VARCHAR(100),
    IN p_language VARCHAR(50),
    IN p_introduction TEXT,
    IN p_binding VARCHAR(50),
    IN p_unit_price DECIMAL(10,2),
    IN p_author_ids JSON,
    IN p_category_ids JSON,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255),
    OUT p_sku_id INT
)
BEGIN
    DECLARE v_author_count INT;
    DECLARE v_category_count INT;
    DECLARE v_i INT DEFAULT 0;
    DECLARE v_author_id INT;
    DECLARE v_category_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to add book';
        SET p_sku_id = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    IF EXISTS (SELECT 1 FROM books WHERE ISBN = p_ISBN) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: ISBN already exists';
        SET p_sku_id = NULL;
        ROLLBACK;
    ELSEIF p_unit_price <= 0 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Price must be greater than 0';
        SET p_sku_id = NULL;
        ROLLBACK;
    ELSE
        INSERT INTO books (ISBN, name, publisher, language, introduction)
        VALUES (p_ISBN, p_name, p_publisher, p_language, p_introduction);

        INSERT INTO skus (ISBN, binding, unit_price)
        VALUES (p_ISBN, p_binding, p_unit_price);

        SET p_sku_id = LAST_INSERT_ID();

        IF p_author_ids IS NOT NULL THEN
            SET v_author_count = JSON_LENGTH(p_author_ids);
            SET v_i = 0;
            WHILE v_i < v_author_count DO
                SET v_author_id = JSON_UNQUOTE(JSON_EXTRACT(p_author_ids, CONCAT('$[', v_i, ']')));
                IF EXISTS (SELECT 1 FROM authors WHERE author_id = v_author_id) THEN
                    INSERT INTO book_authors (ISBN, author_id) VALUES (p_ISBN, v_author_id);
                END IF;
                SET v_i = v_i + 1;
            END WHILE;
        END IF;

        IF p_category_ids IS NOT NULL THEN
            SET v_category_count = JSON_LENGTH(p_category_ids);
            SET v_i = 0;
            WHILE v_i < v_category_count DO
                SET v_category_id = JSON_UNQUOTE(JSON_EXTRACT(p_category_ids, CONCAT('$[', v_i, ']')));
                IF EXISTS (SELECT 1 FROM catagories WHERE category_id = v_category_id) THEN
                    INSERT INTO book_categories (ISBN, category_id) VALUES (p_ISBN, v_category_id);
                END IF;
                SET v_i = v_i + 1;
            END WHILE;
        END IF;

        SET p_result_code = 1;
        SET p_result_message = 'Success: Book and SKU added';
        COMMIT;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_manager_update_pricing$$
CREATE PROCEDURE sp_manager_update_pricing(
    IN p_sku_id INT,
    IN p_new_price DECIMAL(10,2),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to update pricing';
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM skus WHERE sku_id = p_sku_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: SKU does not exist';
        ROLLBACK;
    ELSEIF p_new_price <= 0 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Price must be greater than 0';
        ROLLBACK;
    ELSE
        UPDATE skus
        SET unit_price = p_new_price
        WHERE sku_id = p_sku_id;

        SET p_result_code = 1;
        SET p_result_message = 'Success: Pricing updated';
        COMMIT;
    END IF;
END$$

-- =============================================================================
-- Inventory
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_manager_transfer_inventory$$
CREATE PROCEDURE sp_manager_transfer_inventory(
    IN p_from_store_id INT,
    IN p_to_store_id INT,
    IN p_sku_id INT,
    IN p_quantity INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_available_quantity INT DEFAULT 0;
    DECLARE v_batch_id INT;
    DECLARE v_batch_quantity INT;
    DECLARE v_unit_cost DECIMAL(10,2);
    DECLARE v_batch_code VARCHAR(50);
    DECLARE v_purchase_id INT;
    DECLARE v_remaining INT;
    DECLARE done INT DEFAULT FALSE;

    DECLARE batch_cursor CURSOR FOR
        SELECT batch_id, quantity, unit_cost, batch_code, purchase_id
        FROM inventory_batches
        WHERE store_id = p_from_store_id AND sku_id = p_sku_id AND quantity > 0
        ORDER BY received_date ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to transfer inventory';
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM stores WHERE store_id = p_from_store_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Source store does not exist';
        ROLLBACK;
    ELSEIF NOT EXISTS (SELECT 1 FROM stores WHERE store_id = p_to_store_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Target store does not exist';
        ROLLBACK;
    ELSEIF p_from_store_id = p_to_store_id THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Cannot transfer to the same store';
        ROLLBACK;
    ELSEIF NOT EXISTS (SELECT 1 FROM skus WHERE sku_id = p_sku_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: SKU does not exist';
        ROLLBACK;
    ELSEIF p_quantity <= 0 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Quantity must be greater than 0';
        ROLLBACK;
    ELSE
        SELECT COALESCE(SUM(quantity), 0) INTO v_available_quantity
        FROM inventory_batches
        WHERE store_id = p_from_store_id AND sku_id = p_sku_id;

        IF v_available_quantity < p_quantity THEN
            SET p_result_code = 0;
            SET p_result_message = CONCAT('Validation failed: Insufficient inventory. Available: ', v_available_quantity);
            ROLLBACK;
        ELSE
            SET v_remaining = p_quantity;

            OPEN batch_cursor;

            transfer_loop: LOOP
                FETCH batch_cursor INTO v_batch_id, v_batch_quantity, v_unit_cost, v_batch_code, v_purchase_id;

                IF done OR v_remaining <= 0 THEN
                    LEAVE transfer_loop;
                END IF;

                IF v_batch_quantity >= v_remaining THEN
                    UPDATE inventory_batches
                    SET quantity = quantity - v_remaining
                    WHERE batch_id = v_batch_id;

                    INSERT INTO inventory_batches (store_id, sku_id, purchase_id, quantity, unit_cost, received_date, batch_code)
                    VALUES (p_to_store_id, p_sku_id, v_purchase_id, v_remaining, v_unit_cost, NOW(), CONCAT('TRANSFER-', v_batch_code));

                    SET v_remaining = 0;
                ELSE
                    UPDATE inventory_batches
                    SET quantity = 0
                    WHERE batch_id = v_batch_id;

                    INSERT INTO inventory_batches (store_id, sku_id, purchase_id, quantity, unit_cost, received_date, batch_code)
                    VALUES (p_to_store_id, p_sku_id, v_purchase_id, v_batch_quantity, v_unit_cost, NOW(), CONCAT('TRANSFER-', v_batch_code));

                    SET v_remaining = v_remaining - v_batch_quantity;
                END IF;
            END LOOP;

            CLOSE batch_cursor;

            SET p_result_code = 1;
            SET p_result_message = 'Success: Inventory transferred';
            COMMIT;
        END IF;
    END IF;
END$$

-- =============================================================================
-- Replenishment requests
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_manager_create_replenishment_request$$
CREATE PROCEDURE sp_manager_create_replenishment_request(
    IN p_store_id INT,
    IN p_sku_id INT,
    IN p_requested_quantity INT,
    IN p_urgency_level ENUM('low', 'medium', 'high'),
    IN p_requested_by INT,
    IN p_reason VARCHAR(500),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255),
    OUT p_request_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to create replenishment request';
        SET p_request_id = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM stores WHERE store_id = p_store_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Store does not exist';
        SET p_request_id = NULL;
        ROLLBACK;
    ELSEIF NOT EXISTS (SELECT 1 FROM skus WHERE sku_id = p_sku_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: SKU does not exist';
        SET p_request_id = NULL;
        ROLLBACK;
    ELSEIF p_requested_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = p_requested_by) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Employee does not exist';
        SET p_request_id = NULL;
        ROLLBACK;
    ELSEIF p_requested_quantity <= 0 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Quantity must be greater than 0';
        SET p_request_id = NULL;
        ROLLBACK;
    ELSE
        INSERT INTO replenishment_requests (
            store_id, sku_id, requested_quantity, urgency_level, requested_by, reason, status
        ) VALUES (
            p_store_id, p_sku_id, p_requested_quantity, COALESCE(p_urgency_level, 'medium'), p_requested_by, p_reason, 'pending'
        );

        SET p_request_id = LAST_INSERT_ID();
        SET p_result_code = 1;
        SET p_result_message = 'Success: Replenishment request created';
        COMMIT;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_manager_approve_request$$
CREATE PROCEDURE sp_manager_approve_request(
    IN p_request_id INT,
    IN p_approved_by INT,
    IN p_note VARCHAR(500),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_current_status ENUM('pending', 'approved', 'rejected', 'completed');

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to approve request';
        ROLLBACK;
    END;

    START TRANSACTION;

    SELECT status INTO v_current_status
    FROM replenishment_requests
    WHERE request_id = p_request_id;

    IF v_current_status IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Request does not exist';
        ROLLBACK;
    ELSEIF v_current_status != 'pending' THEN
        SET p_result_code = 0;
        SET p_result_message = CONCAT('Validation failed: Request status is ', v_current_status);
        ROLLBACK;
    ELSEIF p_approved_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = p_approved_by) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Approver does not exist';
        ROLLBACK;
    ELSE
        UPDATE replenishment_requests
        SET status = 'approved',
            approved_by = p_approved_by,
            approval_date = CURRENT_TIMESTAMP,
            note = p_note
        WHERE request_id = p_request_id;

        SET p_result_code = 1;
        SET p_result_message = 'Success: Request approved';
        COMMIT;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_manager_reject_request$$
CREATE PROCEDURE sp_manager_reject_request(
    IN p_request_id INT,
    IN p_approved_by INT,
    IN p_rejection_reason VARCHAR(500),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_current_status ENUM('pending', 'approved', 'rejected', 'completed');

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to reject request';
        ROLLBACK;
    END;

    START TRANSACTION;

    SELECT status INTO v_current_status
    FROM replenishment_requests
    WHERE request_id = p_request_id;

    IF v_current_status IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Request does not exist';
        ROLLBACK;
    ELSEIF v_current_status != 'pending' THEN
        SET p_result_code = 0;
        SET p_result_message = CONCAT('Validation failed: Request status is ', v_current_status);
        ROLLBACK;
    ELSEIF p_rejection_reason IS NULL OR LENGTH(TRIM(p_rejection_reason)) = 0 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Rejection reason is required';
        ROLLBACK;
    ELSEIF p_approved_by IS NOT NULL AND NOT EXISTS (SELECT 1 FROM employees WHERE employee_id = p_approved_by) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Approver does not exist';
        ROLLBACK;
    ELSE
        UPDATE replenishment_requests
        SET status = 'rejected',
            approved_by = p_approved_by,
            rejection_reason = p_rejection_reason,
            rejection_date = CURRENT_TIMESTAMP
        WHERE request_id = p_request_id;

        SET p_result_code = 1;
        SET p_result_message = 'Success: Request rejected';
        COMMIT;
    END IF;
END$$

-- =============================================================================
-- Purchases and suppliers
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_manager_create_purchase$$
CREATE PROCEDURE sp_manager_create_purchase(
    IN p_store_id INT,
    IN p_supplier_id INT,
    IN p_purchase_detail JSON,
    IN p_note VARCHAR(500),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255),
    OUT p_purchase_id INT
)
BEGIN
    DECLARE v_item_count INT;
    DECLARE v_i INT DEFAULT 0;
    DECLARE v_sku_id INT;
    DECLARE v_quantity INT;
    DECLARE v_cost DECIMAL(10,2);
    DECLARE v_failed INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to create purchase';
        SET p_purchase_id = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM stores WHERE store_id = p_store_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Store does not exist';
        SET p_purchase_id = NULL;
        ROLLBACK;
    ELSEIF NOT EXISTS (SELECT 1 FROM suppliers WHERE supplier_id = p_supplier_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Supplier does not exist';
        SET p_purchase_id = NULL;
        ROLLBACK;
    ELSEIF p_purchase_detail IS NULL OR JSON_LENGTH(p_purchase_detail) = 0 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Purchase detail is required';
        SET p_purchase_id = NULL;
        ROLLBACK;
    ELSE
        INSERT INTO purchases (store_id, supplier_id, purchase_date, note)
        VALUES (p_store_id, p_supplier_id, CURRENT_TIMESTAMP, p_note);

        SET p_purchase_id = LAST_INSERT_ID();
        SET v_item_count = JSON_LENGTH(p_purchase_detail);
        SET v_i = 0;

        item_loop: WHILE v_i < v_item_count DO
            SET v_sku_id = JSON_UNQUOTE(JSON_EXTRACT(p_purchase_detail, CONCAT('$[', v_i, '].sku_id')));
            SET v_quantity = JSON_UNQUOTE(JSON_EXTRACT(p_purchase_detail, CONCAT('$[', v_i, '].quantity')));
            SET v_cost = JSON_UNQUOTE(JSON_EXTRACT(p_purchase_detail, CONCAT('$[', v_i, '].unit_cost')));

            IF NOT EXISTS (SELECT 1 FROM skus WHERE sku_id = v_sku_id) THEN
                SET p_result_code = 0;
                SET p_result_message = CONCAT('Validation failed: SKU ID ', v_sku_id, ' does not exist');
                SET v_failed = 1;
                LEAVE item_loop;
            END IF;

            IF v_quantity IS NULL OR v_quantity <= 0 THEN
                SET p_result_code = 0;
                SET p_result_message = CONCAT('Validation failed: Invalid quantity for SKU ', v_sku_id);
                SET v_failed = 1;
                LEAVE item_loop;
            END IF;

            IF v_cost IS NULL OR v_cost <= 0 THEN
                SET p_result_code = 0;
                SET p_result_message = CONCAT('Validation failed: Invalid unit_cost for SKU ', v_sku_id);
                SET v_failed = 1;
                LEAVE item_loop;
            END IF;

            INSERT INTO purchase_items (purchase_id, sku_id, quantity)
            VALUES (p_purchase_id, v_sku_id, v_quantity);

            INSERT INTO inventory_batches (store_id, sku_id, purchase_id, quantity, unit_cost, received_date, batch_code)
            VALUES (
                p_store_id, v_sku_id, p_purchase_id, v_quantity, v_cost, NOW(),
                CONCAT('P', p_purchase_id, '-SKU', v_sku_id)
            );

            SET v_i = v_i + 1;
        END WHILE item_loop;

        IF v_failed = 1 THEN
            ROLLBACK;
        ELSE
            SET p_result_code = 1;
            SET p_result_message = 'Success: Purchase created';
            COMMIT;
        END IF;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_manager_add_supplier$$
CREATE PROCEDURE sp_manager_add_supplier(
    IN p_name VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_email VARCHAR(100),
    IN p_address VARCHAR(200),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255),
    OUT p_supplier_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Failed to add supplier';
        SET p_supplier_id = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    IF p_name IS NULL OR TRIM(p_name) = '' THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Supplier name is required';
        SET p_supplier_id = NULL;
        ROLLBACK;
    ELSEIF p_phone IS NULL OR TRIM(p_phone) = '' THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Phone number is required';
        SET p_supplier_id = NULL;
        ROLLBACK;
    ELSEIF p_phone REGEXP '[^0-9]' THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Phone number must contain only digits';
        SET p_supplier_id = NULL;
        ROLLBACK;
    ELSEIF CHAR_LENGTH(p_phone) > 10 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Phone number is too long (max 10 digits)';
        SET p_supplier_id = NULL;
        ROLLBACK;
    ELSEIF EXISTS (SELECT 1 FROM suppliers WHERE name = p_name) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Supplier name already exists';
        SET p_supplier_id = NULL;
        ROLLBACK;
    ELSEIF EXISTS (SELECT 1 FROM suppliers WHERE phone = p_phone) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Phone number already exists';
        SET p_supplier_id = NULL;
        ROLLBACK;
    ELSE
        INSERT INTO suppliers (name, phone, email, address)
        VALUES (p_name, p_phone, p_email, p_address);

        SET p_supplier_id = LAST_INSERT_ID();
        SET p_result_code = 1;
        SET p_result_message = 'Success: Supplier added successfully';

        COMMIT;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_manager_update_supplier$$
CREATE PROCEDURE sp_manager_update_supplier(
    IN p_supplier_id INT,
    IN p_name VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_email VARCHAR(100),
    IN p_address VARCHAR(200),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_existing_name VARCHAR(100);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Failed to update supplier';
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE supplier_id = p_supplier_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Supplier not found';
        ROLLBACK;
    ELSE
        IF p_name IS NOT NULL AND TRIM(p_name) != '' THEN
            SELECT name INTO v_existing_name
            FROM suppliers
            WHERE name = p_name AND supplier_id != p_supplier_id
            LIMIT 1;

            IF v_existing_name IS NOT NULL THEN
                SET p_result_code = 0;
                SET p_result_message = 'Error: Supplier name already exists';
                ROLLBACK;
            ELSE
                UPDATE suppliers
                SET
                    name = COALESCE(NULLIF(p_name, ''), name),
                    phone = COALESCE(NULLIF(p_phone, ''), phone),
                    email = COALESCE(NULLIF(p_email, ''), email),
                    address = COALESCE(NULLIF(p_address, ''), address)
                WHERE supplier_id = p_supplier_id;

                SET p_result_code = 1;
                SET p_result_message = 'Success: Supplier updated successfully';
                COMMIT;
            END IF;
        ELSE
            UPDATE suppliers
            SET
                phone = COALESCE(NULLIF(p_phone, ''), phone),
                email = COALESCE(NULLIF(p_email, ''), email),
                address = COALESCE(NULLIF(p_address, ''), address)
            WHERE supplier_id = p_supplier_id;

            SET p_result_code = 1;
            SET p_result_message = 'Success: Supplier updated successfully';
            COMMIT;
        END IF;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_manager_delete_supplier$$
CREATE PROCEDURE sp_manager_delete_supplier(
    IN p_supplier_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_purchase_count INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Failed to delete supplier';
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE supplier_id = p_supplier_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Supplier not found';
        ROLLBACK;
    ELSE
        SELECT COUNT(*) INTO v_purchase_count
        FROM purchases
        WHERE supplier_id = p_supplier_id;

        IF v_purchase_count > 0 THEN
            SET p_result_code = 0;
            SET p_result_message = CONCAT('Error: Cannot delete supplier with ', v_purchase_count, ' associated purchase(s)');
            ROLLBACK;
        ELSE
            DELETE FROM suppliers WHERE supplier_id = p_supplier_id;

            SET p_result_code = 1;
            SET p_result_message = 'Success: Supplier deleted successfully';
            COMMIT;
        END IF;
    END IF;
END$$

-- =============================================================================
-- User management
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_manager_reset_user_password$$
CREATE PROCEDURE sp_manager_reset_user_password(
    IN p_user_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_default_password_hash VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Failed to reset password';
        ROLLBACK;
    END;

    START TRANSACTION;

    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: User not found';
        ROLLBACK;
    ELSE
        SET v_default_password_hash = 'Password@123';

        UPDATE users
        SET password_hash = v_default_password_hash
        WHERE user_id = p_user_id;

        SET p_result_code = 1;
        SET p_result_message = 'Success: Password has been reset to default (Password@123)';
        COMMIT;
    END IF;
END$$

-- =============================================================================
-- Notifications
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_manager_send_notification$$
CREATE PROCEDURE sp_manager_send_notification(
    IN p_title VARCHAR(200),
    IN p_content TEXT,
    IN p_publish_at DATETIME,
    IN p_expire_at DATETIME,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255),
    OUT p_announcement_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to send notification';
        SET p_announcement_id = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    IF p_title IS NULL OR LENGTH(TRIM(p_title)) = 0 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Title is required';
        SET p_announcement_id = NULL;
        ROLLBACK;
    ELSEIF p_content IS NULL OR LENGTH(TRIM(p_content)) = 0 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Content is required';
        SET p_announcement_id = NULL;
        ROLLBACK;
    ELSEIF p_expire_at IS NOT NULL AND p_publish_at IS NOT NULL AND p_expire_at <= p_publish_at THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Expire date must be after publish date';
        SET p_announcement_id = NULL;
        ROLLBACK;
    ELSE
        INSERT INTO announcements (title, content, publish_at, expire_at)
        VALUES (p_title, p_content, COALESCE(p_publish_at, CURRENT_TIMESTAMP), p_expire_at);

        SET p_announcement_id = LAST_INSERT_ID();
        SET p_result_code = 1;
        SET p_result_message = 'Success: Notification sent';
        COMMIT;
    END IF;
END$$

-- =============================================================================
-- Data fixes
-- =============================================================================

DROP PROCEDURE IF EXISTS sp_manager_fix_dashboard_data$$
CREATE PROCEDURE sp_manager_fix_dashboard_data()
BEGIN
    UPDATE payments p
    SET p.amount = (
        SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
        FROM payment_allocations pa
        JOIN invoices inv ON pa.invoice_id = inv.invoice_id
        JOIN orders o ON inv.order_id = o.order_id
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN skus s ON oi.sku_id = s.sku_id
        WHERE pa.payment_id = p.payment_id
        AND o.order_status IN ('paid', 'finished')
      )
      WHERE p.amount = 0 OR p.amount IS NULL;

    SELECT
        'Payment amounts updated' AS status,
        COUNT(*) AS updated_count,
        COALESCE(SUM(amount), 0) AS total_amount
    FROM payments;

    UPDATE payment_allocations pa
    JOIN invoices inv ON pa.invoice_id = inv.invoice_id
    JOIN orders o ON inv.order_id = o.order_id
    JOIN (
        SELECT oi.order_id, SUM(oi.quantity * s.unit_price) AS order_total
        FROM order_items oi
        JOIN skus s ON oi.sku_id = s.sku_id
        GROUP BY oi.order_id
    ) AS order_totals ON o.order_id = order_totals.order_id
    SET pa.allocated_amount = order_totals.order_total
    WHERE pa.allocated_amount = 0 OR pa.allocated_amount IS NULL;

    SELECT
        'Payment allocations updated' AS status,
        COUNT(*) AS updated_count,
        COALESCE(SUM(allocated_amount), 0) AS total_allocated
    FROM payment_allocations;

    SELECT
        'Payment analysis' AS section,
        payment_method,
        COUNT(*) AS payment_count,
        COALESCE(SUM(amount), 0) AS total_amount,
        ROUND(AVG(amount), 2) AS avg_amount
    FROM payments
    GROUP BY payment_method
    ORDER BY total_amount DESC;

    SELECT
        'Category sales' AS section,
        category_name,
        total_sales,
        revenue_percentage
    FROM vm_manager_sales_by_category
    ORDER BY total_sales DESC
    LIMIT 5;

    SELECT
        'Order payment summary' AS section,
        o.order_id,
        o.order_status,
        COALESCE(SUM(oi.quantity * s.unit_price), 0) AS order_total,
        p.payment_id,
        p.payment_method,
        p.amount AS payment_amount
    FROM orders o
    LEFT JOIN order_items oi ON o.order_id = oi.order_id
    LEFT JOIN skus s ON oi.sku_id = s.sku_id
    LEFT JOIN invoices inv ON o.order_id = inv.order_id
    LEFT JOIN payment_allocations pa ON inv.invoice_id = pa.invoice_id
    LEFT JOIN payments p ON pa.payment_id = p.payment_id
    WHERE o.order_status = 'paid'
    GROUP BY o.order_id, o.order_status, p.payment_id, p.payment_method, p.amount
    ORDER BY o.order_id
    LIMIT 10;
END$$

-- =============================================================================
-- User and Employee management (v2) - 支持指定ID
-- =============================================================================

-- 添加员工（支持指定 employee_id）
DROP PROCEDURE IF EXISTS sp_manager_add_employee_v2$$
CREATE PROCEDURE sp_manager_add_employee_v2(
    IN p_employee_id INT,
    IN p_user_id INT,
    IN p_first_name VARCHAR(50),
    IN p_last_name VARCHAR(50),
    IN p_store_id INT,
    IN p_job_title_id INT,
    IN p_email VARCHAR(100),
    IN p_performance DECIMAL(5,2),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255),
    OUT p_out_employee_id INT
)
BEGIN
    DECLARE v_performance DECIMAL(5,2);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_code = -1;

        -- 友好错误消息
        IF @errno = 1062 THEN
            IF @text LIKE '%email%' THEN
                SET p_result_message = 'Email is already in use by another employee';
            ELSEIF @text LIKE '%user_id%' THEN
                SET p_result_message = 'User is already linked to another employee';
            ELSEIF @text LIKE '%employee_id%' OR @text LIKE '%PRIMARY%' THEN
                SET p_result_message = CONCAT('Employee ID ', COALESCE(p_employee_id, 'auto'), ' already exists');
            ELSE
                SET p_result_message = 'Duplicate entry found';
            END IF;
        ELSEIF @errno = 1452 THEN
            SET p_result_message = 'Invalid reference: Store or Job Title does not exist';
        ELSE
            SET p_result_message = 'Failed to add employee';
        END IF;

        SET p_out_employee_id = NULL;
        ROLLBACK;
    END;

    SET v_performance = COALESCE(p_performance, 75);

    START TRANSACTION;

    -- 验证 user_id 存在且是 employee 类型
    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id AND user_types = 'employee') THEN
        SET p_result_code = 0;
        SET p_result_message = 'User does not exist or is not employee type';
        SET p_out_employee_id = NULL;
        ROLLBACK;
    -- 验证 user_id 未被其他员工使用
    ELSEIF EXISTS (SELECT 1 FROM employees WHERE user_id = p_user_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'User already linked to an employee';
        SET p_out_employee_id = NULL;
        ROLLBACK;
    -- 验证 store_id 存在
    ELSEIF NOT EXISTS (SELECT 1 FROM stores WHERE store_id = p_store_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Store does not exist';
        SET p_out_employee_id = NULL;
        ROLLBACK;
    -- 验证 job_title_id 存在
    ELSEIF NOT EXISTS (SELECT 1 FROM job_titles WHERE job_title_id = p_job_title_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Job title does not exist';
        SET p_out_employee_id = NULL;
        ROLLBACK;
    -- 如果指定了 employee_id，检查是否已存在
    ELSEIF p_employee_id IS NOT NULL AND EXISTS (SELECT 1 FROM employees WHERE employee_id = p_employee_id) THEN
        SET p_result_code = 0;
        SET p_result_message = CONCAT('Employee ID ', p_employee_id, ' already exists');
        SET p_out_employee_id = NULL;
        ROLLBACK;
    ELSE
        -- 插入员工记录
        IF p_employee_id IS NOT NULL THEN
            INSERT INTO employees (employee_id, user_id, first_name, last_name, store_id, job_title_id, email, performance)
            VALUES (p_employee_id, p_user_id, p_first_name, p_last_name, p_store_id, p_job_title_id, p_email, v_performance);
            SET p_out_employee_id = p_employee_id;
        ELSE
            INSERT INTO employees (user_id, first_name, last_name, store_id, job_title_id, email, performance)
            VALUES (p_user_id, p_first_name, p_last_name, p_store_id, p_job_title_id, p_email, v_performance);
            SET p_out_employee_id = LAST_INSERT_ID();
        END IF;

        SET p_result_code = 1;
        SET p_result_message = 'Employee added successfully';
        COMMIT;
    END IF;
END$$

-- 删除员工（同时删除关联的用户）
DROP PROCEDURE IF EXISTS sp_manager_delete_employee_with_user$$
CREATE PROCEDURE sp_manager_delete_employee_with_user(
    IN p_employee_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_has_member INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to delete employee';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 检查员工是否存在
    SELECT user_id INTO v_user_id FROM employees WHERE employee_id = p_employee_id;

    IF v_user_id IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'Employee not found';
        ROLLBACK;
    ELSE
        -- 检查是否有关联的补货请求
        IF EXISTS (SELECT 1 FROM replenishment_requests WHERE requested_by = p_employee_id OR approved_by = p_employee_id) THEN
            SET p_result_code = 0;
            SET p_result_message = 'Cannot delete: Employee has associated replenishment requests';
            ROLLBACK;
        ELSE
            -- 删除员工记录
            DELETE FROM employees WHERE employee_id = p_employee_id;

            -- 检查用户是否还有member记录
            IF v_user_id IS NOT NULL THEN
                SELECT COUNT(*) INTO v_has_member FROM members WHERE user_id = v_user_id;

                IF v_has_member = 0 THEN
                    -- 没有member记录，可以删除用户
                    DELETE FROM users WHERE user_id = v_user_id;
                END IF;
            END IF;

            SET p_result_code = 1;
            SET p_result_message = 'Employee deleted successfully';
            COMMIT;
        END IF;
    END IF;
END$$

-- 添加用户（支持指定 user_id，用于 emp001 格式）
DROP PROCEDURE IF EXISTS sp_manager_add_user$$
CREATE PROCEDURE sp_manager_add_user(
    IN p_user_id INT,
    IN p_username VARCHAR(50),
    IN p_password VARCHAR(255),
    IN p_user_type VARCHAR(20),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255),
    OUT p_out_user_id INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SET p_result_code = -1;

        IF @errno = 1062 THEN
            IF @text LIKE '%username%' THEN
                SET p_result_message = 'Username already exists';
            ELSEIF @text LIKE '%PRIMARY%' THEN
                SET p_result_message = CONCAT('User ID ', p_user_id, ' already exists');
            ELSE
                SET p_result_message = 'Duplicate entry found';
            END IF;
        ELSE
            SET p_result_message = 'Failed to create user';
        END IF;

        SET p_out_user_id = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 检查 username 是否已存在
    IF EXISTS (SELECT 1 FROM users WHERE username = p_username) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Username already exists';
        SET p_out_user_id = NULL;
        ROLLBACK;
    -- 检查 user_id 是否已存在
    ELSEIF p_user_id IS NOT NULL AND EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id) THEN
        SET p_result_code = 0;
        SET p_result_message = CONCAT('User ID ', p_user_id, ' already exists. Please use a different number.');
        SET p_out_user_id = NULL;
        ROLLBACK;
    ELSE
        -- 插入用户
        IF p_user_id IS NOT NULL THEN
            INSERT INTO users (user_id, username, password_hash, create_date, last_log_date, user_types, status)
            VALUES (p_user_id, p_username, p_password, NOW(), NOW(), COALESCE(p_user_type, 'employee'), 'active');
            SET p_out_user_id = p_user_id;
        ELSE
            INSERT INTO users (username, password_hash, create_date, last_log_date, user_types, status)
            VALUES (p_username, p_password, NOW(), NOW(), COALESCE(p_user_type, 'employee'), 'active');
            SET p_out_user_id = LAST_INSERT_ID();
        END IF;

        SET p_result_code = 1;
        SET p_result_message = 'User created successfully';
        COMMIT;
    END IF;
END$$

-- 更新用户信息
DROP PROCEDURE IF EXISTS sp_manager_update_user$$
CREATE PROCEDURE sp_manager_update_user(
    IN p_user_id INT,
    IN p_username VARCHAR(50),
    IN p_status VARCHAR(20),
    IN p_full_name VARCHAR(100),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_user_type VARCHAR(20);
    DECLARE v_first_name VARCHAR(50);
    DECLARE v_last_name VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Failed to update user';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 检查用户是否存在
    SELECT user_types INTO v_user_type FROM users WHERE user_id = p_user_id;

    IF v_user_type IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'User not found';
        ROLLBACK;
    ELSE
        -- 更新 users 表
        UPDATE users
        SET username = COALESCE(NULLIF(p_username, ''), username),
            status = COALESCE(NULLIF(p_status, ''), status)
        WHERE user_id = p_user_id;

        -- 如果有 full_name，更新对应的表
        IF p_full_name IS NOT NULL AND p_full_name != '' THEN
            -- 解析姓名
            IF LOCATE(' ', p_full_name) > 0 THEN
                SET v_first_name = SUBSTRING_INDEX(p_full_name, ' ', 1);
                SET v_last_name = SUBSTRING(p_full_name, LOCATE(' ', p_full_name) + 1);
            ELSE
                SET v_first_name = p_full_name;
                SET v_last_name = '';
            END IF;

            IF v_user_type = 'member' THEN
                UPDATE members SET first_name = v_first_name, last_name = v_last_name WHERE user_id = p_user_id;
            ELSEIF v_user_type = 'employee' THEN
                UPDATE employees SET first_name = v_first_name, last_name = v_last_name WHERE user_id = p_user_id;
            END IF;
        END IF;

        SET p_result_code = 1;
        SET p_result_message = 'User updated successfully';
        COMMIT;
    END IF;
END$$

-- 删除用户（包括关联的 employee/member 记录）
DROP PROCEDURE IF EXISTS sp_manager_delete_user$$
CREATE PROCEDURE sp_manager_delete_user(
    IN p_user_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_member_id INT;
    DECLARE v_order_count INT DEFAULT 0;
    DECLARE v_fav_count INT DEFAULT 0;
    DECLARE v_pay_count INT DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Failed to delete user';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 检查用户是否存在
    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'User not found';
        ROLLBACK;
    ELSE
        -- 删除关联的 employee 记录
        DELETE FROM employees WHERE user_id = p_user_id;

        -- 检查是否有 member 记录
        SELECT member_id INTO v_member_id FROM members WHERE user_id = p_user_id;

        IF v_member_id IS NOT NULL THEN
            -- 检查 member 是否有关联数据
            SELECT COUNT(*) INTO v_order_count FROM orders WHERE member_id = v_member_id;
            SELECT COUNT(*) INTO v_fav_count FROM favorites WHERE member_id = v_member_id;
            SELECT COUNT(*) INTO v_pay_count FROM payments WHERE member_id = v_member_id;

            IF v_order_count > 0 OR v_fav_count > 0 OR v_pay_count > 0 THEN
                SET p_result_code = 0;
                SET p_result_message = 'User is linked to member records. Clear related orders/favorites/payments first.';
                ROLLBACK;
            ELSE
                -- 删除 member 记录
                DELETE FROM members WHERE user_id = p_user_id;
                -- 删除用户
                DELETE FROM users WHERE user_id = p_user_id;
                SET p_result_code = 1;
                SET p_result_message = 'User deleted successfully';
                COMMIT;
            END IF;
        ELSE
            -- 没有 member 记录，直接删除用户
            DELETE FROM users WHERE user_id = p_user_id;
            SET p_result_code = 1;
            SET p_result_message = 'User deleted successfully';
            COMMIT;
        END IF;
    END IF;
END$$

-- 切换用户状态
DROP PROCEDURE IF EXISTS sp_manager_toggle_user_status$$
CREATE PROCEDURE sp_manager_toggle_user_status(
    IN p_user_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255),
    OUT p_new_status VARCHAR(20)
)
BEGIN
    DECLARE v_current_status VARCHAR(20);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Failed to toggle user status';
        SET p_new_status = NULL;
        ROLLBACK;
    END;

    START TRANSACTION;

    -- 获取当前状态
    SELECT status INTO v_current_status FROM users WHERE user_id = p_user_id;

    IF v_current_status IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'User not found';
        SET p_new_status = NULL;
        ROLLBACK;
    ELSE
        -- 切换状态
        IF v_current_status = 'active' THEN
            SET p_new_status = 'disabled';
        ELSE
            SET p_new_status = 'active';
        END IF;

        UPDATE users SET status = p_new_status WHERE user_id = p_user_id;

        SET p_result_code = 1;
        SET p_result_message = 'User status updated successfully';
        COMMIT;
    END IF;
END$$

DELIMITER ;

SELECT 'manager procedures created' AS message;

-- ============================================================================
-- Source: finance_procedures.sql
-- ============================================================================
-- finance_procedures.sql
USE book_store;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_finance_overview$$
CREATE PROCEDURE sp_finance_overview(
    OUT p_current_month DECIMAL(12,2),
    OUT p_last_month DECIMAL(12,2),
    OUT p_growth_percent DECIMAL(8,2),
    OUT p_total_orders INT,
    IN p_store_id INT
)
BEGIN
    DECLARE v_current_start DATE;
    DECLARE v_next_start DATE;
    DECLARE v_last_start DATE;

    SET v_current_start = DATE_FORMAT(CURRENT_DATE, '%Y-%m-01');
    SET v_next_start = DATE_ADD(v_current_start, INTERVAL 1 MONTH);
    SET v_last_start = DATE_SUB(v_current_start, INTERVAL 1 MONTH);

    SELECT IFNULL(SUM(payable_amount), 0)
    INTO p_current_month
    FROM vw_finance_order_settlement
    WHERE is_settled = 1
      AND (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id)
      AND order_date >= v_current_start
      AND order_date < v_next_start;

    SELECT IFNULL(SUM(payable_amount), 0)
    INTO p_last_month
    FROM vw_finance_order_settlement
    WHERE is_settled = 1
      AND (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id)
      AND order_date >= v_last_start
      AND order_date < v_current_start;

    SELECT COUNT(*)
    INTO p_total_orders
    FROM vw_finance_order_settlement
    WHERE (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id)
      AND order_date >= v_current_start
      AND order_date < v_next_start;

    IF p_last_month = 0 THEN
        SET p_growth_percent = NULL;
    ELSE
        SET p_growth_percent = ROUND(((p_current_month - p_last_month) / p_last_month) * 100, 2);
    END IF;
END$$


DROP PROCEDURE IF EXISTS sp_finance_payment_method_summary$$
CREATE PROCEDURE sp_finance_payment_method_summary(
    IN p_start DATE,
    IN p_end DATE,
    IN p_store_id INT
)
BEGIN
    IF p_start IS NULL THEN
        SET p_start = DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);
    END IF;
    IF p_end IS NULL THEN
        SET p_end = CURRENT_DATE;
    END IF;

    SELECT
        vm.payment_method,
        ROUND(SUM(vm.allocated_amount), 2) AS amount
    FROM vm_finance_invoice_payment_allocation_detail vm
    JOIN vm_finance_invoice_base vb ON vb.invoice_id = vm.invoice_id
    WHERE vm.allocation_date >= p_start
      AND vm.allocation_date < DATE_ADD(p_end, INTERVAL 1 DAY)
      AND (p_store_id IS NULL OR p_store_id = 0 OR vb.store_id = p_store_id)
    GROUP BY vm.payment_method
    ORDER BY amount DESC;
END$$

DROP PROCEDURE IF EXISTS sp_finance_revenue_by_date$$
CREATE PROCEDURE sp_finance_revenue_by_date(
    IN p_start DATE,
    IN p_end DATE,
    IN p_store_id INT
)
BEGIN
    IF p_start IS NULL THEN
        SET p_start = DATE_SUB(CURRENT_DATE, INTERVAL 13 DAY);
    END IF;
    IF p_end IS NULL THEN
        SET p_end = CURRENT_DATE;
    END IF;

    SELECT
        order_day,
        SUM(revenue) AS revenue
    FROM vw_finance_revenue_by_date
    WHERE order_day >= p_start
      AND order_day <= p_end
      AND (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id)
    GROUP BY order_day
    ORDER BY order_day;
END$$

DROP PROCEDURE IF EXISTS sp_finance_purchase_cost_by_date$$
CREATE PROCEDURE sp_finance_purchase_cost_by_date(
    IN p_start DATE,
    IN p_end DATE,
    IN p_store_id INT
)
BEGIN
    IF p_start IS NULL THEN
        SET p_start = DATE_SUB(CURRENT_DATE, INTERVAL 13 DAY);
    END IF;
    IF p_end IS NULL THEN
        SET p_end = CURRENT_DATE;
    END IF;

    SELECT
        cost_day,
        SUM(cost) AS cost
    FROM vw_finance_purchase_cost_by_date
    WHERE cost_day >= p_start
      AND cost_day <= p_end
      AND (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id)
    GROUP BY cost_day
    ORDER BY cost_day;
END$$

DROP PROCEDURE IF EXISTS sp_finance_order_list$$
CREATE PROCEDURE sp_finance_order_list(
    IN p_search VARCHAR(100),
    IN p_status VARCHAR(20),
    IN p_store_id INT,
    IN p_start DATE,
    IN p_end DATE,
    IN p_order_id INT
)
BEGIN
    SELECT 
        v.*, 
        CONCAT(IFNULL(m.first_name, ''), ' ', IFNULL(m.last_name, '')) AS member_name
    FROM 
        vw_finance_order_settlement v
    LEFT JOIN 
        members m ON v.member_id = m.member_id
    WHERE 
        (p_store_id IS NULL OR p_store_id = 0 OR v.store_id = p_store_id)
        AND (
            p_search IS NULL OR p_search = '' 
            OR v.order_id LIKE CONCAT('%', p_search, '%')
            OR v.member_id LIKE CONCAT('%', p_search, '%')
            OR CONCAT(IFNULL(m.first_name, ''), ' ', IFNULL(m.last_name, '')) LIKE CONCAT('%', p_search, '%')
        )
        AND (p_status IS NULL OR p_status = '' OR v.order_status = p_status)
        AND (p_start IS NULL OR DATE(v.order_date) >= p_start)
        AND (p_end IS NULL OR DATE(v.order_date) <= p_end)
        AND (p_order_id IS NULL OR p_order_id = 0 OR v.order_id = p_order_id)
    ORDER BY 
        v.order_date DESC;
END$$


DROP PROCEDURE IF EXISTS sp_finance_invoice_list$$
CREATE PROCEDURE sp_finance_invoice_list(
    IN p_search VARCHAR(255),
    IN p_status VARCHAR(50),
    IN p_order_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_min_amount DECIMAL(10,2),
    IN p_max_amount DECIMAL(10,2),
    IN p_store_id INT
)
BEGIN
    SELECT 
        invoice_id,
        invoice_number,
        order_id,
        store_id,
        store_name,
        member_id,
        member_name,
        display_status,
        invoice_status,
        issue_date,
        due_date,
        invoice_amount,
        paid_amount,
        outstanding_amount,
        last_paid_at,
        is_settled
    FROM vw_finance_invoice_list
    WHERE 
        (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id)
        AND (p_search IS NULL OR p_search = '' 
        OR CONVERT(member_name USING utf8mb4) COLLATE utf8mb4_0900_ai_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_0900_ai_ci
        OR CAST(invoice_number AS CHAR) COLLATE utf8mb4_0900_ai_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_0900_ai_ci
        OR CAST(order_id AS CHAR) COLLATE utf8mb4_0900_ai_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_0900_ai_ci)
        AND (p_status IS NULL OR p_status = '' OR p_status = 'All Statuses' OR invoice_status = p_status)
        AND (p_order_id IS NULL OR p_order_id = 0 OR order_id = p_order_id)
        AND (p_start_date IS NULL OR issue_date >= p_start_date)
        AND (p_end_date IS NULL OR issue_date < DATE_ADD(p_end_date, INTERVAL 1 DAY))
        AND (p_min_amount IS NULL OR invoice_amount >= p_min_amount)
        AND (p_max_amount IS NULL OR invoice_amount <= p_max_amount)
    ORDER BY issue_date DESC;
END$$


DROP PROCEDURE IF EXISTS sp_finance_order_detail$$
CREATE PROCEDURE sp_finance_order_detail(
    IN p_order_id INT
)
BEGIN
    SELECT
        order_id,
        store_id,
        store_name,
        member_id,
        member_name,
        order_status,
        order_date,
        note,
        payable_amount,
        paid_amount,
        item_count,
        total_quantity
    FROM vw_finance_order_list
    WHERE order_id = p_order_id
    LIMIT 1;

    SELECT
        oi.order_id,
        oi.sku_id,
        b.ISBN,
        b.name AS book_title,
        s.binding,
        oi.quantity,
        s.unit_price,
        (oi.quantity * s.unit_price) AS subtotal
    FROM order_items oi
    JOIN skus s ON s.sku_id = oi.sku_id
    JOIN books b ON b.ISBN = s.ISBN
    WHERE oi.order_id = p_order_id;
END$$

DROP PROCEDURE IF EXISTS sp_finance_invoice_detail$$
CREATE PROCEDURE sp_finance_invoice_detail(
    IN p_invoice_id INT
)
BEGIN
    SELECT
        invoice_id,
        invoice_number,
        order_id,
        store_id,
        store_name,
        member_id,
        member_name,
        display_status,
        invoice_status,
        issue_date,
        due_date,
        invoice_amount,
        paid_amount,
        outstanding_amount,
        last_paid_at
    FROM vw_finance_invoice_list
    WHERE invoice_id = p_invoice_id
    LIMIT 1;

    SELECT
        pa.payment_id,
        pa.allocated_amount,
        pa.create_date AS allocation_date,
        p.payment_method,
        p.amount AS payment_amount
    FROM payment_allocations pa
    JOIN payments p ON p.payment_id = pa.payment_id
    WHERE pa.invoice_id = p_invoice_id
    ORDER BY pa.create_date DESC;
END$$

DROP PROCEDURE IF EXISTS sp_finance_create_invoice$$
CREATE PROCEDURE sp_finance_create_invoice(
    IN p_order_id INT,
    OUT p_invoice_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_existing INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to create invoice';
        ROLLBACK;
    END;

    START TRANSACTION;

    SELECT invoice_id INTO v_existing
    FROM invoices
    WHERE order_id = p_order_id
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        SET p_invoice_id = v_existing;
        SET p_result_code = 0;
        SET p_result_message = 'Invoice already exists';
        ROLLBACK;
    ELSE
        INSERT INTO invoices (order_id, invoice_status, invoice_number, issue_date, due_date, update_date, note)
        VALUES (
            p_order_id,
            'issued',
            p_order_id,
            NOW(),
            DATE_ADD(NOW(), INTERVAL 30 DAY),
            NOW(),
            'Created by finance'
        );

        SET p_invoice_id = LAST_INSERT_ID();
        SET p_result_code = 1;
        SET p_result_message = 'Invoice created';
        COMMIT;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_finance_receive_payment$$
CREATE PROCEDURE sp_finance_receive_payment(
    IN p_invoice_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_method VARCHAR(50),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_member_id INT;
    DECLARE v_payment_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to record payment';
        ROLLBACK;
    END;

    START TRANSACTION;

    SELECT member_id INTO v_member_id
    FROM vm_finance_invoice_base
    WHERE invoice_id = p_invoice_id
    LIMIT 1;

    IF v_member_id IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'Invoice not found';
        ROLLBACK;
    ELSE
        INSERT INTO payments (member_id, create_date, update_date, amount, payment_method, note)
        VALUES (v_member_id, NOW(), NOW(), p_amount, p_payment_method, 'Finance payment');

        SET v_payment_id = LAST_INSERT_ID();

        INSERT INTO payment_allocations (invoice_id, payment_id, create_date, allocated_amount, note)
        VALUES (p_invoice_id, v_payment_id, NOW(), p_amount, 'Finance allocation');

        SET p_result_code = 1;
        SET p_result_message = 'Payment recorded';
        COMMIT;
    END IF;
END$$

DELIMITER ;
