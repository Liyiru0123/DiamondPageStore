<?php
// api/staff/get_categories.php
header('Content-Type: application/json');
require_once '../../config/database.php';

try {
    if (!isset($pdo)) {
        $database = new DatabaseLocal();
        $pdo = $database->getConnection();
    }

    // 使用视图获取所有类别
    $stmt = $pdo->query("SELECT * FROM vw_staff_book_categories");
    $categories = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $categories]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
