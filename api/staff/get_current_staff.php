<?php
// api/staff/get_current_staff.php
header('Content-Type: application/json');
require_once '../../config/database.php';

// 开启 Session
session_start();



// ================== 测试代码：模拟登录用户 ==================
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 79; 
}
// =================================================================

try {
    $user_id = $_SESSION['user_id'];
    $db = getDB();
    
    $sql = "SELECT * FROM vw_staff_details WHERE user_id = :uid LIMIT 1";
    $stmt = $db->prepare($sql);
    $stmt->execute([':uid' => $user_id]);
    
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($staff) {
        echo json_encode([
            'success' => true, 
            'data' => $staff
        ]);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'Staff profile not found or access denied.'
        ]);
    }

} catch (PDOException $e) {
    echo json_encode([
        'success' => false, 
        'message' => 'Database Error: ' . $e->getMessage()
    ]);
}
?>