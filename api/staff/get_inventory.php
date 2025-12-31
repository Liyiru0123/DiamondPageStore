<?php
// api/staff/get_inventory.php
header('Content-Type: application/json');
require_once '../../config/database.php';
session_start();

try {
    if (!isset($pdo)) {
        $database = new DatabaseLocal();
        $pdo = $database->getConnection();
    }

    // 获取所有筛选参数
    $store_id = isset($_GET['store_id']) ? intval($_GET['store_id']) : 1;
    $search_term = isset($_GET['search']) ? trim($_GET['search']) : '';
    $category = isset($_GET['category']) ? trim($_GET['category']) : '';
    $stock_level = isset($_GET['stock_level']) ? trim($_GET['stock_level']) : '';
    $hide_zero = isset($_GET['hide_zero']) && $_GET['hide_zero'] === 'true' ? 1 : 0;
    $sort_by = isset($_GET['sort_by']) ? trim($_GET['sort_by']) : 'title-asc';

    // 调用存储过程，传入所有筛选参数
    $stmt = $pdo->prepare("CALL sp_staff_get_inventory(?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $store_id,
        $search_term,
        $category,
        $stock_level,
        $hide_zero,
        $sort_by
    ]);
    
    $inventory = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => true,
        'data' => $inventory,
        'total' => count($inventory)
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>