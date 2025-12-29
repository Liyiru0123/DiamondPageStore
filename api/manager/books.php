<?php
/**
 * Manager - Books API
 * 书籍管理和定价接口
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
            listBooks($conn);
            break;

        case 'detail':
            getBookDetail($conn);
            break;

        case 'add':
            addBook($conn);
            break;

        case 'update_pricing':
            updatePricing($conn);
            break;

        case 'search':
            searchBooks($conn);
            break;

        case 'categories':
            getCategories($conn);
            break;

        case 'authors':
            getAuthors($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action. Valid actions: list, detail, add, update_pricing, search, categories, authors'
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
 * 获取书籍列表（包含定价信息）
 */
function listBooks($conn) {
    $sql = "SELECT
                ISBN,
                book_name AS name,
                publisher,
                language,
                sku_id,
                binding,
                unit_price,
                authors,
                categories,
                total_stock
            FROM vw_manager_inventory_overview
            ORDER BY ISBN";

    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $books = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Books retrieved successfully',
        'data' => $books,
        'count' => count($books)
    ]);
}

/**
 * 获取书籍详情
 */
function getBookDetail($conn) {
    if (!isset($_GET['ISBN'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'ISBN is required'
        ]);
        return;
    }

    $ISBN = $_GET['ISBN'];

    $sql = "SELECT
                b.*,
                s.sku_id,
                s.bingding,
                s.unit_price,
                JSON_ARRAYAGG(DISTINCT JSON_OBJECT('author_id', a.author_id, 'name', CONCAT(a.first_name, ' ', a.last_name))) AS authors,
                (SELECT JSON_ARRAYAGG(JSON_OBJECT('category_id', c.category_id, 'name', c.name))
                 FROM book_categories bc
                 JOIN catagories c ON bc.category_id = c.category_id
                 WHERE bc.ISBN = b.ISBN) AS categories
            FROM books b
            JOIN skus s ON b.ISBN = s.ISBN
            LEFT JOIN book_authors ba ON b.ISBN = ba.ISBN
            LEFT JOIN authors a ON ba.author_id = a.author_id
            WHERE b.ISBN = :ISBN
            GROUP BY b.ISBN, s.sku_id, s.bingding, s.unit_price";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':ISBN', $ISBN, PDO::PARAM_STR);
    $stmt->execute();
    $book = $stmt->fetch();

    if (!$book) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Book not found'
        ]);
        return;
    }

    echo json_encode([
        'success' => true,
        'message' => 'Book detail retrieved successfully',
        'data' => $book
    ]);
}

/**
 * 添加书籍（调用存储过程）
 */
function addBook($conn) {
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

    if (!$data || !isset($data['ISBN']) || !isset($data['name']) || !isset($data['publisher']) ||
        !isset($data['binding']) || !isset($data['unit_price'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: ISBN, name, publisher, binding, unit_price'
        ]);
        return;
    }

    // Validate unit price
    if (!is_numeric($data['unit_price']) || floatval($data['unit_price']) <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Unit price must be greater than 0'
        ]);
        return;
    }

    // 准备JSON数组
    $authorIds = isset($data['author_ids']) && is_array($data['author_ids'])
        ? json_encode($data['author_ids'])
        : null;

    $categoryIds = isset($data['category_ids']) && is_array($data['category_ids'])
        ? json_encode($data['category_ids'])
        : null;

    $sql = "CALL sp_manager_add_book(
        :ISBN, :name, :publisher, :language, :introduction, :binding, :unit_price,
        :author_ids, :category_ids,
        @result_code, @result_message, @sku_id
    )";

    $stmt = $conn->prepare($sql);
    $stmt->bindParam(':ISBN', $data['ISBN'], PDO::PARAM_STR);
    $stmt->bindParam(':name', $data['name'], PDO::PARAM_STR);
    $stmt->bindParam(':publisher', $data['publisher'], PDO::PARAM_STR);

    $language = isset($data['language']) ? $data['language'] : 'English';
    $introduction = isset($data['introduction']) ? $data['introduction'] : null;

    $stmt->bindParam(':language', $language, PDO::PARAM_STR);
    $stmt->bindParam(':introduction', $introduction, PDO::PARAM_STR);
    $stmt->bindParam(':binding', $data['binding'], PDO::PARAM_STR);
    $stmt->bindParam(':unit_price', $data['unit_price'], PDO::PARAM_STR);
    $stmt->bindParam(':author_ids', $authorIds, PDO::PARAM_STR);
    $stmt->bindParam(':category_ids', $categoryIds, PDO::PARAM_STR);

    $stmt->execute();

    // 获取存储过程的输出参数
    $result = $conn->query("SELECT @result_code as code, @result_message as message, @sku_id as sku_id")->fetch();

    if ($result['code'] == 1) {
        echo json_encode([
            'success' => true,
            'message' => $result['message'],
            'data' => ['sku_id' => $result['sku_id'], 'ISBN' => $data['ISBN']]
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
 * 更新定价（使用直接 SQL）
 */
function updatePricing($conn) {
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

    if (!$data || !isset($data['sku_id']) || !isset($data['new_price'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Missing required fields: sku_id, new_price'
        ]);
        return;
    }

    // Validate new price
    if (!is_numeric($data['new_price']) || floatval($data['new_price']) <= 0) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'New price must be greater than 0'
        ]);
        return;
    }

    // 检查 SKU 是否存在
    $checkSql = "SELECT sku_id, unit_price FROM skus WHERE sku_id = :sku_id";
    $checkStmt = $conn->prepare($checkSql);
    $checkStmt->bindParam(':sku_id', $data['sku_id'], PDO::PARAM_INT);
    $checkStmt->execute();
    $sku = $checkStmt->fetch();

    if (!$sku) {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'SKU not found'
        ]);
        return;
    }

    // 更新价格
    $updateSql = "UPDATE skus SET unit_price = :new_price WHERE sku_id = :sku_id";
    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bindParam(':new_price', $data['new_price'], PDO::PARAM_STR);
    $updateStmt->bindParam(':sku_id', $data['sku_id'], PDO::PARAM_INT);
    $updateStmt->execute();

    echo json_encode([
        'success' => true,
        'message' => 'Price updated successfully',
        'data' => [
            'sku_id' => $data['sku_id'],
            'old_price' => $sku['unit_price'],
            'new_price' => $data['new_price']
        ]
    ]);
}

/**
 * 搜索书籍
 */
function searchBooks($conn) {
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
                v.ISBN,
                v.book_name AS name,
                v.publisher,
                v.language,
                v.sku_id,
                v.binding,
                v.unit_price,
                v.authors,
                v.categories,
                v.total_stock,
                MATCH(b.name, b.publisher, b.introduction, b.language) AGAINST (:kw1 IN NATURAL LANGUAGE MODE) AS relevance_score
            FROM vw_manager_inventory_overview v
            JOIN books b ON v.ISBN = b.ISBN
            WHERE (
                MATCH(b.name, b.publisher, b.introduction, b.language) AGAINST (:kw4 IN NATURAL LANGUAGE MODE)
                OR EXISTS (
                    SELECT 1
                    FROM book_authors ba
                    JOIN authors a ON ba.author_id = a.author_id
                    WHERE ba.ISBN = b.ISBN
                    AND MATCH(a.first_name, a.last_name) AGAINST (:kw2 IN NATURAL LANGUAGE MODE)
                )
                OR EXISTS (
                    SELECT 1
                    FROM book_categories bc
                    JOIN catagories c ON bc.category_id = c.category_id
                    WHERE bc.ISBN = b.ISBN
                    AND MATCH(c.name) AGAINST (:kw3 IN NATURAL LANGUAGE MODE)
                )
                OR v.ISBN LIKE :kw_like1
                OR v.sku_id LIKE :kw_like2
            )
            ORDER BY relevance_score DESC, v.book_name";

    $searchTerm = "%$keyword%";
    $stmt = $conn->prepare($sql);
    $stmt->bindValue(':kw1', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw2', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw3', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw4', $keyword, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like1', $searchTerm, PDO::PARAM_STR);
    $stmt->bindValue(':kw_like2', $searchTerm, PDO::PARAM_STR);
    $stmt->execute();
    $books = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Search completed successfully',
        'data' => $books,
        'count' => count($books)
    ]);
}

/**
 * 获取所有分类
 */
function getCategories($conn) {
    $sql = "SELECT * FROM catagories ORDER BY category_id";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $categories = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Categories retrieved successfully',
        'data' => $categories,
        'count' => count($categories)
    ]);
}

/**
 * 获取所有作者
 */
function getAuthors($conn) {
    $sql = "SELECT author_id, CONCAT(first_name, ' ', last_name) AS name, country
            FROM authors
            ORDER BY last_name, first_name";
    $stmt = $conn->prepare($sql);
    $stmt->execute();
    $authors = $stmt->fetchAll();

    echo json_encode([
        'success' => true,
        'message' => 'Authors retrieved successfully',
        'data' => $authors,
        'count' => count($authors)
    ]);
}
?>
