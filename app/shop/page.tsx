import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { PageIntro } from "@/components/storefront/PageIntro";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreStatus } from "@/components/storefront/StoreStatus";
import {
  listPublicCategories,
  listPublicProducts,
} from "@/lib/public-data";
import { paginationSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Shop the Edit",
  description: "Explore thoughtful discoveries, gathered in one considered edit.",
};

type ShopPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function getFirst(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function ShopPage({ searchParams }: ShopPageProps) {
  return (
    <Suspense fallback={<main className="content-page">Loading the shop…</main>}>
      <ShopContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ShopContent({ searchParams }: ShopPageProps) {
  await connection();
  const params = await searchParams;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    const first = getFirst(value);
    if (first) query.set(key, first);
  }
  const parsedFilters = paginationSchema.safeParse(
    Object.fromEntries(query.entries()),
  );
  if (!parsedFilters.success) {
    return (
      <main className="content-page">
        <PageIntro eyebrow="Shop the edit" title="A little something went wrong." />
        <StoreStatus
          title="That filter isn’t available."
          message="Try adjusting your search or clearing the filters."
        />
      </main>
    );
  }

  let data: {
    result: Awaited<ReturnType<typeof listPublicProducts>>;
    categories: Awaited<ReturnType<typeof listPublicCategories>>;
  } | null = null;
  try {
    const [result, categories] = await Promise.all([
      listPublicProducts(query),
      listPublicCategories(),
    ]);
    data = { result, categories };
  } catch (error) {
    console.error("Unable to render shop page", error);
  }
  if (!data) {
    return (
      <main className="content-page">
      <PageIntro eyebrow="Shop the edit" title="Discovery is taking a pause." />
      <StoreStatus
        title="The catalogue isn’t connected yet."
        message="Connect the MongoDB database in the server environment to publish and browse products."
      />
      </main>
    );
  }

  const { result, categories } = data;
  const filters = parsedFilters.data;
  return (
      <main className="content-page">
        <PageIntro
          eyebrow="A considered collection"
          title="Shop the edit."
          description="A growing collection of thoughtful finds for everyday life."
        />
        <form action="/shop" className="catalog-filters">
          <label>
            <span>Search</span>
            <input defaultValue={filters.q} name="q" placeholder="Try a keyword" />
          </label>
          <label>
            <span>Category</span>
            <select defaultValue={filters.category ?? ""} name="category">
              <option value="">All categories</option>
              {categories.map((category) => (
                <option key={String(category._id)} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Brand</span>
            <input defaultValue={filters.brand} name="brand" placeholder="Any brand" />
          </label>
          <label>
            <span>Retailer</span>
            <input
              defaultValue={filters.retailer}
              name="retailer"
              placeholder="Any retailer"
            />
          </label>
          <label>
            <span>Sort by</span>
            <select defaultValue={filters.sort} name="sort">
              <option value="newest">Recently added</option>
              <option value="title">Title</option>
              <option value="popular">Curated popularity</option>
            </select>
          </label>
          <button className="button button--dark" type="submit">
            Apply filters
          </button>
        </form>

        <div className="catalog-results-heading">
          <p>
            {result.total} {result.total === 1 ? "discovery" : "discoveries"}
            {filters.q ? ` for “${filters.q}”` : ""}
          </p>
          {filters.q || filters.category || filters.brand || filters.retailer ? (
            <Link href="/shop">Clear filters</Link>
          ) : null}
        </div>

        {result.products.length ? (
          <>
            <div className="product-grid">
              {result.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            {result.totalPages > 1 && (
              <nav aria-label="Product pages" className="pagination">
                {filters.page > 1 && (
                  <Link
                    href={{
                      pathname: "/shop",
                      query: { ...Object.fromEntries(query), page: filters.page - 1 },
                    }}
                  >
                    Previous
                  </Link>
                )}
                <span>
                  Page {filters.page} of {result.totalPages}
                </span>
                {filters.page < result.totalPages && (
                  <Link
                    href={{
                      pathname: "/shop",
                      query: { ...Object.fromEntries(query), page: filters.page + 1 },
                    }}
                  >
                    Next
                  </Link>
                )}
              </nav>
            )}
          </>
        ) : (
          <StoreStatus
            title="Nothing in this edit just yet."
            message="There are no published discoveries matching those filters. Try another search, or check back soon."
          />
        )}
      </main>
    );
}
