# 3. The Refinement of Database Design from   Assignment 1 

在从逻辑设计（Assignment 1）过渡到物理实现（Assignment 2）的过程中，为了提升系统性能与实用性，我们对数据库结构进行了以下关键优化：

1. **字典表的优化 (Optimization of Dictionary Tables)**

   在作业 1 中，部分实体存在过度规范化（Over-normalization）的问题。在本次实现中，我们将绝大多数一对一关系的字典表（如图书语言）简化为实体属性，以减少不必要的连表查询（JOIN），从而提升性能。但我们保留了 `job_titles`、member_tier 等必要的字典表，以便支持员工工资、不同等级优惠力度等业务逻辑。除此之外对于图书与作者（Book-Authors）等“多对多”关系，继续沿用中间连接表的设计。 

2. **库存批次化管理 (Inventory-Batch Implementation)**： 为了更精确地追踪成本，我们引入了 `inventory_batches`（库存批次）表。现在的库存不再是一个简单的“数量”字段，而是基于批次表的动态计算 **视图 (View)**。这种设计允许系统处理同一本书因不同采购批次而产生的不同单位成本问题。

3. **动态会员逻辑 (Dynamic Membership Logic)**： 我们移除了原设计中硬编码的“会员等级 (Member Tier)”存储字段。现在的会员等级是基于系统中记录的累积消费金额动态计算得出的，这有效保证了数据的一致性，避免了因未及时更新字段而导致的等级错误。

4. **可扩展性设计 (Scalability)**：我们为后续支出端的设计预留了一些没有实际使用于现有系统的属性，比如员工表中预留的 performance（绩效），目前仅作为数据项存在，以待后续扩展。