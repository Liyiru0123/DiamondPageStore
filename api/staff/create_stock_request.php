<?php
require_once '../../config/database.php';
header('Content-Type: application/json');

// 获取 POST JSON 数据
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['items']) || empty($data['items'])) {
    echo json_encode(['success' => false, 'message' => 'No items provided']);
    exit;
}

$store_id = 1; // 假设当前员工所在店铺
$supplier_id = 1; // 简化：默认发给 1号供应商，实际可做下拉选择
$note = $data['note'] ?? '';

try {
    $db = getDB();
    
    // === 开启事务 (Transaction Start) ===
    $db->beginTransaction();

    // 1. 调用存储过程创建 Header
    // 注意：PDO 调用带 OUT 参数的存储过程比较复杂，这里用 Session 变量法
    $stmt = $db->prepare("CALL sp_staff_create_purchase_header(?, ?, ?, @new_id)");
    $stmt->execute([$store_id, $supplier_id, $note]);
    
    // 获取刚才生成的 ID
    $stmt = $db->query("SELECT @new_id")->fetch(PDO::FETCH_ASSOC);
    $purchase_id = $stmt['@new_id'];

    // 2. 循环插入 Items
    $stmtItem = $db->prepare("CALL sp_staff_add_purchase_item(?, ?, ?)");
    
    foreach ($data['items'] as $item) {
        // 前端传来的 item 包含 sku_id 和 qty
        $stmtItem->execute([$purchase_id, $item['sku_id'], $item['quantity']]);
        $stmtItem->closeCursor(); // 必须关闭游标才能再次执行
    }

    // === 提交事务 (Commit) ===
    $db->commit();

    echo json_encode(['success' => true, 'message' => 'Request created', 'id' => $purchase_id]);

} catch (Exception $e) {
    // === 发生错误，回滚 (Rollback) ===
    if ($db->inTransaction()) {
        $db->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Transaction failed: ' . $e->getMessage()]);
}
?>