from fastapi import APIRouter
from sqlalchemy import text

from app.database import engine


router = APIRouter(
    prefix="/api/analytics",
    tags=["analytics"],
)


@router.get("/revenue")
def get_monthly_revenue():
    query = text("""
        SELECT
            month,
            total_orders,
            revenue,
            mom_growth_percent
        FROM monthly_revenue
        ORDER BY month;
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    return [dict(row) for row in rows]
@router.get("/categories")
def get_category_performance():
    query = text("""
        SELECT
            category,
            total_orders,
            items_sold,
            revenue,
            average_item_price
        FROM category_performance
        ORDER BY revenue DESC;
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    return [dict(row) for row in rows]


@router.get("/customers")
def get_customer_metrics():
    query = text("""
        SELECT
            COUNT(*) AS total_customers,
            COUNT(*) FILTER (
                WHERE repeat_customer = TRUE
            ) AS repeat_customers,
            ROUND(
                100.0 * COUNT(*) FILTER (
                    WHERE repeat_customer = TRUE
                ) / NULLIF(COUNT(*), 0),
                2
            ) AS repeat_customer_rate
        FROM customer_metrics;
    """)

    with engine.connect() as connection:
        row = connection.execute(query).mappings().one()

    return dict(row)


@router.get("/delivery")
def get_delivery_performance():
    query = text("""
        SELECT
            delivery_status,
            COUNT(DISTINCT order_id) AS total_orders,
            ROUND(AVG(review_score)::numeric, 2) AS average_review_score,
            ROUND(AVG(days_vs_estimate)::numeric, 2) AS average_days_vs_estimate
        FROM delivery_performance
        GROUP BY delivery_status
        ORDER BY delivery_status;
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    return [dict(row) for row in rows]