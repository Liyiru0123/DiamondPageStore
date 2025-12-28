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

    $store_id = isset($_GET['store_id']) ? intval($_GET['store_id']) : 1;

    $stmt = $pdo->prepare("CALL sp_staff_get_inventory(?)");
    $stmt->execute([$store_id]);
    $inventory = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo json_encode(['success' => true, 'data' => $inventory]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>