from typing import Any


def analyze_category_drivers(
    current_categories: list[dict[str, Any]],
    previous_categories: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """
    Compare category revenue between two months and identify
    the categories contributing most to the revenue change.
    """

    previous_by_category = {
        row["category"]: float(row["revenue"])
        for row in previous_categories
    }

    drivers = []

    for row in current_categories:
        category = row["category"]
        current_revenue = float(row["revenue"])
        previous_revenue = previous_by_category.get(category, 0.0)

        revenue_change = current_revenue - previous_revenue

        if previous_revenue > 0:
            change_pct = (revenue_change / previous_revenue) * 100
        else:
            change_pct = None

        drivers.append(
            {
                "category": category,
                "current_revenue": round(current_revenue, 2),
                "previous_revenue": round(previous_revenue, 2),
                "revenue_change": round(revenue_change, 2),
                "change_pct": (
                    round(change_pct, 2)
                    if change_pct is not None
                    else None
                ),
            }
        )

    return sorted(
        drivers,
        key=lambda row: abs(row["revenue_change"]),
        reverse=True,
    )
