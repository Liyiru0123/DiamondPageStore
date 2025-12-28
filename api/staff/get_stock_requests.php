<?php
// api/staff/get_stock_requests.php
header('Content-Type: application/json');
require_once '../../config/database.php';

// 开启 Session 以获取 store_id (如果没有传参的话)
session_start();

try {
    // 1. 获取 $pdo (适配你的 database.php 写法)
    if (!isset($pdo)) {
        $database = new DatabaseLocal();
        $pdo = $database->getConnection();
    }

    // 2. 获取 Store ID
    // 优先用 GET 参数，没有则用 Session，都没有则默认为 1
    $store_id = isset($_GET['store_id']) ? intval($_GET['store_id']) : (isset($_SESSION['store_id']) ? $_SESSION['store_id'] : 1);

    // 3. 调用存储过程
    // 注意：请确保你已经在数据库里运行了之前提供的 CREATE PROCEDURE sp_staff_get_stock_requests SQL
    $stmt = $pdo->prepare("CALL sp_staff_get_stock_requests(?)");
    $stmt->execute([$store_id]);
    $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $requests]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database Error: ' . $e->getMessage()]);
}
?>