<?php
// api/staff/add_book.php
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
    
    // 提取参数
    $isbn = isset($input['isbn']) ? trim($input['isbn']) : '';
    $name = isset($input['name']) ? trim($input['name']) : '';
    $language = isset($input['language']) ? trim($input['language']) : '';
    $publisher = isset($input['publisher']) ? trim($input['publisher']) : '';
    $introduction = isset($input['introduction']) ? trim($input['introduction']) : '';
    $author_first = isset($input['author_first']) ? trim($input['author_first']) : '';
    $author_last = isset($input['author_last']) ? trim($input['author_last']) : '';
    $author_country = isset($input['author_country']) ? trim($input['author_country']) : '';
    $category_id = isset($input['category_id']) ? intval($input['category_id']) : 0;
    $binding = isset($input['binding']) ? trim($input['binding']) : '';
    $unit_price = isset($input['unit_price']) ? floatval($input['unit_price']) : 0.0;
    $store_id = isset($input['store_id']) ? intval($input['store_id']) : 0;
    $initial_quantity = isset($input['initial_quantity']) ? intval($input['initial_quantity']) : 0;
    $batch_code = isset($input['batch_code']) ? trim($input['batch_code']) : '';

    // 验证必需参数
    if (empty($isbn) || empty($name) || empty($author_first) || empty($author_last) || empty($binding) || $unit_price <= 0 || $store_id <= 0) {
        echo json_encode(['success' => false, 'message' => 'Missing required fields or invalid data']);
        exit;
    }

    // 开启事务
    $pdo->beginTransaction();

    // 调用存储过程添加新书
    $stmt = $pdo->prepare("CALL sp_staff_add_new_book(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
        $isbn,
        $name,
        $language,
        $publisher,
        $introduction,
        $author_first,
        $author_last,
        $author_country,
        $category_id,
        $binding,
        $unit_price,
        $store_id,
        $initial_quantity,
        $batch_code
    ]);

    $pdo->commit();

    echo json_encode(['success' => true, 'message' => 'Book added successfully']);

} catch (PDOException $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
} catch (Exception $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['success' => false, 'message' => 'Error: ' . $e->getMessage()]);
}
?>
