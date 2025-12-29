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
            // 1. 接收基础参数
            $search = isset($_GET['search']) ? $_GET['search'] : null;
            $status = isset($_GET['status']) ? $_GET['status'] : null;
            $orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
            
            // 处理日期参数：如果是空字符串，转为 null，否则 SQL 日期比较会出错
            $start = (isset($_GET['start_date']) && $_GET['start_date'] !== '') ? $_GET['start_date'] : null;
            $end = (isset($_GET['end_date']) && $_GET['end_date'] !== '') ? $_GET['end_date'] : null;

            // 2. 🟢 处理金额参数 (新增核心逻辑)
            // 前端传来的可能是空字符串 ""，必须转为 NULL，否则 SQL 会把它当成 0 处理导致筛选错误
            $minAmount = (isset($_GET['min_amount']) && $_GET['min_amount'] !== '') ? (float)$_GET['min_amount'] : null;
            $maxAmount = (isset($_GET['max_amount']) && $_GET['max_amount'] !== '') ? (float)$_GET['max_amount'] : null;

            // 3. 调用存储过程 (注意这里现在是 7 个参数)
            $stmt = $conn->prepare('CALL sp_finance_invoice_list(:search, :status, :order_id, :start_date, :end_date, :min_amount, :max_amount)');
            
            $stmt->execute([
                ':search'     => $search,
                ':status'     => $status,
                ':order_id'   => $orderId,
                ':start_date' => $start,
                ':end_date'   => $end,
                ':min_amount' => $minAmount, // 传入最小金额
                ':max_amount' => $maxAmount  // 传入最大金额
            ]);
            
            $rows = $stmt->fetchAll();

            // 4. 组装返回数据
            $data = [];
            foreach ($rows as $row) {
                $data[] = [
                    'invoiceId'     => (int)$row['invoice_id'],
                    'invoiceNumber' => $row['invoice_number'],
                    'orderId'       => (int)$row['order_id'],
                    'storeName'     => $row['store_name'],
                    'memberId'      => (int)$row['member_id'],
                    'memberName'    => $row['member_name'],
                    // 状态显示逻辑：优先用 invoice_status (前端展示用)
                    'status'        => $row['invoice_status'], 
                    'issueDate'     => $row['issue_date'],
                    'dueDate'       => $row['due_date'],
                    'invoiceAmount' => (float)$row['invoice_amount'],
                    'paidAmount'    => (float)$row['paid_amount'],
                    'balanceAmount' => (float)$row['outstanding_amount'],
                    'lastPaidAt'    => $row['last_paid_at']
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
        
        case 'void':
            // 1. 获取参数
            $payload = json_decode(file_get_contents('php://input'), true);
            $invoiceId = isset($payload['invoice_id']) ? (int)$payload['invoice_id'] : 0;

            if ($invoiceId === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Invoice ID is required']);
                exit();
            }

            // 2. 检查发票当前状态 (防止把已付的作废了)
            $checkStmt = $conn->prepare("SELECT invoice_status FROM invoices WHERE invoice_id = :id");
            $checkStmt->execute([':id' => $invoiceId]);
            $currentStatus = $checkStmt->fetchColumn();

            if (!$currentStatus) {
                echo json_encode(['success' => false, 'message' => 'Invoice not found']);
                exit();
            }

            if (strtoupper($currentStatus) === 'PAID'||strtoupper($currentStatus) === 'VOIDED'||strtoupper($currentStatus) === 'PARTLY_PAID') {
                echo json_encode(['success' => false, 'message' => 'Cannot void a PAID invoice']);
                exit();
            }

            // 3. 执行逻辑作废 (Update Status to VOIDED)
            // 注意：这里我们直接用 SQL 更新，确保状态变为 VOIDED
            $updateStmt = $conn->prepare("UPDATE invoices SET invoice_status = 'VOIDED', update_date = NOW() WHERE invoice_id = :id");
            $success = $updateStmt->execute([':id' => $invoiceId]);

            if ($success) {
                echo json_encode(['success' => true, 'message' => 'Invoice has been voided successfully']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Database update failed']);
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
