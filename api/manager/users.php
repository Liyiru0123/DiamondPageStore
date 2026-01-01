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
                    WHEN m.member_id IS NOT NULL THEN m.email
                    WHEN e.employee_id IS NOT NULL THEN e.email
                    ELSE NULL
                END AS email
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
                    WHEN m.member_id IS NOT NULL THEN m.email
                    WHEN e.employee_id IS NOT NULL THEN e.email
                    ELSE NULL
                END AS email
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
 * Add user (employee) - 调用存储过程，支持重用 user_id
 * username 格式: emp001 -> user_id = 1
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

    // 从 username 提取 user_id（emp001 -> 1）
    $userIdFromUsername = intval(preg_replace('/^emp/', '', $username));

    // 调用存储过程
    $sql = "CALL sp_manager_add_user(:user_id, :username, :password, :user_type, @result_code, @result_message, @out_user_id)";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':user_id', $userIdFromUsername, PDO::PARAM_INT);
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->bindValue(':password', $password, PDO::PARAM_STR);
    $userType = 'employee';
    $stmt->bindValue(':user_type', $userType, PDO::PARAM_STR);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message, @out_user_id as user_id")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'data' => ['user_id' => intval($result['user_id'])]
        ]);
    } else {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ]);
    }
}

/**
 * 更新用户信息（调用存储过程）
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

    $userId = intval($data['user_id']);
    $username = isset($data['username']) ? $data['username'] : null;
    $status = isset($data['status']) ? $data['status'] : (isset($data['account_status']) ? $data['account_status'] : null);
    $fullName = isset($data['full_name']) ? $data['full_name'] : null;

    // 调用存储过程
    $sql = "CALL sp_manager_update_user(:user_id, :username, :status, :full_name, @result_code, @result_message)";

    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindValue(':username', $username, PDO::PARAM_STR);
    $stmt->bindValue(':status', $status, PDO::PARAM_STR);
    $stmt->bindValue(':full_name', $fullName, PDO::PARAM_STR);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message']
        ]);
    } else {
        $httpCode = ($result['code'] == 0 && strpos($result['message'], 'not found') !== false) ? 404 : 400;
        http_response_code($httpCode);
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ]);
    }
}

/**
 * 删除用户（调用存储过程）
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

    // 调用存储过程
    $sql = "CALL sp_manager_delete_user(:user_id, @result_code, @result_message)";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message']
        ]);
    } else {
        $httpCode = ($result['code'] == 0 && strpos($result['message'], 'not found') !== false) ? 404 : 400;
        http_response_code($httpCode);
        echo json_encode([
            'success' => false,
            'message' => $result['message']
        ]);
    }
}
/**
 * 切换用户状态（调用存储过程）
 */
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

    // 调用存储过程
    $sql = "CALL sp_manager_toggle_user_status(:user_id, @result_code, @result_message, @new_status)";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message, @new_status as new_status")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'data' => ['new_status' => $result['new_status']]
        ]);
    } else {
        $httpCode = ($result['code'] == 0 && strpos($result['message'], 'not found') !== false) ? 404 : 400;
        http_response_code($httpCode);
        echo json_encode([
            'success' => false,
            'message' => $result['message']
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
                    WHEN m.member_id IS NOT NULL THEN m.email
                    WHEN e.employee_id IS NOT NULL THEN e.email
                    ELSE NULL
                END AS email,
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
                OR CAST(m.email AS CHAR) LIKE :kw_like3
                OR e.email LIKE :kw_like4
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
