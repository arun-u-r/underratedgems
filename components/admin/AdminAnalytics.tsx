"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Analytics = {
  days: number;
  total: number;
  daily: Array<{ date: string; clicks: number }>;
  retailers: Array<{ retailer: string; clicks: number }>;
  products: Array<{ title: string; slug: string; clicks: number }>;
};

export function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Analytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/admin/analytics?days=${days}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as Analytics & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load analytics.");
        setData(result);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Unable to load analytics.");
        }
      });
    return () => controller.abort();
  }, [days]);

  return (
    <div className="admin-analytics">
      <div className="admin-analytics-toolbar">
        <p>Only recorded outbound retailer clicks are shown. These are not purchases or commissions.</p>
        <label>
          <span className="sr-only">Analytics date range</span>
          <select onChange={(event) => setDays(Number(event.target.value))} value={days}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </label>
      </div>
      {error && <p className="admin-error-banner">{error}</p>}
      {data && (
        <>
          <article className="admin-metric-card admin-analytics-total">
            <span>Recorded outbound clicks · last {days} days</span>
            <strong>{data.total.toLocaleString()}</strong>
          </article>
          <section className="admin-panel admin-chart-panel">
            <div className="admin-panel-heading">
              <div>
                <p className="eyebrow">Measured over time</p>
                <h2>Daily outbound clicks</h2>
              </div>
            </div>
            {data.daily.length ? (
              <div className="admin-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.daily}>
                    <CartesianGrid stroke="#e7e2d9" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#77746b", fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: "#77746b", fontSize: 11 }}
                      tickLine={false}
                    />
                    <Tooltip />
                    <Bar dataKey="clicks" fill="#68705c" maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="admin-muted">No click activity in this period.</p>
            )}
          </section>
          <div className="admin-analytics-columns">
            <AnalyticsTable
              title="By retailer"
              label="Retailer"
              rows={data.retailers.map((item) => ({
                name: item.retailer,
                clicks: item.clicks,
              }))}
            />
            <AnalyticsTable
              title="By product"
              label="Product"
              rows={data.products.map((item) => ({
                name: item.title,
                clicks: item.clicks,
              }))}
            />
          </div>
        </>
      )}
      {!data && !error && <p className="admin-muted">Loading recorded click data…</p>}
    </div>
  );
}

function AnalyticsTable({
  title,
  label,
  rows,
}: {
  title: string;
  label: string;
  rows: Array<{ name: string; clicks: number }>;
}) {
  return (
    <section className="admin-panel">
      <div className="admin-panel-heading">
        <div>
          <p className="eyebrow">Last period</p>
          <h2>{title}</h2>
        </div>
      </div>
      {rows.length ? (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>{label}</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.name}>
                  <td>{row.name}</td>
                  <td>{row.clicks.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="admin-muted">No measured clicks for this period.</p>
      )}
    </section>
  );
}
