"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart, ExternalLink, LoaderCircle } from "lucide-react";

type OverviewData = {
  products: { total: number; published: number; drafts: number };
  categories: number;
  collections: number;
  outboundClicks: number;
  bestPerformers: Array<{
    id: string;
    title: string;
    slug: string;
    clicks: number;
  }>;
};

export function AdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/admin/overview", { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as OverviewData & { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to load overview.");
        if (active) setData(result);
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Unable to load overview.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, []);

  if (error) return <p className="admin-error-banner">{error}</p>;
  if (!data) {
    return (
      <p className="admin-loading">
        <LoaderCircle size={18} aria-hidden="true" /> Loading measured data…
      </p>
    );
  }

  const metrics = [
    { label: "Total products", value: data.products.total },
    { label: "Published", value: data.products.published },
    { label: "Drafts", value: data.products.drafts },
    { label: "Categories", value: data.categories },
    { label: "Collections", value: data.collections },
    { label: "Recorded outbound clicks", value: data.outboundClicks },
  ];

  return (
    <>
      <div className="admin-metric-grid">
        {metrics.map((metric) => (
          <article className="admin-metric-card" key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value.toLocaleString()}</strong>
          </article>
        ))}
      </div>
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Recorded outbound traffic</p>
            <h2>Best-performing products</h2>
          </div>
          <Link className="admin-text-link" href="/admin/analytics">
            <BarChart size={16} aria-hidden="true" /> View analytics
          </Link>
        </div>
        {data.bestPerformers.length ? (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Recorded clicks</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {data.bestPerformers.map((product) => (
                  <tr key={product.id}>
                    <td>{product.title}</td>
                    <td>{product.clicks.toLocaleString()}</td>
                    <td>
                      <Link
                        aria-label={`View ${product.title}`}
                        href={`/products/${product.slug}`}
                      >
                        <ExternalLink size={15} aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="admin-muted">
            No outbound clicks have been recorded yet. This area reports clicks
            only; it does not represent purchases, commissions, or revenue.
          </p>
        )}
      </section>
    </>
  );
}
