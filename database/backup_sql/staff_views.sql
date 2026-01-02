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

-- ---------------------------------------------------------
-- View: vw_staff_book_categories
-- 作用: 获取所有书籍类别列表
-- 用于: 前端下拉框动态加载类别选项
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_staff_book_categories AS
SELECT
    category_id,
    name AS category_name
FROM catagories
ORDER BY name ASC;

-- ---------------------------------------------------------
-- View: vw_staff_order_status_list
-- 作用: 获取订单状态枚举列表
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_staff_order_status_list AS
SELECT 'created' AS status_name
UNION SELECT 'paid'
UNION SELECT 'cancelled'
UNION SELECT 'refunded'
UNION SELECT 'finished';

-- ---------------------------------------------------------
-- View: vw_staff_order_details_full
-- 作用: 获取订单详情及其包含的商品
-- ---------------------------------------------------------
CREATE OR REPLACE VIEW vw_staff_order_details_full AS
SELECT 
    o.order_id,
    o.store_id,
    o.order_status,
    o.order_date,
    o.note,
    CONCAT(m.first_name, ' ', m.last_name) AS customer_name,
    oi.sku_id,
    oi.quantity,
    b.name AS book_title,
    s.ISBN,
    s.unit_price,
    (oi.quantity * s.unit_price) AS subtotal
FROM orders o
JOIN members m ON o.member_id = m.member_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN skus s ON oi.sku_id = s.sku_id
JOIN books b ON s.ISBN = b.ISBN;
