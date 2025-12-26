<?php
/**
 * Customer Announcements API
 * 处理公告相关的请求：获取公告列表
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

try {
    getAnnouncements($conn);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Server error: ' . $e->getMessage()]);
}

/**
 * 获取公告列表（使用视图）
 */
function getAnnouncements($conn) {
    // 使用视图查询有效的公告
    $stmt = $conn->query("SELECT * FROM vw_customer_announcements LIMIT 20");

    $announcements = [];
    while ($row = $stmt->fetch()) {
        $announcements[] = [
            'id' => $row['announcement_id'],
            'title' => $row['title'],
            'content' => $row['content'],
            'publishAt' => $row['publish_at'],
            'expireAt' => $row['expire_at']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $announcements,
        'count' => count($announcements)
    ]);
}
?>
