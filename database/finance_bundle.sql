-- finance_bundle.sql
-- Combined finance updates, triggers, and events

USE book_store;

-- ============================================================================
-- Source: finance_update.sql
-- ============================================================================
-- 数据库性能优化补丁
-- 描述：为发票表添加索引，解决筛选和排序卡顿问题
-- 日期：2025-10-29

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'invoices'
      AND index_name = 'idx_issue_date'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE `invoices` DROP INDEX `idx_issue_date`',
    'SELECT "idx_issue_date does not exist, skipping drop" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- 1. 优化按日期排序 (ORDER BY issue_date) 和日期范围筛选
ALTER TABLE `invoices` ADD INDEX `idx_issue_date` (`issue_date`);

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'invoices'
      AND index_name = 'idx_order_id'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE `invoices` DROP INDEX `idx_order_id`',
    'SELECT "idx_order_id does not exist, skipping drop" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- 2. 优化按订单ID精确查找 (WHERE order_id = ...)
ALTER TABLE `invoices` ADD INDEX `idx_order_id` (`order_id`);

SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'invoices'
      AND index_name = 'idx_status'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE `invoices` DROP INDEX `idx_status`',
    'SELECT "idx_status does not exist, skipping drop" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- 3. 优化按状态筛选 (WHERE status = ...)
ALTER TABLE `invoices` ADD INDEX `idx_status` (`invoice_status`);


-- ---------------------------------------------------------
-- 重写存储过程：sp_finance_invoice_list (高性能优化版)
-- 描述：支持金额筛选，并针对 idx_issue_date, idx_order_id, idx_status 进行了索引优化
-- 日期：2025-10-29
-- ---------------------------------------------------------

-- ============================================================================
-- Source: finance_update1230.sql
-- ============================================================================



-- 1. 必须先删除旧版，否则会报“存储过程已存在”或“参数数量不匹配”错误
DROP PROCEDURE IF EXISTS `sp_finance_invoice_list`;

-- 2. 设置分隔符，防止语句内部的分号导致执行提前中断
DELIMITER //

CREATE PROCEDURE `sp_finance_invoice_list`(
    IN `p_search` VARCHAR(255), 
    IN `p_status` VARCHAR(50), 
    IN `p_order_id` INT, 
    IN `p_start_date` DATE, 
    IN `p_end_date` DATE, 
    IN `p_min_amount` DECIMAL(10,2), 
    IN `p_max_amount` DECIMAL(10,2), 
    IN `p_store_id` INT  -- 第 8 个参数：分店隔离核心
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
        last_paid_at,
        is_settled
    FROM vw_finance_invoice_list
    WHERE 
        -- 核心隔离逻辑：只显示匹配的分店数据
        (p_store_id IS NULL OR store_id = p_store_id)
        
        -- 1. 关键词搜索 (支持成员名、发票号、订单号)
        AND (p_search IS NULL OR p_search = '' 
        OR CONVERT(member_name USING utf8mb4) COLLATE utf8mb4_0900_ai_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_0900_ai_ci
        OR CAST(invoice_number AS CHAR) COLLATE utf8mb4_0900_ai_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_0900_ai_ci
        OR CAST(order_id AS CHAR) COLLATE utf8mb4_0900_ai_ci LIKE CONCAT('%', CONVERT(p_search USING utf8mb4), '%') COLLATE utf8mb4_0900_ai_ci)
        
        -- 2. 状态筛选
        AND (p_status IS NULL OR p_status = '' OR p_status = 'All Statuses' OR invoice_status = p_status)
        
        -- 3. 订单ID筛选
        AND (p_order_id IS NULL OR p_order_id = 0 OR order_id = p_order_id)
        
        -- 4. 日期范围筛选
        AND (p_start_date IS NULL OR issue_date >= p_start_date)
        AND (p_end_date IS NULL OR issue_date < DATE_ADD(p_end_date, INTERVAL 1 DAY))
        
        -- 5. 金额范围筛选
        AND (p_min_amount IS NULL OR invoice_amount >= p_min_amount)
        AND (p_max_amount IS NULL OR invoice_amount <= p_max_amount)
        
    ORDER BY issue_date DESC;
END //

DELIMITER ;


SET @idx_exists = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = DATABASE()
      AND table_name = 'orders'
      AND index_name = 'idx_member_id'
);
SET @sql = IF(
    @idx_exists > 0,
    'ALTER TABLE `orders` DROP INDEX `idx_member_id`',
    'SELECT "idx_member_id does not exist, skipping drop" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
-- 1. 只有在 member_id 还没有索引的情况下，才执行这一句：
ALTER TABLE `orders` ADD INDEX `idx_member_id` (`member_id`);




DROP PROCEDURE IF EXISTS `sp_finance_order_list`;

DELIMITER //

CREATE PROCEDURE `sp_finance_order_list`(
    IN `p_search` VARCHAR(100),
    IN `p_status` VARCHAR(20),
    IN `p_store_id` INT,
    IN `p_start` DATE,
    IN `p_end` DATE,
    IN `p_order_id` INT
)
BEGIN
    SELECT 
        v.*,
        CONCAT(IFNULL(m.first_name, ''), ' ', IFNULL(m.last_name, '')) AS member_name
    FROM 
        `vw_finance_order_settlement` v
    LEFT JOIN 
        `members` m ON v.member_id = m.member_id
    WHERE 
        -- 1. 门店筛选
        (p_store_id IS NULL OR p_store_id = 0 OR v.store_id = p_store_id)
        
        -- 2. 通用搜索 (简化版：去掉了不兼容的 COLLATE 强制转换)
        AND (
            p_search IS NULL OR p_search = '' 
            OR v.order_id LIKE CONCAT('%', p_search, '%')
            OR v.member_id LIKE CONCAT('%', p_search, '%')
            OR CONCAT(IFNULL(m.first_name, ''), ' ', IFNULL(m.last_name, '')) LIKE CONCAT('%', p_search, '%')
        )
        
        -- 3. 状态筛选
        AND (p_status IS NULL OR p_status = '' OR v.order_status = p_status)
        
        -- 4. 日期筛选
        AND (p_start IS NULL OR DATE(v.order_date) >= p_start)
        AND (p_end IS NULL OR DATE(v.order_date) <= p_end)
        
        -- 5. 精确订单号
        AND (p_order_id IS NULL OR p_order_id = 0 OR v.order_id = p_order_id)
        
    ORDER BY 
        v.order_date DESC;
END //

DELIMITER ;





-- 由于改名而必须一起修改的相关视图
DROP VIEW IF EXISTS `vm_invoice_settlement`;
CREATE VIEW `vm_invoice_settlement` AS
select `b`.`invoice_id` AS `invoice_id`,`b`.`invoice_number` AS `invoice_number`,`b`.`invoice_status` AS `invoice_status`,`b`.`issue_date` AS `issue_date`,`b`.`due_date` AS `due_date`,`b`.`update_date` AS `update_date`,`b`.`note` AS `note`,`b`.`order_id` AS `order_id`,`b`.`store_id` AS `store_id`,`b`.`member_id` AS `member_id`,`b`.`order_status` AS `order_status`,`b`.`order_date` AS `order_date`,`s`.`payable_amount` AS `invoice_amount`,ifnull(`ps`.`paid_amount`,0) AS `paid_amount`,round(greatest(ifnull(`s`.`payable_amount`,0) - ifnull(`ps`.`paid_amount`,0),0),2) AS `outstanding_amount`,`ps`.`last_paid_at` AS `last_paid_at`,case when ifnull(`ps`.`paid_amount`,0) >= ifnull(`s`.`payable_amount`,0) and `s`.`payable_amount` is not null then 1 else 0 end AS `is_settled` from ((`book_store`.`vm_finance_invoice_base` `b` left join `book_store`.`vm_finance_invoice_paid_sum` `ps` on(`ps`.`invoice_id` = `b`.`invoice_id`)) left join `book_store`.`vw_finance_order_settlement` `s` on(`s`.`order_id` = `b`.`order_id`));

DROP VIEW IF EXISTS `vw_finance_order_list`;
CREATE VIEW `vw_finance_order_list` AS
select `o`.`order_id` AS `order_id`,`o`.`store_id` AS `store_id`,`st`.`name` AS `store_name`,`o`.`member_id` AS `member_id`,concat(`m`.`first_name`,' ',`m`.`last_name`) AS `member_name`,`o`.`order_status` AS `order_status`,`o`.`order_date` AS `order_date`,`o`.`note` AS `note`,`o`.`payable_amount` AS `payable_amount`,`o`.`paid_amount` AS `paid_amount`,`o`.`is_settled` AS `is_settled`,count(`oi`.`sku_id`) AS `item_count`,coalesce(sum(`oi`.`quantity`),0) AS `total_quantity` from (((`book_store`.`vw_finance_order_settlement` `o` join `book_store`.`stores` `st` on(`st`.`store_id` = `o`.`store_id`)) join `book_store`.`members` `m` on(`m`.`member_id` = `o`.`member_id`)) left join `book_store`.`order_items` `oi` on(`oi`.`order_id` = `o`.`order_id`)) group by `o`.`order_id`,`o`.`store_id`,`st`.`name`,`o`.`member_id`,`m`.`first_name`,`m`.`last_name`,`o`.`order_status`,`o`.`order_date`,`o`.`note`,`o`.`payable_amount`,`o`.`paid_amount`,`o`.`is_settled`;





-- 对订单细节的更改
DROP PROCEDURE IF EXISTS `sp_finance_order_detail`;
DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_order_detail`(IN `p_order_id` INT)
BEGIN
    SELECT
        v.order_id,
        v.store_id,
        IFNULL(s.name, 'Unknown Store') AS store_name, -- 联查 stores 表
        v.member_id, -- 联查 members 表并拼接名字
        CONCAT(IFNULL(m.first_name, ''), ' ', IFNULL(m.last_name, '')) AS member_name,
        v.order_status,
        v.order_date,
        v.note,
        
        -- 直接从视图拿真实的金额数据 (看你截图里都有这些字段)
        v.gross_amount,
        v.discount_rate,
        v.discounted_amount,
        v.redeemed_points,
        v.points_discount_amount,
        v.payable_amount,
        v.paid_amount,
       (SELECT COUNT(*) FROM order_items WHERE order_id = p_order_id) AS item_count,
       (SELECT IFNULL(SUM(quantity), 0) FROM order_items WHERE order_id = p_order_id) AS total_quantity
    FROM vw_finance_order_settlement v
    LEFT JOIN `stores` s ON s.store_id = v.store_id
    LEFT JOIN `members` m ON m.member_id = v.member_id

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
DELIMITER ;

-- ============================================================================
-- Source: finance_update1230_new.sql
-- ============================================================================

DROP VIEW IF EXISTS `vw_finance_revenue_by_date`;
CREATE VIEW `vw_finance_revenue_by_date` AS
select cast(`vw_finance_order_settlement`.`order_date` as date) AS `order_day`,sum(`vw_finance_order_settlement`.`discounted_amount`) AS `revenue`,
`vw_finance_order_settlement`.`store_id` AS store_id 
from `book_store`.`vw_finance_order_settlement` where `vw_finance_order_settlement`.`order_status` = 'paid' group by cast(`vw_finance_order_settlement`.`order_date` as date);



DROP PROCEDURE IF EXISTS `sp_finance_revenue_by_date`;
DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_revenue_by_date`(IN `p_start` DATE, IN `p_end` DATE, IN `p_store_id` INT)
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
      AND store_id = p_store_id -- [新增] 只查询指定门店的数据
    GROUP BY order_day;
END$$
DELIMITER ;

DROP VIEW IF EXISTS `vw_finance_purchase_cost_by_date`;
CREATE VIEW `vw_finance_purchase_cost_by_date` AS
select cast(`book_store`.`inventory_batches`.`received_date` as date) AS `cost_day`,sum(`book_store`.`inventory_batches`.`unit_cost` * `book_store`.`inventory_batches`.`quantity`) AS `cost`,`book_store`.`inventory_batches`.store_id AS store_id
from `book_store`.`inventory_batches` group by cast(`book_store`.`inventory_batches`.`received_date` as date);


DROP PROCEDURE IF EXISTS `sp_finance_purchase_cost_by_date`;
DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_purchase_cost_by_date`(IN `p_start` DATE, IN `p_end` DATE, IN `p_store_id` INT)
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
      AND store_id = p_store_id
    GROUP BY cost_day
    ORDER BY cost_day;
END$$
DELIMITER ;


CREATE OR REPLACE VIEW `vw_finance_order_payment_methods` AS
SELECT DISTINCT
    `o`.`order_id`,
    `o`.`store_id`,
    `p`.`payment_method`,
    i.invoice_id
FROM 
    `orders` `o`
-- 1. 订单关联发票
JOIN 
    `invoices` `i` ON `o`.`order_id` = `i`.`order_id`
-- 2. 发票关联中间表 (payment_allocations)
JOIN 
    `payment_allocations` `pa` ON `i`.`invoice_id` = `pa`.`invoice_id`
-- 3. 中间表关联支付记录 (payments) 以获取支付方式
JOIN 
    `payments` `p` ON `pa`.`payment_id` = `p`.`payment_id`
WHERE 
    `o`.`order_status` = 'paid';



-- 饼图对应的sp

DROP PROCEDURE IF EXISTS `sp_finance_payment_method_summary`;

DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_finance_payment_method_summary`(
    IN `p_start` DATE, 
    IN `p_end` DATE, 
    IN `p_store_id` INT
)
BEGIN
    -- 1. 处理默认时间
    IF p_start IS NULL THEN
        SET p_start = DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY);
    END IF;
    IF p_end IS NULL THEN
        SET p_end = CURRENT_DATE;
    END IF;

    -- 2. 查询逻辑
    SELECT
        vm.payment_method AS payment_method,
        
        -- 【核心修改】这里改为 COUNT(*) 统计笔数
        -- 注意：我保留了 AS amount 这个别名，是为了兼容你的前端 JS 代码
        -- 这样你不需要去改 finance.js 里的 row.amount
        COUNT(*) AS amount
        
    FROM 
        vm_finance_invoice_payment_allocation_detail vm
    JOIN 
        vw_finance_order_payment_methods vw ON vm.invoice_id = vw.invoice_id
        
    WHERE 
        vm.allocation_date >= p_start
        AND vm.allocation_date < DATE_ADD(p_end, INTERVAL 1 DAY)
        AND vw.store_id = p_store_id
        
    GROUP BY 
        vm.payment_method -- 按支付方式分组，饼图就能切开了
        
    ORDER BY 
        amount DESC;
END$$

DELIMITER ;

-- ============================================================================
-- Source: finance_update_1231.sql
-- ============================================================================

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

-- ============================================================================
-- Source: finance_triggers.sql
-- ============================================================================
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

-- ============================================================================
-- Source: finance_events.sql
-- ============================================================================
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





-- 补丁0103
-- 1. 先删除旧的

DROP PROCEDURE IF EXISTS sp_finance_invoice_list;



-- 2. 重建 (注意：参数强制指定为 unicode_ci 以匹配视图)

DELIMITER ;;

CREATE PROCEDURE sp_finance_invoice_list(

    IN p_search VARCHAR(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci, -- 👈 关键修改：匹配视图的 Unicode 规则

    IN p_status VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,  -- 👈 关键修改

    IN p_order_id INT,

    IN p_start_date DATETIME,

    IN p_end_date DATETIME,

    IN p_min_amount DECIMAL(10,2),

    IN p_max_amount DECIMAL(10,2),

    IN p_store_id INT

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

        last_paid_at,

        is_settled

    FROM vw_finance_invoice_list

    WHERE 

        (p_store_id IS NULL OR store_id = p_store_id)

        

        -- 搜索部分

        -- 现在两边都是 unicode_ci，不会再打架了

        AND (p_search IS NULL OR p_search = '' 

             OR member_name LIKE CONCAT('%', p_search, '%')

             OR invoice_number LIKE CONCAT('%', p_search, '%')

             OR CAST(order_id AS CHAR) LIKE CONCAT('%', p_search, '%')

        )

        

        -- 状态部分

        AND (p_status IS NULL OR p_status = '' OR p_status = 'All Statuses' OR invoice_status = p_status)

        

        -- 其他筛选保持不变

        AND (p_order_id IS NULL OR p_order_id = 0 OR order_id = p_order_id)

        AND (p_start_date IS NULL OR issue_date >= p_start_date)

        AND (p_end_date IS NULL OR issue_date < DATE_ADD(p_end_date, INTERVAL 1 DAY))

        AND (p_min_amount IS NULL OR invoice_amount >= p_min_amount)

        AND (p_max_amount IS NULL OR invoice_amount <= p_max_amount)

        

    ORDER BY issue_date DESC;

END;;

DELIMITER ;