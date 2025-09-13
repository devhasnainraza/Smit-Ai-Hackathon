

"use client";

import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  BarChart,
  Bar,
} from "recharts";

type SalesData = { _id: string; total_sales: number; order_count: number };
type Customer = { _id: string; orders: number };

type ApiSalesItem = { _id?: unknown; total_sales?: unknown; order_count?: unknown };
type ApiSalesResponse = { sales?: ApiSalesItem[] };
type ApiRevenueResponse = { revenue?: number | string };
type ApiCustomerItem = { _id?: unknown; orders?: unknown };
type ApiCustomersResponse = { customers?: ApiCustomerItem[] };

const formatPKR = (val: number) =>
  new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(val);

export default function AnalyticsPage() {
  const [sales, setSales] = useState<SalesData[]>([]);
  const [revenue, setRevenue] = useState<number>(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchJson = async <T,>(url: string): Promise<T> => {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`${url} -> ${res.status}`);
      return res.json() as Promise<T>;
    };

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
        const [salesRes, revenueRes, customersRes] = await Promise.all([
          fetchJson<ApiSalesResponse>(`${apiBase}/api/analytics/sales-by-date`),
          fetchJson<ApiRevenueResponse>(`${apiBase}/api/analytics/total-revenue`),
          fetchJson<ApiCustomersResponse>(`${apiBase}/api/analytics/loyal-customers`),
        ]);

        const salesClean: SalesData[] = Array.isArray(salesRes?.sales)
          ? salesRes.sales.map((s) => ({
              _id: String(s._id ?? ""),
              total_sales: Number(s.total_sales ?? 0),
              order_count: Number(s.order_count ?? 0),
            }))
          : [];

        const revenueClean = Number(revenueRes?.revenue ?? 0);

        const customersClean: Customer[] = Array.isArray(customersRes?.customers)
          ? customersRes.customers.map((c) => ({
              _id: String(c._id ?? ""),
              orders: Number(c.orders ?? 0),
            }))
          : [];

        setSales(salesClean);
        setRevenue(revenueClean);
        setCustomers(customersClean);
      } catch (err: unknown) {
        const isAbort = err instanceof DOMException && err.name === "AbortError";
        if (!isAbort) {
          console.error("Analytics fetch failed:", err);
          setError("Failed to load analytics. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, []);

  return (
    <div className="p-4 sm:p-6 md:p-8 min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <h1 className="text-3xl sm:text-4xl font-extrabold text-blue-800 mb-6 sm:mb-10 text-center drop-shadow-lg tracking-wide">
        📊 Analytics Dashboard
      </h1>

      {error && (
        <div className="max-w-2xl mx-auto mb-6 rounded-lg bg-red-50 text-red-700 border border-red-200 px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center text-base sm:text-lg">Loading...</div>
      ) : (
        <div className="flex flex-col gap-6 sm:gap-10">
          {/* Revenue */}
          <div className="flex flex-col items-center justify-center gap-4 sm:gap-8">
            <div className="bg-white rounded-2xl shadow-lg px-6 sm:px-10 py-6 sm:py-8 text-center w-full max-w-xs">
              <div className="text-xl sm:text-2xl font-bold text-blue-700 mb-2">Total Revenue</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-green-700">
                {formatPKR(revenue)}
              </div>
            </div>
          </div>

          {/* Sales Graph */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <div className="text-lg sm:text-xl font-bold text-blue-700 mb-4">
              Date-wise Sales (Last 7 Days)
            </div>
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={sales}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number | string, name: string) => {
                      if (name === "total_sales") return [formatPKR(Number(value)), "Total Sales"];
                      if (name === "order_count") return [Number(value), "Orders"];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Line
                    type="monotone"
                    dataKey="total_sales"
                    name="Total Sales"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="order_count"
                    name="Orders"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Loyal Customers */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8">
            <div className="text-lg sm:text-xl font-bold text-blue-700 mb-4">
              Most Loyal Customers
            </div>
            <div className="h-[250px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={customers}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "12px" }} />
                  <Bar dataKey="orders" fill="#2563eb" name="Orders" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-6 overflow-x-auto">
              <ul className="text-sm sm:text-base">
                {customers.map((c) => (
                  <li key={c._id} className="mb-2">
                    <span className="font-bold text-blue-700">Session:</span> {c._id}{" "}
                    <span className="text-green-700 font-semibold">({c.orders} orders)</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
