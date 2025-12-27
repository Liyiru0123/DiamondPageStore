-- finance_events.sql
USE book_store;

DELIMITER $$

DROP EVENT IF EXISTS ev_finance_void_stale_drafts$$
CREATE EVENT ev_finance_void_stale_drafts
ON SCHEDULE EVERY 1 DAY
DO
BEGIN
    UPDATE invoices
    SET invoice_status = 'voided',
        update_date = NOW(),
        note = CONCAT(IFNULL(note, ''), ' | Auto-void stale draft')
    WHERE invoice_status = 'draft'
      AND issue_date < DATE_SUB(NOW(), INTERVAL 30 DAY);
END$$

DELIMITER ;
