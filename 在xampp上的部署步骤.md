# DiamondPageStore XAMPP 部署步骤（Customer + Manager + Finance）

## 第一步：启动 XAMPP
- 打开 XAMPP Control Panel
- 启动 Apache 和 MySQL

## 第二步：创建数据库
1. 访问 `http://localhost/phpmyadmin`
2. 创建数据库：`book_store`
3. 排序规则：`utf8mb4_general_ci`

## 第三步：导入基础数据
- 选择数据库 `book_store`
- 导入：`new_data_book_store.sql`

## 第四步：执行结构变更（如果你用过 modify.sql）
- 执行根目录 `modify.sql`
- 执行后必须**重新创建视图/过程**，否则会失效

## 第五步：执行 Login 相关 SQL
按顺序执行：
1. `database/auth_views.sql`
2. `database/auth_procedures.sql`

## 第六步：执行 Customer 相关 SQL
按顺序执行：
1. `database/view.sql`
2. `database/procedures.sql`
3. `database/triggers.sql`

## 第七步：执行 Manager 相关 SQL
按顺序执行：
1. `database/manager_tables.sql`
2. `database/manager_views.sql`
3. `database/manager_procedures.sql`

## 第八步：执行 Finance 相关 SQL
按顺序执行：
1. `database/finance_views.sql`
2. `database/finance_procedures.sql`
3. `database/finance_triggers.sql`
4. `database/finance_events.sql`

## 第九步：执行 Staff 相关 SQL
按顺序执行：
1. `database/staff_views.sql`
2. `database/staff_procedures.sql`
3. `database/finance_triggers.sql`
4. `database/finance_events.sql`

> 如果你打算使用 `book_store_views_finance&manager.sql`，不要和以上文件混用，避免覆盖或重复创建。建议只选一种方案。

## 第十步：清除浏览器缓存
- 按 `Ctrl + Shift + R` 强制刷新

## 第十一步：访问页面
```
http://localhost/DiamondPageStore/pages/customer.html
http://localhost/DiamondPageStore/pages/manager.html
http://localhost/DiamondPageStore/pages/finance.html
http://localhost/DiamondPageStore/pages/staff.html
```

## 第十二步：登录账号和密码()
Head Office：emp001-003     密码：hash_e001-003  staff

Store Manager：emp004-007   密码：hash_e004-007  manager

Finance Staff: emp008-013   密码：hash_e008-013  finance

Sale Staff: emp014-023      密码：hash_e014-023  staff

Customer: member001-077     密码：hash_m001-077  customer

---

## API 快速检查（可选）
Customer：
- `http://localhost/DiamondPageStore/api/customer/books.php?action=list`

Manager：
- `http://localhost/DiamondPageStore/api/manager/reports.php?action=overview`

Finance：
- `http://localhost/DiamondPageStore/api/finance/reports.php?action=overview`

---

## 验证清单（Customer）
- [ ] 视图正常（`vw_customer_` 开头）
- [ ] 存储过程可执行（`sp_customer_` 开头）
- [ ] 页面可打开
- [ ] 书籍列表/搜索/分类正常
- [ ] 购物车金额显示正常
- [ ] 可创建并支付订单

## 验证清单（Manager）
- [ ] 视图正常（`vw_manager_` 开头）
- [ ] 存储过程可执行（`sp_manager_` 开头）
- [ ] 页面可打开
- [ ] 概览统计有数据
- [ ] 库存按门店/SKU可显示
- [ ] 员工/用户/补货/通知模块可用

## 验证清单（Finance）
- [ ] 视图正常（`vw_finance_`/`vm_finance_` 开头）
- [ ] 存储过程可执行（`sp_finance_` 开头）
- [ ] 页面可打开
- [ ] 订单/发票列表正常
- [ ] 支付方式统计有数据（需要收款后）

完成
