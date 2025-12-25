<?php
/**
 * Customer Books API
 * 处理书籍相关的请求：获取列表、搜索、查看详情
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../../config/database.php';

// 获取数据库连接
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

// 获取请求方法和操作
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

try {
    switch ($action) {
        case 'list':
            // 获取书籍列表（支持筛选和排序）
            getBooksList($conn);
            break;

        case 'search':
            // 搜索书籍
            searchBooks($conn);
            break;

        case 'detail':
            // 获取书籍详情
            getBookDetail($conn);
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Invalid action'
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}

/**
 * 获取书籍列表
 * 支持分类、语言、价格筛选和排序
 */
function getBooksList($conn) {
    // 获取筛选参数
    $category = isset($_GET['category']) ? $_GET['category'] : '';
    $language = isset($_GET['language']) ? $_GET['language'] : '';
    $priceRange = isset($_GET['price_range']) ? $_GET['price_range'] : '';
    $sortBy = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default';

    // 基础SQL查询（使用视图）
    $sql = "SELECT * FROM vw_customer_books WHERE 1=1";
    $params = [];

    // 分类筛选
    if (!empty($category) && $category !== 'all') {
        $sql .= " AND category LIKE :category";
        $params[':category'] = "%$category%";
    }

    // 语言筛选
    if (!empty($language) && $language !== 'all') {
        $sql .= " AND language = :language";
        $params[':language'] = $language;
    }

    // 价格筛选
    if (!empty($priceRange) && $priceRange !== 'all') {
        switch ($priceRange) {
            case '0-20':
                $sql .= " AND price BETWEEN 0 AND 20";
                break;
            case '20-50':
                $sql .= " AND price BETWEEN 20 AND 50";
                break;
            case '50+':
                $sql .= " AND price > 50";
                break;
        }
    }

    // 排序
    switch ($sortBy) {
        case 'popular':
        case 'fav-desc':
            $sql .= " ORDER BY fav_count DESC";
            break;
        case 'price-asc':
            $sql .= " ORDER BY price ASC";
            break;
        case 'price-desc':
            $sql .= " ORDER BY price DESC";
            break;
        default:
            $sql .= " ORDER BY ISBN";
            break;
    }

    // 准备和执行查询
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $books = [];
    while ($row = $stmt->fetch()) {
        $books[] = [
            'id' => $row['sku_id'],
            'isbn' => $row['ISBN'],
            'title' => $row['title'],
            'author' => $row['author'],
            'language' => $row['language'],
            'category' => $row['category'],
            'publisher' => $row['publisher'],
            'price' => (float)$row['price'],
            'binding' => $row['binding'],
            'stock' => (int)$row['stock'],
            'storeName' => $row['store_name'],
            'storeId' => $row['store_id'],
            'description' => $row['description'],
            'favCount' => (int)$row['fav_count']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $books,
        'count' => count($books)
    ]);
}

/**
 * 搜索书籍
 * 支持关键词搜索（标题、作者、ISBN）
 */
function searchBooks($conn) {
    $keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';
    $priceRange = isset($_GET['price_range']) ? $_GET['price_range'] : '';
    $language = isset($_GET['language']) ? $_GET['language'] : '';
    $sortBy = isset($_GET['sort_by']) ? $_GET['sort_by'] : 'default';

    if (empty($keyword)) {
        echo json_encode([
            'success' => false,
            'message' => 'Keyword is required',
            'data' => []
        ]);
        return;
    }

    // 搜索查询
    $sql = "SELECT * FROM vw_customer_books
            WHERE (title LIKE :keyword_title OR author LIKE :keyword_author OR ISBN LIKE :keyword_isbn)";

    $searchTerm = "%$keyword%";
    $params = [
        ':keyword_title' => $searchTerm,
        ':keyword_author' => $searchTerm,
        ':keyword_isbn' => $searchTerm
    ];

    // 语言筛选
    if (!empty($language) && $language !== 'all') {
        $sql .= " AND language = :language";
        $params[':language'] = $language;
    }

    // 价格筛选
    if (!empty($priceRange) && $priceRange !== 'all') {
        switch ($priceRange) {
            case '0-20':
                $sql .= " AND price BETWEEN 0 AND 20";
                break;
            case '20-50':
                $sql .= " AND price BETWEEN 20 AND 50";
                break;
            case '50+':
                $sql .= " AND price > 50";
                break;
        }
    }

    // 排序
    switch ($sortBy) {
        case 'popular':
            $sql .= " ORDER BY fav_count DESC";
            break;
        case 'price-asc':
            $sql .= " ORDER BY price ASC";
            break;
        case 'price-desc':
            $sql .= " ORDER BY price DESC";
            break;
        default:
            $sql .= " ORDER BY
                      (CASE WHEN title LIKE :keyword_rank THEN 1 ELSE 2 END),
                      fav_count DESC";
            $params[':keyword_rank'] = $searchTerm;
            break;
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $books = [];
    while ($row = $stmt->fetch()) {
        $books[] = [
            'id' => $row['sku_id'],
            'isbn' => $row['ISBN'],
            'title' => $row['title'],
            'author' => $row['author'],
            'language' => $row['language'],
            'category' => $row['category'],
            'publisher' => $row['publisher'],
            'price' => (float)$row['price'],
            'binding' => $row['binding'],
            'stock' => (int)$row['stock'],
            'storeName' => $row['store_name'],
            'storeId' => $row['store_id'],
            'description' => $row['description'],
            'favCount' => (int)$row['fav_count']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $books,
        'count' => count($books),
        'keyword' => $keyword
    ]);
}

/**
 * 获取书籍详情
 */
function getBookDetail($conn) {
    $isbn = isset($_GET['isbn']) ? $_GET['isbn'] : '';
    $sku_id = isset($_GET['sku_id']) ? $_GET['sku_id'] : '';

    if (empty($isbn) && empty($sku_id)) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'ISBN or SKU ID is required'
        ]);
        return;
    }

    // 查询书籍详情
    $sql = "SELECT * FROM vw_customer_book_detail WHERE ";

    if (!empty($isbn)) {
        $sql .= "ISBN = :isbn";
        $params = [':isbn' => $isbn];
    } else {
        $sql .= "sku_id = :sku_id";
        $params = [':sku_id' => (int)$sku_id];
    }

    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    if ($row = $stmt->fetch()) {
        $book = [
            'id' => $row['sku_id'],
            'isbn' => $row['ISBN'],
            'title' => $row['title'],
            'author' => $row['author'],
            'authorCountry' => $row['author_country'],
            'language' => $row['language'],
            'category' => $row['category'],
            'publisher' => $row['publisher'],
            'price' => (float)$row['price'],
            'binding' => $row['binding'],
            'stock' => (int)$row['stock'],
            'storeName' => $row['store_name'],
            'storeId' => $row['store_id'],
            'description' => $row['description'],
            'favCount' => (int)$row['fav_count']
        ];

        echo json_encode([
            'success' => true,
            'data' => $book
        ]);
    } else {
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'message' => 'Book not found'
        ]);
    }
}
?>
