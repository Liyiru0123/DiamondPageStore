# DiamondPageStore XAMPP 部署步骤（Customer + Manager）

## 第一步：启动 XAMPP
- 打开 XAMPP Control Panel
- 启动 Apache 和 MySQL

## 第二步：创建数据库
1. 访问 `http://localhost/phpmyadmin`
2. 创建数据库 `book_store`（排序规则：`utf8mb4_general_ci`）

## 第三步：导入基础数据
- 在 phpMyAdmin 中选择 `book_store`
- 导入 `new_data_book_store.sql`

## 第四步：执行 Customer 相关 SQL
按顺序执行：
1. `database/deploy_all.sql`（基础视图等）
2. `database/procedures.sql`（Customer 存储过程）

## 第五步：执行 Manager 相关 SQL
按顺序执行：
1. `database/manager_tables.sql`
2. `database/manager_views.sql`
3. `database/manager_procedures.sql`
4. `database/triggers.sql`

## 第六步：清除浏览器缓存
- 按 `Ctrl + Shift + R` 强制刷新

## 第七步：访问页面
```
http://localhost/DiamondPageStore/pages/customer.html
http://localhost/DiamondPageStore/pages/manager.html
```

---

## API 快速检查（可选）
```
http://localhost/DiamondPageStore/api/manager/reports.php?action=overview
http://localhost/DiamondPageStore/api/manager/inventory.php?action=by_store
```

---

## 验证清单（Customer）
- [ ] 数据库有基础表（如 books, orders, order_items, users 等）
- [ ] 视图正常（vw_ 开头）
- [ ] 存储过程可执行（sp_customer_ 开头）
- [ ] 网站可正常访问
- [ ] 可登录会员
- [ ] 购物车价格正确显示
- [ ] 可创建并支付订单

## 验证清单（Manager）
- [ ] 视图正常（vw_manager_ 开头）
- [ ] 存储过程可执行（sp_manager_ 开头）
- [ ] `manager.html` 页面可打开
- [ ] 概览统计有数据
- [ ] 库存按门店/按 SKU 列表能显示
- [ ] 员工/用户/补货/通知模块可正常操作

完成。
