<?php
/**
 * Customer Member API
 * 处理会员信息相关的请求：获取会员等级、积分、消费记录
 */

header('Content-Type: application/json; charset=utf-8');
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
    echo json_encode(['success' => false, 'message' => 'Database connection failed']);
    exit();
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'info':
            getMemberInfo($conn);
            break;

        case 'tiers':
            getMemberTiers($conn);
            break;

        case 'update_tier':
            updateMemberTier($conn);
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
 * 获取会员信息（使用视图）
 */
function getMemberInfo($conn) {
    $memberId = isset($_GET['member_id']) ? intval($_GET['member_id']) : 0;

    if ($memberId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID is required']);
        return;
    }

    $stmt = $conn->prepare("SELECT * FROM vw_customer_member_info WHERE member_id = :member_id");
    $stmt->execute([':member_id' => $memberId]);

    if ($row = $stmt->fetch()) {
        echo json_encode([
            'success' => true,
            'data' => [
                'memberId' => $row['member_id'],
                'userId' => $row['user_id'],
                'firstName' => $row['first_name'],
                'lastName' => $row['last_name'],
                'username' => $row['username'],
                'phone' => $row['phone'],
                'points' => (int)$row['points'],
                'address' => $row['address'],
                'birthday' => $row['birthday'],
                'tier' => [
                    'tierId' => $row['member_tier_id'],
                    'name' => $row['tier_name'],
                    'discount' => (float)$row['discount'],
                    'discountPercent' => round((1 - (float)$row['discount']) * 100, 0),
                    'minTotalSpent' => (float)$row['min_total_spent']
                ],
                'totalSpent' => (float)$row['total_spent']
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Member not found']);
    }
}

/**
 * 获取所有会员等级列表
 */
function getMemberTiers($conn) {
    $stmt = $conn->query("SELECT * FROM member_tiers ORDER BY min_lifetime_spend ASC");
    $tiers = [];

    while ($row = $stmt->fetch()) {
        $tiers[] = [
            'tierId' => $row['member_tier_id'],
            'name' => $row['name'],
            'discount' => (float)$row['discount_rate'],
            'discountPercent' => round((1 - (float)$row['discount_rate']) * 100, 0),
            'minTotalSpent' => (float)$row['min_lifetime_spend']
        ];
    }

    echo json_encode(['success' => true, 'data' => $tiers]);
}

/**
 * 更新会员等级（调用存储过程）
 * 根据会员消费金额自动升级
 */
function updateMemberTier($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $memberId = isset($data['member_id']) ? intval($data['member_id']) : 0;

    if ($memberId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID is required']);
        return;
    }

    // 调用存储过程
    $stmt = $conn->prepare("CALL sp_customer_update_member_tier(:member_id, @result_code, @result_message)");
    $stmt->execute([':member_id' => $memberId]);
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
