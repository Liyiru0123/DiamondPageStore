<?php
/**
 * Inventory Management API for Staff
 * Full CRUDS: Create, Read, Update, Delete, Search
 * Access through VIEW for proper access control
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

$method = $_SERVER['REQUEST_METHOD'];

try {
    $db = getDB();

    switch ($method) {
        case 'GET':
            if (isset($_GET['search'])) {
                searchInventory($db, $_GET['store_id'], $_GET['search']);
            } elseif (isset($_GET['batch_id'])) {
                getInventoryBatch($db, $_GET['batch_id']);
            } elseif (isset($_GET['low_stock'])) {
                getLowStockItems($db, $_GET['store_id']);
            } else {
                getInventory($db, $_GET['store_id']);
            }
            break;

        case 'POST':
            addInventoryBatch($db);
            break;

        case 'PUT':
            updateInventoryBatch($db);
            break;

        case 'DELETE':
            deleteInventoryBatch($db);
            break;

        default:
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed"]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
/**
 * Get inventory list using SQL VIEW (Security Requirement)
 */
function getInventory($db, $storeId) {
    if (!$storeId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Store ID required"]);
        return;
    }

    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;

    // --- 修改点：现在直接查询视图 vw_staff_inventory_details ---
    // 移除了所有的 JOIN，逻辑更清晰，符合作业要求
    $query = "SELECT * FROM vw_staff_inventory_details 
              WHERE store_id = :store_id
              ORDER BY received_date DESC
              LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':store_id', $storeId, PDO::PARAM_INT);
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    // 获取总数用于分页
    $countQuery = "SELECT COUNT(*) AS total FROM vw_staff_inventory_details WHERE store_id = :store_id";
    $countStmt = $db->prepare($countQuery);
    $countStmt->bindParam(':store_id', $storeId, PDO::PARAM_INT);
    $countStmt->execute();
    $total = $countStmt->fetch()['total'];

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $stmt->fetchAll(),
        "pagination" => [
            "page" => $page,
            "limit" => $limit,
            "total" => $total,
            "pages" => ceil($total / $limit)
        ]
    ]);
}


/**
 * Search inventory using SQL VIEW
 */
function searchInventory($db, $storeId, $keyword) {
    // ... 验证逻辑不变 ...
    $keyword = "%{$keyword}%";

    // --- 修改点：使用视图进行搜索 ---
    $query = "SELECT * FROM vw_staff_inventory_details
              WHERE store_id = :store_id
                AND (book_name LIKE :keyword_name
                     OR ISBN LIKE :keyword_isbn
                     OR batch_code LIKE :keyword_batch)
              ORDER BY book_name";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':store_id', $storeId, PDO::PARAM_INT);
    $stmt->bindParam(':keyword_name', $keyword);
    $stmt->bindParam(':keyword_isbn', $keyword);
    $stmt->bindParam(':keyword_batch', $keyword);
    $stmt->execute();

    http_response_code(200);
    echo json_encode(["success" => true, "data" => $stmt->fetchAll()]);
}


/**
 * Get single inventory batch
 */
function getInventoryBatch($db, $batchId) {
    $query = "SELECT ib.*, s.unit_price, s.bingding, b.ISBN, b.name AS book_name
              FROM inventory_batches ib
              JOIN skus s ON ib.sku_id = s.sku_id
              JOIN books b ON s.ISBN = b.ISBN
              WHERE ib.batch_id = :batch_id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':batch_id', $batchId, PDO::PARAM_INT);
    $stmt->execute();

    $batch = $stmt->fetch();

    if (!$batch) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Batch not found"]);
        return;
    }

    http_response_code(200);
    echo json_encode(["success" => true, "data" => $batch]);
}

/**
 * Get low stock items using SQL VIEW (Security Requirement)
 * Modified to select from vw_staff_low_stock
 */
function getLowStockItems($db, $storeId) {
    $threshold = isset($_GET['threshold']) ? (int)$_GET['threshold'] : 10;

    // --- REFACTORED: Use VIEW ---
    $query = "SELECT * FROM vw_staff_low_stock
              WHERE store_id = :store_id
              AND total_stock < :threshold
              ORDER BY total_stock ASC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':store_id', $storeId, PDO::PARAM_INT);
    $stmt->bindParam(':threshold', $threshold, PDO::PARAM_INT);
    $stmt->execute();

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $stmt->fetchAll(),
        "threshold" => $threshold
    ]);
}

/**
 * Add new inventory batch (C in CRUDS)
 */
function addInventoryBatch($db) {
    $data = json_decode(file_get_contents("php://input"));

    $required = ['sku_id', 'store_id', 'purchase_id', 'quantity', 'unit_cost', 'batch_code'];
    foreach ($required as $field) {
        if (!isset($data->$field)) {
            http_response_code(400);
            echo json_encode(["success" => false, "message" => "Missing required field: $field"]);
            return;
        }
    }

    $query = "INSERT INTO inventory_batches (sku_id, store_id, purchase_id, quantity, unit_cost, received_date, batch_code)
              VALUES (:sku_id, :store_id, :purchase_id, :quantity, :unit_cost, NOW(), :batch_code)";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':sku_id', $data->sku_id, PDO::PARAM_INT);
    $stmt->bindParam(':store_id', $data->store_id, PDO::PARAM_INT);
    $stmt->bindParam(':purchase_id', $data->purchase_id, PDO::PARAM_INT);
    $stmt->bindParam(':quantity', $data->quantity, PDO::PARAM_INT);
    $stmt->bindParam(':unit_cost', $data->unit_cost);
    $stmt->bindParam(':batch_code', $data->batch_code);
    $stmt->execute();

    http_response_code(201);
    echo json_encode([
        "success" => true,
        "message" => "Inventory batch added",
        "batch_id" => $db->lastInsertId()
    ]);
}

/**
 * Update inventory batch (U in CRUDS)
 */
function updateInventoryBatch($db) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->batch_id)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Batch ID required"]);
        return;
    }

    $updates = [];
    $params = [':batch_id' => $data->batch_id];

    if (isset($data->quantity)) {
        $updates[] = "quantity = :quantity";
        $params[':quantity'] = $data->quantity;
    }
    if (isset($data->unit_cost)) {
        $updates[] = "unit_cost = :unit_cost";
        $params[':unit_cost'] = $data->unit_cost;
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "No fields to update"]);
        return;
    }

    $query = "UPDATE inventory_batches SET " . implode(", ", $updates) . " WHERE batch_id = :batch_id";

    $stmt = $db->prepare($query);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Inventory updated"]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Batch not found"]);
    }
}

/**
 * Delete inventory batch (D in CRUDS)
 */
function deleteInventoryBatch($db) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->batch_id)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Batch ID required"]);
        return;
    }

    $query = "DELETE FROM inventory_batches WHERE batch_id = :batch_id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':batch_id', $data->batch_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Inventory batch deleted"]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Batch not found"]);
    }
}
?>
