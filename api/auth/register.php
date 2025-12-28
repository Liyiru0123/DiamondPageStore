<?php
// api/auth/register.php
header('Content-Type: application/json');
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"));

if (!isset($data->username) || !isset($data->password)) {
    echo json_encode(['success' => false, 'message' => 'Missing data']);
    exit;
}

try {
    if (!isset($pdo)) {
        $database = new DatabaseLocal();
        $pdo = $database->getConnection();
    }

    // 1. 直接使用前端传来的 Hash，不进行后端加密
    $final_hash = $data->password;

    // 2. 存入数据库
    $stmt = $pdo->prepare("CALL sp_auth_register_customer(?, ?, @msg, @succ)");
    $stmt->execute([$data->username, $final_hash]);

    $res = $pdo->query("SELECT @msg as message, @succ as success")->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => ($res['success'] == 1),
        'message' => $res['message']
    ]);

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'System Error: ' . $e->getMessage()]);
}
?>