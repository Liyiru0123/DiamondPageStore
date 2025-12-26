$keyword = $_GET['keyword'] ?? '';
$lang    = $_GET['language'] ?? null;      // 不限 → null
$bucket  = $_GET['price'] ?? null;         // 0-20 / 20-40 / 50+ / null
$sort    = $_GET['sort'] ?? null;          // fav / price_asc / price_desc / null

$sql = "
WITH hits AS (
  SELECT b.ISBN,
         MATCH(b.name, b.introduction, b.publisher)
           AGAINST (:kw IN NATURAL LANGUAGE MODE) AS score
  FROM books b
  WHERE MATCH(b.name, b.introduction, b.publisher)
        AGAINST (:kw IN NATURAL LANGUAGE MODE)

  UNION ALL

  SELECT b.ISBN,
         MATCH(a.first_name, a.last_name)
           AGAINST (:kw IN NATURAL LANGUAGE MODE) AS score
  FROM authors a
  JOIN book_authors ba ON ba.author_id = a.author_id
  JOIN books b ON b.ISBN = ba.ISBN
  WHERE MATCH(a.first_name, a.last_name)
        AGAINST (:kw IN NATURAL LANGUAGE MODE)
),
hit_books AS (
  SELECT ISBN, MAX(score) AS score
  FROM hits
  GROUP BY ISBN
),
book_price AS (
  SELECT ISBN, MIN(unit_price) AS display_price
  FROM skus
  GROUP BY ISBN
),
fav_cnt AS (
  SELECT ISBN, COUNT(*) AS fav_count
  FROM favorites
  GROUP BY ISBN
)
SELECT
  b.ISBN,
  b.name,
  b.language,
  b.publisher,
  b.introduction,
  p.display_price,
  COALESCE(f.fav_count,0) AS fav_count,
  hb.score
FROM hit_books hb
JOIN books b ON b.ISBN = hb.ISBN
JOIN book_price p ON p.ISBN = b.ISBN
LEFT JOIN fav_cnt f ON f.ISBN = b.ISBN
WHERE
  (:lang IS NULL OR b.language = :lang)
  AND
  (
    :bucket IS NULL
    OR (:bucket = '0-20' AND p.display_price >= 0  AND p.display_price < 20)
    OR (:bucket = '20-40' AND p.display_price >= 20 AND p.display_price < 40)
    OR (:bucket = '50+'   AND p.display_price >= 50)
  )
ORDER BY
  CASE WHEN :sort = 'fav'        THEN COALESCE(f.fav_count,0) END DESC,
  CASE WHEN :sort = 'price_asc'  THEN p.display_price END ASC,
  CASE WHEN :sort = 'price_desc' THEN p.display_price END DESC,
  hb.score DESC
";
