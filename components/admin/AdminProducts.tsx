"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Edit3, LoaderCircle, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type ProductRow = {
  _id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  updatedAt: string;
  category?: { name?: string } | string;
};

type ProductListResponse = {
  products: ProductRow[];
  total: number;
  page: number;
  totalPages: number;
  error?: string;
};

async function getProduct(id: string) {
  const response = await fetch(`/api/admin/products/${id}`, { cache: "no-store" });
  const result = (await response.json()) as {
    product?: Record<string, unknown>;
    error?: string;
  };
  if (!response.ok || !result.product) {
    throw new Error(result.error ?? "Unable to load product.");
  }
  return result.product;
}

export function AdminProducts() {
  const [data, setData] = useState<ProductListResponse | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (query.trim()) params.set("q", query.trim());
    if (status) params.set("status", status);

    fetch(`/api/admin/products?${params}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as ProductListResponse;
        if (!response.ok) throw new Error(result.error ?? "Unable to load products.");
        setData(result);
        setError("");
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted) {
          setError(reason instanceof Error ? reason.message : "Unable to load products.");
        }
      });
    return () => controller.abort();
  }, [page, query, status, refresh]);

  async function updateStatus(product: ProductRow, nextStatus: ProductRow["status"]) {
    setBusyId(product._id);
    setError("");
    try {
      const current = await getProduct(product._id);
      const response = await fetch(`/api/admin/products/${product._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...current, status: nextStatus }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to update product.");
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to update product.");
    } finally {
      setBusyId("");
    }
  }

  async function duplicate(product: ProductRow) {
    setBusyId(product._id);
    setError("");
    try {
      const current = await getProduct(product._id);
      const body = {
        ...current,
        _id: undefined,
        title: `Copy of ${product.title}`,
        slug: `${product.slug}-copy`.slice(0, 180),
        status: "draft",
        featured: false,
      };
      const response = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to duplicate product.");
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to duplicate product.");
    } finally {
      setBusyId("");
    }
  }

  async function remove(product: ProductRow) {
    if (!window.confirm(`Delete "${product.title}"? This cannot be undone.`)) return;
    setBusyId(product._id);
    setError("");
    try {
      const response = await fetch(`/api/admin/products/${product._id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as {
        error?: string;
        warnings?: string[];
      };
      if (!response.ok) throw new Error(result.error ?? "Unable to delete product.");
      if (result.warnings?.length) {
        toast.warning(`Product deleted. ${result.warnings.join(" ")}`);
      }
      setRefresh((value) => value + 1);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete product.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <label className="admin-search">
          <span className="sr-only">Search products</span>
          <input
            onChange={(event) => {
              setPage(1);
              setQuery(event.target.value);
            }}
            placeholder="Search products…"
            value={query}
          />
        </label>
        <label className="admin-filter-select">
          <span className="sr-only">Filter by status</span>
          <select
            onChange={(event) => {
              setPage(1);
              setStatus(event.target.value);
            }}
            value={status}
          >
            <option value="">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <Link className="admin-primary-button" href="/admin/products/new">
          <Plus size={16} aria-hidden="true" /> Add product
        </Link>
      </div>
      {error && <p className="admin-error-banner">{error}</p>}
      {!data ? (
        <p className="admin-loading">
          <LoaderCircle size={18} aria-hidden="true" /> Loading products…
        </p>
      ) : data.products.length ? (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <strong>{product.title}</strong>
                      {product.featured && <small className="admin-featured-tag">Featured</small>}
                    </td>
                    <td>
                      {typeof product.category === "object"
                        ? product.category.name
                        : "—"}
                    </td>
                    <td>
                      <span className={`status-pill status-${product.status}`}>
                        {product.status}
                      </span>
                    </td>
                    <td>{new Date(product.updatedAt).toLocaleDateString()}</td>
                    <td>
                      <div className="admin-row-actions">
                        <Link
                          aria-label={`Edit ${product.title}`}
                          href={`/admin/products/${product._id}`}
                          title="Edit"
                        >
                          <Edit3 size={16} aria-hidden="true" />
                        </Link>
                        <button
                          aria-label={`Duplicate ${product.title}`}
                          disabled={busyId === product._id}
                          onClick={() => duplicate(product)}
                          title="Duplicate"
                          type="button"
                        >
                          <Copy size={16} aria-hidden="true" />
                        </button>
                        {product.status === "published" ? (
                          <button
                            disabled={busyId === product._id}
                            onClick={() => updateStatus(product, "draft")}
                            type="button"
                          >
                            Unpublish
                          </button>
                        ) : (
                          <button
                            disabled={busyId === product._id}
                            onClick={() => updateStatus(product, "published")}
                            type="button"
                          >
                            Publish
                          </button>
                        )}
                        {product.status !== "archived" && (
                          <button
                            disabled={busyId === product._id}
                            onClick={() => updateStatus(product, "archived")}
                            type="button"
                          >
                            Archive
                          </button>
                        )}
                        <button
                          aria-label={`Delete ${product.title}`}
                          disabled={busyId === product._id}
                          onClick={() => remove(product)}
                          title="Delete"
                          type="button"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-pagination">
            <span>
              {data.total.toLocaleString()} products · Page {data.page} of{" "}
              {Math.max(1, data.totalPages)}
            </span>
            <div>
              <button
                disabled={page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                type="button"
              >
                Previous
              </button>
              <button
                disabled={page >= data.totalPages}
                onClick={() => setPage((value) => value + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="admin-empty">
          <h2>No products yet.</h2>
          <p>Create a draft, add authorized images and retailer links, then publish when ready.</p>
          <Link className="admin-primary-button" href="/admin/products/new">
            <Plus size={16} aria-hidden="true" /> Add your first product
          </Link>
        </div>
      )}
    </section>
  );
}
