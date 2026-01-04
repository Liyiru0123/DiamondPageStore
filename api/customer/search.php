<?php
/**
 * Customer Search API
 * Full-text search with filters and sorting.
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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

$keyword = isset($_GET['keyword']) ? trim($_GET['keyword']) : '';

$language = isset($_GET['language']) ? trim($_GET['language']) : '';
if ($language === '' || $language === 'all') {
    $language = null;
} else {
    $allowedLanguages = [
        'English',
        'Chinese',
        'French',
        'Janpenese',
        'Japanese',
        'Russian',
        'Korean',
        'Italian'
    ];
    if (!in_array($language, $allowedLanguages, true)) {
        $language = null;
    }
}

$bucket = $_GET['price'] ?? $_GET['price_range'] ?? null;
$bucket = is_string($bucket) ? trim($bucket) : '';
if ($bucket === '' || $bucket === 'all') {
    $bucket = null;
}
$bucketMap = [
    '0-20' => '0-20',
    '20-50' => '20-50',
    '50+' => '50+'
];
if ($bucket !== null && !isset($bucketMap[$bucket])) {
    $bucket = null;
}

$sort = $_GET['sort'] ?? $_GET['sort_by'] ?? null;
$sort = is_string($sort) ? trim($sort) : '';
if ($sort === '' || $sort === 'all' || $sort === 'default') {
    $sort = null;
} else {
    $sortMap = [
        'fav' => 'fav',
        'favorite' => 'fav',
        'popular' => 'fav',
        'fav-desc' => 'fav',
        'price_asc' => 'price_asc',
        'price-asc' => 'price_asc',
        'price_desc' => 'price_desc',
        'price-desc' => 'price_desc'
    ];
    $sort = $sortMap[$sort] ?? null;
}

$sql = "CALL sp_customer_search_books(:keyword, :language, :bucket, :sort)";
$params = [
    ':keyword' => $keyword,
    ':language' => $language,
    ':bucket' => $bucket,
    ':sort' => $sort
];

try {
    $stmt = $conn->prepare($sql);
    $stmt->execute($params);

    $books = [];
    while ($row = $stmt->fetch()) {
        $books[] = [
            'id' => (int)$row['sku_id'],
            'isbn' => $row['ISBN'],
            'title' => $row['title'],
            'author' => $row['author'],
            'language' => $row['language'],
            'category' => $row['category'],
            'publisher' => $row['publisher'],
            'price' => (float)$row['price'],
            'binding' => $row['binding'],
            'stock' => (int)$row['stock'],
            'storeId' => $row['store_id'],
            'storeName' => $row['store_name'],
            'description' => $row['description'],
            'favCount' => (int)$row['fav_count']
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => $books,
        'count' => count($books)
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Server error: ' . $e->getMessage()
    ]);
}
?>
