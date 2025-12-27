<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
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
            $search = isset($_GET['search']) ? $_GET['search'] : null;
            $status = isset($_GET['status']) ? $_GET['status'] : null;
            $storeId = isset($_GET['store_id']) ? (int)$_GET['store_id'] : 0;
            $start = isset($_GET['start_date']) ? $_GET['start_date'] : null;
            $end = isset($_GET['end_date']) ? $_GET['end_date'] : null;

            $stmt = $conn->prepare('CALL sp_finance_order_list(:search, :status, :store_id, :start_date, :end_date)');
            $stmt->execute([
                ':search' => $search,
                ':status' => $status,
                ':store_id' => $storeId,
                ':start_date' => $start,
                ':end_date' => $end
            ]);
            $rows = $stmt->fetchAll();

            $data = [];
            foreach ($rows as $row) {
                $data[] = [
                    'orderId' => (int)$row['order_id'],
                    'storeId' => (int)$row['store_id'],
                    'storeName' => $row['store_name'],
                    'memberId' => (int)$row['member_id'],
                    'memberName' => $row['member_name'],
                    'orderStatus' => $row['order_status'],
                    'orderDate' => $row['order_date'],
                    'note' => $row['note'],
                    'payableAmount' => (float)$row['payable_amount'],
                    'paidAmount' => (float)$row['paid_amount'],
                    'itemCount' => (int)$row['item_count'],
                    'totalQuantity' => (int)$row['total_quantity']
                ];
            }

            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'detail':
            $orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
            if ($orderId === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'order_id is required']);
                exit();
            }

            $stmt = $conn->prepare('CALL sp_finance_order_detail(:order_id)');
            $stmt->execute([':order_id' => $orderId]);

            $order = $stmt->fetch();
            $stmt->nextRowset();
            $items = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => ['order' => $order, 'items' => $items]]);
            break;

        case 'create_invoice':
            $payload = json_decode(file_get_contents('php://input'), true);
            $orderId = isset($payload['order_id']) ? (int)$payload['order_id'] : 0;

            if ($orderId === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'order_id is required']);
                exit();
            }

            $stmt = $conn->prepare('CALL sp_finance_create_invoice(:order_id, @invoice_id, @code, @msg)');
            $stmt->execute([':order_id' => $orderId]);
            $stmt->closeCursor();

            $row = $conn->query('SELECT @invoice_id AS invoice_id, @code AS code, @msg AS message')->fetch();

            if ((int)$row['code'] === 1) {
                echo json_encode(['success' => true, 'data' => ['invoiceId' => (int)$row['invoice_id']], 'message' => $row['message']]);
            } else {
                echo json_encode(['success' => false, 'message' => $row['message']]);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
