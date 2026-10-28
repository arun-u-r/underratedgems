import "server-only";
import { connectToDatabase } from "./db.ts";
import { Category, Collection, Product, SiteSettings } from "./models.ts";
import {
  paginationSchema,
  type ProductInput,
} from "./validation.ts";

export type PublicProduct = {
  id: string;
  title: string;
  slug: string;
  description: string;
  features: string[];
  specifications: Array<{ name: string; value: string }>;
  category: { name: string; slug: string } | null;
  tags: string[];
  brand?: string;
  images: Array<{ url: string; alt: string; order: number }>;
  retailerOffers: Array<{
    id: string;
    retailer: string;
    url: string;
    price?: number;
    currency?: string;
    lastVerifiedAt?: string;
  }>;
  createdAt: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type HomepageContent = {
  siteDescription: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroImage: { url: string; alt: string } | null;
  affiliateDisclosure: string;
  featuredCategories: Array<{ id: string; name: string; slug: string }>;
  featuredProducts: PublicProduct[];
  featuredCollections: Array<{ id: string; title: string; slug: string }>;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export function mapPublicProduct(value: unknown): PublicProduct {
  const product = asRecord(value);
  const category = asRecord(product.category);
  const offers = Array.isArray(product.retailerOffers)
    ? product.retailerOffers
    : [];
  const images = Array.isArray(product.images) ? product.images : [];
  const features = Array.isArray(product.features) ? product.features : [];
  const specifications = Array.isArray(product.specifications)
    ? product.specifications
    : [];
  const productId = String(product._id ?? "");
  return {
    id: productId,
    title: String(product.title ?? ""),
    slug: String(product.slug ?? ""),
    description: String(product.description ?? ""),
    features: features.map(String),
    specifications: specifications.map((item) => {
      const specification = asRecord(item);
      return {
        name: String(specification.name ?? ""),
        value: String(specification.value ?? ""),
      };
    }),
    category:
      typeof category.name === "string" && typeof category.slug === "string"
        ? { name: category.name, slug: category.slug }
        : null,
    tags: Array.isArray(product.tags) ? product.tags.map(String) : [],
    ...(typeof product.brand === "string" ? { brand: product.brand } : {}),
    images: images.map((item) => {
      const image = asRecord(item);
      return {
        url: String(image.url ?? ""),
        alt: String(image.alt ?? ""),
        order: Number(image.order ?? 0),
      };
    }),
    retailerOffers: offers.map((item) => {
      const offer = asRecord(item);
      const offerId = String(offer._id ?? "");
      const lastVerifiedAt = offer.lastVerifiedAt;
      return {
        id: offerId,
        retailer: String(offer.retailer ?? ""),
        url: `/api/affiliate/click?productId=${productId}&retailerId=${offerId}`,
        ...(typeof offer.price === "number" ? { price: offer.price } : {}),
        ...(typeof offer.currency === "string"
          ? { currency: offer.currency }
          : {}),
        ...(lastVerifiedAt
          ? { lastVerifiedAt: new Date(String(lastVerifiedAt)).toISOString() }
          : {}),
      };
    }),
    createdAt: new Date(String(product.createdAt)).toISOString(),
    ...(typeof product.seoTitle === "string"
      ? { seoTitle: product.seoTitle }
      : {}),
    ...(typeof product.seoDescription === "string"
      ? { seoDescription: product.seoDescription }
      : {}),
  };
}

export async function listPublicProducts(searchParams: URLSearchParams) {
  await connectToDatabase();
  const parsed = paginationSchema.safeParse(
    Object.fromEntries(searchParams.entries()),
  );
  if (!parsed.success) throw new Error("Invalid product listing filters.");

  const { page, limit, q, category, brand, retailer, sort } = parsed.data;
  const filter: Record<string, unknown> = { status: "published" };

  if (q) {
    const expression = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { title: expression },
      { description: expression },
      { tags: expression },
      { brand: expression },
    ];
  }
  if (category) {
    const foundCategory = await Category.findOne({
      slug: category,
      published: true,
    })
      .select("_id")
      .lean();
    if (!foundCategory) {
      return { products: [], page, limit, total: 0, totalPages: 0 };
    }
    filter.category = foundCategory._id;
  }
  if (brand) filter.brand = new RegExp(`^${escapeRegex(brand)}$`, "i");
  if (retailer) filter["retailerOffers.retailer"] = retailer;

  const sortOrder: Record<string, 1 | -1> =
    sort === "title"
      ? { title: 1 }
      : sort === "popular"
        ? { popularity: -1, createdAt: -1 }
        : { createdAt: -1 };
  const [rows, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOrder)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("category", "name slug")
      .lean(),
    Product.countDocuments(filter),
  ]);

  return {
    products: rows.map(mapPublicProduct),
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getPublishedProduct(slug: string) {
  await connectToDatabase();
  const product = await Product.findOne({ slug, status: "published" })
    .populate("category", "name slug")
    .lean();
  return product
    ? mapPublicProduct(product)
    : null;
}

export async function listPublicCategories() {
  await connectToDatabase();
  return Category.find({ published: true })
    .sort({ position: 1, name: 1 })
    .select("name slug description image")
    .lean();
}

export async function getPublicCategory(slug: string) {
  await connectToDatabase();
  return Category.findOne({ slug, published: true })
    .select("name slug description image")
    .lean();
}

export async function listPublicCollections() {
  await connectToDatabase();
  return Collection.find({ published: true })
    .sort({ position: 1, createdAt: -1 })
    .select("title slug description coverImage")
    .lean();
}

export async function getHomepageContent(): Promise<HomepageContent | null> {
  await connectToDatabase();
  const settings = await SiteSettings.findOne({ key: "main" })
    .populate({
      path: "featuredCategories",
      match: { published: true },
      select: "name slug",
    })
    .populate({
      path: "featuredProducts",
      match: { status: "published" },
      populate: { path: "category", select: "name slug" },
    })
    .populate({
      path: "featuredCollections",
      match: { published: true },
      select: "title slug",
    })
    .lean();
  if (!settings) return null;
  const heroImage = settings.heroImage;
  return {
    siteDescription: settings.siteDescription,
    heroHeadline: settings.heroHeadline,
    heroSubtitle: settings.heroSubtitle,
    heroImage: heroImage
      ? { url: heroImage.url, alt: heroImage.alt }
      : null,
    affiliateDisclosure: settings.affiliateDisclosure,
    featuredCategories: (settings.featuredCategories ?? []).map((value: unknown) => {
      const category = asRecord(value);
      return {
        id: String(category._id),
        name: String(category.name ?? ""),
        slug: String(category.slug ?? ""),
      };
    }),
    featuredProducts: (settings.featuredProducts ?? []).map(mapPublicProduct),
    featuredCollections: (settings.featuredCollections ?? []).map((value: unknown) => {
      const collection = asRecord(value);
      return {
        id: String(collection._id),
        title: String(collection.title ?? ""),
        slug: String(collection.slug ?? ""),
      };
    }),
  };
}

export async function getPublicSitemapEntries() {
  await connectToDatabase();
  const [products, categories, collections] = await Promise.all([
    Product.find({ status: "published" }).select("slug updatedAt").lean(),
    Category.find({ published: true }).select("slug updatedAt").lean(),
    Collection.find({ published: true }).select("slug updatedAt").lean(),
  ]);
  return { products, categories, collections };
}

export async function getPublicCollection(slug: string) {
  await connectToDatabase();
  return Collection.findOne({ slug, published: true })
    .populate({
      path: "products",
      match: { status: "published" },
      populate: { path: "category", select: "name slug" },
    })
    .lean();
}

export function productInputToMongo(input: ProductInput) {
  return {
    ...input,
    category: input.category,
    retailerOffers: input.retailerOffers.map(({ _id, ...offer }) => ({
      ...(_id ? { _id } : {}),
      ...offer,
    })),
    publishedAt:
      input.status === "published" ? new Date() : undefined,
  };
}
