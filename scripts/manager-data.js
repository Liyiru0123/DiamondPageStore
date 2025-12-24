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

// 员工数据（用于搜索功能）- 添加了password字段
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
        password: 'password123' // 添加密码字段
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
        password: 'securepass456' // 添加密码字段
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
        password: 'mikepass789' // 添加密码字段
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
        password: 'emilyfinance2025' // 添加密码字段
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
        password: 'davidpass321' // 添加密码字段
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
        password: 'jenniferadmin' // 添加密码字段
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
        password: 'robertpass999' // 添加密码字段
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
        password: 'lisachenpass' // 添加密码字段
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
        password: 'jamesfin2025' // 添加密码字段
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
        password: 'amandapass777' // 添加密码字段
    }
];

// 分店订单数据
const branchOrderData = {
    "ORD-005": {
        orderId: "ORD-005",
        branchId: "1",
        memberId: "MEM-007",
        status: "paid",
        createdDate: "2025-06-02 11:45",
        updatedDate: "2025-06-02 11:45",
        paymentMethod: "cash",
        totalAmount: "¥200.00",
        items: [
            { name: "The Great Gatsby", isbn: "978-0743273565", quantity: 1, unitPrice: "¥200.00", subtotal: "¥200.00" }
        ]
    },
    "ORD-006": {
        orderId: "ORD-006",
        branchId: "1",
        memberId: "MEM-008",
        status: "refunded",
        createdDate: "2025-06-14 16:30",
        updatedDate: "2025-06-15 10:00",
        paymentMethod: "credit card",
        totalAmount: "¥125.00",
        items: [
            { name: "To Kill a Mockingbird", isbn: "978-0061120084", quantity: 1, unitPrice: "¥125.00", subtotal: "¥125.00" }
        ]
    },
    "ORD-007": {
        orderId: "ORD-007",
        branchId: "2",
        memberId: "MEM-009",
        status: "paid",
        createdDate: "2025-06-15 10:30",
        updatedDate: "2025-06-15 10:30",
        paymentMethod: "WeChat Pay",
        totalAmount: "¥52.00",
        items: [
            { name: "1984", isbn: "978-0451524935", quantity: 1, unitPrice: "¥52.00", subtotal: "¥52.00" }
        ]
    },
    "ORD-008": {
        orderId: "ORD-008",
        branchId: "2",
        memberId: "MEM-010",
        status: "cancelled",
        createdDate: "2025-06-15 09:45",
        updatedDate: "2025-06-15 10:20",
        paymentMethod: "Alipay",
        totalAmount: "¥45.00",
        items: [
            { name: "Pride and Prejudice", isbn: "978-0141439518", quantity: 1, unitPrice: "¥45.00", subtotal: "¥45.00" }
        ]
    },
    "ORD-009": {
        orderId: "ORD-009",
        branchId: "2",
        memberId: "MEM-011",
        status: "paid",
        createdDate: "2025-06-14 18:20",
        updatedDate: "2025-06-14 18:20",
        paymentMethod: "cash",
        totalAmount: "¥89.00",
        items: [
            { name: "The Catcher in the Rye", isbn: "978-0316769174", quantity: 1, unitPrice: "¥89.00", subtotal: "¥89.00" }
        ]
    },
    "ORD-010": {
        orderId: "ORD-010",
        branchId: "3",
        memberId: "MEM-012",
        status: "created",
        createdDate: "2025-06-15 11:15",
        updatedDate: "2025-06-15 11:15",
        paymentMethod: "credit card",
        totalAmount: "¥78.00",
        items: [
            { name: "Brave New World", isbn: "978-0060850524", quantity: 1, unitPrice: "¥78.00", subtotal: "¥78.00" }
        ]
    },
    "ORD-011": {
        orderId: "ORD-011",
        branchId: "3",
        memberId: "MEM-013",
        status: "paid",
        createdDate: "2025-06-15 10:30",
        updatedDate: "2025-06-15 10:30",
        paymentMethod: "WeChat Pay",
        totalAmount: "¥150.00",
        items: [
            { name: "The Hobbit", isbn: "978-0547928227", quantity: 1, unitPrice: "¥150.00", subtotal: "¥150.00" }
        ]
    },
    "ORD-012": {
        orderId: "ORD-012",
        branchId: "3",
        memberId: "MEM-014",
        status: "paid",
        createdDate: "2025-06-14 17:45",
        updatedDate: "2025-06-14 17:45",
        paymentMethod: "Alipay",
        totalAmount: "¥210.00",
        items: [
            { name: "Lord of the Flies", isbn: "978-0571056866", quantity: 1, unitPrice: "¥85.00", subtotal: "¥85.00" },
            { name: "Animal Farm", isbn: "978-0451526342", quantity: 1, unitPrice: "¥125.00", subtotal: "¥125.00" }
        ]
    },
    "ORD-013": {
        orderId: "ORD-013",
        branchId: "4",
        memberId: "MEM-015",
        status: "paid",
        createdDate: "2025-06-15 14:20",
        updatedDate: "2025-06-15 14:20",
        paymentMethod: "cash",
        totalAmount: "¥45.00",
        items: [
            { name: "The Little Prince", isbn: "978-0156012195", quantity: 1, unitPrice: "¥45.00", subtotal: "¥45.00" }
        ]
    },
    "ORD-014": {
        orderId: "ORD-014",
        branchId: "4",
        memberId: "MEM-016",
        status: "paid",
        createdDate: "2025-06-14 16:10",
        updatedDate: "2025-06-14 16:10",
        paymentMethod: "credit card",
        totalAmount: "¥78.00",
        items: [
            { name: "Charlotte's Web", isbn: "978-0061124952", quantity: 1, unitPrice: "¥78.00", subtotal: "¥78.00" }
        ]
    }
};

// 分店数据
const branchData = {
    1: {
        name: "Central Main Store",
        address: "123 Main Street Downtown",
        phone: "2125551001",
        status: "Open",
        isTopSales: true,
        weekly: {
            revenue: 5800,
            profit: 2900,
            change: "+15% vs last week",
            trendData: [1200, 1400, 1100, 1300, 1500, 1600, 1700]
        },
        monthly: {
            revenue: 24580,
            profit: 12240,
            change: "+12% vs last month",
            trendData: [22000, 23500, 21800, 24580]
        },
        quarterly: {
            revenue: 74580,
            profit: 37290,
            change: "+8% vs last quarter",
            trendData: [68000, 72000, 74580]
        },
        transactions: [
            { date: "2025-06-15 09:24", orderId: "ORD-001", totalAmount: "¥68.00", status: "created" },
            { date: "2025-06-15 10:15", orderId: "ORD-002", totalAmount: "¥159.00", status: "paid" },
            { date: "2025-06-14 19:42", orderId: "ORD-005", totalAmount: "¥200.00", status: "paid" },
            { date: "2025-06-14 16:30", orderId: "ORD-006", totalAmount: "¥125.00", status: "refunded" }
        ]
    },
    2: {
        name: "Westside Branch",
        address: "456 West Avenue Westside",
        phone: "2125551002",
        status: "Open",
        isTopSales: false,
        weekly: {
            revenue: 4200,
            profit: 2100,
            change: "+8% vs last week",
            trendData: [1000, 1100, 1200, 900, 1300, 1400, 1500]
        },
        monthly: {
            revenue: 18920,
            profit: 9560,
            change: "+10% vs last month",
            trendData: [17500, 18200, 16800, 18920]
        },
        quarterly: {
            revenue: 56820,
            profit: 28410,
            change: "+6% vs last quarter",
            trendData: [52000, 55000, 56820]
        },
        transactions: [
            { date: "2025-06-15 10:30", orderId: "ORD-007", totalAmount: "¥52.00", status: "paid" },
            { date: "2025-06-15 09:45", orderId: "ORD-008", totalAmount: "¥45.00", status: "cancelled" },
            { date: "2025-06-14 18:20", orderId: "ORD-009", totalAmount: "¥89.00", status: "paid" }
        ]
    },
    3: {
        name: "Eastside Branch",
        address: "789 East Boulevard Eastside",
        phone: "2125551003",
        status: "Open",
        isTopSales: false,
        weekly: {
            revenue: 5100,
            profit: 2550,
            change: "+12% vs last week",
            trendData: [1100, 1200, 1300, 1400, 1500, 1600, 1700]
        },
        monthly: {
            revenue: 22150,
            profit: 11200,
            change: "+9% vs last month",
            trendData: [19800, 20500, 21200, 22150]
        },
        quarterly: {
            revenue: 65200,
            profit: 32600,
            change: "+7% vs last quarter",
            trendData: [61000, 63500, 65200]
        },
        transactions: [
            { date: "2025-06-15 11:15", orderId: "ORD-010", totalAmount: "¥78.00", status: "created" },
            { date: "2025-06-15 10:30", orderId: "ORD-011", totalAmount: "¥150.00", status: "paid" },
            { date: "2025-06-14 17:45", orderId: "ORD-012", totalAmount: "¥210.00", status: "paid" }
        ]
    },
    4: {
        name: "Southpoint Branch",
        address: "654 South Lane Southgate",
        phone: "2125551005",
        status: "Closed",
        isTopSales: false,
        weekly: {
            revenue: 0,
            profit: 0,
            change: "0% vs last week",
            trendData: [0, 0, 0, 0, 0, 0, 0]
        },
        monthly: {
            revenue: 0,
            profit: 0,
            change: "0% vs last month",
            trendData: [0, 0, 0, 0]
        },
        quarterly: {
            revenue: 0,
            profit: 0,
            change: "0% vs last quarter",
            trendData: [0, 0, 0]
        },
        transactions: []
    }
};

// 为分支页面合并订单数据
const allBranchOrderData = { ...branchOrderData };

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

// 分店绩效数据
const branchPerformance = [
    { name: 'Central Plaza', sales: '¥8,420', performance: 'Excellent', status: 'Open' },
    { name: 'Riverside', sales: '¥6,150', performance: 'Good', status: 'Open' },
    { name: 'Westside', sales: '¥5,780', performance: 'Good', status: 'Open' },
    { name: 'Northgate', sales: '¥3,240', performance: 'Average', status: 'Open' }
];

// 促销数据
const promotionsData = [
    {
        id: 1,
        title: 'Member Tier Discount',
        discount: 'Up to 25% OFF',
        period: 'Ongoing',
        status: 'Active',
        startDate: '2025-06-01',
        endDate: '2025-12-31',
        description: 'Special discount for all member tiers',
        recipients: 'Shopping System Homepage'
    },
    {
        id: 2,
        title: 'Student Discount',
        discount: '15% OFF',
        period: 'Ongoing',
        status: 'Active',
        startDate: '2025-06-01',
        endDate: '2025-12-31',
        description: 'Discount for students with valid ID',
        recipients: 'Shopping System Homepage'
    },
    {
        id: 3,
        title: 'Bestseller Bundle',
        discount: 'Buy 2 Get 1 Free',
        period: 'Jun 15 - Jun 30',
        status: 'Upcoming',
        startDate: '2025-06-15',
        endDate: '2025-06-30',
        description: 'Special bundle offer for bestselling books',
        recipients: 'Shopping System Homepage'
    }
];

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
    },
    {
        id: 4,
        title: 'Member Tier Discount Promotion',
        message: 'New promotion: Up to 25% OFF for all member tiers. Promotion is now active.',
        date: '2025-06-01',
        recipients: 'Shopping System Homepage',
        type: 'promotion'
    },
    {
        id: 5,
        title: 'Student Discount Promotion',
        message: 'New promotion: 15% OFF for students with valid ID. Promotion is now active.',
        date: '2025-06-01',
        recipients: 'Shopping System Homepage',
        type: 'promotion'
    }
];