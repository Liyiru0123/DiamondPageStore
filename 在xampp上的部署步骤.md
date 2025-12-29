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

## 第十二步：登录账号和密码
### **1. Downtown Store (Store ID: 1)**
| 工号 | 姓名 | 职位 | 用户名 | 密码哈希 |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Alex Tan | General Manager | emp001 | hash_e001 |
| 2 | Brian Lim | General Manager | emp002 | hash_e002 |
| 3 | Chloe Ng | General Manager | emp003 | hash_e003 |
| 4 | Dylan Ong | General Manager | emp004 | hash_e004 |
| 5 | Ethan Goh | General Manager | emp005 | hash_e005 |
| 6 | Fiona Teo | General Manager | emp006 | hash_e006 |
| 7 | Grace Lee | General Manager | emp007 | hash_e007 |
| 8 | Henry Chua | Finance | emp008 | hash_e008 |
| 12 | Lucas Low | Finance | emp012 | hash_e012 |
| 13 | Megan Wong | Finance | emp013 | hash_e013 |
| 14 | Noah Chan | Staff | emp014 | hash_e014 |
| 18 | Ryan Sim | Staff | emp018 | hash_e018 |
| 22 | Victor Liew | Staff | emp022 | hash_e022 |

### **2. University Store (Store ID: 2)**
| 工号 | 姓名 | 职位 | 用户名 | 密码哈希 |
| :--- | :--- | :--- | :--- | :--- |
| 9 | Ivy Koh | Finance | emp009 | hash_e009 |
| 15 | Olivia Tan | Staff | emp015 | hash_e015 |
| 19 | Sophie Lau | Staff | emp019 | hash_e019 |
| 23 | Wendy Soh | Staff | emp023 | hash_e023 |

### **3. Community Store (Store ID: 3)**
| 工号 | 姓名 | 职位 | 用户名 | 密码哈希 |
| :--- | :--- | :--- | :--- | :--- |
| 10 | Jason Ho | Finance | emp010 | hash_e010 |
| 16 | Peter Ang | Staff | emp016 | hash_e016 |
| 20 | Tristan Foo | Staff | emp020 | hash_e020 |

### **4. Suburban Store (Store ID: 4)**
| 工号 | 姓名 | 职位 | 用户名 | 密码哈希 |
| :--- | :--- | :--- | :--- | :--- |
| 11 | Kelly Yap | Finance | emp011 | hash_e011 |
| 17 | Quinn Seah | Staff | emp017 | hash_e017 |
| 21 | Uma Yeo | Staff | emp021 | hash_e021 |

### **客户账户**
| 用户名 | 密码哈希 |
| :--- | :--- |
| member001 | hash_m001 |
| ... | ... |
| member077 | hash_m077 |
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
