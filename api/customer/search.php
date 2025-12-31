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
$hasKeyword = $keyword !== '';

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

if ($hasKeyword) {
    $sql = "
WITH hits AS (
  SELECT b.ISBN,
         MATCH(b.name, b.introduction, b.publisher)
           AGAINST (:kw_book_score IN NATURAL LANGUAGE MODE) AS score
  FROM books b
  WHERE MATCH(b.name, b.introduction, b.publisher)
        AGAINST (:kw_book_filter IN NATURAL LANGUAGE MODE)

  UNION ALL

  SELECT b.ISBN,
         MATCH(a.first_name, a.last_name)
           AGAINST (:kw_author_score IN NATURAL LANGUAGE MODE) AS score
  FROM authors a
  JOIN book_authors ba ON ba.author_id = a.author_id
  JOIN books b ON b.ISBN = ba.ISBN
  WHERE MATCH(a.first_name, a.last_name)
        AGAINST (:kw_author_filter IN NATURAL LANGUAGE MODE)
),
hit_books AS (
  SELECT ISBN, MAX(score) AS score
  FROM hits
  GROUP BY ISBN
)
SELECT
  v.sku_id,
  v.ISBN,
  v.title,
  v.author,
  v.language,
  v.category,
  v.publisher,
  v.description,
  v.price,
  v.binding,
  v.stock,
  v.store_id,
  v.store_name,
  v.fav_count,
  hb.score
FROM hit_books hb
JOIN vw_customer_books v ON v.ISBN = hb.ISBN
WHERE 1=1
";

    $params = [
        ':kw_book_score' => $keyword,
        ':kw_book_filter' => $keyword,
        ':kw_author_score' => $keyword,
        ':kw_author_filter' => $keyword
    ];
} else {
    $sql = "
SELECT
  v.sku_id,
  v.ISBN,
  v.title,
  v.author,
  v.language,
  v.category,
  v.publisher,
  v.description,
  v.price,
  v.binding,
  v.stock,
  v.store_id,
  v.store_name,
  v.fav_count
FROM vw_customer_books v
WHERE 1=1
";

    $params = [];
}

if ($language !== null) {
    $sql .= " AND v.language = :lang";
    $params[':lang'] = $language;
}

if ($bucket !== null) {
    if ($bucket === '0-20') {
        $sql .= " AND v.price >= 0 AND v.price < 20";
    } elseif ($bucket === '20-50') {
        $sql .= " AND v.price >= 20 AND v.price < 50";
    } elseif ($bucket === '50+') {
        $sql .= " AND v.price >= 50";
    }
}

$orderBy = $hasKeyword ? 'hb.score DESC' : 'v.ISBN';
if ($sort === 'fav') {
    $orderBy = $hasKeyword ? 'v.fav_count DESC, hb.score DESC' : 'v.fav_count DESC';
} elseif ($sort === 'price_asc') {
    $orderBy = $hasKeyword ? 'v.price ASC, hb.score DESC' : 'v.price ASC';
} elseif ($sort === 'price_desc') {
    $orderBy = $hasKeyword ? 'v.price DESC, hb.score DESC' : 'v.price DESC';
}

$sql .= " ORDER BY " . $orderBy;

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
