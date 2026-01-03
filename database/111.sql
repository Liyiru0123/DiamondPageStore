-- 1. 临时关闭触发器（可选，防止更新 point 时触发等级变动触发器导致锁表）
-- SET @TRIGGER_DISABLED = 1;

UPDATE members m
SET m.point = (
    SELECT FLOOR(SUM(order_points))
    FROM (
        SELECT 
            o.member_id,
            o.order_id,
            -- 为每一笔订单实时匹配它发生时的倍率
            (
                SELECT (SUM(oi_sub.quantity * s_sub.unit_price) * mt.earn_point_rate)
                FROM order_items oi_sub
                JOIN skus s_sub ON oi_sub.sku_id = s_sub.sku_id
                JOIN member_tiers mt ON mt.member_tier_id = (
                    -- 找出这一笔订单发生时，会员应属于哪个等级
                    SELECT mt2.member_tier_id 
                    FROM member_tiers mt2
                    WHERE mt2.min_lifetime_spend <= (
                        SELECT COALESCE(SUM(oi_history.quantity * s_history.unit_price), 0)
                        FROM orders o_history
                        JOIN order_items oi_history ON o_history.order_id = oi_history.order_id
                        JOIN skus s_history ON oi_history.sku_id = s_history.sku_id
                        WHERE o_history.member_id = o.member_id 
                          AND o_history.order_status = 'paid' 
                          AND o_history.order_id <= o.order_id
                    )
                    ORDER BY mt2.min_lifetime_spend DESC LIMIT 1
                )
                WHERE oi_sub.order_id = o.order_id
            ) as order_points
        FROM orders o
        WHERE o.order_status = 'paid'
    ) as t
    WHERE t.member_id = m.member_id
);

-- SET @TRIGGER_DISABLED = NULL;