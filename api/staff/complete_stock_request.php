<?php
// api/staff/complete_stock_request.php
header('Content-Type: application/json');
require_once '../../config/database.php';

session_start();

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['request_id'])) {
    echo json_encode(['success' => false, 'message' => 'Request ID is required']);
    exit;
}

try {
    if (!isset($pdo)) {
        $database = new DatabaseLocal();
        $pdo = $database->getConnection();
    }

    $stmt = $pdo->prepare("CALL sp_staff_complete_replenishment_request(?)");
    $stmt->execute([$data['request_id']]);

    echo json_encode(['success' => true, 'message' => 'Stock request marked as completed']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>
