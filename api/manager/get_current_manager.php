<?php
session_start();
require_once '../config/database.php';
require_once '../middleware/auth.php';

// 验证登录状态和角色
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'manager') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

try {
    $stmt = $pdo->prepare("
        SELECT 
            u.user_id,
            u.username,
            u.email,
            u.full_name,
            u.phone,
            u.created_at,
            e.store_id,
            s.store_name,
            jt.title as job_title
        FROM users u
        LEFT JOIN employees e ON u.user_id = e.user_id
        LEFT JOIN stores s ON e.store_id = s.store_id
        LEFT JOIN job_titles jt ON e.job_title_id = jt.job_title_id
        WHERE u.user_id = ? AND u.user_role = 'manager'
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user) {
        echo json_encode([
            'success' => true,
            'data' => [
                'user_id' => $user['user_id'],
                'username' => $user['username'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'phone' => $user['phone'] ?? '',
                'store_id' => $user['store_id'],
                'store_name' => $user['store_name'] ?? 'Head Office',
                'job_title' => $user['job_title'] ?? 'Manager',
                'created_at' => $user['created_at']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Manager not found']);
    }
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>