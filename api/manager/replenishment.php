<?php
/**
 * Manager - Replenishment API
 * 补货申请管理接口
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
            listReplenishmentRequests($conn);
            break;

        case 'detail':
            getRequestDetail($conn);
            break;

        case 'create':
            createRequest($conn);
            break;

        case 'approve':
            approveRequest($conn);
            break;

        case 'reject':
            rejectRequest($conn);
            break;

        case 'complete':
            completeRequest($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, create, approve, reject, complete'
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
 * 获取补货申请列表（使用视图）
 */
function listReplenishmentRequests($conn) {
    $sql = "SELECT * FROM vw_manager_replenishment_requests WHERE 1=1";

    $params = [];

    // 按店铺筛选
    if (isset($_GET['store_id']) && $_GET['store_id'] !== '') {
        $sql .= " AND store_id = :store_id";
        $params[':store_id'] = intval($_GET['store_id']);
    }

    // 按状态筛选
    if (isset($_GET['status']) && $_GET['status'] !== '') {
        $sql .= " AND status = :status";
        $params[':status'] = $_GET['status'];
    }

    // 按紧急程度筛选
    if (isset($_GET['urgency_level']) && $_GET['urgency_level'] !== '') {
        $sql .= " AND urgency_level = :urgency_level";
        $params[':urgency_level'] = $_GET['urgency_level'];
    }

    // 按日期范围筛选
    if (isset($_GET['date_from']) && $_GET['date_from'] !== '') {
        $sql .= " AND request_date >= :date_from";
        $params[':date_from'] = $_GET['date_from'];
    }

    if (isset($_GET['date_to']) && $_GET['date_to'] !== '') {
        $sql .= " AND request_date <= :date_to";
        $params[':date_to'] = $_GET['date_to'];
    }

    $sql .= " ORDER BY FIELD(status, 'pending', 'approved', 'completed', 'rejected'),
                       FIELD(urgency_level, 'high', 'medium', 'low'),
                       request_date DESC";

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $requests = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Replenishment requests retrieved successfully',
        'data' => $requests,
        'count' => count($requests)
    ]);
}

/**
 * 获取补货申请详情
 */
function getRequestDetail($conn) {
    if (!isset($_GET['request_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'request_id is required'
        ]);
        return;
    }

    $requestId = intval($_GET['request_id']);

    $sql = "SELECT * FROM vw_manager_replenishment_requests WHERE request_id = :request_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':request_id', $requestId, PDO::PARAM_INT);
    $stmt->execute();
    $request = $stmt->fetch();

    if (!$request) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Request not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Request detail retrieved successfully',
        'data' => $request
    ]);
}

/**
 * 创建补货申请（调用存储过程）
 */
function createRequest($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['store_id']) || !isset($data['sku_id']) || !isset($data['requested_quantity'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: store_id, sku_id, requested_quantity'
        ]);
        return;
    }

    $urgencyLevel = isset($data['urgency_level']) ? $data['urgency_level'] : 'medium';
    $requestedBy = isset($data['requested_by']) ? $data['requested_by'] : null;
    $reason = isset($data['reason']) ? $data['reason'] : null;

    $sql = "CALL sp_manager_create_replenishment_request(
        :store_id, :sku_id, :requested_quantity, :urgency_level, :requested_by, :reason,
        @result_code, @result_message, @request_id
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':store_id', $data['store_id'], PDO::PARAM_INT);
    $stmt->bindParam(':sku_id', $data['sku_id'], PDO::PARAM_INT);
    $stmt->bindParam(':requested_quantity', $data['requested_quantity'], PDO::PARAM_INT);
    $stmt->bindParam(':urgency_level', $urgencyLevel, PDO::PARAM_STR);
    $stmt->bindParam(':requested_by', $requestedBy, PDO::PARAM_INT);
    $stmt->bindParam(':reason', $reason, PDO::PARAM_STR);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message, @request_id as request_id")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'data' => ['request_id' => $result['request_id']]
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
 * 批准补货申请（调用存储过程）
 */
function approveRequest($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['request_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'request_id is required'
        ]);
        return;
    }

    $approvedBy = isset($data['approved_by']) ? $data['approved_by'] : null;
    $note = isset($data['note']) ? $data['note'] : null;

    $sql = "CALL sp_manager_approve_request(
        :request_id, :approved_by, :note,
        @result_code, @result_message
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':request_id', $data['request_id'], PDO::PARAM_INT);
    $stmt->bindParam(':approved_by', $approvedBy, PDO::PARAM_INT);
    $stmt->bindParam(':note', $note, PDO::PARAM_STR);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message']
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
 * 拒绝补货申请（调用存储过程）
 */
function rejectRequest($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['request_id']) || !isset($data['rejection_reason'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: request_id, rejection_reason'
        ]);
        return;
    }

    $approvedBy = isset($data['approved_by']) ? $data['approved_by'] : null;

    $sql = "CALL sp_manager_reject_request(
        :request_id, :approved_by, :rejection_reason,
        @result_code, @result_message
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':request_id', $data['request_id'], PDO::PARAM_INT);
    $stmt->bindParam(':approved_by', $approvedBy, PDO::PARAM_INT);
    $stmt->bindParam(':rejection_reason', $data['rejection_reason'], PDO::PARAM_STR);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message']
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
 * 标记补货申请为完成
 */
function completeRequest($conn) {
    if (!isset($_GET['request_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'request_id is required'
        ]);
        return;
    }

    $requestId = intval($_GET['request_id']);

    // 验证状态是否为approved
    $checkSql = "SELECT status FROM replenishment_requests WHERE request_id = :request_id";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':request_id', $requestId, PDO::PARAM_INT);
    $checkStmt->execute();
    $request = $checkStmt->fetch();

    if (!$request) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Request not found'
        ]);
        return;
    }

    if ($request['status'] !== 'approved') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Only approved requests can be marked as completed'
        ]);
        return;
    }

    // 更新状态
    $sql = "UPDATE replenishment_requests
            SET status = 'completed', completed_date = CURRENT_TIMESTAMP
            WHERE request_id = :request_id";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':request_id', $requestId, PDO::PARAM_INT);
    $stmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Request marked as completed successfully'
    ]);
}
?>
