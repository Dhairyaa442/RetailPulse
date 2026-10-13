def generate_recommendations(
    customer_metrics,
    delivery_metrics,
    anomalies,
    forecast,
):
    recommendations = []

    # Customer retention
    repeat_rate = float(customer_metrics.get("repeat_customer_rate", 0))

    if repeat_rate < 10:
        recommendations.append({
            "id": "customer-retention",
            "priority": "high",
            "category": "Customer Retention",
            "title": "Low Repeat Customer Rate",
            "insight": (
                f"Only {repeat_rate:.1f}% of customers made repeat purchases."
            ),
            "recommendation": (
                "Prioritize retention initiatives such as targeted "
                "re-engagement campaigns and loyalty incentives."
            ),
        })

    # Delivery performance
    late_delivery = next(
        (
            row
            for row in delivery_metrics
            if row.get("delivery_status") == "Late"
        ),
        None,
    )

    if late_delivery:
        late_orders = int(late_delivery.get("total_orders", 0))
        review_score = float(
            late_delivery.get("average_review_score", 0)
        )

        if late_orders > 0 and review_score < 3:
            recommendations.append({
                "id": "delivery-performance",
                "priority": "critical",
                "category": "Operations",
                "title": "Late Deliveries Are Hurting Customer Satisfaction",
                "insight": (
                    f"{late_orders:,} orders were delivered late, "
                    f"with an average review score of {review_score:.2f}/5."
                ),
                "recommendation": (
                    "Investigate fulfillment and logistics bottlenecks "
                    "and prioritize reducing late-delivery volume."
                ),
            })

    # Revenue anomalies
    critical_anomalies = [
        anomaly
        for anomaly in anomalies
        if anomaly.get("severity") == "critical"
    ]

    if critical_anomalies:
        recommendations.append({
            "id": "revenue-anomalies",
            "priority": "high",
            "category": "Revenue",
            "title": "Critical Revenue Movement Detected",
            "insight": (
                f"{len(critical_anomalies)} critical revenue anomaly "
                "was detected in the historical data."
            ),
            "recommendation": (
                "Review the categories driving the abnormal revenue "
                "movement before using it as a baseline for planning."
            ),
        })

    # Forecast outlook
    forecast_rows = forecast.get("forecast", [])

    if len(forecast_rows) >= 2:
        first = float(forecast_rows[0]["predicted_revenue"])
        last = float(forecast_rows[-1]["predicted_revenue"])

        change_pct = ((last - first) / first) * 100 if first else 0

        if change_pct < -3:
            recommendations.append({
                "id": "revenue-forecast",
                "priority": "high",
                "category": "Forecast",
                "title": "Revenue Is Forecast to Decline",
                "insight": (
                    f"Revenue is projected to decline {abs(change_pct):.1f}% "
                    "across the forecast horizon."
                ),
                "recommendation": (
                    "Review category-level demand trends and prepare "
                    "targeted actions for weakening product segments."
                ),
            })

    priority_order = {
        "critical": 0,
        "high": 1,
        "medium": 2,
        "low": 3,
    }

    recommendations.sort(
        key=lambda item: priority_order[item["priority"]]
    )

    return recommendations
