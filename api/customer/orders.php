<?php
/**
 * Customer Orders API
 * 处理订单相关的请求：创建、支付、取消、获取列表
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'list':
            getOrders($conn);
            break;

        case 'detail':
            getOrderDetail($conn);
            break;

        case 'create':
            createOrder($conn);
            break;

        case 'pay':
            payOrder($conn);
            break;

        case 'pay_multiple':
            payMultipleOrders($conn);
            break;

        case 'cancel':
            cancelOrder($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

/**
 * 获取用户订单列表
 */
function getOrders($conn) {
    $memberId = isset($_GET['member_id']) ? intval($_GET['member_id']) : 0;
    $status = isset($_GET['status']) ? $_GET['status'] : 'all';

    if ($memberId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID is required']);
        return;
    }

    // 1. 自动超时逻辑：检查并取消超过15分钟(900秒)未支付的订单
    try {
        $timeoutSql = "UPDATE orders SET order_status = 'cancelled' 
                       WHERE order_status = 'created' 
                       AND TIMESTAMPDIFF(SECOND, order_date, NOW()) > 900";
        $conn->prepare($timeoutSql)->execute();
    } catch (Exception $e) {
        // 静默处理更新错误
    }

    // 2. 核心查询逻辑
    // 子查询：通过 order_items -> skus -> books 路径聚合书籍名称(b.name)和数量
    // 倒计时：在数据库层面用 900秒 减去 已过去秒数，确保无时区偏差
    $sql = "SELECT v.*, 
            (SELECT GROUP_CONCAT(CONCAT(b.name, ' (x', oi.quantity, ')') SEPARATOR '; ') 
             FROM order_items oi 
             JOIN skus s ON oi.sku_id = s.sku_id
             JOIN books b ON s.isbn = b.isbn 
             WHERE oi.order_id = v.order_id) as items_summary,
            (900 - TIMESTAMPDIFF(SECOND, v.order_date, NOW())) as seconds_left
            FROM vw_customer_orders v 
            WHERE v.member_id = :member_id";

    $params = [':member_id' => $memberId];

    // 如果前端传了特定状态（如 finished, refunded, cancelled 等）
    if ($status !== 'all') {
        $sql .= " AND v.order_status = :status";
        $params[':status'] = $status;
    }

    $sql .= " ORDER BY v.order_date DESC";

    try {
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);

        $orders = [];
        while ($row = $stmt->fetch()) {
            $orders[] = [
                'orderId' => $row['order_id'],
                'storeId' => $row['store_id'],
                'storeName' => $row['store_name'],
                'status' => $row['order_status'],
                'date' => $row['order_date'],
                'note' => $row['note'],
                'total' => (float)$row['total_price'],
                'totalItems' => (int)$row['total_items'],
                'summary' => $row['items_summary'] ?: 'No details available', // 这里就是书名预览
                'remainingSeconds' => (int)$row['seconds_left'] > 0 ? (int)$row['seconds_left'] : 0
            ];
        }

        echo json_encode([
            'success' => true, 
            'data' => $orders, 
            'count' => count($orders),
            'server_time' => date('Y-m-d H:i:s') // 方便调试
        ]);

    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false, 
            'message' => 'Database Query Error: ' . $e->getMessage()
        ]);
    }
}
/**
 * 获取订单详情（包含订单项）
 */
function getOrderDetail($conn) {
    $orderId = isset($_GET['order_id']) ? intval($_GET['order_id']) : 0;

    if ($orderId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID is required']);
        return;
    }

    // 获取订单信息
    $stmt = $conn->prepare("SELECT * FROM vw_customer_orders WHERE order_id = :order_id");
    $stmt->execute([':order_id' => $orderId]);
    $order = $stmt->fetch();

    if (!$order) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        return;
    }

    // 获取订单项
    $stmt = $conn->prepare("SELECT * FROM vw_customer_order_items WHERE order_id = :order_id");
    $stmt->execute([':order_id' => $orderId]);

    $items = [];
    while ($row = $stmt->fetch()) {
        $items[] = [
            'skuId' => $row['sku_id'],
            'isbn' => $row['ISBN'],
            'title' => $row['book_title'],
            'author' => $row['author'],
            'publisher' => $row['publisher'],
            'language' => $row['language'],
            'price' => (float)$row['price'],
            'binding' => $row['binding'],
            'quantity' => (int)$row['quantity'],
            'subtotal' => (float)$row['subtotal']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'order' => [
                'orderId' => $order['order_id'],
                'storeId' => $order['store_id'],
                'storeName' => $order['store_name'],
                'status' => $order['order_status'],
                'date' => $order['order_date'],
                'note' => $order['note'],
                'total' => (float)$order['total_price']
            ],
            'items' => $items
        ]
    ]);
}

/**
 * 创建订单（调用存储过程）
 */
function createOrder($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $memberId = isset($data['member_id']) ? intval($data['member_id']) : 0;
    $storeId = isset($data['store_id']) ? intval($data['store_id']) : 0;
    $cartItems = isset($data['cart_items']) ? $data['cart_items'] : [];
    $note = isset($data['note']) ? $data['note'] : '';

    if ($memberId === 0 || $storeId === 0 || empty($cartItems)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID, store ID and cart items are required']);
        return;
    }

    // 将购物车项转换为JSON格式
    $cartJson = json_encode($cartItems);

    // 调用存储过程
    $stmt = $conn->prepare("CALL sp_customer_create_order(:member_id, :store_id, :cart_items, :note, @order_id, @result_code, @result_message)");
    $stmt->execute([
        ':member_id' => $memberId,
        ':store_id' => $storeId,
        ':cart_items' => $cartJson,
        ':note' => $note
    ]);
    $stmt = null;

    // 获取结果
    $result = $conn->query("SELECT @order_id AS order_id, @result_code AS code, @result_message AS message");
    $row = $result->fetch();

    if ($row['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $row['message'],
            'order_id' => $row['order_id']
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => $row['message']
        ]);
    }
}

/**
 * 支付订单（调用存储过程）
 */
function payOrder($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $orderId = isset($data['order_id']) ? intval($data['order_id']) : 0;
    $paymentMethod = isset($data['payment_method']) ? $data['payment_method'] : 'Credit Card';

    if ($orderId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID is required']);
        return;
    }

    // 调用存储过程
    $stmt = $conn->prepare("CALL sp_customer_pay_order(:order_id, :payment_method, @result_code, @result_message)");
    $stmt->execute([
        ':order_id' => $orderId,
        ':payment_method' => $paymentMethod
    ]);
    $stmt = null;

    // 获取结果
    $result = $conn->query("SELECT @result_code AS code, @result_message AS message");
    $row = $result->fetch();

    if ($row['code'] == 1) {
        echo json_encode(['success' => true, 'message' => $row['message']]);
    } else {
        echo json_encode(['success' => false, 'message' => $row['message']]);
    }
}

/**
 * 合并支付多个订单（调用存储过程）
 */
function payMultipleOrders($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $orderIds = isset($data['order_ids']) ? $data['order_ids'] : [];
    $paymentMethod = isset($data['payment_method']) ? $data['payment_method'] : 'Credit Card';

    if (empty($orderIds)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order IDs are required']);
        return;
    }

    // 将订单ID数组转换为JSON
    $orderIdsJson = json_encode($orderIds);

    // 调用存储过程
    $stmt = $conn->prepare("CALL sp_customer_pay_orders(:order_ids, :payment_method, @result_code, @result_message)");
    $stmt->execute([
        ':order_ids' => $orderIdsJson,
        ':payment_method' => $paymentMethod
    ]);
    $stmt = null;

    // 获取结果
    $result = $conn->query("SELECT @result_code AS code, @result_message AS message");
    $row = $result->fetch();

    if ($row['code'] == 1) {
        echo json_encode(['success' => true, 'message' => $row['message']]);
    } else {
        echo json_encode(['success' => false, 'message' => $row['message']]);
    }
}

/**
 * 取消订单（调用存储过程）
 */
function cancelOrder($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $orderId = isset($data['order_id']) ? intval($data['order_id']) : 0;
    $reason = isset($data['reason']) ? $data['reason'] : 'User cancelled';

    if ($orderId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Order ID is required']);
        return;
    }

    // 调用存储过程
    $stmt = $conn->prepare("CALL sp_customer_cancel_order(:order_id, :reason, @result_code, @result_message)");
    $stmt->execute([
        ':order_id' => $orderId,
        ':reason' => $reason
    ]);
    $stmt = null;

    // 获取结果
    $result = $conn->query("SELECT @result_code AS code, @result_message AS message");
    $row = $result->fetch();

    if ($row['code'] == 1) {
        echo json_encode(['success' => true, 'message' => $row['message']]);
    } else {
        echo json_encode(['success' => false, 'message' => $row['message']]);
    }
}
?>
