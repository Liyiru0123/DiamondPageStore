<?php
/**
 * Customer Cart API
 * 处理购物车价格计算
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
        case 'calculate':
            calculateCartTotal($conn);
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
 * 计算购物车总价
 * 接收购物车商品列表，返回计算后的价格信息
 */
function calculateCartTotal($conn) {
    $data = json_decode(file_get_contents('php://input'), true);
    $cartItems = isset($data['cart_items']) ? $data['cart_items'] : [];
    $memberId = isset($data['member_id']) ? intval($data['member_id']) : 0;

    if (empty($cartItems)) {
        echo json_encode([
            'success' => true,
            'data' => [
                'subtotal' => 0,
                'discount' => 0,
                'discountRate' => 0,
                'total' => 0,
                'items' => []
            ]
        ]);
        return;
    }

    // 获取会员折扣率
    $discountRate = 1.0; // 默认无折扣
    if ($memberId > 0) {
        $stmt = $conn->prepare("
            SELECT discount_rate
            FROM vw_customer_member_discount
            WHERE member_id = :member_id
        ");
        $stmt->execute([':member_id' => $memberId]);
        $memberData = $stmt->fetch();
        if ($memberData) {
            $discountRate = floatval($memberData['discount_rate']);
        }
    }

    // 计算每个商品的价格
    $items = [];
    $subtotal = 0;

    foreach ($cartItems as $item) {
        $skuId = isset($item['sku_id']) ? intval($item['sku_id']) : 0;
        $quantity = isset($item['quantity']) ? intval($item['quantity']) : 1;

        if ($skuId === 0 || $quantity <= 0) {
            continue;
        }

        // 从数据库获取当前价格（防止前端篡改）
        $stmt = $conn->prepare("
            SELECT unit_price, title, sku_id
            FROM vw_customer_cart_item_detail
            WHERE sku_id = :sku_id
        ");
        $stmt->execute([':sku_id' => $skuId]);
        $product = $stmt->fetch();

        if (!$product) {
            continue;
        }

        $unitPrice = floatval($product['unit_price']);
        $itemSubtotal = $unitPrice * $quantity;
        $itemTotal = $itemSubtotal * $discountRate;

        $items[] = [
            'sku_id' => $skuId,
            'title' => $product['title'],
            'unit_price' => $unitPrice,
            'quantity' => $quantity,
            'subtotal' => round($itemSubtotal, 2),
            'total' => round($itemTotal, 2)
        ];

        $subtotal += $itemSubtotal;
    }

    // 计算总价
    $total = $subtotal * $discountRate;
    $discountAmount = $subtotal - $total;

    echo json_encode([
        'success' => true,
        'data' => [
            'subtotal' => round($subtotal, 2),
            'discount' => round($discountAmount, 2),
            'discountRate' => $discountRate,
            'discountPercent' => round((1 - $discountRate) * 100, 0),
            'total' => round($total, 2),
            'items' => $items
        ]
    ]);
}
?>
