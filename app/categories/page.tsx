import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageIntro } from "@/components/storefront/PageIntro";
import { StoreStatus } from "@/components/storefront/StoreStatus";
import { listPublicCategories } from "@/lib/public-data";

export const metadata: Metadata = {
  title: "Categories",
  description: "Explore UR discoveries by category.",
};

export default function CategoriesPage() {
  return (
    <Suspense fallback={<main className="content-page">Loading categories…</main>}>
      <CategoriesContent />
    </Suspense>
  );
}

async function CategoriesContent() {
  await connection();
  let categories = null;
  try {
    categories = await listPublicCategories();
  } catch (error) {
    console.error("Unable to load categories", error);
  }
  if (categories === null) {
    return (
      <main className="content-page">
        <PageIntro eyebrow="Explore" title="Categories." />
        <StoreStatus
          title="The catalogue isn’t connected yet."
          message="Connect MongoDB to publish categories."
        />
      </main>
    );
  }
  return (
    <main className="content-page">
      <PageIntro
        eyebrow="A place to begin"
        title="Browse by category."
        description="Different interests, thoughtfully brought together."
      />
      {categories.length ? (
        <div className="category-grid">
          {categories.map((category) => (
            <Link
              className="category-tile"
              href={`/categories/${category.slug}`}
              key={String(category._id)}
            >
              <span>
                Explore / {String(category.position + 1).padStart(2, "0")}
              </span>
              <span>
                <h2>{category.name}</h2>
                <p>{category.description}</p>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <StoreStatus
          title="A few more categories are on the way."
          message="Published categories will appear here once the catalogue is ready."
        />
      )}
    </main>
  );
}
