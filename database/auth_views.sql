DELIMITER //

-- ---------------------------------------------------------
-- View: vw_auth_details
-- 作用: 聚合用户基本信息和员工职位信息。
-- 注意: 这里的 password_hash 字段实际上存储的是明文密码。
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_auth_details AS
SELECT 
    u.user_id,
    u.username,
    u.password_hash, -- 明文密码
    u.user_types,    -- 'member' 或 'employee'
    u.status,        -- 'active' 或 'disabled'
    j.name AS job_title -- 关联查出具体的职位，如 'Store Manager', 'Staff'
FROM 
    users u
LEFT JOIN 
    employees e ON u.user_id = e.user_id
LEFT JOIN 
    job_titles j ON e.job_title_id = j.job_title_id;
//

DELIMITER ;