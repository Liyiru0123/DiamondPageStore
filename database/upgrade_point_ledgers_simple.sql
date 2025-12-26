-- upgrade_point_ledgers_simple.sql
-- 升级 point_ledgers 表结构（简化版，不需要特殊权限）
-- 注意：如果列已存在会报错，但这是正常的

USE book_store;

-- 添加 member_id 列
ALTER TABLE point_ledgers
ADD COLUMN member_id INT NOT NULL AFTER point_ledger_id;

-- 添加 points_change 列
ALTER TABLE point_ledgers
ADD COLUMN points_change INT NOT NULL AFTER member_id;

-- 将 order_id 设置为可为 NULL
ALTER TABLE point_ledgers
MODIFY COLUMN order_id INT NULL;

-- 重命名列
ALTER TABLE point_ledgers
CHANGE COLUMN create_date change_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE point_ledgers
CHANGE COLUMN note reason VARCHAR(255) NULL;

-- 添加外键约束
ALTER TABLE point_ledgers
ADD CONSTRAINT fk_point_ledgers_members
FOREIGN KEY (member_id) REFERENCES members(member_id) ON UPDATE CASCADE;

ALTER TABLE point_ledgers
ADD CONSTRAINT fk_point_ledgers_orders
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 显示最终表结构
DESCRIBE point_ledgers;
