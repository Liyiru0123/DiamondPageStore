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
