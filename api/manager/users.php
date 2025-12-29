<?php
/**
 * Manager - Users API
 * 用户管理接口
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
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
        case 'list':
            listUsers($conn);
            break;

        case 'detail':
            getUserDetail($conn);
            break;

        case 'add':
            addUser($conn);
            break;

        case 'update':
            updateUser($conn);
            break;

        case 'delete':
            deleteUser($conn);
            break;

        case 'toggle_status':
            toggleUserStatus($conn);
            break;

        case 'search':
            searchUsers($conn);
            break;

        case 'reset_password':
            resetUserPassword($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, add, update, delete, toggle_status, search, reset_password'
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
 * 获取用户列表
 */
function listUsers($conn) {
    $sql = "SELECT
                u.user_id,
                u.username,
                u.user_types AS user_type,
                u.status AS account_status,
                u.create_date,
                u.last_log_date,
                CASE
                    WHEN m.member_id IS NOT NULL THEN CONCAT(m.first_name, ' ', m.last_name)
                    WHEN e.employee_id IS NOT NULL THEN CONCAT(e.first_name, ' ', e.last_name)
                    ELSE NULL
                END AS full_name,
                CASE
                    WHEN m.member_id IS NOT NULL THEN m.phone
                    WHEN e.employee_id IS NOT NULL THEN e.phone
                    ELSE NULL
                END AS phone
            FROM users u
            LEFT JOIN members m ON u.user_id = m.user_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            ORDER BY u.user_id DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Users retrieved successfully',
        'data' => $users,
        'count' => count($users)
    ]);
}

/**
 * 获取用户详情
 */
function getUserDetail($conn) {
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    $userId = intval($_GET['user_id']);

    $sql = "SELECT
                u.user_id,
                u.username,
                u.user_types AS user_type,
                u.status AS account_status,
                u.create_date,
                u.last_log_date,
                CASE
                    WHEN m.member_id IS NOT NULL THEN CONCAT(m.first_name, ' ', m.last_name)
                    WHEN e.employee_id IS NOT NULL THEN CONCAT(e.first_name, ' ', e.last_name)
                    ELSE NULL
                END AS full_name,
                CASE
                    WHEN m.member_id IS NOT NULL THEN m.phone
                    WHEN e.employee_id IS NOT NULL THEN e.phone
                    ELSE NULL
                END AS phone
            FROM users u
            LEFT JOIN members m ON u.user_id = m.user_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            WHERE u.user_id = :user_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch();

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
        'message' => 'User detail retrieved successfully',
        'data' => $user
    ]);
}

/**
 * Add user (employee)
 */
function addUser($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON: ' . json_last_error_msg()
        ]);
        return;
    }

    if (!$data || empty($data['username']) || empty($data['password'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'username and password are required'
        ]);
        return;
    }

    $username = strtolower(trim($data['username']));
    $password = $data['password'];

    if (!preg_match('/^emp\d{3}$/', $username)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Username must be in format emp001'
        ]);
        return;
    }

    $checkStmt = $conn->prepare("SELECT user_id FROM users WHERE username = :username");
    $checkStmt->bindValue(':username', $username, PDO::PARAM_STR);
    $checkStmt->execute();
    if ($checkStmt->fetch()) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Username already exists'
        ]);
        return;
    }

    $sql = "INSERT INTO users (username, password_hash, create_date, last_log_date, user_types, status)
            VALUES (:username, :password_hash, NOW(), NOW(), 'employee', 'active')";
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->bindValue(':password_hash', $password, PDO::PARAM_STR);

    if ($stmt->execute()) {
        $userId = $conn->lastInsertId();
        $fixStmt = $conn->prepare("UPDATE users SET user_types = 'employee', status = 'active' WHERE user_id = :user_id");
        $fixStmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
        $fixStmt->execute();
        echo json_encode([
            'success' => true,
            'message' => 'User created successfully',
            'data' => ['user_id' => $userId]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to create user'
        ]);
    }
}

/**
 * 更新用户信息
 */
function updateUser($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON: ' . json_last_error_msg()
        ]);
        return;
    }

    if (!$data || !isset($data['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    $userId = $data['user_id'];

    try {
        $conn->beginTransaction();

        // 1. 更新 users 表
        $userUpdates = [];
        $userParams = [':user_id' => $userId];

        if (isset($data['username'])) {
            $userUpdates[] = "username = :username";
            $userParams[':username'] = $data['username'];
        }

        if (isset($data['status'])) {
            $userUpdates[] = "status = :status";
            $userParams[':status'] = $data['status'];
        } elseif (isset($data['account_status'])) {
            $userUpdates[] = "status = :status";
            $userParams[':status'] = $data['account_status'];
        }

        if (!empty($userUpdates)) {
            $sql = "UPDATE users SET " . implode(', ', $userUpdates) . " WHERE user_id = :user_id";
            $stmt = $conn->prepare($sql);
            foreach ($userParams as $key => $value) {
                $stmt->bindValue($key, $value);
            }
            $stmt->execute();
        }

        // 2. 如果有 full_name，更新 members 或 employees 表
        if (isset($data['full_name']) && !empty($data['full_name'])) {
            $nameParts = explode(' ', trim($data['full_name']), 2);
            $firstName = $nameParts[0];
            $lastName = isset($nameParts[1]) ? $nameParts[1] : '';

            // 先获取用户类型
            $typeStmt = $conn->prepare("SELECT user_types FROM users WHERE user_id = :user_id");
            $typeStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $typeStmt->execute();
            $userType = $typeStmt->fetchColumn();

            if ($userType === 'member') {
                // 更新 members 表
                $memberSql = "UPDATE members SET first_name = :first_name, last_name = :last_name WHERE user_id = :user_id";
                $memberStmt = $conn->prepare($memberSql);
                $memberStmt->bindParam(':first_name', $firstName, PDO::PARAM_STR);
                $memberStmt->bindParam(':last_name', $lastName, PDO::PARAM_STR);
                $memberStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $memberStmt->execute();
            } elseif ($userType === 'employee') {
                // 更新 employees 表
                $empSql = "UPDATE employees SET first_name = :first_name, last_name = :last_name WHERE user_id = :user_id";
                $empStmt = $conn->prepare($empSql);
                $empStmt->bindParam(':first_name', $firstName, PDO::PARAM_STR);
                $empStmt->bindParam(':last_name', $lastName, PDO::PARAM_STR);
                $empStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
                $empStmt->execute();
            }
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'User updated successfully'
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update user: ' . $e->getMessage()
        ]);
    }
}

/**
 * 删除用户
 */
function deleteUser($conn) {
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    $userId = intval($_GET['user_id']);

    $checkSql = "SELECT user_id FROM users WHERE user_id = :user_id";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $checkStmt->execute();

    if (!$checkStmt->fetch()) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        return;
    }

    $conn->beginTransaction();

    try {
        $empStmt = $conn->prepare("SELECT employee_id FROM employees WHERE user_id = :user_id");
        $empStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $empStmt->execute();
        $employee = $empStmt->fetch();

        if ($employee) {
            $delEmp = $conn->prepare("DELETE FROM employees WHERE user_id = :user_id");
            $delEmp->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $delEmp->execute();
        }

        $memberStmt = $conn->prepare("SELECT member_id FROM members WHERE user_id = :user_id");
        $memberStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $memberStmt->execute();
        $member = $memberStmt->fetch();

        if ($member) {
            $memberId = intval($member['member_id']);
            $orderStmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM orders WHERE member_id = :member_id");
            $orderStmt->bindParam(':member_id', $memberId, PDO::PARAM_INT);
            $orderStmt->execute();
            $orderCount = $orderStmt->fetch();

            $favStmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM favorites WHERE member_id = :member_id");
            $favStmt->bindParam(':member_id', $memberId, PDO::PARAM_INT);
            $favStmt->execute();
            $favCount = $favStmt->fetch();

            $payStmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM payments WHERE member_id = :member_id");
            $payStmt->bindParam(':member_id', $memberId, PDO::PARAM_INT);
            $payStmt->execute();
            $payCount = $payStmt->fetch();

            if ((intval($orderCount['cnt']) > 0) || (intval($favCount['cnt']) > 0) || (intval($payCount['cnt']) > 0)) {
                $conn->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'User is linked to member records. Clear related orders/favorites/payments first.'
                ]);
                return;
            }

            $delMember = $conn->prepare("DELETE FROM members WHERE user_id = :user_id");
            $delMember->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $delMember->execute();
        }

        $sql = "DELETE FROM users WHERE user_id = :user_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $conn->commit();
        echo json_encode([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
}
function toggleUserStatus($conn) {
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    $userId = intval($_GET['user_id']);

    // 获取当前状态
    $sql = "SELECT status FROM users WHERE user_id = :user_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        return;
    }

    // 切换状态
    $newStatus = ($user['status'] === 'active') ? 'disabled' : 'active';

    $updateSql = "UPDATE users SET status = :status WHERE user_id = :user_id";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bindParam(':status', $newStatus, PDO::PARAM_STR);
    $updateStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);

    if ($updateStmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'User status updated successfully',
            'data' => ['new_status' => $newStatus]
        ]);
    } else {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Failed to update user status'
        ]);
    }
}

/**
 * 搜索用户
 */
function searchUsers($conn) {
    if (!isset($_GET['keyword'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'keyword is required'
        ]);
        return;
    }

    $keyword = trim($_GET['keyword']);
    if ($keyword === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'keyword is required'
        ]);
        return;
    }

    $sql = "SELECT
                u.user_id,
                u.username,
                u.user_types AS user_type,
                u.status AS account_status,
                u.create_date,
                u.last_log_date,
                CASE
                    WHEN m.member_id IS NOT NULL THEN CONCAT(m.first_name, ' ', m.last_name)
                    WHEN e.employee_id IS NOT NULL THEN CONCAT(e.first_name, ' ', e.last_name)
                    ELSE NULL
                END AS full_name,
                CASE
                    WHEN m.member_id IS NOT NULL THEN m.phone
                    WHEN e.employee_id IS NOT NULL THEN e.phone
                    ELSE NULL
                END AS phone,
                (COALESCE(MATCH(u.username) AGAINST (:kw1a IN NATURAL LANGUAGE MODE), 0) +
                 COALESCE(MATCH(m.first_name, m.last_name) AGAINST (:kw2a IN NATURAL LANGUAGE MODE), 0) +
                 COALESCE(MATCH(e.first_name, e.last_name) AGAINST (:kw3a IN NATURAL LANGUAGE MODE), 0)) AS relevance_score
            FROM users u
            LEFT JOIN members m ON u.user_id = m.user_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            WHERE (
                MATCH(u.username) AGAINST (:kw1b IN NATURAL LANGUAGE MODE)
                OR MATCH(m.first_name, m.last_name) AGAINST (:kw2b IN NATURAL LANGUAGE MODE)
                OR MATCH(e.first_name, e.last_name) AGAINST (:kw3b IN NATURAL LANGUAGE MODE)
                OR u.user_types LIKE :kw_like1
                OR CAST(u.user_id AS CHAR) LIKE :kw_like2
                OR CAST(m.phone AS CHAR) LIKE :kw_like3
                OR CAST(e.phone AS CHAR) LIKE :kw_like4
            )
            ORDER BY relevance_score DESC, u.user_id DESC";
    $stmt = $conn->prepare($sql);
    $likeTerm = "%$keyword%";
    $stmt->bindValue(':kw1a', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw2a', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw3a', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw1b', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw2b', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw3b', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like1', $likeTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like2', $likeTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like3', $likeTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like4', $likeTerm, PDO::PARAM_STR);
    $stmt->execute();
    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Search completed successfully',
        'data' => $users,
        'count' => count($users)
    ]);
}

/**
 * 重置用户密码（调用存储过程）
 */
function resetUserPassword($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON: ' . json_last_error_msg()
        ]);
        return;
    }

    if (!$data || !isset($data['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    // 调用存储过程重置密码
    $sql = "CALL sp_manager_reset_user_password(
        :user_id,
        @result_code, @result_message
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'default_password' => 'Password@123'
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ]);
    }
}
?>
