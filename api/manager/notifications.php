<?php
/**
 * Manager - Notifications API
 * 通知管理接口
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
            listNotifications($conn);
            break;

        case 'detail':
            getNotificationDetail($conn);
            break;

        case 'create':
            createNotification($conn);
            break;

        case 'update':
            updateNotification($conn);
            break;

        case 'delete':
            deleteNotification($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, create, update, delete'
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
 * 获取通知列表
 */
function listNotifications($conn) {
    $sql = "SELECT * FROM announcements ORDER BY publish_at DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $notifications = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Notifications retrieved successfully',
        'data' => $notifications,
        'count' => count($notifications)
    ]);
}

/**
 * 获取通知详情
 */
function getNotificationDetail($conn) {
    if (!isset($_GET['announcement_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'announcement_id is required'
        ]);
        return;
    }

    $announcementId = intval($_GET['announcement_id']);

    $sql = "SELECT * FROM announcements WHERE announcement_id = :announcement_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':announcement_id', $announcementId, PDO::PARAM_INT);
    $stmt->execute();
    $notification = $stmt->fetch();

    if (!$notification) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Notification not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Notification detail retrieved successfully',
        'data' => $notification
    ]);
}

/**
 * 创建通知（调用存储过程）
 */
function createNotification($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['title']) || !isset($data['content'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: title, content'
        ]);
        return;
    }

    $publishAt = isset($data['publish_at']) ? $data['publish_at'] : null;
    $expireAt = isset($data['expire_at']) ? $data['expire_at'] : null;

    $sql = "CALL sp_manager_send_notification(
        :title, :content, :publish_at, :expire_at,
        @result_code, @result_message, @announcement_id
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':title', $data['title'], PDO::PARAM_STR);
    $stmt->bindParam(':content', $data['content'], PDO::PARAM_STR);
    $stmt->bindParam(':publish_at', $publishAt, PDO::PARAM_STR);
    $stmt->bindParam(':expire_at', $expireAt, PDO::PARAM_STR);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message, @announcement_id as announcement_id")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'data' => ['announcement_id' => $result['announcement_id']]
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
 * 更新通知
 */
function updateNotification($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['announcement_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'announcement_id is required'
        ]);
        return;
    }

    $updates = [];
    $params = [':announcement_id' => $data['announcement_id']];

    if (isset($data['title'])) {
        $updates[] = "title = :title";
        $params[':title'] = $data['title'];
    }

    if (isset($data['content'])) {
        $updates[] = "content = :content";
        $params[':content'] = $data['content'];
    }

    if (isset($data['publish_at'])) {
        $updates[] = "publish_at = :publish_at";
        $params[':publish_at'] = $data['publish_at'];
    }

    if (isset($data['expire_at'])) {
        $updates[] = "expire_at = :expire_at";
        $params[':expire_at'] = $data['expire_at'];
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No fields to update'
        ]);
        return;
    }

    $sql = "UPDATE announcements SET " . implode(', ', $updates) . " WHERE announcement_id = :announcement_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Notification not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Notification updated successfully'
    ]);
}

/**
 * 删除通知
 */
function deleteNotification($conn) {
    if (!isset($_GET['announcement_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'announcement_id is required'
        ]);
        return;
    }

    $announcementId = intval($_GET['announcement_id']);

    $sql = "DELETE FROM announcements WHERE announcement_id = :announcement_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':announcement_id', $announcementId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Notification not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Notification deleted successfully'
    ]);
}
?>
