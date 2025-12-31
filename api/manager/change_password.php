<?php
session_start();
require_once '../config/database.php';
require_once '../middleware/auth.php';

// 验证登录状态和角色
if (!isset($_SESSION['user_id']) || $_SESSION['user_role'] !== 'manager') {
    echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
    exit;
}

// 获取输入数据
$data = json_decode(file_get_contents('php://input'), true);
$full_name = $data['full_name'] ?? '';
$email = $data['email'] ?? '';
$phone = $data['phone'] ?? '';

// 验证数据
if (empty($full_name) || empty($email)) {
    echo json_encode(['success' => false, 'message' => 'Full name and email are required']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => 'Invalid email format']);
    exit;
}

try {
    // 检查邮箱是否已被其他用户使用
    $stmt = $pdo->prepare("SELECT user_id FROM users WHERE email = ? AND user_id != ?");
    $stmt->execute([$email, $_SESSION['user_id']]);
    if ($stmt->fetch()) {
        echo json_encode(['success' => false, 'message' => 'Email already in use']);
        exit;
    }
    
    // 更新用户信息
    $stmt = $pdo->prepare("
        UPDATE users 
        SET full_name = ?, email = ?, phone = ?, updated_at = NOW() 
        WHERE user_id = ?
    ");
    $stmt->execute([$full_name, $email, $phone, $_SESSION['user_id']]);
    
    // 如果有员工记录，也更新员工邮箱
    $stmt = $pdo->prepare("UPDATE employees SET email = ? WHERE user_id = ?");
    $stmt->execute([$email, $_SESSION['user_id']]);
    
    echo json_encode(['success' => true, 'message' => 'Profile updated successfully']);
} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
?>