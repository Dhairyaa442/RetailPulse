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

const API = "http://127.0.0.1:8000";

export default function Home() {
  const [revenue, setRevenue] = useState<Revenue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<CustomerMetrics | null>(null);
  const [delivery, setDelivery] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [revenueRes, categoriesRes, customersRes, deliveryRes] =
          await Promise.all([
            fetch(`${API}/api/analytics/revenue`),
            fetch(`${API}/api/analytics/categories`),
            fetch(`${API}/api/analytics/customers`),
            fetch(`${API}/api/analytics/delivery`),
          ]);

        setRevenue(await revenueRes.json());
        setCategories(await categoriesRes.json());
        setCustomers(await customersRes.json());
        setDelivery(await deliveryRes.json());
      } catch (error) {
        console.error("Failed to load dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

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
                    <p className="font-medium">
                      {category.category.replaceAll("_", " ")}
                    </p>

                    <p className="text-sm text-slate-400">
                      {category.total_orders.toLocaleString()} orders
                    </p>
                  </div>

                  <p className="font-semibold">
                    ${Number(category.revenue).toLocaleString()}
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

        <section className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold mb-6">Revenue Trend</h2>

            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        year: "2-digit",
                      })
                    }
                  />

                  <YAxis
                    stroke="#94a3b8"
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `$${Number(value).toLocaleString()}`,
                      "Revenue",
                    ]}
                    labelFormatter={(value) =>
                      new Date(value).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />

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
                      `${Number(value).toFixed(2)}/5`,
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
          <h2 className="text-xl font-semibold mb-5">
            Recent Monthly Performance
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left">

              <thead className="text-slate-400 border-b border-slate-700">
                <tr>
                  <th className="pb-3">Month</th>
                  <th className="pb-3">Orders</th>
                  <th className="pb-3">Revenue</th>
                  <th className="pb-3">MoM Growth</th>
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
                        {new Date(row.month).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })}
                      </td>

                      <td>
                        {row.total_orders.toLocaleString()}
                      </td>

                      <td>
                        ${Number(row.revenue).toLocaleString()}
                      </td>

                      <td
                        className={
                          Number(row.mom_growth_percent) >= 0
                            ? "text-green-400"
                            : "text-red-400"
                        }
                      >
                        {row.mom_growth_percent === null
                          ? "—"
                          : `${row.mom_growth_percent}%`}
                      </td>
                    </tr>
                  ))}
              </tbody>

            </table>
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