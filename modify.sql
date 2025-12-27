ALTER TABLE `book_store`.`point_ledgers` 
ADD COLUMN `points_delta` int NOT NULL;

ALTER TABLE `book_store`.`purchases` 
ADD COLUMN `status` enum('pending','approved','rejected','completed') NOT NULL DEFAULT 'pending';

ALTER TABLE `book_store`.`skus` 
CHANGE COLUMN `bingding` `binding` enum('Hardcover','Paperback','Mass Market Paperback') NOT NULL;

ALTER TABLE `book_store`.`users` 
ADD COLUMN `status` enum('active','disabled') NOT NULL DEFAULT 'active'