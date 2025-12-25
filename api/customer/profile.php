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
    $memberId = isset($_GET['member_id']) ? intval($_GET['member_id']) : 0;

    if ($memberId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID is required']);
        return;
    }

    $stmt = $conn->prepare("
        SELECT m.*, u.username
        FROM members m
        JOIN users u ON m.user_id = u.user_id
        WHERE m.member_id = :member_id
    ");
    $stmt->execute([':member_id' => $memberId]);

    if ($row = $stmt->fetch()) {
        echo json_encode([
            'success' => true,
            'data' => [
                'memberId' => $row['member_id'],
                'userId' => $row['user_id'],
                'firstName' => $row['first_name'],
                'lastName' => $row['last_name'],
                'phone' => $row['phone'],
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

    $memberId = isset($data['member_id']) ? intval($data['member_id']) : 0;
    $firstName = isset($data['first_name']) ? $data['first_name'] : '';
    $lastName = isset($data['last_name']) ? $data['last_name'] : '';
    $phone = isset($data['phone']) ? intval($data['phone']) : 0;
    $address = isset($data['address']) ? $data['address'] : '';
    $birthday = isset($data['birthday']) ? $data['birthday'] : null;

    if ($memberId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID is required']);
        return;
    }

    // 调用存储过程
    $stmt = $conn->prepare("
        CALL sp_customer_update_profile(:member_id, :first_name, :last_name, :phone, :address, :birthday, @result_code, @result_message)
    ");
    $stmt->execute([
        ':member_id' => $memberId,
        ':first_name' => $firstName,
        ':last_name' => $lastName,
        ':phone' => $phone,
        ':address' => $address,
        ':birthday' => $birthday
    ]);
    $stmt = null;

    // 获取结果
    $result = $conn->query("SELECT @result_code AS code, @result_message AS message");
    $row = $result->fetch();

    if ($row['code'] == 1) {
        echo json_encode(['success' => true, 'message' => $row['message']]);
    } else {
        echo json_encode(['success' => false, 'message' => $row['message']]);
    }
}
?>
