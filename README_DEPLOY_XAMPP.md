# XAMPP 部署指南

## 1. 放置项目

把整个项目复制到：
```
C:\xampp\htdocs\DiamondPageStore
```

## 2. 启动服务

1. 打开 **XAMPP Control Panel**
2. 启动 **Apache** 和 **MySQL**

## 3. 创建数据库

1. 打开 http://localhost/phpmyadmin
2. **新建数据库：`book_store`，原来有的一定要先删除！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！**
3. **新建数据库：`book_store`，原来有的一定要先删除！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！**
4. **新建数据库：`book_store`，原来有的一定要先删除！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！**
5. **新建数据库：`book_store`，原来有的一定要先删除！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！**
6. **新建数据库：`book_store`，原来有的一定要先删除！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！！**
7. 排序规则：`utf8mb4_general_ci`

## 4. 一键导入（推荐方式）

> 因为 `deploy_all.sql` 使用了 `SOURCE` 命令，phpMyAdmin 无法正确执行，必须用 mysql 客户端。

在命令行执行（Windows）：

```bash
cd C:\xampp\htdocs\DiamondPageStore\database
C:\xampp\mysql\bin\mysql.exe -u root < deploy_all.sql
```

如果 root 有密码：

```bash
cd C:\xampp\htdocs\DiamondPageStore\database
C:\xampp\mysql\bin\mysql.exe -u root -p < deploy_all.sql
```

**执行顺序说明：**
```
book_store_1230.sql → manager_tables.sql → all_views.sql → all_procedures.sql → finance_bundle.sql → triggers.sql
```

## 5. 检查数据库配置

打开 `database.php`，默认本地配置：

```php
host: localhost
username: root
password: ""  // 空
```

如果你设置了 MySQL 密码，需要同步修改。

## 6. 访问页面

- Customer: http://localhost/DiamondPageStore/pages/customer.html
- Manager: http://localhost/DiamondPageStore/pages/manager.html
- Finance: http://localhost/DiamondPageStore/pages/finance.html
- Staff: http://localhost/DiamondPageStore/pages/staff.html

## 7. 常见问题

| 问题 | 解决方案 |
|------|----------|
| 导入时报错 | 查看哪条语句失败；如果是 DELIMITER 相关，说明用了 phpMyAdmin，改用 mysql 客户端导入 |
| 页面空数据 | 确认 deploy_all.sql 已执行成功 |
| 登录失败 | 查看 users 表中用户名/密码，必要时手动重置 |
