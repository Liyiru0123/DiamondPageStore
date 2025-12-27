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
        case 'overview':
            $stmt = $conn->prepare('CALL sp_finance_overview(@cur, @last, @growth, @orders)');
            $stmt->execute();
            $stmt->closeCursor();

            $row = $conn->query('SELECT @cur AS current_month, @last AS last_month, @growth AS growth_percent, @orders AS total_orders')->fetch();

            echo json_encode([
                'success' => true,
                'data' => [
                    'currentMonth' => (float)$row['current_month'],
                    'lastMonth' => (float)$row['last_month'],
                    'growthPercent' => $row['growth_percent'] === null ? null : (float)$row['growth_percent'],
                    'totalOrders' => (int)$row['total_orders']
                ]
            ]);
            break;

        case 'payment_methods':
            $start = isset($_GET['start_date']) ? $_GET['start_date'] : null;
            $end = isset($_GET['end_date']) ? $_GET['end_date'] : null;

            $stmt = $conn->prepare('CALL sp_finance_payment_method_summary(:start_date, :end_date)');
            $stmt->execute([':start_date' => $start, ':end_date' => $end]);
            $rows = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $rows]);
            break;

        case 'revenue_by_date':
            $start = isset($_GET['start_date']) ? $_GET['start_date'] : null;
            $end = isset($_GET['end_date']) ? $_GET['end_date'] : null;

            $stmt = $conn->prepare('CALL sp_finance_revenue_by_date(:start_date, :end_date)');
            $stmt->execute([':start_date' => $start, ':end_date' => $end]);
            $rows = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $rows]);
            break;

        case 'purchase_cost_by_date':
            $start = isset($_GET['start_date']) ? $_GET['start_date'] : null;
            $end = isset($_GET['end_date']) ? $_GET['end_date'] : null;

            $stmt = $conn->prepare('CALL sp_finance_purchase_cost_by_date(:start_date, :end_date)');
            $stmt->execute([':start_date' => $start, ':end_date' => $end]);
            $rows = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => $rows]);
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
