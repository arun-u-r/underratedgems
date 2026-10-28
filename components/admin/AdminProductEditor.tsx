"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import type { z } from "zod";
import { ArrowLeft, Plus, Save, Trash2 } from "lucide-react";
import Link from "next/link";
import { AdminImageManager } from "@/components/admin/AdminImageManager";
import {
  productInputSchema,
  type ProductInput,
} from "@/lib/validation";

type CategoryOption = { _id: string; name: string; slug: string };

const emptyProduct: ProductInput = {
  title: "",
  slug: "",
  description: "",
  features: [],
  specifications: [],
  category: "",
  tags: [],
  images: [],
  retailerOffers: [],
  featured: false,
  popularity: 0,
  status: "draft",
};

function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function AdminProductEditor({ productId }: { productId?: string }) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [removedPublicIds, setRemovedPublicIds] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saving, setSaving] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const form = useForm<z.input<typeof productInputSchema>, unknown, ProductInput>({
    resolver: zodResolver(productInputSchema),
    defaultValues: emptyProduct,
  });
  const currentImages = useWatch({
    control: form.control,
    name: "images",
    defaultValue: [],
  });
  const currentTags = useWatch({
    control: form.control,
    name: "tags",
    defaultValue: [],
  });
  const currentFeatures = useWatch({
    control: form.control,
    name: "features",
    defaultValue: [],
  });
  const currentSpecifications = useWatch({
    control: form.control,
    name: "specifications",
    defaultValue: [],
  });
  const offers = useFieldArray({ control: form.control, name: "retailerOffers" });

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const categoryResponse = await fetch("/api/admin/categories", {
          cache: "no-store",
          signal: controller.signal,
        });
        const categoryResult = (await categoryResponse.json()) as {
          categories?: CategoryOption[];
          error?: string;
        };
        if (!categoryResponse.ok) {
          throw new Error(categoryResult.error ?? "Unable to load categories.");
        }
        setCategories(categoryResult.categories ?? []);

        if (!productId) return;
        const productResponse = await fetch(`/api/admin/products/${productId}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const productResult = (await productResponse.json()) as {
          product?: unknown;
          error?: string;
        };
        if (!productResponse.ok || !productResult.product) {
          throw new Error(productResult.error ?? "Unable to load product.");
        }
        const parsed = productInputSchema.safeParse(productResult.product);
        if (!parsed.success) {
          throw new Error("This product contains fields that need attention before editing.");
        }
        form.reset(parsed.data);
        setSlugManuallyEdited(true);
      } catch (reason) {
        if (!controller.signal.aborted) {
          setLoadError(
            reason instanceof Error ? reason.message : "Unable to load the editor.",
          );
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [form, productId]);

  async function save(values: ProductInput) {
    setSaving(true);
    setSaveError("");
    try {
      const response = await fetch(
        productId ? `/api/admin/products/${productId}` : "/api/admin/products",
        {
          method: productId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(values),
        },
      );
      const result = (await response.json()) as {
        product?: { _id?: string };
        error?: string;
        details?: Array<{ path: string; message: string }>;
      };
      if (!response.ok) {
        const fieldErrors = result.details?.map((item) => item.message).join(" ");
        throw new Error(fieldErrors || result.error || "Unable to save product.");
      }

      const cleanupErrors: string[] = [];
      for (const publicId of removedPublicIds) {
        const cleanup = await fetch("/api/admin/upload/delete", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId }),
        });
        if (!cleanup.ok) {
          const cleanupResult = (await cleanup.json()) as { error?: string };
          cleanupErrors.push(
            cleanupResult.error ?? `Could not delete Cloudinary image ${publicId}.`,
          );
        }
      }
      if (cleanupErrors.length) {
        setSaveError(
          `Product saved, but some removed images could not be deleted: ${cleanupErrors.join(" ")}`,
        );
      } else {
        router.push("/admin/products");
        router.refresh();
      }
    } catch (reason) {
      setSaveError(reason instanceof Error ? reason.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  if (loadError) return <p className="admin-error-banner">{loadError}</p>;

  return (
    <form className="admin-editor-form" onSubmit={form.handleSubmit(save)}>
      <div className="admin-editor-toolbar">
        <Link className="admin-text-link" href="/admin/products">
          <ArrowLeft size={16} aria-hidden="true" /> Products
        </Link>
        <button className="admin-primary-button" disabled={saving} type="submit">
          <Save size={16} aria-hidden="true" />
          {saving ? "Saving…" : "Save product"}
        </button>
      </div>
      {saveError && <p className="admin-error-banner">{saveError}</p>}
      {Object.keys(form.formState.errors).length > 0 && (
        <p className="admin-error-banner" role="alert">
          Review the highlighted fields before saving.
        </p>
      )}

      <section className="admin-panel admin-form-section">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Product details</p>
            <h2>{productId ? "Edit product" : "Create a product"}</h2>
          </div>
        </div>
        <div className="admin-form-grid">
          <label className="admin-field admin-field-wide">
            Product title
            <input
              maxLength={180}
              {...form.register("title", {
                onChange: (event) => {
                  if (!slugManuallyEdited) {
                    form.setValue("slug", slugify(event.target.value), {
                      shouldValidate: true,
                    });
                  }
                },
              })}
            />
            <FieldError message={form.formState.errors.title?.message} />
          </label>
          <label className="admin-field admin-field-wide">
            Slug
            <input
              maxLength={180}
              {...form.register("slug", {
                onChange: () => setSlugManuallyEdited(true),
              })}
            />
            <FieldError message={form.formState.errors.slug?.message} />
          </label>
          <label className="admin-field admin-field-wide">
            Description
            <textarea maxLength={10000} rows={5} {...form.register("description")} />
            <FieldError message={form.formState.errors.description?.message} />
          </label>
          <label className="admin-field">
            Category
            <select {...form.register("category")}>
              <option value="">Choose a category</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>
                  {category.name}
                </option>
              ))}
            </select>
            <FieldError message={form.formState.errors.category?.message} />
            {categories.length === 0 && (
              <span className="admin-field-hint">
                Add a category before creating a product.
              </span>
            )}
          </label>
          <label className="admin-field">
            Brand <span className="admin-field-optional">Optional</span>
            <input maxLength={120} {...form.register("brand")} />
            <FieldError message={form.formState.errors.brand?.message} />
          </label>
          <label className="admin-field">
            Tags <span className="admin-field-optional">Comma separated</span>
            <input
              value={(currentTags ?? []).join(", ")}
              onChange={(event) =>
                form.setValue(
                  "tags",
                  event.target.value
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean),
                  { shouldValidate: true },
                )
              }
            />
          </label>
          <label className="admin-field">
            Key features <span className="admin-field-optional">One per line</span>
            <textarea
              rows={4}
              value={(currentFeatures ?? []).join("\n")}
              onChange={(event) =>
                form.setValue(
                  "features",
                  event.target.value.split("\n").map((line) => line.trim()).filter(Boolean),
                  { shouldValidate: true },
                )
              }
            />
          </label>
          <label className="admin-field">
            Specifications <span className="admin-field-optional">One name: value per line</span>
            <textarea
              rows={4}
              value={(currentSpecifications ?? [])
                .map((item) => `${item.name}: ${item.value}`)
                .join("\n")}
              onChange={(event) =>
                form.setValue(
                  "specifications",
                  event.target.value
                    .split("\n")
                    .map((line) => {
                      const [name, ...rest] = line.split(":");
                      return { name: name.trim(), value: rest.join(":").trim() };
                    })
                    .filter((item) => item.name && item.value),
                  { shouldValidate: true },
                )
              }
            />
          </label>
        </div>
      </section>

      <section className="admin-panel admin-form-section">
        <AdminImageManager
          images={currentImages ?? []}
          onChange={(nextImages) =>
            form.setValue("images", nextImages, {
              shouldDirty: true,
              shouldValidate: true,
            })
          }
          onRemovedPublicIds={(ids) =>
            setRemovedPublicIds((current) => [...current, ...ids])
          }
        />
      </section>

      <section className="admin-panel admin-form-section">
        <div className="admin-subsection-heading">
          <div>
            <h3>Retailer offers</h3>
            <p>Offers use approved retailer domains from server configuration.</p>
          </div>
          <button
            className="admin-secondary-button"
            onClick={() =>
              offers.append({
                retailer: "",
                url: "",
                currency: "INR",
              })
            }
            type="button"
          >
            <Plus size={15} aria-hidden="true" /> Add offer
          </button>
        </div>
        {offers.fields.map((offer, index) => (
          <div className="admin-offer-row" key={offer.id}>
            <label className="admin-field">
              Retailer
              <input maxLength={80} {...form.register(`retailerOffers.${index}.retailer`)} />
            </label>
            <label className="admin-field">
              Affiliate URL
              <input
                maxLength={2048}
                placeholder="https://www.amazon.in/..."
                {...form.register(`retailerOffers.${index}.url`)}
              />
              <FieldError
                message={form.formState.errors.retailerOffers?.[index]?.url?.message}
              />
            </label>
            <label className="admin-field">
              Price <span className="admin-field-optional">Optional</span>
              <input
                min="0"
                step="0.01"
                type="number"
                {...form.register(`retailerOffers.${index}.price`, {
                  setValueAs: (value: string) =>
                    value === "" ? undefined : Number(value),
                })}
              />
            </label>
            <label className="admin-field">
              Currency
              <input
                maxLength={3}
                {...form.register(`retailerOffers.${index}.currency`)}
              />
            </label>
            <label className="admin-field">
              Verified on
              <input
                type="date"
                {...form.register(`retailerOffers.${index}.lastVerifiedAt`, {
                  setValueAs: (value: string) =>
                    value ? new Date(`${value}T12:00:00`) : undefined,
                })}
              />
            </label>
            <button
              aria-label={`Remove ${offer.retailer || "retailer"} offer`}
              className="admin-icon-action"
              onClick={() => offers.remove(index)}
              type="button"
            >
              <Trash2 size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </section>

      <section className="admin-panel admin-form-section">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Publishing</p>
            <h2>Visibility and SEO</h2>
          </div>
        </div>
        <div className="admin-form-grid">
          <label className="admin-field">
            Publication status
            <select {...form.register("status")}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="admin-field">
            Curated popularity
            <input
              min="0"
              max="1000000"
              type="number"
              {...form.register("popularity", {
                valueAsNumber: true,
              })}
            />
            <span className="admin-field-hint">
              A manual sort weight only—not sales or popularity analytics.
            </span>
          </label>
          <label className="admin-checkbox">
            <input type="checkbox" {...form.register("featured")} />
            Feature this product where curated
          </label>
          <label className="admin-field">
            SEO title <span className="admin-field-optional">Optional</span>
            <input maxLength={70} {...form.register("seoTitle")} />
          </label>
          <label className="admin-field">
            SEO description <span className="admin-field-optional">Optional</span>
            <textarea maxLength={170} rows={3} {...form.register("seoDescription")} />
          </label>
        </div>
      </section>
      <div className="admin-editor-bottom">
        <button className="admin-primary-button" disabled={saving} type="submit">
          <Save size={16} aria-hidden="true" />
          {saving ? "Saving…" : "Save product"}
        </button>
      </div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <span className="admin-field-error">{message}</span> : null;
}
