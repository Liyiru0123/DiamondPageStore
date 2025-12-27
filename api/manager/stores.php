<?php
/**
 * Manager - Stores API
 * 店铺管理接口
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
        case 'list':
            listStores($conn);
            break;

        case 'detail':
            getStoreDetail($conn);
            break;

        case 'stats':
            getStoreStats($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, stats'
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
 * 获取所有店铺列表
 */
function listStores($conn) {
    $sql = "SELECT * FROM stores ORDER BY store_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $stores = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Stores retrieved successfully',
        'data' => $stores,
        'count' => count($stores)
    ]);
}

/**
 * 获取店铺详情
 */
function getStoreDetail($conn) {
    if (!isset($_GET['store_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'store_id is required'
        ]);
        return;
    }

    $storeId = intval($_GET['store_id']);

    $sql = "SELECT * FROM stores WHERE store_id = :store_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':store_id', $storeId, PDO::PARAM_INT);
    $stmt->execute();
    $store = $stmt->fetch();

    if (!$store) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Store not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Store detail retrieved successfully',
        'data' => $store
    ]);
}

/**
 * 获取店铺统计数据（来自vw_manager_store_performance视图）
 */
function getStoreStats($conn) {
    $sql = "SELECT * FROM vw_manager_store_performance ORDER BY total_revenue DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $stats = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Store statistics retrieved successfully',
        'data' => $stats,
        'count' => count($stats)
    ]);
}
?>
