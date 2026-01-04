-- grant_privileges.sql
-- 为不同角色的数据库用户授予权限
-- 所有读取通过 VIEW，所有写入通过 STORED PROCEDURE

USE book_store;

-- ============================================================================
-- 1. 管理员 (Manager) 权限
-- 管理员拥有对 book_store 数据库的所有权限
-- ============================================================================
GRANT ALL PRIVILEGES ON book_store.* TO 'manager'@'localhost';
GRANT ALL PRIVILEGES ON book_store.* TO 'manager'@'%';

-- ============================================================================
-- 2. 员工 (Staff) 权限
-- ============================================================================

-- 视图访问权限 (SELECT)
GRANT SELECT ON book_store.vw_auth_details TO 'staff'@'localhost', 'staff'@'%';
GRANT SELECT ON book_store.vw_staff_inventory_details TO 'staff'@'localhost', 'staff'@'%';
GRANT SELECT ON book_store.vw_staff_low_stock TO 'staff'@'localhost', 'staff'@'%';
GRANT SELECT ON book_store.vw_staff_order_summary TO 'staff'@'localhost', 'staff'@'%';
GRANT SELECT ON book_store.vw_staff_details TO 'staff'@'localhost', 'staff'@'%';
GRANT SELECT ON book_store.vw_staff_book_categories TO 'staff'@'localhost', 'staff'@'%';
GRANT SELECT ON book_store.vw_staff_order_status_list TO 'staff'@'localhost', 'staff'@'%';
GRANT SELECT ON book_store.vw_staff_order_details_full TO 'staff'@'localhost', 'staff'@'%';
GRANT SELECT ON book_store.vw_staff_stock_requests TO 'staff'@'localhost', 'staff'@'%';

-- 存储过程执行权限 (EXECUTE)
GRANT EXECUTE ON PROCEDURE book_store.sp_auth_login TO 'staff'@'localhost', 'staff'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_staff_update_inventory TO 'staff'@'localhost', 'staff'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_staff_update_order_status TO 'staff'@'localhost', 'staff'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_staff_create_stock_request TO 'staff'@'localhost', 'staff'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_staff_complete_stock_request TO 'staff'@'localhost', 'staff'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_staff_add_book TO 'staff'@'localhost', 'staff'@'%';

-- ============================================================================
-- 3. 财务 (Finance) 权限
-- ============================================================================

-- 视图访问权限 (SELECT)
GRANT SELECT ON book_store.vw_auth_details TO 'finance'@'localhost', 'finance'@'%';
GRANT SELECT ON book_store.vw_finance_order_settlement TO 'finance'@'localhost', 'finance'@'%';
GRANT SELECT ON book_store.vw_finance_revenue_by_date TO 'finance'@'localhost', 'finance'@'%';
GRANT SELECT ON book_store.vw_finance_purchase_cost_by_date TO 'finance'@'localhost', 'finance'@'%';
GRANT SELECT ON book_store.vw_finance_order_list TO 'finance'@'localhost', 'finance'@'%';
GRANT SELECT ON book_store.vw_finance_invoice_list TO 'finance'@'localhost', 'finance'@'%';
GRANT SELECT ON book_store.vm_finance_invoice_payment_allocation_detail TO 'finance'@'localhost', 'finance'@'%';
GRANT SELECT ON book_store.vm_finance_invoice_base TO 'finance'@'localhost', 'finance'@'%';

-- 存储过程执行权限 (EXECUTE)
GRANT EXECUTE ON PROCEDURE book_store.sp_auth_login TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_overview TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_payment_method_summary TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_revenue_by_date TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_purchase_cost_by_date TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_order_list TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_invoice_list TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_order_detail TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_invoice_detail TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_create_invoice TO 'finance'@'localhost', 'finance'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_finance_receive_payment TO 'finance'@'localhost', 'finance'@'%';

-- ============================================================================
-- 4. 顾客 (Customer) 权限
-- ============================================================================

-- 视图访问权限 (SELECT)
GRANT SELECT ON book_store.vw_auth_details TO 'customer'@'localhost', 'customer'@'%';
GRANT SELECT ON book_store.vw_customer_books TO 'customer'@'localhost', 'customer'@'%';
GRANT SELECT ON book_store.vw_customer_book_detail TO 'customer'@'localhost', 'customer'@'%';
GRANT SELECT ON book_store.vw_customer_favorites TO 'customer'@'localhost', 'customer'@'%';
GRANT SELECT ON book_store.vw_customer_orders TO 'customer'@'localhost', 'customer'@'%';
GRANT SELECT ON book_store.vw_customer_order_items TO 'customer'@'localhost', 'customer'@'%';
GRANT SELECT ON book_store.vw_customer_member_info TO 'customer'@'localhost', 'customer'@'%';
GRANT SELECT ON book_store.vw_customer_announcements TO 'customer'@'localhost', 'customer'@'%';
GRANT SELECT ON book_store.vw_customer_point_history TO 'customer'@'localhost', 'customer'@'%';
GRANT SELECT ON book_store.vw_customer_point_summary TO 'customer'@'localhost', 'customer'@'%';

-- 存储过程执行权限 (EXECUTE)
GRANT EXECUTE ON PROCEDURE book_store.sp_auth_login TO 'customer'@'localhost', 'customer'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_auth_register TO 'customer'@'localhost', 'customer'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_customer_update_profile TO 'customer'@'localhost', 'customer'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_customer_place_order TO 'customer'@'localhost', 'customer'@'%';
GRANT EXECUTE ON PROCEDURE book_store.sp_customer_toggle_favorite TO 'customer'@'localhost', 'customer'@'%';

-- ============================================================================
-- 刷新权限
-- ============================================================================
FLUSH PRIVILEGES;
