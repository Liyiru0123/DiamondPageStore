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
            $orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
            $start = isset($_GET['start_date']) ? $_GET['start_date'] : null;
            $end = isset($_GET['end_date']) ? $_GET['end_date'] : null;

            $stmt = $conn->prepare('CALL sp_finance_invoice_list(:search, :status, :order_id, :start_date, :end_date)');
            $stmt->execute([
                ':search' => $search,
                ':status' => $status,
                ':order_id' => $orderId,
                ':start_date' => $start,
                ':end_date' => $end
            ]);
            $rows = $stmt->fetchAll();

            $data = [];
            foreach ($rows as $row) {
                $data[] = [
                    'invoiceId' => (int)$row['invoice_id'],
                    'invoiceNumber' => $row['invoice_number'],
                    'orderId' => (int)$row['order_id'],
                    'storeName' => $row['store_name'],
                    'memberId' => (int)$row['member_id'],
                    'memberName' => $row['member_name'],
                    'status' => $row['display_status'],
                    'issueDate' => $row['issue_date'],
                    'dueDate' => $row['due_date'],
                    'invoiceAmount' => (float)$row['invoice_amount'],
                    'paidAmount' => (float)$row['paid_amount'],
                    'balanceAmount' => (float)$row['outstanding_amount'],
                    'lastPaidAt' => $row['last_paid_at']
                ];
            }

            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'detail':
            $invoiceId = isset($_GET['invoice_id']) ? (int)$_GET['invoice_id'] : 0;
            if ($invoiceId === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'invoice_id is required']);
                exit();
            }

            $stmt = $conn->prepare('CALL sp_finance_invoice_detail(:invoice_id)');
            $stmt->execute([':invoice_id' => $invoiceId]);

            $invoice = $stmt->fetch();
            $stmt->nextRowset();
            $payments = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => ['invoice' => $invoice, 'payments' => $payments]]);
            break;

        case 'receive_payment':
            $payload = json_decode(file_get_contents('php://input'), true);
            $invoiceId = isset($payload['invoice_id']) ? (int)$payload['invoice_id'] : 0;
            $amount = isset($payload['amount']) ? (float)$payload['amount'] : 0;
            $method = isset($payload['payment_method']) ? $payload['payment_method'] : 'Cash';

            if ($invoiceId === 0 || $amount <= 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'invoice_id and amount are required']);
                exit();
            }

            $stmt = $conn->prepare('CALL sp_finance_receive_payment(:invoice_id, :amount, :method, @code, @msg)');
            $stmt->execute([':invoice_id' => $invoiceId, ':amount' => $amount, ':method' => $method]);
            $stmt->closeCursor();

            $row = $conn->query('SELECT @code AS code, @msg AS message')->fetch();

            if ((int)$row['code'] === 1) {
                echo json_encode(['success' => true, 'message' => $row['message']]);
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
