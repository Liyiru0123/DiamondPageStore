// manager-data.js - Manager界面专用数据

// 商店ID到分店名称的映射
const branchMapping = {
    'ST001': 'Central Plaza',
    'ST002': 'Riverside',
    'ST003': 'Westside',
    'ST004': 'Northgate',
    'ST005': 'Southpoint',
    'ST006': 'Eastview',
    'ST007': 'Downtown'
};

// 员工数据（用于搜索功能）- 添加了phone字段
const staffData = [
    {
        id: 1,
        employeeID: 'EMP001',
        userID: 'john.doe',
        storeID: 'ST001',
        branchName: 'Central Plaza',
        name: 'John Doe',
        position: 'manager',
        performance: 'Excellent',
        phone: '555-0101'
    },
    {
        id: 2,
        employeeID: 'EMP002',
        userID: 'sarah.miller',
        storeID: 'ST002',
        branchName: 'Riverside',
        name: 'Sarah Miller',
        position: 'manager',
        performance: 'Good',
        phone: '555-0102'
    },
    {
        id: 3,
        employeeID: 'EMP003',
        userID: 'michael.thompson',
        storeID: 'ST003',
        branchName: 'Westside',
        name: 'Michael Thompson',
        position: 'staff',
        performance: 'Good',
        phone: '555-0103'
    },
    {
        id: 4,
        employeeID: 'EMP004',
        userID: 'emily.roberts',
        storeID: 'ST001',
        branchName: 'Central Plaza',
        name: 'Emily Roberts',
        position: 'finance',
        performance: 'Average',
        phone: '555-0104'
    },
    {
        id: 5,
        employeeID: 'EMP005',
        userID: 'david.lee',
        storeID: 'ST002',
        branchName: 'Riverside',
        name: 'David Lee',
        position: 'staff',
        performance: 'Excellent',
        phone: '555-0105'
    },
    {
        id: 6,
        employeeID: 'EMP006',
        userID: 'jennifer.wilson',
        storeID: 'ST004',
        branchName: 'Northgate',
        name: 'Jennifer Wilson',
        position: 'manager',
        performance: 'Excellent',
        phone: '555-0106'
    },
    {
        id: 7,
        employeeID: 'EMP007',
        userID: 'robert.garcia',
        storeID: 'ST005',
        branchName: 'Southpoint',
        name: 'Robert Garcia',
        position: 'manager',
        performance: 'Good',
        phone: '555-0107'
    },
    {
        id: 8,
        employeeID: 'EMP008',
        userID: 'lisa.chen',
        storeID: 'ST006',
        branchName: 'Eastview',
        name: 'Lisa Chen',
        position: 'staff',
        performance: 'Good',
        phone: '555-0108'
    },
    {
        id: 9,
        employeeID: 'EMP009',
        userID: 'james.brown',
        storeID: 'ST007',
        branchName: 'Downtown',
        name: 'James Brown',
        position: 'finance',
        performance: 'Average',
        phone: '555-0109'
    },
    {
        id: 10,
        employeeID: 'EMP010',
        userID: 'amanda.taylor',
        storeID: 'ST001',
        branchName: 'Central Plaza',
        name: 'Amanda Taylor',
        position: 'staff',
        performance: 'Good',
        phone: '555-0110'
    }
];

// 用户管理数据
const userManagementData = [
    {
        id: 1,
        userId: 'USER001',
        userRole: 'Admin',
        accountStatus: 'Active',
        userType: 'Manager',
        email: 'john.doe@diamondpage.com',
        joinDate: '2024-01-15'
    },
    {
        id: 2,
        userId: 'USER002',
        userRole: 'User',
        accountStatus: 'Active',
        userType: 'Staff',
        email: 'sarah.miller@diamondpage.com',
        joinDate: '2024-02-20'
    },
    {
        id: 3,
        userId: 'USER003',
        userRole: 'User',
        accountStatus: 'Suspended',
        userType: 'Staff',
        email: 'michael.thompson@diamondpage.com',
        joinDate: '2024-03-10'
    },
    {
        id: 4,
        userId: 'USER004',
        userRole: 'Admin',
        accountStatus: 'Active',
        userType: 'Finance',
        email: 'emily.roberts@diamondpage.com',
        joinDate: '2024-01-25'
    },
    {
        id: 5,
        userId: 'USER005',
        userRole: 'User',
        accountStatus: 'Active',
        userType: 'Staff',
        email: 'david.lee@diamondpage.com',
        joinDate: '2024-02-28'
    },
    {
        id: 6,
        userId: 'USER006',
        userRole: 'Admin',
        accountStatus: 'Active',
        userType: 'Manager',
        email: 'jennifer.wilson@diamondpage.com',
        joinDate: '2024-03-05'
    },
    {
        id: 7,
        userId: 'USER007',
        userRole: 'User',
        accountStatus: 'Inactive',
        userType: 'Staff',
        email: 'robert.garcia@diamondpage.com',
        joinDate: '2024-01-30'
    },
    {
        id: 8,
        userId: 'USER008',
        userRole: 'User',
        accountStatus: 'Active',
        userType: 'Staff',
        email: 'lisa.chen@diamondpage.com',
        joinDate: '2024-02-15'
    },
    {
        id: 9,
        userId: 'USER009',
        userRole: 'Admin',
        accountStatus: 'Active',
        userType: 'Finance',
        email: 'james.brown@diamondpage.com',
        joinDate: '2024-03-01'
    },
    {
        id: 10,
        userId: 'USER010',
        userRole: 'User',
        accountStatus: 'Active',
        userType: 'Staff',
        email: 'amanda.taylor@diamondpage.com',
        joinDate: '2024-02-10'
    }
];

// 库存数据
const inventoryData = [
    { title: 'Atomic Habits', isbn: '978-0735211292', sku: 'BK-ATOM-001', branch: 'Central Plaza', stock: 15, lastRestock: '2025-06-10' },
    { title: 'The Midnight Library', isbn: '978-0525559474', sku: 'BK-MIDN-002', branch: 'Riverside', stock: 5, lastRestock: '2025-06-05' },
    { title: 'Sapiens', isbn: '978-0062316097', sku: 'BK-SAPI-003', branch: 'Westside', stock: 22, lastRestock: '2025-06-12' },
    { title: 'Educated', isbn: '978-0399590504', sku: 'BK-EDUC-004', branch: 'Central Plaza', stock: 8, lastRestock: '2025-06-08' },
    { title: 'The Great Gatsby', isbn: '978-0743273565', sku: 'BK-GATSBY-005', branch: 'Riverside', stock: 3, lastRestock: '2025-06-02' },
    { title: 'To Kill a Mockingbird', isbn: '978-0061120084', sku: 'BK-MOCK-006', branch: 'Westside', stock: 12, lastRestock: '2025-06-15' },
    { title: '1984', isbn: '978-0451524935', sku: 'BK-1984-007', branch: 'Central Plaza', stock: 18, lastRestock: '2025-06-11' },
    { title: 'Pride and Prejudice', isbn: '978-0141439518', sku: 'BK-PRIDE-008', branch: 'Riverside', stock: 7, lastRestock: '2025-06-09' }
];

// 定价数据
const pricingData = [
    {
        title: 'Atomic Habits',
        isbn: '978-0735211292',
        currentPrice: '¥52.00',
        author: 'James Clear',
        publisher: 'Avery',
        language: 'English',
        category: 'Self-help',
        comment: 'A great book on habits',
        skuID: 'BK-ATOM-001'
    },
    {
        title: 'The Midnight Library',
        isbn: '978-0525559474',
        currentPrice: '¥68.00',
        author: 'Matt Haig',
        publisher: 'Canongate Books',
        language: 'English',
        category: 'Fiction',
        comment: 'A novel about choices and regrets',
        skuID: 'BK-MIDN-002'
    },
    {
        title: 'Sapiens',
        isbn: '978-0062316097',
        currentPrice: '¥68.00',
        author: 'Yuval Noah Harari',
        publisher: 'Harper',
        language: 'English',
        category: 'History',
        comment: 'A brief history of humankind',
        skuID: 'BK-SAPI-003'
    },
    {
        title: 'Educated',
        isbn: '978-0399590504',
        currentPrice: '¥45.00',
        author: 'Tara Westover',
        publisher: 'Random House',
        language: 'English',
        category: 'Memoir',
        comment: 'A memoir about self-invention',
        skuID: 'BK-EDUC-004'
    },
    {
        title: 'The Great Gatsby',
        isbn: '978-0743273565',
        currentPrice: '¥35.00',
        author: 'F. Scott Fitzgerald',
        publisher: 'Scribner',
        language: 'English',
        category: 'Classic',
        comment: 'A classic American novel',
        skuID: 'BK-GATSBY-005'
    }
];

// Overview页面数据 - 添加新的对比数据
const overviewData = {
    // 订单数对比数据
    branchOrderComparison: [
        { branch: 'Central Plaza', orders: 156, trend: '+12%' },
        { branch: 'Riverside', orders: 124, trend: '+8%' },
        { branch: 'Westside', orders: 89, trend: '+15%' },
        { branch: 'Northgate', orders: 67, trend: '+5%' },
        { branch: 'Southpoint', orders: 45, trend: '-3%' },
        { branch: 'Eastview', orders: 78, trend: '+10%' }
    ],
    
    // 销售分析 - 支付方式对比数据
    paymentMethodComparison: [
        { method: 'Credit Card', amount: 42000, percentage: 42 },
        { method: 'WeChat Pay', amount: 28000, percentage: 28 },
        { method: 'Alipay', amount: 19500, percentage: 19.5 },
        { method: 'Cash', amount: 10500, percentage: 10.5 }
    ],
    
    // 热销图书分类对比数据
    bookCategoryComparison: [
        { category: 'Fiction', sales: 35000, percentage: 35, color: '#8B5A2B' },
        { category: 'Non-Fiction', sales: 25000, percentage: 25, color: '#A0522D' },
        { category: 'Science', sales: 15000, percentage: 15, color: '#D2691E' },
        { category: 'History', sales: 12000, percentage: 12, color: '#CD853F' },
        { category: 'Biography', sales: 8000, percentage: 8, color: '#D2B48C' },
        { category: 'Children', sales: 5000, percentage: 5, color: '#F5DEB3' }
    ]
};

// 通知数据 - 所有通知默认发送到购物系统首页
const notifications = [
    {
        id: 1,
        title: 'Staff Meeting Reminder',
        message: 'Monthly staff meeting scheduled for Friday at 3 PM in the conference room.',
        date: '2025-06-15',
        recipients: 'Shopping System Homepage',
        type: 'announcement'
    },
    {
        id: 2,
        title: 'Inventory Count',
        message: 'Please complete the monthly inventory count by end of day Thursday.',
        date: '2025-06-12',
        recipients: 'Shopping System Homepage',
        type: 'announcement'
    },
    {
        id: 3,
        title: 'New Promotion Launch',
        message: 'Summer reading promotion starts next Monday. Make sure all materials are displayed.',
        date: '2025-06-10',
        recipients: 'Shopping System Homepage',
        type: 'announcement'
    }
];