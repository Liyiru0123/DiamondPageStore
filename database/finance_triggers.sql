-- finance_triggers.sql
USE book_store;

DELIMITER $$

DROP TRIGGER IF EXISTS trg_finance_payment_allocation_update_invoice$$
CREATE TRIGGER trg_finance_payment_allocation_update_invoice
AFTER INSERT ON payment_allocations
FOR EACH ROW
BEGIN
    DECLARE v_invoice_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_paid_amount DECIMAL(10,2) DEFAULT 0;

    SELECT invoice_amount INTO v_invoice_amount
    FROM vm_invoice_settlement
    WHERE invoice_id = NEW.invoice_id;

    SELECT IFNULL(SUM(allocated_amount), 0) INTO v_paid_amount
    FROM payment_allocations
    WHERE invoice_id = NEW.invoice_id;

    IF v_paid_amount >= v_invoice_amount THEN
        UPDATE invoices
        SET invoice_status = 'paid',
            update_date = NOW()
        WHERE invoice_id = NEW.invoice_id;
    ELSE
        UPDATE invoices
        SET invoice_status = 'partly_paid',
            update_date = NOW()
        WHERE invoice_id = NEW.invoice_id;
    END IF;
END$$

DELIMITER ;
