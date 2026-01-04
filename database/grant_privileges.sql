USE book_store;

-- 按角色授予数据库权限
-- 1. manager 权限
GRANT ALL PRIVILEGES ON book_store.* TO 
    'manager'@'localhost',
    'manager'@'%';

-- 为 staff 用户授权视图访问权限

GRANT SELECT ON book_store.vw_staff_inventory_details TO 'staff'@'localhost';
GRANT SELECT ON book_store.vw_staff_low_stock TO 'staff'@'localhost';
GRANT SELECT ON book_store.vw_staff_order_summary TO 'staff'@'localhost';
GRANT SELECT ON book_store.vw_staff_details TO 'staff'@'localhost';
GRANT SELECT ON book_store.vw_staff_book_categories TO 'staff'@'localhost';
GRANT SELECT ON book_store.vw_staff_order_status_list TO 'staff'@'localhost';
GRANT SELECT ON book_store.vw_staff_order_details_full TO 'staff'@'localhost';

-- 3. finance 权限 - 财务相关权限
-- GRANT 
--     SELECT,                                  -- 查看所有数据
--     SHOW VIEW,                               -- 查看视图
--     EXECUTE                                  -- 执行存储过程
-- ON book_store.* TO 
--     'book_store_finance'@'localhost',
--     'book_store_finance'@'%';

-- 额外授予财务相关表的写入权限
-- GRANT INSERT, UPDATE ON 
--     book_store.invoices,
--     book_store.payments,
--     book_store.transactions,
--     book_store.financial_reports
-- TO 'book_store_finance'@'localhost', 'book_store_finance'@'%';

-- 4. customer 权限
-- 客户相关的视图
-- GRANT 
--     SELECT, SHOW VIEW ON 
--     book_store.vw_customer_books,
--     book_store.vw_customer_book_detail,
--     book_store.vw_customer_favorites,
--     book_store.vw_customer_orders,
--     book_store.vw_customer_order_items,
--     book_store.vw_customer_member_info,
--     book_store.vw_customer_announcements,
--     book_store.vw_customer_point_history,
--     book_store.vw_customer_point_summary
-- TO 'customer'@'localhost', 'customer'@'%';

-- 授予执行某些存储过程的权限
-- GRANT EXECUTE ON PROCEDURE 
--     book_store.place_order,
--     book_store.update_profile,
--     book_store.view_my_orders
-- TO 'book_store_customer'@'localhost', 'book_store_customer'@'%';


FLUSH PRIVILEGES;