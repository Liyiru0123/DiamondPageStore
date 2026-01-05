# DiamondPageStore

A comprehensive web-based bookstore management system designed for database system coursework, featuring multi-role access control and complete business workflow management.

## Project Overview

DiamondPageStore is a full-stack bookstore management platform that handles customer shopping, inventory management, staff operations, and financial reporting. The system implements a role-based architecture supporting four distinct user types:  Customers, Staff, Managers, and Finance Personnel.

## Technology Stack

### Frontend
- **HTML5** - Semantic markup and structure
- **CSS3** - Styling with custom global styles
- **JavaScript (ES6+)** - Client-side logic and interactivity
- **Tailwind CSS** - Utility-first CSS framework for responsive design

### Backend
- **PHP 7.4+** - Server-side scripting
- **MySQL 8.0+** - Relational database management

### Development Environment
- **XAMPP/WAMP** - Local development server (Apache + MySQL + PHP)
- **AWS RDS** - Cloud database deployment support

## System Architecture

```
DiamondPageStore/
├── api/                    # Backend API endpoints(PHP files)
│   ├── auth/              # Authentication (login, register)
│   ├── customer/          # Customer operations (cart, orders, profile)
│   ├── staff/             # Staff operations (inventory, orders)
│   ├── manager/           # Manager operations (employees, reports, suppliers)
│   └── finance/           # Finance operations (invoices, financial reports)
├── config/                # Database configuration
│   └── database.php       # Database connection setup
├── database/              # SQL scripts
│   ├── book_store_1230.sql      # Complete database schema with data
│   ├── deploy_all.sql           # Deployment script
│   ├── all_procedures.sql       # Stored procedures
│   ├── all_views.sql            # Database views
│   ├── triggers.sql             # Database triggers
│   ├── grant_privileges.sql     # User permissions
│   └── backup_sql/              # Incremental SQL updates
├── pages/                 # Frontend HTML pages
│   ├── login.html         # Authentication page
│   ├── customer. html      # Customer interface
│   ├── staff. html         # Staff interface
│   ├── manager.html       # Manager interface
│   └── finance.html       # Finance interface
├── scripts/               # JavaScript modules
│   ├── login.js           # Authentication logic
│   ├── customer.js        # Customer functionality
│   ├── staff. js           # Staff functionality
│   ├── manager.js         # Manager functionality
│   ├── finance.js         # Finance functionality
│   └── common.js          # Shared utilities
├── styles/                # CSS stylesheets
│   ├── global.css         # Global styles
│   └── staff.css          # Staff-specific styles
└── assets/                # Static resources (images, icons)
```

## Database Deployment

### Automated Deployment

**Login to MySQL first**, then run deployment script:

```bash
# Step 1: Login to MySQL
mysql -u root -p
# Enter your password

# Step 2: Inside MySQL prompt, execute: 
mysql> source database/deploy_all.sql
```

This will execute:  

```
book_store_1230.sql → manager_tables.sql → all_views.sql → all_procedures.sql → finance_bundle.sql → triggers.sql
```

### Database Configuration

Update `config/database.php` with your credentials: 

```php
// For local development (XAMPP)
private $host = "127.0.0.1";
private $db_name = "book_store";
private $username = "book_app";
private $password = "StrongPassw0rd! ";
private $port = "3306";

```

## Installation and Usage

### 🌐 Quick Start - Online Demo

**Want to try it immediately without installation?**

Visit our live demo:  **[http://8.138.128.9/](http://8.138.128.9/)**

> **Note:** For demo account credentials (username and password), please contact the repository owner.

---

### 💻 Local Installation
### Prerequisites
- PHP 7.4 or higher
- MySQL 8.0 or higher
- Apache Web Server (via XAMPP/WAMP)
- Modern web browser (Chrome, Firefox, Edge)

### Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Liyiru0123/DiamondPageStore.git
   ```

2. **Move to Server Directory**
   - For XAMPP:  Move to `C:\xampp\htdocs\DiamondPageStore`

3. **Start Services**
   - Launch XAMPP/WAMP Control Panel
   - Start Apache and MySQL services

4. **Deploy Database** (see Database Deployment section above)

5. **Configure Database Connection**
   - Edit `config/database.php`
   - Update credentials to match your MySQL setup

6. **Access the Application**
   ```
   http://localhost/DiamondPageStore/pages/login.html
   ```

## User Roles and Permissions

### 1. Customer
**Access:** Browse and purchase books

**Capabilities:**
- Browse book catalog with search and filter
- View book details and categories
- Add/remove items to/from shopping cart
- Manage favorites list
- Place and track orders
- Make payments
- Apply for membership
- View and update profile
- Read system announcements

**API Endpoints:**
- `/api/customer/books. php` - Book catalog
- `/api/customer/cart.php` - Shopping cart operations
- `/api/customer/orders.php` - Order management
- `/api/customer/favorites.php` - Favorites management
- `/api/customer/member.php` - Membership operations
- `/api/customer/profile.php` - Profile management

### 2. Staff
**Access:** Inventory and order management

**Capabilities:**
- View and update inventory
- Process customer orders
- Update order status
- Create stock replenishment requests
- Add new books to catalog
- Manage product categories
- View order details and history

**API Endpoints:**
- `/api/staff/get_inventory.php` - Inventory view
- `/api/staff/update_inventory.php` - Inventory updates
- `/api/staff/get_orders.php` - Order listing
- `/api/staff/update_order_status.php` - Order processing
- `/api/staff/create_stock_request.php` - Stock requests
- `/api/staff/add_book.php` - Book management

### 3. Manager
**Access:** Full system management and oversight

**Capabilities:**
- Manage employees (staff, finance personnel)
- Monitor all store operations
- View comprehensive reports
- Manage suppliers and purchases
- Oversee inventory and replenishment
- Configure store settings
- Manage user accounts
- View system notifications
- Access business analytics

**API Endpoints:**
- `/api/manager/employees.php` - Employee management
- `/api/manager/books.php` - Book catalog management
- `/api/manager/inventory.php` - Inventory oversight
- `/api/manager/suppliers.php` - Supplier management
- `/api/manager/purchases.php` - Purchase orders
- `/api/manager/reports.php` - Business reports
- `/api/manager/users.php` - User account management
- `/api/manager/stores.php` - Store configuration

### 4. Finance
**Access:** Financial operations and reporting

**Capabilities:**
- Process invoices
- Generate financial reports
- View order financial details
- Track revenue and expenses
- Monitor payment status
- Generate period-based financial summaries
- Export financial data

**API Endpoints:**
- `/api/finance/invoices.php` - Invoice management
- `/api/finance/orders.php` - Order financial details
- `/api/finance/reports.php` - Financial reporting
