<?php
/**
 * Manager - Employees API
 * 员工管理接口
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
            listEmployees($conn);
            break;

        case 'detail':
            getEmployeeDetail($conn);
            break;

        case 'performance':
            getEmployeePerformance($conn);
            break;

        case 'by_store':
            getEmployeesByStore($conn);
            break;

        case 'add':
            addEmployee($conn);
            break;

        case 'update':
            updateEmployee($conn);
            break;

        case 'delete':
            deleteEmployee($conn);
            break;

        case 'search':
            searchEmployees($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, performance, by_store, add, update, delete, search'
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
 * 获取员工列表（使用视图）
 */
function listEmployees($conn) {
    $sql = "SELECT * FROM vw_manager_employees ORDER BY employee_id";

    // 支持按店铺筛选
    $params = [];
    if (isset($_GET['store_id']) && $_GET['store_id'] !== '') {
        $sql = str_replace("ORDER BY", "WHERE store_id = :store_id ORDER BY", $sql);
        $params[':store_id'] = intval($_GET['store_id']);
    }

    // 支持按职位筛选
    if (isset($_GET['job_title_id']) && $_GET['job_title_id'] !== '') {
        if (strpos($sql, 'WHERE') !== false) {
            $sql = str_replace("ORDER BY", "AND job_title_id = :job_title_id ORDER BY", $sql);
        } else {
            $sql = str_replace("ORDER BY", "WHERE job_title_id = :job_title_id ORDER BY", $sql);
        }
        $params[':job_title_id'] = intval($_GET['job_title_id']);
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);
    $employees = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Employees retrieved successfully',
        'data' => $employees,
        'count' => count($employees)
    ]);
}

/**
 * 获取员工详情
 */
function getEmployeeDetail($conn) {
    if (!isset($_GET['employee_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'employee_id is required'
        ]);
        return;
    }

    $employeeId = intval($_GET['employee_id']);

    $sql = "SELECT * FROM vw_manager_employees WHERE employee_id = :employee_id";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':employee_id', $employeeId, PDO::PARAM_INT);
    $stmt->execute();
    $employee = $stmt->fetch();

    if (!$employee) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Employee not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Employee detail retrieved successfully',
        'data' => $employee
    ]);
}

/**
 * 获取员工绩效列表
 */
function getEmployeePerformance($conn) {
    $sql = "SELECT * FROM vw_manager_employee_performance ORDER BY performance DESC";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $performance = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Employee performance retrieved successfully',
        'data' => $performance,
        'count' => count($performance)
    ]);
}

/**
 * 按店铺获取员工分布
 */
function getEmployeesByStore($conn) {
    $sql = "SELECT * FROM vw_manager_staff_by_store ORDER BY store_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $distribution = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Staff distribution retrieved successfully',
        'data' => $distribution,
        'count' => count($distribution)
    ]);
}

/**
 * 添加员工（调用存储过程）
 */
function addEmployee($conn) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON: ' . json_last_error_msg()
        ]);
        return;
    }

    if (!$data || !isset($data['user_id']) || !isset($data['first_name']) || !isset($data['last_name']) ||
        !isset($data['store_id']) || !isset($data['job_title_id']) || !isset($data['phone'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: user_id, first_name, last_name, store_id, job_title_id, phone'
        ]);
        return;
    }

    // Validate phone format (basic format: digits, spaces, hyphens, parentheses, plus sign)
    if (!preg_match('/^[\d\s\-\(\)\+]+$/', $data['phone']) || strlen($data['phone']) < 7 || strlen($data['phone']) > 20) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid phone number format'
        ]);
        return;
    }

    // Validate performance range if provided
    if (isset($data['performance']) && $data['performance'] !== null) {
        $performance = floatval($data['performance']);
        if ($performance < 0 || $performance > 100) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Performance score must be between 0 and 100'
            ]);
            return;
        }
    }

    $sql = "CALL sp_manager_add_employee(
        :user_id, :first_name, :last_name, :store_id, :job_title_id, :phone, :performance,
        @result_code, @result_message, @employee_id
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
    $stmt->bindParam(':first_name', $data['first_name'], PDO::PARAM_STR);
    $stmt->bindParam(':last_name', $data['last_name'], PDO::PARAM_STR);
    $stmt->bindParam(':store_id', $data['store_id'], PDO::PARAM_INT);
    $stmt->bindParam(':job_title_id', $data['job_title_id'], PDO::PARAM_INT);
    $stmt->bindParam(':phone', $data['phone'], PDO::PARAM_STR);

    $performance = isset($data['performance']) ? $data['performance'] : null;
    $stmt->bindParam(':performance', $performance, PDO::PARAM_STR);

    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message, @employee_id as employee_id")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'data' => ['employee_id' => $result['employee_id']]
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
 * 更新员工（调用存储过程）
 */
function updateEmployee($conn) {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid JSON: ' . json_last_error_msg()
        ]);
        return;
    }

    if (!$data || !isset($data['employee_id']) || !isset($data['first_name']) || !isset($data['last_name']) ||
        !isset($data['store_id']) || !isset($data['job_title_id']) || !isset($data['phone'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: employee_id, first_name, last_name, store_id, job_title_id, phone'
        ]);
        return;
    }

    // Validate phone format (basic format: digits, spaces, hyphens, parentheses, plus sign)
    if (!preg_match('/^[\d\s\-\(\)\+]+$/', $data['phone']) || strlen($data['phone']) < 7 || strlen($data['phone']) > 20) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid phone number format'
        ]);
        return;
    }

    // Validate performance range if provided
    if (isset($data['performance']) && $data['performance'] !== null) {
        $performance = floatval($data['performance']);
        if ($performance < 0 || $performance > 100) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Performance score must be between 0 and 100'
            ]);
            return;
        }
    }

    $sql = "CALL sp_manager_update_employee(
        :employee_id, :user_id, :first_name, :last_name, :store_id, :job_title_id, :phone, :performance,
        @result_code, @result_message
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':employee_id', $data['employee_id'], PDO::PARAM_INT);
    $userId = isset($data['user_id']) ? $data['user_id'] : null;
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->bindParam(':first_name', $data['first_name'], PDO::PARAM_STR);
    $stmt->bindParam(':last_name', $data['last_name'], PDO::PARAM_STR);
    $stmt->bindParam(':store_id', $data['store_id'], PDO::PARAM_INT);
    $stmt->bindParam(':job_title_id', $data['job_title_id'], PDO::PARAM_INT);
    $stmt->bindParam(':phone', $data['phone'], PDO::PARAM_STR);

    $performance = isset($data['performance']) ? $data['performance'] : null;
    $stmt->bindParam(':performance', $performance, PDO::PARAM_STR);

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
 * 删除员工（调用存储过程）
 */
function deleteEmployee($conn) {
    if (!isset($_GET['employee_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'employee_id is required'
        ]);
        return;
    }

    $employeeId = intval($_GET['employee_id']);

    $sql = "CALL sp_manager_delete_employee(:employee_id, @result_code, @result_message)";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':employee_id', $employeeId, PDO::PARAM_INT);
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
 * 搜索员工
 */
function searchEmployees($conn) {
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

    if ($keyword === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'keyword is required'
        ]);
        return;
    }

    $sql = "SELECT * FROM vw_manager_employees
            WHERE full_name LIKE :keyword
            OR phone LIKE :keyword
            OR username LIKE :keyword
            ORDER BY employee_id";

    $searchTerm = "%$keyword%";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':keyword', $searchTerm, PDO::PARAM_STR);
    $stmt->execute();
    $employees = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Search completed successfully',
        'data' => $employees,
        'count' => count($employees)
    ]);
}
?>
