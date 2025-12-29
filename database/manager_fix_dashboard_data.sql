-- ============================================================================
-- Dashboard 数据修复脚本
-- 修复问题：
-- 1. 分类销售百分比超过 100%（多分类书籍重复计算）
-- 2. 支付方式百分比超过 100%（JOIN 重复）
-- 3. 店铺收入严重虚高（员工和库存批次 JOIN 导致笛卡尔积）
-- 4. 支付金额全部为 0
-- ============================================================================

USE book_store;

-- ============================================================================
-- 1. 修复视图：分类销售百分比（按分类数量平均分配）
-- ============================================================================

DROP VIEW IF EXISTS vw_manager_sales_by_category;

CREATE VIEW vw_manager_sales_by_category AS
SELECT
    c.category_id,
    c.name AS category_name,
    COUNT(DISTINCT o.order_id) AS orders_count,
    COALESCE(SUM(oi.quantity), 0) AS total_quantity_sold,
    COALESCE(SUM(
        (oi.quantity * s.unit_price) /
        NULLIF((SELECT COUNT(*) FROM book_categories bc2 WHERE bc2.ISBN = b.ISBN), 0)
    ), 0) AS total_sales,
    AVG(s.unit_price) AS avg_price,
    COUNT(DISTINCT b.ISBN) AS books_in_category,
    ROUND(
        COALESCE(SUM(
            (oi.quantity * s.unit_price) /
            NULLIF((SELECT COUNT(*) FROM book_categories bc2 WHERE bc2.ISBN = b.ISBN), 0)
        ), 0) /
        NULLIF((SELECT SUM(oi2.quantity * s2.unit_price)
                FROM order_items oi2
                JOIN skus s2 ON oi2.sku_id = s2.sku_id
                JOIN orders o2 ON oi2.order_id = o2.order_id
                WHERE o2.order_status IN ('paid', 'finished')), 0) * 100, 2
    ) AS revenue_percentage
FROM catagories c
JOIN book_categories bc ON c.category_id = bc.category_id
JOIN books b ON bc.ISBN = b.ISBN
JOIN skus s ON b.ISBN = s.ISBN
LEFT JOIN order_items oi ON s.sku_id = oi.sku_id
LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status IN ('paid', 'finished')
GROUP BY c.category_id, c.name
ORDER BY total_sales DESC;

SELECT '✓ View vw_manager_sales_by_category updated' AS status;

-- ============================================================================
-- 1.2 修复视图：支付方式分析百分比（去除重复 JOIN）
-- ============================================================================

DROP VIEW IF EXISTS vw_manager_payment_analysis;

CREATE VIEW vw_manager_payment_analysis AS
SELECT
    payment_method,
    COUNT(*) AS payment_count,
    COALESCE(SUM(amount), 0) AS total_amount,
    ROUND(AVG(amount), 2) AS avg_amount,
    MIN(amount) AS min_amount,
    MAX(amount) AS max_amount,
    (SELECT COUNT(DISTINCT o.store_id)
     FROM payment_allocations pa
     JOIN invoices inv ON pa.invoice_id = inv.invoice_id
     JOIN orders o ON inv.order_id = o.order_id
     WHERE pa.payment_id IN (SELECT payment_id FROM payments p2 WHERE p2.payment_method = p.payment_method)
    ) AS stores_count,
    DATE(MIN(create_date)) AS first_payment_date,
    DATE(MAX(create_date)) AS last_payment_date,
    ROUND(
        COALESCE(SUM(amount), 0) /
        NULLIF((SELECT SUM(amount) FROM payments), 0) * 100, 2
    ) AS percentage_of_total
FROM payments p
GROUP BY payment_method
ORDER BY total_amount DESC;

SELECT '✓ View vw_manager_payment_analysis updated' AS status;

-- ============================================================================
-- 1.3 修复视图：店铺绩效（移除 JOIN 导致的收入重复计算）
-- ============================================================================

DROP VIEW IF EXISTS vw_manager_store_performance;

CREATE VIEW vw_manager_store_performance AS
SELECT
    st.store_id,
    st.name AS store_name,
    st.status,
    st.telephone,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COALESCE(SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price ELSE 0 END), 0) AS revenue,
    COUNT(DISTINCT o.member_id) AS unique_customers,
    (SELECT COUNT(*) FROM employees e WHERE e.store_id = st.store_id) AS staff_count,
    (SELECT ROUND(AVG(performance), 2) FROM employees e WHERE e.store_id = st.store_id) AS avg_employee_performance,
    (SELECT COALESCE(SUM(quantity * unit_cost), 0) FROM inventory_batches ib WHERE ib.store_id = st.store_id) AS inventory_value,
    (SELECT COALESCE(SUM(quantity), 0) FROM inventory_batches ib WHERE ib.store_id = st.store_id) AS total_inventory,
    ROUND(
        COALESCE(SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price ELSE 0 END), 0) /
        NULLIF((SELECT COUNT(*) FROM employees e WHERE e.store_id = st.store_id), 0), 2
    ) AS revenue_per_employee,
    RANK() OVER (ORDER BY SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price ELSE 0 END) DESC) AS revenue_rank
FROM stores st
LEFT JOIN orders o ON st.store_id = o.store_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN skus s ON oi.sku_id = s.sku_id
GROUP BY st.store_id, st.name, st.status, st.telephone
ORDER BY revenue DESC;

SELECT '✓ View vw_manager_store_performance updated' AS status;

-- ============================================================================
-- 2. 修复支付金额（根据订单项目计算实际金额）
-- ============================================================================

-- 先备份当前的 payments 表（可选）
-- CREATE TABLE payments_backup AS SELECT * FROM payments;

-- 更新支付金额：根据订单金额计算
UPDATE payments p
SET p.amount = (
    SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
    FROM payment_allocations pa
    JOIN invoices inv ON pa.invoice_id = inv.invoice_id
    JOIN orders o ON inv.order_id = o.order_id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN skus s ON oi.sku_id = s.sku_id
    WHERE pa.payment_id = p.payment_id
    AND o.order_status = 'paid'
)
WHERE p.amount = 0 OR p.amount IS NULL;

SELECT
    '✓ Payment amounts updated' AS status,
    COUNT(*) AS updated_count,
    COALESCE(SUM(amount), 0) AS total_amount
FROM payments;

-- ============================================================================
-- 3. 同步更新 payment_allocations 表的 allocated_amount
-- ============================================================================

UPDATE payment_allocations pa
JOIN invoices inv ON pa.invoice_id = inv.invoice_id
JOIN orders o ON inv.order_id = o.order_id
JOIN (
    SELECT oi.order_id, SUM(oi.quantity * s.unit_price) AS order_total
    FROM order_items oi
    JOIN skus s ON oi.sku_id = s.sku_id
    GROUP BY oi.order_id
) AS order_totals ON o.order_id = order_totals.order_id
SET pa.allocated_amount = order_totals.order_total
WHERE pa.allocated_amount = 0 OR pa.allocated_amount IS NULL;

SELECT
    '✓ Payment allocations updated' AS status,
    COUNT(*) AS updated_count,
    COALESCE(SUM(allocated_amount), 0) AS total_allocated
FROM payment_allocations;

-- ============================================================================
-- 4. 验证修复结果
-- ============================================================================

-- 检查支付方式统计
SELECT
    '=== Payment Analysis ===' AS section,
    payment_method,
    COUNT(*) AS payment_count,
    COALESCE(SUM(amount), 0) AS total_amount,
    ROUND(AVG(amount), 2) AS avg_amount
FROM payments
GROUP BY payment_method
ORDER BY total_amount DESC;

-- 检查分类销售百分比
SELECT
    '=== Category Sales ===' AS section,
    category_name,
    total_sales,
    revenue_percentage
FROM vw_manager_sales_by_category
ORDER BY total_sales DESC
LIMIT 5;

-- 检查订单和支付关联
SELECT
    '=== Order Payment Summary ===' AS section,
    o.order_id,
    o.order_status,
    COALESCE(SUM(oi.quantity * s.unit_price), 0) AS order_total,
    p.payment_id,
    p.payment_method,
    p.amount AS payment_amount
FROM orders o
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN skus s ON oi.sku_id = s.sku_id
LEFT JOIN invoices inv ON o.order_id = inv.order_id
LEFT JOIN payment_allocations pa ON inv.invoice_id = pa.invoice_id
LEFT JOIN payments p ON pa.payment_id = p.payment_id
WHERE o.order_status = 'paid'
GROUP BY o.order_id, o.order_status, p.payment_id, p.payment_method, p.amount
ORDER BY o.order_id
LIMIT 10;

SELECT '✓ All fixes applied successfully!' AS final_status;
