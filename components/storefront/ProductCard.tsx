import Image from "next/image";
import Link from "next/link";
import type { PublicProduct } from "@/lib/public-data";

export function ProductCard({ product }: { product: PublicProduct }) {
  const image = [...product.images].sort((a, b) => a.order - b.order)[0];
  const offer = product.retailerOffers[0];

  return (
    <article className="product-card">
      <Link
        aria-label={`View ${product.title}`}
        className="product-card-image"
        href={`/products/${product.slug}`}
      >
        {image ? (
          <Image
            alt={image.alt}
            className="product-card-photo"
            height={640}
            loading="lazy"
            sizes="(max-width: 600px) 90vw, (max-width: 900px) 45vw, 30vw"
            src={image.url}
            width={520}
          />
        ) : (
          <span aria-hidden="true" className="product-card-placeholder">
            <span>UR</span>
          </span>
        )}
      </Link>
      <div className="product-card-copy">
        <div className="product-card-meta">
          <span>{product.category?.name ?? "The UR edit"}</span>
          {product.brand && <span>{product.brand}</span>}
        </div>
        <h2>
          <Link href={`/products/${product.slug}`}>{product.title}</Link>
        </h2>
        <p>{product.description}</p>
        {offer && (
          <a
            className="product-card-cta"
            href={offer.url}
            rel="sponsored nofollow noopener noreferrer"
            target="_blank"
          >
            Discover at {offer.retailer}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </article>
  );
}
