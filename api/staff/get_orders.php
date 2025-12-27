<?php
require_once '../../config/database.php';
header('Content-Type: application/json');

$store_id = 1; // 同样假设 Store ID = 1

try {
    $db = getDB();
    $stmt = $db->prepare("CALL sp_staff_get_orders(?)");
    $stmt->execute([$store_id]);
    $orders = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $orders]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>