<?php
// api/auth/login.php
require_once '../../config/database.php'; 
session_start(); 
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

$username = $data->username ?? '';
$password = $data->password ?? '';
$login_mode = $data->login_mode ?? 'customer'; 

if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("CALL sp_auth_get_user(?)");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    // 关闭游标，防止 "pending result sets" 错误
    $stmt->closeCursor(); 

    if (!$user) {
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
        exit;
    }

    // 明文密码比对
    if ($password !== $user['password_hash']) {
        echo json_encode(['success' => false, 'message' => 'Invalid username or password.']);
        exit;
    }

    // 角色隔离检查
    if ($login_mode === 'customer' && $user['user_types'] !== 'member') {
        echo json_encode(['success' => false, 'message' => 'Access Denied: Please use a customer account to log in here.']);
        exit;
    }
    if ($login_mode === 'staff' && $user['user_types'] !== 'employee') {
        echo json_encode(['success' => false, 'message' => 'Access Denied: Please use an employee account to log in here.']);
        exit;
    }

    // 准备用户信息
    $userInfo = [
        'user_id' => $user['user_id'],
        'username' => $user['username'],
        'user_role' => 'customer',
        'full_name' => $user['username']
    ];

    if ($user['user_types'] === 'employee') {
        // 获取数据库里的职位名称 (e.g., 'General Manager', 'Finance')
        $dbJobTitle = trim($user['job_title']); 

        switch ($dbJobTitle) {
            case 'Store Manager':   // 兼容旧数据
            case 'General Manager': 
                $userInfo['user_role'] = 'manager';
                break;
                
            case 'Finance':
                $userInfo['user_role'] = 'finance';
                break;
                
            case 'Sales Staff':
            case 'Staff':
                $userInfo['user_role'] = 'staff';
                break;
                
            default:
                // 如果职位未识别（防止拼写错误导致无法登录），默认为 staff，但在控制台可以看出来
                $userInfo['user_role'] = 'staff'; 
                error_log("Unknown Job Title detected: " . $dbJobTitle . " assigned as staff.");
                break;
        }

        // 获取员工分店信息
        $stmt_staff = $db->prepare("SELECT store_id, store_name, first_name, last_name FROM vw_staff_details WHERE user_id = ? LIMIT 1");
        $stmt_staff->execute([$user['user_id']]);
        $staffDetails = $stmt_staff->fetch(PDO::FETCH_ASSOC);
        // 记得关闭游标
        $stmt_staff->closeCursor();

        if ($staffDetails) {
            $userInfo['store_id'] = $staffDetails['store_id'];
            $userInfo['store_name'] = $staffDetails['store_name'];
            $userInfo['first_name'] = $staffDetails['first_name'];
            $userInfo['last_name'] = $staffDetails['last_name'];
            $userInfo['full_name'] = $staffDetails['first_name'] . ' ' . $staffDetails['last_name'];
        }

    } 
    
    elseif ($user['user_types'] === 'member') {
        $stmt_member = $db->prepare("SELECT member_id, first_name, last_name, email FROM members WHERE user_id = ? LIMIT 1");
        $stmt_member->execute([$user['user_id']]);
        $memberDetails = $stmt_member->fetch(PDO::FETCH_ASSOC);
        $stmt_member->closeCursor();

        if ($memberDetails) {
            $userInfo['member_id'] = $memberDetails['member_id'];
            $userInfo['first_name'] = $memberDetails['first_name'];
            $userInfo['last_name'] = $memberDetails['last_name'];
            $userInfo['full_name'] = $memberDetails['first_name'] . ' ' . $memberDetails['last_name'];
            $userInfo['email'] = $memberDetails['email'];
        }
    }

    // Session 存储
    $_SESSION['user_id'] = $userInfo['user_id'];
    $_SESSION['username'] = $userInfo['username'];
    $_SESSION['user_role'] = $userInfo['user_role'];
    if ($userInfo['user_role'] !== 'customer' && isset($userInfo['store_id'])) {
        $_SESSION['store_id'] = $userInfo['store_id'];
    }

    echo json_encode([
        'success' => true,
        'message' => 'Login successful!',
        'auth_token' => md5(uniqid(rand(), true)),
        'user_info' => $userInfo,
        'redirect_to' => $userInfo['user_role'] . '.html'
    ]);

} catch (Exception $e) {
    error_log("Login Error: " . $e->getMessage());
    echo json_encode(['success' => false, 'message' => 'Login Error: ' . $e->getMessage()]);
}
?>