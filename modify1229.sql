
-- 修改 orders 表的 order_status，增加 'finished' 状态
ALTER TABLE `book_store`.`orders` 
MODIFY COLUMN `order_status` enum('created','paid','cancelled','refunded','finished') NOT NULL DEFAULT 'created';

-- 修复 catagories 表中 desecription 的拼写错误
ALTER TABLE `book_store`.`catagories` 
CHANGE COLUMN `desecription` `description` varchar(255) NOT NULL;

-- 修改 users 表，将 password_hash 长度扩充为 64
ALTER TABLE `book_store`.`users` 
MODIFY COLUMN `password_hash` VARCHAR(64) NOT NULL;

-- 步骤 A: 转移员工
-- 1. 先将所有原本是 "Head Office" (id=4) 的员工，职位改成 "Store Manager" (id=3)
--    并将他们全部调动到 Store 1 (总店)
UPDATE `book_store`.`employees` 
SET `job_title_id` = 3, `store_id` = 1 
WHERE `job_title_id` = 4;

-- 2. 将原本就是 "Store Manager" (id=3) 的员工，也全部调动到 Store 1
--    (如果不执行这一步，原本在分店的经理职位名称变成董事后，人还在分店，逻辑会有点怪)
UPDATE `book_store`.`employees` 
SET `store_id` = 1 
WHERE `job_title_id` = 3;

-- 步骤 B: 删除旧职位
-- 现在没有人属于 id=4 了，可以安全删除
DELETE FROM `book_store`.`job_titles` 
WHERE `job_title_id` = 4;

-- 步骤 C: 重命名职位
-- 将 id=3 的名称改为 "Board of Directors"
UPDATE `book_store`.`job_titles` 
SET `name` = 'General Manager' 
WHERE `job_title_id` = 3;

-- 插入已完成订单
-- 插入订单主表 (Orders)
INSERT INTO `book_store`.`orders` (`order_id`, `store_id`, `member_id`, `order_status`, `order_date`, `note`) VALUES
(41, 1, 5, 'finished', '2025-12-18 10:00:00', 'VIP customer, transaction completed'),
(42, 2, 12, 'finished', '2025-12-19 14:30:00', 'Online pickup, completed'),
(43, 1, 20, 'finished', '2025-12-20 09:15:00', 'Year-end sale purchase, finished');

-- 插入订单详情 (Order Items)
-- 订单 41 买了两本书
INSERT INTO `book_store`.`order_items` (`sku_id`, `order_id`, `quantity`) VALUES
(1, 41, 1),  -- SKU 1
(5, 41, 2);  -- SKU 5

-- 订单 42 买了一本书
INSERT INTO `book_store`.`order_items` (`sku_id`, `order_id`, `quantity`) VALUES
(10, 42, 1); -- SKU 10

-- 订单 43 买了三本书
INSERT INTO `book_store`.`order_items` (`sku_id`, `order_id`, `quantity`) VALUES
(3, 43, 1),
(7, 43, 1),
(15, 43, 1);

-- (可选) 如果你的系统逻辑严格，finished 的订单通常意味着已付款且已开发票
-- 下面是可选的自动生成对应发票和支付记录的语句

-- 为这三个订单生成 "paid" 状态的发票
INSERT INTO `book_store`.`invoices` (`order_id`, `invoice_status`, `invoice_number`, `issue_date`, `due_date`, `update_date`, `note`) VALUES
(41, 'paid', 20250041, '2025-12-18 10:05:00', '2025-12-25 10:05:00', '2025-12-18 10:10:00', 'Auto-generated for finished order'),
(42, 'paid', 20250042, '2025-12-19 14:35:00', '2025-12-26 14:35:00', '2025-12-19 14:40:00', 'Auto-generated for finished order'),
(43, 'paid', 20250043, '2025-12-20 09:20:00', '2025-12-27 09:20:00', '2025-12-20 09:25:00', 'Auto-generated for finished order');