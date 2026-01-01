-- triggers.sql
-- Core triggers

USE book_store;

DELIMITER $$

-- Order payment: deduct inventory (FIFO)
DROP TRIGGER IF EXISTS trg_order_payment_deduct_inventory$$
CREATE TRIGGER trg_order_payment_deduct_inventory
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    DECLARE v_sku_id INT;
    DECLARE v_order_quantity INT;
    DECLARE v_remaining INT;
    DECLARE v_batch_id INT;
    DECLARE v_batch_quantity INT;
    DECLARE v_deduct_quantity INT;
    DECLARE done INT DEFAULT FALSE;

    DECLARE order_items_cursor CURSOR FOR
        SELECT sku_id, quantity
        FROM order_items
        WHERE order_id = NEW.order_id;

    DECLARE batch_cursor CURSOR FOR
        SELECT batch_id, quantity
        FROM inventory_batches
        WHERE store_id = NEW.store_id AND sku_id = v_sku_id AND quantity > 0
        ORDER BY received_date ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    IF NEW.order_status = 'paid' AND OLD.order_status != 'paid' THEN
        OPEN order_items_cursor;

        item_loop: LOOP
            SET done = FALSE;
            FETCH order_items_cursor INTO v_sku_id, v_order_quantity;

            IF done THEN
                LEAVE item_loop;
            END IF;

            SET v_remaining = v_order_quantity;

            OPEN batch_cursor;

            batch_loop: LOOP
                SET done = FALSE;
                FETCH batch_cursor INTO v_batch_id, v_batch_quantity;

                IF done OR v_remaining <= 0 THEN
                    LEAVE batch_loop;
                END IF;

                IF v_batch_quantity >= v_remaining THEN
                    SET v_deduct_quantity = v_remaining;
                ELSE
                    SET v_deduct_quantity = v_batch_quantity;
                END IF;

                UPDATE inventory_batches
                SET quantity = quantity - v_deduct_quantity
                WHERE batch_id = v_batch_id;

                SET v_remaining = v_remaining - v_deduct_quantity;
            END LOOP;

            CLOSE batch_cursor;
        END LOOP;

        CLOSE order_items_cursor;
    END IF;
END$$

-- Order payment: add points and ledger note
DROP TRIGGER IF EXISTS trg_order_payment_add_points$$
CREATE TRIGGER trg_order_payment_add_points
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    DECLARE v_total_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_points_to_add INT DEFAULT 0;

    -- 逻辑 1: 支付成功，增加积分
    IF NEW.order_status = 'paid' AND OLD.order_status != 'paid' THEN
        SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
        INTO v_total_amount
        FROM order_items oi
        JOIN skus s ON oi.sku_id = s.sku_id
        WHERE oi.order_id = NEW.order_id;

        SET v_points_to_add = FLOOR(v_total_amount);

        UPDATE members
        SET point = point + v_points_to_add
        WHERE member_id = NEW.member_id;

        INSERT INTO point_ledgers (member_id, order_id, points_change, points_delta, change_date, reason)
        VALUES (
            NEW.member_id,
            NEW.order_id,
            v_points_to_add,
            v_points_to_add,
            CURRENT_TIMESTAMP,
            CONCAT('Order #', NEW.order_id, ' payment - points added: ', v_points_to_add)
        );
    END IF;

    -- 逻辑 2: 订单退款，扣除积分
    IF NEW.order_status = 'refunded' AND OLD.order_status != 'refunded' THEN
        SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
        INTO v_total_amount
        FROM order_items oi
        JOIN skus s ON oi.sku_id = s.sku_id
        WHERE oi.order_id = NEW.order_id;

        SET v_points_to_add = FLOOR(v_total_amount);

        UPDATE members
        SET point = GREATEST(0, CAST(point AS SIGNED) - v_points_to_add)
        WHERE member_id = NEW.member_id;

        INSERT INTO point_ledgers (member_id, order_id, points_change, points_delta, change_date, reason)
        VALUES (
            NEW.member_id,
            NEW.order_id,
            -v_points_to_add,
            -v_points_to_add,
            CURRENT_TIMESTAMP,
            CONCAT('Order #', NEW.order_id, ' refunded - points deducted: ', v_points_to_add)
        );
    END IF;
END$$

-- Order refund: restore inventory
DROP TRIGGER IF EXISTS trg_order_refund_restore_inventory$$
CREATE TRIGGER trg_order_refund_restore_inventory
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    DECLARE v_sku_id INT;
    DECLARE v_order_quantity INT;
    DECLARE v_batch_id INT;
    DECLARE done INT DEFAULT FALSE;

    DECLARE order_items_cursor CURSOR FOR
        SELECT sku_id, quantity
        FROM order_items
        WHERE order_id = NEW.order_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    -- 当订单状态变为 'refunded' 时触发
    IF NEW.order_status = 'refunded' AND OLD.order_status != 'refunded' THEN
        OPEN order_items_cursor;

        item_loop: LOOP
            FETCH order_items_cursor INTO v_sku_id, v_order_quantity;
            IF done THEN
                LEAVE item_loop;
            END IF;

            -- 将库存退回到该门店该SKU最新的一个批次中
            SELECT batch_id INTO v_batch_id
            FROM inventory_batches
            WHERE store_id = NEW.store_id AND sku_id = v_sku_id
            ORDER BY received_date DESC
            LIMIT 1;

            IF v_batch_id IS NOT NULL THEN
                UPDATE inventory_batches
                SET quantity = quantity + v_order_quantity
                WHERE batch_id = v_batch_id;
            END IF;
        END LOOP;

        CLOSE order_items_cursor;
    END IF;
END$$

-- Member points change: update tier
DROP TRIGGER IF EXISTS trg_update_member_tier$$
CREATE TRIGGER trg_update_member_tier
AFTER UPDATE ON members
FOR EACH ROW
BEGIN
    DECLARE v_total_spent DECIMAL(10,2) DEFAULT 0;
    DECLARE v_new_tier_id INT;
    DECLARE v_current_tier_id INT;

    IF NEW.point != OLD.point THEN
        SET v_current_tier_id = NEW.member_tier_id;

        SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
        INTO v_total_spent
        FROM orders o
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN skus s ON oi.sku_id = s.sku_id
        WHERE o.member_id = NEW.member_id
        AND o.order_status = 'paid';

        SELECT member_tier_id
        INTO v_new_tier_id
        FROM member_tiers
        WHERE min_lifetime_spend <= v_total_spent
        ORDER BY min_lifetime_spend DESC
        LIMIT 1;

        IF v_new_tier_id IS NOT NULL AND v_new_tier_id != v_current_tier_id THEN
            UPDATE members
            SET member_tier_id = v_new_tier_id
            WHERE member_id = NEW.member_id;
        END IF;
    END IF;
END$$

DELIMITER ;

SELECT 'triggers created' AS message;
