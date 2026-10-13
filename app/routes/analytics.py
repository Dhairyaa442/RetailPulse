from fastapi import APIRouter
from sqlalchemy import text

from app.database import engine
from app.services.anomaly_detection import detect_revenue_anomalies
from app.services.recommendations import generate_recommendations
from app.services.root_cause import analyze_category_drivers
from app.services.forecasting import (
    backtest_moving_average,
    backtest_linear_trend,
    backtest_holt_trend,
    forecast_future_revenue,
)


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
    customer_query = text("""
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
        row = connection.execute(customer_query).mappings().one()

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


@router.get("/anomalies")
def get_revenue_anomalies():
    query = text("""
        SELECT
            month,
            revenue
        FROM monthly_revenue
        ORDER BY month;
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    revenue_data = [dict(row) for row in rows]

    return detect_revenue_anomalies(revenue_data)


@router.get("/root-cause")
def get_root_cause(month: str):
    query = text("""
        SELECT
            COALESCE(
                pct.product_category_name_english,
                p.product_category_name
            ) AS category,
            SUM(oi.price)::numeric AS revenue
        FROM orders o
        JOIN order_items oi
            ON o.order_id = oi.order_id
        JOIN products p
            ON oi.product_id = p.product_id
        LEFT JOIN product_category_translation pct
            ON p.product_category_name = pct.product_category_name
        WHERE DATE_TRUNC('month', o.order_purchase_timestamp) =
              DATE_TRUNC('month', CAST(:month AS DATE))
        GROUP BY 1
        ORDER BY revenue DESC;
    """)

    current_month = f"{month}-01"

    previous_month_query = text("""
        SELECT
            (
                DATE_TRUNC('month', CAST(:month AS DATE))
                - INTERVAL '1 month'
            )::date
    """)

    with engine.connect() as connection:
        previous_month = connection.execute(
            previous_month_query,
            {"month": current_month},
        ).scalar()

        current_rows = connection.execute(
            query,
            {"month": current_month},
        ).mappings().all()

        previous_rows = connection.execute(
            query,
            {"month": previous_month},
        ).mappings().all()

    current_categories = [
        dict(row) for row in current_rows
    ]

    previous_categories = [
        dict(row) for row in previous_rows
    ]

    return analyze_category_drivers(
        current_categories,
        previous_categories,
    )


@router.get("/forecast/backtest")
def get_forecast_backtest():
    query = text("""
        SELECT
            month,
            revenue
        FROM monthly_revenue
        ORDER BY month;
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    revenue_data = [dict(row) for row in rows]

    return backtest_moving_average(
        revenue_data,
        window=3,
    )


@router.get("/forecast/backtest/linear")
def get_linear_forecast_backtest():
    query = text("""
        SELECT
            month,
            revenue
        FROM monthly_revenue
        ORDER BY month;
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    revenue_data = [dict(row) for row in rows]

    return backtest_linear_trend(revenue_data)


@router.get("/forecast/backtest/holt")
def get_holt_forecast_backtest():
    query = text("""
        SELECT
            month,
            revenue
        FROM monthly_revenue
        ORDER BY month;
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    revenue_data = [dict(row) for row in rows]

    return backtest_holt_trend(revenue_data)


@router.get("/forecast")
def get_revenue_forecast(periods: int = 3):
    periods = max(1, min(periods, 12))

    query = text("""
        SELECT
            month,
            revenue
        FROM monthly_revenue
        ORDER BY month;
    """)

    with engine.connect() as connection:
        rows = connection.execute(query).mappings().all()

    revenue_data = [dict(row) for row in rows]

    return forecast_future_revenue(
        revenue_data,
        periods=periods,
    )


@router.get("/recommendations")
def get_recommendations():
    customer_query = text("""
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

    delivery_query = text("""
        SELECT
            delivery_status,
            COUNT(DISTINCT order_id) AS total_orders,
            ROUND(AVG(review_score)::numeric, 2) AS average_review_score,
            ROUND(AVG(days_vs_estimate)::numeric, 2) AS average_days_vs_estimate
        FROM delivery_performance
        GROUP BY delivery_status
        ORDER BY delivery_status;
    """)

    revenue_query = text("""
        SELECT
            month,
            revenue
        FROM monthly_revenue
        ORDER BY month;
    """)

    with engine.connect() as connection:
        customer_row = connection.execute(
            customer_query
        ).mappings().one()

        delivery_rows = connection.execute(
            delivery_query
        ).mappings().all()

        revenue_rows = connection.execute(
            revenue_query
        ).mappings().all()

    customer_metrics = dict(customer_row)

    delivery_metrics = [
        dict(row) for row in delivery_rows
    ]

    revenue_data = [
        dict(row) for row in revenue_rows
    ]

    anomalies = detect_revenue_anomalies(revenue_data)

    forecast = forecast_future_revenue(
        revenue_data,
        periods=3,
    )

    return generate_recommendations(
        customer_metrics=customer_metrics,
        delivery_metrics=delivery_metrics,
        anomalies=anomalies,
        forecast=forecast,
    )