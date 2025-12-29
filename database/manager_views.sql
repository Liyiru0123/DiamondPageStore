-- manager_views.sql
-- Manager views

USE book_store;

-- ============================================================================
-- Employee management views
-- ============================================================================

CREATE OR REPLACE VIEW vw_manager_employees AS
SELECT
    e.employee_id,
    e.user_id,
    e.first_name,
    e.last_name,
    CONCAT(e.first_name, ' ', e.last_name) AS full_name,
    e.phone,
    e.performance,
    e.store_id,
    s.name AS store_name,
    s.address AS store_address,
    s.status AS store_status,
    e.job_title_id,
    jt.name AS job_title,
    jt.base_salary,
    u.username,
    u.user_types AS user_type
FROM employees e
JOIN stores s ON e.store_id = s.store_id
JOIN job_titles jt ON e.job_title_id = jt.job_title_id
LEFT JOIN users u ON e.user_id = u.user_id
ORDER BY e.store_id, jt.base_salary DESC, e.last_name;

CREATE OR REPLACE VIEW vw_manager_employee_performance AS
SELECT
    e.employee_id,
    CONCAT(e.first_name, ' ', e.last_name) AS employee_name,
    e.performance,
    jt.name AS job_title,
    s.name AS store_name,
    CASE
        WHEN e.performance >= 90 THEN 'Excellent'
        WHEN e.performance >= 75 THEN 'Good'
        WHEN e.performance >= 60 THEN 'Average'
        ELSE 'Needs Improvement'
    END AS performance_rating,
    jt.base_salary,
    ROUND(e.performance * jt.base_salary * 0.001, 2) AS potential_bonus
FROM employees e
JOIN job_titles jt ON e.job_title_id = jt.job_title_id
JOIN stores s ON e.store_id = s.store_id
ORDER BY e.performance DESC;

CREATE OR REPLACE VIEW vw_manager_staff_by_store AS
SELECT
    s.store_id,
    s.name AS store_name,
    s.status AS store_status,
    COUNT(DISTINCT e.employee_id) AS total_employees,
    SUM(CASE WHEN jt.name = 'General Manager' THEN 1 ELSE 0 END) AS managers_count,
    SUM(CASE WHEN jt.name = 'Finance' THEN 1 ELSE 0 END) AS finance_count,
    SUM(CASE WHEN jt.name = 'Staff' THEN 1 ELSE 0 END) AS staff_count,
    ROUND(AVG(e.performance), 2) AS avg_performance,
    SUM(jt.base_salary) AS total_salary_cost
FROM stores s
LEFT JOIN employees e ON s.store_id = e.store_id
LEFT JOIN job_titles jt ON e.job_title_id = jt.job_title_id
GROUP BY s.store_id, s.name, s.status
ORDER BY total_employees DESC;

-- ============================================================================
-- Inventory management views
-- ============================================================================

CREATE OR REPLACE VIEW vw_manager_inventory_overview AS
SELECT
    b.ISBN,
    b.name AS book_name,
    b.publisher,
    b.language,
    s.sku_id,
    s.binding AS binding,
    s.unit_price,
    COALESCE(SUM(ib.quantity), 0) AS total_stock,
    COUNT(DISTINCT ib.store_id) AS stores_count,
    AVG(ib.unit_cost) AS avg_cost,
    MIN(ib.received_date) AS earliest_received,
    MAX(ib.received_date) AS latest_received,
    (SELECT GROUP_CONCAT(CONCAT(a.first_name, ' ', a.last_name) SEPARATOR ', ')
     FROM book_authors ba
     JOIN authors a ON ba.author_id = a.author_id
     WHERE ba.ISBN = b.ISBN) AS authors,
    (SELECT GROUP_CONCAT(c.name SEPARATOR ', ')
     FROM book_categories bc
     JOIN catagories c ON bc.category_id = c.category_id
     WHERE bc.ISBN = b.ISBN) AS categories,
    CASE
        WHEN COALESCE(SUM(ib.quantity), 0) > 50 THEN 'High'
        WHEN COALESCE(SUM(ib.quantity), 0) > 20 THEN 'Medium'
        WHEN COALESCE(SUM(ib.quantity), 0) > 0 THEN 'Low'
        ELSE 'Out of Stock'
    END AS stock_level
FROM books b
JOIN skus s ON b.ISBN = s.ISBN
LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id
GROUP BY b.ISBN, b.name, b.publisher, b.language, s.sku_id, s.binding, s.unit_price
ORDER BY total_stock DESC;

CREATE OR REPLACE VIEW vw_manager_inventory_by_store AS
SELECT
    st.store_id,
    st.name AS store_name,
    b.ISBN,
    b.name AS book_name,
    s.sku_id,
    s.binding AS binding,
    s.unit_price,
    COALESCE(SUM(ib.quantity), 0) AS total_quantity,
    AVG(ib.unit_cost) AS avg_cost,
    COUNT(DISTINCT ib.batch_id) AS batch_count,
    MAX(ib.received_date) AS last_inbound_date,
    CASE
        WHEN COALESCE(SUM(ib.quantity), 0) > 20 THEN 'High'
        WHEN COALESCE(SUM(ib.quantity), 0) > 10 THEN 'Medium'
        WHEN COALESCE(SUM(ib.quantity), 0) > 0 THEN 'Low'
        ELSE 'Out of Stock'
    END AS stock_status
FROM stores st
LEFT JOIN inventory_batches ib ON st.store_id = ib.store_id
LEFT JOIN skus s ON ib.sku_id = s.sku_id
LEFT JOIN books b ON s.ISBN = b.ISBN
GROUP BY st.store_id, st.name, b.ISBN, b.name, s.sku_id, s.binding, s.unit_price
ORDER BY st.store_id, total_quantity DESC;

CREATE OR REPLACE VIEW vw_manager_inventory_by_sku AS
SELECT
    s.sku_id,
    b.ISBN,
    b.name AS book_name,
    s.binding AS binding,
    s.unit_price,
    ib.store_id,
    st.name AS store_name,
    COALESCE(SUM(ib.quantity), 0) AS store_stock,
    AVG(ib.unit_cost) AS avg_cost,
    MIN(ib.received_date) AS earliest_batch,
    MAX(ib.received_date) AS latest_batch,
    COUNT(ib.batch_id) AS batch_count
FROM skus s
JOIN books b ON s.ISBN = b.ISBN
LEFT JOIN inventory_batches ib ON s.sku_id = ib.sku_id
LEFT JOIN stores st ON ib.store_id = st.store_id
GROUP BY s.sku_id, b.ISBN, b.name, s.binding, s.unit_price, ib.store_id, st.name
ORDER BY s.sku_id, store_stock DESC;

CREATE OR REPLACE VIEW vw_manager_replenishment_requests AS
SELECT
    rr.request_id,
    rr.store_id,
    st.name AS store_name,
    rr.sku_id,
    sk.ISBN,
    b.name AS book_name,
    sk.binding AS binding,
    rr.requested_quantity,
    1 AS sku_count,
    rr.requested_quantity AS total_quantity,
    rr.urgency_level,
    rr.status,
    rr.request_date,
    rr.requested_by,
    CONCAT(e1.first_name, ' ', e1.last_name) AS requested_by_name,
    rr.reason,
    rr.approved_by,
    CONCAT(e2.first_name, ' ', e2.last_name) AS approved_by_name,
    rr.approval_date,
    rr.rejection_reason,
    rr.rejection_date,
    rr.completed_date,
    rr.note,
    COALESCE(SUM(ib.quantity), 0) AS current_stock
FROM replenishment_requests rr
JOIN stores st ON rr.store_id = st.store_id
JOIN skus sk ON rr.sku_id = sk.sku_id
JOIN books b ON sk.ISBN = b.ISBN
LEFT JOIN employees e1 ON rr.requested_by = e1.employee_id
LEFT JOIN employees e2 ON rr.approved_by = e2.employee_id
LEFT JOIN inventory_batches ib ON rr.sku_id = ib.sku_id AND rr.store_id = ib.store_id
GROUP BY rr.request_id, rr.store_id, st.name, rr.sku_id, sk.ISBN, b.name, sk.binding,
         rr.requested_quantity, rr.urgency_level, rr.status, rr.request_date,
         rr.requested_by, e1.first_name, e1.last_name, rr.reason,
         rr.approved_by, e2.first_name, e2.last_name, rr.approval_date,
         rr.rejection_reason, rr.rejection_date, rr.completed_date, rr.note
ORDER BY rr.request_date DESC;

-- ============================================================================
-- Purchase management views
-- ============================================================================

CREATE OR REPLACE VIEW vw_manager_purchases AS
SELECT
    p.purchase_id,
    p.store_id,
    st.name AS store_name,
    p.supplier_id,
    sup.name AS supplier_name,
    sup.phone AS supplier_phone,
    p.purchase_date,
    p.note,
    COUNT(DISTINCT pi.sku_id) AS items_count,
    COALESCE(SUM(pi.quantity), 0) AS total_quantity,
    COALESCE(SUM(pi.quantity * ib.unit_cost), 0) AS estimated_cost
FROM purchases p
JOIN stores st ON p.store_id = st.store_id
JOIN suppliers sup ON p.supplier_id = sup.supplier_id
LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
LEFT JOIN inventory_batches ib ON pi.sku_id = ib.sku_id AND p.purchase_id = ib.purchase_id
GROUP BY p.purchase_id, p.store_id, st.name, p.supplier_id, sup.name, sup.phone, p.purchase_date, p.note
ORDER BY p.purchase_date DESC;

CREATE OR REPLACE VIEW vw_manager_suppliers AS
SELECT
    s.supplier_id,
    s.name AS supplier_name,
    s.phone,
    s.address,
    s.email,
    COUNT(DISTINCT p.purchase_id) AS total_purchases,
    COUNT(DISTINCT p.store_id) AS stores_served,
    MAX(p.purchase_date) AS last_purchase_date,
    COALESCE(SUM(pi.quantity), 0) AS total_items_supplied,
    COALESCE(SUM(pi.quantity * ib.unit_cost), 0) AS total_purchase_value
FROM suppliers s
LEFT JOIN purchases p ON s.supplier_id = p.supplier_id
LEFT JOIN purchase_items pi ON p.purchase_id = pi.purchase_id
LEFT JOIN inventory_batches ib ON pi.sku_id = ib.sku_id AND p.purchase_id = ib.purchase_id
GROUP BY s.supplier_id, s.name, s.phone, s.address, s.email
ORDER BY total_purchase_value DESC;

-- ============================================================================
-- Orders and sales views
-- ============================================================================

CREATE OR REPLACE VIEW vw_manager_orders_summary AS
SELECT
    o.order_id,
    o.store_id,
    st.name AS store_name,
    o.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    m.phone AS member_phone,
    o.order_status,
    o.order_date,
    o.note,
    COUNT(DISTINCT oi.sku_id) AS items_count,
    COALESCE(SUM(oi.quantity), 0) AS total_items,
    COALESCE(SUM(oi.quantity * s.unit_price), 0) AS order_total,
    p.payment_method,
    p.amount AS paid_amount,
    p.create_date AS payment_date
FROM orders o
JOIN stores st ON o.store_id = st.store_id
JOIN members m ON o.member_id = m.member_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN skus s ON oi.sku_id = s.sku_id
LEFT JOIN invoices inv ON o.order_id = inv.order_id
LEFT JOIN payment_allocations pa ON inv.invoice_id = pa.invoice_id
LEFT JOIN payments p ON pa.payment_id = p.payment_id
GROUP BY o.order_id, o.store_id, st.name, o.member_id, m.first_name, m.last_name,
         m.phone, o.order_status, o.order_date, o.note, p.payment_method, p.amount, p.create_date
ORDER BY o.order_date DESC;

CREATE OR REPLACE VIEW vw_manager_sales_by_store AS
SELECT
    st.store_id,
    st.name AS store_name,
    st.status AS store_status,
    COUNT(DISTINCT o.order_id) AS total_orders,
    COUNT(DISTINCT CASE WHEN o.order_status IN ('paid', 'finished') THEN o.order_id END) AS paid_orders,
    COUNT(DISTINCT o.member_id) AS unique_customers,
    COALESCE(SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price ELSE 0 END), 0) AS total_revenue,
    AVG(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity * s.unit_price END) AS avg_order_value,
    COALESCE(SUM(CASE WHEN o.order_status IN ('paid', 'finished') THEN oi.quantity ELSE 0 END), 0) AS total_items_sold,
    DATE(MAX(o.order_date)) AS last_order_date
FROM stores st
LEFT JOIN orders o ON st.store_id = o.store_id
LEFT JOIN order_items oi ON o.order_id = oi.order_id
LEFT JOIN skus s ON oi.sku_id = s.sku_id
GROUP BY st.store_id, st.name, st.status
ORDER BY total_revenue DESC;

CREATE OR REPLACE VIEW vw_manager_sales_by_category AS
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

-- ============================================================================
-- Analytics views
-- ============================================================================

CREATE OR REPLACE VIEW vw_manager_payment_analysis AS
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

CREATE OR REPLACE VIEW vw_manager_bestsellers AS
SELECT
    b.ISBN,
    b.name AS book_name,
    b.publisher,
    b.language,
    (SELECT GROUP_CONCAT(DISTINCT c.name SEPARATOR ', ')
     FROM book_categories bc
     JOIN catagories c ON bc.category_id = c.category_id
     WHERE bc.ISBN = b.ISBN) AS categories,
    COUNT(DISTINCT o.order_id) AS orders_count,
    COALESCE(SUM(oi.quantity), 0) AS total_sold,
    COALESCE(SUM(oi.quantity * s.unit_price), 0) AS total_revenue,
    AVG(s.unit_price) AS avg_price,
    COUNT(DISTINCT o.store_id) AS stores_sold_in,
    COUNT(DISTINCT o.member_id) AS unique_buyers,
    RANK() OVER (ORDER BY SUM(oi.quantity) DESC) AS sales_rank
FROM books b
JOIN skus s ON b.ISBN = s.ISBN
JOIN order_items oi ON s.sku_id = oi.sku_id
JOIN orders o ON oi.order_id = o.order_id AND o.order_status IN ('paid', 'finished')
GROUP BY b.ISBN, b.name, b.publisher, b.language
ORDER BY total_sold DESC
LIMIT 50;

CREATE OR REPLACE VIEW vw_manager_store_performance AS
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

SELECT 'manager views created' AS message;

