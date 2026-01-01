-- --------------------------------------------------------
-- 1. 补货请求表 (核心业务表)
-- 用于记录门店向总库或供应商发起的补货申请
-- --------------------------------------------------------
CREATE TABLE `replenishment_requests` (
  `request_id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) NOT NULL,
  `sku_id` int(11) NOT NULL,
  `requested_quantity` int(11) NOT NULL,
  `urgency_level` enum('low','medium','high') DEFAULT 'medium',
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `request_date` datetime DEFAULT current_timestamp(),
  `requested_by` int(11) DEFAULT NULL COMMENT '发起申请的员工ID',
  `reason` varchar(500) DEFAULT NULL,
  `approved_by` int(11) DEFAULT NULL COMMENT '审批经理ID',
  `approval_date` datetime DEFAULT NULL,
  `rejection_reason` varchar(500) DEFAULT NULL,
  `rejection_date` datetime DEFAULT NULL,
  `completed_date` datetime DEFAULT NULL,
  `note` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`request_id`),
  KEY `sku_id` (`sku_id`),
  KEY `requested_by` (`requested_by`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_store_status` (`store_id`,`status`),
  KEY `idx_request_date` (`request_date`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------
-- 2. 请求列表视图 (View)
-- 截图中的表格直接使用此视图数据最方便
-- 包含了：书名、ISBN、当前库存、申请人姓名、审批人姓名等
-- --------------------------------------------------------
CREATE OR REPLACE VIEW `vw_manager_replenishment_requests` AS 
SELECT 
    `rr`.`request_id` AS `request_id`,
    `rr`.`store_id` AS `store_id`,
    `st`.`name` AS `store_name`,
    `rr`.`sku_id` AS `sku_id`,
    `sk`.`ISBN` AS `ISBN`,
    `b`.`name` AS `book_name`,
    `sk`.`binding` AS `binding`,
    `rr`.`requested_quantity` AS `requested_quantity`,
    `rr`.`urgency_level` AS `urgency_level`,
    `rr`.`status` AS `status`,
    `rr`.`request_date` AS `request_date`,
    `rr`.`requested_by` AS `requested_by`,
    concat(`e1`.`first_name`, ' ', `e1`.`last_name`) AS `requested_by_name`,
    `rr`.`reason` AS `reason`,
    `rr`.`approved_by` AS `approved_by`,
    concat(`e2`.`first_name`, ' ', `e2`.`last_name`) AS `approved_by_name`,
    `rr`.`approval_date` AS `approval_date`,
    `rr`.`rejection_reason` AS `rejection_reason`,
    `rr`.`completed_date` AS `completed_date`,
    `rr`.`note` AS `note`,
    coalesce(sum(`ib`.`quantity`), 0) AS `current_stock`
FROM
    ((((((`replenishment_requests` `rr`
    JOIN `stores` `st` ON (`rr`.`store_id` = `st`.`store_id`))
    JOIN `skus` `sk` ON (`rr`.`sku_id` = `sk`.`sku_id`))
    JOIN `books` `b` ON (`sk`.`ISBN` = `b`.`ISBN`))
    LEFT JOIN `employees` `e1` ON (`rr`.`requested_by` = `e1`.`employee_id`))
    LEFT JOIN `employees` `e2` ON (`rr`.`approved_by` = `e2`.`employee_id`))
    LEFT JOIN `inventory_batches` `ib` ON (`rr`.`sku_id` = `ib`.`sku_id`
        AND `rr`.`store_id` = `ib`.`store_id`))
GROUP BY `rr`.`request_id` , `rr`.`store_id` , `st`.`name` , `rr`.`sku_id` , `sk`.`ISBN` , `b`.`name` , `sk`.`binding` , `rr`.`requested_quantity` , `rr`.`urgency_level` , `rr`.`status` , `rr`.`request_date` , `rr`.`requested_by` , `e1`.`first_name` , `e1`.`last_name` , `rr`.`reason` , `rr`.`approved_by` , `e2`.`first_name` , `e2`.`last_name` , `rr`.`approval_date` , `rr`.`rejection_reason` , `rr`.`rejection_date` , `rr`.`completed_date` , `rr`.`note`
ORDER BY `rr`.`request_date` DESC;

-- --------------------------------------------------------
-- 外键约束
-- 确保申请人是有效员工，SKU是有效商品，店铺是有效店铺
-- --------------------------------------------------------
ALTER TABLE `replenishment_requests`
  ADD CONSTRAINT `replenishment_requests_ibfk_1` FOREIGN KEY (`store_id`) REFERENCES `stores` (`store_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `replenishment_requests_ibfk_2` FOREIGN KEY (`sku_id`) REFERENCES `skus` (`sku_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `replenishment_requests_ibfk_3` FOREIGN KEY (`requested_by`) REFERENCES `employees` (`employee_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `replenishment_requests_ibfk_4` FOREIGN KEY (`approved_by`) REFERENCES `employees` (`employee_id`) ON UPDATE CASCADE;

COMMIT;