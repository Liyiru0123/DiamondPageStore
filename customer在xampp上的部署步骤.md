# DiamondPageStore 快速部署教程

## 第一步：启动 XAMPP
- 打开 XAMPP Control Panel
- 启动 Apache 和 MySQL

## 第二步：创建数据库
1. 访问 http://localhost/phpmyadmin
2. 创建数据库 `book_store`（排序规则：utf8mb4_general_ci）

## 第三步：导入基础结构
- 在 phpMyAdmin 中，选择 `book_store` 数据库
- 导入 `new_data_book_store.sql`

## 第四步：升级表结构和创建视图
- 执行 `database/deploy_all.sql`

## 第五步：创建存储过程
- 执行 `database/procedures.sql`

## 第六步：清除浏览器缓存
- 按 `Ctrl + Shift + R` 硬刷新

## 第七步：访问网站
```
http://localhost/DiamondPageStore/pages/customer.html
```

---

## 验证清单
- [ ] 数据库有17个表
- [ ] 有12个视图（vw_开头）
- [ ] 有8个存储过程（sp_customer_开头）
- [ ] point_ledgers 表包含 member_id 和 points_change 列
- [ ] 网站可以正常访问
- [ ] 可以登录会员
- [ ] 购物车价格正确显示
- [ ] 可以创建和支付订单

完成！✅
