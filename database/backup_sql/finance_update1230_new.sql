
DROP VIEW IF EXISTS `vw_finance_revenue_by_date`;
CREATE VIEW `vw_finance_revenue_by_date` AS
select cast(`vw_finance_order_settlement`.`order_date` as date) AS `order_day`,sum(`vw_finance_order_settlement`.`discounted_amount`) AS `revenue`,
`vw_finance_order_settlement`.`store_id` AS store_id 
from `book_store`.`vw_finance_order_settlement` where `vw_finance_order_settlement`.`order_status` = 'paid' group by cast(`vw_finance_order_settlement`.`order_date` as date), `vw_finance_order_settlement`.`store_id`;



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
      AND (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id) -- [新增] 只查询指定门店的数据
    GROUP BY order_day;
END$$
DELIMITER ;

DROP VIEW IF EXISTS `vw_finance_purchase_cost_by_date`;
CREATE VIEW `vw_finance_purchase_cost_by_date` AS
select cast(`book_store`.`inventory_batches`.`received_date` as date) AS `cost_day`,sum(`book_store`.`inventory_batches`.`unit_cost` * `book_store`.`inventory_batches`.`quantity`) AS `cost`,`book_store`.`inventory_batches`.store_id AS store_id
from `book_store`.`inventory_batches` group by cast(`book_store`.`inventory_batches`.`received_date` as date), `book_store`.`inventory_batches`.`store_id`;


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
      AND (p_store_id IS NULL OR p_store_id = 0 OR store_id = p_store_id)
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
