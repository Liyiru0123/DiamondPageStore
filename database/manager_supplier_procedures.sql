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
