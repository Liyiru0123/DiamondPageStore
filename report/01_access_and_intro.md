# 1. Access Instructions & Introduction (访问说明与简介)

## 1.1 Deployment Information (部署信息)
* **Hosting Platform**: Alibaba Cloud 
* **Development Stack**: 等待填写
* **Application URL**: [在此填入阿里云的访问链接]
* **Database Connection**:
    * **Host**: [阿里云 RDS 或 ECS IP]
    * **Port**: 
    * **Username**: 
    * **Password**: 

## 1.2 User Test Accounts (用户测试账号)
> **Note to Marker**: All passwords are set to `123456` for testing convenience.

| User Role    | Username  | Password |
| :----------- | :-------- | :------- |
| **Manager**  | manager01 | 123456   |
| **Finance**  | finance01 | 123456   |
| **Staff**    | staff01   | 123456   |
| **Customer** | member01  | 123456   |

## 2. Project Overview (项目概述)
* **Company Background**: 

  **Diamond Page Store** 是一家采用“总部-分店”双层管理结构的连锁书店。品牌理念正如口号所言：*“Select the diamond page, start a wonderful day.”（翻开钻石书页，开启美好一天）*。

  本系统旨在将书店的核心业务流程数字化，以解决此前纸质化管理带来的效率低下问题。系统的核心特性包括：

  - **集中与分布式管理 (Centralized & Distributed Management)**：总部负责统一的全球定价策略与供应商合同管理，而各实体分店则独立管理本地的库存补给与销售业务。
  - **基于角色的访问控制 (Role-Based Access Control, RBAC)**：系统为经理、店员、财务人员和客户设计了独立的工作流与权限体系，在确保数据安全的同时明确了操作边界。

* **Development Methodology**

  项目采用 XAMPP 作为本地集成开发环境进行快速迭代，利用 PHP 和 MySQL 构建 MVC 架构，最终部署于阿里云服务器以实现云端访问。