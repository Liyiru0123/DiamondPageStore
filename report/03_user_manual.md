# 4. User Manual & Core Functionality (用户手册与核心功能)

> 本章节将按照用户角色展示核心功能截图与操作说明。
## 4.0 Registration & Login (通用于各个角色)
* **Identify**:
![1](login-identify.png) 首先进入login.html，这是整个系统的起点。不同角色的人都要使用这个界面。顾客选择“我是顾客”，员工选择“我是员工”。
* **For Customers**:
![2](login-customer.png) 顾客可以选择用已有账号登录。如果没有账号就可以注册一个。后续将开发注册功能。
* **For Staff and Management**:
![3](login-staff.png) 员工只能登录，员工的注册由管理层的后台完成。

## 4.1 For Customers (客户指南)
* **Home**:
![1](customer-home.png) 登录之后首先看到的首页包含公告和书店简介。虽然首页展示的不是可浏览的书籍，但简单的界面让顾客感到轻松。
![2](customer-announcement.png) 点击learn-more按钮之后可以看到以往的历史公告。包含公告的标题，开始以及结束时间，还有公共的内容。
* **Personal profile**:
![3](customer-profile.png) 点击右上角的修改个人信息按钮，你可以修改自己的昵称、邮箱（联系方式）以及密码。
* **Searching**:
![4](customer-search.png) 用户有两种方式可以搜索到自己想要的书，首先在不知道书名或者只是想先浏览筛选书籍时，可以直接选择筛选框里面的条件，根据价格区间、书籍所属语言以及书本受欢迎程度和价格从高到低或者从低到高等来排序。系统会返回所有符合筛选条件的书籍。另外一种就是在有明确目的的情况下搜索，只需要在关键词栏输入关键词后选择自己想要的筛选条件并回车或者点击搜索小标，就能得到结果。同样书名的书可能有不同的装订方式，或在不同的店铺有存货。搜索后都会展示出来。用户可以根据搜索结果决定购买或者收藏什么书籍。
* **Category**:
![5](customer-category.png) 书籍分类页展示了所有不同类别的书籍，有些书籍会有多种类别。
![6](customer-book-detail.png) 在搜索页、分类页、购物车页以及收藏页展示的书籍小卡片都可以点击，点击之后会弹出书籍详情页弹窗。详细展示了书籍的各类信息。右上角的收藏只是展示数量，左下方的才是加入购物车和收藏的功能按钮。
* **Cart**:
![7](customer-cart.png) 购物车页展示了用户加入购物车的物品。当选择多项物品时，用户可以选择单个删除也可以一起删除。用户可以增减物品数量，并在物品卡片右侧看到单价。不管在哪个界面，如果点击右上角购物车小标的按钮，就可以跳转到购物车。点击“Proceed to Checkout”按钮后会创建一个新的订单。
* **Orders**:
![8](customer-order.png) 订单分为创建、已经付款、取消支付、已退款还有结束五种状态。由于本店是兼顾线上线下的营业，所以退款操作和结束操作是由店员在后台系统完成的。用户可以选择线下来取书也可以选择快递……总而言之，当订单完全结束后，员工会在后台修改订单状态，用户也将在这个界面看到订单状态的变化。
![9](customer-cancel-order.png) 刚创建订单之后会马上启动一个15分钟的倒计时，如果用户没有在15分钟内支付，我们认为他/她是对这个物品不感兴趣的，所以订单会因为超时而取消。当然用户也可以点击取消按钮来决定马上取消。
![10](customer-order-payment.png) 用户支付的界面我们使用的是模拟支付，可以选择不同的支付方式。
* **Favorites**:
![11](customer-favorite.png) 展示用户喜欢的书籍卡片。
* **Membership Center**:
![12](customer-membership.png) 这里展示了用户的支付累计以及积分，还有各类会员等级及其优惠力度，深色框出来的就是用户当前的等级。后续打算开发一个积分兑换礼品的栏目。
* **Logout**:
页面右下角的logout按钮点击之后就会登出。

## 4.2 For Staff (店员指南)
* **Inventory Management**: (截图 + 说明)
* **Order Processing**: (截图 + 说明)
* 其他功能以此类推

## 4.3 For Managers (经理指南)
* **Dashboard**:
登录之后来到一个Diamond Page Store的总览界面，包含各分店的订单情况对比，订单支付方式的使用情况对比，热销书籍各种类贡献率分析，还添加了适合经理统领全局使用的“业绩最好分店”，“最受欢迎支付方式”以及“最畅销书种类”，方便经理登录上去就能一览各分店的近期销售情况。
* **Inventory Management**:
点击侧边栏的“Inventory Management"，这一页允许经理处理员工提交的“补货申请”、查看“库存总览”以及修改书本定价。
Replenishment Requests: 经理可以处理staff提交的补货申请(初始为pending状态)，对于pending状态的申请，经理可以approve，也可以Reject,approve之后的申请可以标记为completed。每一条记录都可以查看详情。对于这些补货申请记录，可以通过分店、申请状态、日期范围以及紧急程度进行筛选，reset按钮可以初始化筛选条件。
Stock Overview: 点击此分界面，可以查看各分店的库存情况。筛选条件有两个：一是分店，二是SKU，两个筛选条件下都可以通过SKU，book title和ISBN来查询具体的记录。
Pricing Management: 经理可以在此界面修改书本定价，可以通过ISBN，book title以及SKU来查询到具体书籍。
* **Staff Management**:
在这里经理可以查看员工的详细信息
经理可以通过edit按钮修改他们的分店、名字、职位以及邮箱，删除按键来删除员工记录。
可以按照branch, position来筛选员工记录，reset按钮可以初始化筛选条件。
可以由employeeID, UserID, name和email的关键词查询具体员工
Add staff: 点击右上角的add staff按钮，然后填写详细员工信息来添加新员工。
* **User Management**:
这个界面可以查看用户账户相关的详细信息
可以通过UserID, username, name, 以及email来搜索具体账户
提供edit, delete user以及quick reset password的功能。
Edit功能中可以修改账户名、个人名字，账户状态以及重置密码
* **Supplier Management**:
这个界面展示了供应商的信息，可以通过name，phone, address以及email来查询具体供应商。
* 其他功能以此类推

## 4.4 For Finance (财务指南)

* 
