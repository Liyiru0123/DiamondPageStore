SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- 1. 订单主表 (Order Header)
-- 记录谁(Member)在哪个店(Store)买了东西，以及当前状态
-- --------------------------------------------------------
CREATE TABLE `orders` (
  `order_id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) NOT NULL,
  `member_id` int(11) NOT NULL,
  `order_status` enum('created','paid','cancelled','refunded','finished') NOT NULL DEFAULT 'created',
  `order_date` datetime NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`order_id`),
  KEY `fk_orders_stores1_idx` (`store_id`),
  KEY `fk_orders_members1_idx` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 2. 订单明细表 (Order Line Items)
-- 记录具体买了什么(SKU)和数量
-- --------------------------------------------------------
CREATE TABLE `order_items` (
  `sku_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL,
  PRIMARY KEY (`sku_id`,`order_id`),
  KEY `fk_order_items_SKUs1_idx` (`sku_id`),
  KEY `fk_order_items_orders1_idx` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 3. 发票表 (Invoices)
-- 财务凭证，通常在订单创建或支付时生成
-- --------------------------------------------------------
CREATE TABLE `invoices` (
  `invoice_id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `invoice_status` enum('draft','issued','partly_paid','paid','voided','credited') NOT NULL DEFAULT 'draft',
  `invoice_number` int(10) UNSIGNED NOT NULL,
  `issue_date` datetime NOT NULL,
  `due_date` datetime NOT NULL,
  `update_date` datetime NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`invoice_id`),
  KEY `fk_invoices_orders1_idx` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 4. 积分流水表 (Point Ledgers)
-- 订单支付成功后，系统会自动在此表记录积分变动
-- --------------------------------------------------------
CREATE TABLE `point_ledgers` (
  `point_ledger_id` int(11) NOT NULL AUTO_INCREMENT,
  `member_id` int(11) NOT NULL,
  `points_change` int(11) NOT NULL,
  `order_id` int(11) DEFAULT NULL,
  `change_date` datetime NOT NULL DEFAULT current_timestamp(),
  `reason` varchar(255) DEFAULT NULL,
  `points_delta` int(11) NOT NULL,
  PRIMARY KEY (`point_ledger_id`),
  KEY `fk_point_ledgers_orders1_idx` (`order_id`),
  KEY `fk_point_ledgers_members` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 关键触发器 1: 订单支付后自动增加积分
-- --------------------------------------------------------
DELIMITER $$
CREATE TRIGGER `trg_order_payment_add_points` AFTER UPDATE ON `orders` FOR EACH ROW BEGIN
    DECLARE v_total_amount DECIMAL(10,2) DEFAULT 0;
    DECLARE v_points_to_add INT DEFAULT 0;

    -- 仅当状态变为 'paid' 时触发
    IF NEW.order_status = 'paid' AND OLD.order_status != 'paid' THEN
        -- 计算订单总金额
        SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0)
        INTO v_total_amount
        FROM order_items oi
        JOIN skus s ON oi.sku_id = s.sku_id
        WHERE oi.order_id = NEW.order_id;

        -- 简单逻辑：1元 = 1分 (向下取整)
        SET v_points_to_add = FLOOR(v_total_amount);

        -- 更新会员积分余额
        UPDATE members
        SET point = point + v_points_to_add
        WHERE member_id = NEW.member_id;

        -- 记录积分流水
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
END
$$
DELIMITER ;

-- --------------------------------------------------------
-- 关键触发器 2: 订单支付后自动扣减库存 (先进先出 FIFO)
-- --------------------------------------------------------
DELIMITER $$
CREATE TRIGGER `trg_order_payment_deduct_inventory` AFTER UPDATE ON `orders` FOR EACH ROW BEGIN
    DECLARE v_sku_id INT;
    DECLARE v_order_quantity INT;
    DECLARE v_remaining INT;
    DECLARE v_batch_id INT;
    DECLARE v_batch_quantity INT;
    DECLARE v_deduct_quantity INT;
    DECLARE done INT DEFAULT FALSE;

    -- 遍历订单中的每一项商品
    DECLARE order_items_cursor CURSOR FOR
        SELECT sku_id, quantity
        FROM order_items
        WHERE order_id = NEW.order_id;

    -- 查找该店铺、该商品有库存的批次，按进货日期排序（FIFO）
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

            -- 循环扣减批次库存
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
END
$$
DELIMITER ;

-- --------------------------------------------------------
-- 外键约束
-- --------------------------------------------------------
ALTER TABLE `orders`
  ADD CONSTRAINT `fk_orders_members1` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_orders_stores1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE;

ALTER TABLE `order_items`
  ADD CONSTRAINT `fk_order_items_SKUs1` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`sku_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_order_items_orders1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE;

ALTER TABLE `invoices`
  ADD CONSTRAINT `fk_invoices_orders1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON UPDATE CASCADE;

ALTER TABLE `point_ledgers`
  ADD CONSTRAINT `fk_point_ledgers_members` FOREIGN KEY (`member_id`) REFERENCES `members` (`member_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_point_ledgers_orders` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;