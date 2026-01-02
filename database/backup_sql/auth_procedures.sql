DELIMITER //

-- ---------------------------------------------------------
-- Procedure: sp_auth_get_user
-- 作用: 登录时根据用户名查询用户信息（包含明文密码）。
-- ---------------------------------------------------------
CREATE OR REPLACE PROCEDURE sp_auth_get_user(
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
CREATE OR REPLACE PROCEDURE sp_auth_register_customer(
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