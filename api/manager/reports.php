<?php
/**
 * Manager - Reports API
 * 统计报表接口
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

try {
    $conn = getDB();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'overview':
            getOverviewStats($conn);
            break;

        case 'sales_by_store':
            getSalesByStore($conn);
            break;

        case 'sales_by_category':
            getSalesByCategory($conn);
            break;

        case 'payment_analysis':
            getPaymentAnalysis($conn);
            break;

        case 'bestsellers':
            getBestsellers($conn);
            break;

        case 'store_performance':
            getStorePerformance($conn);
            break;

        case 'orders_summary':
            getOrdersSummary($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: overview, sales_by_store, sales_by_category, payment_analysis, bestsellers, store_performance, orders_summary'
            ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * 获取概览统计数据
 */
function getOverviewStats($conn) {
    // 总销售额
    $totalRevenueSql = "SELECT COALESCE(SUM(oi.quantity * s.unit_price), 0) as total_revenue
                        FROM orders o
                        JOIN order_items oi ON o.order_id = oi.order_id
                        JOIN skus s ON oi.sku_id = s.sku_id
                        WHERE o.order_status IN ('paid', 'finished')";
    $totalRevenueStmt = $conn->prepare($totalRevenueSql);
    $totalRevenueStmt->execute();
    $totalRevenue = $totalRevenueStmt->fetch()['total_revenue'];

    // 总订单数
    $totalOrdersSql = "SELECT COUNT(*) as total_orders FROM orders WHERE order_status IN ('paid', 'finished')";
    $totalOrdersStmt = $conn->prepare($totalOrdersSql);
    $totalOrdersStmt->execute();
    $totalOrders = $totalOrdersStmt->fetch()['total_orders'];

    // 总会员数
    $totalMembersSql = "SELECT COUNT(*) as total_members FROM members";
    $totalMembersStmt = $conn->prepare($totalMembersSql);
    $totalMembersStmt->execute();
    $totalMembers = $totalMembersStmt->fetch()['total_members'];

    // 总库存
    $totalStockSql = "SELECT COALESCE(SUM(quantity), 0) as total_stock FROM inventory_batches";
    $totalStockStmt = $conn->prepare($totalStockSql);
    $totalStockStmt->execute();
    $totalStock = $totalStockStmt->fetch()['total_stock'];

    // 店铺数
    $totalStoresSql = "SELECT COUNT(*) as total_stores FROM stores";
    $totalStoresStmt = $conn->prepare($totalStoresSql);
    $totalStoresStmt->execute();
    $totalStores = $totalStoresStmt->fetch()['total_stores'];

    // 员工数
    $totalEmployeesSql = "SELECT COUNT(*) as total_employees FROM employees";
    $totalEmployeesStmt = $conn->prepare($totalEmployeesSql);
    $totalEmployeesStmt->execute();
    $totalEmployees = $totalEmployeesStmt->fetch()['total_employees'];

    echo json_encode([
        'success' => true,
        'message' => 'Overview statistics retrieved successfully',
        'data' => [
            'total_revenue' => floatval($totalRevenue),
            'total_orders' => intval($totalOrders),
            'total_members' => intval($totalMembers),
            'total_stock' => intval($totalStock),
            'total_stores' => intval($totalStores),
            'total_employees' => intval($totalEmployees),
            'avg_order_value' => $totalOrders > 0 ? floatval($totalRevenue) / intval($totalOrders) : 0
        ]
    ]);
}

/**
 * 按店铺销售统计（使用视图）
 */
function getSalesByStore($conn) {
    $sql = "SELECT * FROM vw_manager_sales_by_store ORDER BY total_revenue DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $sales = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Sales by store retrieved successfully',
        'data' => $sales,
        'count' => count($sales)
    ]);
}

/**
 * 按分类销售统计（使用视图）
 */
function getSalesByCategory($conn) {
    $sql = "SELECT * FROM vw_manager_sales_by_category ORDER BY total_sales DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $sales = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Sales by category retrieved successfully',
        'data' => $sales,
        'count' => count($sales)
    ]);
}

/**
 * 支付方式分析（使用视图）
 */
function getPaymentAnalysis($conn) {
    $sql = "SELECT * FROM vw_manager_payment_analysis ORDER BY payment_count DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $analysis = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Payment analysis retrieved successfully',
        'data' => $analysis,
        'count' => count($analysis)
    ]);
}

/**
 * 热销书籍排行（使用视图）
 */
function getBestsellers($conn) {
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;

    $sql = "SELECT * FROM vw_manager_bestsellers LIMIT :limit";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $bestsellers = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Bestsellers retrieved successfully',
        'data' => $bestsellers,
        'count' => count($bestsellers)
    ]);
}

/**
 * 店铺绩效对比（使用视图）
 */
function getStorePerformance($conn) {
    $sql = "SELECT * FROM vw_manager_store_performance ORDER BY revenue DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $performance = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Store performance retrieved successfully',
        'data' => $performance,
        'count' => count($performance)
    ]);
}

/**
 * 订单汇总（使用视图）
 */
function getOrdersSummary($conn) {
    $sql = "SELECT * FROM vw_manager_orders_summary";

    $params = [];

    // 按店铺筛选
    if (isset($_GET['store_id']) && $_GET['store_id'] !== '') {
        $sql .= " WHERE store_id = :store_id";
        $params[':store_id'] = intval($_GET['store_id']);
    }

    // 按状态筛选
    if (isset($_GET['order_status']) && $_GET['order_status'] !== '') {
        if (strpos($sql, 'WHERE') !== false) {
            $sql .= " AND order_status = :order_status";
        } else {
            $sql .= " WHERE order_status = :order_status";
        }
        $params[':order_status'] = $_GET['order_status'];
    }

    // 按日期范围筛选
    if (isset($_GET['date_from']) && $_GET['date_from'] !== '') {
        if (strpos($sql, 'WHERE') !== false) {
            $sql .= " AND order_date >= :date_from";
        } else {
            $sql .= " WHERE order_date >= :date_from";
        }
        $params[':date_from'] = $_GET['date_from'];
    }

    if (isset($_GET['date_to']) && $_GET['date_to'] !== '') {
        if (strpos($sql, 'WHERE') !== false) {
            $sql .= " AND order_date <= :date_to";
        } else {
            $sql .= " WHERE order_date <= :date_to";
        }
        $params[':date_to'] = $_GET['date_to'];
    }

    $sql .= " ORDER BY order_date DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $orders = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Orders summary retrieved successfully',
        'data' => $orders,
        'count' => count($orders)
    ]);
}
?>
