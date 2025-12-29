虽然这些修改不会导致视图直接报错（不会 Syntax Error），但会导致**视图里的数据统计逻辑失效或变得不准确**。

主要影响集中在 **“新增 finished 订单状态”** 和 **“修改职位名称”** 这两点上。

---

### 具体影响分析

#### 1. 新增 `finished` 状态的影响（最严重）

你的很多统计视图（财务、热销榜、销量）目前是**硬编码**只统计 `'paid'` 状态的订单。如果你有了 `'finished'` 状态的订单（通常意味着已完成且已付款），这些订单会被目前的视图**自动忽略**，导致销售额和销量数据变少。

*   **`vw_manager_bestsellers` (热销榜):**
    *   **原逻辑:** `WHERE ... o.order_status = 'paid'`
    *   **后果:** `finished` 的订单不会计入热销榜。
*   **`vw_manager_sales_by_category` (分类销量):**
    *   **原逻辑:** `WHERE o2.order_status = 'paid'`
    *   **后果:** 同上，分类统计会漏掉 finished 订单。
*   **`vw_customer_member_info` (会员消费):**
    *   **原逻辑:** `WHERE ... o.order_status = 'paid'`
    *   **后果:** 会员的 `total_spent` 不会包含 finished 的订单，导致会员等级无法正确升级。
*   **`vw_manager_sales_by_store` (店铺业绩):**
    *   **原逻辑:** `CASE WHEN o.order_status = 'paid' ...`
    *   **后果:** 店铺的营收统计会变少。

#### 2. 修改职位名称的影响

*   **`vw_manager_staff_by_store` (各店员工统计):**
    *   **原逻辑:** 这个视图里用了硬编码的字符串判断：
        ```sql
        sum(case when jt.name = 'Store Manager' then 1 else 0 end) AS managers_count,
        sum(case when jt.name = 'Head Office' then 1 else 0 end) AS head_office_count
        ```
    *   **后果:**
        *   因为你删除了 `'Head Office'`，`head_office_count` 将永远为 0（这可能符合预期）。
        *   因为你把 `'Store Manager'` 改成了 `'Board of Directors'`，**`managers_count` 也会变成 0**。你需要更新视图来统计新的职位名称。

#### 3. 修改 `password_hash` 长度

*   **无影响**。视图会自动读取新长度的列，只要你的前端应用能处理长字符串即可。

---

### 如何修复？

你需要重新创建（ALTER VIEW）这些受影响的视图。请执行以下 SQL 来修复逻辑：

#### 第一步：修复统计视图（把 finished 加入统计）

```sql
-- 1. 修复热销榜 (vw_manager_bestsellers)
CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_bestsellers` AS 
SELECT `b`.`ISBN` AS `ISBN`, `b`.`name` AS `book_name`, `b`.`publisher` AS `publisher`, `b`.`language` AS `language`, 
       (select group_concat(distinct `c`.`name` separator ', ') from (`book_categories` `bc` join `catagories` `c` on(`bc`.`category_id` = `c`.`category_id`)) where `bc`.`ISBN` = `b`.`ISBN`) AS `categories`, 
       count(distinct `o`.`order_id`) AS `orders_count`, 
       coalesce(sum(`oi`.`quantity`),0) AS `total_sold`, 
       coalesce(sum(`oi`.`quantity` * `s`.`unit_price`),0) AS `total_revenue`, 
       avg(`s`.`unit_price`) AS `avg_price`, 
       count(distinct `o`.`store_id`) AS `stores_sold_in`, 
       count(distinct `o`.`member_id`) AS `unique_buyers`, 
       rank() over ( order by sum(`oi`.`quantity`) desc) AS `sales_rank` 
FROM (((`books` `b` join `skus` `s` on(`b`.`ISBN` = `s`.`ISBN`)) join `order_items` `oi` on(`s`.`sku_id` = `oi`.`sku_id`)) join `orders` `o` on(`oi`.`order_id` = `o`.`order_id`))
-- 修改点：增加 OR o.order_status = 'finished'
WHERE (`o`.`order_status` = 'paid' OR `o`.`order_status` = 'finished')
GROUP BY `b`.`ISBN`, `b`.`name`, `b`.`publisher`, `b`.`language` 
ORDER BY coalesce(sum(`oi`.`quantity`),0) DESC LIMIT 0, 50;

-- 2. 修复店铺业绩 (vw_manager_sales_by_store)
CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_sales_by_store` AS 
SELECT `st`.`store_id` AS `store_id`, `st`.`name` AS `store_name`, `st`.`status` AS `store_status`, 
       count(distinct `o`.`order_id`) AS `total_orders`, 
       -- 修改点：增加 finished 判断
       count(distinct case when `o`.`order_status` in ('paid', 'finished') then `o`.`order_id` end) AS `paid_orders`, 
       count(distinct `o`.`member_id`) AS `unique_customers`, 
       -- 修改点：增加 finished 判断
       coalesce(sum(case when `o`.`order_status` in ('paid', 'finished') then `oi`.`quantity` * `s`.`unit_price` else 0 end),0) AS `total_revenue`, 
       -- 修改点：增加 finished 判断
       avg(case when `o`.`order_status` in ('paid', 'finished') then `oi`.`quantity` * `s`.`unit_price` end) AS `avg_order_value`, 
       -- 修改点：增加 finished 判断
       coalesce(sum(case when `o`.`order_status` in ('paid', 'finished') then `oi`.`quantity` else 0 end),0) AS `total_items_sold`, 
       cast(max(`o`.`order_date`) as date) AS `last_order_date` 
FROM (((`stores` `st` left join `orders` `o` on(`st`.`store_id` = `o`.`store_id`)) left join `order_items` `oi` on(`o`.`order_id` = `oi`.`order_id`)) left join `skus` `s` on(`oi`.`sku_id` = `s`.`sku_id`)) 
GROUP BY `st`.`store_id`, `st`.`name`, `st`.`status` 
ORDER BY `total_revenue` DESC;
```

*(注意：`vw_manager_sales_by_category` 和 `vw_customer_member_info` 还有 `vw_manager_store_performance` 也需要类似的修改，原理相同，将 `'paid'` 替换为 `IN ('paid', 'finished')`。)*

#### 第二步：修复员工统计视图 (更新职位名称)

```sql
-- 修复 vw_manager_staff_by_store
CREATE OR REPLACE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vw_manager_staff_by_store` AS 
SELECT `s`.`store_id` AS `store_id`, `s`.`name` AS `store_name`, `s`.`status` AS `store_status`, 
       count(distinct `e`.`employee_id`) AS `total_employees`, 
       -- 修改点：将 'Store Manager' 改为 'Board of Directors'
       sum(case when `jt`.`name` = 'Board of Directors' then 1 else 0 end) AS `directors_count`, 
       sum(case when `jt`.`name` = 'Finance' then 1 else 0 end) AS `finance_count`, 
       sum(case when `jt`.`name` = 'Staff' then 1 else 0 end) AS `staff_count`, 
       -- Head Office 已删除，这一列会一直是 0，可以保留也可以删掉，这里保留结构
       sum(case when `jt`.`name` = 'Head Office' then 1 else 0 end) AS `head_office_count`, 
       round(avg(`e`.`performance`),2) AS `avg_performance`, 
       sum(`jt`.`base_salary`) AS `total_salary_cost` 
FROM ((`stores` `s` left join `employees` `e` on(`s`.`store_id` = `e`.`store_id`)) left join `job_titles` `jt` on(`e`.`job_title_id` = `jt`.`job_title_id`)) 
GROUP BY `s`.`store_id`, `s`.`name`, `s`.`status` 
ORDER BY `total_employees` DESC;
```

### 总结
只修改表结构和数据是不够的，**必须更新视图定义**，否则你的报表系统会漏掉所有 `finished` 的订单，并且无法统计出“董事会”成员的人数。
