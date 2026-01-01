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
