import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageIntro } from "@/components/storefront/PageIntro";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreStatus } from "@/components/storefront/StoreStatus";
import { getPublicCategory, listPublicProducts } from "@/lib/public-data";

type CategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  try {
    const category = await getPublicCategory(slug);
    return category
      ? {
          title: category.name,
          description: category.description || `Explore ${category.name} discoveries at UR.`,
          alternates: { canonical: `/categories/${category.slug}` },
        }
      : { title: "Category not found" };
  } catch (error) {
    console.error("Unable to create category metadata", error);
    return { title: "UR categories" };
  }
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  await connection();
  const { slug } = await params;
  let category;
  try {
    category = await getPublicCategory(slug);
  } catch (error) {
    console.error("Unable to load category", error);
    category = undefined;
  }
  if (category === undefined) {
    return (
      <main className="content-page">
        <StoreStatus
          title="The catalogue isn’t connected yet."
          message="Connect MongoDB to view categories and their published products."
        />
      </main>
    );
  }
  if (!category) notFound();

  let result;
  try {
    result = await listPublicProducts(
      new URLSearchParams({ category: slug, limit: "48" }),
    );
  } catch (error) {
    console.error("Unable to load category products", error);
    result = null;
  }
  if (!result) {
    return (
      <main className="content-page">
        <StoreStatus
          title="Category products are unavailable."
          message="Please try again later."
        />
      </main>
    );
  }

  return (
    <main className="content-page">
      <PageIntro
        eyebrow="Category / UR"
        title={category.name}
        description={category.description}
      />
      {result.products.length ? (
        <div className="product-grid">
          {result.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <StoreStatus
          title="This edit is still taking shape."
          message="There are no published products in this category just yet."
        />
      )}
    </main>
  );
}
