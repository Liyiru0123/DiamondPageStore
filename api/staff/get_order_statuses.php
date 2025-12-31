<?php
require_once '../../config/database.php';
header('Content-Type: application/json');

try {
    $db = getDB();
    $stmt = $db->query("SELECT status_name FROM vw_staff_order_status_list");
    $statuses = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo json_encode(['success' => true, 'data' => $statuses]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
