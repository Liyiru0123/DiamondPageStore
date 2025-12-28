-- ---------------------------------------------------------
-- View: vw_staff_details
-- 作用: 聚合 用户(users) -> 员工(employees) -> 门店(stores) 的信息
-- 用于: 登录后获取当前员工所属门店 ID、名称、职位等，避免前端硬编码
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_staff_details AS
SELECT 
    u.user_id,
    u.username,
    u.status as account_status,
    e.employee_id,
    e.first_name,
    e.last_name,
    CONCAT(e.first_name, ' ', e.last_name) AS full_name,
    j.name AS job_title,
    s.store_id,
    s.name AS store_name,
    s.status AS store_status
FROM users u
JOIN employees e ON u.user_id = e.user_id
JOIN stores s ON e.store_id = s.store_id
JOIN job_titles j ON e.job_title_id = j.job_title_id;