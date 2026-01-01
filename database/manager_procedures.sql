
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
        AND o.order_status = 'paid'
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

DELIMITER ;

SELECT 'manager procedures created' AS message;
