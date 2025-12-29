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

// Overview页面数据 - 修改为分店对比数据
// overviewData 已删除 - 现在使用 API 从数据库获取数据

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

// manager-data.js - 在现有数据后面添加

// 分店补货申请数据
const replenishmentRequests = [
    {
        id: 'REQ001',
        branchId: 'ST001',
        branchName: 'Central Plaza',
        requestTime: '2025-06-15 10:30:00',
        skuCount: 5,
        totalQuantity: 42,
        status: 'pending',
        urgency: 'high',
        note: 'Multiple bestsellers running low',
        items: [
            { title: 'Atomic Habits', sku: 'BK-ATOM-001', isbn: '978-0735211292', requested: 15, suggestedCost: 35.00 },
            { title: 'The Midnight Library', sku: 'BK-MIDN-002', isbn: '978-0525559474', requested: 10, suggestedCost: 40.00 },
            { title: 'Sapiens', sku: 'BK-SAPI-003', isbn: '978-0062316097', requested: 8, suggestedCost: 45.00 },
            { title: 'Educated', sku: 'BK-EDUC-004', isbn: '978-0399590504', requested: 5, suggestedCost: 30.00 },
            { title: '1984', sku: 'BK-1984-007', isbn: '978-0451524935', requested: 4, suggestedCost: 25.00 }
        ]
    },
    {
        id: 'REQ002',
        branchId: 'ST002',
        branchName: 'Riverside',
        requestTime: '2025-06-14 14:20:00',
        skuCount: 3,
        totalQuantity: 20,
        status: 'approved',
        urgency: 'medium',
        note: 'Regular restock for fiction section',
        items: [
            { title: 'Pride and Prejudice', sku: 'BK-PRIDE-008', isbn: '978-0141439518', requested: 8, suggestedCost: 28.00 },
            { title: 'To Kill a Mockingbird', sku: 'BK-MOCK-006', isbn: '978-0061120084', requested: 7, suggestedCost: 32.00 },
            { title: 'The Great Gatsby', sku: 'BK-GATSBY-005', isbn: '978-0743273565', requested: 5, suggestedCost: 30.00 }
        ]
    },
    {
        id: 'REQ003',
        branchId: 'ST003',
        branchName: 'Westside',
        requestTime: '2025-06-13 09:15:00',
        skuCount: 4,
        totalQuantity: 25,
        status: 'completed',
        urgency: 'low',
        note: 'Children section restock',
        items: [
            { title: 'Harry Potter 1', sku: 'BK-HP-009', isbn: '978-0439708180', requested: 8, suggestedCost: 38.00 },
            { title: 'The Very Hungry Caterpillar', sku: 'BK-CATER-010', isbn: '978-0399226908', requested: 7, suggestedCost: 22.00 },
            { title: 'Where the Wild Things Are', sku: 'BK-WILD-011', isbn: '978-0060254926', requested: 6, suggestedCost: 26.00 },
            { title: 'Goodnight Moon', sku: 'BK-MOON-012', isbn: '978-0694003617', requested: 4, suggestedCost: 20.00 }
        ]
    },
    {
        id: 'REQ004',
        branchId: 'ST004',
        branchName: 'Northgate',
        requestTime: '2025-06-12 16:45:00',
        skuCount: 2,
        totalQuantity: 12,
        status: 'rejected',
        urgency: 'medium',
        note: 'Exceeds budget allocation',
        items: [
            { title: 'The Power of Habit', sku: 'BK-POWER-013', isbn: '978-0812981605', requested: 8, suggestedCost: 42.00 },
            { title: 'Thinking, Fast and Slow', sku: 'BK-THINK-014', isbn: '978-0374533557', requested: 4, suggestedCost: 48.00 }
        ]
    },
    {
        id: 'REQ005',
        branchId: 'ST005',
        branchName: 'Southpoint',
        requestTime: '2025-06-11 11:10:00',
        skuCount: 6,
        totalQuantity: 35,
        status: 'pending',
        urgency: 'high',
        note: 'Urgent: School book fair next week',
        items: [
            { title: 'Diary of a Wimpy Kid', sku: 'BK-WIMPY-015', isbn: '978-0810993136', requested: 10, suggestedCost: 26.00 },
            { title: 'Wonder', sku: 'BK-WONDER-016', isbn: '978-0375869020', requested: 8, suggestedCost: 34.00 },
            { title: 'The Hobbit', sku: 'BK-HOBBIT-017', isbn: '978-0547928227', requested: 7, suggestedCost: 40.00 },
            { title: 'The Catcher in the Rye', sku: 'BK-CATCHER-018', isbn: '978-0316769488', requested: 5, suggestedCost: 32.00 },
            { title: 'Lord of the Flies', sku: 'BK-FLIES-019', isbn: '978-0399501487', requested: 3, suggestedCost: 28.00 },
            { title: 'Brave New World', sku: 'BK-BRAVE-020', isbn: '978-0060850524', requested: 2, suggestedCost: 36.00 }
        ]
    },
    {
        id: 'REQ006',
        branchId: 'ST001',
        branchName: 'Central Plaza',
        requestTime: '2025-06-10 13:25:00',
        skuCount: 3,
        totalQuantity: 18,
        status: 'approved',
        urgency: 'medium',
        note: 'Non-fiction section update',
        items: [
            { title: 'Becoming', sku: 'BK-BECOMING-021', isbn: '978-1524763138', requested: 8, suggestedCost: 45.00 },
            { title: 'Born a Crime', sku: 'BK-BORN-022', isbn: '978-0399588174', requested: 6, suggestedCost: 38.00 },
            { title: 'The Body', sku: 'BK-BODY-023', isbn: '978-1984825463', requested: 4, suggestedCost: 42.00 }
        ]
    },
    {
        id: 'REQ007',
        branchId: 'ST006',
        branchName: 'Eastview',
        requestTime: '2025-06-09 15:40:00',
        skuCount: 4,
        totalQuantity: 22,
        status: 'pending',
        urgency: 'medium',
        note: 'Regular monthly restock',
        items: [
            { title: 'The Alchemist', sku: 'BK-ALCHEMIST-024', isbn: '978-0062315007', requested: 8, suggestedCost: 36.00 },
            { title: 'The Four Agreements', sku: 'BK-FOUR-025', isbn: '978-1878424310', requested: 7, suggestedCost: 28.00 },
            { title: 'The 7 Habits of Highly Effective People', sku: 'BK-7HABITS-026', isbn: '978-1982137274', requested: 5, suggestedCost: 40.00 },
            { title: 'How to Win Friends and Influence People', sku: 'BK-WINFRIENDS-027', isbn: '978-0671027032', requested: 2, suggestedCost: 32.00 }
        ]
    },
    {
        id: 'REQ008',
        branchId: 'ST007',
        branchName: 'Downtown',
        requestTime: '2025-06-08 10:05:00',
        skuCount: 5,
        totalQuantity: 30,
        status: 'completed',
        urgency: 'low',
        note: 'Business books section',
        items: [
            { title: 'The Lean Startup', sku: 'BK-LEAN-028', isbn: '978-0307887894', requested: 8, suggestedCost: 42.00 },
            { title: 'Zero to One', sku: 'BK-ZERO-029', isbn: '978-0804139298', requested: 7, suggestedCost: 38.00 },
            { title: 'Good to Great', sku: 'BK-GREAT-030', isbn: '978-0066620992', requested: 6, suggestedCost: 45.00 },
            { title: 'Start with Why', sku: 'BK-WHY-031', isbn: '978-1591842804', requested: 5, suggestedCost: 36.00 },
            { title: 'The Hard Thing About Hard Things', sku: 'BK-HARD-032', isbn: '978-0062273208', requested: 4, suggestedCost: 40.00 }
        ]
    }
];

// 库存总览数据 - 按分店
const stockOverviewByBranch = [
    { sku: 'BK-ATOM-001', currentStock: 15, lastInbound: '2025-06-10', stockStatus: 'Good' },
    { sku: 'BK-MIDN-002', currentStock: 5, lastInbound: '2025-06-05', stockStatus: 'Low' },
    { sku: 'BK-SAPI-003', currentStock: 22, lastInbound: '2025-06-12', stockStatus: 'Good' },
    { sku: 'BK-EDUC-004', currentStock: 8, lastInbound: '2025-06-08', stockStatus: 'Medium' },
    { sku: 'BK-GATSBY-005', currentStock: 3, lastInbound: '2025-06-02', stockStatus: 'Low' },
    { sku: 'BK-MOCK-006', currentStock: 12, lastInbound: '2025-06-15', stockStatus: 'Good' },
    { sku: 'BK-1984-007', currentStock: 18, lastInbound: '2025-06-11', stockStatus: 'Good' },
    { sku: 'BK-PRIDE-008', currentStock: 7, lastInbound: '2025-06-09', stockStatus: 'Medium' }
];

// 库存总览数据 - 按SKU分布
const stockOverviewBySKU = [
    { 
        sku: 'BK-ATOM-001', 
        title: 'Atomic Habits', 
        centralPlaza: 15, 
        riverside: 8, 
        westside: 12, 
        northgate: 6, 
        southpoint: 5, 
        eastview: 7, 
        downtown: 10 
    },
    { 
        sku: 'BK-MIDN-002', 
        title: 'The Midnight Library', 
        centralPlaza: 5, 
        riverside: 4, 
        westside: 6, 
        northgate: 3, 
        southpoint: 2, 
        eastview: 4, 
        downtown: 5 
    },
    { 
        sku: 'BK-SAPI-003', 
        title: 'Sapiens', 
        centralPlaza: 22, 
        riverside: 15, 
        westside: 18, 
        northgate: 12, 
        southpoint: 8, 
        eastview: 10, 
        downtown: 14 
    },
    { 
        sku: 'BK-EDUC-004', 
        title: 'Educated', 
        centralPlaza: 8, 
        riverside: 6, 
        westside: 9, 
        northgate: 4, 
        southpoint: 3, 
        eastview: 5, 
        downtown: 7 
    },
    { 
        sku: 'BK-GATSBY-005', 
        title: 'The Great Gatsby', 
        centralPlaza: 3, 
        riverside: 2, 
        westside: 4, 
        northgate: 1, 
        southpoint: 1, 
        eastview: 2, 
        downtown: 3 
    }
];

// 完整的库存数据 - 按分店的详细库存数据
const stockOverviewByBranchDetail = [
    // Central Plaza (ST001)
    { sku: 'BK-ATOM-001', title: 'Atomic Habits', branchId: 'ST001', branchName: 'Central Plaza', currentStock: 15, lastInbound: '2025-06-10', stockStatus: 'Good', category: 'Self-help', price: 52.00 },
    { sku: 'BK-MIDN-002', title: 'The Midnight Library', branchId: 'ST001', branchName: 'Central Plaza', currentStock: 5, lastInbound: '2025-06-05', stockStatus: 'Low', category: 'Fiction', price: 68.00 },
    { sku: 'BK-SAPI-003', title: 'Sapiens', branchId: 'ST001', branchName: 'Central Plaza', currentStock: 22, lastInbound: '2025-06-12', stockStatus: 'Good', category: 'History', price: 68.00 },
    { sku: 'BK-EDUC-004', title: 'Educated', branchId: 'ST001', branchName: 'Central Plaza', currentStock: 8, lastInbound: '2025-06-08', stockStatus: 'Medium', category: 'Memoir', price: 45.00 },
    { sku: 'BK-1984-007', title: '1984', branchId: 'ST001', branchName: 'Central Plaza', currentStock: 18, lastInbound: '2025-06-11', stockStatus: 'Good', category: 'Classic', price: 35.00 },
    { sku: 'BK-BECOMING-021', title: 'Becoming', branchId: 'ST001', branchName: 'Central Plaza', currentStock: 12, lastInbound: '2025-06-09', stockStatus: 'Good', category: 'Biography', price: 45.00 },
    { sku: 'BK-BORN-022', title: 'Born a Crime', branchId: 'ST001', branchName: 'Central Plaza', currentStock: 7, lastInbound: '2025-06-07', stockStatus: 'Medium', category: 'Biography', price: 38.00 },
    
    // Riverside (ST002)
    { sku: 'BK-ATOM-001', title: 'Atomic Habits', branchId: 'ST002', branchName: 'Riverside', currentStock: 8, lastInbound: '2025-06-09', stockStatus: 'Medium', category: 'Self-help', price: 52.00 },
    { sku: 'BK-MIDN-002', title: 'The Midnight Library', branchId: 'ST002', branchName: 'Riverside', currentStock: 4, lastInbound: '2025-06-03', stockStatus: 'Low', category: 'Fiction', price: 68.00 },
    { sku: 'BK-PRIDE-008', title: 'Pride and Prejudice', branchId: 'ST002', branchName: 'Riverside', currentStock: 7, lastInbound: '2025-06-09', stockStatus: 'Medium', category: 'Classic', price: 28.00 },
    { sku: 'BK-GATSBY-005', title: 'The Great Gatsby', branchId: 'ST002', branchName: 'Riverside', currentStock: 3, lastInbound: '2025-06-02', stockStatus: 'Low', category: 'Classic', price: 30.00 },
    { sku: 'BK-MOCK-006', title: 'To Kill a Mockingbird', branchId: 'ST002', branchName: 'Riverside', currentStock: 9, lastInbound: '2025-06-10', stockStatus: 'Medium', category: 'Classic', price: 32.00 },
    { sku: 'BK-BODY-023', title: 'The Body', branchId: 'ST002', branchName: 'Riverside', currentStock: 6, lastInbound: '2025-06-06', stockStatus: 'Medium', category: 'Science', price: 42.00 },
    
    // Westside (ST003)
    { sku: 'BK-ATOM-001', title: 'Atomic Habits', branchId: 'ST003', branchName: 'Westside', currentStock: 12, lastInbound: '2025-06-11', stockStatus: 'Good', category: 'Self-help', price: 52.00 },
    { sku: 'BK-SAPI-003', title: 'Sapiens', branchId: 'ST003', branchName: 'Westside', currentStock: 18, lastInbound: '2025-06-14', stockStatus: 'Good', category: 'History', price: 68.00 },
    { sku: 'BK-MOCK-006', title: 'To Kill a Mockingbird', branchId: 'ST003', branchName: 'Westside', currentStock: 12, lastInbound: '2025-06-15', stockStatus: 'Good', category: 'Classic', price: 32.00 },
    { sku: 'BK-1984-007', title: '1984', branchId: 'ST003', branchName: 'Westside', currentStock: 14, lastInbound: '2025-06-12', stockStatus: 'Good', category: 'Classic', price: 35.00 },
    { sku: 'BK-HP-009', title: 'Harry Potter 1', branchId: 'ST003', branchName: 'Westside', currentStock: 10, lastInbound: '2025-06-10', stockStatus: 'Good', category: 'Fiction', price: 38.00 },
    { sku: 'BK-WILD-011', title: 'Where the Wild Things Are', branchId: 'ST003', branchName: 'Westside', currentStock: 8, lastInbound: '2025-06-08', stockStatus: 'Medium', category: 'Children', price: 26.00 },
    
    // Northgate (ST004)
    { sku: 'BK-ATOM-001', title: 'Atomic Habits', branchId: 'ST004', branchName: 'Northgate', currentStock: 6, lastInbound: '2025-06-07', stockStatus: 'Medium', category: 'Self-help', price: 52.00 },
    { sku: 'BK-EDUC-004', title: 'Educated', branchId: 'ST004', branchName: 'Northgate', currentStock: 4, lastInbound: '2025-06-05', stockStatus: 'Low', category: 'Memoir', price: 45.00 },
    { sku: 'BK-SAPI-003', title: 'Sapiens', branchId: 'ST004', branchName: 'Northgate', currentStock: 12, lastInbound: '2025-06-10', stockStatus: 'Good', category: 'History', price: 68.00 },
    { sku: 'BK-POWER-013', title: 'The Power of Habit', branchId: 'ST004', branchName: 'Northgate', currentStock: 5, lastInbound: '2025-06-04', stockStatus: 'Low', category: 'Self-help', price: 42.00 },
    { sku: 'BK-THINK-014', title: 'Thinking, Fast and Slow', branchId: 'ST004', branchName: 'Northgate', currentStock: 3, lastInbound: '2025-06-01', stockStatus: 'Low', category: 'Science', price: 48.00 },
    
    // Southpoint (ST005)
    { sku: 'BK-ATOM-001', title: 'Atomic Habits', branchId: 'ST005', branchName: 'Southpoint', currentStock: 5, lastInbound: '2025-06-06', stockStatus: 'Low', category: 'Self-help', price: 52.00 },
    { sku: 'BK-WIMPY-015', title: 'Diary of a Wimpy Kid', branchId: 'ST005', branchName: 'Southpoint', currentStock: 10, lastInbound: '2025-06-08', stockStatus: 'Good', category: 'Children', price: 26.00 },
    { sku: 'BK-WONDER-016', title: 'Wonder', branchId: 'ST005', branchName: 'Southpoint', currentStock: 8, lastInbound: '2025-06-07', stockStatus: 'Medium', category: 'Children', price: 34.00 },
    { sku: 'BK-HOBBIT-017', title: 'The Hobbit', branchId: 'ST005', branchName: 'Southpoint', currentStock: 7, lastInbound: '2025-06-05', stockStatus: 'Medium', category: 'Fiction', price: 40.00 },
    { sku: 'BK-CATCHER-018', title: 'The Catcher in the Rye', branchId: 'ST005', branchName: 'Southpoint', currentStock: 4, lastInbound: '2025-06-03', stockStatus: 'Low', category: 'Classic', price: 32.00 },
    
    // Eastview (ST006)
    { sku: 'BK-ATOM-001', title: 'Atomic Habits', branchId: 'ST006', branchName: 'Eastview', currentStock: 7, lastInbound: '2025-06-08', stockStatus: 'Medium', category: 'Self-help', price: 52.00 },
    { sku: 'BK-MIDN-002', title: 'The Midnight Library', branchId: 'ST006', branchName: 'Eastview', currentStock: 4, lastInbound: '2025-06-04', stockStatus: 'Low', category: 'Fiction', price: 68.00 },
    { sku: 'BK-ALCHEMIST-024', title: 'The Alchemist', branchId: 'ST006', branchName: 'Eastview', currentStock: 8, lastInbound: '2025-06-07', stockStatus: 'Medium', category: 'Fiction', price: 36.00 },
    { sku: 'BK-FOUR-025', title: 'The Four Agreements', branchId: 'ST006', branchName: 'Eastview', currentStock: 7, lastInbound: '2025-06-06', stockStatus: 'Medium', category: 'Self-help', price: 28.00 },
    { sku: 'BK-7HABITS-026', title: 'The 7 Habits of Highly Effective People', branchId: 'ST006', branchName: 'Eastview', currentStock: 5, lastInbound: '2025-06-04', stockStatus: 'Low', category: 'Self-help', price: 40.00 },
    
    // Downtown (ST007)
    { sku: 'BK-ATOM-001', title: 'Atomic Habits', branchId: 'ST007', branchName: 'Downtown', currentStock: 10, lastInbound: '2025-06-09', stockStatus: 'Good', category: 'Self-help', price: 52.00 },
    { sku: 'BK-SAPI-003', title: 'Sapiens', branchId: 'ST007', branchName: 'Downtown', currentStock: 14, lastInbound: '2025-06-11', stockStatus: 'Good', category: 'History', price: 68.00 },
    { sku: 'BK-LEAN-028', title: 'The Lean Startup', branchId: 'ST007', branchName: 'Downtown', currentStock: 8, lastInbound: '2025-06-08', stockStatus: 'Medium', category: 'Business', price: 42.00 },
    { sku: 'BK-ZERO-029', title: 'Zero to One', branchId: 'ST007', branchName: 'Downtown', currentStock: 7, lastInbound: '2025-06-07', stockStatus: 'Medium', category: 'Business', price: 38.00 },
    { sku: 'BK-GREAT-030', title: 'Good to Great', branchId: 'ST007', branchName: 'Downtown', currentStock: 6, lastInbound: '2025-06-06', stockStatus: 'Medium', category: 'Business', price: 45.00 }
];

// 所有SKU的完整列表
const allSKUs = [
    'BK-ATOM-001',
    'BK-MIDN-002',
    'BK-SAPI-003',
    'BK-EDUC-004',
    'BK-GATSBY-005',
    'BK-MOCK-006',
    'BK-1984-007',
    'BK-PRIDE-008',
    'BK-HP-009',
    'BK-CATER-010',
    'BK-WILD-011',
    'BK-MOON-012',
    'BK-POWER-013',
    'BK-THINK-014',
    'BK-WIMPY-015',
    'BK-WONDER-016',
    'BK-HOBBIT-017',
    'BK-CATCHER-018',
    'BK-FLIES-019',
    'BK-BRAVE-020',
    'BK-BECOMING-021',
    'BK-BORN-022',
    'BK-BODY-023',
    'BK-ALCHEMIST-024',
    'BK-FOUR-025',
    'BK-7HABITS-026',
    'BK-WINFRIENDS-027',
    'BK-LEAN-028',
    'BK-ZERO-029',
    'BK-GREAT-030'
];

// 分店映射关系
const branchMap = {
    'ST001': { id: 'ST001', name: 'Central Plaza', color: 'bg-primary text-white' },
    'ST002': { id: 'ST002', name: 'Riverside', color: 'bg-blue-100 text-blue-800' },
    'ST003': { id: 'ST003', name: 'Westside', color: 'bg-green-100 text-green-800' },
    'ST004': { id: 'ST004', name: 'Northgate', color: 'bg-purple-100 text-purple-800' },
    'ST005': { id: 'ST005', name: 'Southpoint', color: 'bg-yellow-100 text-yellow-800' },
    'ST006': { id: 'ST006', name: 'Eastview', color: 'bg-pink-100 text-pink-800' },
    'ST007': { id: 'ST007', name: 'Downtown', color: 'bg-indigo-100 text-indigo-800' }
};

// 供应商数据
const supplierData = [
    {
        id: 1,
        supplierID: 'SUP001',
        name: 'ABC Book Publishers',
        phone: '(555) 123-4567',
        address: '123 Book Street, New York, NY 10001',
        email: 'contact@abcbooks.com'
    },
    {
        id: 2,
        supplierID: 'SUP002',
        name: 'Global Stationery Co.',
        phone: '(555) 234-5678',
        address: '456 Stationery Ave, Los Angeles, CA 90001',
        email: 'sales@globalstationery.com'
    },
    {
        id: 3,
        supplierID: 'SUP003',
        name: 'Premium Gift Suppliers',
        phone: '(555) 345-6789',
        address: '789 Gift Lane, Chicago, IL 60601',
        email: 'info@premiumgifts.com'
    },
    {
        id: 4,
        supplierID: 'SUP004',
        name: 'Office Essentials Ltd.',
        phone: '(555) 456-7890',
        address: '321 Office Rd, Houston, TX 77001',
        email: 'support@officeessentials.com'
    },
    {
        id: 5,
        supplierID: 'SUP005',
        name: 'Novelty Book Distributors',
        phone: '(555) 567-8901',
        address: '654 Novelty Blvd, Phoenix, AZ 85001',
        email: 'orders@noveltybooks.com'
    },
    {
        id: 6,
        supplierID: 'SUP006',
        name: 'Creative Arts Supplies',
        phone: '(555) 678-9012',
        address: '987 Art Street, Philadelphia, PA 19101',
        email: 'arts@creativesupplies.com'
    },
    {
        id: 7,
        supplierID: 'SUP007',
        name: 'Educational Resources Inc.',
        phone: '(555) 789-0123',
        address: '147 Education Way, San Antonio, TX 78201',
        email: 'edu@eduresources.com'
    },
    {
        id: 8,
        supplierID: 'SUP008',
        name: 'Quality Book Bindings',
        phone: '(555) 890-1234',
        address: '258 Binding Ave, San Diego, CA 92101',
        email: 'quality@bookbindings.com'
    },
    {
        id: 9,
        supplierID: 'SUP009',
        name: 'Wholesale Book Distributors',
        phone: '(555) 901-2345',
        address: '369 Wholesale Blvd, Dallas, TX 75201',
        email: 'wholesale@bookdist.com'
    },
    {
        id: 10,
        supplierID: 'SUP010',
        name: 'Metro Office Supplies',
        phone: '(555) 012-3456',
        address: '159 Metro Rd, San Jose, CA 95101',
        email: 'metro@officesupplies.com'
    },
    {
        id: 11,
        supplierID: 'SUP011',
        name: 'International Publishers',
        phone: '(555) 112-2334',
        address: '753 International Ave, Miami, FL 33101',
        email: 'international@publishers.com'
    },
    {
        id: 12,
        supplierID: 'SUP012',
        name: 'Eco-Friendly Stationery',
        phone: '(555) 223-3445',
        address: '852 Eco Way, Seattle, WA 98101',
        email: 'eco@greenstationery.com'
    },
    {
        id: 13,
        supplierID: 'SUP013',
        name: 'Academic Book Suppliers',
        phone: '(555) 334-4556',
        address: '951 Academic Blvd, Boston, MA 02101',
        email: 'academic@booksuppliers.com'
    },
    {
        id: 14,
        supplierID: 'SUP014',
        name: 'Children\'s Book Publishers',
        phone: '(555) 445-5667',
        address: '753 Children\'s Ave, Atlanta, GA 30301',
        email: 'children@bookpublishers.com'
    },
    {
        id: 15,
        supplierID: 'SUP015',
        name: 'Digital Media Supplies',
        phone: '(555) 556-6778',
        address: '159 Digital St, Denver, CO 80201',
        email: 'digital@mediasupplies.com'
    }
];