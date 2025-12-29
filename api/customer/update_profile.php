<?php
// api/customer/update_profile.php
require_once '../../config/database.php';
header('Content-Type: application/json');

// 1. 获取输入
$data = json_decode(file_get_contents("php://input"), true);
$userId = $data['user_id'] ?? null;
$username = $data['username'] ?? '';
$password = $data['password'] ?? ''; // 如果为空则代表不修改
$contact = $data['contact'] ?? '';

if (!$userId || !$username) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit;
}

try {
    $db = getDB();
    
    // 2. 调用存储过程
    $stmt = $db->prepare("CALL sp_customer_update_profile(?, ?, ?, ?, @success, @msg)");
    $stmt->execute([
        $userId, 
        $username, 
        $password, 
        $contact
    ]);

    $stmt->closeCursor();
    
    // 3. 获取结果
    $res = $db->query("SELECT @success AS success, @msg AS message")->fetch(PDO::FETCH_ASSOC);

    echo json_encode([
        'success' => (bool)$res['success'],
        'message' => $res['message']
    ]);

} catch (Exception $e) {
    error_log("Update Profile Error: " . $e->getMessage());
    // echo json_encode(['success' => false, 'message' => 'Server error']);
    echo json_encode(['success' => false, 'message' => 'Debug Error: ' . $e->getMessage()]);
}
?>