<?php
// api/auth/login.php
header('Content-Type: application/json');
require_once '../../config/database.php';

$data = json_decode(file_get_contents("php://input"));

// 检查 login_mode 是否传递
if (!isset($data->username) || !isset($data->password) || !isset($data->login_mode)) {
    echo json_encode(['success' => false, 'message' => 'Missing credentials']);
    exit;
}

try {
    if (!isset($pdo)) {
        $database = new DatabaseLocal();
        $pdo = $database->getConnection();
    }

    $stmt = $pdo->prepare("CALL sp_auth_get_user(?)");
    $stmt->execute([$data->username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    $loginSuccess = false;
    $errorMessage = 'Account or Password error';

    if ($user && $user['status'] === 'active' && $data->password === $user['password_hash']) {
        
        // --- 核心逻辑：身份隔离检查 ---
        $dbType = $user['user_types']; // 数据库里的身份: 'member' 或 'employee'
        $currentMode = $data->login_mode; // 前端传来的: 'staff' 或 'customer'

        // 情况 1: 在员工入口登录，但账号是 Member -> 拒绝
        if ($currentMode === 'staff' && $dbType === 'member') {
            echo json_encode(['success' => false, 'message' => 'Access Denied: This is a Staff portal.']);
            exit;
        }

        // 情况 2: 在顾客入口登录，但账号是 Employee -> 拒绝
        // (防止员工用工作号在前端下单，通常需要分开)
        if ($currentMode === 'customer' && $dbType === 'employee') {
            echo json_encode(['success' => false, 'message' => 'Access Denied: Please use the Staff portal.']);
            exit;
        }

        $loginSuccess = true;
    }

    if ($loginSuccess) {
        session_start();
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['user_role'] = $user['user_types'];

        // --- 核心逻辑：自动判断跳转页面 ---
        $frontendRole = 'customer'; // 默认
        
        if ($user['user_types'] === 'member') {
            $frontendRole = 'customer';
        } 
        elseif ($user['user_types'] === 'employee') {
            // 根据 job_title 自动分流
            // 假设 job_titles 表里的名字包含 'Manager', 'Finance' 等关键词
            $jobTitle = strtolower($user['job_title'] ?? '');

            if (strpos($jobTitle, 'manager') !== false) {
                $frontendRole = 'manager';
            } elseif (strpos($jobTitle, 'finance') !== false) {
                $frontendRole = 'finance';
            } else {
                $frontendRole = 'staff'; // 默认跳销售/库存页面
            }
        }

        echo json_encode([
            'success' => true,
            'token' => session_id(),
            'user' => [
                'username' => $user['username'],
                'role' => $frontendRole, // PHP 算好的最终去向
                'job_title' => $user['job_title'] // 调试用
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => $errorMessage]);
    }

} catch (PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'System Error']);
}
?>