from typing import Any

import pandas as pd


def detect_revenue_anomalies(
    revenue_data: list[dict[str, Any]],
    window: int = 6,
    z_threshold: float = 1.5,
    min_baseline_revenue: float = 100000,
) -> list[dict[str, Any]]:
    """
    Detect unusual monthly revenue movements using a rolling statistical baseline.

    Each month's revenue is compared with the mean and standard deviation
    of the preceding months. This prevents the current observation from
    influencing its own baseline.
    """
    if len(revenue_data) <= window:
        return []

    df = pd.DataFrame(revenue_data).copy()

    if "month" not in df.columns or "revenue" not in df.columns:
        raise ValueError("Revenue data must contain 'month' and 'revenue'.")

    df["month"] = pd.to_datetime(df["month"])
    df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce")

    df = (
        df.dropna(subset=["month", "revenue"])
        .sort_values("month")
        .reset_index(drop=True)
    )

    # Shift by one month so the current observation is not included
    # in the baseline used to evaluate itself.
    previous_revenue = df["revenue"].shift(1)

    df["rolling_mean"] = previous_revenue.rolling(
        window=window,
        min_periods=window,
    ).mean()

    df["rolling_std"] = previous_revenue.rolling(
        window=window,
        min_periods=window,
    ).std()

    df["z_score"] = (
        (df["revenue"] - df["rolling_mean"])
        / df["rolling_std"].replace(0, pd.NA)
    )

    anomalies: list[dict[str, Any]] = []

    for _, row in df.iterrows():
        if pd.isna(row["z_score"]):
            continue

        z_score = float(row["z_score"])
        if float(row["rolling_mean"]) < min_baseline_revenue:
            continue

        if abs(z_score) < z_threshold:
            continue

        deviation_pct = (
            (float(row["revenue"]) - float(row["rolling_mean"]))
            / float(row["rolling_mean"])
            * 100
        )

        if abs(z_score) >= 3:
            severity = "critical"
        elif abs(z_score) >= 2:
            severity = "high"
        else:
            severity = "medium"

        anomalies.append(
            {
                "month": row["month"].strftime("%Y-%m"),
                "revenue": round(float(row["revenue"]), 2),
                "expected_revenue": round(float(row["rolling_mean"]), 2),
                "deviation_pct": round(deviation_pct, 2),
                "z_score": round(z_score, 2),
                "direction": "increase" if z_score > 0 else "decrease",
                "severity": severity,
            }
        )

    return anomalies