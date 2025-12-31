<?php
// api/staff/update_inventory.php
header('Content-Type: application/json');
require_once '../../config/database.php';
session_start();

try {
    if (!isset($pdo)) {
        $database = new DatabaseLocal();
        $pdo = $database->getConnection();
    }

    // 获取POST数据
    $input = json_decode(file_get_contents('php://input'), true);
    
    $sku_id = isset($input['sku_id']) ? intval($input['sku_id']) : 0;
    $store_id = isset($input['store_id']) ? intval($input['store_id']) : 0;
    $quantity = isset($input['quantity']) ? intval($input['quantity']) : 0;
    $batch_code = isset($input['batch_code']) ? trim($input['batch_code']) : '';

    // 验证必需参数
    if ($sku_id <= 0 || $store_id <= 0 || $quantity < 0) {
        echo json_encode(['success' => false, 'message' => 'Invalid parameters']);
        exit;
    }

    // 调用存储过程更新库存
    $stmt = $pdo->prepare("CALL sp_staff_update_inventory(?, ?, ?, ?)");
    $stmt->execute([$sku_id, $store_id, $quantity, $batch_code]);

    echo json_encode(['success' => true, 'message' => 'Inventory updated successfully']);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
