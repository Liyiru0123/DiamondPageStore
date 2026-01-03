-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主机： 127.0.0.1
-- 生成日期： 2025-12-29 22:37:44
-- 服务器版本： 10.4.32-MariaDB
-- PHP 版本： 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 数据库： `book_store`
--

DELIMITER $$
--
-- 存储过程
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_auth_get_user` (IN `p_username` VARCHAR(50))   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_auth_register_customer` (IN `p_username` VARCHAR(50), IN `p_password` VARCHAR(50), OUT `p_message` VARCHAR(100), OUT `p_success` BOOLEAN)   BEGIN
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
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_customer_add_favorite` (IN `p_member_id` INT, IN `p_isbn` CHAR(13), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_customer_cancel_order` (IN `p_order_id` INT, IN `p_cancel_reason` VARCHAR(255), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_customer_create_order` (IN `p_member_id` INT, IN `p_store_id` INT, IN `p_cart_items` JSON, IN `p_note` VARCHAR(255), OUT `p_order_id` INT, OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_customer_pay_order` (IN `p_order_id` INT, IN `p_payment_method` VARCHAR(50), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_customer_pay_orders` (IN `p_order_ids` JSON, IN `p_payment_method` VARCHAR(50), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_customer_remove_favorite` (IN `p_member_id` INT, IN `p_isbn` CHAR(13), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_customer_update_member_tier` (IN `p_member_id` INT, OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_customer_update_profile` (IN `p_user_id` INT, IN `p_username` VARCHAR(50), IN `p_password` VARCHAR(50), IN `p_contact` VARCHAR(100), OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(100))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_create_invoice` (IN `p_order_id` INT, OUT `p_invoice_id` INT, OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_invoice_detail` (IN `p_invoice_id` INT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_invoice_list` (IN `p_search` VARCHAR(100), IN `p_status` VARCHAR(20), IN `p_order_id` INT, IN `p_start` DATE, IN `p_end` DATE)   BEGIN
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
    WHERE (p_search IS NULL OR p_search = ''
        OR CONVERT(CAST(invoice_id AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(CAST(order_id AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(CAST(invoice_number AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(member_name USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci)
      AND (p_status IS NULL OR p_status = '' OR display_status = p_status)
      AND (p_order_id IS NULL OR p_order_id = 0 OR order_id = p_order_id)
      AND (p_start IS NULL OR DATE(issue_date) >= p_start)
      AND (p_end IS NULL OR DATE(issue_date) <= p_end)
    ORDER BY issue_date DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_order_detail` (IN `p_order_id` INT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_order_list` (IN `p_search` VARCHAR(100), IN `p_status` VARCHAR(20), IN `p_store_id` INT, IN `p_start` DATE, IN `p_end` DATE)   BEGIN
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
    WHERE (p_search IS NULL OR p_search = ''
        OR CONVERT(CAST(order_id AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(CAST(member_id AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(member_name USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci)
      AND (p_status IS NULL OR p_status = '' OR order_status = p_status)
      AND (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id)
      AND (p_start IS NULL OR DATE(order_date) >= p_start)
      AND (p_end IS NULL OR DATE(order_date) <= p_end)
    ORDER BY order_date DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_overview` (OUT `p_current_month` DECIMAL(12,2), OUT `p_last_month` DECIMAL(12,2), OUT `p_growth_percent` DECIMAL(8,2), OUT `p_total_orders` INT)   BEGIN
    DECLARE v_current_start DATE;
    DECLARE v_next_start DATE;
    DECLARE v_last_start DATE;

    SET v_current_start = DATE_FORMAT(CURRENT_DATE, '%Y-%m-01');
    SET v_next_start = DATE_ADD(v_current_start, INTERVAL 1 MONTH);
    SET v_last_start = DATE_SUB(v_current_start, INTERVAL 1 MONTH);

    SELECT IFNULL(SUM(payable_amount), 0)
    INTO p_current_month
    FROM vm_finance_order_settlement
    WHERE is_settled = 1
      AND order_date >= v_current_start
      AND order_date < v_next_start;

    SELECT IFNULL(SUM(payable_amount), 0)
    INTO p_last_month
    FROM vm_finance_order_settlement
    WHERE is_settled = 1
      AND order_date >= v_last_start
      AND order_date < v_current_start;

    SELECT COUNT(*)
    INTO p_total_orders
    FROM vm_finance_order_settlement
    WHERE order_date >= v_current_start
      AND order_date < v_next_start;

    IF p_last_month = 0 THEN
        SET p_growth_percent = NULL;
    ELSE
        SET p_growth_percent = ROUND(((p_current_month - p_last_month) / p_last_month) * 100, 2);
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_payment_method_summary` (IN `p_start` DATE, IN `p_end` DATE)   BEGIN
    IF p_start IS NULL THEN
        SET p_start = DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);
    END IF;
    IF p_end IS NULL THEN
        SET p_end = CURRENT_DATE;
    END IF;

    SELECT
        payment_method,
        ROUND(SUM(allocated_amount), 2) AS amount
    FROM vm_finance_invoice_payment_allocation_detail
    WHERE allocation_date >= p_start
      AND allocation_date < DATE_ADD(p_end, INTERVAL 1 DAY)
    GROUP BY payment_method
    ORDER BY amount DESC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_purchase_cost_by_date` (IN `p_start` DATE, IN `p_end` DATE)   BEGIN
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
    GROUP BY cost_day
    ORDER BY cost_day;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_receive_payment` (IN `p_invoice_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_payment_method` VARCHAR(50), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_revenue_by_date` (IN `p_start` DATE, IN `p_end` DATE)   BEGIN
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
    GROUP BY order_day
    ORDER BY order_day;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_add_book` (IN `p_ISBN` VARCHAR(20), IN `p_name` VARCHAR(200), IN `p_publisher` VARCHAR(100), IN `p_language` VARCHAR(50), IN `p_introduction` TEXT, IN `p_binding` VARCHAR(50), IN `p_unit_price` DECIMAL(10,2), IN `p_author_ids` JSON, IN `p_category_ids` JSON, OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255), OUT `p_sku_id` INT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_add_employee` (IN `p_user_id` INT, IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_store_id` INT, IN `p_job_title_id` INT, IN `p_phone` VARCHAR(20), IN `p_performance` DECIMAL(5,2), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255), OUT `p_employee_id` INT)   BEGIN
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
    ELSEIF EXISTS (SELECT 1 FROM employees WHERE phone = p_phone) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Phone number already exists';
        SET p_employee_id = NULL;
        ROLLBACK;
    ELSE
        INSERT INTO employees (user_id, first_name, last_name, store_id, job_title_id, phone, performance)
        VALUES (p_user_id, p_first_name, p_last_name, p_store_id, p_job_title_id, p_phone, COALESCE(p_performance, 75));

        SET p_employee_id = LAST_INSERT_ID();
        SET p_result_code = 1;
        SET p_result_message = 'Success: Employee added';
        COMMIT;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_add_supplier` (IN `p_name` VARCHAR(100), IN `p_phone` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_address` VARCHAR(200), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255), OUT `p_supplier_id` INT)   BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Failed to add supplier';
        SET p_supplier_id = NULL;
        ROLLBACK;
    END;

    -- 开始事务
    START TRANSACTION;

    -- 验证必填字段
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
    ELSE
        -- 检查供应商名称是否已存在
        IF EXISTS (SELECT 1 FROM suppliers WHERE name = p_name) THEN
            SET p_result_code = 0;
            SET p_result_message = 'Error: Supplier name already exists';
            SET p_supplier_id = NULL;
            ROLLBACK;
        ELSE
            -- 插入新供应商
            INSERT INTO suppliers (name, phone, email, address)
            VALUES (p_name, p_phone, p_email, p_address);

            -- 获取新插入的供应商ID
            SET p_supplier_id = LAST_INSERT_ID();
            SET p_result_code = 1;
            SET p_result_message = 'Success: Supplier added successfully';

            COMMIT;
        END IF;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_approve_request` (IN `p_request_id` INT, IN `p_approved_by` INT, IN `p_note` VARCHAR(500), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_create_purchase` (IN `p_store_id` INT, IN `p_supplier_id` INT, IN `p_purchase_detail` JSON, IN `p_note` VARCHAR(500), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255), OUT `p_purchase_id` INT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_create_replenishment_request` (IN `p_store_id` INT, IN `p_sku_id` INT, IN `p_requested_quantity` INT, IN `p_urgency_level` ENUM('low','medium','high'), IN `p_requested_by` INT, IN `p_reason` VARCHAR(500), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255), OUT `p_request_id` INT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_delete_employee` (IN `p_employee_id` INT, OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_delete_supplier` (IN `p_supplier_id` INT, OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
    DECLARE v_purchase_count INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Failed to delete supplier';
        ROLLBACK;
    END;

    -- 开始事务
    START TRANSACTION;

    -- 验证供应商是否存在
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE supplier_id = p_supplier_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Supplier not found';
        ROLLBACK;
    ELSE
        -- 检查是否有关联的采购单
        SELECT COUNT(*) INTO v_purchase_count
        FROM purchases
        WHERE supplier_id = p_supplier_id;

        IF v_purchase_count > 0 THEN
            SET p_result_code = 0;
            SET p_result_message = CONCAT('Error: Cannot delete supplier with ', v_purchase_count, ' associated purchase(s)');
            ROLLBACK;
        ELSE
            -- 删除供应商
            DELETE FROM suppliers WHERE supplier_id = p_supplier_id;

            SET p_result_code = 1;
            SET p_result_message = 'Success: Supplier deleted successfully';
            COMMIT;
        END IF;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_reject_request` (IN `p_request_id` INT, IN `p_approved_by` INT, IN `p_rejection_reason` VARCHAR(500), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_reset_user_password` (IN `p_user_id` INT, OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
    DECLARE v_default_password_hash VARCHAR(50);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Failed to reset password';
        ROLLBACK;
    END;

    -- 开始事务
    START TRANSACTION;

    -- 验证用户是否存在
    IF NOT EXISTS (SELECT 1 FROM users WHERE user_id = p_user_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: User not found';
        ROLLBACK;
    ELSE
        -- 设置默认密码为 "Password@123"
        -- 注意：在实际生产环境中应该使用更安全的哈希算法（如 bcrypt）
        -- 这里为了演示目的使用简单的密码
        SET v_default_password_hash = 'Password@123';

        -- 更新用户密码
        UPDATE users
        SET password_hash = v_default_password_hash
        WHERE user_id = p_user_id;

        SET p_result_code = 1;
        SET p_result_message = 'Success: Password has been reset to default (Password@123)';
        COMMIT;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_send_notification` (IN `p_title` VARCHAR(200), IN `p_content` TEXT, IN `p_publish_at` DATETIME, IN `p_expire_at` DATETIME, OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255), OUT `p_announcement_id` INT)   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_transfer_inventory` (IN `p_from_store_id` INT, IN `p_to_store_id` INT, IN `p_sku_id` INT, IN `p_quantity` INT, OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_update_employee` (IN `p_employee_id` INT, IN `p_user_id` INT, IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_store_id` INT, IN `p_job_title_id` INT, IN `p_phone` VARCHAR(20), IN `p_performance` DECIMAL(5,2), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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
    ELSEIF EXISTS (SELECT 1 FROM employees WHERE phone = p_phone AND employee_id != p_employee_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Validation failed: Phone number already exists';
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
            phone = p_phone,
            performance = p_performance
        WHERE employee_id = p_employee_id;

        SET p_result_code = 1;
        SET p_result_message = 'Success: Employee updated';
        COMMIT;
    END IF;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_update_pricing` (IN `p_sku_id` INT, IN `p_new_price` DECIMAL(10,2), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_manager_update_supplier` (IN `p_supplier_id` INT, IN `p_name` VARCHAR(100), IN `p_phone` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_address` VARCHAR(200), OUT `p_result_code` INT, OUT `p_result_message` VARCHAR(255))   BEGIN
    DECLARE v_existing_name VARCHAR(100);

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Failed to update supplier';
        ROLLBACK;
    END;

    -- 开始事务
    START TRANSACTION;

    -- 验证供应商是否存在
    IF NOT EXISTS (SELECT 1 FROM suppliers WHERE supplier_id = p_supplier_id) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Supplier not found';
        ROLLBACK;
    ELSE
        -- 如果更新名称，检查新名称是否与其他供应商重复
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
                -- 更新供应商信息
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
            -- 不更新名称，直接更新其他字段
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

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_staff_add_purchase_item` (IN `p_purchase_id` INT, IN `p_sku_id` INT, IN `p_quantity` INT)   BEGIN
    INSERT INTO purchase_items (purchase_id, sku_id, quantity)
    VALUES (p_purchase_id, p_sku_id, p_quantity);
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_staff_create_purchase_header` (IN `p_store_id` INT, IN `p_supplier_id` INT, IN `p_note` VARCHAR(255), OUT `p_new_purchase_id` INT)   BEGIN
    -- 插入主表
    INSERT INTO purchases (store_id, supplier_id, purchase_date, note, status)
    VALUES (p_store_id, p_supplier_id, NOW(), p_note, 'pending');
    
    -- 返回生成的 ID
    SET p_new_purchase_id = LAST_INSERT_ID();
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_staff_get_inventory` (IN `p_store_id` INT)   BEGIN
    SELECT 
        b.ISBN,
        b.name AS book_name,
        b.publisher,
        
        -- 核心修改: 使用子查询获取真正的分类名称，用逗号分隔
        (
            SELECT GROUP_CONCAT(c.name SEPARATOR ', ')
            FROM book_categories bc
            JOIN catagories c ON bc.category_id = c.category_id
            WHERE bc.ISBN = b.ISBN
        ) AS category,
        
        s.binding, -- 保留 binding 字段，以便前端如果有需要可以单独显示
        s.unit_price,
        s.sku_id,
        
        -- 计算库存
        COALESCE(SUM(ib.quantity), 0) AS quantity,
        
        -- 获取批次号 (显示最新的一个，用于列表展示)
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
        s.sku_id
    ORDER BY 
        b.name ASC;
END$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_staff_get_orders` (IN `p_store_id` INT)   BEGIN
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
END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- 表的结构 `announcements`
--

CREATE TABLE `announcements` (
  `announcement_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` varchar(255) NOT NULL,
  `publish_at` datetime NOT NULL,
  `expire_at` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `announcements`
--

INSERT INTO `announcements` (`announcement_id`, `title`, `content`, `publish_at`, `expire_at`) VALUES
(1, 'Mid-Autumn Festival Promotion', 'To celebrate the Mid-Autumn Festival, all paperbacks are 20% off this week. Gold members enjoy an additional 10% discount.', '2025-09-15 09:00:00', '2025-09-22 23:59:59'),
(2, 'New Arrivals: Computer Science Classics', 'New computer science titles have arrived, including algorithms, operating systems, and AI-related books. Check them out in-store or online.', '2025-09-20 10:00:00', '0000-00-00 00:00:00'),
(3, 'Store Maintenance Notice', 'Our online store will undergo system maintenance on September 25 from 01:00 to 03:00. During this period, checkout services may be unavailable.', '2025-09-25 12:00:00', '2025-09-25 03:00:00'),
(4, 'Final Exam Season Reading Recommendations', 'To support students during the final exam season, we have curated a special list of recommended textbooks and reference books. Selected titles are available with limited-time discounts.', '2025-10-05 10:00:00', '2025-10-20 23:59:59'),
(5, 'Extended Opening Hours This Weekend', 'Our physical bookstore will extend opening hours this weekend, staying open until 10:00 PM on Saturday and Sunday. Welcome to visit and enjoy a quieter reading environment.', '2025-10-12 08:00:00', '2025-10-13 22:00:00'),
(6, 'New Year 2026 Promotion', 'To celebrate the New Year 2026, enjoy up to 25% off on selected books across all categories. Members can receive extra discounts during the promotion period. Happy New Year and happy reading!', '2025-12-01 10:00:00', '2026-01-07 23:59:59'),
(7, 'Spring 2026 Book Sale', 'Welcome the Spring 2026 season with our special book sale. Selected titles across literature, science, and technology are available with discounts of up to 20%. Members enjoy additional exclusive offers during the promotion.', '2026-03-10 09:00:00', '2026-03-24 23:59:59');

-- --------------------------------------------------------

--
-- 表的结构 `authors`
--

CREATE TABLE `authors` (
  `author_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `country` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `authors`
--

INSERT INTO `authors` (`author_id`, `first_name`, `last_name`, `country`) VALUES
(1, 'Cervantes', 'Miguel', 'Spain'),
(2, 'Tolstoy', 'Leo', 'Russia'),
(3, 'Dostoevsky', 'Fyodor', 'Russia'),
(4, 'Gogol', 'Nikolai', 'Russia'),
(5, 'Turgenev', 'Ivan', 'Russia'),
(6, 'Pushkin', 'Alexander', 'Russia'),
(7, 'Pasternak', 'Boris', 'Russia'),
(8, 'Bulgakov', 'Mikhail', 'Russia'),
(9, 'Solzhenitsyn', 'Aleksandr', 'Russia'),
(10, 'Chekhov', 'Anton', 'Russia'),
(11, 'Hugo', 'Victor', 'France'),
(12, 'Dumas', 'Alexandre', 'France'),
(13, 'Flaubert', 'Gustave', 'France'),
(14, 'Stendhal', 'Stendhal', 'France'),
(15, 'Zola', 'Emile', 'France'),
(16, 'Proust', 'Marcel', 'France'),
(17, 'Camus', 'Albert', 'France'),
(18, 'Voltaire', 'Voltaire', 'France'),
(19, 'Saint-Exupery', 'Antoine de', 'France'),
(20, 'Shakespeare', 'William', 'UK'),
(21, 'Austen', 'Jane', 'UK'),
(22, 'Bronte', 'Charlotte', 'UK'),
(23, 'Bronte', 'Emily', 'UK'),
(24, 'Dickens', 'Charles', 'UK'),
(25, 'Orwell', 'George', 'UK'),
(26, 'Huxley', 'Aldous', 'UK'),
(27, 'Shelley', 'Mary', 'UK'),
(28, 'Carroll', 'Lewis', 'UK'),
(29, 'Melville', 'Herman', 'USA'),
(30, 'Fitzgerald', 'F. Scott', 'USA'),
(31, 'Lee', 'Harper', 'USA'),
(32, 'Salinger', 'J. D.', 'USA'),
(33, 'Steinbeck', 'John', 'USA'),
(34, 'Hemingway', 'Ernest', 'USA'),
(35, 'Bradbury', 'Ray', 'USA'),
(36, 'Twain', 'Mark', 'USA'),
(37, 'Hawthorne', 'Nathaniel', 'USA'),
(38, 'Ellison', 'Ralph', 'USA'),
(39, 'Morrison', 'Toni', 'USA'),
(40, 'Faulkner', 'William', 'USA'),
(41, 'Montgomery', 'L. M.', 'Canada'),
(42, 'Atwood', 'Margaret', 'Canada'),
(43, 'Martel', 'Yann', 'Canada'),
(44, 'Ondaatje', 'Michael', 'Canada'),
(45, 'Davies', 'Robertson', 'Canada'),
(46, 'Alighieri', 'Dante', 'Italy'),
(47, 'Boccaccio', 'Giovanni', 'Italy'),
(48, 'Machiavelli', 'Niccolo', 'Italy'),
(49, 'Eco', 'Umberto', 'Italy'),
(50, 'Calvino', 'Italo', 'Italy'),
(51, 'Lampedusa', 'Giuseppe Tomasi di', 'Italy'),
(52, 'Manzoni', 'Alessandro', 'Italy'),
(53, 'Ariosto', 'Ludovico', 'Italy'),
(54, 'Murasaki', 'Shikibu', 'Japan'),
(55, 'Sei', 'Shonagon', 'Japan'),
(56, 'Natsume', 'Soseki', 'Japan'),
(57, 'Kawabata', 'Yasunari', 'Japan'),
(58, 'Mishima', 'Yukio', 'Japan'),
(59, 'Dazai', 'Osamu', 'Japan'),
(60, 'Abe', 'Kobo', 'Japan'),
(61, 'Endo', 'Shusaku', 'Japan'),
(62, 'Tanizaki', 'Junichiro', 'Japan'),
(63, 'Heo', 'Gyun', 'Korea'),
(64, 'Kim', 'Man-jung', 'Korea'),
(65, 'Anonymous', 'Anonymous', 'Korea'),
(66, 'Choi', 'In-hun', 'Korea'),
(67, 'Lee', 'Mun-yeol', 'Korea'),
(68, 'Shin', 'Kyung-sook', 'Korea'),
(69, 'Han', 'Kang', 'Korea'),
(70, 'Hwang', 'Sok-yong', 'Korea'),
(71, 'Park', 'Wan-suh', 'Korea'),
(72, 'Cho', 'Nam-joo', 'Korea'),
(73, 'Kim', 'So-wol', 'Korea'),
(74, 'Cao', 'Xueqin', 'China'),
(75, 'Wu', 'Cheng\'en', 'China'),
(76, 'Shi', 'Nai\'an', 'China'),
(77, 'Luo', 'Guanzhong', 'China'),
(78, 'Wu', 'Jingzi', 'China'),
(79, 'Pu', 'Songling', 'China'),
(80, 'Qian', 'Zhongshu', 'China'),
(81, 'Lu', 'Xun', 'China'),
(82, 'Shen', 'Congwen', 'China'),
(83, 'Lao', 'She', 'China'),
(84, 'Ba', 'Jin', 'China');

-- --------------------------------------------------------

--
-- 表的结构 `books`
--

CREATE TABLE `books` (
  `ISBN` char(13) NOT NULL,
  `name` varchar(50) NOT NULL,
  `language` varchar(50) NOT NULL,
  `publisher` varchar(50) NOT NULL,
  `introduction` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `books`
--

INSERT INTO `books` (`ISBN`, `name`, `language`, `publisher`, `introduction`) VALUES
('9782000000001', 'Red Chamber Dream', 'Chinese', 'Penguin Classics', 'A panoramic portrayal of love, decline, and Qing dynasty aristocracy.'),
('9782000000002', 'Journey to the West', 'Chinese', 'Foreign Languages Press', 'A mythic pilgrimage blending adventure, satire, and spiritual allegory.'),
('9782000000003', 'Water Margin', 'Chinese', 'Foreign Languages Press', 'Outlaw heroes challenge authority in a turbulent historical landscape.'),
('9782000000004', 'Romance of the Three Kingdoms', 'Chinese', 'Foreign Languages Press', 'Political intrigue and warfare shape the fate of rival kingdoms.'),
('9782000000005', 'The Scholars', 'Chinese', 'People\'s Literature Press', 'A satirical exposure of scholarly hypocrisy and social ambition.'),
('9782000000006', 'Strange Tales from a Chinese Studio', 'Chinese', 'People\'s Literature Press', 'Supernatural tales reflecting morality, desire, and human folly.'),
('9782000000007', 'Fortress Besieged', 'Chinese', 'Penguin Classics', 'An ironic study of marriage, intellect, and modern Chinese society.'),
('9782000000008', 'Call to Arms', 'Chinese', 'People\'s Literature Press', 'Short stories confronting trauma, awakening, and national identity.'),
('9782000000009', 'Border Town', 'Chinese', 'Penguin Classics', 'A lyrical coming-of-age story set in a remote riverside town.'),
('9782000000010', 'Rickshaw Boy', 'Chinese', 'Penguin Classics', 'A tragic portrait of individual struggle within urban poverty.'),
('9782000000011', 'Family', 'Chinese', 'People\'s Literature Press', 'Family conflict mirrors social change and generational tension.'),
('9782000000012', 'Teahouse', 'Chinese', 'People\'s Literature Press', 'A stage panorama of social classes in modern China.'),
('9782000000013', 'War and Peace', 'Russian', 'Vintage Classics', 'An epic depiction of war, history, and private lives.'),
('9782000000014', 'Anna Karenina', 'Russian', 'Penguin Classics', 'Love and society collide under rigid moral conventions.'),
('9782000000015', 'Crime and Punishment', 'Russian', 'Penguin Classics', 'A psychological descent driven by guilt, ideology, and conscience.'),
('9782000000016', 'The Brothers Karamazov', 'Russian', 'Everyman\'s Library', 'Faith, doubt, and morality tested within one fractured family.'),
('9782000000017', 'The Idiot', 'Russian', 'Penguin Classics', 'Innocence confronts cynicism in a morally compromised world.'),
('9782000000018', 'Dead Souls', 'Russian', 'Oxford World\'s Classics', 'A grotesque satire of bureaucracy and social emptiness.'),
('9782000000019', 'Fathers and Sons', 'Russian', 'Oxford World\'s Classics', 'Generational conflict between tradition and radical ideas.'),
('9782000000020', 'Eugene Onegin', 'Russian', 'Penguin Classics', 'A poetic reflection on love, loss, and social alienation.'),
('9782000000021', 'Doctor Zhivago', 'Russian', 'Vintage Classics', 'Private lives reshaped by revolution and historical upheaval.'),
('9782000000022', 'The Master and Margarita', 'Russian', 'Penguin Classics', 'A fantastical satire of power, belief, and totalitarianism.'),
('9782000000023', 'One Day in the Life of Ivan Denisovich', 'Russian', 'Vintage Classics', 'A stark account of survival within a labor camp.'),
('9782000000024', 'The Cherry Orchard', 'Russian', 'Oxford World\'s Classics', 'An elegy for a fading aristocratic world.'),
('9782000000025', 'Les Misérables', 'French', 'Penguin Classics', 'Justice, redemption, and suffering in post-revolutionary France.'),
('9782000000026', 'The Hunchback of Notre-Dame', 'French', 'Oxford World\'s Classics', 'Love, fate, and architecture intertwine in medieval Paris.'),
('9782000000027', 'The Count of Monte Cristo', 'French', 'Penguin Classics', 'A masterful tale of betrayal, endurance, and revenge.'),
('9782000000028', 'The Three Musketeers', 'French', 'Penguin Classics', 'Friendship and honor amid political intrigue and adventure.'),
('9782000000029', 'Madame Bovary', 'French', 'Oxford World\'s Classics', 'Domestic dissatisfaction exposes social and moral constraints.'),
('9782000000030', 'The Red and the Black', 'French', 'Penguin Classics', 'Ambition and class anxiety drive a tragic social ascent.'),
('9782000000031', 'Germinal', 'French', 'Penguin Classics', 'Industrial struggle and working-class life under capitalism.'),
('9782000000032', 'In Search of Lost Time', 'French', 'Vintage Classics', 'Memory and consciousness reshape time and personal identity.'),
('9782000000033', 'The Stranger', 'French', 'Vintage Classics', 'An exploration of alienation and moral absurdity.'),
('9782000000034', 'The Plague', 'French', 'Vintage Classics', 'Human solidarity tested during an epidemic.'),
('9782000000035', 'Candide', 'French', 'Penguin Classics', 'Optimism dismantled through sharp philosophical satire.'),
('9782000000036', 'The Little Prince', 'French', 'Reynal & Hitchcock', 'A poetic fable about innocence, loss, and responsibility.'),
('9782000000037', 'Hamlet', 'English', 'Arden Shakespeare', 'A prince confronts revenge, doubt, and moral responsibility.'),
('9782000000038', 'Macbeth', 'English', 'Arden Shakespeare', 'Ambition and prophecy unravel moral order.'),
('9782000000039', 'King Lear', 'English', 'Arden Shakespeare', 'Authority, madness, and family betrayal collide.'),
('9782000000040', 'Pride and Prejudice', 'English', 'Penguin Classics', 'Love and class prejudice examined through irony.'),
('9782000000041', 'Sense and Sensibility', 'English', 'Oxford World\'s Classics', 'Sisterhood and reason shape romantic choice.'),
('9782000000042', 'Jane Eyre', 'English', 'Penguin Classics', 'A woman seeks autonomy through love and resilience.'),
('9782000000043', 'Wuthering Heights', 'English', 'Penguin Classics', 'Passion and revenge erupt across a bleak landscape.'),
('9782000000044', 'Great Expectations', 'English', 'Penguin Classics', 'Personal growth shaped by hardship and moral testing.'),
('9782000000045', 'Oliver Twist', 'English', 'Penguin Classics', 'Childhood innocence confronted by social cruelty.'),
('9782000000046', 'A Tale of Two Cities', 'English', 'Penguin Classics', 'Revolutionary violence alters private destinies.'),
('9782000000047', 'Nineteen Eighty-Four', 'English', 'Penguin Classics', 'Totalitarian surveillance destroys truth and individuality.'),
('9782000000048', 'Brave New World', 'English', 'Harper Perennial', 'A controlled society trades freedom for stability.'),
('9782000000049', 'Frankenstein', 'English', 'Penguin Classics', 'Creation, responsibility, and unintended consequence.'),
('9782000000050', 'Alice\'s Adventures in Wonderland', 'English', 'Macmillan', 'Logic and language dissolve in a playful fantasy.'),
('9782000000051', 'Moby-Dick', 'English', 'Penguin Classics', 'An obsessive quest challenges humanity and faith.'),
('9782000000052', 'The Great Gatsby', 'English', 'Scribner', 'Wealth and illusion mask moral emptiness.'),
('9782000000053', 'To Kill a Mockingbird', 'English', 'J.B. Lippincott', 'Racial injustice examined through a child’s perspective.'),
('9782000000054', 'The Catcher in the Rye', 'English', 'Little, Brown', 'Adolescent alienation and resistance to conformity.'),
('9782000000055', 'The Grapes of Wrath', 'English', 'Penguin Classics', 'Economic hardship devastates a displaced family.'),
('9782000000056', 'Of Mice and Men', 'English', 'Penguin Classics', 'Friendship and dreams collapse under harsh reality.'),
('9782000000057', 'The Old Man and the Sea', 'English', 'Scribner', 'Perseverance and dignity in the face of defeat.'),
('9782000000058', 'The Sun Also Rises', 'English', 'Scribner', 'Disillusionment of a postwar generation abroad.'),
('9782000000059', 'Fahrenheit 451', 'English', 'Simon & Schuster', 'Books, censorship, and resistance in a future society.'),
('9782000000060', 'Adventures of Huckleberry Finn', 'English', 'Penguin Classics', 'Freedom and morality along the Mississippi River.'),
('9782000000061', 'The Scarlet Letter', 'English', 'Penguin Classics', 'Sin, shame, and judgment in a rigid society.'),
('9782000000062', 'Invisible Man', 'English', 'Vintage Classics', 'Identity and invisibility in a racially divided nation.'),
('9782000000063', 'Beloved', 'English', 'Vintage Classics', 'Historical trauma and memory haunt personal life.'),
('9782000000064', 'The Sound and the Fury', 'English', 'Vintage Classics', 'Fragmented consciousness within a declining family.'),
('9782000000065', 'Anne of Green Gables', 'English', 'McClelland & Stewart', 'Imagination and growth in a rural childhood.'),
('9782000000066', 'The Handmaid\'s Tale', 'English', 'Anchor Books', 'Women’s autonomy challenged by authoritarian control.'),
('9782000000067', 'Alias Grace', 'English', 'Anchor Books', 'Crime, memory, and female identity in Victorian Canada.'),
('9782000000068', 'Life of Pi', 'English', 'Vintage Canada', 'Survival, faith, and storytelling at sea.'),
('9782000000069', 'The English Patient', 'English', 'Vintage Canada', 'Love and loss against the backdrop of war.'),
('9782000000070', 'Fifth Business', 'English', 'Penguin Canada', 'Identity shaped by myth, failure, and responsibility.'),
('9782000000071', 'The Divine Comedy', 'Italian', 'Penguin Classics', 'A spiritual journey through hell, purgatory, and paradise.'),
('9782000000072', 'The Decameron', 'Italian', 'Penguin Classics', 'Storytelling as refuge during social catastrophe.'),
('9782000000073', 'The Prince', 'Italian', 'Oxford World\'s Classics', 'Pragmatic analysis of power and political rule.'),
('9782000000074', 'The Name of the Rose', 'Italian', 'Harcourt', 'Murder, theology, and knowledge in a medieval abbey.'),
('9782000000075', 'If on a winter\'s night a traveler', 'Italian', 'Vintage Classics', 'Reading, authorship, and narrative uncertainty.'),
('9782000000076', 'The Leopard', 'Italian', 'Vintage Classics', 'Aristocratic decline amid national unification.'),
('9782000000077', 'The Betrothed', 'Italian', 'Penguin Classics', 'Faith, justice, and suffering in historical Italy.'),
('9782000000078', 'Orlando Furioso', 'Italian', 'Penguin Classics', 'Chivalric romance infused with imagination and irony.'),
('9782000000079', 'The Tale of Genji', 'Japanese', 'Penguin Classics', 'Courtly love and politics in classical Japan.'),
('9782000000080', 'The Pillow Book', 'Japanese', 'Penguin Classics', 'Observations of elegance and daily court life.'),
('9782000000081', 'Kokoro', 'Japanese', 'Penguin Classics', 'Moral anxiety in a rapidly modernizing society.'),
('9782000000082', 'Snow Country', 'Japanese', 'Vintage Classics', 'Loneliness and fleeting intimacy in a snowy landscape.'),
('9782000000083', 'The Temple of the Golden Pavilion', 'Japanese', 'Vintage Classics', 'Obsession with beauty and destruction.'),
('9782000000084', 'The Sound of Waves', 'Japanese', 'Penguin Classics', 'Young love shaped by tradition and nature.'),
('9782000000085', 'No Longer Human', 'Japanese', 'New Directions', 'Alienation and self-destruction in modern life.'),
('9782000000086', 'The Woman in the Dunes', 'Japanese', 'Vintage Classics', 'Existential struggle in an oppressive environment.'),
('9782000000087', 'Silence', 'Japanese', 'Penguin Classics', 'Faith and doubt under religious persecution.'),
('9782000000088', 'The Makioka Sisters', 'Japanese', 'Vintage Classics', 'Family decline during cultural transition.'),
('9782000000089', 'The Tale of Hong Gildong', 'Korean', 'Penguin Classics', 'A rebellious hero challenges social hierarchy.'),
('9782000000090', 'The Cloud Dream of the Nine', 'Korean', 'Penguin Classics', 'Dream, desire, and transcendence in classical narrative.'),
('9782000000091', 'The Tale of Chunhyang', 'Korean', 'Penguin Classics', 'Love and loyalty defy rigid social order.'),
('9782000000092', 'The Square', 'Korean', 'Penguin Classics', 'Ideological conflict and divided identity.'),
('9782000000093', 'Our Twisted Hero', 'Korean', 'Penguin Classics', 'Power dynamics exposed through childhood allegory.'),
('9782000000094', 'Please Look After Mom', 'Korean', 'Knopf', 'Family bonds tested by absence and memory.'),
('9782000000095', 'The Vegetarian', 'Korean', 'Portobello Books', 'Violence and conformity examined through the body.'),
('9782000000096', 'Human Acts', 'Korean', 'Portobello Books', 'Collective trauma during political repression.'),
('9782000000097', 'The Guest', 'Korean', 'Penguin Classics', 'Historical violence and unresolved guilt.'),
('9782000000098', 'Mother ', 'Korean', 'Penguin Classics', 'Everyday resilience of women across generations.'),
('9782000000099', 'Kim Jiyoung, Born 1982', 'Korean', 'Cho Changbi', 'Gender roles questioned in contemporary society.'),
('9782000000100', 'Azaleas', 'Korean', 'Penguin Classics', 'Lyric poems expressing longing and national sentiment.');

-- --------------------------------------------------------

--
-- 表的结构 `book_authors`
--

CREATE TABLE `book_authors` (
  `author_id` int(11) NOT NULL,
  `ISBN` char(13) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `book_authors`
--

INSERT INTO `book_authors` (`author_id`, `ISBN`) VALUES
(2, '9782000000013'),
(2, '9782000000014'),
(3, '9782000000015'),
(3, '9782000000016'),
(3, '9782000000017'),
(4, '9782000000018'),
(5, '9782000000019'),
(6, '9782000000020'),
(7, '9782000000021'),
(8, '9782000000022'),
(9, '9782000000023'),
(10, '9782000000024'),
(11, '9782000000025'),
(11, '9782000000026'),
(12, '9782000000027'),
(12, '9782000000028'),
(13, '9782000000029'),
(14, '9782000000030'),
(15, '9782000000031'),
(16, '9782000000032'),
(17, '9782000000033'),
(17, '9782000000034'),
(18, '9782000000035'),
(19, '9782000000036'),
(20, '9782000000037'),
(20, '9782000000038'),
(20, '9782000000039'),
(21, '9782000000040'),
(21, '9782000000041'),
(22, '9782000000042'),
(23, '9782000000043'),
(24, '9782000000044'),
(24, '9782000000045'),
(24, '9782000000046'),
(25, '9782000000047'),
(26, '9782000000048'),
(27, '9782000000049'),
(28, '9782000000050'),
(29, '9782000000051'),
(30, '9782000000052'),
(31, '9782000000053'),
(32, '9782000000054'),
(33, '9782000000055'),
(33, '9782000000056'),
(34, '9782000000057'),
(34, '9782000000058'),
(35, '9782000000059'),
(36, '9782000000060'),
(37, '9782000000061'),
(38, '9782000000062'),
(39, '9782000000063'),
(40, '9782000000064'),
(41, '9782000000065'),
(42, '9782000000066'),
(42, '9782000000067'),
(43, '9782000000068'),
(44, '9782000000069'),
(45, '9782000000070'),
(46, '9782000000071'),
(47, '9782000000072'),
(48, '9782000000073'),
(49, '9782000000074'),
(50, '9782000000075'),
(51, '9782000000076'),
(52, '9782000000077'),
(53, '9782000000078'),
(54, '9782000000079'),
(55, '9782000000080'),
(56, '9782000000081'),
(57, '9782000000082'),
(58, '9782000000083'),
(58, '9782000000084'),
(59, '9782000000085'),
(60, '9782000000086'),
(61, '9782000000087'),
(62, '9782000000088'),
(63, '9782000000089'),
(64, '9782000000090'),
(65, '9782000000091'),
(66, '9782000000092'),
(67, '9782000000093'),
(68, '9782000000094'),
(69, '9782000000095'),
(69, '9782000000096'),
(70, '9782000000097'),
(71, '9782000000098'),
(72, '9782000000099'),
(73, '9782000000100'),
(74, '9782000000001'),
(75, '9782000000002'),
(76, '9782000000003'),
(77, '9782000000004'),
(78, '9782000000005'),
(79, '9782000000006'),
(80, '9782000000007'),
(81, '9782000000008'),
(82, '9782000000009'),
(83, '9782000000010'),
(83, '9782000000012'),
(84, '9782000000011');

-- --------------------------------------------------------

--
-- 表的结构 `book_categories`
--

CREATE TABLE `book_categories` (
  `category_id` int(11) NOT NULL,
  `ISBN` char(13) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `book_categories`
--

INSERT INTO `book_categories` (`category_id`, `ISBN`) VALUES
(1, '9782000000001'),
(1, '9782000000002'),
(1, '9782000000003'),
(1, '9782000000004'),
(1, '9782000000005'),
(1, '9782000000007'),
(1, '9782000000008'),
(1, '9782000000009'),
(1, '9782000000010'),
(1, '9782000000011'),
(1, '9782000000012'),
(1, '9782000000013'),
(1, '9782000000014'),
(1, '9782000000015'),
(1, '9782000000016'),
(1, '9782000000017'),
(1, '9782000000018'),
(1, '9782000000019'),
(1, '9782000000020'),
(1, '9782000000021'),
(1, '9782000000022'),
(1, '9782000000023'),
(1, '9782000000024'),
(1, '9782000000025'),
(1, '9782000000026'),
(1, '9782000000027'),
(1, '9782000000028'),
(1, '9782000000029'),
(1, '9782000000030'),
(1, '9782000000031'),
(1, '9782000000032'),
(1, '9782000000033'),
(1, '9782000000034'),
(1, '9782000000035'),
(1, '9782000000037'),
(1, '9782000000038'),
(1, '9782000000039'),
(1, '9782000000040'),
(1, '9782000000041'),
(1, '9782000000043'),
(1, '9782000000044'),
(1, '9782000000045'),
(1, '9782000000046'),
(1, '9782000000047'),
(1, '9782000000048'),
(1, '9782000000051'),
(1, '9782000000052'),
(1, '9782000000053'),
(1, '9782000000054'),
(1, '9782000000055'),
(1, '9782000000056'),
(1, '9782000000057'),
(1, '9782000000058'),
(1, '9782000000059'),
(1, '9782000000061'),
(1, '9782000000062'),
(1, '9782000000063'),
(1, '9782000000064'),
(1, '9782000000065'),
(1, '9782000000066'),
(1, '9782000000067'),
(1, '9782000000068'),
(1, '9782000000069'),
(1, '9782000000070'),
(1, '9782000000072'),
(1, '9782000000074'),
(1, '9782000000075'),
(1, '9782000000076'),
(1, '9782000000077'),
(1, '9782000000079'),
(1, '9782000000080'),
(1, '9782000000081'),
(1, '9782000000082'),
(1, '9782000000083'),
(1, '9782000000084'),
(1, '9782000000085'),
(1, '9782000000086'),
(1, '9782000000087'),
(1, '9782000000088'),
(1, '9782000000089'),
(1, '9782000000090'),
(1, '9782000000091'),
(1, '9782000000092'),
(1, '9782000000093'),
(1, '9782000000094'),
(1, '9782000000095'),
(1, '9782000000096'),
(1, '9782000000097'),
(1, '9782000000098'),
(1, '9782000000099'),
(1, '9782000000100'),
(2, '9782000000001'),
(2, '9782000000003'),
(2, '9782000000004'),
(2, '9782000000011'),
(2, '9782000000013'),
(2, '9782000000018'),
(2, '9782000000019'),
(2, '9782000000021'),
(2, '9782000000023'),
(2, '9782000000025'),
(2, '9782000000026'),
(2, '9782000000027'),
(2, '9782000000028'),
(2, '9782000000030'),
(2, '9782000000031'),
(2, '9782000000046'),
(2, '9782000000055'),
(2, '9782000000063'),
(2, '9782000000067'),
(2, '9782000000069'),
(2, '9782000000074'),
(2, '9782000000076'),
(2, '9782000000077'),
(2, '9782000000079'),
(2, '9782000000087'),
(2, '9782000000088'),
(2, '9782000000096'),
(2, '9782000000097'),
(3, '9782000000001'),
(3, '9782000000007'),
(3, '9782000000008'),
(3, '9782000000010'),
(3, '9782000000011'),
(3, '9782000000014'),
(3, '9782000000015'),
(3, '9782000000016'),
(3, '9782000000017'),
(3, '9782000000019'),
(3, '9782000000023'),
(3, '9782000000024'),
(3, '9782000000025'),
(3, '9782000000029'),
(3, '9782000000030'),
(3, '9782000000031'),
(3, '9782000000032'),
(3, '9782000000033'),
(3, '9782000000034'),
(3, '9782000000044'),
(3, '9782000000045'),
(3, '9782000000049'),
(3, '9782000000053'),
(3, '9782000000054'),
(3, '9782000000055'),
(3, '9782000000056'),
(3, '9782000000057'),
(3, '9782000000058'),
(3, '9782000000061'),
(3, '9782000000062'),
(3, '9782000000063'),
(3, '9782000000064'),
(3, '9782000000066'),
(3, '9782000000070'),
(3, '9782000000076'),
(3, '9782000000081'),
(3, '9782000000083'),
(3, '9782000000085'),
(3, '9782000000088'),
(3, '9782000000092'),
(3, '9782000000094'),
(3, '9782000000095'),
(3, '9782000000096'),
(3, '9782000000097'),
(3, '9782000000098'),
(3, '9782000000099'),
(4, '9782000000015'),
(4, '9782000000016'),
(4, '9782000000017'),
(4, '9782000000022'),
(4, '9782000000033'),
(4, '9782000000034'),
(4, '9782000000037'),
(4, '9782000000038'),
(4, '9782000000039'),
(4, '9782000000051'),
(4, '9782000000081'),
(4, '9782000000083'),
(4, '9782000000085'),
(4, '9782000000086'),
(4, '9782000000087'),
(4, '9782000000092'),
(4, '9782000000095'),
(5, '9782000000071'),
(5, '9782000000078'),
(6, '9782000000020'),
(6, '9782000000071'),
(6, '9782000000078'),
(6, '9782000000100'),
(7, '9782000000012'),
(7, '9782000000024'),
(7, '9782000000037'),
(7, '9782000000038'),
(7, '9782000000039'),
(8, '9782000000005'),
(8, '9782000000006'),
(8, '9782000000008'),
(8, '9782000000072'),
(8, '9782000000080'),
(8, '9782000000100'),
(9, '9782000000073'),
(9, '9782000000080'),
(10, '9782000000073'),
(11, '9782000000071'),
(11, '9782000000073'),
(14, '9782000000002'),
(14, '9782000000003'),
(14, '9782000000004'),
(14, '9782000000013'),
(14, '9782000000027'),
(14, '9782000000028'),
(14, '9782000000035'),
(14, '9782000000046'),
(14, '9782000000051'),
(14, '9782000000060'),
(14, '9782000000068'),
(14, '9782000000089'),
(15, '9782000000009'),
(15, '9782000000014'),
(15, '9782000000020'),
(15, '9782000000021'),
(15, '9782000000029'),
(15, '9782000000036'),
(15, '9782000000040'),
(15, '9782000000041'),
(15, '9782000000042'),
(15, '9782000000043'),
(15, '9782000000052'),
(15, '9782000000069'),
(15, '9782000000077'),
(15, '9782000000079'),
(15, '9782000000082'),
(15, '9782000000084'),
(15, '9782000000090'),
(15, '9782000000091'),
(15, '9782000000094'),
(15, '9782000000098'),
(16, '9782000000005'),
(16, '9782000000006'),
(16, '9782000000007'),
(16, '9782000000012'),
(16, '9782000000018'),
(16, '9782000000022'),
(16, '9782000000035'),
(16, '9782000000040'),
(16, '9782000000041'),
(16, '9782000000047'),
(16, '9782000000048'),
(16, '9782000000050'),
(16, '9782000000059'),
(16, '9782000000060'),
(16, '9782000000072'),
(16, '9782000000075'),
(16, '9782000000093'),
(16, '9782000000099'),
(17, '9782000000009'),
(17, '9782000000010'),
(17, '9782000000042'),
(17, '9782000000044'),
(17, '9782000000045'),
(17, '9782000000053'),
(17, '9782000000054'),
(17, '9782000000060'),
(17, '9782000000065'),
(17, '9782000000068'),
(17, '9782000000070'),
(17, '9782000000084'),
(17, '9782000000093'),
(18, '9782000000032'),
(18, '9782000000052'),
(18, '9782000000058'),
(18, '9782000000062'),
(18, '9782000000064'),
(18, '9782000000075'),
(18, '9782000000082'),
(18, '9782000000086'),
(19, '9782000000026'),
(19, '9782000000042'),
(19, '9782000000043'),
(19, '9782000000049'),
(19, '9782000000061'),
(20, '9782000000047'),
(20, '9782000000048'),
(20, '9782000000049'),
(20, '9782000000059'),
(20, '9782000000066'),
(21, '9782000000050'),
(21, '9782000000078'),
(22, '9782000000067'),
(22, '9782000000074'),
(23, '9782000000002'),
(23, '9782000000006'),
(23, '9782000000036'),
(23, '9782000000089'),
(23, '9782000000090'),
(23, '9782000000091'),
(24, '9782000000036'),
(24, '9782000000050'),
(24, '9782000000065'),
(25, '9782000000056'),
(25, '9782000000057');

-- --------------------------------------------------------

--
-- 表的结构 `catagories`
--

CREATE TABLE `catagories` (
  `category_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `catagories`
--

INSERT INTO `catagories` (`category_id`, `name`, `description`) VALUES
(1, 'Novel', 'Long-form prose that explores characters, society, and human choices through sustained narrative.'),
(2, 'Historical Novel', 'Fiction that reconstructs the past by blending historical context with imagined personal experience.'),
(3, 'Psychological Novel', 'Narratives that focus on inner life, motivation, and mental conflict rather than external action.'),
(4, 'Philosophical Novel', 'Stories that dramatize philosophical questions about meaning, freedom, morality, and belief.'),
(5, 'Epic Poetry', 'Verse narratives that recount heroic, mythic, or civilizational stories on a grand scale.'),
(6, 'Poetry', 'Literary works that use rhythm, imagery, and condensed language to evoke emotion and thought.'),
(7, 'Drama', 'Literature written for performance, where conflict unfolds through dialogue and staged action.'),
(8, 'Short Story Collection', 'Collections of brief, self-contained narratives that capture decisive moments or insights.'),
(9, 'Essay/Diary', 'Reflective or observational prose that records ideas, experiences, or daily life directly.'),
(10, 'Political Treatise', 'Argumentative works that analyze power, governance, and the organization of society.'),
(11, 'Philosophy', 'Texts that investigate fundamental questions of knowledge, ethics, mind, and reality.'),
(12, 'Science', 'Works that explain natural phenomena through observation, evidence, and systematic reasoning.'),
(13, 'Psychology', 'Texts that explore human behavior and mental processes through theory and interpretation.'),
(14, 'Adventure', 'Stories driven by journeys, risk, and discovery, emphasizing action and exploration.'),
(15, 'Romance', 'Narratives centered on love and intimacy as tests of social norms and personal integrity.'),
(16, 'Satire', 'Works that criticize vice and hypocrisy through irony, exaggeration, and humor.'),
(17, 'Bildungsroman', 'Coming-of-age stories that trace personal growth through education, conflict, and experience.'),
(18, 'Modernist', 'Experimental literature that reflects fragmented modern experience through innovative form.'),
(19, 'Gothic', 'Fiction marked by dark atmosphere, hidden transgression, and psychological or moral fear.'),
(20, 'Science Fiction', 'Speculative narratives that use imagined futures or technologies to examine humanity and society.'),
(21, 'Fantasy', 'Stories set in invented worlds where magic or myth structures moral and narrative order.'),
(22, 'Mystery/Detective', 'Narratives organized around investigation and inference, leading to logical revelation.'),
(23, 'Myth/Folktale', 'Traditional stories that convey cultural values through myths, legends, and folk narratives.'),
(24, 'Children\'s Literature', 'Literature written for younger readers that develops imagination, empathy, and moral sense.'),
(25, 'Novella', 'A compact prose form focusing on a single conflict or transformation with high intensity.');

-- --------------------------------------------------------

--
-- 表的结构 `employees`
--

CREATE TABLE `employees` (
  `employee_id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `job_title_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `phone` int(10) UNSIGNED NOT NULL,
  `performance` int(10) UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `employees`
--

INSERT INTO `employees` (`employee_id`, `store_id`, `job_title_id`, `user_id`, `first_name`, `last_name`, `phone`, `performance`) VALUES
(1, 1, 3, 78, 'Alex', 'Tan', 3200000001, 95),
(2, 1, 3, 79, 'Brian', 'Lim', 3200000002, 92),
(3, 1, 3, 80, 'Chloe', 'Ng', 3200000003, 88),
(4, 1, 3, 81, 'Dylan', 'Ong', 3200000004, 84),
(5, 1, 3, 82, 'Ethan', 'Goh', 3200000005, 86),
(6, 1, 3, 83, 'Fiona', 'Teo', 3200000006, 90),
(7, 1, 3, 84, 'Grace', 'Lee', 3200000007, 83),
(8, 1, 2, 85, 'Henry', 'Chua', 3200000008, 78),
(9, 2, 2, 86, 'Ivy', 'Koh', 3200000009, 80),
(10, 3, 2, 87, 'Jason', 'Ho', 3200000010, 76),
(11, 4, 2, 88, 'Kelly', 'Yap', 3200000011, 82),
(12, 1, 2, 89, 'Lucas', 'Low', 3200000012, 79),
(13, 1, 2, 90, 'Megan', 'Wong', 3200000013, 74),
(14, 1, 1, 91, 'Noah', 'Chan', 3200000014, 72),
(15, 2, 1, 92, 'Olivia', 'Tan', 3200000015, 75),
(16, 3, 1, 93, 'Peter', 'Ang', 3200000016, 70),
(17, 4, 1, 94, 'Quinn', 'Seah', 3200000017, 73),
(18, 1, 1, 95, 'Ryan', 'Sim', 3200000018, 71),
(19, 2, 1, 96, 'Sophie', 'Lau', 3200000019, 68),
(20, 3, 1, 97, 'Tristan', 'Foo', 3200000020, 66),
(21, 4, 1, 98, 'Uma', 'Yeo', 3200000021, 69),
(22, 1, 1, 99, 'Victor', 'Liew', 3200000022, 64),
(23, 2, 1, 100, 'Wendy', 'Soh', 3200000023, 60);

-- --------------------------------------------------------

--
-- 表的结构 `favorites`
--

CREATE TABLE `favorites` (
  `member_id` int(11) NOT NULL,
  `ISBN` char(13) NOT NULL,
  `create_date` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `favorites`
--

INSERT INTO `favorites` (`member_id`, `ISBN`, `create_date`) VALUES
(1, '9782000000013', '2025-12-01 10:00:00'),
(1, '9782000000083', '2025-12-06 15:00:00'),
(2, '9782000000013', '2025-12-01 10:05:00'),
(2, '9782000000083', '2025-12-06 15:05:00'),
(3, '9782000000013', '2025-12-01 10:10:00'),
(3, '9782000000095', '2025-12-06 15:10:00'),
(4, '9782000000013', '2025-12-01 10:15:00'),
(4, '9782000000095', '2025-12-06 15:15:00'),
(5, '9782000000003', '2025-12-07 16:00:00'),
(5, '9782000000013', '2025-12-01 10:20:00'),
(6, '9782000000005', '2025-12-07 16:05:00'),
(6, '9782000000013', '2025-12-01 10:25:00'),
(7, '9782000000006', '2025-12-07 16:10:00'),
(7, '9782000000013', '2025-12-01 10:30:00'),
(8, '9782000000007', '2025-12-07 16:15:00'),
(8, '9782000000013', '2025-12-01 10:35:00'),
(9, '9782000000008', '2025-12-07 16:20:00'),
(9, '9782000000013', '2025-12-01 10:40:00'),
(10, '9782000000009', '2025-12-07 16:25:00'),
(10, '9782000000013', '2025-12-01 10:45:00'),
(11, '9782000000010', '2025-12-07 16:30:00'),
(11, '9782000000013', '2025-12-01 10:50:00'),
(12, '9782000000011', '2025-12-07 16:35:00'),
(12, '9782000000013', '2025-12-01 10:55:00'),
(13, '9782000000012', '2025-12-07 16:40:00'),
(13, '9782000000025', '2025-12-02 11:00:00'),
(14, '9782000000014', '2025-12-07 16:45:00'),
(14, '9782000000025', '2025-12-02 11:05:00'),
(15, '9782000000016', '2025-12-07 16:50:00'),
(15, '9782000000025', '2025-12-02 11:10:00'),
(16, '9782000000017', '2025-12-07 16:55:00'),
(16, '9782000000025', '2025-12-02 11:15:00'),
(17, '9782000000018', '2025-12-07 17:00:00'),
(17, '9782000000025', '2025-12-02 11:20:00'),
(18, '9782000000019', '2025-12-07 17:05:00'),
(18, '9782000000025', '2025-12-02 11:25:00'),
(19, '9782000000020', '2025-12-07 17:10:00'),
(19, '9782000000025', '2025-12-02 11:30:00'),
(20, '9782000000021', '2025-12-07 17:15:00'),
(20, '9782000000025', '2025-12-02 11:35:00'),
(21, '9782000000022', '2025-12-07 17:20:00'),
(21, '9782000000025', '2025-12-02 11:40:00'),
(22, '9782000000023', '2025-12-07 17:25:00'),
(22, '9782000000025', '2025-12-02 11:45:00'),
(23, '9782000000025', '2025-12-02 11:50:00'),
(24, '9782000000025', '2025-12-02 11:55:00'),
(25, '9782000000047', '2025-12-03 12:00:00'),
(26, '9782000000047', '2025-12-03 12:05:00'),
(27, '9782000000047', '2025-12-03 12:10:00'),
(28, '9782000000047', '2025-12-03 12:15:00'),
(29, '9782000000047', '2025-12-03 12:20:00'),
(30, '9782000000047', '2025-12-03 12:25:00'),
(31, '9782000000047', '2025-12-03 12:30:00'),
(32, '9782000000047', '2025-12-03 12:35:00'),
(33, '9782000000047', '2025-12-03 12:40:00'),
(34, '9782000000047', '2025-12-03 12:45:00'),
(35, '9782000000047', '2025-12-03 12:50:00'),
(36, '9782000000001', '2025-12-04 09:00:00'),
(37, '9782000000001', '2025-12-04 09:05:00'),
(38, '9782000000001', '2025-12-04 09:10:00'),
(39, '9782000000001', '2025-12-04 09:15:00'),
(40, '9782000000001', '2025-12-04 09:20:00'),
(41, '9782000000015', '2025-12-04 09:25:00'),
(42, '9782000000015', '2025-12-04 09:30:00'),
(43, '9782000000015', '2025-12-04 09:35:00'),
(44, '9782000000015', '2025-12-04 09:40:00'),
(45, '9782000000015', '2025-12-04 09:45:00'),
(46, '9782000000029', '2025-12-04 09:50:00'),
(47, '9782000000029', '2025-12-04 09:55:00'),
(48, '9782000000029', '2025-12-04 10:00:00'),
(49, '9782000000029', '2025-12-04 10:05:00'),
(50, '9782000000029', '2025-12-04 10:10:00'),
(51, '9782000000052', '2025-12-04 10:15:00'),
(52, '9782000000052', '2025-12-04 10:20:00'),
(53, '9782000000052', '2025-12-04 10:25:00'),
(54, '9782000000052', '2025-12-04 10:30:00'),
(55, '9782000000052', '2025-12-04 10:35:00'),
(56, '9782000000066', '2025-12-04 10:40:00'),
(57, '9782000000066', '2025-12-04 10:45:00'),
(58, '9782000000066', '2025-12-04 10:50:00'),
(59, '9782000000066', '2025-12-04 10:55:00'),
(60, '9782000000066', '2025-12-04 11:00:00'),
(61, '9782000000074', '2025-12-04 11:05:00'),
(62, '9782000000074', '2025-12-04 11:10:00'),
(63, '9782000000074', '2025-12-04 11:15:00'),
(64, '9782000000074', '2025-12-04 11:20:00'),
(65, '9782000000074', '2025-12-04 11:25:00'),
(66, '9782000000002', '2025-12-05 14:00:00'),
(67, '9782000000002', '2025-12-05 14:05:00'),
(68, '9782000000004', '2025-12-05 14:10:00'),
(69, '9782000000004', '2025-12-05 14:15:00'),
(70, '9782000000033', '2025-12-05 14:20:00'),
(71, '9782000000033', '2025-12-05 14:25:00'),
(72, '9782000000037', '2025-12-05 14:30:00'),
(73, '9782000000037', '2025-12-05 14:35:00'),
(74, '9782000000057', '2025-12-05 14:40:00'),
(75, '9782000000057', '2025-12-05 14:45:00'),
(76, '9782000000068', '2025-12-05 14:50:00'),
(77, '9782000000068', '2025-12-05 14:55:00');

-- --------------------------------------------------------

--
-- 表的结构 `inventory_batches`
--

CREATE TABLE `inventory_batches` (
  `batch_id` int(11) NOT NULL,
  `sku_id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `purchase_id` int(11) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  `unit_cost` decimal(9,2) UNSIGNED NOT NULL,
  `received_date` datetime NOT NULL,
  `batch_code` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `inventory_batches`
--

INSERT INTO `inventory_batches` (`batch_id`, `sku_id`, `store_id`, `purchase_id`, `quantity`, `unit_cost`, `received_date`, `batch_code`) VALUES
(1, 23, 1, 1, 2, 12.08, '2025-11-03 10:00:00', 'P1-SKU23'),
(2, 27, 1, 1, 2, 17.24, '2025-11-03 10:00:00', 'P1-SKU27'),
(3, 33, 1, 1, 3, 22.01, '2025-11-03 10:00:00', 'P1-SKU33'),
(4, 37, 1, 1, 1, 16.10, '2025-11-03 10:00:00', 'P1-SKU37'),
(5, 72, 1, 1, 3, 29.17, '2025-11-03 10:00:00', 'P1-SKU72'),
(6, 76, 1, 1, 3, 12.42, '2025-11-03 10:00:00', 'P1-SKU76'),
(7, 89, 1, 1, 2, 14.64, '2025-11-03 10:00:00', 'P1-SKU89'),
(8, 91, 1, 1, 3, 20.62, '2025-11-03 10:00:00', 'P1-SKU91'),
(9, 95, 1, 1, 1, 22.61, '2025-11-03 10:00:00', 'P1-SKU95'),
(10, 99, 1, 1, 3, 9.78, '2025-11-03 10:00:00', 'P1-SKU99'),
(11, 122, 1, 1, 2, 31.75, '2025-11-03 10:00:00', 'P1-SKU122'),
(12, 126, 1, 1, 2, 25.21, '2025-11-03 10:00:00', 'P1-SKU126'),
(13, 132, 1, 1, 3, 26.31, '2025-11-03 10:00:00', 'P1-SKU132'),
(14, 136, 1, 1, 3, 19.51, '2025-11-03 10:00:00', 'P1-SKU136'),
(15, 33, 1, 2, 3, 22.01, '2025-11-08 10:00:00', 'P2-SKU33'),
(16, 37, 1, 2, 1, 14.61, '2025-11-08 10:00:00', 'P2-SKU37'),
(17, 62, 1, 2, 3, 21.15, '2025-11-08 10:00:00', 'P2-SKU62'),
(18, 66, 1, 2, 2, 21.31, '2025-11-08 10:00:00', 'P2-SKU66'),
(19, 81, 1, 2, 2, 22.52, '2025-11-08 10:00:00', 'P2-SKU81'),
(20, 85, 1, 2, 3, 25.14, '2025-11-08 10:00:00', 'P2-SKU85'),
(21, 89, 1, 2, 1, 12.73, '2025-11-08 10:00:00', 'P2-SKU89'),
(22, 103, 1, 2, 1, 29.09, '2025-11-08 10:00:00', 'P2-SKU103'),
(23, 10, 1, 3, 1, 23.67, '2025-11-17 10:00:00', 'P3-SKU10'),
(24, 14, 1, 3, 1, 17.46, '2025-11-17 10:00:00', 'P3-SKU14'),
(25, 41, 1, 3, 3, 29.86, '2025-11-17 10:00:00', 'P3-SKU41'),
(26, 49, 1, 3, 2, 28.11, '2025-11-17 10:00:00', 'P3-SKU49'),
(27, 51, 1, 3, 3, 19.74, '2025-11-17 10:00:00', 'P3-SKU51'),
(28, 55, 1, 3, 2, 15.10, '2025-11-17 10:00:00', 'P3-SKU55'),
(29, 59, 1, 3, 1, 17.50, '2025-11-17 10:00:00', 'P3-SKU59'),
(30, 123, 1, 3, 2, 30.68, '2025-11-17 10:00:00', 'P3-SKU123'),
(31, 127, 1, 3, 3, 22.46, '2025-11-17 10:00:00', 'P3-SKU127'),
(32, 137, 1, 3, 3, 36.78, '2025-11-17 10:00:00', 'P3-SKU137'),
(33, 17, 1, 4, 3, 25.77, '2025-11-23 10:00:00', 'P4-SKU17'),
(34, 52, 1, 4, 3, 18.65, '2025-11-23 10:00:00', 'P4-SKU52'),
(35, 56, 1, 4, 1, 18.16, '2025-11-23 10:00:00', 'P4-SKU56'),
(36, 108, 1, 4, 3, 26.78, '2025-11-23 10:00:00', 'P4-SKU108'),
(37, 110, 1, 4, 1, 39.57, '2025-11-23 10:00:00', 'P4-SKU110'),
(38, 114, 1, 4, 2, 19.76, '2025-11-23 10:00:00', 'P4-SKU114'),
(39, 118, 1, 4, 2, 32.12, '2025-11-23 10:00:00', 'P4-SKU118'),
(40, 141, 1, 4, 2, 37.51, '2025-11-23 10:00:00', 'P4-SKU141'),
(41, 145, 1, 4, 2, 31.63, '2025-11-23 10:00:00', 'P4-SKU145'),
(42, 149, 1, 4, 3, 33.94, '2025-11-23 10:00:00', 'P4-SKU149'),
(43, 151, 1, 4, 1, 40.96, '2025-11-23 10:00:00', 'P4-SKU151'),
(44, 30, 1, 5, 1, 27.12, '2025-12-02 10:00:00', 'P5-SKU30'),
(45, 34, 1, 5, 1, 24.26, '2025-12-02 10:00:00', 'P5-SKU34'),
(46, 69, 1, 5, 2, 11.73, '2025-12-02 10:00:00', 'P5-SKU69'),
(47, 82, 1, 5, 2, 19.62, '2025-12-02 10:00:00', 'P5-SKU82'),
(48, 138, 1, 5, 1, 32.16, '2025-12-02 10:00:00', 'P5-SKU138'),
(49, 20, 2, 6, 3, 25.59, '2025-11-04 11:00:00', 'P6-SKU20'),
(50, 24, 2, 6, 3, 23.80, '2025-11-04 11:00:00', 'P6-SKU24'),
(51, 28, 2, 6, 1, 21.40, '2025-11-04 11:00:00', 'P6-SKU28'),
(52, 71, 2, 6, 2, 10.03, '2025-11-04 11:00:00', 'P6-SKU71'),
(53, 75, 2, 6, 1, 26.79, '2025-11-04 11:00:00', 'P6-SKU75'),
(54, 79, 2, 6, 1, 26.80, '2025-11-04 11:00:00', 'P6-SKU79'),
(55, 92, 2, 6, 1, 30.16, '2025-11-04 11:00:00', 'P6-SKU92'),
(56, 96, 2, 6, 2, 17.24, '2025-11-04 11:00:00', 'P6-SKU96'),
(57, 101, 2, 6, 3, 23.79, '2025-11-04 11:00:00', 'P6-SKU101'),
(58, 111, 2, 6, 2, 30.46, '2025-11-04 11:00:00', 'P6-SKU111'),
(59, 115, 2, 6, 2, 31.79, '2025-11-04 11:00:00', 'P6-SKU115'),
(60, 119, 2, 6, 2, 33.26, '2025-11-04 11:00:00', 'P6-SKU119'),
(61, 140, 2, 6, 2, 31.10, '2025-11-04 11:00:00', 'P6-SKU140'),
(62, 144, 2, 6, 3, 34.03, '2025-11-04 11:00:00', 'P6-SKU144'),
(63, 148, 2, 6, 2, 26.02, '2025-11-04 11:00:00', 'P6-SKU148'),
(64, 13, 2, 7, 3, 17.08, '2025-11-13 11:00:00', 'P7-SKU13'),
(65, 17, 2, 7, 2, 27.85, '2025-11-13 11:00:00', 'P7-SKU17'),
(66, 42, 2, 7, 2, 13.21, '2025-11-13 11:00:00', 'P7-SKU42'),
(67, 46, 2, 7, 2, 23.44, '2025-11-13 11:00:00', 'P7-SKU46'),
(68, 52, 2, 7, 2, 21.12, '2025-11-13 11:00:00', 'P7-SKU52'),
(69, 56, 2, 7, 3, 20.87, '2025-11-13 11:00:00', 'P7-SKU56'),
(70, 72, 2, 7, 2, 30.41, '2025-11-13 11:00:00', 'P7-SKU72'),
(71, 76, 2, 7, 3, 12.22, '2025-11-13 11:00:00', 'P7-SKU76'),
(72, 91, 2, 7, 2, 16.75, '2025-11-13 11:00:00', 'P7-SKU91'),
(73, 95, 2, 7, 3, 25.15, '2025-11-13 11:00:00', 'P7-SKU95'),
(74, 109, 2, 7, 1, 25.50, '2025-11-13 11:00:00', 'P7-SKU109'),
(75, 121, 2, 7, 3, 34.65, '2025-11-13 11:00:00', 'P7-SKU121'),
(76, 125, 2, 7, 3, 27.36, '2025-11-13 11:00:00', 'P7-SKU125'),
(77, 129, 2, 7, 3, 28.85, '2025-11-13 11:00:00', 'P7-SKU129'),
(78, 131, 2, 7, 2, 18.68, '2025-11-13 11:00:00', 'P7-SKU131'),
(79, 135, 2, 7, 1, 28.01, '2025-11-13 11:00:00', 'P7-SKU135'),
(80, 139, 2, 7, 2, 34.28, '2025-11-13 11:00:00', 'P7-SKU139'),
(81, 22, 2, 8, 3, 31.42, '2025-11-19 11:00:00', 'P8-SKU22'),
(82, 26, 2, 8, 1, 20.10, '2025-11-19 11:00:00', 'P8-SKU26'),
(83, 32, 2, 8, 1, 19.50, '2025-11-19 11:00:00', 'P8-SKU32'),
(84, 36, 2, 8, 1, 17.42, '2025-11-19 11:00:00', 'P8-SKU36'),
(85, 63, 2, 8, 1, 31.16, '2025-11-19 11:00:00', 'P8-SKU63'),
(86, 67, 2, 8, 3, 17.19, '2025-11-19 11:00:00', 'P8-SKU67'),
(87, 73, 2, 8, 3, 32.66, '2025-11-19 11:00:00', 'P8-SKU73'),
(88, 77, 2, 8, 1, 30.03, '2025-11-19 11:00:00', 'P8-SKU77'),
(89, 80, 2, 8, 2, 13.07, '2025-11-19 11:00:00', 'P8-SKU80'),
(90, 84, 2, 8, 3, 24.40, '2025-11-19 11:00:00', 'P8-SKU84'),
(91, 88, 2, 8, 2, 24.98, '2025-11-19 11:00:00', 'P8-SKU88'),
(92, 90, 2, 8, 1, 22.17, '2025-11-19 11:00:00', 'P8-SKU90'),
(93, 94, 2, 8, 2, 14.72, '2025-11-19 11:00:00', 'P8-SKU94'),
(94, 98, 2, 8, 1, 30.81, '2025-11-19 11:00:00', 'P8-SKU98'),
(95, 122, 2, 8, 2, 35.66, '2025-11-19 11:00:00', 'P8-SKU122'),
(96, 126, 2, 8, 1, 33.06, '2025-11-19 11:00:00', 'P8-SKU126'),
(97, 132, 2, 8, 2, 25.50, '2025-11-19 11:00:00', 'P8-SKU132'),
(98, 136, 2, 8, 2, 16.43, '2025-11-19 11:00:00', 'P8-SKU136'),
(99, 11, 2, 9, 3, 25.45, '2025-11-24 11:00:00', 'P9-SKU11'),
(100, 15, 2, 9, 3, 29.09, '2025-11-24 11:00:00', 'P9-SKU15'),
(101, 19, 2, 9, 1, 28.56, '2025-11-24 11:00:00', 'P9-SKU19'),
(102, 21, 2, 9, 2, 23.44, '2025-11-24 11:00:00', 'P9-SKU21'),
(103, 40, 2, 9, 2, 19.78, '2025-11-24 11:00:00', 'P9-SKU40'),
(104, 44, 2, 9, 2, 21.98, '2025-11-24 11:00:00', 'P9-SKU44'),
(105, 48, 2, 9, 2, 21.31, '2025-11-24 11:00:00', 'P9-SKU48'),
(106, 50, 2, 9, 3, 19.98, '2025-11-24 11:00:00', 'P9-SKU50'),
(107, 54, 2, 9, 2, 12.31, '2025-11-24 11:00:00', 'P9-SKU54'),
(108, 58, 2, 9, 3, 30.47, '2025-11-24 11:00:00', 'P9-SKU58'),
(109, 102, 2, 9, 1, 35.60, '2025-11-24 11:00:00', 'P9-SKU102'),
(110, 106, 2, 9, 2, 37.33, '2025-11-24 11:00:00', 'P9-SKU106'),
(111, 112, 2, 9, 1, 36.92, '2025-11-24 11:00:00', 'P9-SKU112'),
(112, 116, 2, 9, 1, 22.40, '2025-11-24 11:00:00', 'P9-SKU116'),
(113, 143, 2, 9, 3, 33.48, '2025-11-24 11:00:00', 'P9-SKU143'),
(114, 147, 2, 9, 2, 39.21, '2025-11-24 11:00:00', 'P9-SKU147'),
(115, 11, 3, 10, 2, 26.65, '2025-11-06 12:00:00', 'P10-SKU11'),
(116, 15, 3, 10, 3, 26.14, '2025-11-06 12:00:00', 'P10-SKU15'),
(117, 19, 3, 10, 2, 33.11, '2025-11-06 12:00:00', 'P10-SKU19'),
(118, 25, 3, 10, 1, 26.68, '2025-11-06 12:00:00', 'P10-SKU25'),
(119, 40, 3, 10, 2, 22.25, '2025-11-06 12:00:00', 'P10-SKU40'),
(120, 44, 3, 10, 1, 20.99, '2025-11-06 12:00:00', 'P10-SKU44'),
(121, 48, 3, 10, 2, 16.25, '2025-11-06 12:00:00', 'P10-SKU48'),
(122, 50, 3, 10, 3, 21.94, '2025-11-06 12:00:00', 'P10-SKU50'),
(123, 54, 3, 10, 3, 9.47, '2025-11-06 12:00:00', 'P10-SKU54'),
(124, 58, 3, 10, 2, 27.04, '2025-11-06 12:00:00', 'P10-SKU58'),
(125, 78, 3, 10, 1, 23.04, '2025-11-06 12:00:00', 'P10-SKU78'),
(126, 105, 3, 10, 1, 30.23, '2025-11-06 12:00:00', 'P10-SKU105'),
(127, 121, 3, 10, 3, 34.21, '2025-11-06 12:00:00', 'P10-SKU121'),
(128, 125, 3, 10, 1, 26.08, '2025-11-06 12:00:00', 'P10-SKU125'),
(129, 129, 3, 10, 3, 32.22, '2025-11-06 12:00:00', 'P10-SKU129'),
(130, 131, 3, 10, 3, 24.59, '2025-11-06 12:00:00', 'P10-SKU131'),
(131, 135, 3, 10, 3, 29.98, '2025-11-06 12:00:00', 'P10-SKU135'),
(132, 139, 3, 10, 1, 28.20, '2025-11-06 12:00:00', 'P10-SKU139'),
(133, 22, 3, 11, 1, 26.52, '2025-11-15 12:00:00', 'P11-SKU22'),
(134, 26, 3, 11, 3, 22.43, '2025-11-15 12:00:00', 'P11-SKU26'),
(135, 67, 3, 11, 2, 14.40, '2025-11-15 12:00:00', 'P11-SKU67'),
(136, 73, 3, 11, 3, 28.05, '2025-11-15 12:00:00', 'P11-SKU73'),
(137, 77, 3, 11, 1, 27.89, '2025-11-15 12:00:00', 'P11-SKU77'),
(138, 80, 3, 11, 1, 15.85, '2025-11-15 12:00:00', 'P11-SKU80'),
(139, 90, 3, 11, 2, 27.45, '2025-11-15 12:00:00', 'P11-SKU90'),
(140, 94, 3, 11, 1, 16.73, '2025-11-15 12:00:00', 'P11-SKU94'),
(141, 98, 3, 11, 1, 28.70, '2025-11-15 12:00:00', 'P11-SKU98'),
(142, 111, 3, 11, 1, 29.21, '2025-11-15 12:00:00', 'P11-SKU111'),
(143, 115, 3, 11, 1, 28.21, '2025-11-15 12:00:00', 'P11-SKU115'),
(144, 119, 3, 11, 3, 27.21, '2025-11-15 12:00:00', 'P11-SKU119'),
(145, 140, 3, 11, 3, 29.72, '2025-11-15 12:00:00', 'P11-SKU140'),
(146, 144, 3, 11, 1, 29.36, '2025-11-15 12:00:00', 'P11-SKU144'),
(147, 148, 3, 11, 1, 32.32, '2025-11-15 12:00:00', 'P11-SKU148'),
(148, 150, 3, 11, 1, 19.26, '2025-11-15 12:00:00', 'P11-SKU150'),
(149, 63, 3, 12, 1, 25.75, '2025-11-20 12:00:00', 'P12-SKU63'),
(150, 67, 3, 12, 2, 17.19, '2025-11-20 12:00:00', 'P12-SKU67'),
(151, 80, 3, 12, 2, 16.71, '2025-11-20 12:00:00', 'P12-SKU80'),
(152, 84, 3, 12, 1, 27.94, '2025-11-20 12:00:00', 'P12-SKU84'),
(153, 130, 3, 12, 2, 24.77, '2025-11-20 12:00:00', 'P12-SKU130'),
(154, 134, 3, 12, 2, 20.27, '2025-11-20 12:00:00', 'P12-SKU134'),
(155, 19, 4, 13, 1, 32.70, '2025-11-10 14:00:00', 'P13-SKU19'),
(156, 44, 4, 13, 3, 25.98, '2025-11-10 14:00:00', 'P13-SKU44'),
(157, 50, 4, 13, 2, 19.65, '2025-11-10 14:00:00', 'P13-SKU50'),
(158, 54, 4, 13, 2, 11.84, '2025-11-10 14:00:00', 'P13-SKU54'),
(159, 58, 4, 13, 1, 29.33, '2025-11-10 14:00:00', 'P13-SKU58'),
(160, 104, 4, 13, 2, 19.43, '2025-11-10 14:00:00', 'P13-SKU104'),
(161, 110, 4, 13, 2, 39.06, '2025-11-10 14:00:00', 'P13-SKU110'),
(162, 114, 4, 13, 1, 25.59, '2025-11-10 14:00:00', 'P13-SKU114'),
(163, 118, 4, 13, 2, 31.72, '2025-11-10 14:00:00', 'P13-SKU118'),
(164, 141, 4, 13, 3, 29.61, '2025-11-10 14:00:00', 'P13-SKU141'),
(165, 145, 4, 13, 2, 28.47, '2025-11-10 14:00:00', 'P13-SKU145'),
(166, 149, 4, 13, 2, 41.25, '2025-11-10 14:00:00', 'P13-SKU149'),
(167, 12, 4, 14, 1, 31.37, '2025-11-21 14:00:00', 'P14-SKU12'),
(168, 43, 4, 14, 1, 20.74, '2025-11-21 14:00:00', 'P14-SKU43'),
(169, 47, 4, 14, 3, 28.83, '2025-11-21 14:00:00', 'P14-SKU47'),
(170, 53, 4, 14, 3, 13.01, '2025-11-21 14:00:00', 'P14-SKU53'),
(171, 57, 4, 14, 3, 11.61, '2025-11-21 14:00:00', 'P14-SKU57'),
(172, 123, 4, 14, 2, 33.80, '2025-11-21 14:00:00', 'P14-SKU123'),
(173, 127, 4, 14, 3, 23.58, '2025-11-21 14:00:00', 'P14-SKU127'),
(174, 133, 4, 14, 3, 30.94, '2025-11-21 14:00:00', 'P14-SKU133'),
(175, 137, 4, 14, 1, 36.78, '2025-11-21 14:00:00', 'P14-SKU137'),
(176, 39, 4, 15, 3, 14.20, '2025-11-11 16:00:00', 'P15-SKU39'),
(177, 60, 4, 15, 2, 15.12, '2025-11-11 16:00:00', 'P15-SKU60'),
(178, 64, 4, 15, 2, 13.95, '2025-11-11 16:00:00', 'P15-SKU64'),
(179, 83, 4, 15, 2, 10.94, '2025-11-11 16:00:00', 'P15-SKU83'),
(180, 87, 4, 15, 2, 25.63, '2025-11-11 16:00:00', 'P15-SKU87'),
(181, 103, 4, 15, 1, 29.09, '2025-11-11 16:00:00', 'P15-SKU103'),
(182, 107, 4, 15, 2, 41.18, '2025-11-11 16:00:00', 'P15-SKU107');

-- --------------------------------------------------------

--
-- 表的结构 `invoices`
--

CREATE TABLE `invoices` (
  `invoice_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `invoice_status` enum('draft','issued','partly_paid','paid','voided','credited') NOT NULL DEFAULT 'draft',
  `invoice_number` int(10) UNSIGNED NOT NULL,
  `issue_date` datetime NOT NULL,
  `due_date` datetime NOT NULL,
  `update_date` datetime NOT NULL,
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `invoices`
--

INSERT INTO `invoices` (`invoice_id`, `order_id`, `invoice_status`, `invoice_number`, `issue_date`, `due_date`, `update_date`, `note`) VALUES
(1, 1, 'paid', 20250001, '2025-11-01 10:17:00', '2025-11-08 10:12:00', '2025-11-01 10:18:00', 'auto-generated from order'),
(2, 2, 'paid', 20250002, '2025-11-01 11:30:00', '2025-11-08 11:25:00', '2025-11-01 11:31:00', 'auto-generated from order'),
(3, 3, 'paid', 20250003, '2025-11-02 09:35:00', '2025-11-09 09:30:00', '2025-11-02 09:36:00', 'auto-generated from order'),
(4, 4, 'paid', 20250004, '2025-11-02 15:45:00', '2025-11-09 15:40:00', '2025-11-02 15:46:00', 'auto-generated from order'),
(5, 5, 'paid', 20250005, '2025-11-03 11:25:00', '2025-11-10 11:20:00', '2025-11-03 11:26:00', 'auto-generated from order'),
(6, 6, 'paid', 20250006, '2025-11-03 13:20:00', '2025-11-10 13:15:00', '2025-11-03 13:21:00', 'auto-generated from order'),
(7, 7, 'paid', 20250007, '2025-11-04 19:10:00', '2025-11-11 19:05:00', '2025-11-04 19:11:00', 'auto-generated from order'),
(8, 8, 'paid', 20250008, '2025-11-05 11:00:00', '2025-11-12 10:55:00', '2025-11-05 11:01:00', 'auto-generated from order'),
(9, 9, 'paid', 20250009, '2025-11-05 12:15:00', '2025-11-12 12:10:00', '2025-11-05 12:16:00', 'auto-generated from order'),
(10, 10, 'paid', 20250010, '2025-11-06 15:27:00', '2025-11-13 15:22:00', '2025-11-06 15:28:00', 'auto-generated from order'),
(11, 11, 'paid', 20250011, '2025-11-07 09:23:00', '2025-11-14 09:18:00', '2025-11-07 09:24:00', 'auto-generated from order'),
(12, 12, 'paid', 20250012, '2025-11-07 20:06:00', '2025-11-14 20:01:00', '2025-11-07 20:07:00', 'auto-generated from order'),
(13, 13, 'paid', 20250013, '2025-11-08 11:16:00', '2025-11-15 11:11:00', '2025-11-08 11:17:00', 'auto-generated from order'),
(14, 14, 'paid', 20250014, '2025-11-09 17:50:00', '2025-11-16 17:45:00', '2025-11-09 17:51:00', 'auto-generated from order'),
(15, 15, 'paid', 20250015, '2025-11-10 08:40:00', '2025-11-17 08:35:00', '2025-11-10 08:41:00', 'auto-generated from order'),
(16, 16, 'paid', 20250016, '2025-11-10 14:55:00', '2025-11-17 14:50:00', '2025-11-10 14:56:00', 'auto-generated from order'),
(17, 17, 'draft', 20250017, '2025-11-11 10:10:00', '2025-11-18 10:05:00', '2025-11-11 10:11:00', 'auto-generated from order'),
(18, 18, 'draft', 20250018, '2025-11-11 21:17:00', '2025-11-18 21:12:00', '2025-11-11 21:18:00', 'auto-generated from order'),
(19, 19, 'draft', 20250019, '2025-11-12 09:45:00', '2025-11-19 09:40:00', '2025-11-12 09:46:00', 'auto-generated from order'),
(20, 20, 'draft', 20250020, '2025-11-12 18:35:00', '2025-11-19 18:30:00', '2025-11-12 18:36:00', 'auto-generated from order'),
(21, 21, 'voided', 20250021, '2025-11-13 12:05:00', '2025-11-20 12:00:00', '2025-11-13 12:06:00', 'auto-generated from order'),
(22, 22, 'voided', 20250022, '2025-11-13 16:35:00', '2025-11-20 16:30:00', '2025-11-13 16:36:00', 'auto-generated from order'),
(23, 23, 'paid', 20250023, '2025-11-14 09:15:00', '2025-11-21 09:10:00', '2025-11-14 09:16:00', 'auto-generated from order'),
(24, 24, 'paid', 20250024, '2025-11-14 11:10:00', '2025-11-21 11:05:00', '2025-11-14 11:11:00', 'auto-generated from order'),
(25, 25, 'paid', 20250025, '2025-11-14 15:27:00', '2025-11-21 15:22:00', '2025-11-14 15:28:00', 'auto-generated from order'),
(26, 26, 'paid', 20250026, '2025-11-15 10:35:00', '2025-11-22 10:30:00', '2025-11-15 10:36:00', 'auto-generated from order'),
(27, 27, 'paid', 20250027, '2025-11-15 12:45:00', '2025-11-22 12:40:00', '2025-11-15 12:46:00', 'auto-generated from order'),
(28, 28, 'paid', 20250028, '2025-11-15 16:23:00', '2025-11-22 16:18:00', '2025-11-15 16:24:00', 'auto-generated from order'),
(29, 29, 'paid', 20250029, '2025-11-16 09:17:00', '2025-11-23 09:12:00', '2025-11-16 09:18:00', 'auto-generated from order'),
(30, 30, 'paid', 20250030, '2025-11-16 14:00:00', '2025-11-23 13:55:00', '2025-11-16 14:01:00', 'auto-generated from order'),
(31, 31, 'paid', 20250031, '2025-11-16 19:15:00', '2025-11-23 19:10:00', '2025-11-16 19:16:00', 'auto-generated from order'),
(32, 32, 'paid', 20250032, '2025-11-17 10:07:00', '2025-11-24 10:02:00', '2025-11-17 10:08:00', 'auto-generated from order'),
(33, 33, 'paid', 20250033, '2025-11-17 14:42:00', '2025-11-24 14:37:00', '2025-11-17 14:43:00', 'auto-generated from order'),
(34, 34, 'paid', 20250034, '2025-11-17 20:25:00', '2025-11-24 20:20:00', '2025-11-17 20:26:00', 'auto-generated from order'),
(35, 35, 'draft', 20250035, '2025-11-18 09:05:00', '2025-11-25 09:00:00', '2025-11-18 09:06:00', 'auto-generated from order'),
(36, 36, 'draft', 20250036, '2025-11-18 11:35:00', '2025-11-25 11:30:00', '2025-11-18 11:36:00', 'auto-generated from order'),
(37, 37, 'draft', 20250037, '2025-11-18 15:15:00', '2025-11-25 15:10:00', '2025-11-18 15:16:00', 'auto-generated from order'),
(38, 38, 'draft', 20250038, '2025-11-18 18:50:00', '2025-11-25 18:45:00', '2025-11-18 18:51:00', 'auto-generated from order'),
(39, 39, 'voided', 20250039, '2025-11-19 10:30:00', '2025-11-26 10:25:00', '2025-11-19 10:31:00', 'auto-generated from order'),
(40, 40, 'voided', 20250040, '2025-11-19 16:45:00', '2025-11-26 16:40:00', '2025-11-19 16:46:00', 'auto-generated from order'),
(64, 41, 'paid', 20250041, '2025-12-18 10:05:00', '2025-12-25 10:05:00', '2025-12-18 10:10:00', 'Auto-generated for finished order'),
(65, 42, 'paid', 20250042, '2025-12-19 14:35:00', '2025-12-26 14:35:00', '2025-12-19 14:40:00', 'Auto-generated for finished order'),
(66, 43, 'paid', 20250043, '2025-12-20 09:20:00', '2025-12-27 09:20:00', '2025-12-20 09:25:00', 'Auto-generated for finished order');

-- --------------------------------------------------------

--
-- 表的结构 `job_titles`
--

CREATE TABLE `job_titles` (
  `job_title_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL DEFAULT 'staff',
  `base_salary` decimal(9,2) UNSIGNED NOT NULL DEFAULT 1500.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `job_titles`
--

INSERT INTO `job_titles` (`job_title_id`, `name`, `base_salary`) VALUES
(1, 'Staff', 1500.00),
(2, 'Finance', 1800.00),
(3, 'General Manager', 1900.00);

-- --------------------------------------------------------

--
-- 表的结构 `members`
--

CREATE TABLE `members` (
  `member_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `member_tier_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `point` int(10) UNSIGNED NOT NULL,
  `address` varchar(50) DEFAULT NULL,
  `birthday` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `members`
--

INSERT INTO `members` (`member_id`, `user_id`, `member_tier_id`, `first_name`, `last_name`, `email`, `point`, `address`, `birthday`) VALUES
(1, 1, 1, 'Ethan', 'Smith', '123456@bookstore.com', 120, 'Blk 10, Street 1', '1996-05-12'),
(2, 2, 1, 'Olivia', 'Johnson', '3100000002@bookstore.com', 80, '', NULL),
(3, 3, 1, 'Noah', 'Brown', '3100000003@bookstore.com', 150, NULL, '1993-11-03'),
(4, 4, 1, 'Ava', 'Taylor', '3100000004@bookstore.com', 60, 'Blk 13, Street 4', NULL),
(5, 5, 1, 'Liam', 'Anderson', '3100000005@bookstore.com', 200, NULL, '1990-02-20'),
(6, 6, 1, 'Mia', 'Thomas', '3100000006@bookstore.com', 45, NULL, NULL),
(7, 7, 1, 'Lucas', 'Jackson', '3100000007@bookstore.com', 95, 'Blk 16, Street 7', NULL),
(8, 8, 1, 'Sophia', 'White', '3100000008@bookstore.com', 30, 'Blk 17, Street 8', NULL),
(9, 9, 1, 'Mason', 'Harris', '3100000009@bookstore.com', 110, NULL, '1995-09-08'),
(10, 10, 1, 'Isabella', 'Martin', '3100000010@bookstore.com', 75, NULL, NULL),
(11, 11, 1, 'Logan', 'Thompson', '3100000011@bookstore.com', 160, 'Blk 20, Street 11', '1992-12-25'),
(12, 12, 1, 'Amelia', 'Garcia', '3100000012@bookstore.com', 55, NULL, NULL),
(13, 13, 1, 'James', 'Martinez', '3100000013@bookstore.com', 140, 'Blk 22, Street 13', '1997-03-14'),
(14, 14, 1, 'Harper', 'Robinson', '3100000014@bookstore.com', 20, 'Blk 23, Street 14', NULL),
(15, 15, 1, 'Benjamin', 'Clark', '3100000015@bookstore.com', 85, NULL, '1991-08-30'),
(16, 16, 1, 'Evelyn', 'Rodriguez', '3100000016@bookstore.com', 90, 'Blk 25, Street 16', NULL),
(17, 17, 1, 'Henry', 'Lewis', '3100000017@bookstore.com', 130, 'Blk 26, Street 17', '1994-10-10'),
(18, 18, 1, 'Abigail', 'Lee', '3100000018@bookstore.com', 40, NULL, NULL),
(19, 19, 1, 'Alexander', 'Walker', '3100000019@bookstore.com', 105, 'Blk 28, Street 19', '1999-01-01'),
(20, 20, 1, 'Emily', 'Hall', '3100000020@bookstore.com', 70, NULL, NULL),
(21, 21, 1, 'Daniel', 'Allen', '3100000021@bookstore.com', 115, NULL, NULL),
(22, 22, 1, 'Ella', 'Young', '3100000022@bookstore.com', 65, 'Blk 31, Street 22', NULL),
(23, 23, 1, 'Michael', 'Hernandez', '3100000023@bookstore.com', 125, 'Blk 32, Street 23', '1996-04-22'),
(24, 24, 1, 'Avery', 'King', '3100000024@bookstore.com', 35, NULL, NULL),
(25, 25, 1, 'Jackson', 'Wright', '3100000025@bookstore.com', 155, NULL, '1993-09-17'),
(26, 26, 1, 'Scarlett', 'Lopez', '3100000026@bookstore.com', 50, 'Blk 35, Street 26', NULL),
(27, 27, 1, 'Sebastian', 'Hill', '3100000027@bookstore.com', 100, NULL, '1992-02-02'),
(28, 28, 1, 'Grace', 'Scott', '3100000028@bookstore.com', 25, 'Blk 37, Street 28', NULL),
(29, 29, 1, 'Jack', 'Green', '3100000029@bookstore.com', 135, 'Blk 38, Street 29', '1998-12-12'),
(30, 30, 1, 'Chloe', 'Adams', '3100000030@bookstore.com', 85, NULL, NULL),
(31, 31, 1, 'Owen', 'Baker', '3100000031@bookstore.com', 95, 'Blk 40, Street 31', '1995-07-07'),
(32, 32, 1, 'Lily', 'Gonzalez', '3100000032@bookstore.com', 60, 'Blk 41, Street 32', NULL),
(33, 33, 1, 'Matthew', 'Nelson', '3100000033@bookstore.com', 150, NULL, '1991-03-03'),
(34, 34, 1, 'Hannah', 'Carter', '3100000034@bookstore.com', 45, 'Blk 43, Street 34', NULL),
(35, 35, 1, 'Samuel', 'Mitchell', '3100000035@bookstore.com', 110, NULL, NULL),
(36, 36, 1, 'Zoey', 'Perez', '3100000036@bookstore.com', 70, NULL, NULL),
(37, 37, 1, 'Joseph', 'Roberts', '3100000037@bookstore.com', 90, 'Blk 46, Street 37', '1994-04-04'),
(38, 38, 1, 'Nora', 'Turner', '3100000038@bookstore.com', 55, 'Blk 47, Street 38', NULL),
(39, 39, 1, 'David', 'Phillips', '3100000039@bookstore.com', 140, NULL, '1996-06-16'),
(40, 40, 1, 'Riley', 'Campbell', '3100000040@bookstore.com', 65, NULL, NULL),
(41, 41, 2, 'Wyatt', 'Parker', '3100000041@bookstore.com', 260, 'Blk 50, Street 41', '1992-05-05'),
(42, 42, 2, 'Victoria', 'Evans', '3100000042@bookstore.com', 220, NULL, NULL),
(43, 43, 2, 'John', 'Edwards', '3100000043@bookstore.com', 300, 'Blk 52, Street 43', '1990-10-20'),
(44, 44, 2, 'Aria', 'Collins', '3100000044@bookstore.com', 240, 'Blk 53, Street 44', NULL),
(45, 45, 2, 'Luke', 'Stewart', '3100000045@bookstore.com', 280, NULL, '1997-02-14'),
(46, 46, 2, 'Penelope', 'Sanchez', '3100000046@bookstore.com', 210, 'Blk 55, Street 46', NULL),
(47, 47, 2, 'Gabriel', 'Morris', '3100000047@bookstore.com', 330, 'Blk 56, Street 47', '1993-03-13'),
(48, 48, 2, 'Layla', 'Rogers', '3100000048@bookstore.com', 205, NULL, NULL),
(49, 49, 2, 'Anthony', 'Reed', '3100000049@bookstore.com', 290, 'Blk 58, Street 49', NULL),
(50, 50, 2, 'Lillian', 'Cook', '3100000050@bookstore.com', 235, NULL, NULL),
(51, 51, 2, 'Isaac', 'Morgan', '3100000051@bookstore.com', 310, NULL, '1991-01-21'),
(52, 52, 2, 'Addison', 'Bell', '3100000052@bookstore.com', 225, 'Blk 61, Street 52', NULL),
(53, 53, 2, 'Dylan', 'Murphy', '3100000053@bookstore.com', 275, 'Blk 62, Street 53', '1998-08-08'),
(54, 54, 2, 'Aubrey', 'Bailey', '3100000054@bookstore.com', 215, NULL, NULL),
(55, 55, 2, 'Nathan', 'Rivera', '3100000055@bookstore.com', 305, NULL, '1994-12-01'),
(56, 56, 2, 'Savannah', 'Cooper', '3100000056@bookstore.com', 245, 'Blk 65, Street 56', NULL),
(57, 57, 2, 'Andrew', 'Richardson', '3100000057@bookstore.com', 295, NULL, '1996-09-19'),
(58, 58, 2, 'Brooklyn', 'Cox', '3100000058@bookstore.com', 230, 'Blk 67, Street 58', NULL),
(59, 59, 2, 'Joshua', 'Howard', '3100000059@bookstore.com', 320, 'Blk 68, Street 59', '1992-06-30'),
(60, 60, 2, 'Bella', 'Ward', '3100000060@bookstore.com', 240, NULL, NULL),
(61, 61, 3, 'Christopher', 'Peterson', '3100000061@bookstore.com', 520, 'Blk 70, Street 61', '1989-07-07'),
(62, 62, 3, 'Claire', 'Gray', '3100000062@bookstore.com', 480, 'Blk 71, Street 62', NULL),
(63, 63, 3, 'Thomas', 'Ramirez', '3100000063@bookstore.com', 600, NULL, NULL),
(64, 64, 3, 'Stella', 'James', '3100000064@bookstore.com', 450, 'Blk 73, Street 64', NULL),
(65, 65, 3, 'Caleb', 'Watson', '3100000065@bookstore.com', 570, NULL, '1993-12-12'),
(66, 66, 3, 'Lucy', 'Brooks', '3100000066@bookstore.com', 490, NULL, NULL),
(67, 67, 3, 'Ryan', 'Kelly', '3100000067@bookstore.com', 620, 'Blk 76, Street 67', '1995-05-15'),
(68, 68, 3, 'Madison', 'Sanders', '3100000068@bookstore.com', 460, 'Blk 77, Street 68', NULL),
(69, 69, 3, 'Adam', 'Price', '3100000069@bookstore.com', 585, NULL, '1991-09-09'),
(70, 70, 3, 'Leah', 'Bennett', '3100000070@bookstore.com', 510, NULL, NULL),
(71, 71, 3, 'Leo', 'Wood', '3100000071@bookstore.com', 640, 'Blk 80, Street 71', '1992-02-22'),
(72, 72, 3, 'Anna', 'Barnes', '3100000072@bookstore.com', 500, NULL, NULL),
(73, 73, 4, 'Oscar', 'Ross', '3100000073@bookstore.com', 980, 'Blk 82, Street 73', '1988-03-03'),
(74, 74, 4, 'Sienna', 'Henderson', '3100000074@bookstore.com', 1100, 'Blk 83, Street 74', NULL),
(75, 75, 4, 'Julian', 'Coleman', '3100000075@bookstore.com', 1250, NULL, '1990-10-10'),
(76, 76, 4, 'Eva', 'Jenkins', '3100000076@bookstore.com', 900, 'Blk 85, Street 76', NULL),
(77, 77, 4, 'Miles', 'Perry', '3100000077@bookstore.com', 1400, 'Blk 86, Street 77', NULL);

--
-- 触发器 `members`
--
DELIMITER $$
CREATE TRIGGER `trg_update_member_tier` BEFORE UPDATE ON `members` FOR EACH ROW BEGIN
    DECLARE v_total_spent DECIMAL(10,2) DEFAULT 0;
    DECLARE v_new_tier_id INT;

    IF NEW.point != OLD.point THEN
        SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
        INTO v_total_spent
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN skus s ON oi.sku_id = s.sku_id
        WHERE o.member_id = NEW.member_id
        AND o.order_status = 'paid';

        SELECT member_tier_id
        INTO v_new_tier_id
        FROM member_tiers
        WHERE min_lifetime_spend <= v_total_spent
        ORDER BY min_lifetime_spend DESC
        LIMIT 1;

        IF v_new_tier_id IS NOT NULL AND v_new_tier_id != NEW.member_tier_id THEN
            SET NEW.member_tier_id = v_new_tier_id;
        END IF;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- 表的结构 `member_tiers`
--

CREATE TABLE `member_tiers` (
  `member_tier_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL DEFAULT 'standard',
  `discount_rate` decimal(9,2) UNSIGNED NOT NULL DEFAULT 1.00,
  `earn_point_rate` decimal(9,2) UNSIGNED NOT NULL DEFAULT 10.00,
  `min_lifetime_spend` decimal(9,2) UNSIGNED NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `member_tiers`
--

INSERT INTO `member_tiers` (`member_tier_id`, `name`, `discount_rate`, `earn_point_rate`, `min_lifetime_spend`) VALUES
(1, 'standard', 1.00, 10.00, 0.00),
(2, 'bronze', 0.95, 12.00, 500.00),
(3, 'sliver', 0.90, 15.00, 1000.00),
(4, 'gold', 0.85, 20.00, 2000.00);

-- --------------------------------------------------------

--
-- 表的结构 `orders`
--

CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `order_status` enum('created','paid','cancelled','refunded','finished') NOT NULL DEFAULT 'created',
  `order_date` datetime NOT NULL,
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `orders`
--

INSERT INTO `orders` (`order_id`, `store_id`, `member_id`, `order_status`, `order_date`, `note`) VALUES
(1, 1, 46, 'paid', '2025-11-01 10:12:00', NULL),
(2, 1, 36, 'paid', '2025-11-01 11:25:00', NULL),
(3, 2, 40, 'paid', '2025-11-02 09:30:00', NULL),
(4, 2, 16, 'paid', '2025-11-02 15:40:00', NULL),
(5, 3, 34, 'paid', '2025-11-03 11:20:00', NULL),
(6, 3, 47, 'paid', '2025-11-03 13:15:00', NULL),
(7, 4, 55, 'paid', '2025-11-04 19:05:00', NULL),
(8, 4, 55, 'paid', '2025-11-05 10:55:00', NULL),
(9, 1, 31, 'paid', '2025-11-05 12:10:00', NULL),
(10, 2, 69, 'paid', '2025-11-06 15:22:00', NULL),
(11, 3, 21, 'paid', '2025-11-07 09:18:00', NULL),
(12, 4, 52, 'paid', '2025-11-07 20:01:00', NULL),
(13, 1, 44, 'paid', '2025-11-08 11:11:00', NULL),
(14, 2, 60, 'paid', '2025-11-09 17:45:00', NULL),
(15, 3, 17, 'paid', '2025-11-10 08:35:00', NULL),
(16, 4, 56, 'paid', '2025-11-10 14:50:00', NULL),
(17, 1, 76, 'created', '2025-11-11 10:05:00', 'waiting payment'),
(18, 2, 58, 'created', '2025-11-11 21:12:00', 'waiting payment'),
(19, 3, 61, 'created', '2025-11-12 09:40:00', 'waiting payment'),
(20, 4, 55, 'created', '2025-11-12 18:30:00', 'waiting payment'),
(21, 2, 14, 'cancelled', '2025-11-13 12:00:00', 'user cancelled'),
(22, 3, 56, 'cancelled', '2025-11-13 16:30:00', 'timeout cancelled'),
(23, 1, 8, 'paid', '2025-11-14 09:10:00', NULL),
(24, 2, 26, 'paid', '2025-11-14 11:05:00', NULL),
(25, 3, 29, 'paid', '2025-11-14 15:22:00', NULL),
(26, 4, 67, 'paid', '2025-11-15 10:30:00', NULL),
(27, 1, 14, 'paid', '2025-11-15 12:40:00', NULL),
(28, 2, 23, 'paid', '2025-11-15 16:18:00', NULL),
(29, 3, 72, 'paid', '2025-11-16 09:12:00', NULL),
(30, 4, 62, 'paid', '2025-11-16 13:55:00', NULL),
(31, 1, 14, 'paid', '2025-11-16 19:10:00', NULL),
(32, 2, 40, 'paid', '2025-11-17 10:02:00', NULL),
(33, 3, 4, 'paid', '2025-11-17 14:37:00', NULL),
(34, 4, 52, 'paid', '2025-11-17 20:20:00', NULL),
(35, 1, 17, 'created', '2025-11-18 09:00:00', 'waiting payment'),
(36, 2, 4, 'created', '2025-11-18 11:30:00', 'waiting payment'),
(37, 3, 47, 'created', '2025-11-18 15:10:00', 'waiting payment'),
(38, 4, 70, 'created', '2025-11-18 18:45:00', 'waiting payment'),
(39, 2, 54, 'cancelled', '2025-11-19 10:25:00', 'user cancelled'),
(40, 3, 58, 'cancelled', '2025-11-19 16:40:00', 'timeout cancelled'),
(41, 1, 5, 'finished', '2025-12-18 10:00:00', 'VIP customer, transaction completed'),
(42, 2, 12, 'finished', '2025-12-19 14:30:00', 'Online pickup, completed'),
(43, 1, 20, 'finished', '2025-12-20 09:15:00', 'Year-end sale purchase, finished');

--
-- 触发器 `orders`
--
DELIMITER $$
CREATE TRIGGER `trg_order_payment_add_points` AFTER UPDATE ON `orders` FOR EACH ROW BEGIN
    DECLARE v_total_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_points_to_add INT DEFAULT 0;

    IF NEW.order_status = 'paid' AND OLD.order_status != 'paid' THEN
        SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
        INTO v_total_amount
        FROM order_items oi
        JOIN skus s ON oi.sku_id = s.sku_id
        WHERE oi.order_id = NEW.order_id;

        SET v_points_to_add = FLOOR(v_total_amount);

        UPDATE members
        SET point = point + v_points_to_add
        WHERE member_id = NEW.member_id;

        INSERT INTO point_ledgers (member_id, order_id, points_change, points_delta, change_date, reason)
        VALUES (
            NEW.member_id,
            NEW.order_id,
            v_points_to_add,
            v_points_to_add,
            CURRENT_TIMESTAMP,
            CONCAT('Order #', NEW.order_id, ' payment - points added: ', v_points_to_add)
        );
    END IF;
END
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `trg_order_payment_deduct_inventory` AFTER UPDATE ON `orders` FOR EACH ROW BEGIN
    DECLARE v_sku_id INT;
    DECLARE v_order_quantity INT;
    DECLARE v_remaining INT;
    DECLARE v_batch_id INT;
    DECLARE v_batch_quantity INT;
    DECLARE v_deduct_quantity INT;
    DECLARE done INT DEFAULT FALSE;

    DECLARE order_items_cursor CURSOR FOR
        SELECT sku_id, quantity
        FROM order_items
        WHERE order_id = NEW.order_id;

    DECLARE batch_cursor CURSOR FOR
        SELECT batch_id, quantity
        FROM inventory_batches
        WHERE store_id = NEW.store_id AND sku_id = v_sku_id AND quantity > 0
        ORDER BY received_date ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    IF NEW.order_status = 'paid' AND OLD.order_status != 'paid' THEN
        OPEN order_items_cursor;

        item_loop: LOOP
            SET done = FALSE;
            FETCH order_items_cursor INTO v_sku_id, v_order_quantity;

            IF done THEN
                LEAVE item_loop;
            END IF;

            SET v_remaining = v_order_quantity;

            OPEN batch_cursor;

            batch_loop: LOOP
                SET done = FALSE;
                FETCH batch_cursor INTO v_batch_id, v_batch_quantity;

                IF done OR v_remaining <= 0 THEN
                    LEAVE batch_loop;
                END IF;

                IF v_batch_quantity >= v_remaining THEN
                    SET v_deduct_quantity = v_remaining;
                ELSE
                    SET v_deduct_quantity = v_batch_quantity;
                END IF;

                UPDATE inventory_batches
                SET quantity = quantity - v_deduct_quantity
                WHERE batch_id = v_batch_id;

                SET v_remaining = v_remaining - v_deduct_quantity;
            END LOOP;

            CLOSE batch_cursor;
        END LOOP;

        CLOSE order_items_cursor;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- 表的结构 `order_items`
--

CREATE TABLE `order_items` (
  `sku_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `order_items`
--

INSERT INTO `order_items` (`sku_id`, `order_id`, `quantity`) VALUES
(1, 1, 1),
(1, 41, 1),
(2, 8, 1),
(3, 1, 1),
(3, 43, 1),
(4, 13, 1),
(5, 2, 1),
(5, 10, 2),
(5, 41, 2),
(6, 5, 1),
(6, 26, 1),
(7, 5, 1),
(7, 7, 1),
(7, 17, 1),
(7, 36, 1),
(7, 43, 1),
(8, 2, 1),
(8, 24, 1),
(9, 3, 2),
(9, 5, 3),
(9, 20, 2),
(9, 39, 1),
(10, 15, 1),
(10, 42, 1),
(11, 9, 1),
(11, 25, 2),
(12, 6, 2),
(12, 29, 1),
(13, 3, 2),
(13, 18, 2),
(14, 9, 1),
(14, 21, 1),
(14, 35, 2),
(15, 1, 2),
(15, 30, 1),
(15, 43, 1),
(16, 12, 2),
(16, 34, 1),
(17, 4, 1),
(17, 27, 2),
(18, 16, 2),
(18, 31, 1),
(19, 8, 2),
(19, 9, 2),
(19, 24, 1),
(20, 11, 1),
(20, 40, 2),
(21, 10, 1),
(21, 19, 1),
(21, 33, 1),
(22, 2, 1),
(22, 10, 1),
(23, 14, 1),
(24, 22, 1),
(25, 8, 1),
(25, 38, 2),
(26, 17, 1),
(27, 1, 2),
(27, 28, 1),
(28, 4, 1),
(29, 32, 2),
(30, 23, 2),
(31, 10, 1),
(32, 37, 1),
(33, 5, 2),
(33, 6, 2),
(34, 14, 2),
(35, 11, 2),
(35, 29, 2),
(36, 20, 1),
(37, 39, 1),
(39, 12, 1),
(40, 12, 1),
(40, 33, 1),
(41, 6, 1),
(42, 23, 1),
(44, 4, 1),
(44, 15, 1),
(45, 2, 2),
(46, 27, 1),
(47, 5, 1),
(47, 40, 1),
(48, 18, 1),
(49, 30, 1),
(51, 7, 1),
(52, 10, 1),
(53, 36, 2),
(54, 25, 1),
(55, 13, 1),
(57, 20, 1),
(58, 32, 1),
(59, 15, 2),
(60, 8, 1),
(60, 13, 1),
(61, 13, 2),
(61, 38, 1),
(63, 28, 1),
(65, 21, 2),
(66, 35, 1),
(68, 10, 2),
(69, 25, 1),
(72, 7, 2),
(72, 13, 2),
(73, 14, 1),
(73, 30, 1),
(77, 23, 1),
(79, 40, 1),
(80, 15, 2),
(81, 15, 1),
(84, 33, 2),
(88, 2, 1),
(88, 25, 2),
(90, 18, 1),
(91, 28, 2),
(92, 35, 1),
(96, 30, 2),
(99, 16, 1),
(100, 16, 1),
(101, 38, 1),
(110, 17, 1),
(111, 18, 2),
(112, 19, 1),
(113, 19, 1),
(114, 20, 2),
(120, 4, 1),
(120, 40, 2),
(130, 21, 1),
(140, 22, 1),
(150, 22, 1),
(151, 8, 1);

-- --------------------------------------------------------

--
-- 表的结构 `payments`
--

CREATE TABLE `payments` (
  `payment_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `create_date` datetime NOT NULL,
  `update_date` datetime NOT NULL,
  `amount` decimal(9,2) UNSIGNED NOT NULL,
  `payment_method` enum('Credit Card','Third-Party Payment','Cash') NOT NULL DEFAULT 'Cash',
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `payments`
--

INSERT INTO `payments` (`payment_id`, `member_id`, `create_date`, `update_date`, `amount`, `payment_method`, `note`) VALUES
(1, 36, '2025-11-01 10:27:00', '2025-11-01 10:27:00', 0.00, 'Cash', 'batch pay 1'),
(2, 16, '2025-11-02 09:45:00', '2025-11-02 09:45:00', 0.00, 'Cash', 'batch pay 2'),
(3, 34, '2025-11-03 11:35:00', '2025-11-03 11:35:00', 0.00, 'Cash', 'batch pay 3'),
(4, 55, '2025-11-04 19:20:00', '2025-11-04 19:20:00', 0.00, 'Cash', 'batch pay 4'),
(5, 31, '2025-11-05 12:25:00', '2025-11-05 12:25:00', 0.00, 'Cash', 'batch pay 5'),
(6, 21, '2025-11-07 09:33:00', '2025-11-07 09:33:00', 0.00, 'Cash', 'batch pay 6'),
(7, 44, '2025-11-08 11:26:00', '2025-11-08 11:26:00', 0.00, 'Credit Card', 'batch pay 7'),
(8, 17, '2025-11-10 08:50:00', '2025-11-10 08:50:00', 0.00, 'Credit Card', 'batch pay 8'),
(9, 8, '2025-11-14 09:25:00', '2025-11-14 09:25:00', 0.00, 'Third-Party Payment', 'batch pay 9'),
(10, 29, '2025-11-14 15:37:00', '2025-11-14 15:37:00', 0.00, 'Cash', 'batch pay 10'),
(11, 14, '2025-11-15 12:55:00', '2025-11-15 12:55:00', 0.00, 'Cash', 'batch pay 11'),
(12, 62, '2025-11-16 09:27:00', '2025-11-16 09:27:00', 0.00, 'Cash', 'batch pay 12'),
(13, 14, '2025-11-16 19:25:00', '2025-11-16 19:25:00', 0.00, 'Cash', 'batch pay 13'),
(14, 4, '2025-11-17 14:52:00', '2025-11-17 14:52:00', 0.00, 'Cash', 'batch pay 14');

-- --------------------------------------------------------

--
-- 表的结构 `payment_allocations`
--

CREATE TABLE `payment_allocations` (
  `invoice_id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `create_date` datetime NOT NULL,
  `allocated_amount` decimal(9,2) UNSIGNED NOT NULL,
  `note` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `payment_allocations`
--

INSERT INTO `payment_allocations` (`invoice_id`, `payment_id`, `create_date`, `allocated_amount`, `note`) VALUES
(1, 1, '2025-11-01 10:29:00', 0.00, 'full allocation'),
(2, 1, '2025-11-01 11:42:00', 0.00, 'full allocation'),
(3, 2, '2025-11-02 09:47:00', 0.00, 'full allocation'),
(4, 2, '2025-11-02 15:57:00', 0.00, 'full allocation'),
(5, 3, '2025-11-03 11:37:00', 0.00, 'full allocation'),
(6, 3, '2025-11-03 13:32:00', 0.00, 'full allocation'),
(7, 4, '2025-11-04 19:22:00', 0.00, 'full allocation'),
(8, 4, '2025-11-05 11:12:00', 0.00, 'full allocation'),
(9, 5, '2025-11-05 12:27:00', 0.00, 'full allocation'),
(10, 5, '2025-11-06 15:39:00', 0.00, 'full allocation'),
(11, 6, '2025-11-07 09:35:00', 0.00, 'full allocation'),
(12, 6, '2025-11-07 20:18:00', 0.00, 'full allocation'),
(13, 7, '2025-11-08 11:28:00', 0.00, 'full allocation'),
(14, 7, '2025-11-09 18:02:00', 0.00, 'full allocation'),
(15, 8, '2025-11-10 08:52:00', 0.00, 'full allocation'),
(16, 8, '2025-11-10 15:07:00', 0.00, 'full allocation'),
(23, 9, '2025-11-14 09:27:00', 0.00, 'full allocation'),
(24, 9, '2025-11-14 11:22:00', 0.00, 'full allocation'),
(25, 10, '2025-11-14 15:39:00', 0.00, 'full allocation'),
(26, 10, '2025-11-15 10:47:00', 0.00, 'full allocation'),
(27, 11, '2025-11-15 12:57:00', 0.00, 'full allocation'),
(28, 11, '2025-11-15 16:35:00', 0.00, 'full allocation'),
(29, 12, '2025-11-16 09:29:00', 0.00, 'full allocation'),
(30, 12, '2025-11-16 14:12:00', 0.00, 'full allocation'),
(31, 13, '2025-11-16 19:27:00', 0.00, 'full allocation'),
(32, 13, '2025-11-17 10:19:00', 0.00, 'full allocation'),
(33, 14, '2025-11-17 14:54:00', 0.00, 'full allocation'),
(34, 14, '2025-11-17 20:37:00', 0.00, 'full allocation');

--
-- 触发器 `payment_allocations`
--
DELIMITER $$
CREATE TRIGGER `trg_finance_payment_allocation_update_invoice` AFTER INSERT ON `payment_allocations` FOR EACH ROW BEGIN
    DECLARE v_invoice_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_paid_amount DECIMAL(10,2) DEFAULT 0;

    SELECT invoice_amount INTO v_invoice_amount
    FROM vm_invoice_settlement
    WHERE invoice_id = NEW.invoice_id;

    SELECT IFNULL(SUM(allocated_amount), 0) INTO v_paid_amount
    FROM payment_allocations
    WHERE invoice_id = NEW.invoice_id;

    IF v_paid_amount >= v_invoice_amount THEN
        UPDATE invoices
        SET invoice_status = 'paid',
            update_date = NOW()
        WHERE invoice_id = NEW.invoice_id;
    ELSE
        UPDATE invoices
        SET invoice_status = 'partly_paid',
            update_date = NOW()
        WHERE invoice_id = NEW.invoice_id;
    END IF;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- 表的结构 `point_ledgers`
--

CREATE TABLE `point_ledgers` (
  `point_ledger_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `points_change` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `change_date` datetime NOT NULL DEFAULT current_timestamp(),
  `reason` varchar(255) DEFAULT NULL,
  `points_delta` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------

--
-- 表的结构 `purchases`
--

CREATE TABLE `purchases` (
  `purchase_id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `purchase_date` datetime NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `purchases`
--

INSERT INTO `purchases` (`purchase_id`, `store_id`, `supplier_id`, `purchase_date`, `note`, `status`) VALUES
(1, 1, 1, '2025-11-01 10:00:00', 'Monthly restock', 'pending'),
(2, 1, 2, '2025-11-08 10:00:00', 'Top sellers replenishment', 'pending'),
(3, 1, 3, '2025-11-15 10:00:00', NULL, 'pending'),
(4, 1, 4, '2025-11-22 10:00:00', 'Holiday preparation', 'pending'),
(5, 1, 5, '2025-11-29 10:00:00', NULL, 'pending'),
(6, 2, 6, '2025-11-03 11:00:00', 'Weekly restock', 'pending'),
(7, 2, 7, '2025-11-10 11:00:00', NULL, 'pending'),
(8, 2, 8, '2025-11-17 11:00:00', 'New arrivals', 'pending'),
(9, 2, 9, '2025-11-24 11:00:00', NULL, 'pending'),
(10, 3, 10, '2025-11-05 12:00:00', 'Inventory balancing', 'pending'),
(11, 3, 11, '2025-11-12 12:00:00', NULL, 'pending'),
(12, 3, 12, '2025-11-19 12:00:00', 'Classic series restock', 'pending'),
(13, 4, 13, '2025-11-07 14:00:00', NULL, 'pending'),
(14, 4, 14, '2025-11-21 14:00:00', 'Local demand', 'pending'),
(15, 4, 15, '2025-11-09 16:00:00', 'New store initial stock', 'pending'),
(16, 1, 6, '2025-12-01 10:00:00', 'Supplement restock', 'pending'),
(17, 1, 7, '2025-12-05 10:00:00', NULL, 'pending'),
(18, 1, 8, '2025-12-10 10:00:00', 'Holiday refill', 'pending'),
(19, 2, 9, '2025-12-02 11:00:00', NULL, 'pending'),
(20, 2, 10, '2025-12-07 11:00:00', 'Popular titles', 'pending'),
(21, 2, 11, '2025-12-12 11:00:00', NULL, 'pending'),
(22, 3, 12, '2025-12-03 12:00:00', 'Classics restock', 'pending'),
(23, 3, 13, '2025-12-08 12:00:00', NULL, 'pending'),
(24, 3, 14, '2025-12-13 12:00:00', NULL, 'pending'),
(25, 4, 15, '2025-12-04 14:00:00', NULL, 'pending'),
(26, 4, 16, '2025-12-09 14:00:00', 'Local demand', 'pending'),
(27, 4, 17, '2025-12-14 14:00:00', NULL, 'pending'),
(28, 5, 18, '2025-12-05 16:00:00', 'New arrivals', 'pending'),
(29, 5, 1, '2025-12-10 16:00:00', NULL, 'pending'),
(30, 5, 2, '2025-12-15 16:00:00', 'Year end stock', 'pending');

-- --------------------------------------------------------

--
-- 表的结构 `purchase_items`
--

CREATE TABLE `purchase_items` (
  `purchase_id` int(11) NOT NULL,
  `sku_id` int(11) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `purchase_items`
--

INSERT INTO `purchase_items` (`purchase_id`, `sku_id`, `quantity`) VALUES
(1, 23, 2),
(1, 27, 2),
(1, 33, 3),
(1, 37, 1),
(1, 72, 3),
(1, 76, 3),
(1, 89, 2),
(1, 91, 3),
(1, 95, 1),
(1, 99, 3),
(1, 122, 2),
(1, 126, 2),
(1, 132, 3),
(1, 136, 3),
(2, 33, 3),
(2, 37, 1),
(2, 62, 3),
(2, 66, 2),
(2, 81, 2),
(2, 85, 3),
(2, 89, 1),
(2, 103, 1),
(3, 10, 1),
(3, 14, 1),
(3, 41, 3),
(3, 49, 2),
(3, 51, 3),
(3, 55, 2),
(3, 59, 1),
(3, 123, 2),
(3, 127, 3),
(3, 137, 3),
(4, 17, 3),
(4, 52, 3),
(4, 56, 1),
(4, 108, 3),
(4, 110, 1),
(4, 114, 2),
(4, 118, 2),
(4, 141, 2),
(4, 145, 2),
(4, 149, 3),
(4, 151, 1),
(5, 30, 1),
(5, 34, 1),
(5, 69, 2),
(5, 82, 2),
(5, 138, 1),
(6, 20, 3),
(6, 24, 3),
(6, 28, 1),
(6, 71, 2),
(6, 75, 1),
(6, 79, 1),
(6, 92, 1),
(6, 96, 2),
(6, 101, 3),
(6, 111, 2),
(6, 115, 2),
(6, 119, 2),
(6, 140, 2),
(6, 144, 3),
(6, 148, 2),
(7, 13, 3),
(7, 17, 2),
(7, 42, 2),
(7, 46, 2),
(7, 52, 2),
(7, 56, 3),
(7, 72, 2),
(7, 76, 3),
(7, 91, 2),
(7, 95, 3),
(7, 109, 1),
(7, 121, 3),
(7, 125, 3),
(7, 129, 3),
(7, 131, 2),
(7, 135, 1),
(7, 139, 2),
(8, 22, 3),
(8, 26, 1),
(8, 32, 1),
(8, 36, 1),
(8, 63, 1),
(8, 67, 3),
(8, 73, 3),
(8, 77, 1),
(8, 80, 2),
(8, 84, 3),
(8, 88, 2),
(8, 90, 1),
(8, 94, 2),
(8, 98, 1),
(8, 122, 2),
(8, 126, 1),
(8, 132, 2),
(8, 136, 2),
(9, 11, 3),
(9, 15, 3),
(9, 19, 1),
(9, 21, 2),
(9, 40, 2),
(9, 44, 2),
(9, 48, 2),
(9, 50, 3),
(9, 54, 2),
(9, 58, 3),
(9, 102, 1),
(9, 106, 2),
(9, 112, 1),
(9, 116, 1),
(9, 143, 3),
(9, 147, 2),
(10, 11, 2),
(10, 15, 3),
(10, 19, 2),
(10, 25, 1),
(10, 40, 2),
(10, 44, 1),
(10, 48, 2),
(10, 50, 3),
(10, 54, 3),
(10, 58, 2),
(10, 78, 1),
(10, 105, 1),
(10, 121, 3),
(10, 125, 1),
(10, 129, 3),
(10, 131, 3),
(10, 135, 3),
(10, 139, 1),
(11, 22, 1),
(11, 26, 3),
(11, 67, 2),
(11, 73, 3),
(11, 77, 1),
(11, 80, 1),
(11, 90, 2),
(11, 94, 1),
(11, 98, 1),
(11, 111, 1),
(11, 115, 1),
(11, 119, 3),
(11, 140, 3),
(11, 144, 1),
(11, 148, 1),
(11, 150, 1),
(12, 63, 1),
(12, 67, 2),
(12, 80, 2),
(12, 84, 1),
(12, 130, 2),
(12, 134, 2),
(13, 19, 1),
(13, 44, 3),
(13, 50, 2),
(13, 54, 2),
(13, 58, 1),
(13, 104, 2),
(13, 110, 2),
(13, 114, 1),
(13, 118, 2),
(13, 141, 3),
(13, 145, 2),
(13, 149, 2),
(14, 12, 1),
(14, 43, 1),
(14, 47, 3),
(14, 53, 3),
(14, 57, 3),
(14, 123, 2),
(14, 127, 3),
(14, 133, 3),
(14, 137, 1),
(15, 39, 3),
(15, 60, 2),
(15, 64, 2),
(15, 83, 2),
(15, 87, 2),
(15, 103, 1),
(15, 107, 2),
(16, 21, 1),
(16, 25, 2),
(16, 29, 3),
(16, 60, 3),
(16, 70, 1),
(16, 74, 2),
(16, 78, 2),
(16, 87, 1),
(16, 93, 2),
(16, 97, 1),
(16, 122, 3),
(16, 126, 3),
(17, 12, 3),
(17, 16, 3),
(17, 43, 1),
(17, 47, 2),
(17, 102, 2),
(17, 106, 2),
(17, 112, 2),
(17, 116, 2),
(18, 23, 3),
(18, 27, 1),
(18, 33, 2),
(18, 37, 1),
(18, 72, 3),
(18, 76, 2),
(18, 81, 1),
(18, 89, 1),
(18, 91, 2),
(18, 95, 2),
(18, 99, 3),
(18, 101, 2),
(18, 105, 3),
(18, 109, 1),
(18, 111, 2),
(18, 115, 3),
(18, 119, 3),
(18, 140, 1),
(18, 144, 2),
(18, 148, 3),
(19, 10, 3),
(19, 14, 1),
(19, 18, 1),
(19, 45, 2),
(19, 49, 3),
(19, 131, 3),
(19, 135, 1),
(20, 20, 2),
(20, 24, 1),
(20, 30, 2),
(20, 34, 3),
(20, 38, 2),
(20, 61, 1),
(20, 65, 1),
(20, 69, 2),
(20, 79, 2),
(20, 82, 2),
(20, 86, 2),
(20, 122, 3),
(20, 126, 2),
(20, 132, 2),
(20, 136, 1),
(21, 42, 1),
(21, 46, 2),
(21, 52, 3),
(21, 56, 2),
(21, 102, 1),
(21, 106, 1),
(21, 116, 1),
(21, 143, 2),
(21, 147, 3),
(22, 13, 1),
(22, 17, 3),
(22, 42, 3),
(22, 46, 3),
(22, 52, 2),
(22, 56, 1),
(22, 123, 1),
(22, 127, 3),
(22, 133, 1),
(22, 137, 3),
(22, 146, 1),
(23, 20, 3),
(23, 24, 3),
(23, 75, 1),
(23, 79, 3),
(23, 92, 2),
(23, 103, 3),
(24, 23, 1),
(24, 27, 1),
(24, 62, 1),
(24, 72, 3),
(24, 76, 1),
(24, 81, 1),
(24, 85, 3),
(24, 91, 2),
(24, 95, 2),
(24, 99, 3),
(24, 120, 2),
(24, 130, 3),
(24, 134, 3),
(24, 138, 2),
(25, 18, 2),
(25, 41, 1),
(25, 110, 2),
(25, 114, 3),
(25, 149, 1),
(26, 10, 2),
(26, 18, 1),
(26, 41, 3),
(26, 45, 1),
(26, 49, 2),
(26, 51, 1),
(26, 55, 1),
(26, 59, 2),
(26, 125, 3),
(26, 129, 2),
(26, 131, 2),
(26, 135, 1),
(26, 139, 1),
(27, 33, 1),
(27, 62, 3),
(27, 66, 1),
(27, 81, 2),
(27, 85, 1),
(27, 89, 2),
(27, 111, 2),
(27, 119, 3),
(27, 140, 1),
(27, 144, 1),
(28, 1, 3),
(28, 12, 1),
(28, 16, 2),
(28, 32, 2),
(28, 36, 2),
(28, 43, 1),
(28, 47, 3),
(28, 53, 1),
(28, 57, 1),
(28, 102, 1),
(28, 106, 3),
(28, 112, 1),
(28, 116, 1),
(28, 132, 1),
(28, 143, 3),
(28, 147, 3),
(29, 31, 2),
(29, 35, 1),
(29, 64, 2),
(29, 68, 1),
(29, 83, 3),
(29, 122, 2),
(29, 126, 1),
(30, 2, 2),
(30, 6, 1),
(30, 10, 2),
(30, 14, 1),
(30, 18, 1),
(30, 41, 3),
(30, 45, 2),
(30, 49, 3),
(30, 51, 1),
(30, 55, 1),
(30, 108, 1),
(30, 110, 3),
(30, 114, 3),
(30, 118, 3),
(30, 141, 2),
(30, 145, 3),
(30, 149, 1),
(30, 151, 3);

-- --------------------------------------------------------

--
-- 表的结构 `replenishment_requests`
--

CREATE TABLE `replenishment_requests` (
  `request_id` int(11) NOT NULL,
  `store_id` int(11) NOT NULL,
  `sku_id` int(11) NOT NULL,
  `requested_quantity` int(11) NOT NULL,
  `urgency_level` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `request_date` datetime DEFAULT current_timestamp(),
  `requested_by` int(11) DEFAULT NULL,
  `reason` varchar(500) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL,
  `approval_date` datetime DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `rejection_date` datetime DEFAULT NULL,
  `completed_date` datetime DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- 表的结构 `skus`
--

CREATE TABLE `skus` (
  `sku_id` int(11) NOT NULL,
  `ISBN` char(13) NOT NULL,
  `unit_price` decimal(9,2) UNSIGNED NOT NULL,
  `binding` enum('Hardcover','Paperback','Mass Market Paperback') NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `skus`
--

INSERT INTO `skus` (`sku_id`, `ISBN`, `unit_price`, `binding`) VALUES
(1, '9782000000001', 26.40, 'Paperback'),
(2, '9782000000002', 23.06, 'Paperback'),
(3, '9782000000003', 22.84, 'Paperback'),
(4, '9782000000004', 23.51, 'Paperback'),
(5, '9782000000005', 39.45, 'Paperback'),
(6, '9782000000006', 28.27, 'Paperback'),
(7, '9782000000007', 19.89, 'Paperback'),
(8, '9782000000008', 29.48, 'Paperback'),
(9, '9782000000009', 35.46, 'Paperback'),
(10, '9782000000010', 31.99, 'Paperback'),
(11, '9782000000011', 39.77, 'Paperback'),
(12, '9782000000012', 44.19, 'Paperback'),
(13, '9782000000013', 26.69, 'Paperback'),
(14, '9782000000014', 26.86, 'Paperback'),
(15, '9782000000015', 42.16, 'Paperback'),
(16, '9782000000016', 30.02, 'Paperback'),
(17, '9782000000017', 41.56, 'Paperback'),
(18, '9782000000018', 31.81, 'Paperback'),
(19, '9782000000019', 41.39, 'Paperback'),
(20, '9782000000020', 38.20, 'Paperback'),
(21, '9782000000021', 38.42, 'Paperback'),
(22, '9782000000022', 40.80, 'Paperback'),
(23, '9782000000023', 19.18, 'Paperback'),
(24, '9782000000024', 31.73, 'Paperback'),
(25, '9782000000025', 39.23, 'Paperback'),
(26, '9782000000026', 29.13, 'Paperback'),
(27, '9782000000027', 22.39, 'Paperback'),
(28, '9782000000028', 35.66, 'Paperback'),
(29, '9782000000029', 41.76, 'Paperback'),
(30, '9782000000030', 34.77, 'Paperback'),
(31, '9782000000031', 19.47, 'Paperback'),
(32, '9782000000032', 27.85, 'Paperback'),
(33, '9782000000033', 30.15, 'Paperback'),
(34, '9782000000034', 40.44, 'Paperback'),
(35, '9782000000035', 39.62, 'Paperback'),
(36, '9782000000036', 26.80, 'Paperback'),
(37, '9782000000037', 21.18, 'Paperback'),
(38, '9782000000038', 33.19, 'Paperback'),
(39, '9782000000039', 19.45, 'Paperback'),
(40, '9782000000040', 30.90, 'Paperback'),
(41, '9782000000041', 37.32, 'Paperback'),
(42, '9782000000042', 16.94, 'Paperback'),
(43, '9782000000043', 25.92, 'Paperback'),
(44, '9782000000044', 33.31, 'Paperback'),
(45, '9782000000045', 38.85, 'Paperback'),
(46, '9782000000046', 34.47, 'Paperback'),
(47, '9782000000047', 36.49, 'Paperback'),
(48, '9782000000048', 26.64, 'Paperback'),
(49, '9782000000049', 37.98, 'Paperback'),
(50, '9782000000050', 32.75, 'Paperback'),
(51, '9782000000051', 31.33, 'Paperback'),
(52, '9782000000052', 27.43, 'Paperback'),
(53, '9782000000053', 19.13, 'Paperback'),
(54, '9782000000054', 15.78, 'Paperback'),
(55, '9782000000055', 20.68, 'Paperback'),
(56, '9782000000056', 27.10, 'Paperback'),
(57, '9782000000057', 19.04, 'Paperback'),
(58, '9782000000058', 38.09, 'Paperback'),
(59, '9782000000059', 23.03, 'Paperback'),
(60, '9782000000060', 22.24, 'Paperback'),
(61, '9782000000061', 23.98, 'Paperback'),
(62, '9782000000062', 34.68, 'Paperback'),
(63, '9782000000063', 41.54, 'Paperback'),
(64, '9782000000064', 21.13, 'Paperback'),
(65, '9782000000065', 30.47, 'Paperback'),
(66, '9782000000066', 31.81, 'Paperback'),
(67, '9782000000067', 23.23, 'Paperback'),
(68, '9782000000068', 26.74, 'Paperback'),
(69, '9782000000069', 18.92, 'Paperback'),
(70, '9782000000070', 29.45, 'Paperback'),
(71, '9782000000071', 15.67, 'Paperback'),
(72, '9782000000072', 41.09, 'Paperback'),
(73, '9782000000073', 41.87, 'Paperback'),
(74, '9782000000074', 38.96, 'Paperback'),
(75, '9782000000075', 39.98, 'Paperback'),
(76, '9782000000076', 20.36, 'Paperback'),
(77, '9782000000077', 42.90, 'Paperback'),
(78, '9782000000078', 33.39, 'Paperback'),
(79, '9782000000079', 35.73, 'Paperback'),
(80, '9782000000080', 21.42, 'Paperback'),
(81, '9782000000081', 31.28, 'Paperback'),
(82, '9782000000082', 30.66, 'Paperback'),
(83, '9782000000083', 17.64, 'Paperback'),
(84, '9782000000084', 39.35, 'Paperback'),
(85, '9782000000085', 38.09, 'Paperback'),
(86, '9782000000086', 39.23, 'Paperback'),
(87, '9782000000087', 36.61, 'Paperback'),
(88, '9782000000088', 32.44, 'Paperback'),
(89, '9782000000089', 21.22, 'Paperback'),
(90, '9782000000090', 35.19, 'Paperback'),
(91, '9782000000091', 25.77, 'Paperback'),
(92, '9782000000092', 43.71, 'Paperback'),
(93, '9782000000093', 31.97, 'Paperback'),
(94, '9782000000094', 22.30, 'Paperback'),
(95, '9782000000095', 31.84, 'Paperback'),
(96, '9782000000096', 22.98, 'Paperback'),
(97, '9782000000097', 21.72, 'Paperback'),
(98, '9782000000098', 42.21, 'Paperback'),
(99, '9782000000099', 16.03, 'Paperback'),
(100, '9782000000100', 41.85, 'Paperback'),
(101, '9782000000004', 33.51, 'Hardcover'),
(102, '9782000000005', 49.45, 'Hardcover'),
(103, '9782000000006', 38.27, 'Hardcover'),
(104, '9782000000007', 29.89, 'Hardcover'),
(105, '9782000000010', 41.99, 'Hardcover'),
(106, '9782000000011', 49.77, 'Hardcover'),
(107, '9782000000012', 54.19, 'Hardcover'),
(108, '9782000000013', 36.69, 'Hardcover'),
(109, '9782000000018', 41.81, 'Hardcover'),
(110, '9782000000019', 51.39, 'Hardcover'),
(111, '9782000000024', 41.73, 'Hardcover'),
(112, '9782000000025', 49.23, 'Hardcover'),
(113, '9782000000026', 39.13, 'Hardcover'),
(114, '9782000000027', 32.39, 'Hardcover'),
(115, '9782000000030', 44.77, 'Hardcover'),
(116, '9782000000031', 29.47, 'Hardcover'),
(117, '9782000000032', 37.85, 'Hardcover'),
(118, '9782000000033', 40.15, 'Hardcover'),
(119, '9782000000038', 43.19, 'Hardcover'),
(120, '9782000000039', 29.45, 'Hardcover'),
(121, '9782000000044', 43.31, 'Hardcover'),
(122, '9782000000045', 48.85, 'Hardcover'),
(123, '9782000000046', 44.47, 'Hardcover'),
(124, '9782000000047', 46.49, 'Hardcover'),
(125, '9782000000050', 42.75, 'Hardcover'),
(126, '9782000000051', 41.33, 'Hardcover'),
(127, '9782000000052', 37.43, 'Hardcover'),
(128, '9782000000053', 29.13, 'Hardcover'),
(129, '9782000000058', 48.09, 'Hardcover'),
(130, '9782000000059', 33.03, 'Hardcover'),
(131, '9782000000064', 31.13, 'Hardcover'),
(132, '9782000000065', 40.47, 'Hardcover'),
(133, '9782000000066', 41.81, 'Hardcover'),
(134, '9782000000067', 33.23, 'Hardcover'),
(135, '9782000000070', 39.45, 'Hardcover'),
(136, '9782000000071', 25.67, 'Hardcover'),
(137, '9782000000072', 51.09, 'Hardcover'),
(138, '9782000000073', 51.87, 'Hardcover'),
(139, '9782000000078', 43.39, 'Hardcover'),
(140, '9782000000079', 45.73, 'Hardcover'),
(141, '9782000000084', 49.35, 'Hardcover'),
(142, '9782000000085', 48.09, 'Hardcover'),
(143, '9782000000086', 49.23, 'Hardcover'),
(144, '9782000000087', 46.61, 'Hardcover'),
(145, '9782000000090', 45.19, 'Hardcover'),
(146, '9782000000091', 35.77, 'Hardcover'),
(147, '9782000000092', 53.71, 'Hardcover'),
(148, '9782000000093', 41.97, 'Hardcover'),
(149, '9782000000098', 52.21, 'Hardcover'),
(150, '9782000000099', 26.03, 'Hardcover'),
(151, '9782000000100', 51.85, 'Hardcover');

-- --------------------------------------------------------

--
-- 表的结构 `stores`
--

CREATE TABLE `stores` (
  `store_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `address` varchar(50) NOT NULL,
  `telephone` int(11) NOT NULL,
  `status` enum('close','open','top sales') NOT NULL DEFAULT 'open'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `stores`
--

INSERT INTO `stores` (`store_id`, `name`, `address`, `telephone`, `status`) VALUES
(1, 'Downtown Store', '101 Main Street', 2100000001, 'top sales'),
(2, 'University Store', '202 College Road', 2100000002, 'open'),
(3, 'Community Store', '303 Oak Avenue', 2100000003, 'open'),
(4, 'Suburban Store', '404 Lake Drive', 2100000004, 'open'),
(5, 'Airport Store', '505 Airport Road', 2100000005, 'close');

-- --------------------------------------------------------

--
-- 表的结构 `suppliers`
--

CREATE TABLE `suppliers` (
  `supplier_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `phone` int(10) UNSIGNED NOT NULL,
  `address` varchar(50) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `suppliers`
--

INSERT INTO `suppliers` (`supplier_id`, `name`, `phone`, `address`, `email`) VALUES
(1, 'Global Books Ltd', 3101000001, '12 King Street', 'contact@globalbooks.com'),
(2, 'Eastern Publishing', 3101000002, '88 East Road', 'sales@easternpub.com'),
(3, 'Northern Press', 3101000003, '45 North Avenue', NULL),
(4, 'Southern Media', 3101000004, '66 South Street', 'info@southernmedia.com'),
(5, 'Westwind Books', 3101000005, NULL, 'service@westwind.com'),
(6, 'Classic House', 3101000006, '9 Heritage Lane', NULL),
(7, 'Modern Reads', 3101000007, '120 Innovation Blvd', 'hello@modernreads.com'),
(8, 'Academic Source', 3101000008, '75 Scholar Road', 'support@academicsource.com'),
(9, 'Literary Bridge', 3101000009, NULL, NULL),
(10, 'World Text Supply', 3101000010, '33 Global Way', 'contact@worldtext.com'),
(11, 'Urban Knowledge', 3101000011, '18 City Plaza', NULL),
(12, 'Heritage Classics', 3101000012, '7 Old Town Street', 'info@heritageclassics.com'),
(13, 'Blue River Books', 3101000013, NULL, 'blueriver@books.com'),
(14, 'Silver Leaf Supply', 3101000014, '54 Maple Road', NULL),
(15, 'Sunrise Publishing', 3101000015, '101 Sunrise Ave', 'sales@sunrisepub.com'),
(16, 'Horizon Distributors', 3101000016, '88 Horizon Street', 'contact@horizondist.com'),
(17, 'Knowledge Tree', 3101000017, NULL, 'info@knowledgetree.com'),
(18, 'Atlas Book Supply', 3101000018, '200 Atlas Boulevard', NULL);

-- --------------------------------------------------------

--
-- 表的结构 `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(64) NOT NULL,
  `create_date` datetime NOT NULL,
  `last_log_date` datetime NOT NULL,
  `user_types` enum('member','employee') NOT NULL DEFAULT 'member',
  `status` enum('active','disabled') NOT NULL DEFAULT 'active'
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 转存表中的数据 `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `create_date`, `last_log_date`, `user_types`, `status`) VALUES
(1, 'member001', '123456', '2025-01-02 09:00:00', '2025-12-10 20:10:00', 'member', 'active'),
(2, 'member002', '123456', '2025-01-03 09:00:00', '2025-12-11 20:10:00', 'member', 'active'),
(3, 'member003', '123456', '2025-01-04 09:00:00', '2025-12-12 20:10:00', 'member', 'active'),
(4, 'member004', '123456', '2025-01-05 09:00:00', '2025-12-13 20:10:00', 'member', 'active'),
(5, 'member005', '123456', '2025-01-06 09:00:00', '2025-12-14 20:10:00', 'member', 'active'),
(6, 'member006', '123456', '2025-01-07 09:00:00', '2025-12-15 20:10:00', 'member', 'active'),
(7, 'member007', '123456', '2025-01-08 09:00:00', '2025-12-16 20:10:00', 'member', 'active'),
(8, 'member008', '123456', '2025-01-09 09:00:00', '2025-12-17 20:10:00', 'member', 'active'),
(9, 'member009', '123456', '2025-01-10 09:00:00', '2025-12-18 20:10:00', 'member', 'active'),
(10, 'member010', '123456', '2025-01-11 09:00:00', '2025-12-09 20:10:00', 'member', 'active'),
(11, 'member011', '123456', '2025-01-12 09:00:00', '2025-12-10 20:10:00', 'member', 'active'),
(12, 'member012', '123456', '2025-01-13 09:00:00', '2025-12-11 20:10:00', 'member', 'active'),
(13, 'member013', '123456', '2025-01-14 09:00:00', '2025-12-12 20:10:00', 'member', 'active'),
(14, 'member014', '123456', '2025-01-15 09:00:00', '2025-12-13 20:10:00', 'member', 'active'),
(15, 'member015', '123456', '2025-01-16 09:00:00', '2025-12-14 20:10:00', 'member', 'active'),
(16, 'member016', '123456', '2025-01-17 09:00:00', '2025-12-15 20:10:00', 'member', 'active'),
(17, 'member017', '123456', '2025-01-18 09:00:00', '2025-12-16 20:10:00', 'member', 'active'),
(18, 'member018', '123456', '2025-01-19 09:00:00', '2025-12-17 20:10:00', 'member', 'active'),
(19, 'member019', '123456', '2025-01-20 09:00:00', '2025-12-18 20:10:00', 'member', 'active'),
(20, 'member020', '123456', '2025-01-21 09:00:00', '2025-12-09 20:10:00', 'member', 'active'),
(21, 'member021', '123456', '2025-01-22 09:00:00', '2025-12-10 20:10:00', 'member', 'active'),
(22, 'member022', '123456', '2025-01-23 09:00:00', '2025-12-11 20:10:00', 'member', 'active'),
(23, 'member023', '123456', '2025-01-24 09:00:00', '2025-12-12 20:10:00', 'member', 'active'),
(24, 'member024', '123456', '2025-01-25 09:00:00', '2025-12-13 20:10:00', 'member', 'active'),
(25, 'member025', '123456', '2025-01-26 09:00:00', '2025-12-14 20:10:00', 'member', 'active'),
(26, 'member026', '123456', '2025-01-27 09:00:00', '2025-12-15 20:10:00', 'member', 'active'),
(27, 'member027', '123456', '2025-01-28 09:00:00', '2025-12-16 20:10:00', 'member', 'active'),
(28, 'member028', '123456', '2025-01-29 09:00:00', '2025-12-17 20:10:00', 'member', 'active'),
(29, 'member029', '123456', '2025-01-30 09:00:00', '2025-12-18 20:10:00', 'member', 'active'),
(30, 'member030', '123456', '2025-01-31 09:00:00', '2025-12-09 20:10:00', 'member', 'active'),
(31, 'member031', '123456', '2025-02-01 09:00:00', '2025-12-10 20:10:00', 'member', 'active'),
(32, 'member032', '123456', '2025-02-02 09:00:00', '2025-12-11 20:10:00', 'member', 'active'),
(33, 'member033', '123456', '2025-02-03 09:00:00', '2025-12-12 20:10:00', 'member', 'active'),
(34, 'member034', '123456', '2025-02-04 09:00:00', '2025-12-13 20:10:00', 'member', 'active'),
(35, 'member035', '123456', '2025-02-05 09:00:00', '2025-12-14 20:10:00', 'member', 'active'),
(36, 'member036', '123456', '2025-02-06 09:00:00', '2025-12-15 20:10:00', 'member', 'active'),
(37, 'member037', '123456', '2025-02-07 09:00:00', '2025-12-16 20:10:00', 'member', 'active'),
(38, 'member038', '123456', '2025-02-08 09:00:00', '2025-12-17 20:10:00', 'member', 'active'),
(39, 'member039', '123456', '2025-02-09 09:00:00', '2025-12-18 20:10:00', 'member', 'active'),
(40, 'member040', '123456', '2025-02-10 09:00:00', '2025-12-09 20:10:00', 'member', 'active'),
(41, 'member041', '123456', '2025-02-11 09:00:00', '2025-12-10 20:10:00', 'member', 'active'),
(42, 'member042', '123456', '2025-02-12 09:00:00', '2025-12-11 20:10:00', 'member', 'active'),
(43, 'member043', '123456', '2025-02-13 09:00:00', '2025-12-12 20:10:00', 'member', 'active'),
(44, 'member044', '123456', '2025-02-14 09:00:00', '2025-12-13 20:10:00', 'member', 'active'),
(45, 'member045', '123456', '2025-02-15 09:00:00', '2025-12-14 20:10:00', 'member', 'active'),
(46, 'member046', '123456', '2025-02-16 09:00:00', '2025-12-15 20:10:00', 'member', 'active'),
(47, 'member047', '123456', '2025-02-17 09:00:00', '2025-12-16 20:10:00', 'member', 'active'),
(48, 'member048', '123456', '2025-02-18 09:00:00', '2025-12-17 20:10:00', 'member', 'active'),
(49, 'member049', '123456', '2025-02-19 09:00:00', '2025-12-18 20:10:00', 'member', 'active'),
(50, 'member050', '123456', '2025-02-20 09:00:00', '2025-12-09 20:10:00', 'member', 'active'),
(51, 'member051', '123456', '2025-02-21 09:00:00', '2025-12-10 20:10:00', 'member', 'active'),
(52, 'member052', '123456', '2025-02-22 09:00:00', '2025-12-11 20:10:00', 'member', 'active'),
(53, 'member053', '123456', '2025-02-23 09:00:00', '2025-12-12 20:10:00', 'member', 'active'),
(54, 'member054', '123456', '2025-02-24 09:00:00', '2025-12-13 20:10:00', 'member', 'active'),
(55, 'member055', '123456', '2025-02-25 09:00:00', '2025-12-14 20:10:00', 'member', 'active'),
(56, 'member056', '123456', '2025-02-26 09:00:00', '2025-12-15 20:10:00', 'member', 'active'),
(57, 'member057', '123456', '2025-02-27 09:00:00', '2025-12-16 20:10:00', 'member', 'active'),
(58, 'member058', '123456', '2025-02-28 09:00:00', '2025-12-17 20:10:00', 'member', 'active'),
(59, 'member059', '123456', '2025-03-01 09:00:00', '2025-12-18 20:10:00', 'member', 'active'),
(60, 'member060', '123456', '2025-03-02 09:00:00', '2025-12-09 20:10:00', 'member', 'active'),
(61, 'member061', '123456', '2025-03-03 09:00:00', '2025-12-10 20:10:00', 'member', 'active'),
(62, 'member062', '123456', '2025-03-04 09:00:00', '2025-12-11 20:10:00', 'member', 'active'),
(63, 'member063', '123456', '2025-03-05 09:00:00', '2025-12-12 20:10:00', 'member', 'active'),
(64, 'member064', '123456', '2025-03-06 09:00:00', '2025-12-13 20:10:00', 'member', 'active'),
(65, 'member065', '123456', '2025-03-07 09:00:00', '2025-12-14 20:10:00', 'member', 'active'),
(66, 'member066', '123456', '2025-03-08 09:00:00', '2025-12-15 20:10:00', 'member', 'active'),
(67, 'member067', '123456', '2025-03-09 09:00:00', '2025-12-16 20:10:00', 'member', 'active'),
(68, 'member068', '123456', '2025-03-10 09:00:00', '2025-12-17 20:10:00', 'member', 'active'),
(69, 'member069', '123456', '2025-03-11 09:00:00', '2025-12-18 20:10:00', 'member', 'active'),
(70, 'member070', '123456', '2025-03-12 09:00:00', '2025-12-09 20:10:00', 'member', 'active'),
(71, 'member071', '123456', '2025-03-13 09:00:00', '2025-12-10 20:10:00', 'member', 'active'),
(72, 'member072', '123456', '2025-03-14 09:00:00', '2025-12-11 20:10:00', 'member', 'active'),
(73, 'member073', '123456', '2025-03-15 09:00:00', '2025-12-12 20:10:00', 'member', 'active'),
(74, 'member074', '123456', '2025-03-16 09:00:00', '2025-12-13 20:10:00', 'member', 'active'),
(75, 'member075', '123456', '2025-03-17 09:00:00', '2025-12-14 20:10:00', 'member', 'active'),
(76, 'member076', '123456', '2025-03-18 09:00:00', '2025-12-15 20:10:00', 'member', 'active'),
(77, 'member077', '123456', '2025-03-19 09:00:00', '2025-12-16 20:10:00', 'member', 'active'),
(78, 'emp001', '123456', '2024-11-01 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(79, 'emp002', '123456', '2024-11-08 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(80, 'emp003', '123456', '2024-11-15 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(81, 'emp004', '123456', '2024-11-22 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(82, 'emp005', '123456', '2024-11-29 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(83, 'emp006', '123456', '2024-12-06 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(84, 'emp007', '123456', '2024-12-13 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(85, 'emp008', '123456', '2024-12-20 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(86, 'emp009', '123456', '2025-01-03 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(87, 'emp010', '123456', '2025-01-10 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(88, 'emp011', '123456', '2025-01-17 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(89, 'emp012', '123456', '2025-01-24 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(90, 'emp013', '123456', '2025-01-31 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(91, 'emp014', '123456', '2025-02-07 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(92, 'emp015', '123456', '2025-02-14 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(93, 'emp016', '123456', '2025-02-21 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(94, 'emp017', '123456', '2025-02-28 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(95, 'emp018', '123456', '2025-03-07 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(96, 'emp019', '123456', '2025-03-14 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(97, 'emp020', '123456', '2025-03-21 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(98, 'emp021', '123456', '2025-03-28 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(99, 'emp022', '123456', '2025-04-04 08:30:00', '2025-12-18 09:05:00', 'employee', 'active'),
(100, 'emp023', '123456', '2025-04-11 08:30:00', '2025-12-18 09:05:00', 'employee', 'active');

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vm_finance_invoice_base`
-- （参见下面的实际视图）
--
CREATE TABLE `vm_finance_invoice_base` (
`invoice_id` int(11)
,`order_id` int(11)
,`store_id` int(11)
,`member_id` int(11)
,`order_status` enum('created','paid','cancelled','refunded','finished')
,`order_date` datetime
,`invoice_status` enum('draft','issued','partly_paid','paid','voided','credited')
,`invoice_number` int(10) unsigned
,`issue_date` datetime
,`due_date` datetime
,`update_date` datetime
,`note` varchar(255)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vm_finance_invoice_paid_sum`
-- （参见下面的实际视图）
--
CREATE TABLE `vm_finance_invoice_paid_sum` (
`invoice_id` int(11)
,`paid_amount` decimal(31,2)
,`last_paid_at` datetime
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vm_finance_invoice_payment_allocation_detail`
-- （参见下面的实际视图）
--
CREATE TABLE `vm_finance_invoice_payment_allocation_detail` (
`invoice_id` int(11)
,`payment_id` int(11)
,`allocation_date` datetime
,`allocated_amount` decimal(9,2) unsigned
,`allocation_note` varchar(255)
,`member_id` int(11)
,`payment_method` enum('Credit Card','Third-Party Payment','Cash')
,`payment_amount` decimal(9,2) unsigned
,`payment_create_date` datetime
,`payment_update_date` datetime
,`payment_note` varchar(255)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vm_finance_order_amount_base`
-- （参见下面的实际视图）
--
CREATE TABLE `vm_finance_order_amount_base` (
`order_id` int(11)
,`store_id` int(11)
,`member_id` int(11)
,`order_status` enum('created','paid','cancelled','refunded','finished')
,`order_date` datetime
,`note` varchar(255)
,`gross_amount` decimal(41,2)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vm_finance_order_member_rate`
-- （参见下面的实际视图）
--
CREATE TABLE `vm_finance_order_member_rate` (
`order_id` int(11)
,`member_tier_id` int(11)
,`discount_rate` decimal(9,2) unsigned
,`earn_point_rate` decimal(9,2) unsigned
,`min_lifetime_spend` decimal(9,2) unsigned
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vm_finance_order_paid_sum`
-- （参见下面的实际视图）
--
CREATE TABLE `vm_finance_order_paid_sum` (
`order_id` int(11)
,`paid_amount` decimal(31,2)
,`last_paid_at` datetime
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vm_finance_order_points_summary`
-- （参见下面的实际视图）
--
CREATE TABLE `vm_finance_order_points_summary` (
`order_id` int(11)
,`points_net` decimal(32,0)
,`points_earned` decimal(32,0)
,`points_redeemed` decimal(33,0)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vm_finance_order_settlement`
-- （参见下面的实际视图）
--
CREATE TABLE `vm_finance_order_settlement` (
`order_id` int(11)
,`store_id` int(11)
,`member_id` int(11)
,`order_status` enum('created','paid','cancelled','refunded','finished')
,`order_date` datetime
,`note` varchar(255)
,`discount_rate` decimal(9,2) unsigned
,`earn_point_rate` decimal(9,2) unsigned
,`gross_amount` decimal(41,2)
,`discounted_amount` decimal(49,2)
,`earned_points` decimal(32,0)
,`redeemed_points` decimal(33,0)
,`points_discount_amount` decimal(38,2)
,`payable_amount` decimal(50,2)
,`paid_amount` decimal(31,2)
,`last_paid_at` datetime
,`is_settled` int(1)
,`expected_earned_points` decimal(55,0)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vm_invoice_settlement`
-- （参见下面的实际视图）
--
CREATE TABLE `vm_invoice_settlement` (
`invoice_id` int(11)
,`invoice_number` int(10) unsigned
,`invoice_status` enum('draft','issued','partly_paid','paid','voided','credited')
,`issue_date` datetime
,`due_date` datetime
,`update_date` datetime
,`note` varchar(255)
,`order_id` int(11)
,`store_id` int(11)
,`member_id` int(11)
,`order_status` enum('created','paid','cancelled','refunded','finished')
,`order_date` datetime
,`invoice_amount` decimal(50,2)
,`paid_amount` decimal(31,2)
,`outstanding_amount` decimal(51,2)
,`last_paid_at` datetime
,`is_settled` int(1)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_active_announcements`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_active_announcements` (
`announcement_id` int(11)
,`title` varchar(255)
,`content` varchar(255)
,`publish_at` datetime
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_auth_details`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_auth_details` (
`user_id` int(11)
,`username` varchar(50)
,`password_hash` varchar(64)
,`user_types` enum('member','employee')
,`status` enum('active','disabled')
,`job_title` varchar(50)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_customer_announcements`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_customer_announcements` (
`announcement_id` int(11)
,`title` varchar(255)
,`content` varchar(255)
,`publish_at` datetime
,`expire_at` datetime
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_customer_books`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_customer_books` (
`ISBN` char(13)
,`title` varchar(50)
,`language` varchar(50)
,`publisher` varchar(50)
,`description` varchar(255)
,`sku_id` int(11)
,`price` decimal(9,2) unsigned
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`stock` decimal(32,0)
,`store_id` int(11)
,`store_name` varchar(50)
,`author` mediumtext
,`category` mediumtext
,`fav_count` bigint(21)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_customer_book_detail`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_customer_book_detail` (
`ISBN` char(13)
,`title` varchar(50)
,`language` varchar(50)
,`publisher` varchar(50)
,`description` varchar(255)
,`sku_id` int(11)
,`price` decimal(9,2) unsigned
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`stock` decimal(32,0)
,`store_id` int(11)
,`store_name` varchar(50)
,`author` mediumtext
,`author_country` mediumtext
,`category` mediumtext
,`fav_count` bigint(21)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_customer_favorites`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_customer_favorites` (
`member_id` int(11)
,`ISBN` char(13)
,`create_date` datetime
,`title` varchar(50)
,`language` varchar(50)
,`publisher` varchar(50)
,`description` varchar(255)
,`sku_id` int(11)
,`price` decimal(9,2) unsigned
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`author` mediumtext
,`category` mediumtext
,`stock` decimal(32,0)
,`store_name` varchar(50)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_customer_member_info`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_customer_member_info` (
`member_id` int(11)
,`user_id` int(11)
,`first_name` varchar(50)
,`last_name` varchar(50)
,`email` varchar(100)
,`points` int(10) unsigned
,`address` varchar(50)
,`birthday` date
,`member_tier_id` int(11)
,`tier_name` varchar(50)
,`discount` decimal(9,2) unsigned
,`min_total_spent` decimal(9,2) unsigned
,`total_spent` decimal(41,2)
,`username` varchar(50)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_customer_orders`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_customer_orders` (
`order_id` int(11)
,`member_id` int(11)
,`store_id` int(11)
,`order_status` enum('created','paid','cancelled','refunded','finished')
,`order_date` datetime
,`note` varchar(255)
,`store_name` varchar(50)
,`total_price` decimal(41,2)
,`total_items` decimal(32,0)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_customer_order_items`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_customer_order_items` (
`order_id` int(11)
,`sku_id` int(11)
,`quantity` int(10) unsigned
,`ISBN` char(13)
,`book_title` varchar(50)
,`publisher` varchar(50)
,`language` varchar(50)
,`price` decimal(9,2) unsigned
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`subtotal` decimal(19,2) unsigned
,`author` mediumtext
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_customer_point_history`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_customer_point_history` (
`point_ledger_id` int(11)
,`member_id` int(11)
,`member_name` varchar(101)
,`points_change` int(11)
,`order_id` int(11)
,`change_type` varchar(8)
,`change_date` datetime
,`reason` varchar(255)
,`current_points` int(10) unsigned
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_customer_point_summary`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_customer_point_summary` (
`member_id` int(11)
,`member_name` varchar(101)
,`current_points` int(10) unsigned
,`total_earned` decimal(32,0)
,`total_spent` decimal(32,0)
,`total_transactions` bigint(21)
,`last_transaction_date` datetime
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_finance_invoice_list`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_finance_invoice_list` (
`invoice_id` int(11)
,`invoice_number` int(10) unsigned
,`order_id` int(11)
,`store_id` int(11)
,`store_name` varchar(50)
,`member_id` int(11)
,`member_name` varchar(101)
,`invoice_status` enum('draft','issued','partly_paid','paid','voided','credited')
,`issue_date` datetime
,`due_date` datetime
,`invoice_amount` decimal(50,2)
,`paid_amount` decimal(31,2)
,`outstanding_amount` decimal(51,2)
,`last_paid_at` datetime
,`is_settled` int(1)
,`display_status` varchar(7)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_finance_order_list`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_finance_order_list` (
`order_id` int(11)
,`store_id` int(11)
,`store_name` varchar(50)
,`member_id` int(11)
,`member_name` varchar(101)
,`order_status` enum('created','paid','cancelled','refunded','finished')
,`order_date` datetime
,`note` varchar(255)
,`payable_amount` decimal(50,2)
,`paid_amount` decimal(31,2)
,`is_settled` int(1)
,`item_count` bigint(21)
,`total_quantity` decimal(32,0)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_finance_purchase_cost_by_date`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_finance_purchase_cost_by_date` (
`cost_day` date
,`cost` decimal(41,2)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_finance_revenue_by_date`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_finance_revenue_by_date` (
`order_day` date
,`revenue` decimal(65,2)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_bestsellers`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_bestsellers` (
`ISBN` char(13)
,`book_name` varchar(50)
,`publisher` varchar(50)
,`language` varchar(50)
,`categories` mediumtext
,`orders_count` bigint(21)
,`total_sold` decimal(32,0)
,`total_revenue` decimal(41,2)
,`avg_price` decimal(13,6)
,`stores_sold_in` bigint(21)
,`unique_buyers` bigint(21)
,`sales_rank` bigint(21)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_employees`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_employees` (
`employee_id` int(11)
,`user_id` int(11)
,`first_name` varchar(50)
,`last_name` varchar(50)
,`full_name` varchar(101)
,`phone` int(10) unsigned
,`performance` int(10) unsigned
,`store_id` int(11)
,`store_name` varchar(50)
,`store_address` varchar(50)
,`store_status` enum('close','open','top sales')
,`job_title_id` int(11)
,`job_title` varchar(50)
,`base_salary` decimal(9,2) unsigned
,`username` varchar(50)
,`user_type` enum('member','employee')
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_employee_performance`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_employee_performance` (
`employee_id` int(11)
,`employee_name` varchar(101)
,`performance` int(10) unsigned
,`job_title` varchar(50)
,`store_name` varchar(50)
,`performance_rating` varchar(17)
,`base_salary` decimal(9,2) unsigned
,`potential_bonus` decimal(21,2)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_inventory_by_sku`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_inventory_by_sku` (
`sku_id` int(11)
,`ISBN` char(13)
,`book_name` varchar(50)
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`unit_price` decimal(9,2) unsigned
,`store_id` int(11)
,`store_name` varchar(50)
,`store_stock` decimal(32,0)
,`avg_cost` decimal(13,6)
,`earliest_batch` datetime
,`latest_batch` datetime
,`batch_count` bigint(21)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_inventory_by_store`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_inventory_by_store` (
`store_id` int(11)
,`store_name` varchar(50)
,`ISBN` char(13)
,`book_name` varchar(50)
,`sku_id` int(11)
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`unit_price` decimal(9,2) unsigned
,`total_quantity` decimal(32,0)
,`avg_cost` decimal(13,6)
,`batch_count` bigint(21)
,`last_inbound_date` datetime
,`stock_status` varchar(12)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_inventory_overview`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_inventory_overview` (
`ISBN` char(13)
,`book_name` varchar(50)
,`publisher` varchar(50)
,`language` varchar(50)
,`sku_id` int(11)
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`unit_price` decimal(9,2) unsigned
,`total_stock` decimal(32,0)
,`stores_count` bigint(21)
,`avg_cost` decimal(13,6)
,`earliest_received` datetime
,`latest_received` datetime
,`authors` mediumtext
,`categories` mediumtext
,`stock_level` varchar(12)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_orders_summary`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_orders_summary` (
`order_id` int(11)
,`store_id` int(11)
,`store_name` varchar(50)
,`member_id` int(11)
,`member_name` varchar(101)
,`member_email` varchar(100)
,`order_status` enum('created','paid','cancelled','refunded','finished')
,`order_date` datetime
,`note` varchar(255)
,`items_count` bigint(21)
,`total_items` decimal(32,0)
,`order_total` decimal(41,2)
,`payment_method` enum('Credit Card','Third-Party Payment','Cash')
,`paid_amount` decimal(9,2) unsigned
,`payment_date` datetime
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_payment_analysis`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_payment_analysis` (
`payment_method` enum('Credit Card','Third-Party Payment','Cash')
,`payment_count` bigint(21)
,`total_amount` decimal(31,2)
,`avg_amount` decimal(10,2)
,`min_amount` decimal(9,2) unsigned
,`max_amount` decimal(9,2) unsigned
,`stores_count` bigint(21)
,`first_payment_date` date
,`last_payment_date` date
,`percentage_of_total` decimal(37,2)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_purchases`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_purchases` (
`purchase_id` int(11)
,`store_id` int(11)
,`store_name` varchar(50)
,`supplier_id` int(11)
,`supplier_name` varchar(50)
,`supplier_phone` int(10) unsigned
,`purchase_date` datetime
,`note` varchar(255)
,`items_count` bigint(21)
,`total_quantity` decimal(32,0)
,`estimated_cost` decimal(41,2)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_replenishment_requests`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_replenishment_requests` (
`request_id` int(11)
,`store_id` int(11)
,`store_name` varchar(50)
,`sku_id` int(11)
,`ISBN` char(13)
,`book_name` varchar(50)
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`requested_quantity` int(11)
,`sku_count` int(1)
,`total_quantity` int(11)
,`urgency_level` enum('low','medium','high')
,`status` enum('pending','approved','rejected','completed')
,`request_date` datetime
,`requested_by` int(11)
,`requested_by_name` varchar(101)
,`reason` varchar(500)
,`approved_by` int(11)
,`approved_by_name` varchar(101)
,`approval_date` datetime
,`rejection_reason` varchar(500)
,`rejection_date` datetime
,`completed_date` datetime
,`note` varchar(500)
,`current_stock` decimal(32,0)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_sales_by_category`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_sales_by_category` (
`category_id` int(11)
,`category_name` varchar(50)
,`orders_count` bigint(21)
,`total_quantity_sold` decimal(32,0)
,`total_sales` decimal(45,6)
,`avg_price` decimal(13,6)
,`books_in_category` bigint(21)
,`revenue_percentage` decimal(47,2)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_sales_by_store`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_sales_by_store` (
`store_id` int(11)
,`store_name` varchar(50)
,`store_status` enum('close','open','top sales')
,`total_orders` bigint(21)
,`paid_orders` bigint(21)
,`unique_customers` bigint(21)
,`total_revenue` decimal(41,2)
,`avg_order_value` decimal(23,6)
,`total_items_sold` decimal(32,0)
,`last_order_date` date
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_staff_by_store`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_staff_by_store` (
`store_id` int(11)
,`store_name` varchar(50)
,`store_status` enum('close','open','top sales')
,`total_employees` bigint(21)
,`managers_count` decimal(22,0)
,`finance_count` decimal(22,0)
,`staff_count` decimal(22,0)
,`avg_performance` decimal(13,2)
,`total_salary_cost` decimal(31,2)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_manager_suppliers`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_manager_suppliers` (
`supplier_id` int(11)
,`supplier_name` varchar(50)
,`phone` int(10) unsigned
,`address` varchar(50)
,`email` varchar(50)
,`total_purchases` bigint(21)
,`stores_served` bigint(21)
,`last_purchase_date` datetime
,`total_items_supplied` decimal(32,0)
,`total_purchase_value` decimal(41,2)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_staff_details`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_staff_details` (
`user_id` int(11)
,`username` varchar(50)
,`account_status` enum('active','disabled')
,`employee_id` int(11)
,`first_name` varchar(50)
,`last_name` varchar(50)
,`full_name` varchar(101)
,`job_title` varchar(50)
,`store_id` int(11)
,`store_name` varchar(50)
,`store_status` enum('close','open','top sales')
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_staff_inventory_details`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_staff_inventory_details` (
`batch_id` int(11)
,`store_id` int(11)
,`quantity` int(10) unsigned
,`unit_cost` decimal(9,2) unsigned
,`received_date` datetime
,`batch_code` varchar(50)
,`sku_id` int(11)
,`unit_price` decimal(9,2) unsigned
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`ISBN` char(13)
,`book_name` varchar(50)
,`publisher` varchar(50)
,`language` varchar(50)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_staff_low_stock`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_staff_low_stock` (
`sku_id` int(11)
,`ISBN` char(13)
,`book_name` varchar(50)
,`binding` enum('Hardcover','Paperback','Mass Market Paperback')
,`store_id` int(11)
,`total_stock` decimal(32,0)
);

-- --------------------------------------------------------

--
-- 替换视图以便查看 `vw_staff_order_summary`
-- （参见下面的实际视图）
--
CREATE TABLE `vw_staff_order_summary` (
`order_id` int(11)
,`store_id` int(11)
,`order_status` enum('created','paid','cancelled','refunded','finished')
,`order_date` datetime
,`note` varchar(255)
,`first_name` varchar(50)
,`last_name` varchar(50)
,`member_email` varchar(100)
,`item_count` bigint(21)
);

-- --------------------------------------------------------

--
-- 视图结构 `vm_finance_invoice_base`
--
DROP TABLE IF EXISTS `vm_finance_invoice_base`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vm_finance_invoice_base`  AS SELECT `i`.`invoice_id` AS `invoice_id`, `i`.`order_id` AS `order_id`, `o`.`store_id` AS `store_id`, `o`.`member_id` AS `member_id`, `o`.`order_status` AS `order_status`, `o`.`order_date` AS `order_date`, `i`.`invoice_status` AS `invoice_status`, `i`.`invoice_number` AS `invoice_number`, `i`.`issue_date` AS `issue_date`, `i`.`due_date` AS `due_date`, `i`.`update_date` AS `update_date`, `i`.`note` AS `note` FROM (`invoices` `i` join `orders` `o` on(`o`.`order_id` = `i`.`order_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vm_finance_invoice_paid_sum`
--
DROP TABLE IF EXISTS `vm_finance_invoice_paid_sum`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vm_finance_invoice_paid_sum`  AS SELECT `pa`.`invoice_id` AS `invoice_id`, round(sum(`pa`.`allocated_amount`),2) AS `paid_amount`, max(`pa`.`create_date`) AS `last_paid_at` FROM `payment_allocations` AS `pa` GROUP BY `pa`.`invoice_id` ;

-- --------------------------------------------------------

--
-- 视图结构 `vm_finance_invoice_payment_allocation_detail`
--
DROP TABLE IF EXISTS `vm_finance_invoice_payment_allocation_detail`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vm_finance_invoice_payment_allocation_detail`  AS SELECT `pa`.`invoice_id` AS `invoice_id`, `pa`.`payment_id` AS `payment_id`, `pa`.`create_date` AS `allocation_date`, `pa`.`allocated_amount` AS `allocated_amount`, `pa`.`note` AS `allocation_note`, `p`.`member_id` AS `member_id`, `p`.`payment_method` AS `payment_method`, `p`.`amount` AS `payment_amount`, `p`.`create_date` AS `payment_create_date`, `p`.`update_date` AS `payment_update_date`, `p`.`note` AS `payment_note` FROM (`payment_allocations` `pa` join `payments` `p` on(`p`.`payment_id` = `pa`.`payment_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vm_finance_order_amount_base`
--
DROP TABLE IF EXISTS `vm_finance_order_amount_base`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vm_finance_order_amount_base`  AS SELECT `o`.`order_id` AS `order_id`, `o`.`store_id` AS `store_id`, `o`.`member_id` AS `member_id`, `o`.`order_status` AS `order_status`, `o`.`order_date` AS `order_date`, `o`.`note` AS `note`, ifnull(sum(`oi`.`quantity` * `s`.`unit_price`),0) AS `gross_amount` FROM ((`orders` `o` left join `order_items` `oi` on(`oi`.`order_id` = `o`.`order_id`)) left join `skus` `s` on(`s`.`sku_id` = `oi`.`sku_id`)) GROUP BY `o`.`order_id`, `o`.`store_id`, `o`.`member_id`, `o`.`order_status`, `o`.`order_date`, `o`.`note` ;

-- --------------------------------------------------------

--
-- 视图结构 `vm_finance_order_member_rate`
--
DROP TABLE IF EXISTS `vm_finance_order_member_rate`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vm_finance_order_member_rate`  AS SELECT `o`.`order_id` AS `order_id`, `m`.`member_tier_id` AS `member_tier_id`, `t`.`discount_rate` AS `discount_rate`, `t`.`earn_point_rate` AS `earn_point_rate`, `t`.`min_lifetime_spend` AS `min_lifetime_spend` FROM ((`orders` `o` join `members` `m` on(`m`.`member_id` = `o`.`member_id`)) join `member_tiers` `t` on(`t`.`member_tier_id` = `m`.`member_tier_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vm_finance_order_paid_sum`
--
DROP TABLE IF EXISTS `vm_finance_order_paid_sum`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vm_finance_order_paid_sum`  AS SELECT `i`.`order_id` AS `order_id`, ifnull(sum(`pa`.`allocated_amount`),0) AS `paid_amount`, max(`pa`.`create_date`) AS `last_paid_at` FROM (`invoices` `i` left join `payment_allocations` `pa` on(`pa`.`invoice_id` = `i`.`invoice_id`)) GROUP BY `i`.`order_id` ;

-- --------------------------------------------------------

--
-- 视图结构 `vm_finance_order_points_summary`
--
DROP TABLE IF EXISTS `vm_finance_order_points_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vm_finance_order_points_summary`  AS SELECT `pl`.`order_id` AS `order_id`, sum(`pl`.`points_delta`) AS `points_net`, sum(case when `pl`.`points_delta` > 0 then `pl`.`points_delta` else 0 end) AS `points_earned`, sum(case when `pl`.`points_delta` < 0 then -`pl`.`points_delta` else 0 end) AS `points_redeemed` FROM `point_ledgers` AS `pl` GROUP BY `pl`.`order_id` ;

-- --------------------------------------------------------

--
-- 视图结构 `vm_finance_order_settlement`
--
DROP TABLE IF EXISTS `vm_finance_order_settlement`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vm_finance_order_settlement`  AS SELECT `b`.`order_id` AS `order_id`, `b`.`store_id` AS `store_id`, `b`.`member_id` AS `member_id`, `b`.`order_status` AS `order_status`, `b`.`order_date` AS `order_date`, `b`.`note` AS `note`, `r`.`discount_rate` AS `discount_rate`, `r`.`earn_point_rate` AS `earn_point_rate`, `b`.`gross_amount` AS `gross_amount`, round(`b`.`gross_amount` * `r`.`discount_rate`,2) AS `discounted_amount`, ifnull(`p`.`points_earned`,0) AS `earned_points`, ifnull(`p`.`points_redeemed`,0) AS `redeemed_points`, round(case when `r`.`earn_point_rate` is null or `r`.`earn_point_rate` = 0 then 0 else ifnull(`p`.`points_redeemed`,0) / `r`.`earn_point_rate` end,2) AS `points_discount_amount`, round(greatest(`b`.`gross_amount` * `r`.`discount_rate` - case when `r`.`earn_point_rate` is null or `r`.`earn_point_rate` = 0 then 0 else ifnull(`p`.`points_redeemed`,0) / `r`.`earn_point_rate` end,0),2) AS `payable_amount`, ifnull(`ps`.`paid_amount`,0) AS `paid_amount`, `ps`.`last_paid_at` AS `last_paid_at`, CASE WHEN ifnull(`ps`.`paid_amount`,0) >= round(greatest(`b`.`gross_amount` * `r`.`discount_rate` - case when `r`.`earn_point_rate` is null OR `r`.`earn_point_rate` = 0 then 0 else ifnull(`p`.`points_redeemed`,0) / `r`.`earn_point_rate` end,0),2) THEN 1 ELSE 0 END AS `is_settled`, floor(round(greatest(`b`.`gross_amount` * `r`.`discount_rate`,0),2) * `r`.`earn_point_rate`) AS `expected_earned_points` FROM (((`vm_finance_order_amount_base` `b` left join `vm_finance_order_member_rate` `r` on(`r`.`order_id` = `b`.`order_id`)) left join `vm_finance_order_points_summary` `p` on(`p`.`order_id` = `b`.`order_id`)) left join `vm_finance_order_paid_sum` `ps` on(`ps`.`order_id` = `b`.`order_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vm_invoice_settlement`
--
DROP TABLE IF EXISTS `vm_invoice_settlement`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vm_invoice_settlement`  AS SELECT `b`.`invoice_id` AS `invoice_id`, `b`.`invoice_number` AS `invoice_number`, `b`.`invoice_status` AS `invoice_status`, `b`.`issue_date` AS `issue_date`, `b`.`due_date` AS `due_date`, `b`.`update_date` AS `update_date`, `b`.`note` AS `note`, `b`.`order_id` AS `order_id`, `b`.`store_id` AS `store_id`, `b`.`member_id` AS `member_id`, `b`.`order_status` AS `order_status`, `b`.`order_date` AS `order_date`, `s`.`payable_amount` AS `invoice_amount`, ifnull(`ps`.`paid_amount`,0) AS `paid_amount`, round(greatest(ifnull(`s`.`payable_amount`,0) - ifnull(`ps`.`paid_amount`,0),0),2) AS `outstanding_amount`, `ps`.`last_paid_at` AS `last_paid_at`, CASE WHEN ifnull(`ps`.`paid_amount`,0) >= ifnull(`s`.`payable_amount`,0) AND `s`.`payable_amount` is not null THEN 1 ELSE 0 END AS `is_settled` FROM ((`vm_finance_invoice_base` `b` left join `vm_finance_invoice_paid_sum` `ps` on(`ps`.`invoice_id` = `b`.`invoice_id`)) left join `vm_finance_order_settlement` `s` on(`s`.`order_id` = `b`.`order_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_active_announcements`
--
DROP TABLE IF EXISTS `vw_active_announcements`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_active_announcements`  AS SELECT `announcements`.`announcement_id` AS `announcement_id`, `announcements`.`title` AS `title`, `announcements`.`content` AS `content`, `announcements`.`publish_at` AS `publish_at` FROM `announcements` WHERE `announcements`.`publish_at` <= current_timestamp() AND (`announcements`.`expire_at` is null OR `announcements`.`expire_at` >= current_timestamp()) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_auth_details`
--
DROP TABLE IF EXISTS `vw_auth_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_auth_details`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`username` AS `username`, `u`.`password_hash` AS `password_hash`, `u`.`user_types` AS `user_types`, `u`.`status` AS `status`, `j`.`name` AS `job_title` FROM ((`users` `u` left join `employees` `e` on(`u`.`user_id` = `e`.`user_id`)) left join `job_titles` `j` on(`e`.`job_title_id` = `j`.`job_title_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_customer_announcements`
--
DROP TABLE IF EXISTS `vw_customer_announcements`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_announcements`  AS SELECT `announcements`.`announcement_id` AS `announcement_id`, `announcements`.`title` AS `title`, `announcements`.`content` AS `content`, `announcements`.`publish_at` AS `publish_at`, `announcements`.`expire_at` AS `expire_at` FROM `announcements` WHERE `announcements`.`publish_at` <= current_timestamp() ORDER BY `announcements`.`publish_at` DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_customer_books`
--
DROP TABLE IF EXISTS `vw_customer_books`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_books`  AS SELECT `b`.`ISBN` AS `ISBN`, `b`.`name` AS `title`, `b`.`language` AS `language`, `b`.`publisher` AS `publisher`, `b`.`introduction` AS `description`, `s`.`sku_id` AS `sku_id`, `s`.`unit_price` AS `price`, `s`.`binding` AS `binding`, coalesce(sum(`ib`.`quantity`),0) AS `stock`, `st`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, (select group_concat(concat(`a`.`first_name`,' ',`a`.`last_name`) separator ', ') from (`book_authors` `ba` join `authors` `a` on(`ba`.`author_id` = `a`.`author_id`)) where `ba`.`ISBN` = `b`.`ISBN`) AS `author`, (select group_concat(`c`.`name` separator ', ') from (`book_categories` `bc` join `catagories` `c` on(`bc`.`category_id` = `c`.`category_id`)) where `bc`.`ISBN` = `b`.`ISBN`) AS `category`, (select count(0) from `favorites` `f` where `f`.`ISBN` = `b`.`ISBN`) AS `fav_count` FROM (((`books` `b` join `skus` `s` on(`b`.`ISBN` = `s`.`ISBN`)) left join `inventory_batches` `ib` on(`s`.`sku_id` = `ib`.`sku_id`)) left join `stores` `st` on(`ib`.`store_id` = `st`.`store_id`)) GROUP BY `b`.`ISBN`, `b`.`name`, `b`.`language`, `b`.`publisher`, `b`.`introduction`, `s`.`sku_id`, `s`.`unit_price`, `s`.`binding`, `st`.`store_id`, `st`.`name` ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_customer_book_detail`
--
DROP TABLE IF EXISTS `vw_customer_book_detail`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_book_detail`  AS SELECT `b`.`ISBN` AS `ISBN`, `b`.`name` AS `title`, `b`.`language` AS `language`, `b`.`publisher` AS `publisher`, `b`.`introduction` AS `description`, `s`.`sku_id` AS `sku_id`, `s`.`unit_price` AS `price`, `s`.`binding` AS `binding`, coalesce(sum(`ib`.`quantity`),0) AS `stock`, `st`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, (select group_concat(concat(`a`.`first_name`,' ',`a`.`last_name`) separator ', ') from (`book_authors` `ba` join `authors` `a` on(`ba`.`author_id` = `a`.`author_id`)) where `ba`.`ISBN` = `b`.`ISBN`) AS `author`, (select group_concat(distinct `a`.`country` separator ', ') from (`book_authors` `ba` join `authors` `a` on(`ba`.`author_id` = `a`.`author_id`)) where `ba`.`ISBN` = `b`.`ISBN`) AS `author_country`, (select group_concat(`c`.`name` separator ', ') from (`book_categories` `bc` join `catagories` `c` on(`bc`.`category_id` = `c`.`category_id`)) where `bc`.`ISBN` = `b`.`ISBN`) AS `category`, (select count(0) from `favorites` `f` where `f`.`ISBN` = `b`.`ISBN`) AS `fav_count` FROM (((`books` `b` join `skus` `s` on(`b`.`ISBN` = `s`.`ISBN`)) left join `inventory_batches` `ib` on(`s`.`sku_id` = `ib`.`sku_id`)) left join `stores` `st` on(`ib`.`store_id` = `st`.`store_id`)) GROUP BY `b`.`ISBN`, `b`.`name`, `b`.`language`, `b`.`publisher`, `b`.`introduction`, `s`.`sku_id`, `s`.`unit_price`, `s`.`binding`, `st`.`store_id`, `st`.`name` ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_customer_favorites`
--
DROP TABLE IF EXISTS `vw_customer_favorites`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_favorites`  AS SELECT `f`.`member_id` AS `member_id`, `f`.`ISBN` AS `ISBN`, `f`.`create_date` AS `create_date`, `b`.`name` AS `title`, `b`.`language` AS `language`, `b`.`publisher` AS `publisher`, `b`.`introduction` AS `description`, `s`.`sku_id` AS `sku_id`, `s`.`unit_price` AS `price`, `s`.`binding` AS `binding`, (select group_concat(concat(`a`.`first_name`,' ',`a`.`last_name`) separator ', ') from (`book_authors` `ba` join `authors` `a` on(`ba`.`author_id` = `a`.`author_id`)) where `ba`.`ISBN` = `b`.`ISBN`) AS `author`, (select group_concat(`c`.`name` separator ', ') from (`book_categories` `bc` join `catagories` `c` on(`bc`.`category_id` = `c`.`category_id`)) where `bc`.`ISBN` = `b`.`ISBN`) AS `category`, coalesce(sum(`ib`.`quantity`),0) AS `stock`, `st`.`name` AS `store_name` FROM ((((`favorites` `f` join `books` `b` on(`f`.`ISBN` = `b`.`ISBN`)) join `skus` `s` on(`b`.`ISBN` = `s`.`ISBN`)) left join `inventory_batches` `ib` on(`s`.`sku_id` = `ib`.`sku_id`)) left join `stores` `st` on(`ib`.`store_id` = `st`.`store_id`)) GROUP BY `f`.`member_id`, `f`.`ISBN`, `f`.`create_date`, `b`.`name`, `b`.`language`, `b`.`publisher`, `b`.`introduction`, `s`.`sku_id`, `s`.`unit_price`, `s`.`binding`, `st`.`name` ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_customer_member_info`
--
DROP TABLE IF EXISTS `vw_customer_member_info`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_member_info`  AS SELECT `m`.`member_id` AS `member_id`, `m`.`user_id` AS `user_id`, `m`.`first_name` AS `first_name`, `m`.`last_name` AS `last_name`, `m`.`email` AS `email`, `m`.`point` AS `points`, `m`.`address` AS `address`, `m`.`birthday` AS `birthday`, `mt`.`member_tier_id` AS `member_tier_id`, `mt`.`name` AS `tier_name`, `mt`.`discount_rate` AS `discount`, `mt`.`min_lifetime_spend` AS `min_total_spent`, coalesce((select sum(`oi`.`quantity` * `s`.`unit_price`) from ((`orders` `o` join `order_items` `oi` on(`o`.`order_id` = `oi`.`order_id`)) join `skus` `s` on(`oi`.`sku_id` = `s`.`sku_id`)) where `o`.`member_id` = `m`.`member_id` and `o`.`order_status` = 'paid'),0) AS `total_spent`, `u`.`username` AS `username` FROM ((`members` `m` join `member_tiers` `mt` on(`m`.`member_tier_id` = `mt`.`member_tier_id`)) join `users` `u` on(`m`.`user_id` = `u`.`user_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_customer_orders`
--
DROP TABLE IF EXISTS `vw_customer_orders`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_orders`  AS SELECT `o`.`order_id` AS `order_id`, `o`.`member_id` AS `member_id`, `o`.`store_id` AS `store_id`, `o`.`order_status` AS `order_status`, `o`.`order_date` AS `order_date`, `o`.`note` AS `note`, `st`.`name` AS `store_name`, (select sum(`oi`.`quantity` * `s`.`unit_price`) from (`order_items` `oi` join `skus` `s` on(`oi`.`sku_id` = `s`.`sku_id`)) where `oi`.`order_id` = `o`.`order_id`) AS `total_price`, (select sum(`oi`.`quantity`) from `order_items` `oi` where `oi`.`order_id` = `o`.`order_id`) AS `total_items` FROM (`orders` `o` join `stores` `st` on(`o`.`store_id` = `st`.`store_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_customer_order_items`
--
DROP TABLE IF EXISTS `vw_customer_order_items`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_order_items`  AS SELECT `oi`.`order_id` AS `order_id`, `oi`.`sku_id` AS `sku_id`, `oi`.`quantity` AS `quantity`, `b`.`ISBN` AS `ISBN`, `b`.`name` AS `book_title`, `b`.`publisher` AS `publisher`, `b`.`language` AS `language`, `s`.`unit_price` AS `price`, `s`.`binding` AS `binding`, `oi`.`quantity`* `s`.`unit_price` AS `subtotal`, (select group_concat(concat(`a`.`first_name`,' ',`a`.`last_name`) separator ', ') from (`book_authors` `ba` join `authors` `a` on(`ba`.`author_id` = `a`.`author_id`)) where `ba`.`ISBN` = `b`.`ISBN`) AS `author` FROM ((`order_items` `oi` join `skus` `s` on(`oi`.`sku_id` = `s`.`sku_id`)) join `books` `b` on(`s`.`ISBN` = `b`.`ISBN`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_customer_point_history`
--
DROP TABLE IF EXISTS `vw_customer_point_history`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_point_history`  AS SELECT `pl`.`point_ledger_id` AS `point_ledger_id`, `pl`.`member_id` AS `member_id`, concat(`m`.`first_name`,' ',`m`.`last_name`) AS `member_name`, `pl`.`points_change` AS `points_change`, `pl`.`order_id` AS `order_id`, CASE WHEN `pl`.`points_change` > 0 THEN 'Earned' WHEN `pl`.`points_change` < 0 THEN 'Spent' ELSE 'Adjusted' END AS `change_type`, `pl`.`change_date` AS `change_date`, `pl`.`reason` AS `reason`, `m`.`point` AS `current_points` FROM (`point_ledgers` `pl` join `members` `m` on(`pl`.`member_id` = `m`.`member_id`)) ORDER BY `pl`.`change_date` DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_customer_point_summary`
--
DROP TABLE IF EXISTS `vw_customer_point_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_customer_point_summary`  AS SELECT `m`.`member_id` AS `member_id`, concat(`m`.`first_name`,' ',`m`.`last_name`) AS `member_name`, `m`.`point` AS `current_points`, coalesce(sum(case when `pl`.`points_change` > 0 then `pl`.`points_change` else 0 end),0) AS `total_earned`, coalesce(sum(case when `pl`.`points_change` < 0 then abs(`pl`.`points_change`) else 0 end),0) AS `total_spent`, count(`pl`.`point_ledger_id`) AS `total_transactions`, max(`pl`.`change_date`) AS `last_transaction_date` FROM (`members` `m` left join `point_ledgers` `pl` on(`m`.`member_id` = `pl`.`member_id`)) GROUP BY `m`.`member_id`, `m`.`first_name`, `m`.`last_name`, `m`.`point` ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_finance_invoice_list`
--
DROP TABLE IF EXISTS `vw_finance_invoice_list`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_finance_invoice_list`  AS SELECT `i`.`invoice_id` AS `invoice_id`, `i`.`invoice_number` AS `invoice_number`, `i`.`order_id` AS `order_id`, `i`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, `i`.`member_id` AS `member_id`, concat(`m`.`first_name`,' ',`m`.`last_name`) AS `member_name`, `i`.`invoice_status` AS `invoice_status`, `i`.`issue_date` AS `issue_date`, `i`.`due_date` AS `due_date`, `i`.`invoice_amount` AS `invoice_amount`, `i`.`paid_amount` AS `paid_amount`, `i`.`outstanding_amount` AS `outstanding_amount`, `i`.`last_paid_at` AS `last_paid_at`, `i`.`is_settled` AS `is_settled`, CASE WHEN `i`.`invoice_status` in ('voided','credited') THEN 'VOID' WHEN `i`.`is_settled` = 1 THEN 'PAID' WHEN `i`.`paid_amount` > 0 THEN 'PARTIAL' WHEN `i`.`due_date` < current_timestamp() THEN 'OVERDUE' ELSE 'UNPAID' END AS `display_status` FROM ((`vm_invoice_settlement` `i` join `stores` `st` on(`st`.`store_id` = `i`.`store_id`)) join `members` `m` on(`m`.`member_id` = `i`.`member_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_finance_order_list`
--
DROP TABLE IF EXISTS `vw_finance_order_list`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_finance_order_list`  AS SELECT `o`.`order_id` AS `order_id`, `o`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, `o`.`member_id` AS `member_id`, concat(`m`.`first_name`,' ',`m`.`last_name`) AS `member_name`, `o`.`order_status` AS `order_status`, `o`.`order_date` AS `order_date`, `o`.`note` AS `note`, `o`.`payable_amount` AS `payable_amount`, `o`.`paid_amount` AS `paid_amount`, `o`.`is_settled` AS `is_settled`, count(`oi`.`sku_id`) AS `item_count`, coalesce(sum(`oi`.`quantity`),0) AS `total_quantity` FROM (((`vm_finance_order_settlement` `o` join `stores` `st` on(`st`.`store_id` = `o`.`store_id`)) join `members` `m` on(`m`.`member_id` = `o`.`member_id`)) left join `order_items` `oi` on(`oi`.`order_id` = `o`.`order_id`)) GROUP BY `o`.`order_id`, `o`.`store_id`, `st`.`name`, `o`.`member_id`, `m`.`first_name`, `m`.`last_name`, `o`.`order_status`, `o`.`order_date`, `o`.`note`, `o`.`payable_amount`, `o`.`paid_amount`, `o`.`is_settled` ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_finance_purchase_cost_by_date`
--
DROP TABLE IF EXISTS `vw_finance_purchase_cost_by_date`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_finance_purchase_cost_by_date`  AS SELECT cast(`inventory_batches`.`received_date` as date) AS `cost_day`, sum(`inventory_batches`.`unit_cost` * `inventory_batches`.`quantity`) AS `cost` FROM `inventory_batches` GROUP BY cast(`inventory_batches`.`received_date` as date) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_finance_revenue_by_date`
--
DROP TABLE IF EXISTS `vw_finance_revenue_by_date`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_finance_revenue_by_date`  AS SELECT cast(`vm_finance_order_settlement`.`order_date` as date) AS `order_day`, sum(`vm_finance_order_settlement`.`payable_amount`) AS `revenue` FROM `vm_finance_order_settlement` WHERE `vm_finance_order_settlement`.`is_settled` = 1 GROUP BY cast(`vm_finance_order_settlement`.`order_date` as date) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_bestsellers`
--
DROP TABLE IF EXISTS `vw_manager_bestsellers`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_bestsellers`  AS SELECT `b`.`ISBN` AS `ISBN`, `b`.`name` AS `book_name`, `b`.`publisher` AS `publisher`, `b`.`language` AS `language`, (select group_concat(distinct `c`.`name` separator ', ') from (`book_categories` `bc` join `catagories` `c` on(`bc`.`category_id` = `c`.`category_id`)) where `bc`.`ISBN` = `b`.`ISBN`) AS `categories`, count(distinct `o`.`order_id`) AS `orders_count`, coalesce(sum(`oi`.`quantity`),0) AS `total_sold`, coalesce(sum(`oi`.`quantity` * `s`.`unit_price`),0) AS `total_revenue`, avg(`s`.`unit_price`) AS `avg_price`, count(distinct `o`.`store_id`) AS `stores_sold_in`, count(distinct `o`.`member_id`) AS `unique_buyers`, rank() over ( order by sum(`oi`.`quantity`) desc) AS `sales_rank` FROM (((`books` `b` join `skus` `s` on(`b`.`ISBN` = `s`.`ISBN`)) join `order_items` `oi` on(`s`.`sku_id` = `oi`.`sku_id`)) join `orders` `o` on(`oi`.`order_id` = `o`.`order_id` and `o`.`order_status` in ('paid','finished'))) GROUP BY `b`.`ISBN`, `b`.`name`, `b`.`publisher`, `b`.`language` ORDER BY coalesce(sum(`oi`.`quantity`),0) DESC LIMIT 0, 50 ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_employees`
--
DROP TABLE IF EXISTS `vw_manager_employees`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_employees`  AS SELECT `e`.`employee_id` AS `employee_id`, `e`.`user_id` AS `user_id`, `e`.`first_name` AS `first_name`, `e`.`last_name` AS `last_name`, concat(`e`.`first_name`,' ',`e`.`last_name`) AS `full_name`, `e`.`phone` AS `phone`, `e`.`performance` AS `performance`, `e`.`store_id` AS `store_id`, `s`.`name` AS `store_name`, `s`.`address` AS `store_address`, `s`.`status` AS `store_status`, `e`.`job_title_id` AS `job_title_id`, `jt`.`name` AS `job_title`, `jt`.`base_salary` AS `base_salary`, `u`.`username` AS `username`, `u`.`user_types` AS `user_type` FROM (((`employees` `e` join `stores` `s` on(`e`.`store_id` = `s`.`store_id`)) join `job_titles` `jt` on(`e`.`job_title_id` = `jt`.`job_title_id`)) left join `users` `u` on(`e`.`user_id` = `u`.`user_id`)) ORDER BY `e`.`store_id` ASC, `jt`.`base_salary` DESC, `e`.`last_name` ASC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_employee_performance`
--
DROP TABLE IF EXISTS `vw_manager_employee_performance`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_employee_performance`  AS SELECT `e`.`employee_id` AS `employee_id`, concat(`e`.`first_name`,' ',`e`.`last_name`) AS `employee_name`, `e`.`performance` AS `performance`, `jt`.`name` AS `job_title`, `s`.`name` AS `store_name`, CASE WHEN `e`.`performance` >= 90 THEN 'Excellent' WHEN `e`.`performance` >= 75 THEN 'Good' WHEN `e`.`performance` >= 60 THEN 'Average' ELSE 'Needs Improvement' END AS `performance_rating`, `jt`.`base_salary` AS `base_salary`, round(`e`.`performance` * `jt`.`base_salary` * 0.001,2) AS `potential_bonus` FROM ((`employees` `e` join `job_titles` `jt` on(`e`.`job_title_id` = `jt`.`job_title_id`)) join `stores` `s` on(`e`.`store_id` = `s`.`store_id`)) ORDER BY `e`.`performance` DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_inventory_by_sku`
--
DROP TABLE IF EXISTS `vw_manager_inventory_by_sku`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_inventory_by_sku`  AS SELECT `s`.`sku_id` AS `sku_id`, `b`.`ISBN` AS `ISBN`, `b`.`name` AS `book_name`, `s`.`binding` AS `binding`, `s`.`unit_price` AS `unit_price`, `ib`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, coalesce(sum(`ib`.`quantity`),0) AS `store_stock`, avg(`ib`.`unit_cost`) AS `avg_cost`, min(`ib`.`received_date`) AS `earliest_batch`, max(`ib`.`received_date`) AS `latest_batch`, count(`ib`.`batch_id`) AS `batch_count` FROM (((`skus` `s` join `books` `b` on(`s`.`ISBN` = `b`.`ISBN`)) left join `inventory_batches` `ib` on(`s`.`sku_id` = `ib`.`sku_id`)) left join `stores` `st` on(`ib`.`store_id` = `st`.`store_id`)) GROUP BY `s`.`sku_id`, `b`.`ISBN`, `b`.`name`, `s`.`binding`, `s`.`unit_price`, `ib`.`store_id`, `st`.`name` ORDER BY `s`.`sku_id` ASC, coalesce(sum(`ib`.`quantity`),0) DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_inventory_by_store`
--
DROP TABLE IF EXISTS `vw_manager_inventory_by_store`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_inventory_by_store`  AS SELECT `st`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, `b`.`ISBN` AS `ISBN`, `b`.`name` AS `book_name`, `s`.`sku_id` AS `sku_id`, `s`.`binding` AS `binding`, `s`.`unit_price` AS `unit_price`, coalesce(sum(`ib`.`quantity`),0) AS `total_quantity`, avg(`ib`.`unit_cost`) AS `avg_cost`, count(distinct `ib`.`batch_id`) AS `batch_count`, max(`ib`.`received_date`) AS `last_inbound_date`, CASE WHEN coalesce(sum(`ib`.`quantity`),0) > 20 THEN 'High' WHEN coalesce(sum(`ib`.`quantity`),0) > 10 THEN 'Medium' WHEN coalesce(sum(`ib`.`quantity`),0) > 0 THEN 'Low' ELSE 'Out of Stock' END AS `stock_status` FROM (((`stores` `st` left join `inventory_batches` `ib` on(`st`.`store_id` = `ib`.`store_id`)) left join `skus` `s` on(`ib`.`sku_id` = `s`.`sku_id`)) left join `books` `b` on(`s`.`ISBN` = `b`.`ISBN`)) GROUP BY `st`.`store_id`, `st`.`name`, `b`.`ISBN`, `b`.`name`, `s`.`sku_id`, `s`.`binding`, `s`.`unit_price` ORDER BY `st`.`store_id` ASC, coalesce(sum(`ib`.`quantity`),0) DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_inventory_overview`
--
DROP TABLE IF EXISTS `vw_manager_inventory_overview`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_inventory_overview`  AS SELECT `b`.`ISBN` AS `ISBN`, `b`.`name` AS `book_name`, `b`.`publisher` AS `publisher`, `b`.`language` AS `language`, `s`.`sku_id` AS `sku_id`, `s`.`binding` AS `binding`, `s`.`unit_price` AS `unit_price`, coalesce(sum(`ib`.`quantity`),0) AS `total_stock`, count(distinct `ib`.`store_id`) AS `stores_count`, avg(`ib`.`unit_cost`) AS `avg_cost`, min(`ib`.`received_date`) AS `earliest_received`, max(`ib`.`received_date`) AS `latest_received`, (select group_concat(concat(`a`.`first_name`,' ',`a`.`last_name`) separator ', ') from (`book_authors` `ba` join `authors` `a` on(`ba`.`author_id` = `a`.`author_id`)) where `ba`.`ISBN` = `b`.`ISBN`) AS `authors`, (select group_concat(`c`.`name` separator ', ') from (`book_categories` `bc` join `catagories` `c` on(`bc`.`category_id` = `c`.`category_id`)) where `bc`.`ISBN` = `b`.`ISBN`) AS `categories`, CASE WHEN coalesce(sum(`ib`.`quantity`),0) > 50 THEN 'High' WHEN coalesce(sum(`ib`.`quantity`),0) > 20 THEN 'Medium' WHEN coalesce(sum(`ib`.`quantity`),0) > 0 THEN 'Low' ELSE 'Out of Stock' END AS `stock_level` FROM ((`books` `b` join `skus` `s` on(`b`.`ISBN` = `s`.`ISBN`)) left join `inventory_batches` `ib` on(`s`.`sku_id` = `ib`.`sku_id`)) GROUP BY `b`.`ISBN`, `b`.`name`, `b`.`publisher`, `b`.`language`, `s`.`sku_id`, `s`.`binding`, `s`.`unit_price` ORDER BY coalesce(sum(`ib`.`quantity`),0) DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_orders_summary`
--
DROP TABLE IF EXISTS `vw_manager_orders_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_orders_summary`  AS SELECT `o`.`order_id` AS `order_id`, `o`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, `o`.`member_id` AS `member_id`, concat(`m`.`first_name`,' ',`m`.`last_name`) AS `member_name`, `m`.`email` AS `member_email`, `o`.`order_status` AS `order_status`, `o`.`order_date` AS `order_date`, `o`.`note` AS `note`, count(distinct `oi`.`sku_id`) AS `items_count`, coalesce(sum(`oi`.`quantity`),0) AS `total_items`, coalesce(sum(`oi`.`quantity` * `s`.`unit_price`),0) AS `order_total`, `p`.`payment_method` AS `payment_method`, `p`.`amount` AS `paid_amount`, `p`.`create_date` AS `payment_date` FROM (((((((`orders` `o` join `stores` `st` on(`o`.`store_id` = `st`.`store_id`)) join `members` `m` on(`o`.`member_id` = `m`.`member_id`)) left join `order_items` `oi` on(`o`.`order_id` = `oi`.`order_id`)) left join `skus` `s` on(`oi`.`sku_id` = `s`.`sku_id`)) left join `invoices` `inv` on(`o`.`order_id` = `inv`.`order_id`)) left join `payment_allocations` `pa` on(`inv`.`invoice_id` = `pa`.`invoice_id`)) left join `payments` `p` on(`pa`.`payment_id` = `p`.`payment_id`)) GROUP BY `o`.`order_id`, `o`.`store_id`, `st`.`name`, `o`.`member_id`, `m`.`first_name`, `m`.`last_name`, `m`.`email`, `o`.`order_status`, `o`.`order_date`, `o`.`note`, `p`.`payment_method`, `p`.`amount`, `p`.`create_date` ORDER BY `o`.`order_date` DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_payment_analysis`
--
DROP TABLE IF EXISTS `vw_manager_payment_analysis`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_payment_analysis`  AS SELECT `p`.`payment_method` AS `payment_method`, count(0) AS `payment_count`, coalesce(sum(`p`.`amount`),0) AS `total_amount`, round(avg(`p`.`amount`),2) AS `avg_amount`, min(`p`.`amount`) AS `min_amount`, max(`p`.`amount`) AS `max_amount`, (select count(distinct `o`.`store_id`) from ((`payment_allocations` `pa` join `invoices` `inv` on(`pa`.`invoice_id` = `inv`.`invoice_id`)) join `orders` `o` on(`inv`.`order_id` = `o`.`order_id`)) where `pa`.`payment_id` in (select `p2`.`payment_id` from `payments` `p2` where `p2`.`payment_method` = `p`.`payment_method`)) AS `stores_count`, cast(min(`p`.`create_date`) as date) AS `first_payment_date`, cast(max(`p`.`create_date`) as date) AS `last_payment_date`, round(coalesce(sum(`p`.`amount`),0) / nullif((select sum(`payments`.`amount`) from `payments`),0) * 100,2) AS `percentage_of_total` FROM `payments` AS `p` GROUP BY `p`.`payment_method` ORDER BY coalesce(sum(`p`.`amount`),0) DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_purchases`
--
DROP TABLE IF EXISTS `vw_manager_purchases`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_purchases`  AS SELECT `p`.`purchase_id` AS `purchase_id`, `p`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, `p`.`supplier_id` AS `supplier_id`, `sup`.`name` AS `supplier_name`, `sup`.`phone` AS `supplier_phone`, `p`.`purchase_date` AS `purchase_date`, `p`.`note` AS `note`, count(distinct `pi`.`sku_id`) AS `items_count`, coalesce(sum(`pi`.`quantity`),0) AS `total_quantity`, coalesce(sum(`pi`.`quantity` * `ib`.`unit_cost`),0) AS `estimated_cost` FROM ((((`purchases` `p` join `stores` `st` on(`p`.`store_id` = `st`.`store_id`)) join `suppliers` `sup` on(`p`.`supplier_id` = `sup`.`supplier_id`)) left join `purchase_items` `pi` on(`p`.`purchase_id` = `pi`.`purchase_id`)) left join `inventory_batches` `ib` on(`pi`.`sku_id` = `ib`.`sku_id` and `p`.`purchase_id` = `ib`.`purchase_id`)) GROUP BY `p`.`purchase_id`, `p`.`store_id`, `st`.`name`, `p`.`supplier_id`, `sup`.`name`, `sup`.`phone`, `p`.`purchase_date`, `p`.`note` ORDER BY `p`.`purchase_date` DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_replenishment_requests`
--
DROP TABLE IF EXISTS `vw_manager_replenishment_requests`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_replenishment_requests`  AS SELECT `rr`.`request_id` AS `request_id`, `rr`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, `rr`.`sku_id` AS `sku_id`, `sk`.`ISBN` AS `ISBN`, `b`.`name` AS `book_name`, `sk`.`binding` AS `binding`, `rr`.`requested_quantity` AS `requested_quantity`, 1 AS `sku_count`, `rr`.`requested_quantity` AS `total_quantity`, `rr`.`urgency_level` AS `urgency_level`, `rr`.`status` AS `status`, `rr`.`request_date` AS `request_date`, `rr`.`requested_by` AS `requested_by`, concat(`e1`.`first_name`,' ',`e1`.`last_name`) AS `requested_by_name`, `rr`.`reason` AS `reason`, `rr`.`approved_by` AS `approved_by`, concat(`e2`.`first_name`,' ',`e2`.`last_name`) AS `approved_by_name`, `rr`.`approval_date` AS `approval_date`, `rr`.`rejection_reason` AS `rejection_reason`, `rr`.`rejection_date` AS `rejection_date`, `rr`.`completed_date` AS `completed_date`, `rr`.`note` AS `note`, coalesce(sum(`ib`.`quantity`),0) AS `current_stock` FROM ((((((`replenishment_requests` `rr` join `stores` `st` on(`rr`.`store_id` = `st`.`store_id`)) join `skus` `sk` on(`rr`.`sku_id` = `sk`.`sku_id`)) join `books` `b` on(`sk`.`ISBN` = `b`.`ISBN`)) left join `employees` `e1` on(`rr`.`requested_by` = `e1`.`employee_id`)) left join `employees` `e2` on(`rr`.`approved_by` = `e2`.`employee_id`)) left join `inventory_batches` `ib` on(`rr`.`sku_id` = `ib`.`sku_id` and `rr`.`store_id` = `ib`.`store_id`)) GROUP BY `rr`.`request_id`, `rr`.`store_id`, `st`.`name`, `rr`.`sku_id`, `sk`.`ISBN`, `b`.`name`, `sk`.`binding`, `rr`.`requested_quantity`, `rr`.`urgency_level`, `rr`.`status`, `rr`.`request_date`, `rr`.`requested_by`, `e1`.`first_name`, `e1`.`last_name`, `rr`.`reason`, `rr`.`approved_by`, `e2`.`first_name`, `e2`.`last_name`, `rr`.`approval_date`, `rr`.`rejection_reason`, `rr`.`rejection_date`, `rr`.`completed_date`, `rr`.`note` ORDER BY `rr`.`request_date` DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_sales_by_category`
--
DROP TABLE IF EXISTS `vw_manager_sales_by_category`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_sales_by_category`  AS SELECT `c`.`category_id` AS `category_id`, `c`.`name` AS `category_name`, count(distinct `o`.`order_id`) AS `orders_count`, coalesce(sum(`oi`.`quantity`),0) AS `total_quantity_sold`, coalesce(sum(`oi`.`quantity` * `s`.`unit_price` / nullif((select count(0) from `book_categories` `bc2` where `bc2`.`ISBN` = `b`.`ISBN`),0)),0) AS `total_sales`, avg(`s`.`unit_price`) AS `avg_price`, count(distinct `b`.`ISBN`) AS `books_in_category`, round(coalesce(sum(`oi`.`quantity` * `s`.`unit_price` / nullif((select count(0) from `book_categories` `bc2` where `bc2`.`ISBN` = `b`.`ISBN`),0)),0) / nullif((select sum(`oi2`.`quantity` * `s2`.`unit_price`) from ((`order_items` `oi2` join `skus` `s2` on(`oi2`.`sku_id` = `s2`.`sku_id`)) join `orders` `o2` on(`oi2`.`order_id` = `o2`.`order_id`)) where `o2`.`order_status` = 'paid'),0) * 100,2) AS `revenue_percentage` FROM (((((`catagories` `c` join `book_categories` `bc` on(`c`.`category_id` = `bc`.`category_id`)) join `books` `b` on(`bc`.`ISBN` = `b`.`ISBN`)) join `skus` `s` on(`b`.`ISBN` = `s`.`ISBN`)) left join `order_items` `oi` on(`s`.`sku_id` = `oi`.`sku_id`)) left join `orders` `o` on(`oi`.`order_id` = `o`.`order_id` and `o`.`order_status` = 'paid')) GROUP BY `c`.`category_id`, `c`.`name` ORDER BY coalesce(sum(`oi`.`quantity` * `s`.`unit_price` / nullif((select count(0) from `book_categories` `bc2` where `bc2`.`ISBN` = `b`.`ISBN`),0)),0) DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_sales_by_store`
--
DROP TABLE IF EXISTS `vw_manager_sales_by_store`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_sales_by_store`  AS SELECT `st`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, `st`.`status` AS `store_status`, count(distinct `o`.`order_id`) AS `total_orders`, count(distinct case when `o`.`order_status` in ('paid','finished') then `o`.`order_id` end) AS `paid_orders`, count(distinct `o`.`member_id`) AS `unique_customers`, coalesce(sum(case when `o`.`order_status` in ('paid','finished') then `oi`.`quantity` * `s`.`unit_price` else 0 end),0) AS `total_revenue`, avg(case when `o`.`order_status` in ('paid','finished') then `oi`.`quantity` * `s`.`unit_price` end) AS `avg_order_value`, coalesce(sum(case when `o`.`order_status` in ('paid','finished') then `oi`.`quantity` else 0 end),0) AS `total_items_sold`, cast(max(`o`.`order_date`) as date) AS `last_order_date` FROM (((`stores` `st` left join `orders` `o` on(`st`.`store_id` = `o`.`store_id`)) left join `order_items` `oi` on(`o`.`order_id` = `oi`.`order_id`)) left join `skus` `s` on(`oi`.`sku_id` = `s`.`sku_id`)) GROUP BY `st`.`store_id`, `st`.`name`, `st`.`status` ORDER BY coalesce(sum(case when `o`.`order_status` in ('paid','finished') then `oi`.`quantity` * `s`.`unit_price` else 0 end),0) DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_staff_by_store`
--
DROP TABLE IF EXISTS `vw_manager_staff_by_store`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_staff_by_store`  AS SELECT `s`.`store_id` AS `store_id`, `s`.`name` AS `store_name`, `s`.`status` AS `store_status`, count(distinct `e`.`employee_id`) AS `total_employees`, sum(case when `jt`.`name` = 'General Manager' then 1 else 0 end) AS `managers_count`, sum(case when `jt`.`name` = 'Finance' then 1 else 0 end) AS `finance_count`, sum(case when `jt`.`name` = 'Staff' then 1 else 0 end) AS `staff_count`, round(avg(`e`.`performance`),2) AS `avg_performance`, sum(`jt`.`base_salary`) AS `total_salary_cost` FROM ((`stores` `s` left join `employees` `e` on(`s`.`store_id` = `e`.`store_id`)) left join `job_titles` `jt` on(`e`.`job_title_id` = `jt`.`job_title_id`)) GROUP BY `s`.`store_id`, `s`.`name`, `s`.`status` ORDER BY count(distinct `e`.`employee_id`) DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_manager_suppliers`
--
DROP TABLE IF EXISTS `vw_manager_suppliers`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_suppliers`  AS SELECT `s`.`supplier_id` AS `supplier_id`, `s`.`name` AS `supplier_name`, `s`.`phone` AS `phone`, `s`.`address` AS `address`, `s`.`email` AS `email`, count(distinct `p`.`purchase_id`) AS `total_purchases`, count(distinct `p`.`store_id`) AS `stores_served`, max(`p`.`purchase_date`) AS `last_purchase_date`, coalesce(sum(`pi`.`quantity`),0) AS `total_items_supplied`, coalesce(sum(`pi`.`quantity` * `ib`.`unit_cost`),0) AS `total_purchase_value` FROM (((`suppliers` `s` left join `purchases` `p` on(`s`.`supplier_id` = `p`.`supplier_id`)) left join `purchase_items` `pi` on(`p`.`purchase_id` = `pi`.`purchase_id`)) left join `inventory_batches` `ib` on(`pi`.`sku_id` = `ib`.`sku_id` and `p`.`purchase_id` = `ib`.`purchase_id`)) GROUP BY `s`.`supplier_id`, `s`.`name`, `s`.`phone`, `s`.`address`, `s`.`email` ORDER BY coalesce(sum(`pi`.`quantity` * `ib`.`unit_cost`),0) DESC ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_staff_details`
--
DROP TABLE IF EXISTS `vw_staff_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_staff_details`  AS SELECT `u`.`user_id` AS `user_id`, `u`.`username` AS `username`, `u`.`status` AS `account_status`, `e`.`employee_id` AS `employee_id`, `e`.`first_name` AS `first_name`, `e`.`last_name` AS `last_name`, concat(`e`.`first_name`,' ',`e`.`last_name`) AS `full_name`, `j`.`name` AS `job_title`, `s`.`store_id` AS `store_id`, `s`.`name` AS `store_name`, `s`.`status` AS `store_status` FROM (((`users` `u` join `employees` `e` on(`u`.`user_id` = `e`.`user_id`)) join `stores` `s` on(`e`.`store_id` = `s`.`store_id`)) join `job_titles` `j` on(`e`.`job_title_id` = `j`.`job_title_id`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_staff_inventory_details`
--
DROP TABLE IF EXISTS `vw_staff_inventory_details`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_staff_inventory_details`  AS SELECT `ib`.`batch_id` AS `batch_id`, `ib`.`store_id` AS `store_id`, `ib`.`quantity` AS `quantity`, `ib`.`unit_cost` AS `unit_cost`, `ib`.`received_date` AS `received_date`, `ib`.`batch_code` AS `batch_code`, `s`.`sku_id` AS `sku_id`, `s`.`unit_price` AS `unit_price`, `s`.`binding` AS `binding`, `b`.`ISBN` AS `ISBN`, `b`.`name` AS `book_name`, `b`.`publisher` AS `publisher`, `b`.`language` AS `language` FROM ((`inventory_batches` `ib` join `skus` `s` on(`ib`.`sku_id` = `s`.`sku_id`)) join `books` `b` on(`s`.`ISBN` = `b`.`ISBN`)) ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_staff_low_stock`
--
DROP TABLE IF EXISTS `vw_staff_low_stock`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_staff_low_stock`  AS SELECT `s`.`sku_id` AS `sku_id`, `b`.`ISBN` AS `ISBN`, `b`.`name` AS `book_name`, `s`.`binding` AS `binding`, `ib`.`store_id` AS `store_id`, coalesce(sum(`ib`.`quantity`),0) AS `total_stock` FROM ((`skus` `s` join `books` `b` on(`s`.`ISBN` = `b`.`ISBN`)) left join `inventory_batches` `ib` on(`s`.`sku_id` = `ib`.`sku_id`)) GROUP BY `s`.`sku_id`, `b`.`ISBN`, `b`.`name`, `s`.`binding`, `ib`.`store_id` ;

-- --------------------------------------------------------

--
-- 视图结构 `vw_staff_order_summary`
--
DROP TABLE IF EXISTS `vw_staff_order_summary`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_staff_order_summary`  AS SELECT `o`.`order_id` AS `order_id`, `o`.`store_id` AS `store_id`, `o`.`order_status` AS `order_status`, `o`.`order_date` AS `order_date`, `o`.`note` AS `note`, `m`.`first_name` AS `first_name`, `m`.`last_name` AS `last_name`, `m`.`email` AS `member_email`, count(`oi`.`sku_id`) AS `item_count` FROM ((`orders` `o` join `members` `m` on(`o`.`member_id` = `m`.`member_id`)) left join `order_items` `oi` on(`o`.`order_id` = `oi`.`order_id`)) GROUP BY `o`.`order_id`, `o`.`store_id`, `o`.`order_status`, `o`.`order_date`, `o`.`note`, `m`.`first_name`, `m`.`last_name`, `m`.`email` ;

--
-- 转储表的索引
--

--
-- 表的索引 `announcements`
--
ALTER TABLE `announcements`
  ADD PRIMARY KEY (`announcement_id`);

--
-- 表的索引 `authors`
--
ALTER TABLE `authors`
  ADD PRIMARY KEY (`author_id`);
ALTER TABLE `authors` ADD FULLTEXT KEY `ft_authors_name` (`first_name`,`last_name`);

--
-- 表的索引 `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`ISBN`);
ALTER TABLE `books` ADD FULLTEXT KEY `ft_books_text` (`name`,`introduction`,`publisher`);

--
-- 表的索引 `book_authors`
--
ALTER TABLE `book_authors`
  ADD PRIMARY KEY (`author_id`,`ISBN`),
  ADD KEY `fk_book_authors_authors1_idx` (`author_id`),
  ADD KEY `fk_book_authors_books1_idx` (`ISBN`);

--
-- 表的索引 `book_categories`
--
ALTER TABLE `book_categories`
  ADD PRIMARY KEY (`category_id`,`ISBN`),
  ADD KEY `fk_book_categories_catagories1_idx` (`category_id`),
  ADD KEY `fk_book_categories_books1_idx` (`ISBN`);

--
-- 表的索引 `catagories`
--
ALTER TABLE `catagories`
  ADD PRIMARY KEY (`category_id`);
ALTER TABLE `catagories` ADD FULLTEXT KEY `ft_categories_name` (`name`);

--
-- 表的索引 `employees`
--
ALTER TABLE `employees`
  ADD PRIMARY KEY (`employee_id`),
  ADD UNIQUE KEY `phone_UNIQUE` (`phone`),
  ADD KEY `fk_employees_job_titles1_idx` (`job_title_id`),
  ADD KEY `fk_employees_stores1_idx` (`store_id`),
  ADD KEY `fk_employees_users1_idx` (`user_id`);
ALTER TABLE `employees` ADD FULLTEXT KEY `ft_employees_name` (`first_name`,`last_name`);

--
-- 表的索引 `favorites`
--
ALTER TABLE `favorites`
  ADD PRIMARY KEY (`member_id`,`ISBN`),
  ADD KEY `fk_favorites_members1_idx` (`member_id`),
  ADD KEY `fk_favorites_books1_idx` (`ISBN`);

--
-- 表的索引 `inventory_batches`
--
ALTER TABLE `inventory_batches`
  ADD PRIMARY KEY (`batch_id`),
  ADD KEY `fk_inventories_SKUs1_idx` (`sku_id`),
  ADD KEY `fk_inventories_stores1_idx` (`store_id`),
  ADD KEY `fk_inventory_batches_purchases1_idx` (`purchase_id`);

--
-- 表的索引 `invoices`
--
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`invoice_id`),
  ADD KEY `fk_invoices_orders1_idx` (`order_id`);

--
-- 表的索引 `job_titles`
--
ALTER TABLE `job_titles`
  ADD PRIMARY KEY (`job_title_id`),
  ADD UNIQUE KEY `name_UNIQUE` (`name`);

--
-- 表的索引 `members`
--
ALTER TABLE `members`
  ADD PRIMARY KEY (`member_id`),
  ADD UNIQUE KEY `email_UNIQUE` (`email`),
  ADD KEY `fk_members_users1_idx` (`user_id`),
  ADD KEY `fk_members_member_tiers1_idx` (`member_tier_id`);
ALTER TABLE `members` ADD FULLTEXT KEY `ft_members_name` (`first_name`,`last_name`);

--
-- 表的索引 `member_tiers`
--
ALTER TABLE `member_tiers`
  ADD PRIMARY KEY (`member_tier_id`),
  ADD UNIQUE KEY `name_UNIQUE` (`name`);

--
-- 表的索引 `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`order_id`),
  ADD KEY `fk_orders_stores1_idx` (`store_id`),
  ADD KEY `fk_orders_members1_idx` (`member_id`);

--
-- 表的索引 `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`sku_id`,`order_id`),
  ADD KEY `fk_order_items_SKUs1_idx` (`sku_id`),
  ADD KEY `fk_order_items_orders1_idx` (`order_id`);

--
-- 表的索引 `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`payment_id`),
  ADD KEY `fk_payments_members1_idx` (`member_id`);

--
-- 表的索引 `payment_allocations`
--
ALTER TABLE `payment_allocations`
  ADD PRIMARY KEY (`invoice_id`,`payment_id`),
  ADD KEY `fk_payment_allocations_invoices1_idx` (`invoice_id`),
  ADD KEY `fk_payment_allocations_payments1_idx` (`payment_id`);

--
-- 表的索引 `point_ledgers`
--
ALTER TABLE `point_ledgers`
  ADD PRIMARY KEY (`point_ledger_id`),
  ADD KEY `fk_point_ledgers_orders1_idx` (`order_id`),
  ADD KEY `fk_point_ledgers_members` (`member_id`);

--
-- 表的索引 `purchases`
--
ALTER TABLE `purchases`
  ADD PRIMARY KEY (`purchase_id`),
  ADD KEY `fk_purchases_stores1_idx` (`store_id`),
  ADD KEY `fk_purchases_suppliers1_idx` (`supplier_id`);

--
-- 表的索引 `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD PRIMARY KEY (`purchase_id`,`sku_id`),
  ADD KEY `fk_purchase_items_purchases1_idx` (`purchase_id`),
  ADD KEY `fk_purchase_items_SKUs1_idx` (`sku_id`);

--
-- 表的索引 `replenishment_requests`
--
ALTER TABLE `replenishment_requests`
  ADD PRIMARY KEY (`request_id`),
  ADD KEY `sku_id` (`sku_id`),
  ADD KEY `requested_by` (`requested_by`),
  ADD KEY `approved_by` (`approved_by`),
  ADD KEY `idx_store_status` (`store_id`,`status`),
  ADD KEY `idx_request_date` (`request_date`),
  ADD KEY `idx_status` (`status`);

--
-- 表的索引 `skus`
--
ALTER TABLE `skus`
  ADD PRIMARY KEY (`sku_id`),
  ADD KEY `fk_SKUs_books1_idx` (`ISBN`);

--
-- 表的索引 `stores`
--
ALTER TABLE `stores`
  ADD PRIMARY KEY (`store_id`),
  ADD UNIQUE KEY `address_UNIQUE` (`address`);

--
-- 表的索引 `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`supplier_id`),
  ADD UNIQUE KEY `name_UNIQUE` (`name`),
  ADD UNIQUE KEY `phone_UNIQUE` (`phone`);
ALTER TABLE `suppliers` ADD FULLTEXT KEY `ft_suppliers_text` (`name`,`address`,`email`);

--
-- 表的索引 `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username_UNIQUE` (`username`);
ALTER TABLE `users` ADD FULLTEXT KEY `ft_users_username` (`username`);

--
-- 在导出的表使用AUTO_INCREMENT
--

--
-- 使用表AUTO_INCREMENT `announcements`
--
ALTER TABLE `announcements`
  MODIFY `announcement_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- 使用表AUTO_INCREMENT `authors`
--
ALTER TABLE `authors`
  MODIFY `author_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=85;

--
-- 使用表AUTO_INCREMENT `catagories`
--
ALTER TABLE `catagories`
  MODIFY `category_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- 使用表AUTO_INCREMENT `employees`
--
ALTER TABLE `employees`
  MODIFY `employee_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=24;

--
-- 使用表AUTO_INCREMENT `inventory_batches`
--
ALTER TABLE `inventory_batches`
  MODIFY `batch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=256;

--
-- 使用表AUTO_INCREMENT `invoices`
--
ALTER TABLE `invoices`
  MODIFY `invoice_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- 使用表AUTO_INCREMENT `job_titles`
--
ALTER TABLE `job_titles`
  MODIFY `job_title_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用表AUTO_INCREMENT `members`
--
ALTER TABLE `members`
  MODIFY `member_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=78;

--
-- 使用表AUTO_INCREMENT `member_tiers`
--
ALTER TABLE `member_tiers`
  MODIFY `member_tier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- 使用表AUTO_INCREMENT `orders`
--
ALTER TABLE `orders`
  MODIFY `order_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- 使用表AUTO_INCREMENT `payments`
--
ALTER TABLE `payments`
  MODIFY `payment_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- 使用表AUTO_INCREMENT `point_ledgers`
--
ALTER TABLE `point_ledgers`
  MODIFY `point_ledger_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `purchases`
--
ALTER TABLE `purchases`
  MODIFY `purchase_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- 使用表AUTO_INCREMENT `replenishment_requests`
--
ALTER TABLE `replenishment_requests`
  MODIFY `request_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- 使用表AUTO_INCREMENT `skus`
--
ALTER TABLE `skus`
  MODIFY `sku_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=256;

--
-- 使用表AUTO_INCREMENT `stores`
--
ALTER TABLE `stores`
  MODIFY `store_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- 使用表AUTO_INCREMENT `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `supplier_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- 使用表AUTO_INCREMENT `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=101;

--
-- 限制导出的表
--

--
-- 限制表 `book_authors`
--
ALTER TABLE `book_authors`
  ADD CONSTRAINT `fk_book_authors_authors1` FOREIGN KEY (`author_id`) REFERENCES `authors` (`author_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_book_authors_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE;

--
-- 限制表 `book_categories`
--
ALTER TABLE `book_categories`
  ADD CONSTRAINT `fk_book_categories_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_book_categories_catagories1` FOREIGN KEY (`category_id`) REFERENCES `catagories` (`category_id`) ON UPDATE CASCADE;

--
-- 限制表 `employees`
--
ALTER TABLE `employees`
  ADD CONSTRAINT `fk_employees_job_titles1` FOREIGN KEY (`job_title_id`) REFERENCES `job_titles` (`job_title_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employees_stores1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_employees_users1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- 限制表 `favorites`
--
ALTER TABLE `favorites`
  ADD CONSTRAINT `fk_favorites_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_favorites_members1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON UPDATE CASCADE;

--
-- 限制表 `inventory_batches`
--
ALTER TABLE `inventory_batches`
  ADD CONSTRAINT `fk_inventories_SKUs1` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`sku_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventories_stores1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_inventory_batches_purchases1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`purchase_id`) ON UPDATE CASCADE;

--
-- 限制表 `invoices`
--
ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoices_orders1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE;

--
-- 限制表 `members`
--
ALTER TABLE `members`
  ADD CONSTRAINT `fk_members_member_tiers1` FOREIGN KEY (`member_tier_id`) REFERENCES `member_tiers` (`member_tier_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_members_users1` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON UPDATE CASCADE;

--
-- 限制表 `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_members1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_stores1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE;

--
-- 限制表 `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_SKUs1` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`sku_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_items_orders1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE;

--
-- 限制表 `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `fk_payments_members1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON UPDATE CASCADE;

--
-- 限制表 `payment_allocations`
--
ALTER TABLE `payment_allocations`
  ADD CONSTRAINT `fk_payment_allocations_invoices1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`invoice_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_payment_allocations_payments1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`payment_id`) ON UPDATE CASCADE;

--
-- 限制表 `point_ledgers`
--
ALTER TABLE `point_ledgers`
  ADD CONSTRAINT `fk_point_ledgers_members` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_point_ledgers_orders` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_point_ledgers_orders1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE;

--
-- 限制表 `purchases`
--
ALTER TABLE `purchases`
  ADD CONSTRAINT `fk_purchases_stores1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_purchases_suppliers1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`supplier_id`) ON UPDATE CASCADE;

--
-- 限制表 `purchase_items`
--
ALTER TABLE `purchase_items`
  ADD CONSTRAINT `fk_purchase_items_SKUs1` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`sku_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_purchase_items_purchases1` FOREIGN KEY (`purchase_id`) REFERENCES `purchases` (`purchase_id`) ON UPDATE CASCADE;

--
-- 限制表 `replenishment_requests`
--
ALTER TABLE `replenishment_requests`
  ADD CONSTRAINT `replenishment_requests_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `replenishment_requests_ibfk_2` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`sku_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `replenishment_requests_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `employees` (`employee_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `replenishment_requests_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON UPDATE CASCADE;

--
-- 限制表 `skus`
--
ALTER TABLE `skus`
  ADD CONSTRAINT `fk_SKUs_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE;

DELIMITER $$
--
-- 事件
--
CREATE DEFINER=`root`@`localhost` EVENT `ev_finance_void_stale_drafts` ON SCHEDULE EVERY 1 DAY STARTS '2025-12-30 03:54:59' ON COMPLETION NOT PRESERVE ENABLE DO BEGIN
    UPDATE invoices
    SET invoice_status = 'voided',
        update_date = NOW(),
        note = CONCAT(IFNULL(note, ''), ' | Auto-void stale draft')
    WHERE invoice_status = 'draft'
      AND issue_date < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
