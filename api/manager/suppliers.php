<?php
/**
 * Manager - Suppliers API
 * 供应商管理接口
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
            listSuppliers($conn);
            break;

        case 'detail':
            getSupplierDetail($conn);
            break;

        case 'add':
            addSupplier($conn);
            break;

        case 'update':
            updateSupplier($conn);
            break;

        case 'delete':
            deleteSupplier($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, add, update, delete'
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
 * 获取供应商列表（使用视图）
 */
function listSuppliers($conn) {
    $sql = "SELECT * FROM vw_manager_suppliers ORDER BY supplier_name";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $suppliers = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Suppliers retrieved successfully',
        'data' => $suppliers,
        'count' => count($suppliers)
    ]);
}

/**
 * 获取供应商详情
 */
function getSupplierDetail($conn) {
    if (!isset($_GET['supplier_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'supplier_id is required'
        ]);
        return;
    }

    $supplierId = intval($_GET['supplier_id']);

    $sql = "SELECT * FROM vw_manager_suppliers WHERE supplier_id = :supplier_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':supplier_id', $supplierId, PDO::PARAM_INT);
    $stmt->execute();
    $supplier = $stmt->fetch();

    if (!$supplier) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Supplier not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Supplier detail retrieved successfully',
        'data' => $supplier
    ]);
}

/**
 * 添加供应商（调用存储过程）
 */
function addSupplier($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['name']) || !isset($data['phone'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: name, phone'
        ]);
        return;
    }

    $email = isset($data['email']) ? $data['email'] : null;
    $address = isset($data['address']) ? $data['address'] : null;

    $sql = "CALL sp_manager_add_supplier(
        :name, :phone, :email, :address,
        @result_code, @result_message, @supplier_id
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':name', $data['name'], PDO::PARAM_STR);
    $stmt->bindParam(':phone', $data['phone'], PDO::PARAM_STR);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':address', $address, PDO::PARAM_STR);
    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message, @supplier_id as supplier_id")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'data' => ['supplier_id' => $result['supplier_id']]
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
 * 更新供应商信息
 */
function updateSupplier($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (!$data || !isset($data['supplier_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'supplier_id is required'
        ]);
        return;
    }

    $updates = [];
    $params = [':supplier_id' => $data['supplier_id']];

    if (isset($data['name'])) {
        $updates[] = "name = :name";
        $params[':name'] = $data['name'];
    }

    if (isset($data['phone'])) {
        $updates[] = "phone = :phone";
        $params[':phone'] = $data['phone'];
    }

    if (isset($data['email'])) {
        $updates[] = "email = :email";
        $params[':email'] = $data['email'];
    }

    if (isset($data['address'])) {
        $updates[] = "address = :address";
        $params[':address'] = $data['address'];
    }

    if (empty($updates)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'No fields to update'
        ]);
        return;
    }

    $sql = "UPDATE suppliers SET " . implode(', ', $updates) . " WHERE supplier_id = :supplier_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Supplier not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Supplier updated successfully'
    ]);
}

/**
 * 删除供应商
 */
function deleteSupplier($conn) {
    if (!isset($_GET['supplier_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'supplier_id is required'
        ]);
        return;
    }

    $supplierId = intval($_GET['supplier_id']);

    // 检查是否有关联的采购单
    $checkSql = "SELECT COUNT(*) as purchase_count FROM purchases WHERE supplier_id = :supplier_id";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':supplier_id', $supplierId, PDO::PARAM_INT);
    $checkStmt->execute();
    $result = $checkStmt->fetch();

    if ($result['purchase_count'] > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Cannot delete supplier with associated purchases'
        ]);
        return;
    }

    $sql = "DELETE FROM suppliers WHERE supplier_id = :supplier_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':supplier_id', $supplierId, PDO::PARAM_INT);
    $stmt->execute();

    if ($stmt->rowCount() === 0) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Supplier not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Supplier deleted successfully'
    ]);
}
?>
