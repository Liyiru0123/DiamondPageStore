<?php
require_once '../../config/database.php';
header('Content-Type: application/json');

$order_id = isset($_GET['order_id']) ? intval($_GET['order_id']) : 0;

if (!$order_id) {
    echo json_encode(['success' => false, 'message' => 'Invalid Order ID']);
    exit;
}

try {
    $db = getDB();
    $stmt = $db->prepare("SELECT * FROM vw_staff_order_details_full WHERE order_id = ?");
    $stmt->execute([$order_id]);
    $items = $stmt->fetchAll();

    if (empty($items)) {
        echo json_encode(['success' => false, 'message' => 'Order not found']);
        exit;
    }

    // 聚合订单基本信息和商品列表
    $order_info = [
        'order_id' => $items[0]['order_id'],
        'customer_name' => $items[0]['customer_name'],
        'order_status' => $items[0]['order_status'],
        'order_date' => $items[0]['order_date'],
        'note' => $items[0]['note'],
        'items' => []
    ];

    $total_amount = 0;
    foreach ($items as $item) {
        $order_info['items'][] = [
            'book_title' => $item['book_title'],
            'isbn' => $item['ISBN'],
            'quantity' => $item['quantity'],
            'unit_price' => $item['unit_price'],
            'subtotal' => $item['subtotal']
        ];
        $total_amount += $item['subtotal'];
    }
    $order_info['total_amount'] = $total_amount;

    echo json_encode(['success' => true, 'data' => $order_info]);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
