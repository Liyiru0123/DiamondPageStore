-- finance_procedures.sql
USE book_store;

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_finance_overview$$
CREATE PROCEDURE sp_finance_overview(
    OUT p_current_month DECIMAL(12,2),
    OUT p_last_month DECIMAL(12,2),
    OUT p_growth_percent DECIMAL(8,2),
    OUT p_total_orders INT
)
BEGIN
    DECLARE v_current_start DATE;
    DECLARE v_next_start DATE;
    DECLARE v_last_start DATE;

    SET v_current_start = DATE_FORMAT(CURRENT_DATE, '%Y-%m-01');
    SET v_next_start = DATE_ADD(v_current_start, INTERVAL 1 MONTH);
    SET v_last_start = DATE_SUB(v_current_start, INTERVAL 1 MONTH);

    SELECT IFNULL(SUM(payable_amount), 0)
    INTO p_current_month
    FROM vm_finance_order_settlement
    WHERE is_settled = 1
      AND order_date >= v_current_start
      AND order_date < v_next_start;

    SELECT IFNULL(SUM(payable_amount), 0)
    INTO p_last_month
    FROM vm_finance_order_settlement
    WHERE is_settled = 1
      AND order_date >= v_last_start
      AND order_date < v_current_start;

    SELECT COUNT(*)
    INTO p_total_orders
    FROM vm_finance_order_settlement
    WHERE order_date >= v_current_start
      AND order_date < v_next_start;

    IF p_last_month = 0 THEN
        SET p_growth_percent = NULL;
    ELSE
        SET p_growth_percent = ROUND(((p_current_month - p_last_month) / p_last_month) * 100, 2);
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_finance_payment_method_summary$$
CREATE PROCEDURE sp_finance_payment_method_summary(
    IN p_start DATE,
    IN p_end DATE
)
BEGIN
    IF p_start IS NULL THEN
        SET p_start = DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);
    END IF;
    IF p_end IS NULL THEN
        SET p_end = CURRENT_DATE;
    END IF;

    SELECT
        payment_method,
        ROUND(SUM(allocated_amount), 2) AS amount
    FROM vm_finance_invoice_payment_allocation_detail
    WHERE allocation_date >= p_start
      AND allocation_date < DATE_ADD(p_end, INTERVAL 1 DAY)
    GROUP BY payment_method
    ORDER BY amount DESC;
END$$

DROP PROCEDURE IF EXISTS sp_finance_revenue_by_date$$
CREATE PROCEDURE sp_finance_revenue_by_date(
    IN p_start DATE,
    IN p_end DATE
)
BEGIN
    IF p_start IS NULL THEN
        SET p_start = DATE_SUB(CURRENT_DATE, INTERVAL 13 DAY);
    END IF;
    IF p_end IS NULL THEN
        SET p_end = CURRENT_DATE;
    END IF;

    SELECT
        order_day,
        SUM(revenue) AS revenue
    FROM vw_finance_revenue_by_date
    WHERE order_day >= p_start
      AND order_day <= p_end
    GROUP BY order_day
    ORDER BY order_day;
END$$

DROP PROCEDURE IF EXISTS sp_finance_purchase_cost_by_date$$
CREATE PROCEDURE sp_finance_purchase_cost_by_date(
    IN p_start DATE,
    IN p_end DATE
)
BEGIN
    IF p_start IS NULL THEN
        SET p_start = DATE_SUB(CURRENT_DATE, INTERVAL 13 DAY);
    END IF;
    IF p_end IS NULL THEN
        SET p_end = CURRENT_DATE;
    END IF;

    SELECT
        cost_day,
        SUM(cost) AS cost
    FROM vw_finance_purchase_cost_by_date
    WHERE cost_day >= p_start
      AND cost_day <= p_end
    GROUP BY cost_day
    ORDER BY cost_day;
END$$

DROP PROCEDURE IF EXISTS sp_finance_order_list$$
CREATE PROCEDURE sp_finance_order_list(
    IN p_search VARCHAR(100),
    IN p_status VARCHAR(20),
    IN p_store_id INT,
    IN p_start DATE,
    IN p_end DATE
)
BEGIN
    SELECT
        order_id,
        store_id,
        store_name,
        member_id,
        member_name,
        order_status,
        order_date,
        note,
        payable_amount,
        paid_amount,
        item_count,
        total_quantity
    FROM vw_finance_order_list
    WHERE (p_search IS NULL OR p_search = ''
        OR CONVERT(CAST(order_id AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(CAST(member_id AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(member_name USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci)
      AND (p_status IS NULL OR p_status = '' OR order_status = p_status)
      AND (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id)
      AND (p_start IS NULL OR DATE(order_date) >= p_start)
      AND (p_end IS NULL OR DATE(order_date) <= p_end)
    ORDER BY order_date DESC;
END$$

DROP PROCEDURE IF EXISTS sp_finance_invoice_list$$
CREATE PROCEDURE sp_finance_invoice_list(
    IN p_search VARCHAR(100),
    IN p_status VARCHAR(20),
    IN p_order_id INT,
    IN p_start DATE,
    IN p_end DATE
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
        last_paid_at
    FROM vw_finance_invoice_list
    WHERE (p_search IS NULL OR p_search = ''
        OR CONVERT(CAST(invoice_id AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(CAST(order_id AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(CAST(invoice_number AS CHAR) USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci
        OR CONVERT(member_name USING utf8mb4) COLLATE utf8mb4_general_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_general_ci)
      AND (p_status IS NULL OR p_status = '' OR display_status = p_status)
      AND (p_order_id IS NULL OR p_order_id = 0 OR order_id = p_order_id)
      AND (p_start IS NULL OR DATE(issue_date) >= p_start)
      AND (p_end IS NULL OR DATE(issue_date) <= p_end)
    ORDER BY issue_date DESC;
END$$

DROP PROCEDURE IF EXISTS sp_finance_order_detail$$
CREATE PROCEDURE sp_finance_order_detail(
    IN p_order_id INT
)
BEGIN
    SELECT
        order_id,
        store_id,
        store_name,
        member_id,
        member_name,
        order_status,
        order_date,
        note,
        payable_amount,
        paid_amount,
        item_count,
        total_quantity
    FROM vw_finance_order_list
    WHERE order_id = p_order_id
    LIMIT 1;

    SELECT
        oi.order_id,
        oi.sku_id,
        b.ISBN,
        b.name AS book_title,
        s.binding,
        oi.quantity,
        s.unit_price,
        (oi.quantity * s.unit_price) AS subtotal
    FROM order_items oi
    JOIN skus s ON s.sku_id = oi.sku_id
    JOIN books b ON b.ISBN = s.ISBN
    WHERE oi.order_id = p_order_id;
END$$

DROP PROCEDURE IF EXISTS sp_finance_invoice_detail$$
CREATE PROCEDURE sp_finance_invoice_detail(
    IN p_invoice_id INT
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
        last_paid_at
    FROM vw_finance_invoice_list
    WHERE invoice_id = p_invoice_id
    LIMIT 1;

    SELECT
        pa.payment_id,
        pa.allocated_amount,
        pa.create_date AS allocation_date,
        p.payment_method,
        p.amount AS payment_amount
    FROM payment_allocations pa
    JOIN payments p ON p.payment_id = pa.payment_id
    WHERE pa.invoice_id = p_invoice_id
    ORDER BY pa.create_date DESC;
END$$

DROP PROCEDURE IF EXISTS sp_finance_create_invoice$$
CREATE PROCEDURE sp_finance_create_invoice(
    IN p_order_id INT,
    OUT p_invoice_id INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_existing INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to create invoice';
        ROLLBACK;
    END;

    START TRANSACTION;

    SELECT invoice_id INTO v_existing
    FROM invoices
    WHERE order_id = p_order_id
    LIMIT 1;

    IF v_existing IS NOT NULL THEN
        SET p_invoice_id = v_existing;
        SET p_result_code = 0;
        SET p_result_message = 'Invoice already exists';
        ROLLBACK;
    ELSE
        INSERT INTO invoices (order_id, invoice_status, invoice_number, issue_date, due_date, update_date, note)
        VALUES (
            p_order_id,
            'issued',
            p_order_id,
            NOW(),
            DATE_ADD(NOW(), INTERVAL 30 DAY),
            NOW(),
            'Created by finance'
        );

        SET p_invoice_id = LAST_INSERT_ID();
        SET p_result_code = 1;
        SET p_result_message = 'Invoice created';
        COMMIT;
    END IF;
END$$

DROP PROCEDURE IF EXISTS sp_finance_receive_payment$$
CREATE PROCEDURE sp_finance_receive_payment(
    IN p_invoice_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_method VARCHAR(50),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_member_id INT;
    DECLARE v_payment_id INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to record payment';
        ROLLBACK;
    END;

    START TRANSACTION;

    SELECT member_id INTO v_member_id
    FROM vm_finance_invoice_base
    WHERE invoice_id = p_invoice_id
    LIMIT 1;

    IF v_member_id IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'Invoice not found';
        ROLLBACK;
    ELSE
        INSERT INTO payments (member_id, create_date, update_date, amount, payment_method, note)
        VALUES (v_member_id, NOW(), NOW(), p_amount, p_payment_method, 'Finance payment');

        SET v_payment_id = LAST_INSERT_ID();

        INSERT INTO payment_allocations (invoice_id, payment_id, create_date, allocated_amount, note)
        VALUES (p_invoice_id, v_payment_id, NOW(), p_amount, 'Finance allocation');

        SET p_result_code = 1;
        SET p_result_message = 'Payment recorded';
        COMMIT;
    END IF;
END$$

DELIMITER ;
