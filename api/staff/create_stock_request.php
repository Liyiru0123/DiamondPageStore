<?php
// api/staff/create_stock_request.php
header('Content-Type: application/json');
require_once '../../config/database.php';

session_start();

// 获取 POST JSON 数据
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['items']) || empty($data['items'])) {
    echo json_encode(['success' => false, 'message' => 'No items provided']);
    exit;
}

// 获取当前员工信息 (从 Session 或数据库)
$user_id = $_SESSION['user_id'] ?? 79; // 默认 79 仅供测试

try {
    // 获取 $pdo
    if (!isset($pdo)) {
        $database = new DatabaseLocal();
        $pdo = $database->getConnection();
    }

    // 获取员工详情
    $stmt = $pdo->prepare("SELECT employee_id, store_id FROM vw_staff_details WHERE user_id = ? LIMIT 1");
    $stmt->execute([$user_id]);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$staff) {
        echo json_encode(['success' => false, 'message' => 'Staff not found']);
        exit;
    }

    $employee_id = $staff['employee_id'];
    $store_id = $staff['store_id'];
    $note = $data['note'] ?? '';
    $reason = $data['reason'] ?? 'Regular replenishment';

    // === 开启事务 ===
    $pdo->beginTransaction();

    $stmt = $pdo->prepare("CALL sp_staff_create_replenishment_request(?, ?, ?, ?, ?, ?)");
    
    foreach ($data['items'] as $item) {
        $sku_id = (isset($item['sku_id']) && is_numeric($item['sku_id'])) ? intval($item['sku_id']) : null;
        
        if (!$sku_id && !empty($item['isbn'])) {
            // 根据 ISBN 查找 SKU ID
            $stmtSku = $pdo->prepare("SELECT sku_id FROM skus WHERE ISBN = ? LIMIT 1");
            $stmtSku->execute([$item['isbn']]);
            $sku = $stmtSku->fetch(PDO::FETCH_ASSOC);
            if ($sku) {
                $sku_id = $sku['sku_id'];
            }
        }

        if (!$sku_id) {
            throw new Exception("Could not find a valid SKU for ISBN: " . ($item['isbn'] ?? 'N/A'));
        }

        $stmt->execute([
            $store_id,
            $sku_id,
            $item['quantity'],
            $employee_id,
            $reason,
            $note
        ]);
        $stmt->closeCursor();
    }

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Stock requests created successfully']);

} catch (Exception $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
