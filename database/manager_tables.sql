-- manager_tables.sql
-- Manager tables

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
