// Invoice Data - Dual Perspective
const invoiceData = {
    "INV-2023-001": {
        invoiceNo: "INV-2023-001",
        orderId: "ORD-001",
        staffId: "STAFF-001",
        status: "paid",
        issueDate: "2025-10-01",
        dueDate: "2025-10-31",
        amount: 45.97,
        taxAmount: 3.68,
        updateDate: "2025-10-02 14:30",
        customer: "Customer A",
        customerId: "CUST-001",
        items: [
            { description: "Book Purchase - Fiction Collection", quantity: 1, unitPrice: 45.97, subtotal: 45.97 }
        ],
        taxRate: 10,
        internalNotes: "VIP customer, 3 years partnership, excellent payment history, consider extending payment terms to 45 days",
        customerNotes: "Thank you for your business! We appreciate your continued partnership.",
        internalFlag: "vip_customer",
        lastEditedBy: "STAFF-001",
        lastEditDate: "2025-10-02 14:30"
    },
    "INV-2023-002": {
        invoiceNo: "INV-2023-002",
        orderId: "ORD-002",
        staffId: "STAFF-002", 
        status: "sent",
        issueDate: "2025-10-03",
        dueDate: "2025-11-02",
        amount: 85.44,
        taxAmount: 6.84,
        updateDate: "2025-10-03 9:15",
        customer: "Customer B",
        customerId: "CUST-002",
        items: [
            { description: "Educational Books", quantity: 2, unitPrice: 4500, subtotal: 9000 },
            { description: "Membership Fee", quantity: 1, unitPrice: 3300, subtotal: 3300 }
        ],
        taxRate: 10,
        internalNotes: "New customer first transaction, need to send payment reminder on June 28, confirm payment account information",
        customerNotes: "Please pay within 30 days. For any questions, contact our accounts department at accounting@diamondpage.com",
        internalFlag: "new_customer",
        lastEditedBy: "STAFF-002",
        lastEditDate: "2025-10-03 09:15"
    },
    "INV-2023-003": {
        invoiceNo: "INV-2023-003",
        orderId: "ORD-003", 
        staffId: "STAFF-001",
        status: "overdue",
        issueDate: "2025-10-04",
        dueDate: "2025-11-03",
        amount: 69.26,
        taxAmount: 5.54,
        updateDate: "2025-10-04 16:45",
        customer: "Customer C",
        customerId: "CUST-003",
        items: [
            { description: "Children's Books", quantity: 5, unitPrice: 1040, subtotal: 5200 }
        ],
        taxRate: 10,
        internalNotes: "Overdue by 2 days, phone reminder sent on July 11, customer promised payment by July 15, need to follow up",
        customerNotes: "URGENT: This invoice is now overdue. Please make payment immediately to avoid service interruption. Contact us at +1 (555) 123-4567 if you have any questions.",
        internalFlag: "overdue_tracking",
        lastEditedBy: "STAFF-001",
        lastEditDate: "2025-10-04 16:45"
    },
    "INV-2023-004": {
        invoiceNo: "INV-2023-004",
        orderId: "ORD-004",
        staffId: "STAFF-003",
        status: "draft", 
        issueDate: "2025-10-03",
        dueDate: "2025-11-02",
        amount: 98.06,
        taxAmount: 7.84,
        updateDate: "2025-10-03 11:20",
        customer: "Customer A",
        customerId: "CUST-001",
        items: [
            { description: "Business Books", quantity: 3, unitPrice: 2600, subtotal: 7800 }
        ],
        taxRate: 10,
        internalNotes: "Waiting for sales manager to confirm discount rate (customer requested 5% discount), expected approval by June 18",
        customerNotes: "Draft invoice - pending final approval. We will notify you once the invoice is officially issued.",
        internalFlag: "pending_approval",
        lastEditedBy: "STAFF-003",
        lastEditDate: "2023-06-15 11:20"
    },
    "INV-2023-005": {
        invoiceNo: "INV-2023-005",
        orderId: "ORD-005",
        staffId: "STAFF-002",
        status: "sent",
       issueDate: "2025-10-03",
        dueDate: "2025-11-02",
        amount: 31.99,
        taxAmount: 2.56,
        updateDate: "2025-10-04 13:10",
        customer: "Customer D",
        customerId: "CUST-004",
        items: [
            { description: "Technical Books", quantity: 4, unitPrice: 3900, subtotal: 15600 }
        ],
        taxRate: 10,
        internalNotes: "Corporate customer, payment in 3 installments as per contract, first installment of 5200 received",
        customerNotes: "Bulk order discount applied. Payment terms: 3 installments as per agreement. First installment received.",
        internalFlag: "installment_payment",
        lastEditedBy: "STAFF-002",
        lastEditDate: "2023-06-20 13:10"
    },
    "INV-2023-006": {
        invoiceNo: "INV-2023-006",
        orderId: "ORD-006",
        staffId: "STAFF-004",
        status: "cancelled",
        issueDate: "2025-10-05",
        dueDate: "2025-11-03", 
        amount: 54.98,
        taxAmount: 4.4,
        updateDate: "2025-10-05 10:30",
        customer: "Customer E",
        customerId: "CUST-005",
        items: [
            { description: "Reference Books", quantity: 2, unitPrice: 4600, subtotal: 9200 }
        ],
        taxRate: 10,
        internalNotes: "Order cancelled due to budget adjustment, notified warehouse to stop shipment, waiting for sales department to confirm refund process",
        customerNotes: "Invoice cancelled per customer request. Refund process initiated. Please allow 5-7 business days for processing.",
        internalFlag: "cancelled_refund",
        lastEditedBy: "STAFF-004",
        lastEditDate: "2025-10-05 10:30"
    }
};

// Staff Data
const staffData = {
    "STAFF-001": {
        id: "STAFF-001",
        name: "John Accountant",
        role: "Finance Staff",
        email: "john.accountant@diamondpage.com"
    },
    "STAFF-002": {
        id: "STAFF-002",
        name: "Sarah Manager",
        role: "Finance Manager",
        email: "sarah.manager@diamondpage.com"
    },
    "STAFF-003": {
        id: "STAFF-003",
        name: "Mike Clerk",
        role: "Finance Clerk",
        email: "mike.clerk@diamondpage.com"
    },
    "STAFF-004": {
        id: "STAFF-004",
        name: "Lisa Assistant",
        role: "Finance Assistant",
        email: "lisa.assistant@diamondpage.com"
    }
};

// Order Data
const orderData = {
    "ORD-001": {
        orderId: "ORD-001",
        branchId: "1",
        memberId: "MEM-001",
        status: "created",
        createdDate: "2025-10-02 11:45",
        updatedDate: "2025-10-02 11:45",
        paymentMethod: "credit card",
        totalAmount: "¥68.00",
        items: [
            { name: "Sapiens", isbn: "978-0062316097", quantity: 1, unitPrice: "¥68.00", subtotal: "¥68.00" }
        ]
    },
    "ORD-002": {
        orderId: "ORD-002",
        branchId: "2",
        memberId: "MEM-003",
        status: "paid",
        createdDate: "2025-10-03 13:10",
        updatedDate: "2025-10-03 20:10",
        paymentMethod: "cash",
        totalAmount: "¥159.00",
        items: [
            { name: "Atomic Habits", isbn: "978-0735211292", quantity: 1, unitPrice: "¥52.00", subtotal: "¥52.00" },
            { name: "The Alchemist", isbn: "978-0062315007", quantity: 1, unitPrice: "¥45.00", subtotal: "¥45.00" },
            { name: "Thinking, Fast and Slow", isbn: "978-0374533557", quantity: 1, unitPrice: "¥62.00", subtotal: "¥62.00" }
        ]
    },
    "ORD-003": {
        orderId: "ORD-003",
        branchId: "1",
        memberId: "MEM-002",
        status: "cancelled",
        createdDate: "2025-10-04 15:30",
        updatedDate: "2025-10-04 16:14",
        paymentMethod: "paypal",
        totalAmount: "¥200.00",
        items: [
            { name: "Educated", isbn: "978-0399590504", quantity: 1, unitPrice: "¥200.00", subtotal: "¥200.00" }
        ]
    },
    "ORD-004": {
        orderId: "ORD-004",
        branchId: "3",
        memberId: "MEM-005",
        status: "refunded",
        createdDate: "2025-10-04 12:20",
        updatedDate: "2025-10-07 09:15",
        paymentMethod: "credit card",
        totalAmount: "¥680.00",
        items: [
            { name: "The Midnight Library", isbn: "978-0525559474", quantity: 1, unitPrice: "¥680.00", subtotal: "¥680.00" }
        ]
    }
};

// Book Category Data
const bookCategoryData = {
    categoryDistribution: {
        labels: ['Fiction', 'Non-Fiction', 'Science', 'History', 'Biography', 'Children'],
        data: [28420, 21500, 12800, 9800, 7500, 6400],
        colors:['#774b30', '#9f5933', '#a9805b', '#cca278','#e1c7ac','#e8dfce']
    },
    monthlyTrend: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        data: [72000, 78000, 82000, 80000, 85000, 86420]
    },
    categoryDetails: [
        { category: 'Fiction', thisMonth: 28420, lastMonth: 26500, growth: 7.2, percentage: 32.9, trend: 'up' },
        { category: 'Non-Fiction', thisMonth: 21500, lastMonth: 19800, growth: 8.6, percentage: 24.9, trend: 'up' },
        { category: 'Science', thisMonth: 12800, lastMonth: 11500, growth: 11.3, percentage: 14.8, trend: 'up' },
        { category: 'History', thisMonth: 9800, lastMonth: 9200, growth: 6.5, percentage: 11.3, trend: 'up' },
        { category: 'Biography', thisMonth: 7500, lastMonth: 7200, growth: 4.2, percentage: 8.7, trend: 'up' },
        { category: 'Children', thisMonth: 6400, lastMonth: 5800, growth: 10.3, percentage: 7.4, trend: 'up' }
    ]
};

// Merge all order data
const allOrderData = { ...orderData };