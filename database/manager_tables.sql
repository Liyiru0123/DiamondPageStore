-- manager_tables.sql
-- Manager tables and schema adjustments

USE book_store;

-- Replenishment requests table
CREATE TABLE IF NOT EXISTS replenishment_requests (
    request_id INT PRIMARY KEY AUTO_INCREMENT,
    store_id INT NOT NULL,
    sku_id INT NOT NULL,
    requested_quantity INT NOT NULL,
    urgency_level ENUM('low', 'medium', 'high') DEFAULT 'medium',
    status ENUM('pending', 'approved', 'rejected', 'completed') DEFAULT 'pending',
    request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    requested_by INT,
    reason VARCHAR(500),
    approved_by INT,
    approval_date DATETIME NULL,
    rejection_reason VARCHAR(500) NULL,
    rejection_date DATETIME NULL,
    completed_date DATETIME NULL,
    note VARCHAR(500),
    FOREIGN KEY (store_id) REFERENCES stores(store_id) ON UPDATE CASCADE,
    FOREIGN KEY (sku_id) REFERENCES skus(sku_id) ON UPDATE CASCADE,
    FOREIGN KEY (requested_by) REFERENCES employees(employee_id) ON UPDATE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES employees(employee_id) ON UPDATE CASCADE,
    INDEX idx_store_status (store_id, status),
    INDEX idx_request_date (request_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed replenishment requests when empty (use real store/sku/employee IDs)
INSERT INTO replenishment_requests (
    store_id,
    sku_id,
    requested_quantity,
    urgency_level,
    status,
    request_date,
    requested_by,
    reason,
    approved_by,
    approval_date,
    rejection_reason,
    rejection_date,
    completed_date,
    note
)
SELECT
    s.store_id,
    sk.sku_id,
    10 + (sk.sku_id % 6) AS requested_quantity,
    CASE
        WHEN sk.sku_id % 3 = 0 THEN 'high'
        WHEN sk.sku_id % 3 = 1 THEN 'medium'
        ELSE 'low'
    END AS urgency_level,
    CASE
        WHEN sk.sku_id % 4 = 0 THEN 'approved'
        WHEN sk.sku_id % 4 = 1 THEN 'pending'
        WHEN sk.sku_id % 4 = 2 THEN 'rejected'
        ELSE 'completed'
    END AS status,
    DATE_SUB(NOW(), INTERVAL (sk.sku_id % 7) DAY) AS request_date,
    e.employee_id AS requested_by,
    'Auto-seeded request' AS reason,
    CASE WHEN sk.sku_id % 4 = 0 THEN e.employee_id ELSE NULL END AS approved_by,
    CASE WHEN sk.sku_id % 4 = 0 THEN DATE_SUB(NOW(), INTERVAL 1 DAY) ELSE NULL END AS approval_date,
    CASE WHEN sk.sku_id % 4 = 2 THEN 'Budget constraints' ELSE NULL END AS rejection_reason,
    CASE WHEN sk.sku_id % 4 = 2 THEN DATE_SUB(NOW(), INTERVAL 1 DAY) ELSE NULL END AS rejection_date,
    CASE WHEN sk.sku_id % 4 = 3 THEN DATE_SUB(NOW(), INTERVAL 1 DAY) ELSE NULL END AS completed_date,
    'Seeded for demo' AS note
FROM (SELECT store_id FROM stores ORDER BY store_id LIMIT 2) s
JOIN (SELECT sku_id FROM skus ORDER BY sku_id LIMIT 4) sk
LEFT JOIN (
    SELECT store_id, MIN(employee_id) AS employee_id
    FROM employees
    GROUP BY store_id
) e ON e.store_id = s.store_id
WHERE NOT EXISTS (SELECT 1 FROM replenishment_requests);

-- Ensure every store has at least a few requests for staff views
INSERT INTO replenishment_requests (
    store_id,
    sku_id,
    requested_quantity,
    urgency_level,
    status,
    request_date,
    requested_by,
    reason,
    approved_by,
    approval_date,
    rejection_reason,
    rejection_date,
    completed_date,
    note
)
SELECT
    s.store_id,
    sk.sku_id,
    20 + (s.store_id % 5) + (sk.sku_id % 5) AS requested_quantity,
    CASE
        WHEN sk.sku_id % 3 = 0 THEN 'high'
        WHEN sk.sku_id % 3 = 1 THEN 'medium'
        ELSE 'low'
    END AS urgency_level,
    CASE
        WHEN sk.sku_id % 4 = 0 THEN 'approved'
        WHEN sk.sku_id % 4 = 1 THEN 'pending'
        WHEN sk.sku_id % 4 = 2 THEN 'rejected'
        ELSE 'completed'
    END AS status,
    DATE_SUB(NOW(), INTERVAL (sk.sku_id % 6) DAY) AS request_date,
    e.employee_id AS requested_by,
    'Auto-seeded request' AS reason,
    CASE WHEN sk.sku_id % 4 = 0 THEN e.employee_id ELSE NULL END AS approved_by,
    CASE WHEN sk.sku_id % 4 = 0 THEN DATE_SUB(NOW(), INTERVAL 1 DAY) ELSE NULL END AS approval_date,
    CASE WHEN sk.sku_id % 4 = 2 THEN 'Budget constraints' ELSE NULL END AS rejection_reason,
    CASE WHEN sk.sku_id % 4 = 2 THEN DATE_SUB(NOW(), INTERVAL 1 DAY) ELSE NULL END AS rejection_date,
    CASE WHEN sk.sku_id % 4 = 3 THEN DATE_SUB(NOW(), INTERVAL 1 DAY) ELSE NULL END AS completed_date,
    'Seeded for demo' AS note
FROM stores s
CROSS JOIN (SELECT sku_id FROM skus ORDER BY sku_id LIMIT 2) sk
LEFT JOIN (
    SELECT store_id, MIN(employee_id) AS employee_id
    FROM employees
    GROUP BY store_id
) e ON e.store_id = s.store_id
WHERE NOT EXISTS (
    SELECT 1 FROM replenishment_requests rr WHERE rr.store_id = s.store_id
);

SELECT 'replenishment_requests created' AS message;

-- Employees phone -> email migration (safe if already applied)
SET @employee_phone_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'employees'
      AND column_name = 'phone'
);

SET @employee_email_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'employees'
      AND column_name = 'email'
);

SET @sql_employee_email = IF(
    @employee_phone_exists > 0 AND @employee_email_exists = 0,
    'ALTER TABLE employees CHANGE COLUMN phone email VARCHAR(100) NOT NULL',
    'SELECT \"employees.email already present or employees.phone missing, skipping migration\" AS message'
);

PREPARE stmt FROM @sql_employee_email;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Normalize employee emails (convert legacy numeric values)
UPDATE employees
SET email = CONCAT(
    LOWER(REPLACE(TRIM(first_name), ' ', '')),
    CASE
        WHEN last_name IS NULL OR LENGTH(TRIM(last_name)) = 0 THEN ''
        ELSE CONCAT('.', LOWER(REPLACE(TRIM(last_name), ' ', '')))
    END,
    '.',
    employee_id,
    '@diamondpagestore.com'
)
WHERE email IS NULL
   OR email = ''
   OR email NOT LIKE '%@%';

-- FULLTEXT indexes for manager search endpoints
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'users'
      AND index_name = 'ft_users_username'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE users DROP INDEX ft_users_username',
    'SELECT \"ft_users_username does not exist, skipping drop\" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE users
ADD FULLTEXT INDEX ft_users_username (username);

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'employees'
      AND index_name = 'ft_employees_name'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE employees DROP INDEX ft_employees_name',
    'SELECT \"ft_employees_name does not exist, skipping drop\" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE employees
ADD FULLTEXT INDEX ft_employees_name (first_name, last_name);

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'members'
      AND index_name = 'ft_members_name'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE members DROP INDEX ft_members_name',
    'SELECT \"ft_members_name does not exist, skipping drop\" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE members
ADD FULLTEXT INDEX ft_members_name (first_name, last_name);

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'suppliers'
      AND index_name = 'ft_suppliers_text'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE suppliers DROP INDEX ft_suppliers_text',
    'SELECT \"ft_suppliers_text does not exist, skipping drop\" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE suppliers
ADD FULLTEXT INDEX ft_suppliers_text (name, address, email);

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'books'
      AND index_name = 'ft_books_text'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE books DROP INDEX ft_books_text',
    'SELECT \"ft_books_text does not exist, skipping drop\" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE books
ADD FULLTEXT INDEX ft_books_text (name, introduction, publisher, language);

-- Customer search uses MATCH(name, introduction, publisher) without language
SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'books'
      AND index_name = 'ft_books_text_customer'
);
SET @sql = IF(
    @idx_exists > 0,
    'SELECT \"ft_books_text_customer already exists\" AS message',
    'ALTER TABLE books ADD FULLTEXT INDEX ft_books_text_customer (name, introduction, publisher)'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'authors'
      AND index_name = 'ft_authors_name'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE authors DROP INDEX ft_authors_name',
    'SELECT \"ft_authors_name does not exist, skipping drop\" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE authors
ADD FULLTEXT INDEX ft_authors_name (first_name, last_name);

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'catagories'
      AND index_name = 'ft_categories_name'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE catagories DROP INDEX ft_categories_name',
    'SELECT \"ft_categories_name does not exist, skipping drop\" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
ALTER TABLE catagories
ADD FULLTEXT INDEX ft_categories_name (name);

SELECT
    table_name AS table_name,
    index_name AS index_name,
    GROUP_CONCAT(column_name ORDER BY seq_in_index) AS index_columns
FROM information_schema.statistics
WHERE table_schema = DATABASE()
  AND index_type = 'FULLTEXT'
  AND table_name IN ('books', 'authors', 'catagories', 'users', 'employees', 'members', 'suppliers')
GROUP BY table_name, index_name
ORDER BY table_name, index_name;

SELECT 'manager tables updated' AS message;

-- Normalize inventory to realistic demo stock levels
UPDATE inventory_batches
SET quantity = 30 + (sku_id % 51)
WHERE quantity IS NULL OR quantity < 20;

SELECT 'inventory_batches stock updated' AS message;

-- Ensure every store/SKU has at least one inventory batch row
INSERT INTO inventory_batches (
    sku_id,
    store_id,
    quantity,
    unit_cost,
    received_date,
    batch_code
)
SELECT
    s.sku_id,
    st.store_id,
    30 + (s.sku_id % 51) AS quantity,
    ROUND(s.unit_price * 0.6, 2) AS unit_cost,
    NOW() AS received_date,
    CONCAT('AUTO-', st.store_id, '-', s.sku_id) AS batch_code
FROM skus s
CROSS JOIN stores st
LEFT JOIN inventory_batches ib
    ON ib.sku_id = s.sku_id
   AND ib.store_id = st.store_id
WHERE ib.batch_id IS NULL;

SELECT 'inventory_batches seeded' AS message;

-- Fix payment totals for dashboard analytics (paid/finished orders only)
UPDATE payments p
JOIN (
    SELECT
        pa.payment_id,
        COALESCE(SUM(oi.quantity * s.unit_price), 0) AS payment_total
    FROM payment_allocations pa
    JOIN invoices inv ON pa.invoice_id = inv.invoice_id
    JOIN orders o ON inv.order_id = o.order_id
    JOIN order_items oi ON o.order_id = oi.order_id
    JOIN skus s ON oi.sku_id = s.sku_id
    WHERE o.order_status IN ('paid', 'finished')
    GROUP BY pa.payment_id
) totals ON totals.payment_id = p.payment_id
SET p.amount = totals.payment_total
WHERE p.amount IS NULL OR p.amount = 0;

UPDATE payment_allocations pa
JOIN invoices inv ON pa.invoice_id = inv.invoice_id
JOIN orders o ON inv.order_id = o.order_id
JOIN (
    SELECT oi.order_id, SUM(oi.quantity * s.unit_price) AS order_total
    FROM order_items oi
    JOIN skus s ON oi.sku_id = s.sku_id
    GROUP BY oi.order_id
) order_totals ON o.order_id = order_totals.order_id
SET pa.allocated_amount = order_totals.order_total
WHERE pa.allocated_amount IS NULL OR pa.allocated_amount = 0;

SELECT 'payment totals updated' AS message;
