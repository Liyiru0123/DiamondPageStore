<?php
require_once '../../config/database.php';

header('Content-Type: application/json');

// 假设当前员工属于 Store ID = 1 (实际应从 Session 获取)
$store_id = 1; 

try {
    $db = getDB();
    // 调用存储过程
    $stmt = $db->prepare("CALL sp_staff_get_inventory(?)");
    $stmt->execute([$store_id]);
    $inventory = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $inventory]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>