import { z } from "zod";
import { validateAffiliateUrl } from "./affiliate.ts";

const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens.");

function validateProductImageUrl(value: string) {
  try {
    const url = new URL(value);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (url.hostname === "res.cloudinary.com" ||
        (siteUrl !== undefined && url.hostname === new URL(siteUrl).hostname))
    );
  } catch {
    return false;
  }
}

function validateHttpUrl(value: string) {
  try {
    return ["http:", "https:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

const imageSchema = z.object({
  url: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine(validateProductImageUrl, "Use an authorized HTTPS image URL."),
  publicId: z.string().trim().max(255).optional(),
  alt: z.string().trim().min(1).max(250),
  order: z.number().int().min(0),
});

const retailerOfferSchema = z.object({
  _id: z.string().optional(),
  retailer: z.string().trim().min(1).max(80),
  retailerId: z.string().trim().max(120).optional(),
  url: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine(validateAffiliateUrl, "Use an approved public retailer URL."),
  price: z.number().finite().min(0).optional(),
  currency: z.string().trim().toUpperCase().length(3).optional(),
  lastVerifiedAt: z.coerce.date().optional(),
});

export const productInputSchema = z.object({
  title: z.string().trim().min(2).max(180),
  slug: slugSchema,
  description: z.string().trim().min(1).max(10000),
  features: z.array(z.string().trim().min(1).max(500)).max(30).default([]),
  specifications: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(100),
        value: z.string().trim().min(1).max(500),
      }),
    )
    .max(50)
    .default([]),
  category: z.string().regex(/^[a-f\d]{24}$/i),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).default([]),
  brand: z.string().trim().max(120).optional(),
  images: z.array(imageSchema).max(12).default([]),
  retailerOffers: z.array(retailerOfferSchema).max(20).default([]),
  featured: z.boolean().default(false),
  popularity: z.number().int().min(0).max(1000000).default(0),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
});

export const categoryInputSchema = z.object({
  name: z.string().trim().min(2).max(100),
  slug: slugSchema,
  description: z.string().trim().max(2000).default(""),
  image: imageSchema.nullable().optional(),
  position: z.number().int().min(0).default(0),
  published: z.boolean().default(true),
});

export const collectionInputSchema = z.object({
  title: z.string().trim().min(2).max(140),
  slug: slugSchema,
  description: z.string().trim().max(3000).default(""),
  coverImage: imageSchema.nullable().optional(),
  products: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(100).default([]),
  published: z.boolean().default(false),
  position: z.number().int().min(0).default(0),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
});

export const settingsInputSchema = z.object({
  siteName: z.string().trim().min(1).max(80),
  siteDescription: z.string().trim().min(1).max(300),
  logoUrl: z
    .string()
    .trim()
    .url()
    .max(2048)
    .refine(validateProductImageUrl, "Use an authorized HTTPS image URL.")
    .optional()
    .or(z.literal("")),
  heroHeadline: z.string().trim().min(1).max(180),
  heroSubtitle: z.string().trim().max(500),
  heroImage: imageSchema.nullable().optional(),
  affiliateDisclosure: z.string().trim().min(1).max(2000),
  contactEmail: z.string().trim().email().max(254).optional().or(z.literal("")),
  socialLinks: z.object({
    instagram: z
      .string()
      .trim()
      .url()
      .max(2048)
      .refine(validateHttpUrl)
      .optional()
      .or(z.literal("")),
    facebook: z
      .string()
      .trim()
      .url()
      .max(2048)
      .refine(validateHttpUrl)
      .optional()
      .or(z.literal("")),
    telegram: z
      .string()
      .trim()
      .url()
      .max(2048)
      .refine(validateHttpUrl)
      .optional()
      .or(z.literal("")),
  }),
  featuredCategories: z
    .array(z.string().regex(/^[a-f\d]{24}$/i))
    .max(12)
    .default([]),
  featuredProducts: z
    .array(z.string().regex(/^[a-f\d]{24}$/i))
    .max(30)
    .default([]),
  featuredCollections: z
    .array(z.string().regex(/^[a-f\d]{24}$/i))
    .max(20)
    .default([]),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(170).optional(),
});

export const loginInputSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(1).max(200),
});

export const clickInputSchema = z.object({
  productId: z.string().regex(/^[a-f\d]{24}$/i),
  retailerId: z.string().min(1).max(120),
  source: z.string().trim().max(120).optional(),
});

export const contactInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  message: z.string().trim().min(10).max(4000),
  website: z.string().max(300).optional(),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).max(10000).default(1),
  limit: z.coerce.number().int().min(1).max(48).default(12),
  q: z.string().trim().max(100).optional(),
  category: slugSchema.optional(),
  brand: z.string().trim().max(120).optional(),
  retailer: z.string().trim().max(80).optional(),
  sort: z.enum(["newest", "title", "popular"]).default("newest"),
});

export type ProductInput = z.infer<typeof productInputSchema>;
export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type CollectionInput = z.infer<typeof collectionInputSchema>;
export type SettingsInput = z.infer<typeof settingsInputSchema>;
