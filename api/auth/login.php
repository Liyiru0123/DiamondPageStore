<?php
// api/auth/login.php
require_once '../../config/database.php'; // 引入数据库配置
session_start(); // 启用 Session
header('Content-Type: application/json');

$data = json_decode(file_get_contents("php://input"));

$username = $data->username ?? '';
$password = $data->password ?? '';
$login_mode = $data->login_mode ?? 'customer'; // 'customer' 或 'staff'

if (empty($username) || empty($password)) {
    echo json_encode(['success' => false, 'message' => 'Username and password are required.']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("CALL sp_auth_get_user(?)");
    $stmt->execute([$username]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

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

    // 登录成功
    // 准备要返回给前端的用户信息，并存入 Session
    $userInfo = [
        'user_id' => $user['user_id'],          // 【核心修复点】确保 user_id 被包含
        'username' => $user['username'],
        'user_role' => 'customer',              // 默认是 customer
        'full_name' => $user['username']        // 默认用 username 作为全名，后续可从 members 表获取
    ];

    // 根据职位判断员工角色并设置前端跳转路径
    if ($user['user_types'] === 'employee') {
        switch ($user['job_title']) {
            case 'Store Manager':
                $userInfo['user_role'] = 'manager';
                break;
            case 'Finance':
                $userInfo['user_role'] = 'finance';
                break;
            case 'Sales Staff':
            case 'Staff': // 兼容一下 staff 
                $userInfo['user_role'] = 'staff';
                break;
            default:
                $userInfo['user_role'] = 'staff'; // 未知职位默认 staff
                break;
        }
        // 如果是员工，还需要获取 store_id 和 store_name
        // 这里需要调用 vw_staff_details 视图获取员工的 store_id 和 store_name
        $stmt_staff_details = $db->prepare("SELECT store_id, store_name, first_name, last_name FROM vw_staff_details WHERE user_id = ? LIMIT 1");
        $stmt_staff_details->execute([$user['user_id']]);
        $staffDetails = $stmt_staff_details->fetch(PDO::FETCH_ASSOC);

        if ($staffDetails) {
            $userInfo['store_id'] = $staffDetails['store_id'];
            $userInfo['store_name'] = $staffDetails['store_name'];
            $userInfo['first_name'] = $staffDetails['first_name'];
            $userInfo['last_name'] = $staffDetails['last_name'];
            $userInfo['full_name'] = $staffDetails['first_name'] . ' ' . $staffDetails['last_name'];
        }

    } elseif ($user['user_types'] === 'member') {
        // 如果是顾客，获取会员信息（first_name, last_name, email）
        $stmt_member_details = $db->prepare("SELECT member_id, first_name, last_name, email FROM members WHERE user_id = ? LIMIT 1");
        $stmt_member_details->execute([$user['user_id']]);
        $memberDetails = $stmt_member_details->fetch(PDO::FETCH_ASSOC);

        if ($memberDetails) {
            $userInfo['member_id'] = $memberDetails['member_id'];
            $userInfo['first_name'] = $memberDetails['first_name'];
            $userInfo['last_name'] = $memberDetails['last_name'];
            $userInfo['full_name'] = $memberDetails['first_name'] . ' ' . $memberDetails['last_name'];
            $userInfo['email'] = $memberDetails['email']; // 【核心修复点】确保 email 被包含
        }
    }


    // 将认证信息存入 Session (用于 PHP 后端判断)
    $_SESSION['user_id'] = $userInfo['user_id'];
    $_SESSION['username'] = $userInfo['username'];
    $_SESSION['user_role'] = $userInfo['user_role'];
    
    // 如果是员工，再存入 store_id
    if ($userInfo['user_role'] !== 'customer' && isset($userInfo['store_id'])) {
        $_SESSION['store_id'] = $userInfo['store_id'];
    }

    // 返回给前端的成功响应，包含 auth_token 和 user_info
    echo json_encode([
        'success' => true,
        'message' => 'Login successful!',
        'auth_token' => md5(uniqid(rand(), true)), // 简单的 Token
        'user_info' => $userInfo, // 【核心修复点】
        'redirect_to' => $userInfo['user_role'] . '.html'
    ]);

} catch (Exception $e) {
    error_log("Login Error: " . $e->getMessage());
    // echo json_encode(['success' => false, 'message' => 'Server error during login.']);
    echo json_encode(['success' => false, 'message' => 'Debug Error: ' . $e->getMessage()]);
}
?>