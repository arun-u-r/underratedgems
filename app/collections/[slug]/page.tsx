import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageIntro } from "@/components/storefront/PageIntro";
import { ProductCard } from "@/components/storefront/ProductCard";
import { StoreStatus } from "@/components/storefront/StoreStatus";
import { connectToDatabase } from "@/lib/db";
import { Collection } from "@/lib/models";
import { mapPublicProduct, type PublicProduct } from "@/lib/public-data";

type CollectionPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: CollectionPageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  try {
    await connectToDatabase();
    const collection = await Collection.findOne({ slug, published: true })
      .select("title description seoTitle seoDescription")
      .lean();
    return collection
      ? {
          title: collection.seoTitle || collection.title,
          description: collection.seoDescription || collection.description,
          alternates: { canonical: `/collections/${slug}` },
        }
      : { title: "Collection not found" };
  } catch (error) {
    console.error("Unable to create collection metadata", error);
    return { title: "UR collections" };
  }
}

type CollectionPageData = {
  title: string;
  description: string;
  coverImage: { url: string; alt: string } | null;
  products: PublicProduct[];
};

async function loadCollection(slug: string): Promise<CollectionPageData | null> {
  await connectToDatabase();
  const collection = await Collection.findOne({ slug, published: true })
    .populate({
      path: "products",
      match: { status: "published" },
      populate: { path: "category", select: "name slug" },
    })
    .lean();
  if (!collection) return null;
  const cover = collection.coverImage;
  return {
    title: collection.title,
    description: collection.description,
    coverImage:
      cover?.url
        ? { url: cover.url, alt: cover.alt ?? "" }
        : null,
    products: (collection.products ?? []).map(mapPublicProduct),
  };
}

export default async function CollectionPage({ params }: CollectionPageProps) {
  await connection();
  const { slug } = await params;
  let data: CollectionPageData | null = null;
  let databaseAvailable = true;
  try {
    data = await loadCollection(slug);
  } catch (error) {
    console.error("Unable to load collection", error);
    databaseAvailable = false;
  }
  if (!databaseAvailable) {
    return (
      <main className="content-page">
        <StoreStatus
          title="The collection is unavailable."
          message="Connect MongoDB or try again in a moment."
        />
      </main>
    );
  }
  if (!data) notFound();

  return (
    <main className="content-page">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        <Link href="/collections">Collections</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{data.title}</span>
      </nav>
      {data.coverImage && (
        <Image
          alt={data.coverImage.alt}
          className="collection-cover"
          height={650}
          priority
          sizes="100vw"
          src={data.coverImage.url}
          width={1400}
        />
      )}
      <PageIntro
        eyebrow="A curated collection"
        title={data.title}
        description={data.description}
      />
      {data.products.length ? (
        <div className="product-grid">
          {data.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <StoreStatus
          title="This collection is still taking shape."
          message="Published products added to this collection will appear here."
        />
      )}
    </main>
  );
}
