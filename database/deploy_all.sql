-- deploy_all.sql
-- One-shot deploy (run from database/ with: mysql < deploy_all.sql)

CREATE DATABASE IF NOT EXISTS book_store CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

-- Create user
SOURCE ./create_users.sql;

USE book_store;
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- Base schema + seed
SOURCE ./book_store_1230.sql;

-- Manager tables + migrations
SOURCE ./manager_tables.sql;

-- Views & procedures (all modules)
SOURCE ./all_views.sql;
SOURCE ./all_procedures.sql;
CALL sp_manager_fix_dashboard_data();

-- Finance bundle (updates + triggers + events)
SOURCE ./finance_bundle.sql;

-- Core triggers
SOURCE ./triggers.sql;

-- grant privileages
SOURCE ./grant_privileges.sql;


SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;
