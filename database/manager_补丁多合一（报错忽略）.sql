-- ==============================================================================
-- Manager 综合SQL文件
-- Combined Manager SQL File
-- ==============================================================================
--
-- 此文件合并了以下 manager 相关的 SQL 文件：
-- 1. manager_procedures.sql - 核心管理存储过程
-- 2. manager_supplier_procedures.sql - 供应商管理存储过程
-- 3. manager_user_procedures.sql - 用户管理存储过程
-- 4. manager_fulltext_indexes(报错忽略).sql - FULLTEXT 搜索索引
-- 5. manager_fix_missing_fulltext_indexes.sql - FULLTEXT 索引修复脚本
-- 6. manager_fix_dashboard_data.sql - Dashboard 数据修复
--
-- 创建日期: 2025-12-29
-- 数据库: book_store
-- ==============================================================================

USE book_store;

-- ==============================================================================
-- 第一部分：核心管理存储过程 (manager_procedures.sql)
-- ==============================================================================

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
-- Purchases
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

DELIMITER ;

SELECT '✓ Core manager procedures created' AS message;

-- ==============================================================================
-- 第二部分：供应商管理存储过程 (manager_supplier_procedures.sql)
-- 注意：此部分的 sp_manager_add_supplier 会覆盖前面的版本（修正了 phone 类型）
-- ==============================================================================

DELIMITER $$

-- ============================================================================
-- 1. 添加供应商（使用事务）
-- ============================================================================
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

-- ============================================================================
-- 2. 更新供应商信息（使用事务）
-- ============================================================================
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

-- ============================================================================
-- 3. 删除供应商（使用事务，检查关联）
-- ============================================================================
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

DELIMITER ;

SELECT '✓ Supplier management procedures created' AS message;

-- ==============================================================================
-- 第三部分：用户管理存储过程 (manager_user_procedures.sql)
-- ==============================================================================

DELIMITER $$

-- ============================================================================
-- 重置用户密码（使用事务）
-- ============================================================================
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

DELIMITER ;

SELECT '✓ User management procedures created' AS message;

-- ==============================================================================
-- 第四部分：FULLTEXT 搜索索引 (manager_fulltext_indexes)
-- 注意：某些索引可能已存在，执行时可能会报错，这是正常的，可以忽略
-- ==============================================================================

SELECT '>>> Creating FULLTEXT indexes (errors can be ignored if indexes already exist)' AS message;

ALTER TABLE users
ADD FULLTEXT INDEX ft_users_username (username);

ALTER TABLE employees
ADD FULLTEXT INDEX ft_employees_name (first_name, last_name);

ALTER TABLE members
ADD FULLTEXT INDEX ft_members_name (first_name, last_name);

ALTER TABLE suppliers
ADD FULLTEXT INDEX ft_suppliers_text (name, address, email);

ALTER TABLE books
ADD FULLTEXT INDEX ft_books_text (name, introduction, publisher, language);

ALTER TABLE authors
ADD FULLTEXT INDEX ft_authors_name (first_name, last_name);

ALTER TABLE catagories
ADD FULLTEXT INDEX ft_categories_name (name);

SELECT '✓ FULLTEXT indexes created (or already existed)' AS message;

-- ==============================================================================
-- 第五部分：Dashboard 数据修复 (manager_fix_dashboard_data.sql)
-- ==============================================================================

SELECT '>>> Starting Dashboard data fixes' AS message;

-- ============================================================================
-- 1. 修复视图：分类销售百分比（按分类数量平均分配）
-- ============================================================================

DROP VIEW IF EXISTS vw_manager_sales_by_category;

CREATE VIEW vw_manager_sales_by_category AS
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
                WHERE o2.order_status = 'paid'), 0) * 100, 2
    ) AS revenue_percentage
FROM catagories c
JOIN book_categories bc ON c.category_id = bc.category_id
JOIN books b ON bc.ISBN = b.ISBN
JOIN skus s ON b.ISBN = s.ISBN
LEFT JOIN order_items oi ON s.sku_id = oi.sku_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status = 'paid'
GROUP BY c.category_id, c.name
ORDER BY total_sales DESC;

SELECT '✓ View vw_manager_sales_by_category updated' AS status;

-- ============================================================================
-- 1.2 修复视图：支付方式分析百分比（去除重复 JOIN）
-- ============================================================================

DROP VIEW IF EXISTS vw_manager_payment_analysis;

CREATE VIEW vw_manager_payment_analysis AS
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

SELECT '✓ View vw_manager_payment_analysis updated' AS status;

-- ============================================================================
-- 1.3 修复视图：店铺绩效（移除 JOIN 导致的收入重复计算）
-- ============================================================================

DROP VIEW IF EXISTS vw_manager_store_performance;

CREATE VIEW vw_manager_store_performance AS
SELECT
    st.store_id,
    st.name AS store_name,
    st.status,
    st.telephone,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(CASE WHEN o.order_status = 'paid' THEN oi.quantity * s.unit_price ELSE 0 END), 0) AS revenue,
    COUNT(DISTINCT o.member_id) AS unique_customers,
    (SELECT COUNT(*) FROM employees e WHERE e.store_id = st.store_id) AS staff_count,
    (SELECT ROUND(AVG(performance), 2) FROM employees e WHERE e.store_id = st.store_id) AS avg_employee_performance,
    (SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM inventory_batches ib WHERE ib.store_id = st.store_id) AS inventory_value,
    (SELECT COALESCE(SUM(quantity), 0) FROM inventory_batches ib WHERE ib.store_id = st.store_id) AS total_inventory,
    ROUND(
        COALESCE(SUM(CASE WHEN o.order_status = 'paid' THEN oi.quantity * s.unit_price ELSE 0 END), 0) /
        NULLIF((SELECT COUNT(*) FROM employees e WHERE e.store_id = st.store_id), 0), 2
    ) AS revenue_per_employee,
    RANK() OVER (ORDER BY SUM(CASE WHEN o.order_status = 'paid' THEN oi.quantity * s.unit_price ELSE 0 END) DESC) AS revenue_rank
FROM stores st
LEFT JOIN orders o ON st.store_id = o.store_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN skus s ON oi.sku_id = s.sku_id
GROUP BY st.store_id, st.name, st.status, st.telephone
ORDER BY revenue DESC;

SELECT '✓ View vw_manager_store_performance updated' AS status;

-- ============================================================================
-- 2. 修复支付金额（根据订单项目计算实际金额）
-- ============================================================================

UPDATE payments p
SET p.amount = (
    SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
    FROM payment_allocations pa
    JOIN invoices inv ON pa.invoice_id = inv.invoice_id
    JOIN orders o ON inv.order_id = o.order_id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN skus s ON oi.sku_id = s.sku_id
    WHERE pa.payment_id = p.payment_id
    AND o.order_status = 'paid'
)
WHERE p.amount = 0 OR p.amount IS NULL;

SELECT
    '✓ Payment amounts updated' AS status,
    COUNT(*) AS updated_count,
    COALESCE(SUM(amount), 0) AS total_amount
FROM payments;

-- ============================================================================
-- 3. 同步更新 payment_allocations 表的 allocated_amount
-- ============================================================================

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
    '✓ Payment allocations updated' AS status,
    COUNT(*) AS updated_count,
    COALESCE(SUM(allocated_amount), 0) AS total_allocated
FROM payment_allocations;

SELECT '✓ All Dashboard fixes applied successfully!' AS final_status;

-- ==============================================================================
-- 完成！
-- ==============================================================================

SELECT '' AS '';
SELECT '============================================================' AS '';
SELECT '✅ 所有 Manager 相关 SQL 脚本已成功合并并执行！' AS '';
SELECT '============================================================' AS '';
SELECT '' AS '';
SELECT '包含的内容:' AS '';
SELECT '1. 核心管理存储过程 (员工、图书、库存、补货、采购、通知)' AS '';
SELECT '2. 供应商管理存储过程 (添加、更新、删除)' AS '';
SELECT '3. 用户管理存储过程 (密码重置)' AS '';
SELECT '4. FULLTEXT 搜索索引' AS '';
SELECT '5. Dashboard 数据修复' AS '';
SELECT '' AS '';
SELECT '============================================================' AS '';

-- ============================================================================
-- BEGIN manager_employee_email_migration.sql
-- ============================================================================
-- Migration: change employees.phone to employees.email
-- NOTE: Update existing data after running this change if needed.

USE book_store;

ALTER TABLE employees
    CHANGE COLUMN phone email VARCHAR(100) NOT NULL;
-- ============================================================================
-- END manager_employee_email_migration.sql
-- ============================================================================


-- ============================================================================
-- BEGIN manager_fix_dashboard_data.sql
-- ============================================================================
-- ============================================================================
-- Dashboard 数据修复脚本
-- 修复问题：
-- 1. 分类销售百分比超过 100%（多分类书籍重复计算）
-- 2. 支付方式百分比超过 100%（JOIN 重复）
-- 3. 店铺收入严重虚高（员工和库存批次 JOIN 导致笛卡尔积）
-- 4. 支付金额全部为 0
-- ============================================================================

USE book_store;

-- ============================================================================
-- 1. 修复视图：分类销售百分比（按分类数量平均分配）
-- ============================================================================

DROP VIEW IF EXISTS vw_manager_sales_by_category;

CREATE VIEW vw_manager_sales_by_category AS
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

SELECT '✓ View vw_manager_sales_by_category updated' AS status;

-- ============================================================================
-- 1.2 修复视图：支付方式分析百分比（去除重复 JOIN）
-- ============================================================================

DROP VIEW IF EXISTS vw_manager_payment_analysis;

CREATE VIEW vw_manager_payment_analysis AS
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

SELECT '✓ View vw_manager_payment_analysis updated' AS status;

-- ============================================================================
-- 1.3 修复视图：店铺绩效（移除 JOIN 导致的收入重复计算）
-- ============================================================================

DROP VIEW IF EXISTS vw_manager_store_performance;

CREATE VIEW vw_manager_store_performance AS
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

SELECT '✓ View vw_manager_store_performance updated' AS status;

-- ============================================================================
-- 2. 修复支付金额（根据订单项目计算实际金额）
-- ============================================================================

-- 先备份当前的 payments 表（可选）
-- CREATE TABLE payments_backup AS SELECT * FROM payments;

-- 更新支付金额：根据订单金额计算
UPDATE payments p
SET p.amount = (
    SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
    FROM payment_allocations pa
    JOIN invoices inv ON pa.invoice_id = inv.invoice_id
    JOIN orders o ON inv.order_id = o.order_id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN skus s ON oi.sku_id = s.sku_id
    WHERE pa.payment_id = p.payment_id
    AND o.order_status = 'paid'
)
WHERE p.amount = 0 OR p.amount IS NULL;

SELECT
    '✓ Payment amounts updated' AS status,
    COUNT(*) AS updated_count,
    COALESCE(SUM(amount), 0) AS total_amount
FROM payments;

-- ============================================================================
-- 3. 同步更新 payment_allocations 表的 allocated_amount
-- ============================================================================

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
    '✓ Payment allocations updated' AS status,
    COUNT(*) AS updated_count,
    COALESCE(SUM(allocated_amount), 0) AS total_allocated
FROM payment_allocations;

-- ============================================================================
-- 4. 验证修复结果
-- ============================================================================

-- 检查支付方式统计
SELECT
    '=== Payment Analysis ===' AS section,
    payment_method,
    COUNT(*) AS payment_count,
    COALESCE(SUM(amount), 0) AS total_amount,
    ROUND(AVG(amount), 2) AS avg_amount
FROM payments
GROUP BY payment_method
ORDER BY total_amount DESC;

-- 检查分类销售百分比
SELECT
    '=== Category Sales ===' AS section,
    category_name,
    total_sales,
    revenue_percentage
FROM vw_manager_sales_by_category
ORDER BY total_sales DESC
LIMIT 5;

-- 检查订单和支付关联
SELECT
    '=== Order Payment Summary ===' AS section,
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

SELECT '✓ All fixes applied successfully!' AS final_status;
-- ============================================================================
-- END manager_fix_dashboard_data.sql
-- ============================================================================


-- ============================================================================
-- BEGIN manager_fix_missing_fulltext_indexes.sql
-- ============================================================================
-- ==================================================
-- 修复缺失的 FULLTEXT 索引
-- Fix Missing FULLTEXT Indexes for Search Functionality
-- ==================================================

USE book_store;

-- 说明：
-- 员工管理和用户管理的搜索正常，说明以下索引已存在：
-- - users.username
-- - employees.(first_name, last_name)
-- - members.(first_name, last_name)
--
-- Stock Overview 和 Pricing 搜索报错，说明以下索引缺失：
-- - books.(name, introduction, publisher, language)
-- - authors.(first_name, last_name)
-- - catagories.name

-- ==================================================
-- 1. Books 表 - 图书信息搜索
-- ==================================================
-- 检查索引是否存在
SELECT 'Checking books table indexes...' AS Status;

-- 删除旧索引（如果存在）
SET @drop_books = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = 'book_store'
    AND table_name = 'books'
    AND index_name = 'ft_books_text'
);

SET @sql_drop_books = IF(
    @drop_books > 0,
    'ALTER TABLE books DROP INDEX ft_books_text',
    'SELECT "Index ft_books_text does not exist, skipping drop" AS Message'
);

PREPARE stmt FROM @sql_drop_books;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 创建新索引
SELECT 'Creating FULLTEXT index on books table...' AS Status;
ALTER TABLE books
ADD FULLTEXT INDEX ft_books_text (name, introduction, publisher, language);

SELECT 'Books FULLTEXT index created successfully!' AS Status;

-- ==================================================
-- 2. Authors 表 - 作者名称搜索
-- ==================================================
SELECT 'Checking authors table indexes...' AS Status;

-- 删除旧索引（如果存在）
SET @drop_authors = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = 'book_store'
    AND table_name = 'authors'
    AND index_name = 'ft_authors_name'
);

SET @sql_drop_authors = IF(
    @drop_authors > 0,
    'ALTER TABLE authors DROP INDEX ft_authors_name',
    'SELECT "Index ft_authors_name does not exist, skipping drop" AS Message'
);

PREPARE stmt FROM @sql_drop_authors;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 创建新索引
SELECT 'Creating FULLTEXT index on authors table...' AS Status;
ALTER TABLE authors
ADD FULLTEXT INDEX ft_authors_name (first_name, last_name);

SELECT 'Authors FULLTEXT index created successfully!' AS Status;

-- ==================================================
-- 3. Catagories 表 - 分类名称搜索
-- ==================================================
SELECT 'Checking catagories table indexes...' AS Status;

-- 删除旧索引（如果存在）
SET @drop_categories = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = 'book_store'
    AND table_name = 'catagories'
    AND index_name = 'ft_categories_name'
);

SET @sql_drop_categories = IF(
    @drop_categories > 0,
    'ALTER TABLE catagories DROP INDEX ft_categories_name',
    'SELECT "Index ft_categories_name does not exist, skipping drop" AS Message'
);

PREPARE stmt FROM @sql_drop_categories;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 创建新索引
SELECT 'Creating FULLTEXT index on catagories table...' AS Status;
ALTER TABLE catagories
ADD FULLTEXT INDEX ft_categories_name (name);

SELECT 'Catagories FULLTEXT index created successfully!' AS Status;

-- ==================================================
-- 验证所有索引
-- ==================================================
SELECT '======================================' AS '';
SELECT 'FULLTEXT Indexes Verification' AS '';
SELECT '======================================' AS '';

SELECT
    table_name AS '表名',
    index_name AS '索引名',
    GROUP_CONCAT(column_name ORDER BY seq_in_index) AS '索引字段'
FROM information_schema.statistics
WHERE table_schema = 'book_store'
AND index_type = 'FULLTEXT'
AND table_name IN ('books', 'authors', 'catagories', 'users', 'employees', 'members', 'suppliers')
GROUP BY table_name, index_name
ORDER BY table_name, index_name;

-- ==================================================
-- 完成
-- ==================================================
SELECT '======================================' AS '';
SELECT '✅ All FULLTEXT indexes have been created successfully!' AS Status;
SELECT 'Stock Overview 和 Pricing 的搜索功能现在应该可以正常使用了' AS Message;
SELECT '======================================' AS '';
-- ============================================================================
-- END manager_fix_missing_fulltext_indexes.sql
-- ============================================================================


-- ============================================================================
-- BEGIN manager_fulltext_indexes(报错忽略).sql
-- ============================================================================
-- Full-text indexes for manager search endpoints.
-- Run once in the target database. Some indexes may already exist.

ALTER TABLE users
ADD FULLTEXT INDEX ft_users_username (username);

ALTER TABLE employees
ADD FULLTEXT INDEX ft_employees_name (first_name, last_name);

ALTER TABLE members
ADD FULLTEXT INDEX ft_members_name (first_name, last_name);

ALTER TABLE suppliers
ADD FULLTEXT INDEX ft_suppliers_text (name, address, email);

ALTER TABLE books
ADD FULLTEXT INDEX ft_books_text (name, introduction, publisher, language);

ALTER TABLE authors
ADD FULLTEXT INDEX ft_authors_name (first_name, last_name);

ALTER TABLE catagories
ADD FULLTEXT INDEX ft_categories_name (name);
-- ============================================================================
-- END manager_fulltext_indexes(报错忽略).sql
-- ============================================================================


-- ============================================================================
-- BEGIN manager_supplier_procedures.sql
-- ============================================================================
-- ============================================================================
-- 供应商管理存储过程
-- Supplier Management Stored Procedures
-- ============================================================================

USE book_store;

DELIMITER $$

-- ============================================================================
-- 1. 添加供应商（使用事务）
-- ============================================================================
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
    -- 验证手机号格式（只允许数字）
    ELSEIF p_phone REGEXP '[^0-9]' THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Phone number must contain only digits';
        SET p_supplier_id = NULL;
        ROLLBACK;
    -- 验证手机号长度（INT UNSIGNED 最大10位）
    ELSEIF CHAR_LENGTH(p_phone) > 10 THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Phone number is too long (max 10 digits)';
        SET p_supplier_id = NULL;
        ROLLBACK;
    -- 检查供应商名称是否已存在
    ELSEIF EXISTS (SELECT 1 FROM suppliers WHERE name = p_name) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Supplier name already exists';
        SET p_supplier_id = NULL;
        ROLLBACK;
    -- 检查手机号是否已存在
    ELSEIF EXISTS (SELECT 1 FROM suppliers WHERE phone = p_phone) THEN
        SET p_result_code = 0;
        SET p_result_message = 'Error: Phone number already exists';
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
END$$

-- ============================================================================
-- 2. 更新供应商信息（使用事务）
-- ============================================================================
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

-- ============================================================================
-- 3. 删除供应商（使用事务，检查关联）
-- ============================================================================
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

DELIMITER ;

-- 验证存储过程创建
SELECT 'Supplier management procedures created successfully' AS message;
-- ============================================================================
-- END manager_supplier_procedures.sql
-- ============================================================================


-- ============================================================================
-- BEGIN manager_user_procedures.sql
-- ============================================================================
-- ============================================================================
-- 用户管理存储过程
-- User Management Stored Procedures
-- ============================================================================

USE book_store;

DELIMITER $$

-- ============================================================================
-- 重置用户密码（使用事务）
-- ============================================================================
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

DELIMITER ;

-- 验证存储过程创建
SELECT 'User management procedures created successfully' AS message;
-- ============================================================================
-- END manager_user_procedures.sql
-- ============================================================================

