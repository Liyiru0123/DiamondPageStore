<?php
/**
 * Manager - Purchases API
 * 采购管理接口
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
            listPurchases($conn);
            break;

        case 'detail':
            getPurchaseDetail($conn);
            break;

        case 'create':
            createPurchase($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, create'
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
 * 获取采购单列表（使用视图）
 */
function listPurchases($conn) {
    $sql = "SELECT * FROM vw_manager_purchases";

    $params = [];

    // 按供应商筛选
    if (isset($_GET['supplier_id']) && $_GET['supplier_id'] !== '') {
        $sql .= " WHERE supplier_id = :supplier_id";
        $params[':supplier_id'] = intval($_GET['supplier_id']);
    }

    $sql .= " ORDER BY purchase_date DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $purchases = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Purchases retrieved successfully',
        'data' => $purchases,
        'count' => count($purchases)
    ]);
}

/**
 * 获取采购单详情
 */
function getPurchaseDetail($conn) {
    if (!isset($_GET['purchase_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'purchase_id is required'
        ]);
        return;
    }

    $purchaseId = intval($_GET['purchase_id']);

    $sql = "SELECT * FROM vw_manager_purchases WHERE purchase_id = :purchase_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':purchase_id', $purchaseId, PDO::PARAM_INT);
    $stmt->execute();
    $purchase = $stmt->fetch();

    if (!$purchase) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Purchase not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Purchase detail retrieved successfully',
        'data' => $purchase
    ]);
}

/**
 * 创建采购单（调用存储过程）
 */
function createPurchase($conn) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON: ' . json_last_error_msg()
        ]);
        return;
    }

    if (!$data || !isset($data['store_id']) || !isset($data['supplier_id']) || !isset($data['purchase_detail']) ||
        !is_array($data['purchase_detail']) || empty($data['purchase_detail'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: store_id, supplier_id, purchase_detail (array)'
        ]);
        return;
    }

    $note = isset($data['note']) ? $data['note'] : null;

    // 转换为JSON
    $purchaseDetailJson = json_encode($data['purchase_detail']);

    $sql = "CALL sp_manager_create_purchase(
        :store_id, :supplier_id, :purchase_detail, :note,
        @result_code, @result_message, @purchase_id
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':store_id', $data['store_id'], PDO::PARAM_INT);
    $stmt->bindParam(':supplier_id', $data['supplier_id'], PDO::PARAM_INT);
    $stmt->bindParam(':purchase_detail', $purchaseDetailJson, PDO::PARAM_STR);
    $stmt->bindParam(':note', $note, PDO::PARAM_STR);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message, @purchase_id as purchase_id")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'data' => ['purchase_id' => $result['purchase_id']]
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ]);
    }
}
?>
