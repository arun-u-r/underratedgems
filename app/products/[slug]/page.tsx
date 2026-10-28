import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { PageIntro } from "@/components/storefront/PageIntro";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ShareProduct } from "@/components/storefront/ShareProduct";
import { StoreStatus } from "@/components/storefront/StoreStatus";
import { getPublishedProduct, listPublicProducts, type PublicProduct } from "@/lib/public-data";

type ProductPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  try {
    const product = await getPublishedProduct(slug);
    if (!product) return { title: "Discovery not found" };
    return {
      title: product.seoTitle || product.title,
      description: product.seoDescription || product.description.slice(0, 165),
      alternates: { canonical: `/products/${product.slug}` },
      openGraph: {
        title: product.seoTitle || product.title,
        description: product.seoDescription || product.description.slice(0, 165),
        images: product.images[0] ? [product.images[0].url] : [],
      },
    };
  } catch (error) {
    console.error("Unable to create product metadata", error);
    return { title: "A thoughtful discovery" };
  }
}

async function loadProductPage(slug: string) {
  const product = await getPublishedProduct(slug);
  if (!product) return { product: null, related: [] as PublicProduct[] };
  const relatedResult = product.category
    ? await listPublicProducts(
        new URLSearchParams({
          category: product.category.slug,
          limit: "4",
          sort: "popular",
        }),
      )
    : { products: [] as PublicProduct[] };
  return {
    product,
    related: relatedResult.products
      .filter((item) => item.id !== product.id)
      .slice(0, 3),
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  await connection();
  const { slug } = await params;
  let data: Awaited<ReturnType<typeof loadProductPage>> | null = null;
  try {
    data = await loadProductPage(slug);
  } catch (error) {
    console.error("Unable to load product detail", error);
  }
  if (!data) {
    return (
      <main className="content-page">
        <StoreStatus
          title="The catalogue isn’t connected yet."
          message="Connect MongoDB to view published product details."
        />
      </main>
    );
  }
  if (!data.product) notFound();
  const { product, related } = data;

  return (
    <main className="content-page product-detail-page">
      <nav aria-label="Breadcrumb" className="breadcrumbs">
        <Link href="/">Home</Link>
        <span aria-hidden="true">/</span>
        {product.category && (
          <>
            <Link href={`/categories/${product.category.slug}`}>
              {product.category.name}
            </Link>
            <span aria-hidden="true">/</span>
          </>
        )}
        <span aria-current="page">{product.title}</span>
      </nav>
      <article className="product-detail">
        <div className="product-gallery">
          {product.images.length ? (
            product.images.map((image, index) => (
              <Image
                alt={image.alt}
                className="product-detail-image"
                height={900}
                key={`${image.url}-${index}`}
                priority={index === 0}
                sizes="(max-width: 800px) 100vw, 55vw"
                src={image.url}
                width={760}
              />
            ))
          ) : (
            <div className="product-detail-placeholder" aria-hidden="true">
              UR
            </div>
          )}
        </div>
        <div className="product-detail-copy">
          <p className="eyebrow">
            {product.category?.name ?? "The UR edit"}
            {product.brand ? ` / ${product.brand}` : ""}
          </p>
          <h1>{product.title}</h1>
          <p className="product-description">{product.description}</p>
          {product.features.length > 0 && (
            <section>
              <h2>Worth knowing</h2>
              <ul className="feature-list">
                {product.features.map((feature, index) => (
                  <li key={`${index}-${feature}`}>{feature}</li>
                ))}
              </ul>
            </section>
          )}
          {product.specifications.length > 0 && (
            <section className="specification-list">
              <h2>Details</h2>
              {product.specifications.map((specification, index) => (
                <div key={`${index}-${specification.name}`}>
                  <span>{specification.name}</span>
                  <span>{specification.value}</span>
                </div>
              ))}
            </section>
          )}
          {product.tags.length > 0 && (
            <p className="tag-list">
              {product.tags.map((tag, index) => (
                <span key={`${index}-${tag}`}>{tag}</span>
              ))}
            </p>
          )}
          {product.retailerOffers.map((offer) => (
            <div className="retailer-offer" key={offer.id}>
              {offer.price !== undefined && offer.currency && (
                <p className="offer-price">
                  {new Intl.NumberFormat("en", {
                    style: "currency",
                    currency: offer.currency,
                  }).format(offer.price)}
                  {offer.lastVerifiedAt && (
                    <span>
                      Verified{" "}
                      {new Date(offer.lastVerifiedAt).toLocaleDateString()}
                    </span>
                  )}
                </p>
              )}
              <p className="affiliate-disclosure-inline">
                Affiliate link: UR may earn a commission if you shop through
                this link, at no extra cost to you.
              </p>
              <a
                className="button button--dark retailer-button"
                href={offer.url}
                rel="sponsored nofollow noopener noreferrer"
                target="_blank"
              >
                Discover at {offer.retailer}
                <span aria-hidden="true">↗</span>
              </a>
            </div>
          ))}
          {product.retailerOffers.length === 0 && (
            <p className="muted-note">
              Retailer links haven’t been added for this discovery yet.
            </p>
          )}
          <ShareProduct title={product.title} />
        </div>
      </article>
      {related.length > 0 && (
        <section className="related-products">
          <PageIntro eyebrow="Keep exploring" title="A few more good things." />
          <div className="product-grid">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
