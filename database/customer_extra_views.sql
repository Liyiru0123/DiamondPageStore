-- customer_extra_views.sql
-- 补充 Customer 模块需要的视图

USE book_store;

-- 13. 购物车商品详情视图
-- 用于购物车价格计算
CREATE OR REPLACE VIEW vw_customer_cart_item_detail AS
SELECT 
    s.sku_id,
    s.unit_price,
    b.name AS title,
    b.ISBN
FROM skus s
JOIN books b ON s.ISBN = b.ISBN;

-- 14. 会员折扣视图
-- 用于获取会员等级对应的折扣率
CREATE OR REPLACE VIEW vw_customer_member_discount AS
SELECT 
    m.member_id,
    mt.discount_rate,
    mt.name AS tier_name
FROM members m
JOIN member_tiers mt ON m.member_tier_id = mt.member_tier_id;

-- 15. 订单摘要视图（带书名预览和倒计时）
-- 用于订单列表显示
CREATE OR REPLACE VIEW vw_customer_order_summary AS
SELECT 
    o.order_id,
    o.member_id,
    o.store_id,
    o.order_status,
    o.order_date,
    o.note,
    st.name AS store_name,
    -- 计算订单总价
    (SELECT SUM(oi.quantity * s.unit_price)
     FROM order_items oi
     JOIN skus s ON oi.sku_id = s.sku_id
     WHERE oi.order_id = o.order_id) AS total_price,
    -- 计算订单商品数量
    (SELECT SUM(oi.quantity)
     FROM order_items oi
     WHERE oi.order_id = o.order_id) AS total_items,
    -- 书名预览
    (SELECT GROUP_CONCAT(CONCAT(b.name, ' (x', oi.quantity, ')') SEPARATOR '; ') 
     FROM order_items oi 
     JOIN skus s ON oi.sku_id = s.sku_id
     JOIN books b ON s.isbn = b.isbn 
     WHERE oi.order_id = o.order_id) as items_summary,
    -- 支付倒计时（秒）
    (900 - TIMESTAMPDIFF(SECOND, o.order_date, NOW())) as seconds_left
FROM orders o
JOIN stores st ON o.store_id = st.store_id;

-- 16. 用户资料视图
-- 用于个人资料页面
CREATE OR REPLACE VIEW vw_customer_profile AS
SELECT 
    m.member_id, 
    m.user_id, 
    m.first_name, 
    m.last_name, 
    m.email, 
    m.address, 
    m.birthday, 
    u.username,
    u.status AS account_status
FROM members m
JOIN users u ON m.user_id = u.user_id;
