from typing import Any

import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from statsmodels.tsa.holtwinters import Holt


def prepare_revenue_series(
    revenue_data: list[dict[str, Any]],
) -> pd.DataFrame:
    """Convert monthly revenue records into a chronological time series."""

    df = pd.DataFrame(revenue_data).copy()

    if "month" not in df.columns or "revenue" not in df.columns:
        raise ValueError("Revenue data must contain 'month' and 'revenue'.")

    df["month"] = pd.to_datetime(df["month"])
    df["revenue"] = pd.to_numeric(df["revenue"], errors="coerce")

    return (
        df.dropna(subset=["month", "revenue"])
        .sort_values("month")
        .reset_index(drop=True)
    )


def moving_average_forecast(
    history: list[float],
    window: int = 3,
) -> float:
    """Predict the next month using recent average revenue."""

    if len(history) < window:
        raise ValueError(
            f"At least {window} observations are required."
        )

    return float(np.mean(history[-window:]))


def backtest_moving_average(
    revenue_data: list[dict[str, Any]],
    window: int = 3,
) -> dict[str, Any]:
    """Evaluate the baseline using walk-forward validation."""

    df = prepare_revenue_series(revenue_data)

    if len(df) <= window:
        raise ValueError("Not enough observations to backtest.")

    actuals = []
    predictions = []
    backtest = []

    revenues = df["revenue"].astype(float).tolist()

    for index in range(window, len(df)):
        history = revenues[:index]

        predicted = moving_average_forecast(
            history,
            window,
        )

        actual = revenues[index]

        actuals.append(actual)
        predictions.append(predicted)

        backtest.append(
            {
                "month": df.iloc[index]["month"].strftime("%Y-%m"),
                "actual": round(actual, 2),
                "predicted": round(predicted, 2),
            }
        )

    actual_array = np.array(actuals)
    prediction_array = np.array(predictions)

    errors = actual_array - prediction_array

    mae = np.mean(np.abs(errors))
    rmse = np.sqrt(np.mean(errors**2))

    nonzero = actual_array != 0

    mape = (
        np.mean(
            np.abs(
                (
                    actual_array[nonzero]
                    - prediction_array[nonzero]
                )
                / actual_array[nonzero]
            )
        )
        * 100
    )

    return {
        "model": f"{window}-month moving average",
        "observations": len(backtest),
        "metrics": {
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "mape": round(float(mape), 2),
        },
        "backtest": backtest,
    }
def backtest_linear_trend(
    revenue_data: list[dict[str, Any]],
    min_train_size: int = 3,
) -> dict[str, Any]:
    """Backtest a linear trend model using walk-forward validation."""

    df = prepare_revenue_series(revenue_data)

    if len(df) <= min_train_size:
        raise ValueError("Not enough observations to backtest.")

    revenues = df["revenue"].astype(float).to_numpy()

    actuals = []
    predictions = []
    backtest = []

    for index in range(min_train_size, len(df)):
        X_train = np.arange(index).reshape(-1, 1)
        y_train = revenues[:index]

        model = LinearRegression()
        model.fit(X_train, y_train)

        predicted = float(
            model.predict(np.array([[index]]))[0]
        )

        actual = float(revenues[index])

        actuals.append(actual)
        predictions.append(predicted)

        backtest.append(
            {
                "month": df.iloc[index]["month"].strftime("%Y-%m"),
                "actual": round(actual, 2),
                "predicted": round(predicted, 2),
            }
        )

    actual_array = np.array(actuals)
    prediction_array = np.array(predictions)

    errors = actual_array - prediction_array

    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors**2)))

    nonzero = actual_array != 0

    mape = float(
        np.mean(
            np.abs(
                (
                    actual_array[nonzero]
                    - prediction_array[nonzero]
                )
                / actual_array[nonzero]
            )
        )
        * 100
    )

    return {
        "model": "linear trend regression",
        "observations": len(backtest),
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
        },
        "backtest": backtest,
    }
def backtest_holt_trend(
    revenue_data: list[dict[str, Any]],
    min_train_size: int = 3,
) -> dict[str, Any]:
    """Backtest Holt's linear trend model using walk-forward validation."""

    df = prepare_revenue_series(revenue_data)

    if len(df) <= min_train_size:
        raise ValueError("Not enough observations to backtest.")

    revenues = df["revenue"].astype(float).to_numpy()

    actuals = []
    predictions = []
    backtest = []

    for index in range(min_train_size, len(df)):
        history = revenues[:index]

        model = Holt(
            history,
            initialization_method="estimated",
        ).fit(optimized=True)

        predicted = float(model.forecast(1)[0])
        actual = float(revenues[index])

        actuals.append(actual)
        predictions.append(predicted)

        backtest.append(
            {
                "month": df.iloc[index]["month"].strftime("%Y-%m"),
                "actual": round(actual, 2),
                "predicted": round(predicted, 2),
            }
        )

    actual_array = np.array(actuals)
    prediction_array = np.array(predictions)

    errors = actual_array - prediction_array

    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors**2)))

    nonzero = actual_array != 0

    mape = float(
        np.mean(
            np.abs(
                (
                    actual_array[nonzero]
                    - prediction_array[nonzero]
                )
                / actual_array[nonzero]
            )
        )
        * 100
    )

    return {
        "model": "Holt linear trend",
        "observations": len(backtest),
        "metrics": {
            "mae": round(mae, 2),
            "rmse": round(rmse, 2),
            "mape": round(mape, 2),
        },
        "backtest": backtest,
    }
def forecast_future_revenue(
    revenue_data: list[dict[str, Any]],
    periods: int = 3,
) -> dict[str, Any]:
    """Forecast future monthly revenue using Holt's linear trend model."""

    df = prepare_revenue_series(revenue_data)

    if len(df) < 3:
        raise ValueError("At least 3 observations are required.")

    revenues = df["revenue"].astype(float).to_numpy()

    model = Holt(
        revenues,
        initialization_method="estimated",
    ).fit(optimized=True)

    predictions = model.forecast(periods)

    last_month = df.iloc[-1]["month"]

    forecast = []

    for step, prediction in enumerate(predictions, start=1):
        forecast_month = last_month + pd.DateOffset(months=step)

        forecast.append(
            {
                "month": forecast_month.strftime("%Y-%m"),
                "predicted_revenue": round(
                    max(0.0, float(prediction)),
                    2,
                ),
            }
        )

    return {
        "model": "Holt linear trend",
        "forecast_horizon": periods,
        "forecast": forecast,
    }