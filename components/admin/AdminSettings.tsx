"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Save } from "lucide-react";

type ContentOption = { _id: string; name?: string; title?: string };
type Settings = {
  siteName: string;
  siteDescription: string;
  logoUrl: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroImage?: { url: string; publicId?: string; alt: string; order: number } | null;
  affiliateDisclosure: string;
  contactEmail: string;
  socialLinks: { instagram: string; facebook: string; telegram: string };
  featuredCategories: string[];
  featuredProducts: string[];
  featuredCollections: string[];
  seoTitle: string;
  seoDescription: string;
};

const defaultDisclosure =
  "Some links may be affiliate links. As an Amazon Associate I earn from qualifying purchases.";

const defaults: Settings = {
  siteName: "UR",
  siteDescription: "Good things, thoughtfully found.",
  logoUrl: "",
  heroHeadline: "Good things, thoughtfully found.",
  heroSubtitle:
    "A growing edit of things worth knowing about, chosen to make everyday life feel a little more like yours.",
  affiliateDisclosure: defaultDisclosure,
  contactEmail: "",
  socialLinks: { instagram: "", facebook: "", telegram: "" },
  featuredCategories: [],
  featuredProducts: [],
  featuredCollections: [],
  seoTitle: "",
  seoDescription: "",
};

export function AdminSettings() {
  const [settings, setSettings] = useState<Settings>(defaults);
  const [categories, setCategories] = useState<ContentOption[]>([]);
  const [products, setProducts] = useState<ContentOption[]>([]);
  const [collections, setCollections] = useState<ContentOption[]>([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [settingsResponse, categoriesResponse, productsResponse, collectionsResponse] =
          await Promise.all([
            fetch("/api/admin/settings", { cache: "no-store" }),
            fetch("/api/admin/categories", { cache: "no-store" }),
            fetch("/api/admin/products?limit=48&status=published", {
              cache: "no-store",
            }),
            fetch("/api/admin/collections", { cache: "no-store" }),
          ]);
        const [settingsResult, categoriesResult, productsResult, collectionsResult] =
          (await Promise.all([
            settingsResponse.json(),
            categoriesResponse.json(),
            productsResponse.json(),
            collectionsResponse.json(),
          ])) as [
            { settings?: Partial<Settings> | null; error?: string },
            { categories?: ContentOption[]; error?: string },
            { products?: ContentOption[]; error?: string },
            { collections?: ContentOption[]; error?: string },
          ];
        const responses = [
          [settingsResponse, settingsResult],
          [categoriesResponse, categoriesResult],
          [productsResponse, productsResult],
          [collectionsResponse, collectionsResult],
        ] as const;
        const failed = responses.find(([response]) => !response.ok);
        if (failed) {
          const result = failed[1] as { error?: string };
          throw new Error(result.error ?? "Unable to load site settings.");
        }
        setSettings({
          ...defaults,
          ...settingsResult.settings,
          socialLinks: {
            ...defaults.socialLinks,
            ...settingsResult.settings?.socialLinks,
          },
          featuredCategories:
            settingsResult.settings?.featuredCategories?.map(String) ?? [],
          featuredProducts: settingsResult.settings?.featuredProducts?.map(String) ?? [],
          featuredCollections:
            settingsResult.settings?.featuredCollections?.map(String) ?? [],
        });
        setCategories(categoriesResult.categories ?? []);
        setProducts(productsResult.products ?? []);
        setCollections(collectionsResult.collections ?? []);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : "Unable to load settings.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, []);

  function toggleSelection(
    key: "featuredCategories" | "featuredProducts" | "featuredCollections",
    id: string,
  ) {
    setSettings((current) => ({
      ...current,
      [key]: current[key].includes(id)
        ? current[key].filter((value) => value !== id)
        : [...current[key], id],
    }));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to save settings.");
      setMessage("Site settings saved.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to save settings.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="admin-muted">Loading site settings…</p>;

  return (
    <form className="admin-settings-form" onSubmit={save}>
      {error && <p className="admin-error-banner">{error}</p>}
      <p aria-live="polite" className="admin-success-message">
        {message}
      </p>
      <section className="admin-panel admin-form-section">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Identity</p>
            <h2>Site details</h2>
          </div>
        </div>
        <div className="admin-form-grid">
          <Field label="Site name" value={settings.siteName} maxLength={80} onChange={(siteName) => setSettings({ ...settings, siteName })} />
          <Field label="Footer description" value={settings.siteDescription} maxLength={300} onChange={(siteDescription) => setSettings({ ...settings, siteDescription })} />
          <Field label="Logo URL" value={settings.logoUrl} onChange={(logoUrl) => setSettings({ ...settings, logoUrl })} />
          <Field label="Contact email" value={settings.contactEmail} type="email" onChange={(contactEmail) => setSettings({ ...settings, contactEmail })} />
          <Field label="Instagram URL" value={settings.socialLinks.instagram} type="url" onChange={(instagram) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram } })} />
          <Field label="Facebook URL" value={settings.socialLinks.facebook} type="url" onChange={(facebook) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, facebook } })} />
          <Field label="Telegram URL" value={settings.socialLinks.telegram} type="url" onChange={(telegram) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, telegram } })} />
        </div>
      </section>

      <section className="admin-panel admin-form-section">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Homepage</p>
            <h2>Hero content</h2>
          </div>
        </div>
        <div className="admin-form-grid">
          <Field label="Hero headline" value={settings.heroHeadline} maxLength={180} onChange={(heroHeadline) => setSettings({ ...settings, heroHeadline })} />
          <Field label="Hero subtitle" value={settings.heroSubtitle} maxLength={500} onChange={(heroSubtitle) => setSettings({ ...settings, heroSubtitle })} />
          <Field
            label="Hero image URL"
            value={settings.heroImage?.url ?? ""}
            onChange={(url) =>
              setSettings({
                ...settings,
                heroImage: url
                  ? {
                      url,
                      alt: settings.heroImage?.alt ?? settings.heroHeadline,
                      publicId: settings.heroImage?.publicId,
                      order: 0,
                    }
                  : null,
              })
            }
          />
          {settings.heroImage && (
            <Field
              label="Hero image alt text"
              value={settings.heroImage.alt}
              maxLength={250}
              onChange={(alt) =>
                setSettings({
                  ...settings,
                  heroImage: settings.heroImage
                    ? { ...settings.heroImage, alt }
                    : undefined,
                })
              }
            />
          )}
        </div>
        <FeaturePicker
          title="Featured categories"
          items={categories}
          selected={settings.featuredCategories}
          onToggle={(id) => toggleSelection("featuredCategories", id)}
        />
        <FeaturePicker
          title="Featured products"
          items={products}
          selected={settings.featuredProducts}
          onToggle={(id) => toggleSelection("featuredProducts", id)}
        />
        <FeaturePicker
          title="Featured collections"
          items={collections}
          selected={settings.featuredCollections}
          onToggle={(id) => toggleSelection("featuredCollections", id)}
        />
      </section>

      <section className="admin-panel admin-form-section">
        <div className="admin-panel-heading">
          <div>
            <p className="eyebrow">Search and compliance</p>
            <h2>SEO & disclosure</h2>
          </div>
        </div>
        <div className="admin-form-grid">
          <Field label="Default SEO title" value={settings.seoTitle} maxLength={70} onChange={(seoTitle) => setSettings({ ...settings, seoTitle })} />
          <Field label="Default SEO description" value={settings.seoDescription} maxLength={170} onChange={(seoDescription) => setSettings({ ...settings, seoDescription })} />
          <label className="admin-field admin-field-wide">
            Affiliate disclosure
            <textarea
              maxLength={2000}
              onChange={(event) =>
                setSettings({
                  ...settings,
                  affiliateDisclosure: event.target.value,
                })
              }
              rows={5}
              value={settings.affiliateDisclosure}
            />
            <span className="admin-field-hint">
              Required statement: “As an Amazon Associate I earn from qualifying purchases.”
            </span>
          </label>
        </div>
      </section>
      <div className="admin-editor-bottom">
        <button className="admin-primary-button" disabled={saving} type="submit">
          <Save size={16} aria-hidden="true" />
          {saving ? "Saving…" : "Save site settings"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  maxLength,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  type?: string;
}) {
  return (
    <label className="admin-field">
      {label}
      <input
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        type={type}
        value={value}
      />
    </label>
  );
}

function FeaturePicker({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: ContentOption[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <fieldset className="admin-feature-picker">
      <legend>{title}</legend>
      {items.length ? (
        items.map((item) => (
          <label key={item._id}>
            <input
              checked={selected.includes(item._id)}
              onChange={() => onToggle(item._id)}
              type="checkbox"
            />
            {item.name ?? item.title ?? "Untitled"}
          </label>
        ))
      ) : (
        <span className="admin-muted">No published items available.</span>
      )}
    </fieldset>
  );
}
