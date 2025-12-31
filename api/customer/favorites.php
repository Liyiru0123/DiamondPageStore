<?php
/**
 * Customer Favorites API
 * 处理收藏相关的请求：添加、删除、获取列表
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
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

$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'list':
            getFavorites($conn);
            break;

        case 'add':
            addFavorite($conn);
            break;

        case 'remove':
            removeFavorite($conn);
            break;

        case 'check':
            checkFavorite($conn);
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
 * 获取用户收藏列表
 */
function getFavorites($conn) {
    $memberId = isset($_GET['member_id']) ? intval($_GET['member_id']) : 0;

    if ($memberId === 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID is required']);
        return;
    }

    $stmt = $conn->prepare(
        "SELECT vf.*,
                COALESCE(favs.fav_count, 0) AS fav_count
         FROM vw_customer_favorites vf
         LEFT JOIN (
             SELECT ISBN, COUNT(DISTINCT member_id) AS fav_count
             FROM favorites
             GROUP BY ISBN
         ) favs ON favs.ISBN = vf.ISBN
         WHERE vf.member_id = :member_id
         ORDER BY vf.create_date DESC"
    );
    $stmt->execute([':member_id' => $memberId]);

    $favorites = [];
    while ($row = $stmt->fetch()) {
        $favorites[] = [
            'id' => $row['sku_id'],
            'isbn' => $row['ISBN'],
            'title' => $row['title'],
            'author' => $row['author'],
            'language' => $row['language'],
            'category' => $row['category'],
            'publisher' => $row['publisher'],
            'price' => (float)$row['price'],
            'binding' => $row['binding'],
            'stock' => (int)$row['stock'],
            'storeName' => $row['store_name'],
            'description' => $row['description'],
            'createDate' => $row['create_date'],
            'favCount' => (int)$row['fav_count']
        ];
    }

    echo json_encode(['success' => true, 'data' => $favorites, 'count' => count($favorites)]);
}

/**
 * 添加收藏（调用存储过程）
 */
function addFavorite($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $memberId = isset($data['member_id']) ? intval($data['member_id']) : 0;
    $isbn = isset($data['isbn']) ? $data['isbn'] : '';

    if ($memberId === 0 || empty($isbn)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID and ISBN are required']);
        return;
    }

    // 调用存储过程
    $stmt = $conn->prepare("CALL sp_customer_add_favorite(:member_id, :isbn, @result_code, @result_message)");
    $stmt->execute([
        ':member_id' => $memberId,
        ':isbn' => $isbn
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

/**
 * 取消收藏（调用存储过程）
 */
function removeFavorite($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $memberId = isset($data['member_id']) ? intval($data['member_id']) : 0;
    $isbn = isset($data['isbn']) ? $data['isbn'] : '';

    if ($memberId === 0 || empty($isbn)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID and ISBN are required']);
        return;
    }

    // 调用存储过程
    $stmt = $conn->prepare("CALL sp_customer_remove_favorite(:member_id, :isbn, @result_code, @result_message)");
    $stmt->execute([
        ':member_id' => $memberId,
        ':isbn' => $isbn
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

/**
 * 检查是否已收藏
 */
function checkFavorite($conn) {
    $memberId = isset($_GET['member_id']) ? intval($_GET['member_id']) : 0;
    $isbn = isset($_GET['isbn']) ? $_GET['isbn'] : '';

    if ($memberId === 0 || empty($isbn)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Member ID and ISBN are required']);
        return;
    }

    $stmt = $conn->prepare("SELECT COUNT(*) as is_favorite FROM favorites WHERE member_id = :member_id AND ISBN = :isbn");
    $stmt->execute([
        ':member_id' => $memberId,
        ':isbn' => $isbn
    ]);
    $row = $stmt->fetch();

    echo json_encode([
        'success' => true,
        'is_favorite' => $row['is_favorite'] > 0
    ]);
}
?>
