"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";

type Category = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  position: number;
  published: boolean;
  image?: { url: string; publicId?: string; alt: string; order: number };
};

type CategoryForm = Omit<Category, "_id" | "image"> & {
  image?: Category["image"] | null;
};

const blank: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  position: 0,
  published: false,
};

function makeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<CategoryForm>(blank);
  const [editingId, setEditingId] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchCategories() {
    const response = await fetch("/api/admin/categories", { cache: "no-store" });
    const result = (await response.json()) as {
      categories?: Category[];
      error?: string;
    };
    if (!response.ok) throw new Error(result.error ?? "Unable to load categories.");
    return result.categories ?? [];
  }

  async function load() {
    setLoading(true);
    try {
      setCategories(await fetchCategories());
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load categories.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetchCategories()
      .then((result) => {
        if (active) {
          setCategories(result);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (active) {
          setError(
            reason instanceof Error ? reason.message : "Unable to load categories.",
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

  function edit(category: Category) {
    setEditingId(category._id);
    setAutoSlug(false);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      position: category.position,
      published: category.published,
      ...(category.image ? { image: category.image } : {}),
    });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await fetch(
        editingId ? `/api/admin/categories/${editingId}` : "/api/admin/categories",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        },
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to save category.");
      setForm(blank);
      setEditingId("");
      setAutoSlug(true);
      setLoading(true);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save category.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(category: Category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    try {
      const response = await fetch(`/api/admin/categories/${category._id}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to delete category.");
      setLoading(true);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to delete category.");
    }
  }

  async function move(category: Category, direction: -1 | 1) {
    const sorted = [...categories].sort(
      (left, right) => left.position - right.position,
    );
    const currentIndex = sorted.findIndex((item) => item._id === category._id);
    const nextIndex = currentIndex + direction;
    if (nextIndex < 0 || nextIndex >= sorted.length) return;
    const updated = [...sorted];
    [updated[currentIndex], updated[nextIndex]] = [
      updated[nextIndex],
      updated[currentIndex],
    ];
    try {
      await Promise.all(
        updated.map((item, index) =>
          fetch(`/api/admin/categories/${item._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...item, position: index }),
          }).then((response) => {
            if (!response.ok) throw new Error("Unable to reorder categories.");
          }),
        ),
      );
      setLoading(true);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to reorder categories.");
    }
  }

  return (
    <div className="admin-two-column">
      <section className="admin-panel">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Organize discovery</p>
            <h2>Categories</h2>
          </div>
        </div>
        {error && <p className="admin-error-banner">{error}</p>}
        {loading ? (
          <p className="admin-muted">Loading categories…</p>
        ) : categories.length ? (
          <div className="admin-category-list">
            {[...categories]
              .sort((left, right) => left.position - right.position)
              .map((category, index) => (
                <article className="admin-category-row" key={category._id}>
                  <span className="admin-category-order">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="admin-category-copy">
                    <strong>{category.name}</strong>
                    <small>/{category.slug}</small>
                  </span>
                  <span className={`status-pill ${category.published ? "status-published" : "status-draft"}`}>
                    {category.published ? "Published" : "Hidden"}
                  </span>
                  <div className="admin-row-actions">
                    <button
                      aria-label={`Move ${category.name} up`}
                      disabled={index === 0}
                      onClick={() => move(category, -1)}
                      type="button"
                    >
                      <ArrowUp size={15} aria-hidden="true" />
                    </button>
                    <button
                      aria-label={`Move ${category.name} down`}
                      disabled={index === categories.length - 1}
                      onClick={() => move(category, 1)}
                      type="button"
                    >
                      <ArrowDown size={15} aria-hidden="true" />
                    </button>
                    <button onClick={() => edit(category)} type="button">
                      Edit
                    </button>
                    <button
                      aria-label={`Delete ${category.name}`}
                      onClick={() => remove(category)}
                      type="button"
                    >
                      <Trash2 size={15} aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
          </div>
        ) : (
          <p className="admin-muted">No categories have been added yet.</p>
        )}
      </section>

      <form className="admin-panel admin-editor-form" onSubmit={save}>
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">{editingId ? "Update" : "Create"}</p>
            <h2>{editingId ? "Edit category" : "New category"}</h2>
          </div>
        </div>
        <label className="admin-field">
          Category name
          <input
            maxLength={100}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                name: event.target.value,
                ...(autoSlug ? { slug: makeSlug(event.target.value) } : {}),
              }))
            }
            required
            value={form.name}
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
            maxLength={2000}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            rows={4}
            value={form.description}
          />
        </label>
        <label className="admin-field">
          Image URL <span className="admin-field-optional">Authorized HTTPS / Cloudinary</span>
          <input
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                image: event.target.value
                  ? {
                      url: event.target.value,
                      alt: current.image?.alt ?? form.name,
                      publicId: current.image?.publicId,
                      order: 0,
                    }
                  : null,
              }))
            }
            placeholder="https://res.cloudinary.com/..."
            value={form.image?.url ?? ""}
          />
        </label>
        {form.image && (
          <label className="admin-field">
            Image alt text
            <input
              maxLength={250}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  image: current.image
                    ? { ...current.image, alt: event.target.value }
                    : undefined,
                }))
              }
              value={form.image.alt}
            />
          </label>
        )}
        <label className="admin-checkbox">
          <input
            checked={form.published}
            onChange={(event) =>
              setForm((current) => ({ ...current, published: event.target.checked }))
            }
            type="checkbox"
          />
          Show this category publicly
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
            {saving ? "Saving…" : editingId ? "Save category" : "Add category"}
          </button>
        </div>
      </form>
    </div>
  );
}
