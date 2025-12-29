<?php
/**
 * Manager - Inventory API
 * 库存管理接口
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
            getInventoryOverview($conn);
            break;

        case 'by_store':
            getInventoryByStore($conn);
            break;

        case 'by_sku':
            getInventoryBySKU($conn);
            break;

        case 'search_by_store':
            searchInventoryByStore($conn);
            break;

        case 'search_by_sku':
            searchInventoryBySKU($conn);
            break;

        case 'transfer':
            transferInventory($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: overview, by_store, by_sku, search_by_store, search_by_sku, transfer'
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
 * 获取库存总览（使用视图）
 */
function getInventoryOverview($conn) {
    $sql = "SELECT * FROM vw_manager_inventory_overview ORDER BY total_stock DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $inventory = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Inventory overview retrieved successfully',
        'data' => $inventory,
        'count' => count($inventory)
    ]);
}

/**
 * 按店铺获取库存（使用视图）
 */
function getInventoryByStore($conn) {
    $sql = "SELECT * FROM vw_manager_inventory_by_store";

    $params = [];
    if (isset($_GET['store_id']) && $_GET['store_id'] !== '') {
        $sql .= " WHERE store_id = :store_id";
        $params[':store_id'] = intval($_GET['store_id']);
    }

    $sql .= " ORDER BY store_id, book_name";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $inventory = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Inventory by store retrieved successfully',
        'data' => $inventory,
        'count' => count($inventory)
    ]);
}

/**
 * 按SKU获取库存分布（使用视图）
 */
function getInventoryBySKU($conn) {
    $sql = "SELECT * FROM vw_manager_inventory_by_sku";

    $params = [];
    if (isset($_GET['sku_id']) && $_GET['sku_id'] !== '') {
        $sql .= " WHERE sku_id = :sku_id";
        $params[':sku_id'] = intval($_GET['sku_id']);
    }

    $sql .= " ORDER BY sku_id, store_id";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $inventory = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Inventory by SKU retrieved successfully',
        'data' => $inventory,
        'count' => count($inventory)
    ]);
}

/**
 * Search inventory by store
 */
function searchInventoryByStore($conn) {
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

    if ($keyword === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'keyword is required'
        ]);
        return;
    }

    $params = [];
    $sql = "SELECT v.*,
                MATCH(b.name, b.publisher, b.introduction, b.language) AGAINST (:kw1 IN NATURAL LANGUAGE MODE) AS relevance_score
            FROM vw_manager_inventory_by_store v
            JOIN books b ON v.ISBN = b.ISBN
            WHERE (
                MATCH(b.name, b.publisher, b.introduction, b.language) AGAINST (:kw2 IN NATURAL LANGUAGE MODE)
                OR v.ISBN LIKE :kw_like1
                OR v.sku_id LIKE :kw_like2
            )";

    if (isset($_GET['store_id']) && $_GET['store_id'] !== '') {
        $sql .= " AND v.store_id = :store_id";
        $params[':store_id'] = intval($_GET['store_id']);
    }

    $sql .= " ORDER BY relevance_score DESC, v.store_id, v.total_quantity DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':kw1', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw2', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like1', "%$keyword%", PDO::PARAM_STR);
    $stmt->bindValue(':kw_like2', "%$keyword%", PDO::PARAM_STR);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();
    $inventory = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Inventory search completed successfully',
        'data' => $inventory,
        'count' => count($inventory)
    ]);
}

/**
 * Search inventory by SKU
 */
function searchInventoryBySKU($conn) {
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

    if ($keyword === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'keyword is required'
        ]);
        return;
    }

    $sql = "SELECT v.*,
                MATCH(b.name, b.publisher, b.introduction, b.language) AGAINST (:kw1 IN NATURAL LANGUAGE MODE) AS relevance_score
            FROM vw_manager_inventory_by_sku v
            JOIN books b ON v.ISBN = b.ISBN
            WHERE (
                MATCH(b.name, b.publisher, b.introduction, b.language) AGAINST (:kw2 IN NATURAL LANGUAGE MODE)
                OR v.ISBN LIKE :kw_like1
                OR v.sku_id LIKE :kw_like2
            )
            ORDER BY relevance_score DESC, v.sku_id, v.store_stock DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':kw1', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw2', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like1', "%$keyword%", PDO::PARAM_STR);
    $stmt->bindValue(':kw_like2', "%$keyword%", PDO::PARAM_STR);
    $stmt->execute();
    $inventory = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Inventory search completed successfully',
        'data' => $inventory,
        'count' => count($inventory)
    ]);
}

/**
 * 库存调拨（调用存储过程）
 */
function transferInventory($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['from_store_id']) || !isset($data['to_store_id']) ||
        !isset($data['sku_id']) || !isset($data['quantity'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: from_store_id, to_store_id, sku_id, quantity'
        ]);
        return;
    }

    $sql = "CALL sp_manager_transfer_inventory(
        :from_store_id, :to_store_id, :sku_id, :quantity,
        @result_code, @result_message
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':from_store_id', $data['from_store_id'], PDO::PARAM_INT);
    $stmt->bindParam(':to_store_id', $data['to_store_id'], PDO::PARAM_INT);
    $stmt->bindParam(':sku_id', $data['sku_id'], PDO::PARAM_INT);
    $stmt->bindParam(':quantity', $data['quantity'], PDO::PARAM_INT);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message']
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
