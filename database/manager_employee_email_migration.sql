-- Migration: change employees.phone to employees.email
-- NOTE: Update existing data after running this change if needed.

USE book_store;

ALTER TABLE employees
    CHANGE COLUMN phone email VARCHAR(100) NOT NULL;
