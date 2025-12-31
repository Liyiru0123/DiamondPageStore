SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

-- --------------------------------------------------------
-- 1. 书籍基本信息表 (核心表)
-- --------------------------------------------------------
CREATE TABLE `books` (
  `ISBN` char(13) NOT NULL,
  `name` varchar(50) NOT NULL,
  `language` varchar(50) NOT NULL,
  `publisher` varchar(50) NOT NULL,
  `introduction` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`ISBN`),
  FULLTEXT KEY `ft_books_text` (`name`,`introduction`,`publisher`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 2. 作者表
-- --------------------------------------------------------
CREATE TABLE `authors` (
  `author_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `country` varchar(50) NOT NULL,
  PRIMARY KEY (`author_id`),
  FULLTEXT KEY `ft_authors_name` (`first_name`,`last_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 3. 书籍与作者关联表 (多对多关系)
-- --------------------------------------------------------
CREATE TABLE `book_authors` (
  `author_id` int(11) NOT NULL,
  `ISBN` char(13) NOT NULL,
  PRIMARY KEY (`author_id`,`ISBN`),
  KEY `fk_book_authors_books1_idx` (`ISBN`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 4. 分类表
-- --------------------------------------------------------
CREATE TABLE `catagories` (
  `category_id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` varchar(255) NOT NULL,
  PRIMARY KEY (`category_id`),
  FULLTEXT KEY `ft_categories_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 5. 书籍与分类关联表 (多对多关系)
-- --------------------------------------------------------
CREATE TABLE `book_categories` (
  `category_id` int(11) NOT NULL,
  `ISBN` char(13) NOT NULL,
  PRIMARY KEY (`category_id`,`ISBN`),
  KEY `fk_book_categories_books1_idx` (`ISBN`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 6. SKU表 (库存量单位/销售规格)
-- 一本书可能有平装版和精装版，对应不同的价格和SKU ID
-- --------------------------------------------------------
CREATE TABLE `skus` (
  `sku_id` int(11) NOT NULL AUTO_INCREMENT,
  `ISBN` char(13) NOT NULL,
  `unit_price` decimal(9,2) UNSIGNED NOT NULL,
  `binding` enum('Hardcover','Paperback','Mass Market Paperback') NOT NULL,
  PRIMARY KEY (`sku_id`),
  KEY `fk_SKUs_books1_idx` (`ISBN`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

-- --------------------------------------------------------
-- 外键约束定义
-- --------------------------------------------------------

-- 书籍-作者关联约束
ALTER TABLE `book_authors`
  ADD CONSTRAINT `fk_book_authors_authors1` FOREIGN KEY (`author_id`) REFERENCES `authors` (`author_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_book_authors_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE;

-- 书籍-分类关联约束
ALTER TABLE `book_categories`
  ADD CONSTRAINT `fk_book_categories_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_book_categories_catagories1` FOREIGN KEY (`category_id`) REFERENCES `catagories` (`category_id`) ON UPDATE CASCADE;

-- SKU-书籍关联约束
ALTER TABLE `skus`
  ADD CONSTRAINT `fk_SKUs_books1` FOREIGN KEY (`ISBN`) REFERENCES `books` (`ISBN`) ON UPDATE CASCADE;

COMMIT;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;