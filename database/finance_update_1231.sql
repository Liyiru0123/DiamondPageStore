
-- 修改finance的overview
USE book_store;
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_finance_overview $$
CREATE PROCEDURE sp_finance_overview(
    OUT p_current_month DECIMAL(12,2),
    OUT p_last_month    DECIMAL(12,2),
    OUT p_growth_percent DECIMAL(8,2),
    OUT p_total_orders  INT,
    IN  p_store_id INT
)
BEGIN
    DECLARE v_current_start DATE;
    DECLARE v_next_start DATE;
    DECLARE v_last_start DATE;

    SET v_current_start = DATE_FORMAT(CURRENT_DATE, '%Y-%m-01');
    SET v_next_start    = DATE_ADD(v_current_start, INTERVAL 1 MONTH);
    SET v_last_start    = DATE_SUB(v_current_start, INTERVAL 1 MONTH);

    SELECT IFNULL(SUM(payable_amount), 0)
      INTO p_current_month
    FROM vw_finance_order_settlement
    WHERE order_status = 'paid'
      AND order_date >= v_current_start
      AND order_date <  v_next_start
      AND (p_store_id IS NULL OR store_id = p_store_id);

    SELECT IFNULL(SUM(payable_amount), 0)
      INTO p_last_month
    FROM vw_finance_order_settlement
    WHERE order_status = 'paid'
      AND order_date >= v_last_start
      AND order_date <  v_current_start
      AND (p_store_id IS NULL OR store_id = p_store_id);

    SELECT COUNT(*)
      INTO p_total_orders
    FROM vw_finance_order_settlement
    WHERE order_status = 'paid'
      AND order_date >= v_current_start
      AND order_date <  v_next_start
      AND (p_store_id IS NULL OR store_id = p_store_id);

    IF p_last_month = 0 THEN
        SET p_growth_percent = NULL;
    ELSE
        SET p_growth_percent = ROUND(((p_current_month - p_last_month) / p_last_month) * 100, 2);
    END IF;
END $$

DELIMITER ;

