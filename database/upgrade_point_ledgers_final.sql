-- upgrade_point_ledgers_final.sql
-- 升级 point_ledgers 表结构（最终版本）
-- 注意：会清空 point_ledgers 表的现有数据

USE book_store;

-- 步骤1：清空表数据（因为旧数据无法匹配新结构）
TRUNCATE TABLE point_ledgers;

-- 步骤2：添加新列
ALTER TABLE point_ledgers
ADD COLUMN member_id INT NOT NULL AFTER point_ledger_id;

ALTER TABLE point_ledgers
ADD COLUMN points_change INT NOT NULL AFTER member_id;

-- 步骤3：修改 order_id 为可为 NULL
ALTER TABLE point_ledgers
MODIFY COLUMN order_id INT NULL;

-- 步骤4：重命名列
ALTER TABLE point_ledgers
CHANGE COLUMN create_date change_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE point_ledgers
CHANGE COLUMN note reason VARCHAR(255) NULL;

-- 步骤5：添加外键约束
ALTER TABLE point_ledgers
ADD CONSTRAINT fk_point_ledgers_members
FOREIGN KEY (member_id) REFERENCES members(member_id) ON UPDATE CASCADE;

ALTER TABLE point_ledgers
ADD CONSTRAINT fk_point_ledgers_orders
FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE ON UPDATE CASCADE;

-- 显示最终表结构
DESCRIBE point_ledgers;

SELECT '✅ point_ledgers 表升级成功！旧数据已清空。' AS message;
