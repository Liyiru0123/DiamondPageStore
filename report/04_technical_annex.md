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
* **Advanced Queries**:
    1. Query 1 (Description & SQL Code)
    2. Query 2 (Description & SQL Code)
    3. Query 3 (Description & SQL Code)
* **Stored Procedures & Transactions&envent&trigger**: Code snippet for `create_order` transaction.
* **Indexes**: List of indexes created for performance.