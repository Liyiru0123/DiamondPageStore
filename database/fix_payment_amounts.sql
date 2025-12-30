-- ============================================================================
-- 修复支付金额数据
-- Fix Payment Amounts Data
-- ============================================================================
-- 问题：book_store 1230.sql 中 payments.amount 和 payment_allocations.allocated_amount 都是 0
-- 解决：从 order_items 计算实际订单金额并更新
-- ============================================================================

USE book_store;

SELECT '开始修复支付金额数据...' AS status;

-- ============================================================================
-- 步骤 1: 更新 payment_allocations.allocated_amount
-- 从订单项目计算每个发票的实际金额
-- ============================================================================

UPDATE payment_allocations pa
JOIN invoices inv ON pa.invoice_id = inv.invoice_id
JOIN (
    SELECT
        o.order_id,
        COALESCE(SUM(oi.quantity * s.unit_price), 0) AS order_total
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN skus s ON oi.sku_id = s.sku_id
    GROUP BY o.order_id
) AS order_totals ON inv.order_id = order_totals.order_id
SET pa.allocated_amount = order_totals.order_total;

SELECT CONCAT('✓ 已更新 ', ROW_COUNT(), ' 条 payment_allocations 记录') AS status;

-- ============================================================================
-- 步骤 2: 更新 payments.amount
-- 汇总分配到每个payment的总金额
-- ============================================================================

UPDATE payments p
JOIN (
    SELECT
        payment_id,
        COALESCE(SUM(allocated_amount), 0) AS total_allocated
    FROM payment_allocations
    GROUP BY payment_id
) AS payment_totals ON p.payment_id = payment_totals.payment_id
SET p.amount = payment_totals.total_allocated;

SELECT CONCAT('✓ 已更新 ', ROW_COUNT(), ' 条 payments 记录') AS status;

-- ============================================================================
-- 步骤 3: 验证更新结果
-- ============================================================================

SELECT
    '验证结果：支付方式分析' AS check_type,
    payment_method,
    COUNT(*) AS payment_count,
    COALESCE(SUM(amount), 0) AS total_amount
FROM payments
GROUP BY payment_method
ORDER BY total_amount DESC;

SELECT '✓ 支付金额数据修复完成！' AS status;
