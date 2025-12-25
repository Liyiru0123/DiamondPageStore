<?php
/**
 * Order Processing API for Staff
 * CRUDS: Read (list orders), Update (change status), Search
 */

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, PUT");
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
                searchOrders($db, $_GET['store_id'], $_GET['search']);
            } elseif (isset($_GET['order_id'])) {
                getOrderDetail($db, $_GET['order_id']);
            } else {
                getOrders($db, $_GET['store_id']);
            }
            break;

        case 'PUT':
            updateOrderStatus($db);
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
 * Get orders for a store (R in CRUDS)
 */
function getOrders($db, $storeId) {
    if (!$storeId) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Store ID required"]);
        return;
    }

    $status = isset($_GET['status']) ? $_GET['status'] : null;
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
    $offset = ($page - 1) * $limit;

    $query = "SELECT o.order_id, o.order_status, o.order_date, o.note,
                     m.first_name, m.last_name, m.phone AS member_phone,
                     COUNT(oi.sku_id) AS item_count,
                     SUM(oi.quantity * s.unit_price) AS total_amount
              FROM orders o
              JOIN members m ON o.member_id = m.member_id
              LEFT JOIN order_items oi ON o.order_id = oi.order_id
              LEFT JOIN skus s ON oi.sku_id = s.sku_id
              WHERE o.store_id = :store_id";

    if ($status) {
        $query .= " AND o.order_status = :status";
    }

    $query .= " GROUP BY o.order_id, o.order_status, o.order_date, o.note,
                         m.first_name, m.last_name, m.phone
                ORDER BY o.order_date DESC
                LIMIT :limit OFFSET :offset";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':store_id', $storeId, PDO::PARAM_INT);
    if ($status) {
        $stmt->bindParam(':status', $status);
    }
    $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindParam(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $stmt->fetchAll()
    ]);
}

/**
 * Get order detail
 */
function getOrderDetail($db, $orderId) {
    $query = "SELECT o.*, m.first_name, m.last_name, m.phone, m.address,
                     s.name AS store_name
              FROM orders o
              JOIN members m ON o.member_id = m.member_id
              JOIN stores s ON o.store_id = s.store_id
              WHERE o.order_id = :order_id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $stmt->execute();

    $order = $stmt->fetch();

    if (!$order) {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Order not found"]);
        return;
    }

    // Get order items
    $itemQuery = "SELECT oi.quantity, s.unit_price, s.bingding,
                         b.ISBN, b.name AS book_name,
                         (oi.quantity * s.unit_price) AS subtotal
                  FROM order_items oi
                  JOIN skus s ON oi.sku_id = s.sku_id
                  JOIN books b ON s.ISBN = b.ISBN
                  WHERE oi.order_id = :order_id";

    $itemStmt = $db->prepare($itemQuery);
    $itemStmt->bindParam(':order_id', $orderId, PDO::PARAM_INT);
    $itemStmt->execute();

    $order['items'] = $itemStmt->fetchAll();
    $order['total_amount'] = array_sum(array_column($order['items'], 'subtotal'));

    http_response_code(200);
    echo json_encode(["success" => true, "data" => $order]);
}

/**
 * Search orders (S in CRUDS)
 */
function searchOrders($db, $storeId, $keyword) {
    $keyword = "%{$keyword}%";

    $query = "SELECT o.order_id, o.order_status, o.order_date,
                     m.first_name, m.last_name,
                     SUM(oi.quantity * s.unit_price) AS total_amount
              FROM orders o
              JOIN members m ON o.member_id = m.member_id
              LEFT JOIN order_items oi ON o.order_id = oi.order_id
              LEFT JOIN skus s ON oi.sku_id = s.sku_id
              WHERE o.store_id = :store_id
                AND (o.order_id LIKE :keyword
                     OR CONCAT(m.first_name, ' ', m.last_name) LIKE :keyword)
              GROUP BY o.order_id, o.order_status, o.order_date, m.first_name, m.last_name
              ORDER BY o.order_date DESC";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':store_id', $storeId, PDO::PARAM_INT);
    $stmt->bindParam(':keyword', $keyword);
    $stmt->execute();

    http_response_code(200);
    echo json_encode([
        "success" => true,
        "data" => $stmt->fetchAll()
    ]);
}

/**
 * Update order status (U in CRUDS)
 */
function updateOrderStatus($db) {
    $data = json_decode(file_get_contents("php://input"));

    if (!isset($data->order_id) || !isset($data->order_status)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Order ID and status required"]);
        return;
    }

    $validStatuses = ['created', 'paid', 'cancelled', 'refunded'];
    if (!in_array($data->order_status, $validStatuses)) {
        http_response_code(400);
        echo json_encode(["success" => false, "message" => "Invalid status"]);
        return;
    }

    $query = "UPDATE orders SET order_status = :status, note = :note WHERE order_id = :order_id";

    $stmt = $db->prepare($query);
    $stmt->bindParam(':status', $data->order_status);
    $note = isset($data->note) ? $data->note : null;
    $stmt->bindParam(':note', $note);
    $stmt->bindParam(':order_id', $data->order_id, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        http_response_code(200);
        echo json_encode(["success" => true, "message" => "Order status updated"]);
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "message" => "Order not found"]);
    }
}
?>
