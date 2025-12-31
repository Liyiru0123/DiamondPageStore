<?php
require_once '../../config/database.php';
header('Content-Type: application/json');

$store_id = isset($_GET['store_id']) ? intval($_GET['store_id']) : 0;
$search = isset($_GET['search']) ? $_GET['search'] : '';
$status = isset($_GET['status']) ? $_GET['status'] : '';
$date_from = (isset($_GET['date_from']) && !empty($_GET['date_from'])) ? $_GET['date_from'] : null;
$date_to = (isset($_GET['date_to']) && !empty($_GET['date_to'])) ? $_GET['date_to'] : null;

if (!$store_id) {
    echo json_encode(['success' => false, 'message' => 'Store ID is required']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("CALL sp_staff_get_orders(?, ?, ?, ?, ?)");
    $stmt->execute([$store_id, $search, $status, $date_from, $date_to]);
    $orders = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $orders]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
