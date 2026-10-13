"use client";

import { useEffect, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

type Revenue = {
  month: string;
  total_orders: number;
  revenue: number;
  mom_growth_percent: number | null;
};

type Category = {
  category: string;
  total_orders: number;
  items_sold: number;
  revenue: number;
  average_item_price: number;
};

type CustomerMetrics = {
  total_customers: number;
  repeat_customers: number;
  repeat_customer_rate: number;
};

type Delivery = {
  delivery_status: string;
  total_orders: number;
  average_review_score: number;
  average_days_vs_estimate: number;
};

type Anomaly = {
  month: string;
  revenue: number;
  expected_revenue: number;
  deviation_pct: number;
  z_score: number;
  direction: "increase" | "decrease";
  severity: "medium" | "high" | "critical";
};

type RootCause = {
  category: string;
  current_revenue: number;
  previous_revenue: number;
  revenue_change: number;
  change_pct: number | null;
};

type ForecastPoint = {
  month: string;
  historical: number | null;
  forecast: number | null;
};

type Forecast = {
  model?: string;
  forecast?: ForecastPoint[];
  metrics?: {
    mae?: number;
    rmse?: number;
    mape?: number;
  };
};

type Recommendation = {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  insight: string;
  recommendation: string;
};

const API = "http://127.0.0.1:8000";

export default function Home() {
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<CustomerMetrics | null>(null);
  const [delivery, setDelivery] = useState<Delivery[]>([]);
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [forecast, setForecast] = useState<ForecastPoint[]>([]);
  const [forecastMetrics, setForecastMetrics] =
    useState<Forecast["metrics"]>(undefined);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);

  const [rootCauses, setRootCauses] = useState<RootCause[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<string | null>(null);
  const [rootCauseLoading, setRootCauseLoading] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [
          revenueRes,
          categoriesRes,
          customersRes,
          deliveryRes,
          anomaliesRes,
          forecastRes,
          recommendationsRes,
        ] = await Promise.all([
          fetch(`${API}/api/analytics/revenue`),
          fetch(`${API}/api/analytics/categories`),
          fetch(`${API}/api/analytics/customers`),
          fetch(`${API}/api/analytics/delivery`),
          fetch(`${API}/api/analytics/anomalies`),
          fetch(`${API}/api/analytics/forecast?periods=3`),
          fetch(`${API}/api/analytics/recommendations`),
        ]);

        if (
          !revenueRes.ok ||
          !categoriesRes.ok ||
          !customersRes.ok ||
          !deliveryRes.ok ||
          !anomaliesRes.ok
        ) {
          throw new Error("Failed to load core dashboard data");
        }

        setRevenue(await revenueRes.json());
        setCategories(await categoriesRes.json());
        setCustomers(await customersRes.json());
        setDelivery(await deliveryRes.json());
        setAnomalies(await anomaliesRes.json());

        if (forecastRes.ok) {
          const forecastData: Forecast = await forecastRes.json();
          setForecast(forecastData.forecast ?? []);
          setForecastMetrics(forecastData.metrics);
        }

        if (recommendationsRes.ok) {
          setRecommendations(await recommendationsRes.json());
        }
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  async function investigateAnomaly(month: string) {
    if (selectedAnomaly === month) {
      setSelectedAnomaly(null);
      setRootCauses([]);
      return;
    }

    try {
      setSelectedAnomaly(month);
      setRootCauses([]);
      setRootCauseLoading(true);

      const response = await fetch(
        `${API}/api/analytics/root-cause?month=${month}`
      );

      if (!response.ok) {
        throw new Error("Failed to load root-cause analysis");
      }

      const data: RootCause[] = await response.json();
      setRootCauses(data);
    } catch (error) {
      console.error("Failed to investigate anomaly:", error);
      setRootCauses([]);
    } finally {
      setRootCauseLoading(false);
    }
  }

  const totalRevenue = revenue.reduce(
    (sum, row) => sum + Number(row.revenue),
    0
  );

  const totalOrders = revenue.reduce(
    (sum, row) => sum + Number(row.total_orders),
    0
  );

  const topCategory = categories.length > 0 ? categories[0] : null;

  const lateDelivery = delivery.find(
    (row) => row.delivery_status === "Late"
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <p className="text-xl">Loading RetailPulse...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Header */}
        <div className="mb-10">
          <p className="text-blue-400 font-semibold mb-2">
            RETAIL INTELLIGENCE
          </p>

          <h1 className="text-4xl font-bold">
            RetailPulse
          </h1>

          <p className="text-slate-400 mt-2">
            E-commerce analytics and decision intelligence dashboard
          </p>
        </div>

        {/* KPI Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          <MetricCard
            title="Total Revenue"
            value={`$${totalRevenue.toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}`}
          />

          <MetricCard
            title="Total Orders"
            value={totalOrders.toLocaleString()}
          />

          <MetricCard
            title="Customers"
            value={customers?.total_customers.toLocaleString() ?? "—"}
          />

          <MetricCard
            title="Repeat Customer Rate"
            value={`${customers?.repeat_customer_rate ?? 0}%`}
          />
        </section>

        {/* Categories + Business Insights */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5">
              Top Product Categories
            </h2>

            <div className="space-y-4">
              {categories.slice(0, 5).map((category) => (
                <div
                  key={category.category}
                  className="flex justify-between border-b border-slate-800 pb-3"
                >
                  <div>
                    <p className="font-medium capitalize">
                      {category.category.replaceAll("_", " ")}
                    </p>

                    <p className="text-sm text-slate-400">
                      {category.total_orders.toLocaleString()} orders
                    </p>
                  </div>

                  <p className="font-semibold">
                    $
                    {Number(category.revenue).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5">
              Business Insights
            </h2>

            <div className="space-y-5">
              <Insight
                title="Top Revenue Category"
                value={
                  topCategory
                    ? topCategory.category.replaceAll("_", " ")
                    : "—"
                }
              />

              <Insight
                title="Late Deliveries"
                value={
                  lateDelivery
                    ? lateDelivery.total_orders.toLocaleString()
                    : "—"
                }
              />

              <Insight
                title="Late Delivery Review Score"
                value={
                  lateDelivery
                    ? `${lateDelivery.average_review_score}/5`
                    : "—"
                }
              />

              <Insight
                title="Repeat Customers"
                value={
                  customers?.repeat_customers.toLocaleString() ?? "—"
                }
              />
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {/* Revenue Trend */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">
              Revenue Trend
            </h2>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tickFormatter={(value) =>
                      new Date(String(value)).toLocaleDateString("en-US", {
                        month: "short",
                        year: "2-digit",
                      })
                    }
                  />

                  <YAxis
                    stroke="#94a3b8"
                    tickFormatter={(value) =>
                      `$${(Number(value) / 1000000).toFixed(1)}M`
                    }
                  />

                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value ?? 0).toLocaleString()}`,
                      "Revenue",
                    ]}
                    labelFormatter={(value) =>
                      new Date(String(value ?? "")).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          year: "numeric",
                        }
                      )
                    }
                  />

                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Forecast */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Revenue Forecast
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  3-month revenue projection based on Holt trend forecasting
                </p>
              </div>

              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-500/10 text-blue-400">
                Holt Trend
              </span>
            </div>

            {forecast.length === 0 ? (
              <p className="text-slate-400">
                Forecast data unavailable.
              </p>
            ) : (
              <>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forecast}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#1e293b"
                      />

                      <XAxis
                        dataKey="month"
                        stroke="#94a3b8"
                        tickFormatter={(value) =>
                          new Date(String(value)).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              year: "2-digit",
                            }
                          )
                        }
                      />

                      <YAxis
                        stroke="#94a3b8"
                        tickFormatter={(value) =>
                          `$${(Number(value) / 1000000).toFixed(1)}M`
                        }
                      />

                      <Tooltip
                        formatter={(value, name) => [
                          `$${Number(value ?? 0).toLocaleString()}`,
                          String(name),
                        ]}
                        labelFormatter={(value) =>
                          new Date(String(value ?? "")).toLocaleDateString(
                            "en-US",
                            {
                              month: "long",
                              year: "numeric",
                            }
                          )
                        }
                      />

                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="predicted_revenue"
                        name="Forecast Revenue"
                        stroke="#a855f7"
                        strokeWidth={3}
                        strokeDasharray="6 6"
                        dot={{ r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {forecastMetrics && (
                  <div className="mt-5 text-sm text-slate-400">
                    Backtested performance
                    {forecastMetrics.mae !== undefined &&
                      ` · MAE $${Number(
                        forecastMetrics.mae
                      ).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`}
                    {forecastMetrics.rmse !== undefined &&
                      ` · RMSE $${Number(
                        forecastMetrics.rmse
                      ).toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })}`}
                    {forecastMetrics.mape !== undefined &&
                      ` · MAPE ${Number(
                        forecastMetrics.mape
                      ).toFixed(2)}%`}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Business Recommendations */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Business Recommendations
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Data-driven actions based on customer, delivery, revenue,
                  and forecast signals
                </p>
              </div>

              <span className="text-sm text-slate-400">
                {recommendations.length} insights
              </span>
            </div>

            {recommendations.length === 0 ? (
              <p className="text-slate-400">
                No recommendations available.
              </p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {recommendations.map((item) => (
                  <div
                    key={item.id}
                    className="border border-slate-800 rounded-lg p-5 bg-slate-950/30"
                  >
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="text-xs text-slate-400 uppercase tracking-wide">
                        {item.category}
                      </span>

                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded ${
                          item.priority === "critical"
                            ? "bg-red-500/15 text-red-400"
                            : item.priority === "high"
                            ? "bg-orange-500/15 text-orange-400"
                            : item.priority === "medium"
                            ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-blue-500/15 text-blue-400"
                        }`}
                      >
                        {item.priority.toUpperCase()}
                      </span>
                    </div>

                    <h3 className="font-semibold text-lg mb-2">
                      {item.title}
                    </h3>

                    <p className="text-sm text-slate-400 mb-4">
                      {item.insight}
                    </p>

                    <div className="border-t border-slate-800 pt-3">
                      <p className="text-xs text-blue-400 font-semibold uppercase tracking-wide mb-1">
                        Recommended Action
                      </p>

                      <p className="text-sm text-slate-300">
                        {item.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Revenue Anomalies */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold">
                  Revenue Anomaly Alerts
                </h2>

                <p className="text-sm text-slate-400 mt-1">
                  Unusual revenue movements detected against the rolling
                  baseline
                </p>
              </div>

              <span className="text-sm text-slate-400">
                {anomalies.length} detected
              </span>
            </div>

            {anomalies.length === 0 ? (
              <p className="text-slate-400">
                No revenue anomalies detected.
              </p>
            ) : (
              <div className="space-y-3">
                {anomalies.map((anomaly) => (
                  <div
                    key={anomaly.month}
                    className="border border-slate-800 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between gap-6">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold">
                          {new Date(
                            `${anomaly.month}-01`
                          ).toLocaleDateString("en-US", {
                            month: "long",
                            year: "numeric",
                          })}
                        </p>

                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded ${
                            anomaly.severity === "critical"
                              ? "bg-red-500/15 text-red-400"
                              : anomaly.severity === "high"
                              ? "bg-orange-500/15 text-orange-400"
                              : "bg-yellow-500/15 text-yellow-400"
                          }`}
                        >
                          {anomaly.severity.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-slate-400">
                          Expected $
                          {Number(
                            anomaly.expected_revenue
                          ).toLocaleString()}{" "}
                          · Actual $
                          {Number(anomaly.revenue).toLocaleString()}
                        </p>

                        <p
                          className={`font-semibold ${
                            anomaly.direction === "increase"
                              ? "text-green-400"
                              : "text-red-400"
                          }`}
                        >
                          {anomaly.direction === "increase" ? "+" : ""}
                          {Number(anomaly.deviation_pct).toFixed(1)}%
                        </p>

                        <p className="text-xs text-slate-500 mt-1">
                          z-score {Number(anomaly.z_score).toFixed(2)}
                        </p>

                        <button
                          type="button"
                          onClick={() =>
                            investigateAnomaly(anomaly.month)
                          }
                          className="mt-2 text-xs font-semibold text-blue-400 hover:text-blue-300"
                        >
                          {selectedAnomaly === anomaly.month
                            ? "Hide Analysis"
                            : "Investigate →"}
                        </button>
                      </div>
                    </div>

                    {selectedAnomaly === anomaly.month && (
                      <div className="mt-4 pt-4 border-t border-slate-800">
                        <p className="text-sm font-semibold mb-3">
                          Root Cause Analysis
                        </p>

                        {rootCauseLoading ? (
                          <p className="text-sm text-slate-400">
                            Analyzing category drivers...
                          </p>
                        ) : rootCauses.length === 0 ? (
                          <p className="text-sm text-slate-400">
                            No category drivers found.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {rootCauses.slice(0, 5).map((cause) => {
                              const change = cause.change_pct;

                              return (
                                <div
                                  key={cause.category}
                                  className="flex items-center justify-between bg-slate-950/40 rounded-md px-3 py-2"
                                >
                                  <span className="text-sm text-slate-300 capitalize">
                                    {cause.category.replaceAll("_", " ")}
                                  </span>

                                  <span
                                    className={`text-sm font-semibold ${
                                      change === null
                                        ? "text-slate-400"
                                        : change >= 0
                                        ? "text-green-400"
                                        : "text-red-400"
                                    }`}
                                  >
                                    {change === null
                                      ? "New"
                                      : `${
                                          change >= 0 ? "+" : ""
                                        }${change.toFixed(1)}%`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Performance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-2">
              Delivery Performance
            </h2>

            <p className="text-sm text-slate-400 mb-6">
              Customer review scores by delivery status
            </p>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={delivery}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1e293b"
                  />

                  <XAxis
                    dataKey="delivery_status"
                    stroke="#94a3b8"
                  />

                  <YAxis
                    domain={[0, 5]}
                    stroke="#94a3b8"
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${Number(value ?? 0).toFixed(2)}/5`,
                      "Average Review Score",
                    ]}
                  />

                  <Bar
                    dataKey="average_review_score"
                    fill="#3b82f6"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Monthly Performance */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-5">
              Recent Monthly Performance
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="pb-3">
                      Month
                    </th>
                    <th className="pb-3">
                      Orders
                    </th>
                    <th className="pb-3">
                      Revenue
                    </th>
                    <th className="pb-3">
                      MoM Growth
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {revenue
                    .slice(-8)
                    .reverse()
                    .map((row) => (
                      <tr
                        key={row.month}
                        className="border-b border-slate-800"
                      >
                        <td className="py-4">
                          {new Date(row.month).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </td>

                        <td>
                          {row.total_orders.toLocaleString()}
                        </td>

                        <td>
                          $
                          {Number(row.revenue).toLocaleString()}
                        </td>

                        <td
                          className={
                            row.mom_growth_percent === null
                              ? "text-slate-400"
                              : row.mom_growth_percent >= 0
                              ? "text-green-400"
                              : "text-red-400"
                          }
                        >
                          {row.mom_growth_percent === null
                            ? "—"
                            : `${
                                row.mom_growth_percent >= 0
                                  ? "+"
                                  : ""
                              }${row.mom_growth_percent}%`}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
      <p className="text-slate-400 text-sm mb-2">
        {title}
      </p>

      <p className="text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}

function Insight({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-sm text-slate-400">
        {title}
      </p>

      <p className="text-xl font-semibold capitalize mt-1">
        {value}
      </p>
    </div>
  );
}