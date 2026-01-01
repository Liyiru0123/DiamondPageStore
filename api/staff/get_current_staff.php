<?php
// api/staff/get_current_staff.php
header('Content-Type: application/json');
require_once '../../config/database.php';

// 开启 Session (假设登录模块已经设置了 $_SESSION['user_id'])
session_start();



// =================================================================
// 【开发测试专用】模拟登录状态
// 如果队友还没写好登录，或者我直接访问这个接口，session是空的。
// =================================================================
if (!isset($_SESSION['user_id'])) {
    $_SESSION['user_id'] = 79; 
}
// =================================================================

try {
    $user_id = $_SESSION['user_id'];
    $db = getDB();

    // 使用刚才创建的 VIEW 进行查询，而不是直接查表
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