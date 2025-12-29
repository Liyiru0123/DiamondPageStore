-- ==================================================
-- 修复缺失的 FULLTEXT 索引
-- Fix Missing FULLTEXT Indexes for Search Functionality
-- ==================================================

USE book_store;

-- 说明：
-- 员工管理和用户管理的搜索正常，说明以下索引已存在：
-- - users.username
-- - employees.(first_name, last_name)
-- - members.(first_name, last_name)
--
-- Stock Overview 和 Pricing 搜索报错，说明以下索引缺失：
-- - books.(name, introduction, publisher, language)
-- - authors.(first_name, last_name)
-- - catagories.name

-- ==================================================
-- 1. Books 表 - 图书信息搜索
-- ==================================================
-- 检查索引是否存在
SELECT 'Checking books table indexes...' AS Status;

-- 删除旧索引（如果存在）
SET @drop_books = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = 'book_store'
    AND table_name = 'books'
    AND index_name = 'ft_books_text'
);

SET @sql_drop_books = IF(
    @drop_books > 0,
    'ALTER TABLE books DROP INDEX ft_books_text',
    'SELECT "Index ft_books_text does not exist, skipping drop" AS Message'
);

PREPARE stmt FROM @sql_drop_books;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 创建新索引
SELECT 'Creating FULLTEXT index on books table...' AS Status;
ALTER TABLE books
ADD FULLTEXT INDEX ft_books_text (name, introduction, publisher, language);

SELECT 'Books FULLTEXT index created successfully!' AS Status;

-- ==================================================
-- 2. Authors 表 - 作者名称搜索
-- ==================================================
SELECT 'Checking authors table indexes...' AS Status;

-- 删除旧索引（如果存在）
SET @drop_authors = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = 'book_store'
    AND table_name = 'authors'
    AND index_name = 'ft_authors_name'
);

SET @sql_drop_authors = IF(
    @drop_authors > 0,
    'ALTER TABLE authors DROP INDEX ft_authors_name',
    'SELECT "Index ft_authors_name does not exist, skipping drop" AS Message'
);

PREPARE stmt FROM @sql_drop_authors;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 创建新索引
SELECT 'Creating FULLTEXT index on authors table...' AS Status;
ALTER TABLE authors
ADD FULLTEXT INDEX ft_authors_name (first_name, last_name);

SELECT 'Authors FULLTEXT index created successfully!' AS Status;

-- ==================================================
-- 3. Catagories 表 - 分类名称搜索
-- ==================================================
SELECT 'Checking catagories table indexes...' AS Status;

-- 删除旧索引（如果存在）
SET @drop_categories = (
    SELECT COUNT(*)
    FROM information_schema.statistics
    WHERE table_schema = 'book_store'
    AND table_name = 'catagories'
    AND index_name = 'ft_categories_name'
);

SET @sql_drop_categories = IF(
    @drop_categories > 0,
    'ALTER TABLE catagories DROP INDEX ft_categories_name',
    'SELECT "Index ft_categories_name does not exist, skipping drop" AS Message'
);

PREPARE stmt FROM @sql_drop_categories;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 创建新索引
SELECT 'Creating FULLTEXT index on catagories table...' AS Status;
ALTER TABLE catagories
ADD FULLTEXT INDEX ft_categories_name (name);

SELECT 'Catagories FULLTEXT index created successfully!' AS Status;

-- ==================================================
-- 验证所有索引
-- ==================================================
SELECT '======================================' AS '';
SELECT 'FULLTEXT Indexes Verification' AS '';
SELECT '======================================' AS '';

SELECT
    table_name AS '表名',
    index_name AS '索引名',
    GROUP_CONCAT(column_name ORDER BY seq_in_index) AS '索引字段'
FROM information_schema.statistics
WHERE table_schema = 'book_store'
AND index_type = 'FULLTEXT'
AND table_name IN ('books', 'authors', 'catagories', 'users', 'employees', 'members', 'suppliers')
GROUP BY table_name, index_name
ORDER BY table_name, index_name;

-- ==================================================
-- 完成
-- ==================================================
SELECT '======================================' AS '';
SELECT '✅ All FULLTEXT indexes have been created successfully!' AS Status;
SELECT 'Stock Overview 和 Pricing 的搜索功能现在应该可以正常使用了' AS Message;
SELECT '======================================' AS '';
