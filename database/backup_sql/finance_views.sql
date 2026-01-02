-- finance_views.sql
USE book_store;

CREATE OR REPLACE VIEW vm_finance_invoice_base AS
SELECT
    i.invoice_id,
    i.order_id,
    o.store_id,
    o.member_id,
    o.order_status,
    o.order_date,
    i.invoice_status,
    i.invoice_number,
    i.issue_date,
    i.due_date,
    i.update_date,
    i.note
FROM invoices i
JOIN orders o ON o.order_id = i.order_id;

CREATE OR REPLACE VIEW vm_finance_invoice_paid_sum AS
SELECT
    pa.invoice_id,
    ROUND(SUM(pa.allocated_amount), 2) AS paid_amount,
    MAX(pa.create_date) AS last_paid_at
FROM payment_allocations pa
GROUP BY pa.invoice_id;

CREATE OR REPLACE VIEW vm_finance_invoice_payment_allocation_detail AS
SELECT
    pa.invoice_id,
    pa.payment_id,
    pa.create_date AS allocation_date,
    pa.allocated_amount AS allocated_amount,
    pa.note AS allocation_note,
    p.member_id,
    p.payment_method,
    p.amount AS payment_amount,
    p.create_date AS payment_create_date,
    p.update_date AS payment_update_date,
    p.note AS payment_note
FROM payment_allocations pa
JOIN payments p ON p.payment_id = pa.payment_id;

CREATE OR REPLACE VIEW vm_finance_order_amount_base AS
SELECT
    o.order_id,
    o.store_id,
    o.member_id,
    o.order_status,
    o.order_date,
    o.note,
    IFNULL(SUM(oi.quantity * s.unit_price), 0) AS gross_amount
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.order_id
LEFT JOIN skus s ON s.sku_id = oi.sku_id
GROUP BY o.order_id, o.store_id, o.member_id, o.order_status, o.order_date, o.note;

CREATE OR REPLACE VIEW vm_finance_order_member_rate AS
SELECT
    o.order_id,
    m.member_tier_id,
    t.discount_rate,
    t.earn_point_rate,
    t.min_lifetime_spend
FROM orders o
JOIN members m ON m.member_id = o.member_id
JOIN member_tiers t ON t.member_tier_id = m.member_tier_id;

CREATE OR REPLACE VIEW vm_finance_order_paid_sum AS
SELECT
    i.order_id,
    IFNULL(SUM(pa.allocated_amount), 0) AS paid_amount,
    MAX(pa.create_date) AS last_paid_at
FROM invoices i
LEFT JOIN payment_allocations pa ON pa.invoice_id = i.invoice_id
GROUP BY i.order_id;

CREATE OR REPLACE VIEW vm_finance_order_points_summary AS
SELECT
    pl.order_id,
    SUM(pl.points_delta) AS points_net,
    SUM(CASE WHEN pl.points_delta > 0 THEN pl.points_delta ELSE 0 END) AS points_earned,
    SUM(CASE WHEN pl.points_delta < 0 THEN -pl.points_delta ELSE 0 END) AS points_redeemed
FROM point_ledgers pl
GROUP BY pl.order_id;

CREATE OR REPLACE VIEW vm_finance_order_settlement AS
SELECT
    b.order_id,
    b.store_id,
    b.member_id,
    b.order_status,
    b.order_date,
    b.note,
    r.discount_rate,
    r.earn_point_rate,
    b.gross_amount,
    ROUND((b.gross_amount * r.discount_rate), 2) AS discounted_amount,
    IFNULL(p.points_earned, 0) AS earned_points,
    IFNULL(p.points_redeemed, 0) AS redeemed_points,
    ROUND(
        CASE
            WHEN r.earn_point_rate IS NULL OR r.earn_point_rate = 0 THEN 0
            ELSE (IFNULL(p.points_redeemed, 0) / r.earn_point_rate)
        END,
        2
    ) AS points_discount_amount,
    ROUND(
        GREATEST(
            (b.gross_amount * r.discount_rate)
            - (
                CASE
                    WHEN r.earn_point_rate IS NULL OR r.earn_point_rate = 0 THEN 0
                    ELSE (IFNULL(p.points_redeemed, 0) / r.earn_point_rate)
                END
            ),
            0
        ),
        2
    ) AS payable_amount,
    IFNULL(ps.paid_amount, 0) AS paid_amount,
    ps.last_paid_at,
    CASE
        WHEN IFNULL(ps.paid_amount, 0) >= ROUND(
            GREATEST(
                (b.gross_amount * r.discount_rate)
                - (
                    CASE
                        WHEN r.earn_point_rate IS NULL OR r.earn_point_rate = 0 THEN 0
                        ELSE (IFNULL(p.points_redeemed, 0) / r.earn_point_rate)
                    END
                ),
                0
            ),
            2
        ) THEN 1
        ELSE 0
    END AS is_settled,
    FLOOR((ROUND(GREATEST((b.gross_amount * r.discount_rate), 0), 2) * r.earn_point_rate)) AS expected_earned_points
FROM vm_finance_order_amount_base b
LEFT JOIN vm_finance_order_member_rate r ON r.order_id = b.order_id
LEFT JOIN vm_finance_order_points_summary p ON p.order_id = b.order_id
LEFT JOIN vm_finance_order_paid_sum ps ON ps.order_id = b.order_id;

CREATE OR REPLACE VIEW vm_invoice_settlement AS
SELECT
    b.invoice_id,
    b.invoice_number,
    b.invoice_status,
    b.issue_date,
    b.due_date,
    b.update_date,
    b.note,
    b.order_id,
    b.store_id,
    b.member_id,
    b.order_status,
    b.order_date,
    s.payable_amount AS invoice_amount,
    IFNULL(ps.paid_amount, 0) AS paid_amount,
    ROUND(GREATEST((IFNULL(s.payable_amount, 0) - IFNULL(ps.paid_amount, 0)), 0), 2) AS outstanding_amount,
    ps.last_paid_at,
    CASE
        WHEN (IFNULL(ps.paid_amount, 0) >= IFNULL(s.payable_amount, 0)) AND (s.payable_amount IS NOT NULL) THEN 1
        ELSE 0
    END AS is_settled
FROM vm_finance_invoice_base b
LEFT JOIN vm_finance_invoice_paid_sum ps ON ps.invoice_id = b.invoice_id
LEFT JOIN vm_finance_order_settlement s ON s.order_id = b.order_id;

CREATE OR REPLACE VIEW vw_finance_order_list AS
SELECT
    o.order_id,
    o.store_id,
    st.name AS store_name,
    o.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    o.order_status,
    o.order_date,
    o.note,
    o.payable_amount,
    o.paid_amount,
    o.is_settled,
    COUNT(oi.sku_id) AS item_count,
    COALESCE(SUM(oi.quantity), 0) AS total_quantity
FROM vm_finance_order_settlement o
JOIN stores st ON st.store_id = o.store_id
JOIN members m ON m.member_id = o.member_id
LEFT JOIN order_items oi ON oi.order_id = o.order_id
GROUP BY
    o.order_id,
    o.store_id,
    st.name,
    o.member_id,
    m.first_name,
    m.last_name,
    o.order_status,
    o.order_date,
    o.note,
    o.payable_amount,
    o.paid_amount,
    o.is_settled;

CREATE OR REPLACE VIEW vw_finance_invoice_list AS
SELECT
    i.invoice_id,
    i.invoice_number,
    i.order_id,
    i.store_id,
    st.name AS store_name,
    i.member_id,
    CONCAT(m.first_name, ' ', m.last_name) AS member_name,
    i.invoice_status,
    i.issue_date,
    i.due_date,
    i.invoice_amount,
    i.paid_amount,
    i.outstanding_amount,
    i.last_paid_at,
    i.is_settled,
    CASE
        WHEN i.invoice_status IN ('voided', 'credited') THEN 'VOID'
        WHEN i.is_settled = 1 THEN 'PAID'
        WHEN i.paid_amount > 0 THEN 'PARTIAL'
        WHEN i.due_date < NOW() THEN 'OVERDUE'
        ELSE 'UNPAID'
    END AS display_status
FROM vm_invoice_settlement i
JOIN stores st ON st.store_id = i.store_id
JOIN members m ON m.member_id = i.member_id;

CREATE OR REPLACE VIEW vw_finance_revenue_by_date AS
SELECT
    DATE(order_date) AS order_day,
    SUM(payable_amount) AS revenue
FROM vm_finance_order_settlement
WHERE is_settled = 1
GROUP BY DATE(order_date);

CREATE OR REPLACE VIEW vw_finance_purchase_cost_by_date AS
SELECT
    DATE(received_date) AS cost_day,
    SUM(unit_cost * quantity) AS cost
FROM inventory_batches
GROUP BY DATE(received_date);
