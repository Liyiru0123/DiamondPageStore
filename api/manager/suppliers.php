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

        case 'search':
            searchSuppliers($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, add, update, delete, search'
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
 * 更新供应商信息（调用存储过程）
 */
function updateSupplier($conn) {
    $data = json_decode(file_get_contents('php://input'), true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON: ' . json_last_error_msg()
        ]);
        return;
    }

    if (!$data || !isset($data['supplier_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'supplier_id is required'
        ]);
        return;
    }

    // 准备参数
    $name = isset($data['name']) ? $data['name'] : null;
    $phone = isset($data['phone']) ? $data['phone'] : null;
    $email = isset($data['email']) ? $data['email'] : null;
    $address = isset($data['address']) ? $data['address'] : null;

    // 调用存储过程
    $sql = "CALL sp_manager_update_supplier(
        :supplier_id, :name, :phone, :email, :address,
        @result_code, @result_message
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':supplier_id', $data['supplier_id'], PDO::PARAM_INT);
    $stmt->bindParam(':name', $name, PDO::PARAM_STR);
    $stmt->bindParam(':phone', $phone, PDO::PARAM_STR);
    $stmt->bindParam(':email', $email, PDO::PARAM_STR);
    $stmt->bindParam(':address', $address, PDO::PARAM_STR);
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
 * 删除供应商（调用存储过程）
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

    $checkSql = "SELECT supplier_id FROM suppliers WHERE supplier_id = :supplier_id";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':supplier_id', $supplierId, PDO::PARAM_INT);
    $checkStmt->execute();
    $supplier = $checkStmt->fetch();

    if (!$supplier) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Supplier not found'
        ]);
        return;
    }

    $purchaseStmt = $conn->prepare("SELECT COUNT(*) AS cnt FROM purchases WHERE supplier_id = :supplier_id");
    $purchaseStmt->bindParam(':supplier_id', $supplierId, PDO::PARAM_INT);
    $purchaseStmt->execute();
    $purchaseCount = $purchaseStmt->fetch();

    if ($purchaseCount && intval($purchaseCount['cnt']) > 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Supplier has associated purchase orders, cannot delete'
        ]);
        return;
    }

    $delStmt = $conn->prepare("DELETE FROM suppliers WHERE supplier_id = :supplier_id");
    $delStmt->bindParam(':supplier_id', $supplierId, PDO::PARAM_INT);
    $delStmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Supplier deleted successfully'
    ]);
}

/**
 * Search suppliers
 */
function searchSuppliers($conn) {
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

    if ($keyword === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'keyword is required'
        ]);
        return;
    }

    $sql = "SELECT v.*
            FROM vw_manager_suppliers v
            JOIN suppliers s ON v.supplier_id = s.supplier_id
            WHERE (
                MATCH(s.name, s.address, s.email) AGAINST (:kw1 IN NATURAL LANGUAGE MODE)
                OR s.name LIKE :kw_like3
                OR s.address LIKE :kw_like4
                OR s.email LIKE :kw_like5
                OR CAST(s.supplier_id AS CHAR) LIKE :kw_like1
                OR CAST(s.phone AS CHAR) LIKE :kw_like2
            )
            ORDER BY v.supplier_name";

    $likeTerm = "%$keyword%";
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':kw1', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like1', $likeTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like2', $likeTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like3', $likeTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like4', $likeTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like5', $likeTerm, PDO::PARAM_STR);
    $stmt->execute();
    $suppliers = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Search completed successfully',
        'data' => $suppliers,
        'count' => count($suppliers)
    ]);
}
?>
