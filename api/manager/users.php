<?php
/**
 * Manager - Users API
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
            listUsers($conn);
            break;
        case 'detail':
            getUserDetail($conn);
            break;
        case 'update':
            updateUser($conn);
            break;
        case 'delete':
            deleteUser($conn);
            break;
        case 'search':
            searchUsers($conn);
            break;
        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, update, delete, search'
            ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

function listUsers($conn) {
    $sql = "SELECT
                u.user_id,
                u.username,
                u.user_types AS user_type,
                u.create_date,
                u.last_log_date,
                CASE
                    WHEN m.member_id IS NOT NULL THEN CONCAT(m.first_name, ' ', m.last_name)
                    WHEN e.employee_id IS NOT NULL THEN CONCAT(e.first_name, ' ', e.last_name)
                    ELSE NULL
                END AS full_name,
                CASE
                    WHEN m.member_id IS NOT NULL THEN m.phone
                    WHEN e.employee_id IS NOT NULL THEN e.phone
                    ELSE NULL
                END AS phone
            FROM users u
            LEFT JOIN members m ON u.user_id = m.user_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            ORDER BY u.user_id";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Users retrieved successfully',
        'data' => $users,
        'count' => count($users)
    ]);
}

function getUserDetail($conn) {
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    $userId = intval($_GET['user_id']);

    $sql = "SELECT
                u.*,
                m.member_id,
                m.first_name AS member_first_name,
                m.last_name AS member_last_name,
                m.phone AS member_phone,
                m.point,
                e.employee_id,
                e.first_name AS employee_first_name,
                e.last_name AS employee_last_name,
                e.phone AS employee_phone,
                e.store_id
            FROM users u
            LEFT JOIN members m ON u.user_id = m.user_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            WHERE u.user_id = :user_id";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
    $stmt->execute();
    $user = $stmt->fetch();

    if (!$user) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'User not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'User detail retrieved successfully',
        'data' => $user
    ]);
}

function updateUser($conn) {
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

    if (!$data || !isset($data['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    // Validate user_types if provided
    if (isset($data['user_types'])) {
        $validUserTypes = ['customer', 'employee', 'manager'];
        if (!in_array($data['user_types'], $validUserTypes)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid user type. Must be one of: customer, employee, manager'
            ]);
            return;
        }
    }

    $conn->beginTransaction();

    try {
        if (isset($data['username']) || isset($data['user_types'])) {
            $sql = "UPDATE users SET ";
            $updates = [];
            $params = [':user_id' => $data['user_id']];

            if (isset($data['username'])) {
                $updates[] = "username = :username";
                $params[':username'] = $data['username'];
            }

            if (isset($data['user_types'])) {
                $updates[] = "user_types = :user_types";
                $params[':user_types'] = $data['user_types'];
            }

            $sql .= implode(', ', $updates) . " WHERE user_id = :user_id";

            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
        }

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'User updated successfully'
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
}

function deleteUser($conn) {
    if (!isset($_GET['user_id'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'user_id is required'
        ]);
        return;
    }

    $userId = intval($_GET['user_id']);

    $conn->beginTransaction();

    try {
        $checkSql = "SELECT user_id FROM users WHERE user_id = :user_id";
        $checkStmt = $conn->prepare($checkSql);
        $checkStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $checkStmt->execute();

        if (!$checkStmt->fetch()) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'User not found'
            ]);
            $conn->rollBack();
            return;
        }

        $relSql = "SELECT
                        (SELECT COUNT(*) FROM members WHERE user_id = :user_id) AS member_count,
                        (SELECT COUNT(*) FROM employees WHERE user_id = :user_id) AS employee_count,
                        (SELECT COUNT(*) FROM orders WHERE user_id = :user_id) AS order_count,
                        (SELECT COUNT(*) FROM invoices WHERE user_id = :user_id) AS invoice_count,
                        (SELECT COUNT(*) FROM announcements WHERE created_by = :user_id) AS announcement_count";
        $relStmt = $conn->prepare($relSql);
        $relStmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $relStmt->execute();
        $rel = $relStmt->fetch();

        $violations = [];
        if ($rel['member_count'] > 0) $violations[] = 'member record';
        if ($rel['employee_count'] > 0) $violations[] = 'employee record';
        if ($rel['order_count'] > 0) $violations[] = 'orders';
        if ($rel['invoice_count'] > 0) $violations[] = 'invoices';
        if ($rel['announcement_count'] > 0) $violations[] = 'announcements';

        if (!empty($violations)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Cannot delete user with linked: ' . implode(', ', $violations)
            ]);
            $conn->rollBack();
            return;
        }

        $sql = "DELETE FROM users WHERE user_id = :user_id";
        $stmt = $conn->prepare($sql);
        $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'User deleted successfully'
        ]);
    } catch (Exception $e) {
        $conn->rollBack();
        throw $e;
    }
}

function searchUsers($conn) {
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

    if ($keyword === '') {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'keyword is required'
        ]);
        return;
    }

    $sql = "SELECT
                u.user_id,
                u.username,
                u.user_types AS user_type,
                u.create_date,
                u.last_log_date,
                CASE
                    WHEN m.member_id IS NOT NULL THEN CONCAT(m.first_name, ' ', m.last_name)
                    WHEN e.employee_id IS NOT NULL THEN CONCAT(e.first_name, ' ', e.last_name)
                    ELSE NULL
                END AS full_name,
                CASE
                    WHEN m.member_id IS NOT NULL THEN m.phone
                    WHEN e.employee_id IS NOT NULL THEN e.phone
                    ELSE NULL
                END AS phone
            FROM users u
            LEFT JOIN members m ON u.user_id = m.user_id
            LEFT JOIN employees e ON u.user_id = e.user_id
            WHERE u.username LIKE :keyword
            OR m.first_name LIKE :keyword
            OR m.last_name LIKE :keyword
            OR m.phone LIKE :keyword
            OR e.first_name LIKE :keyword
            OR e.last_name LIKE :keyword
            OR e.phone LIKE :keyword
            ORDER BY u.user_id";

    $searchTerm = "%$keyword%";
    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':keyword', $searchTerm, PDO::PARAM_STR);
    $stmt->execute();
    $users = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Search completed successfully',
        'data' => $users,
        'count' => count($users)
    ]);
}
?>
