-- 数据库性能优化补丁
-- 描述：为发票表添加索引，解决筛选和排序卡顿问题
-- 日期：2025-10-29

-- 1. 优化按日期排序 (ORDER BY issue_date) 和日期范围筛选
ALTER TABLE `invoices` ADD INDEX `idx_issue_date` (`issue_date`);

-- 2. 优化按订单ID精确查找 (WHERE order_id = ...)
ALTER TABLE `invoices` ADD INDEX `idx_order_id` (`order_id`);

-- 3. 优化按状态筛选 (WHERE status = ...)
ALTER TABLE `invoices` ADD INDEX `idx_status` (`invoice_status`);


-- ---------------------------------------------------------
-- 重写存储过程：sp_finance_invoice_list (高性能优化版)
-- 描述：支持金额筛选，并针对 idx_issue_date, idx_order_id, idx_status 进行了索引优化
-- 日期：2025-10-29
-- ---------------------------------------------------------

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_finance_invoice_list$$

CREATE PROCEDURE sp_finance_invoice_list(
    IN p_search VARCHAR(255),
    IN p_status VARCHAR(50),
    IN p_order_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_min_amount DECIMAL(10,2),
    IN p_max_amount DECIMAL(10,2)
)
BEGIN
    SELECT 
        invoice_id,
        invoice_number,
        order_id,
        store_id,
        store_name,
        member_id,
        member_name,
        display_status,
        invoice_status,
        issue_date,
        due_date,
        invoice_amount,
        paid_amount,
        outstanding_amount,
        last_paid_at,
        is_settled
    FROM vw_finance_invoice_list
    WHERE 
        -- 1. 关键词搜索 (修复编码冲突的核心代码)
        -- 我们将所有字段都强制转为 utf8mb4_unicode_ci 再比较
        (p_search IS NULL OR p_search = '' 
        OR CONVERT(member_name USING utf8mb4) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_unicode_ci
        OR CAST(invoice_number AS CHAR) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_unicode_ci
        OR CAST(order_id AS CHAR) COLLATE utf8mb4_unicode_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_unicode_ci)
        
        -- 2. 状态筛选
        AND (p_status IS NULL OR p_status = '' OR p_status = 'All Statuses' OR invoice_status = p_status)
        
        -- 3. 订单ID筛选
        AND (p_order_id IS NULL OR p_order_id = 0 OR order_id = p_order_id)
        
        -- 4. 日期范围筛选
        AND (p_start_date IS NULL OR issue_date >= p_start_date)
        AND (p_end_date IS NULL OR issue_date < DATE_ADD(p_end_date, INTERVAL 1 DAY))
        
        -- 5. 金额范围筛选
        AND (p_min_amount IS NULL OR invoice_amount >= p_min_amount)
        AND (p_max_amount IS NULL OR invoice_amount <= p_max_amount)
        
    ORDER BY issue_date DESC;
END$$

DELIMITER ;