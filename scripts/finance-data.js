// finance-data.js - 添加订单数据和更新的发票数据

// 订单数据
const orderData = {
    "ORD-001": {
        orderId: "ORD-001",
        storeId: "STORE-001",
        storeName: "New York Store",
        memberId: "MEM-001",
        memberName: "Customer A",
        orderStatus: "paid",
        orderDate: "2025-10-02 11:45",
        note: "VIP customer, expedite shipping",
        // 订单详情字段
        grossAmount: 88.50,
        discountRate: 0.1,
        discountedAmount: 79.65,
        redeemedPoints: 200,
        pointsDiscountAmount: 10.00,
        payableAmount: 69.65,
        paidAmount: 69.65,
        itemCount: 3,
        totalQuantity: 3,
        items: [
            { sku: "BK-001", name: "Sapiens", quantity: 1, unitPrice: 32.50, subtotal: 32.50 },
            { sku: "BK-002", name: "Atomic Habits", quantity: 1, unitPrice: 28.00, subtotal: 28.00 },
            { sku: "BK-003", name: "Educated", quantity: 1, unitPrice: 28.00, subtotal: 28.00 }
        ],
        paymentMethod: "Credit Card",
        shippingAddress: "123 Main St, New York, NY 10001"
    },
    "ORD-002": {
        orderId: "ORD-002",
        storeId: "STORE-002",
        storeName: "Boston Store",
        memberId: "MEM-002",
        memberName: "Customer B",
        orderStatus: "created",
        orderDate: "2025-10-03 13:10",
        note: "New customer, requires follow-up",
        grossAmount: 159.00,
        discountRate: 0.05,
        discountedAmount: 151.05,
        redeemedPoints: 0,
        pointsDiscountAmount: 0,
        payableAmount: 151.05,
        paidAmount: 0,
        itemCount: 3,
        totalQuantity: 3,
        items: [
            { sku: "BK-004", name: "The Alchemist", quantity: 1, unitPrice: 45.00, subtotal: 45.00 },
            { sku: "BK-005", name: "Thinking, Fast and Slow", quantity: 1, unitPrice: 62.00, subtotal: 62.00 },
            { sku: "BK-006", name: "The Midnight Library", quantity: 1, unitPrice: 52.00, subtotal: 52.00 }
        ],
        paymentMethod: "Cash",
        shippingAddress: "456 Beacon St, Boston, MA 02115"
    },
    "ORD-003": {
        orderId: "ORD-003",
        storeId: "STORE-001",
        storeName: "New York Store",
        memberId: "MEM-003",
        memberName: "Customer C",
        orderStatus: "processing",
        orderDate: "2025-10-04 15:30",
        note: "Customer requested gift wrapping",
        grossAmount: 200.00,
        discountRate: 0,
        discountedAmount: 200.00,
        redeemedPoints: 500,
        pointsDiscountAmount: 25.00,
        payableAmount: 175.00,
        paidAmount: 100.00,
        itemCount: 2,
        totalQuantity: 2,
        items: [
            { sku: "BK-007", name: "Business Adventures", quantity: 1, unitPrice: 120.00, subtotal: 120.00 },
            { sku: "BK-008", name: "The Lean Startup", quantity: 1, unitPrice: 80.00, subtotal: 80.00 }
        ],
        paymentMethod: "Third-Party Payment",
        shippingAddress: "789 Broadway, New York, NY 10003"
    },
    "ORD-004": {
        orderId: "ORD-004",
        storeId: "STORE-003",
        storeName: "Chicago Store",
        memberId: "MEM-004",
        memberName: "Customer D",
        orderStatus: "completed",
        orderDate: "2025-10-05 09:15",
        note: "Bulk order for corporate client",
        grossAmount: 680.00,
        discountRate: 0.15,
        discountedAmount: 578.00,
        redeemedPoints: 1000,
        pointsDiscountAmount: 50.00,
        payableAmount: 528.00,
        paidAmount: 528.00,
        itemCount: 10,
        totalQuantity: 10,
        items: [
            { sku: "BK-009", name: "Corporate Finance", quantity: 5, unitPrice: 68.00, subtotal: 340.00 },
            { sku: "BK-010", name: "Marketing Management", quantity: 5, unitPrice: 68.00, subtotal: 340.00 }
        ],
        paymentMethod: "Credit Card",
        shippingAddress: "101 Michigan Ave, Chicago, IL 60601"
    }
};

// 更新发票数据以匹配需求文档
const invoiceData = {
    "INV-2023-001": {
        invoiceId: "INV-2023-001",
        invoiceNumber: "INV001-2023",
        orderId: "ORD-001",
        storeId: "STORE-001",
        storeName: "New York Store",
        memberId: "MEM-001",
        memberName: "Customer A",
        issuedAt: "2025-10-02",
        dueDate: "2025-10-31",
        invoiceAmount: 69.65,
        paidAmount: 69.65,
        balanceAmount: 0,
        status: "PAID",
        lastPaidAt: "2025-10-02 14:30",
        createdBy: "EMP001",
        createdAt: "2025-10-02 14:30",
        updatedAt: "2025-10-02 14:30",
        notes: "VIP customer, payment received immediately",
        items: [
            { description: "Sapiens - Hardcover", quantity: 1, unitPrice: 32.50, subtotal: 32.50 },
            { description: "Atomic Habits - Paperback", quantity: 1, unitPrice: 28.00, subtotal: 28.00 },
            { description: "Educated - Hardcover", quantity: 1, unitPrice: 28.00, subtotal: 28.00 }
        ],
        taxRate: 8.875,
        taxAmount: 6.18,
        subtotal: 63.47
    },
    "INV-2023-002": {
        invoiceId: "INV-2023-002",
        invoiceNumber: "INV002-2023",
        orderId: "ORD-002",
        storeId: "STORE-002",
        storeName: "Boston Store",
        memberId: "MEM-002",
        memberName: "Customer B",
        issuedAt: "2025-10-03",
        dueDate: "2025-11-02",
        invoiceAmount: 151.05,
        paidAmount: 0,
        balanceAmount: 151.05,
        status: "UNPAID",
        lastPaidAt: null,
        createdBy: "EMP002",
        createdAt: "2025-10-03 09:15",
        updatedAt: "2025-10-03 09:15",
        notes: "New customer, payment reminder sent",
        items: [
            { description: "The Alchemist - Collector's Edition", quantity: 1, unitPrice: 45.00, subtotal: 45.00 },
            { description: "Thinking, Fast and Slow - Hardcover", quantity: 1, unitPrice: 62.00, subtotal: 62.00 },
            { description: "The Midnight Library - Hardcover", quantity: 1, unitPrice: 52.00, subtotal: 52.00 }
        ],
        taxRate: 6.25,
        taxAmount: 9.44,
        subtotal: 141.61
    },
    "INV-2023-003": {
        invoiceId: "INV-2023-003",
        invoiceNumber: "INV003-2023",
        orderId: "ORD-003",
        storeId: "STORE-001",
        storeName: "New York Store",
        memberId: "MEM-003",
        memberName: "Customer C",
        issuedAt: "2025-10-04",
        dueDate: "2025-10-25",
        invoiceAmount: 175.00,
        paidAmount: 100.00,
        balanceAmount: 75.00,
        status: "PARTIAL",
        lastPaidAt: "2025-10-04 16:45",
        createdBy: "EMP001",
        createdAt: "2025-10-04 16:45",
        updatedAt: "2025-10-05 10:30",
        notes: "Partial payment received, follow-up scheduled",
        items: [
            { description: "Business Adventures - Hardcover", quantity: 1, unitPrice: 120.00, subtotal: 120.00 },
            { description: "The Lean Startup - Hardcover", quantity: 1, unitPrice: 80.00, subtotal: 80.00 }
        ],
        taxRate: 8.875,
        taxAmount: 15.53,
        subtotal: 159.47
    },
    "INV-2023-004": {
        invoiceId: "INV-2023-004",
        invoiceNumber: "INV004-2023",
        orderId: "ORD-004",
        storeId: "STORE-003",
        storeName: "Chicago Store",
        memberId: "MEM-004",
        memberName: "Customer D",
        issuedAt: "2025-10-05",
        dueDate: "2025-11-04",
        invoiceAmount: 528.00,
        paidAmount: 0,
        balanceAmount: 528.00,
        status: "OVERDUE",
        lastPaidAt: null,
        createdBy: "EMP003",
        createdAt: "2025-10-05 11:20",
        updatedAt: "2025-10-15 09:00",
        notes: "Corporate account, payment overdue by 10 days",
        items: [
            { description: "Corporate Finance - Textbook (5 copies)", quantity: 5, unitPrice: 68.00, subtotal: 340.00 },
            { description: "Marketing Management - Textbook (5 copies)", quantity: 5, unitPrice: 68.00, subtotal: 340.00 }
        ],
        taxRate: 10.25,
        taxAmount: 54.12,
        subtotal: 473.88
    }
};

// 员工数据
const employeeData = {
    "EMP001": {
        id: "EMP001",
        name: "John Accountant",
        role: "Finance Staff",
        email: "john.accountant@diamondpage.com"
    },
    "EMP002": {
        id: "EMP002",
        name: "Sarah Manager",
        role: "Finance Manager",
        email: "sarah.manager@diamondpage.com"
    },
    "EMP003": {
        id: "EMP003",
        name: "Mike Clerk",
        role: "Finance Clerk",
        email: "mike.clerk@diamondpage.com"
    }
};

// 门店数据
const storeData = {
    "STORE-001": {
        storeId: "STORE-001",
        storeName: "New York Store",
        address: "123 Main St, New York, NY 10001",
        phone: "(212) 555-0101"
    },
    "STORE-002": {
        storeId: "STORE-002",
        storeName: "Boston Store",
        address: "456 Beacon St, Boston, MA 02115",
        phone: "(617) 555-0102"
    },
    "STORE-003": {
        storeId: "STORE-003",
        storeName: "Chicago Store",
        address: "101 Michigan Ave, Chicago, IL 60601",
        phone: "(312) 555-0103"
    }
};

// 支付方式数据保持不变
const paymentMethodData = {
    distribution: {
        labels: ['Credit Card', 'Third-Party Payment', 'Cash'],
        data: [125000, 85000, 65000],
        colors: ['#774b30', '#a9805b', '#9f5933']
    }
};

// 总收入统计保持不变
const totalRevenueStats = {
    currentMonth: 86420,
    lastMonth: 82000,
    growth: 5.4
};

// Merge all data
const allOrderData = { ...orderData };
const allInvoiceData = { ...invoiceData };