-- ============================================================
-- RetailPulse Analytics Views
-- ============================================================


-- 1. MONTHLY REVENUE
CREATE OR REPLACE VIEW monthly_revenue AS

WITH revenue_by_month AS (
    SELECT
        DATE_TRUNC('month', o.order_purchase_timestamp) AS month,
        COUNT(DISTINCT o.order_id) AS total_orders,
        ROUND(SUM(oi.price)::numeric, 2) AS revenue
    FROM orders o
    JOIN order_items oi
        ON o.order_id = oi.order_id
    WHERE o.order_status = 'delivered'
    GROUP BY 1
)

SELECT
    month,
    total_orders,
    revenue,

    ROUND(
        (
            revenue
            - LAG(revenue) OVER (ORDER BY month)
        )
        /
        NULLIF(
            LAG(revenue) OVER (ORDER BY month),
            0
        ) * 100,
        2
    ) AS mom_growth_percent

FROM revenue_by_month;


-- ============================================================
-- 2. CATEGORY PERFORMANCE
-- ============================================================

CREATE OR REPLACE VIEW category_performance AS

SELECT
    COALESCE(
        pct.product_category_name_english,
        p.product_category_name,
        'Unknown'
    ) AS category,

    COUNT(DISTINCT o.order_id) AS total_orders,

    COUNT(*) AS items_sold,

    ROUND(SUM(oi.price)::numeric, 2) AS revenue,

    ROUND(AVG(oi.price)::numeric, 2) AS average_item_price

FROM orders o

JOIN order_items oi
    ON o.order_id = oi.order_id

JOIN products p
    ON oi.product_id = p.product_id

LEFT JOIN product_category_translation pct
    ON p.product_category_name = pct.product_category_name

WHERE o.order_status = 'delivered'

GROUP BY 1;


-- ============================================================
-- 3. CUSTOMER METRICS
-- ============================================================

CREATE OR REPLACE VIEW customer_metrics AS

WITH customer_orders AS (
    SELECT
        c.customer_unique_id,
        COUNT(DISTINCT o.order_id) AS total_orders,
        ROUND(SUM(oi.price)::numeric, 2) AS lifetime_revenue

    FROM customers c

    JOIN orders o
        ON c.customer_id = o.customer_id

    JOIN order_items oi
        ON o.order_id = oi.order_id

    WHERE o.order_status = 'delivered'

    GROUP BY c.customer_unique_id
)

SELECT
    customer_unique_id,
    total_orders,
    lifetime_revenue,

    CASE
        WHEN total_orders > 1 THEN TRUE
        ELSE FALSE
    END AS repeat_customer

FROM customer_orders;


-- ============================================================
-- 4. DELIVERY PERFORMANCE
-- ============================================================

CREATE OR REPLACE VIEW delivery_performance AS

SELECT
    o.order_id,

    o.order_purchase_timestamp,

    o.order_delivered_customer_date,

    o.order_estimated_delivery_date,

    CASE
        WHEN o.order_delivered_customer_date
             > o.order_estimated_delivery_date
            THEN 'Late'
        ELSE 'On Time / Early'
    END AS delivery_status,

    ROUND(
        (
            EXTRACT(
                EPOCH FROM (
                    o.order_delivered_customer_date
                    - o.order_estimated_delivery_date
                )
            ) / 86400
        )::numeric,
        2
    ) AS days_vs_estimate,

    r.review_score

FROM orders o

LEFT JOIN reviews r
    ON o.order_id = r.order_id

WHERE
    o.order_status = 'delivered'
    AND o.order_delivered_customer_date IS NOT NULL
    AND o.order_estimated_delivery_date IS NOT NULL;
