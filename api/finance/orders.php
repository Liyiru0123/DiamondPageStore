<?php
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
        case 'list':
            $search = isset($_GET['search']) ? $_GET['search'] : null;
            $status = isset($_GET['status']) ? $_GET['status'] : null;
            $storeId = isset($_GET['store_id']) ? (int)$_GET['store_id'] : 0;
            $start = isset($_GET['start_date']) ? $_GET['start_date'] : null;
            $end = isset($_GET['end_date']) ? $_GET['end_date'] : null;
            
            // 【新增】接收精确的 order_id 参数
            // 如果前端传的是空字符串，转为 null 或 0，避免 SQL 报错
            $orderIdFilter = isset($_GET['order_id']) && $_GET['order_id'] !== '' ? (int)$_GET['order_id'] : null;
            
            $stmt = $conn->prepare('CALL sp_finance_order_list(:search, :status, :store_id, :start_date, :end_date, :order_id)');
            $stmt->execute([
                ':search' => $search,
                ':status' => $status,
                ':store_id' => $storeId,
                ':start_date' => $start,
                ':end_date' => $end,
                ':order_id' => $orderIdFilter // 传入新参数
            ]);
            $rows = $stmt->fetchAll();

            $data = [];
            foreach ($rows as $row) {
                $data[] = [
                    // --- 基础信息 ---
                    'orderId'     => (int)$row['order_id'],
                    'storeId'     => (int)$row['store_id'],
                    // 如果视图里没有 store_name，这里给个空字符串防止前端报错，或者你需要在 SP 里 join stores 表
                    'storeName'   => isset($row['store_name']) ? $row['store_name'] : 'Store #' . $row['store_id'],
                    
                    // --- 会员信息 ---
                    'memberId'    => (int)$row['member_id'],
                    'memberName'  => isset($row['member_name']) ? $row['member_name'] : 'Guest', // 来自 SP 的 JOIN
                    
                    // --- 订单状态与日期 ---
                    'orderStatus' => $row['order_status'],
                    'orderDate'   => $row['order_date'],
                    'note'        => $row['note'],
                    'isSettled'   => (int)$row['is_settled'], // 新增字段：是否已结算
                    
                    // --- 金额详情 (对应截图中的 decimal 字段) ---
                    'grossAmount'        => (float)$row['gross_amount'],           // 原始总额
                    'discountRate'       => (float)$row['discount_rate'],          // 折扣率
                    'discountedAmount'   => (float)$row['discounted_amount'],      // 折后金额
                    'pointsDiscountAmount'=> (float)($row['points_discount_amount'] ?? 0), // 积分抵扣金额
                    'payableAmount'      => (float)$row['payable_amount'],         // 应付金额
                    'paidAmount'         => (float)$row['paid_amount'],            // 实付金额
                    'lastPaidAt'         => $row['last_paid_at'],                  // 最后支付时间
                    
                    // --- 积分详情 ---
                    'earnPointRate'      => (float)$row['earn_point_rate'],        // 积分倍率
                    'earnedPoints'       => (float)$row['earned_points'],          // 获得积分
                    'expectedEarnedPoints'=> (float)$row['expected_earned_points'],// 预计获得积分
                    'redeemedPoints'     => (float)$row['redeemed_points'],        // 使用积分
                    /*'orderId' => (int)$row['order_id'],
                    'storeId' => (int)$row['store_id'],
                    'storeName' => $row['store_name'],
                    'memberId' => (int)$row['member_id'],
                    'memberName' => $row['member_name'],
                    'orderStatus' => $row['order_status'],
                    'orderDate' => $row['order_date'],
                    'note' => $row['note'],
                    'payableAmount' => (float)$row['payable_amount'],
                    'paidAmount' => (float)$row['paid_amount'],
                    'itemCount' => (int)$row['item_count'],
                    'totalQuantity' => (int)$row['total_quantity']*/
                ];
            }

            echo json_encode(['success' => true, 'data' => $data]);
            break;

        case 'detail':
            case 'detail':
            $orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
            if ($orderId === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'order_id is required']);
                exit();
            }

            // 1. 调用存储过程
            $stmt = $conn->prepare('CALL sp_finance_order_detail(:order_id)');
            $stmt->execute([':order_id' => $orderId]);

            // --- 第一张表：订单主信息 ---
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            // --- 第二张表：商品列表 ---
            $stmt->nextRowset();
            $itemsRaw = $stmt->fetchAll(PDO::FETCH_ASSOC);

            if (!$row) {
                echo json_encode(['success' => false, 'message' => 'Order not found']);
                exit;
            }

            // 2. 【核心映射】(现在完全对应你的新 SP)
            $orderData = [
                // --- 基础信息 ---
                'orderId'     => $row['order_id'],
                'storeName'   => $row['store_name'],   // 对应 SP: AS store_name
                'memberId'    => $row['member_id'],
                'memberName'  => $row['member_name'],  // 对应 SP: AS member_name
                'orderStatus' => $row['order_status'],
                'orderDate'   => $row['order_date'],
                'note'        => $row['note'],
                
                // --- 金额信息 (以前是假数据，现在改回读真实字段) ---
                'grossAmount'          => (float)$row['gross_amount'],           // ✅ 读真实数据
                'discountRate'         => (float)$row['discount_rate'],          // ✅ 读真实数据
                'discountedAmount'     => (float)$row['discounted_amount'],      // ✅ 读真实数据
                'redeemedPoints'       => (float)$row['redeemed_points'],        // ✅ 读真实数据
                'pointsDiscountAmount' => (float)$row['points_discount_amount'], // ✅ 读真实数据
                'payableAmount'        => (float)$row['payable_amount'],
                'paidAmount'           => (float)$row['paid_amount'],
                
                // --- 统计信息 ---
                'itemCount'     => (int)$row['item_count'],      // 对应 SP 子查询
                'totalQuantity' => (int)$row['total_quantity'],  // 对应 SP 子查询

                // --- 补充字段 (SP没查这些，给默认值防止JS报错) ---
                // 'paymentMethod'   => 'Standard', 
                // 'shippingAddress' => $row['store_name']
            ];

            // 3. 处理商品列表
            $itemsData = [];
            foreach ($itemsRaw as $item) {
                $itemsData[] = [
                    'sku'       => $item['sku_id'],
                    'isbn'      => $item['ISBN'],       // SP 新增了 ISBN，这里也可以加上
                    'name'      => $item['book_title'], // 对应 SP: AS book_title
                    'quantity'  => (int)$item['quantity'],
                    'unitPrice' => (float)$item['unit_price'],
                    'subtotal'  => (float)$item['subtotal']
                ];
            }

            // 4. 输出 JSON
            echo json_encode([
                'success' => true, 
                'data' => [
                    'order' => $orderData, 
                    'items' => $itemsData
                ]
            ]);
            break;
           /*$orderId = isset($_GET['order_id']) ? (int)$_GET['order_id'] : 0;
            if ($orderId === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'order_id is required']);
                exit();
            }

            $stmt = $conn->prepare('CALL sp_finance_order_detail(:order_id)');
            $stmt->execute([':order_id' => $orderId]);

            $order = $stmt->fetch();
            $stmt->nextRowset();
            $items = $stmt->fetchAll();

            echo json_encode(['success' => true, 'data' => ['order' => $order, 'items' => $items]]);
            break;*/
            

        case 'create_invoice':
            $payload = json_decode(file_get_contents('php://input'), true);
            $orderId = isset($payload['order_id']) ? (int)$payload['order_id'] : 0;

            if ($orderId === 0) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'order_id is required']);
                exit();
            }

            $stmt = $conn->prepare('CALL sp_finance_create_invoice(:order_id, @invoice_id, @code, @msg)');
            $stmt->execute([':order_id' => $orderId]);
            $stmt->closeCursor();

            $row = $conn->query('SELECT @invoice_id AS invoice_id, @code AS code, @msg AS message')->fetch();

            if ((int)$row['code'] === 1) {
                echo json_encode(['success' => true, 'data' => ['invoiceId' => (int)$row['invoice_id']], 'message' => $row['message']]);
            } else {
                echo json_encode(['success' => false, 'message' => $row['message']]);
            }
            break;

        default:
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
