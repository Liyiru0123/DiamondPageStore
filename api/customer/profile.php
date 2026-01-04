<?php
/**
 * Customer Profile API
 * 处理个人资料相关的请求：获取、更新
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
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
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'get':
            getProfile($conn);
            break;

        case 'update':
            updateProfile($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

/**
 * 获取用户资料
 */
function getProfile($conn) {
    $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
    $memberId = isset($_GET['member_id']) ? intval($_GET['member_id']) : 0;

    if ($userId === 0 && $memberId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID or Member ID is required']);
        return;
    }

    if ($userId !== 0) {
        $stmt = $conn->prepare("
            SELECT *
            FROM vw_customer_profile
            WHERE user_id = :user_id
            LIMIT 1
        ");
        $stmt->execute([':user_id' => $userId]);
    } else {
        $stmt = $conn->prepare("
            SELECT *
            FROM vw_customer_profile
            WHERE member_id = :member_id
            LIMIT 1
        ");
        $stmt->execute([':member_id' => $memberId]);
    }

    if ($row = $stmt->fetch()) {
        echo json_encode([
            'success' => true,
            'data' => [
                'memberId' => $row['member_id'],
                'userId' => $row['user_id'],
                'firstName' => $row['first_name'],
                'lastName' => $row['last_name'],
                'email' => $row['email'],
                'address' => $row['address'],
                'birthday' => $row['birthday'],
                'username' => $row['username']
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Profile not found']);
    }
}

/**
 * 更新用户资料（调用存储过程）
 */
function updateProfile($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    $userId = isset($data['user_id']) ? intval($data['user_id']) : 0;
    $username = isset($data['username']) ? $data['username'] : '';
    $password = isset($data['password']) ? $data['password'] : '';
    $contact = isset($data['contact']) ? $data['contact'] : '';

    if ($userId === 0 || $username === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'User ID and username are required']);
        return;
    }

    // ??????
    $stmt = $conn->prepare("
        CALL sp_customer_update_profile(:user_id, :username, :password, :contact, @success, @message)
    ");
    $stmt->execute([
        ':user_id' => $userId,
        ':username' => $username,
        ':password' => $password,
        ':contact' => $contact
    ]);
    $stmt = null;

    // ????
    $result = $conn->query("SELECT @success AS success, @message AS message");
    $row = $result->fetch();

    echo json_encode([
        'success' => (bool)$row['success'],
        'message' => $row['message']
    ]);
}
?>
