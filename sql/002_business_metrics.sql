-- ============================================================
-- RetailPulse Business Analytics
-- ============================================================


-- 1. MONTHLY REVENUE AND MONTH-OVER-MONTH GROWTH
-- Question: How is the business performing over time?

WITH monthly_revenue AS (
    SELECT
        DATE_TRUNC('month', o.order_purchase_timestamp) AS month,
        ROUND(SUM(oi.price)::numeric, 2) AS revenue
    FROM orders o
    JOIN order_items oi
        ON o.order_id = oi.order_id
    WHERE o.order_status = 'delivered'
    GROUP BY 1
),

revenue_growth AS (
    SELECT
        month,
        revenue,
        LAG(revenue) OVER (ORDER BY month) AS previous_month_revenue
    FROM monthly_revenue
)

SELECT
    month,
    revenue,
    previous_month_revenue,
    ROUND(
        (
            (revenue - previous_month_revenue)
            / NULLIF(previous_month_revenue, 0)
        ) * 100,
        2
    ) AS mom_growth_percent
FROM revenue_growth
ORDER BY month;


-- ============================================================


-- 2. AVERAGE ORDER VALUE
-- Question: How much revenue does an average delivered order generate?

WITH order_values AS (
    SELECT
        o.order_id,
        SUM(oi.price) AS order_value
    FROM orders o
    JOIN order_items oi
        ON o.order_id = oi.order_id
    WHERE o.order_status = 'delivered'
    GROUP BY o.order_id
)

SELECT
    ROUND(AVG(order_value)::numeric, 2) AS average_order_value
FROM order_values;


-- ============================================================


-- 3. TOP 10 PRODUCT CATEGORIES BY REVENUE
-- Question: Which categories contribute the most revenue?

SELECT
    COALESCE(
        pct.product_category_name_english,
        p.product_category_name,
        'Unknown'
    ) AS category,

    COUNT(DISTINCT o.order_id) AS total_orders,

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

GROUP BY 1
ORDER BY revenue DESC
LIMIT 10;


-- ============================================================


-- 4. REPEAT CUSTOMER RATE
-- Question: What percentage of customers purchase more than once?

WITH customer_orders AS (
    SELECT
        c.customer_unique_id,
        COUNT(DISTINCT o.order_id) AS order_count
    FROM customers c
    JOIN orders o
        ON c.customer_id = o.customer_id
    WHERE o.order_status = 'delivered'
    GROUP BY c.customer_unique_id
)

SELECT
    COUNT(*) AS total_customers,

    COUNT(*) FILTER (
        WHERE order_count > 1
    ) AS repeat_customers,

    ROUND(
        100.0 *
        COUNT(*) FILTER (WHERE order_count > 1)
        / NULLIF(COUNT(*), 0),
        2
    ) AS repeat_customer_rate_percent

FROM customer_orders;


-- ============================================================


-- 5. DELIVERY PERFORMANCE VS REVIEW SCORE
-- Question: Are late deliveries associated with worse reviews?

SELECT
    CASE
        WHEN o.order_delivered_customer_date
             > o.order_estimated_delivery_date
            THEN 'Late'

        ELSE 'On Time / Early'
    END AS delivery_status,

    COUNT(DISTINCT o.order_id) AS orders,

    ROUND(AVG(r.review_score)::numeric, 2) AS average_review_score,

    ROUND(
        AVG(
            EXTRACT(
                EPOCH FROM (
                    o.order_delivered_customer_date
                    - o.order_estimated_delivery_date
                )
            ) / 86400
        )::numeric,
        2
    ) AS avg_days_vs_estimate

FROM orders o

JOIN reviews r
    ON o.order_id = r.order_id

WHERE
    o.order_status = 'delivered'
    AND o.order_delivered_customer_date IS NOT NULL
    AND o.order_estimated_delivery_date IS NOT NULL

GROUP BY 1
ORDER BY average_review_score;
