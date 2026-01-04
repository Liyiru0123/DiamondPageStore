# 5. Technical Annex (技术附件)

> For the Company's IT Department.

## 5.1 Configuration & Administration (配置与管理)
* **Database Creation**: Key DDL statements.
* **Security & Access Control**: Implementation of Views for permissions.

* 总说：前端大致介绍前端结构，html+js，无需太多技术实现细节，讲清具体结构就行
该项目的**前端结构**是一个典型的**基于角色的多页面应用（MPA, Multi-Page Application）**。它没有使用复杂的现代框架（如 React 或 Vue），而是采用了原生的 **HTML + JavaScript + Tailwind CSS** 的组合，通过模块化的 JS 文件进行数据交互和页面逻辑控制。

以下是前端结构的具体概括总结：

### 1. 核心架构：多入口页面控制
前端以 `pages/` 目录为核心，采用 **“一角色一页面”** 的设计模式。
*   **入口页面**：`login.html` 是系统门户。
*   **功能看板**：根据用户角色分为四个独立的大型看板页面：
    *   `customer.html`：客户购书与个人中心。
    *   `staff.html`：店员库存与订单管理。
    *   `manager.html`：经理级的全盘管理（员工、供应商、报表）。
    *   `finance.html`：财务专用的发票与报表审计。

### 2. 脚本层：三层逻辑架构
`scripts/` 目录下的 JavaScript 承担了所有的动态交互，其内部逻辑分为三个层次：

*   **API 交互层（封装层）**：
    *   文件名特征：`*-api.js`（如 `manager-api.js`, `customer-api.js`）。
    *   **作用**：专门负责使用 `fetch` 或 `XMLHttpRequest` 调用后端 `api/` 目录下的 PHP 接口，解耦了后端路径与前端逻辑。
*   **业务逻辑层（页面驱动）**：
    *   文件名特征：与页面同名（如 `customer.js`, `manager.js`, `staff.js`）。
    *   **作用**：负责页面的 DOM 操作、初始化渲染、事件监听以及调用对应的 API 封装函数。
*   **通用/插件层（工具层）**：
    *   `common.js`：存放跨页面通用的工具函数（如 Cookie 处理、权限校验）。
    *   `layout.js`：可能负责处理侧边栏、导航栏等公共布局的动态加载。
    *   `pagination-*.js`：专门处理复杂数据的分页显示逻辑。

### 3. 样式与资源管理
*   **样式控制**：
    *   `styles/global.css`：定义全局基础样式。
    *   `styles/staff.css`：针对特定角色页面的定制化样式。
    *   `scripts/tailwind.js`：项目引入了 Tailwind CSS 框架，通过类名直接在 HTML 中控制布局，减少了繁琐的 CSS 编写。
*   **视觉资源**：
    *   `assets/icons/`：按功能分类的图标（中文命名，直观对应功能模块）。
    *   `assets/images/`：背景图、Logo 等静态素材。

### 4. 前后端交互流程
1.  **加载**：用户访问 `pages/*.html`。
2.  **渲染**：HTML 结构加载后，对应的业务 JS（如 `manager.js`）开始执行。
3.  **请求**：业务 JS 调用对应的 API JS（如 `manager-api.js`），向后端的 PHP 发起请求。
4.  **反馈**：API JS 拿到 PHP 返回的 JSON 数据，交回业务 JS，最终通过 DOM 操作更新页面内容。

### 总结
这是一个 **结构清晰、职权分离** 的传统 Web 前端架构。
*   **优点**：结构直观，不同角色的逻辑完全隔离，维护某一个功能模块（如财务模块）时不会干扰其他模块。
*   **技术栈**：HTML5 + Vanilla JS (原生JS) + Tailwind CSS + PHP API。

## 5.2 Advanced Features Implementation (高级功能实现)

本系统将复杂的业务逻辑下沉至数据库层，通过存储过程和视图确保了数据处理的高效性与一致性。以下是三个核心功能的业务逻辑实现流程：

### 1. 订单支付与库存扣减 (`sp_customer_pay_order`)
*   **业务场景**: 顾客在“我的订单”页面点击“Pay Now”，选择支付方式并确认支付。
*   **调用链路**:
    1.  **前端交互**: `scripts/customer.js` 捕获点击事件，调用 `handlePaymentExecution()`。
    2.  **API 传递**: 通过 `scripts/customer-api.js` 向后端 `api/customer/orders.php?action=pay` 发送包含订单 ID 和支付方式的 POST 请求。
    3.  **后端处理**: PHP 脚本验证权限后，直接调用存储过程 `sp_customer_pay_order`。
*   **核心作用**: 
    *   **事务控制**: 在一个数据库事务内完成支付记录创建、发票生成、支付分配。
    *   **智能扣减**: 使用 **游标 (Cursor)** 遍历订单项，并根据 **FIFO (先进先出)** 原则从 `inventory_batches` 中扣减对应门店的库存。如果支付瞬间库存不足，事务将自动回滚，确保数据绝对准确。

### 2. 跨店库存调拨 (`sp_manager_transfer_inventory`)
*   **业务场景**: 经理在“库存管理”页面发现分店间库存分布不均，执行调拨操作。
*   **调用链路**:
    1.  **前端交互**: 经理在 `manager.html` 的调拨模态框中输入参数，点击“Confirm Transfer”。
    2.  **API 传递**: 请求发送至 `api/manager/inventory.php?action=transfer`。
    3.  **后端处理**: PHP 调用存储过程 `sp_manager_transfer_inventory`。
*   **核心作用**: 
    *   **批次完整性**: 该过程不仅是数字的转移。它通过游标从源门店提取具体的库存批次，并在目标门店创建带有 `TRF-` 前缀的新批次，确保了书籍的**采购成本 (Unit Cost)** 在调拨过程中得以保留，为后续的利润分析提供准确数据。

### 3. 财务结算汇总视图 (`vw_finance_order_settlement`)
*   **业务场景**: 财务人员或经理在 Dashboard 查看销售报表或结算进度。
*   **调用链路**:
    1.  **前端交互**: 页面加载时，业务脚本（如 `finance.js`）请求报表数据。
    2.  **API 传递**: 后端 `api/finance/reports.php` 被触发。
    3.  **后端处理**: PHP 无需编写复杂的 JOIN 语句，直接查询 `vw_finance_order_settlement` 视图。
*   **核心作用**: 
    *   **逻辑封装**: 订单的最终应付金额涉及原始价、会员折扣、积分抵扣等动态计算。该视图将这些复杂的数学逻辑封装在底层，前端只需像查询普通表一样即可获取“实付金额”和“是否结算”等关键指标，极大地降低了前后端的耦合度。

* **Indexes**:
    *   `idx_books_isbn`: 提高书籍查询效率。
    *   `idx_orders_member_store`: 优化按会员或门店筛选订单的速度。
    *   `idx_inventory_sku_store`: 加速库存检查和扣减操作。
