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
 * 添加员工（支持指定 employee_id）
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
        !isset($data['store_id']) || !isset($data['job_title_id']) || !isset($data['email'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: user_id, first_name, last_name, store_id, job_title_id, email'
        ]);
        return;
    }

    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email format'
        ]);
        return;
    }

    // Validate performance range if provided
    $performance = 75; // 默认绩效
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

    $conn->beginTransaction();

    try {
        // 验证 user_id 存在且是 employee 类型
        $checkUserSQL = "SELECT user_id FROM users WHERE user_id = :user_id AND user_types = 'employee'";
        $checkStmt = $conn->prepare($checkUserSQL);
        $checkStmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
        $checkStmt->execute();
        if (!$checkStmt->fetch()) {
            $conn->rollBack();
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'User does not exist or is not employee type'
            ]);
            return;
        }

        // 验证 user_id 未被其他员工使用
        $checkEmpSQL = "SELECT employee_id FROM employees WHERE user_id = :user_id";
        $checkEmpStmt = $conn->prepare($checkEmpSQL);
        $checkEmpStmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
        $checkEmpStmt->execute();
        if ($checkEmpStmt->fetch()) {
            $conn->rollBack();
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'User already linked to an employee'
            ]);
            return;
        }

        // 如果提供了 employee_id，检查是否已存在
        $employeeId = isset($data['employee_id']) ? intval($data['employee_id']) : null;
        if ($employeeId !== null) {
            $checkIdSQL = "SELECT employee_id FROM employees WHERE employee_id = :employee_id";
            $checkIdStmt = $conn->prepare($checkIdSQL);
            $checkIdStmt->bindParam(':employee_id', $employeeId, PDO::PARAM_INT);
            $checkIdStmt->execute();
            if ($checkIdStmt->fetch()) {
                $conn->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Employee ID ' . $employeeId . ' already exists'
                ]);
                return;
            }

            // 使用指定的 employee_id 插入
            $sql = "INSERT INTO employees (employee_id, user_id, first_name, last_name, store_id, job_title_id, email, performance)
                    VALUES (:employee_id, :user_id, :first_name, :last_name, :store_id, :job_title_id, :email, :performance)";
            $stmt = $conn->prepare($sql);
            $stmt->bindParam(':employee_id', $employeeId, PDO::PARAM_INT);
        } else {
            // 自动生成 employee_id
            $sql = "INSERT INTO employees (user_id, first_name, last_name, store_id, job_title_id, email, performance)
                    VALUES (:user_id, :first_name, :last_name, :store_id, :job_title_id, :email, :performance)";
            $stmt = $conn->prepare($sql);
        }

        $stmt->bindParam(':user_id', $data['user_id'], PDO::PARAM_INT);
        $stmt->bindParam(':first_name', $data['first_name'], PDO::PARAM_STR);
        $stmt->bindParam(':last_name', $data['last_name'], PDO::PARAM_STR);
        $stmt->bindParam(':store_id', $data['store_id'], PDO::PARAM_INT);
        $stmt->bindParam(':job_title_id', $data['job_title_id'], PDO::PARAM_INT);
        $stmt->bindParam(':email', $data['email'], PDO::PARAM_STR);
        $stmt->bindParam(':performance', $performance, PDO::PARAM_STR);

        $stmt->execute();

        $finalEmployeeId = $employeeId !== null ? $employeeId : $conn->lastInsertId();

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Employee added successfully',
            'data' => ['employee_id' => $finalEmployeeId]
        ]);
    } catch (Exception $e) {
        $conn->rollBack();

        // 转换数据库错误为用户友好的消息
        $errorMessage = $e->getMessage();
        $friendlyMessage = 'Failed to add employee';

        if (strpos($errorMessage, 'Duplicate entry') !== false) {
            // 解析重复的值
            if (preg_match("/Duplicate entry '([^']+)'/", $errorMessage, $matches)) {
                $duplicateValue = $matches[1];

                if (strpos($errorMessage, 'email') !== false || strpos($errorMessage, 'phone') !== false) {
                    $friendlyMessage = "Email '{$duplicateValue}' is already in use by another employee";
                } elseif (strpos($errorMessage, 'user_id') !== false) {
                    $friendlyMessage = "User ID {$duplicateValue} is already linked to another employee";
                } elseif (strpos($errorMessage, 'employee_id') !== false) {
                    $friendlyMessage = "Employee ID {$duplicateValue} already exists";
                } else {
                    $friendlyMessage = "The value '{$duplicateValue}' is already in use";
                }
            }
        } elseif (strpos($errorMessage, 'foreign key constraint') !== false) {
            $friendlyMessage = 'Invalid reference: Store or Job Title does not exist';
        }

        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => $friendlyMessage
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
        !isset($data['store_id']) || !isset($data['job_title_id']) || !isset($data['email'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: employee_id, first_name, last_name, store_id, job_title_id, email'
        ]);
        return;
    }

    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Invalid email format'
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
        :employee_id, :user_id, :first_name, :last_name, :store_id, :job_title_id, :email, :performance,
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
    $stmt->bindParam(':email', $data['email'], PDO::PARAM_STR);

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
 * 删除员工（直接SQL）
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

    $conn->beginTransaction();

    try {
        // Check if employee exists
        $checkSql = "SELECT employee_id, user_id FROM employees WHERE employee_id = :employee_id";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bindParam(':employee_id', $employeeId, PDO::PARAM_INT);
        $checkStmt->execute();
        $employee = $checkStmt->fetch();

        if (!$employee) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Employee not found'
            ]);
            $conn->rollBack();
            return;
        }

        // Delete employee record
        $sql = "DELETE FROM employees WHERE employee_id = :employee_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':employee_id', $employeeId, PDO::PARAM_INT);
        $stmt->execute();

        // Delete linked user if no member record exists
        if (!empty($employee['user_id'])) {
            $memberStmt = $conn->prepare("SELECT member_id FROM members WHERE user_id = :user_id");
            $memberStmt->bindParam(':user_id', $employee['user_id'], PDO::PARAM_INT);
            $memberStmt->execute();
            if ($memberStmt->fetch()) {
                $conn->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Cannot delete linked user because member record exists'
                ]);
                return;
            }

            $userStmt = $conn->prepare("DELETE FROM users WHERE user_id = :user_id");
            $userStmt->bindParam(':user_id', $employee['user_id'], PDO::PARAM_INT);
            $userStmt->execute();
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Employee deleted successfully'
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
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

    $sql = "SELECT v.*,
                (MATCH(e.first_name, e.last_name) AGAINST (:kw1a IN NATURAL LANGUAGE MODE) +
                 MATCH(u.username) AGAINST (:kw2a IN NATURAL LANGUAGE MODE)) AS relevance_score
            FROM vw_manager_employees v
            JOIN employees e ON v.employee_id = e.employee_id
            JOIN users u ON v.user_id = u.user_id
            WHERE (
                MATCH(e.first_name, e.last_name) AGAINST (:kw1b IN NATURAL LANGUAGE MODE)
                OR MATCH(u.username) AGAINST (:kw2b IN NATURAL LANGUAGE MODE)
                OR e.email LIKE :kw_like1
                OR CAST(v.employee_id AS CHAR) LIKE :kw_like2
                OR CAST(v.user_id AS CHAR) LIKE :kw_like3
            )
            ORDER BY relevance_score DESC, v.employee_id";

    $searchTerm = "%$keyword%";
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':kw1a', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw2a', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw1b', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw2b', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like1', $searchTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like2', $searchTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like3', $searchTerm, PDO::PARAM_STR);
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
