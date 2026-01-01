-- 插入测试补货请求数据
-- 假设 store_id = 1, employee_id = 14 (存在的员工)
-- 假设 sku_id 存在 (1, 2, 3, 4)

INSERT INTO replenishment_requests (store_id, sku_id, requested_quantity, urgency_level, status, request_date, requested_by, reason)
VALUES 
(1, 1, 10, 'medium', 'pending', NOW(), 14, 'Low stock on best seller'),
(1, 2, 5, 'high', 'pending', DATE_SUB(NOW(), INTERVAL 1 DAY), 14, 'Urgent request for new release'),
(1, 3, 20, 'low', 'approved', DATE_SUB(NOW(), INTERVAL 2 DAY), 14, 'Monthly restock'),
(1, 4, 15, 'medium', 'completed', DATE_SUB(NOW(), INTERVAL 5 DAY), 14, 'Regular replenishment');
