-- Full-text indexes for manager search endpoints.
-- Run once in the target database. Some indexes may already exist.

ALTER TABLE users
ADD FULLTEXT INDEX ft_users_username (username);

ALTER TABLE employees
ADD FULLTEXT INDEX ft_employees_name (first_name, last_name);

ALTER TABLE members
ADD FULLTEXT INDEX ft_members_name (first_name, last_name);

ALTER TABLE suppliers
ADD FULLTEXT INDEX ft_suppliers_text (name, address, email);

ALTER TABLE books
ADD FULLTEXT INDEX ft_books_text (name, introduction, publisher, language);

ALTER TABLE authors
ADD FULLTEXT INDEX ft_authors_name (first_name, last_name);

ALTER TABLE catagories
ADD FULLTEXT INDEX ft_categories_name (name);
