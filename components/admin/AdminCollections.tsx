"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";

type ProductOption = { _id: string; title: string; status: string };
type Collection = {
  _id: string;
  title: string;
  slug: string;
  description: string;
  products: Array<string | ProductOption>;
  coverImage?: { url: string; publicId?: string; alt: string; order: number };
  published: boolean;
  position: number;
};

type CollectionForm = Omit<Collection, "_id" | "coverImage"> & {
  coverImage?: Collection["coverImage"] | null;
};
const blank: CollectionForm = {
  title: "",
  slug: "",
  description: "",
  products: [],
  published: false,
  position: 0,
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AdminCollections() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [form, setForm] = useState<CollectionForm>(blank);
  const [editingId, setEditingId] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchData() {
    const [collectionResponse, productResponse] = await Promise.all([
        fetch("/api/admin/collections", { cache: "no-store" }),
        fetch("/api/admin/products?limit=48&status=published", {
          cache: "no-store",
        }),
      ]);
    const [collectionResult, productResult] = (await Promise.all([
        collectionResponse.json(),
        productResponse.json(),
      ])) as [
        { collections?: Collection[]; error?: string },
        { products?: ProductOption[]; error?: string },
      ];
      if (!collectionResponse.ok) {
        throw new Error(collectionResult.error ?? "Unable to load collections.");
      }
      if (!productResponse.ok) {
        throw new Error(productResult.error ?? "Unable to load product options.");
      }
    return {
      collections: collectionResult.collections ?? [],
      products: productResult.products ?? [],
    };
  }

  async function load() {
    setLoading(true);
    try {
      const data = await fetchData();
      setCollections(data.collections);
      setProducts(data.products);
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load collections.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchData()
      .then((data) => {
        if (active) {
          setCollections(data.collections);
          setProducts(data.products);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Unable to load collections.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function edit(collection: Collection) {
    setEditingId(collection._id);
    setAutoSlug(false);
    setForm({
      title: collection.title,
      slug: collection.slug,
      description: collection.description,
      products: collection.products.map((product) =>
        typeof product === "string" ? product : product._id,
      ),
      published: collection.published,
      position: collection.position,
      ...(collection.coverImage ? { coverImage: collection.coverImage } : {}),
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        editingId ? `/api/admin/collections/${editingId}` : "/api/admin/collections",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            products: form.products.map((product) =>
              typeof product === "string" ? product : product._id,
            ),
          }),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to save collection.");
      setForm(blank);
      setEditingId("");
      setAutoSlug(true);
      setLoading(true);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save collection.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(collection: Collection) {
    if (!window.confirm(`Delete "${collection.title}"?`)) return;
    try {
      const response = await fetch(`/api/admin/collections/${collection._id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to delete collection.");
      setLoading(true);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete collection.");
    }
  }

  function moveProduct(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= form.products.length) return;
    const reordered = [...form.products];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setForm((current) => ({ ...current, products: reordered }));
  }

  return (
    <div className="admin-two-column">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Curated edits</p>
            <h2>Collections</h2>
          </div>
        </div>
        {error && <p className="admin-error-banner">{error}</p>}
        {loading ? (
          <p className="admin-muted">Loading collections…</p>
        ) : collections.length ? (
          <div className="admin-category-list">
            {collections.map((collection) => (
              <article className="admin-category-row" key={collection._id}>
                <span className="admin-category-copy">
                  <strong>{collection.title}</strong>
                  <small>/{collection.slug} · {collection.products.length} products</small>
                </span>
                <span className={`status-pill ${collection.published ? "status-published" : "status-draft"}`}>
                  {collection.published ? "Published" : "Draft"}
                </span>
                <div className="admin-row-actions">
                  <button onClick={() => edit(collection)} type="button">
                    Edit
                  </button>
                  <button
                    aria-label={`Delete ${collection.title}`}
                    onClick={() => remove(collection)}
                    type="button"
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="admin-muted">No curated collections have been created.</p>
        )}
      </section>

      <form className="admin-panel admin-editor-form" onSubmit={save}>
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">{editingId ? "Update edit" : "Create edit"}</p>
            <h2>{editingId ? "Edit collection" : "New collection"}</h2>
          </div>
        </div>
        <label className="admin-field">
          Collection title
          <input
            maxLength={140}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                title: event.target.value,
                ...(autoSlug ? { slug: makeSlug(event.target.value) } : {}),
              }))
            }
            required
            value={form.title}
          />
        </label>
        <label className="admin-field">
          Slug
          <input
            maxLength={180}
            onChange={(event) => {
              setAutoSlug(false);
              setForm((current) => ({ ...current, slug: event.target.value }));
            }}
            required
            value={form.slug}
          />
        </label>
        <label className="admin-field">
          Description
          <textarea
            maxLength={3000}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            rows={3}
            value={form.description}
          />
        </label>
        <label className="admin-field">
          Cover image URL
          <input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                coverImage: event.target.value
                  ? {
                      url: event.target.value,
                      publicId: current.coverImage?.publicId,
                      alt: current.coverImage?.alt ?? form.title,
                      order: 0,
                    }
                  : null,
              }))
            }
            placeholder="https://res.cloudinary.com/..."
            value={form.coverImage?.url ?? ""}
          />
        </label>
        {form.coverImage && (
          <label className="admin-field">
            Cover image alt text
            <input
              maxLength={250}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  coverImage: current.coverImage
                    ? { ...current.coverImage, alt: event.target.value }
                    : undefined,
                }))
              }
              value={form.coverImage.alt}
            />
          </label>
        )}
        <div className="admin-product-picker">
          <div className="admin-subsection-heading">
            <div>
              <h3>Products in this collection</h3>
              <p>Select published items; order is curated.</p>
            </div>
          </div>
          {products.map((product) => {
            const selectedIndex = form.products.findIndex(
              (value) => (typeof value === "string" ? value : value._id) === product._id,
            );
            return (
              <div className="admin-product-option" key={product._id}>
                <label>
                  <input
                    checked={selectedIndex !== -1}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        products: event.target.checked
                          ? [...current.products, product._id]
                          : current.products.filter(
                              (value) =>
                                (typeof value === "string" ? value : value._id) !== product._id,
                            ),
                      }))
                    }
                    type="checkbox"
                  />
                  <span>{product.title}</span>
                </label>
                {selectedIndex !== -1 && (
                  <span className="admin-row-actions">
                    <button
                      aria-label={`Move ${product.title} up`}
                      disabled={selectedIndex === 0}
                      onClick={() => moveProduct(selectedIndex, -1)}
                      type="button"
                    >
                      <ArrowUp size={14} aria-hidden="true" />
                    </button>
                    <button
                      aria-label={`Move ${product.title} down`}
                      disabled={selectedIndex === form.products.length - 1}
                      onClick={() => moveProduct(selectedIndex, 1)}
                      type="button"
                    >
                      <ArrowDown size={14} aria-hidden="true" />
                    </button>
                  </span>
                )}
              </div>
            );
          })}
          {products.length === 0 && (
            <p className="admin-muted">Publish products before adding them to a collection.</p>
          )}
        </div>
        <label className="admin-checkbox">
          <input
            checked={form.published}
            onChange={(event) =>
              setForm((current) => ({ ...current, published: event.target.checked }))
            }
            type="checkbox"
          />
          Publish this collection
        </label>
        <div className="admin-editor-bottom">
          {editingId && (
            <button
              className="admin-secondary-button"
              onClick={() => {
                setEditingId("");
                setForm(blank);
                setAutoSlug(true);
              }}
              type="button"
            >
              Cancel
            </button>
          )}
          <button className="admin-primary-button" disabled={saving} type="submit">
            {editingId ? <Save size={16} /> : <Plus size={16} />}
            {saving ? "Saving…" : editingId ? "Save collection" : "Create collection"}
          </button>
        </div>
      </form>
    </div>
  );
}
