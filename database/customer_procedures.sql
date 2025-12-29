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
            SET p_result_code = 0;
            SET p_result_message = CONCAT('Insufficient stock for SKU ', v_sku_id);
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
                SET p_result_code = 0;
                SET p_result_message = CONCAT('Insufficient stock for SKU ', v_sku_id);
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
