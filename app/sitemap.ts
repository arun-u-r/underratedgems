import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getPublicSitemapEntries } from "@/lib/public-data";

const staticPages = [
  "",
  "/shop",
  "/categories",
  "/collections",
  "/about",
  "/contact",
  "/affiliate-disclosure",
  "/privacy",
  "/terms",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("NEXT_PUBLIC_SITE_URL is required to generate the sitemap.");
  }
  const baseUrl = new URL(siteUrl);
  const { products, categories, collections } =
    await getPublicSitemapEntries();

  return [
    ...staticPages.map((path) => ({
      url: new URL(path, baseUrl).toString(),
    })),
    ...categories.map((category) => ({
      url: new URL(`/categories/${category.slug}`, baseUrl).toString(),
      lastModified: category.updatedAt,
    })),
    ...collections.map((collection) => ({
      url: new URL(`/collections/${collection.slug}`, baseUrl).toString(),
      lastModified: collection.updatedAt,
    })),
    ...products.map((product) => ({
      url: new URL(`/products/${product.slug}`, baseUrl).toString(),
      lastModified: product.updatedAt,
    })),
  ];
}
