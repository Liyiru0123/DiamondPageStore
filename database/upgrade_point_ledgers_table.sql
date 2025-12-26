-- upgrade_point_ledgers_table.sql
-- 升级 point_ledgers 表结构
-- 添加 member_id 和 points_change 列以支持完整的积分记录功能

USE book_store;

-- 检查并添加 member_id 列（如果不存在）
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'book_store'
AND TABLE_NAME = 'point_ledgers'
AND COLUMN_NAME = 'member_id';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE point_ledgers ADD COLUMN member_id INT NOT NULL AFTER point_ledger_id',
    'SELECT ''Column member_id already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 检查并添加 points_change 列（如果不存在）
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'book_store'
AND TABLE_NAME = 'point_ledgers'
AND COLUMN_NAME = 'points_change';

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE point_ledgers ADD COLUMN points_change INT NOT NULL AFTER member_id',
    'SELECT ''Column points_change already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 将 order_id 设置为可为 NULL（因为积分调整可能不关联订单）
ALTER TABLE point_ledgers MODIFY COLUMN order_id INT NULL;

-- 重命名列（如果旧列名存在）
SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'book_store'
AND TABLE_NAME = 'point_ledgers'
AND COLUMN_NAME = 'create_date';

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE point_ledgers CHANGE COLUMN create_date change_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP',
    'SELECT ''Column create_date does not exist or already renamed'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @col_exists = 0;
SELECT COUNT(*) INTO @col_exists
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = 'book_store'
AND TABLE_NAME = 'point_ledgers'
AND COLUMN_NAME = 'note';

SET @sql = IF(@col_exists > 0,
    'ALTER TABLE point_ledgers CHANGE COLUMN note reason VARCHAR(255) NULL',
    'SELECT ''Column note does not exist or already renamed'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 添加外键约束（如果不存在）
SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'book_store'
AND TABLE_NAME = 'point_ledgers'
AND CONSTRAINT_NAME = 'fk_point_ledgers_members';

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE point_ledgers ADD CONSTRAINT fk_point_ledgers_members FOREIGN KEY (member_id) REFERENCES members(member_id) ON UPDATE CASCADE',
    'SELECT ''Foreign key fk_point_ledgers_members already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @fk_exists = 0;
SELECT COUNT(*) INTO @fk_exists
FROM information_schema.TABLE_CONSTRAINTS
WHERE CONSTRAINT_SCHEMA = 'book_store'
AND TABLE_NAME = 'point_ledgers'
AND CONSTRAINT_NAME = 'fk_point_ledgers_orders';

SET @sql = IF(@fk_exists = 0,
    'ALTER TABLE point_ledgers ADD CONSTRAINT fk_point_ledgers_orders FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT ''Foreign key fk_point_ledgers_orders already exists'' AS message');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 显示最终表结构
DESCRIBE point_ledgers;

SELECT '✅ point_ledgers table upgrade completed successfully!' AS status;
