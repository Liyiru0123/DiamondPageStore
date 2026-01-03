<?php
/**
 * Profile API - 当前登录用户的个人资料管理
 * 支持获取当前用户信息、更新个人资料、修改密码
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

try {
    $conn = getDB();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database connection failed'
    ]);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'get_current_user':
            getCurrentUser($conn);
            break;

        case 'update_profile':
            updateProfile($conn);
            break;

        case 'change_password':
            changePassword($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: get_current_user, update_profile, change_password'
            ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

/**
 * 获取当前登录用户的信息
 */
function getCurrentUser($conn) {
    // 从请求中获取用户ID（实际应用中应该从session或token中获取）
    // 这里暂时从GET参数获取，生产环境应该使用更安全的方式
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    $userId = intval($_GET['user_id']);

    $sql = "SELECT u.user_id, u.username, u.user_types,
                   CASE
                       WHEN u.user_types = 'employee' THEN CONCAT(e.first_name, ' ', e.last_name)
                       WHEN u.user_types = 'member' THEN CONCAT(m.first_name, ' ', m.last_name)
                       ELSE NULL
                   END AS full_name,
                   CASE
                       WHEN u.user_types = 'employee' THEN e.email
                       WHEN u.user_types = 'member' THEN m.email
                       ELSE NULL
                   END AS user_email
            FROM users u
            LEFT JOIN employees e ON u.user_id = e.user_id AND u.user_types = 'employee'
            LEFT JOIN members m ON u.user_id = m.user_id AND u.user_types = 'member'
            WHERE u.user_id = :user_id";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'user_id' => $user['user_id'],
            'username' => $user['username'],
            'user_type' => $user['user_types'],
            'full_name' => $user['full_name'] ?? '',
            'email' => $user['user_email'] ?? ''
        ]
    ]);
}

/**
 * 更新当前用户的个人资料
 */
function updateProfile($conn) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    $userId = intval($input['user_id']);
    $fullName = isset($input['full_name']) ? trim($input['full_name']) : '';
    $email = isset($input['email']) ? trim($input['email']) : '';

    if (empty($fullName)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Full name is required'
        ]);
        return;
    }

    // 验证邮箱格式
    if (!empty($email) && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email format'
        ]);
        return;
    }

    // 获取用户类型
    $userTypeSQL = "SELECT user_types FROM users WHERE user_id = :user_id";
    $stmt = $conn->prepare($userTypeSQL);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $userInfo = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$userInfo) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        return;
    }

    $userType = $userInfo['user_types'];

    $conn->beginTransaction();

    try {
        // 根据用户类型更新对应的表
        if ($userType === 'employee') {
            // 智能解析姓名
            // 如果名字中包含空格，按空格分割（适用于英文名）
            // 如果没有空格，整个名字作为first_name（适用于中文名）
            if (strpos($fullName, ' ') !== false) {
                $nameParts = explode(' ', $fullName, 2);
                $firstName = $nameParts[0];
                $lastName = isset($nameParts[1]) ? $nameParts[1] : '';
            } else {
                // 中文名或单个单词的名字，全部存储在first_name
                $firstName = $fullName;
                $lastName = '';
            }

            $empSQL = "UPDATE employees SET first_name = :first_name, last_name = :last_name, email = :email
                       WHERE user_id = :user_id";
            $empStmt = $conn->prepare($empSQL);
            $empStmt->bindParam(':first_name', $firstName, PDO::PARAM_STR);
            $empStmt->bindParam(':last_name', $lastName, PDO::PARAM_STR);
            $empStmt->bindParam(':email', $email, PDO::PARAM_STR);
            $empStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $empStmt->execute();
        } elseif ($userType === 'member') {
            if (strpos($fullName, ' ') !== false) {
                $nameParts = explode(' ', $fullName, 2);
                $firstName = $nameParts[0];
                $lastName = isset($nameParts[1]) ? $nameParts[1] : '';
            } else {
                $firstName = $fullName;
                $lastName = '';
            }

            $memberSQL = "UPDATE members SET first_name = :first_name, last_name = :last_name, email = :email
                          WHERE user_id = :user_id";
            $memberStmt = $conn->prepare($memberSQL);
            $memberStmt->bindParam(':first_name', $firstName, PDO::PARAM_STR);
            $memberStmt->bindParam(':last_name', $lastName, PDO::PARAM_STR);
            $memberStmt->bindParam(':email', $email, PDO::PARAM_STR);
            $memberStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $memberStmt->execute();
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Profile updated successfully'
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update profile: ' . $e->getMessage()
        ]);
    }
}

/**
 * 修改当前用户的密码
 */
function changePassword($conn) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!isset($input['user_id']) || !isset($input['current_password']) || !isset($input['new_password'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id, current_password and new_password are required'
        ]);
        return;
    }

    $userId = intval($input['user_id']);
    $currentPassword = $input['current_password'];
    $newPassword = $input['new_password'];

    // 验证新密码长度
    if (strlen($newPassword) < 6) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'New password must be at least 6 characters'
        ]);
        return;
    }

    // 获取当前密码hash
    $sql = "SELECT password_hash FROM users WHERE user_id = :user_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        return;
    }

    $storedHash = $user['password_hash'];
    $isHashed = is_string($storedHash) && preg_match('/^\$2[aby]\$\d{2}\$/', $storedHash);
    $isValidPassword = $isHashed
        ? password_verify($currentPassword, $storedHash)
        : ($currentPassword === (string)$storedHash);

    // 验证当前密码
    if (!$isValidPassword) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'message' => 'Current password is incorrect'
        ]);
        return;
    }

    // 更新为新密码
    $newPasswordHash = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateSQL = "UPDATE users SET password_hash = :password_hash WHERE user_id = :user_id";
    $updateStmt = $conn->prepare($updateSQL);
    $updateStmt->bindParam(':password_hash', $newPasswordHash, PDO::PARAM_STR);
    $updateStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

    if ($updateStmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Password changed successfully'
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to change password'
        ]);
    }
}
