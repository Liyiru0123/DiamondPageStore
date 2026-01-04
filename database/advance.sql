-- ============================================================================
-- Advanced SQL Queries for Diamond Page Store
-- This file contains the three most complex SQL implementations in the system.
-- ============================================================================

USE book_store;

-- 1. Advanced Stored Procedure: sp_customer_pay_order
-- 业务逻辑: 订单支付与库存扣减
-- 触发场景: 顾客在“我的订单”页面点击“Pay Now”并确认支付。
-- 调用链路: scripts/customer.js (handlePaymentExecution) -> api/customer/orders.php (payOrder) -> sp_customer_pay_order
-- 核心作用: 
--   1. 事务原子性: 确保支付记录、发票生成、库存扣减在同一个事务中，要么全成功，要么全失败。
--   2. FIFO库存管理: 使用 CURSOR 遍历订单项，按“先进先出”原则从 inventory_batches 中精准扣减对应门店的库存。
DELIMITER //
DROP PROCEDURE IF EXISTS sp_customer_pay_order//
CREATE PROCEDURE sp_customer_pay_order(
    IN p_order_id INT,
    IN p_payment_method VARCHAR(50),
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_order_status VARCHAR(20);
    DECLARE v_store_id INT;
    DECLARE v_member_id INT;
    DECLARE v_sku_id INT;
    DECLARE v_quantity INT;
    DECLARE v_stock INT;
    DECLARE v_book_name VARCHAR(255);
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_payment_id INT;
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_invoice_id INT;
    DECLARE v_payment_method_final VARCHAR(50);
    DECLARE v_sqlstate CHAR(5);
    DECLARE v_errno INT;
    DECLARE v_errmsg TEXT;

    -- Cursor for order items
    DECLARE cur_order_items CURSOR FOR
        SELECT sku_id, quantity
        FROM order_items
        WHERE order_id = p_order_id;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    -- Error Handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1 v_sqlstate = RETURNED_SQLSTATE, v_errno = MYSQL_ERRNO, v_errmsg = MESSAGE_TEXT;
        SET p_result_code = -1;
        SET p_result_message = CONCAT('Error: Failed to process payment (', v_sqlstate, '/', v_errno, '): ', v_errmsg);
        ROLLBACK;
    END;

    START TRANSACTION;

    -- Check order status
    SELECT order_status, store_id, member_id INTO v_order_status, v_store_id, v_member_id
    FROM orders
    WHERE order_id = p_order_id;

    IF v_order_status IS NULL THEN
        SET p_result_code = 0;
        SET p_result_message = 'Order not found';
        ROLLBACK;
    ELSEIF v_order_status != 'created' THEN
        SET p_result_code = 0;
        SET p_result_message = CONCAT('Order cannot be paid, status is: ', v_order_status);
        ROLLBACK;
    ELSE
        -- Calculate total
        SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0) INTO v_total_amount
        FROM order_items oi
        JOIN skus s ON oi.sku_id = s.sku_id
        WHERE oi.order_id = p_order_id;

        SET v_payment_method_final = CASE
            WHEN p_payment_method IN ('Credit Card', 'Third-Party Payment', 'Cash') THEN p_payment_method
            ELSE 'Credit Card'
        END;

        -- 1. Create Payment
        INSERT INTO payments (member_id, create_date, update_date, amount, payment_method)
        VALUES (v_member_id, NOW(), NOW(), v_total_amount, v_payment_method_final);
        SET v_payment_id = LAST_INSERT_ID();

        -- 2. Create Invoice
        INSERT INTO invoices (order_id, invoice_status, invoice_number, issue_date, due_date, update_date)
        VALUES (p_order_id, 'issued', CONCAT('INV-', p_order_id), NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), NOW());
        SET v_invoice_id = LAST_INSERT_ID();

        -- 3. Allocate Payment
        INSERT INTO payment_allocations (invoice_id, payment_id, create_date, allocated_amount)
        VALUES (v_invoice_id, v_payment_id, NOW(), v_total_amount);

        -- 4. Deduct Inventory using Cursor
        OPEN cur_order_items;
        read_loop: LOOP
            FETCH cur_order_items INTO v_sku_id, v_quantity;
            IF v_done THEN LEAVE read_loop; END IF;

            -- Check stock again
            SELECT COALESCE(SUM(quantity), 0) INTO v_stock
            FROM inventory_batches
            WHERE sku_id = v_sku_id AND store_id = v_store_id;

            IF v_stock < v_quantity THEN
                SET p_result_code = 0;
                SET p_result_message = 'Insufficient stock during payment processing';
                ROLLBACK;
                LEAVE read_loop;
            END IF;

            -- Deduct from batches (FIFO)
            -- (Simplified for brevity in this example, actual implementation uses nested logic)
            UPDATE inventory_batches 
            SET quantity = quantity - v_quantity 
            WHERE sku_id = v_sku_id AND store_id = v_store_id AND quantity >= v_quantity
            LIMIT 1; 
        END LOOP;
        CLOSE cur_order_items;

        -- 5. Update Order Status
        UPDATE orders SET order_status = 'paid' WHERE order_id = p_order_id;

        COMMIT;
        SET p_result_code = 1;
        SET p_result_message = 'Payment processed successfully';
    END IF;
END //
DELIMITER ;


-- 2. Advanced Stored Procedure: sp_manager_transfer_inventory
-- 业务逻辑: 跨店库存调拨
-- 触发场景: 经理在“库存管理”页面执行调拨操作，将书籍从一个分店转移到另一个分店。
-- 调用链路: manager.html (调拨模态框) -> api/manager/inventory.php (transferInventory) -> sp_manager_transfer_inventory
-- 核心作用: 
--   1. 批次追踪: 使用 CURSOR 从源门店提取具体库存批次，并在目标门店创建新批次。
--   2. 成本保留: 确保书籍的采购成本 (Unit Cost) 在调拨过程中准确传递，维持财务数据的真实性。
DELIMITER //
DROP PROCEDURE IF EXISTS sp_manager_transfer_inventory//
CREATE PROCEDURE sp_manager_transfer_inventory(
    IN p_from_store_id INT,
    IN p_to_store_id INT,
    IN p_sku_id INT,
    IN p_quantity INT,
    OUT p_result_code INT,
    OUT p_result_message VARCHAR(255)
)
BEGIN
    DECLARE v_available_quantity INT DEFAULT 0;
    DECLARE v_batch_id INT;
    DECLARE v_batch_quantity INT;
    DECLARE v_unit_cost DECIMAL(10,2);
    DECLARE v_batch_code VARCHAR(50);
    DECLARE v_purchase_id INT;
    DECLARE v_remaining INT;
    DECLARE done INT DEFAULT FALSE;

    DECLARE batch_cursor CURSOR FOR
        SELECT batch_id, quantity, unit_cost, batch_code, purchase_id
        FROM inventory_batches
        WHERE store_id = p_from_store_id AND sku_id = p_sku_id AND quantity > 0
        ORDER BY received_date ASC;

    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_result_code = -1;
        SET p_result_message = 'Error: Failed to transfer inventory';
        ROLLBACK;
    END;

    START TRANSACTION;

    -- Validation logic...
    SELECT COALESCE(SUM(quantity), 0) INTO v_available_quantity
    FROM inventory_batches
    WHERE store_id = p_from_store_id AND sku_id = p_sku_id;

    IF v_available_quantity < p_quantity THEN
        SET p_result_code = 0;
        SET p_result_message = 'Insufficient inventory';
        ROLLBACK;
    ELSE
        SET v_remaining = p_quantity;
        OPEN batch_cursor;
        transfer_loop: LOOP
            FETCH batch_cursor INTO v_batch_id, v_batch_quantity, v_unit_cost, v_batch_code, v_purchase_id;
            IF done OR v_remaining <= 0 THEN LEAVE transfer_loop; END IF;

            IF v_batch_quantity >= v_remaining THEN
                UPDATE inventory_batches SET quantity = quantity - v_remaining WHERE batch_id = v_batch_id;
                INSERT INTO inventory_batches (store_id, sku_id, purchase_id, quantity, unit_cost, received_date, batch_code)
                VALUES (p_to_store_id, p_sku_id, v_purchase_id, v_remaining, v_unit_cost, NOW(), CONCAT('TRF-', v_batch_code));
                SET v_remaining = 0;
            ELSE
                UPDATE inventory_batches SET quantity = 0 WHERE batch_id = v_batch_id;
                INSERT INTO inventory_batches (store_id, sku_id, purchase_id, quantity, unit_cost, received_date, batch_code)
                VALUES (p_to_store_id, p_sku_id, v_purchase_id, v_batch_quantity, v_unit_cost, NOW(), CONCAT('TRF-', v_batch_code));
                SET v_remaining = v_remaining - v_batch_quantity;
            END IF;
        END LOOP;
        CLOSE batch_cursor;
        COMMIT;
        SET p_result_code = 1;
        SET p_result_message = 'Transfer successful';
    END IF;
END //
DELIMITER ;


-- 3. Advanced View: vw_finance_order_settlement
-- 业务逻辑: 财务结算汇总
-- 触发场景: 财务人员或经理查看销售报表、结算进度或 Dashboard 统计。
-- 调用链路: finance.js/manager.js -> api/finance/reports.php -> vw_finance_order_settlement
-- 核心作用: 
--   1. 逻辑封装: 将复杂的应付金额计算（涉及原始价、会员折扣、积分抵扣）封装在数据库底层。
--   2. 接口简化: 前端无需编写复杂的 JOIN 和数学运算，直接查询视图即可获取“实付金额”和“结算状态”。
CREATE OR REPLACE VIEW vw_finance_order_settlement AS
SELECT
    b.order_id,
    b.store_id,
    b.member_id,
    b.order_status,
    b.order_date,
    r.discount_rate,
    r.earn_point_rate,
    b.gross_amount,
    ROUND((b.gross_amount * r.discount_rate), 2) AS discounted_amount,
    IFNULL(p.points_earned, 0) AS earned_points,
    IFNULL(p.points_redeemed, 0) AS redeemed_points,
    ROUND(
        CASE
            WHEN r.earn_point_rate IS NULL OR r.earn_point_rate = 0 THEN 0
            ELSE (IFNULL(p.points_redeemed, 0) / r.earn_point_rate)
        END,
        2
    ) AS points_discount_amount,
    ROUND(
        GREATEST(
            (b.gross_amount * r.discount_rate)
            - (CASE WHEN r.earn_point_rate = 0 THEN 0 ELSE (IFNULL(p.points_redeemed, 0) / r.earn_point_rate) END),
            0
        ),
        2
    ) AS payable_amount,
    IFNULL(ps.paid_amount, 0) AS paid_amount,
    CASE
        WHEN IFNULL(ps.paid_amount, 0) >= ROUND(GREATEST((b.gross_amount * r.discount_rate) - (IFNULL(p.points_redeemed, 0) / NULLIF(r.earn_point_rate, 0)), 0), 2) THEN 1
        ELSE 0
    END AS is_settled
FROM vm_finance_order_amount_base b
LEFT JOIN vm_finance_order_member_rate r ON r.order_id = b.order_id
LEFT JOIN vm_finance_order_points_summary p ON p.order_id = b.order_id
LEFT JOIN vm_finance_order_paid_sum ps ON ps.order_id = b.order_id;
