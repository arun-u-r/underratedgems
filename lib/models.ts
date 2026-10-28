import mongoose, { type InferSchemaType, type Types } from "mongoose";

const { Schema, model, models } = mongoose;

const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, trim: true },
    alt: { type: String, required: true, trim: true, maxlength: 250 },
    order: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const offerSchema = new Schema(
  {
    retailer: { type: String, required: true, trim: true, maxlength: 80 },
    retailerId: { type: String, trim: true, maxlength: 120 },
    url: { type: String, required: true, trim: true, maxlength: 2048 },
    price: { type: Number, min: 0 },
    currency: { type: String, trim: true, uppercase: true, maxlength: 3 },
    lastVerifiedAt: { type: Date },
  },
  { _id: true },
);

const specificationSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    value: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 180 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, required: true, trim: true, maxlength: 10000 },
    features: { type: [String], default: [] },
    specifications: { type: [specificationSchema], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    tags: { type: [String], default: [], index: true },
    brand: { type: String, trim: true, maxlength: 120 },
    images: { type: [imageSchema], default: [] },
    retailerOffers: { type: [offerSchema], default: [] },
    featured: { type: Boolean, default: false, index: true },
    popularity: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      index: true,
    },
    publishedAt: { type: Date },
    seoTitle: { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 170 },
  },
  { timestamps: true },
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ status: 1, category: 1, createdAt: -1 });
productSchema.index({
  title: "text",
  description: "text",
  tags: "text",
  brand: "text",
});

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 2000, default: "" },
    image: imageSchema,
    position: { type: Number, default: 0, min: 0 },
    published: { type: Boolean, default: true, index: true },
  },
  { timestamps: true },
);
categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ published: 1, position: 1 });

const collectionSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, trim: true, lowercase: true },
    description: { type: String, trim: true, maxlength: 3000, default: "" },
    coverImage: imageSchema,
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    published: { type: Boolean, default: false, index: true },
    position: { type: Number, default: 0, min: 0 },
    seoTitle: { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 170 },
  },
  { timestamps: true },
);
collectionSchema.index({ slug: 1 }, { unique: true });
collectionSchema.index({ published: 1, position: 1 });

const siteSettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "main" },
    siteName: { type: String, default: "UR", trim: true, maxlength: 80 },
    siteDescription: {
      type: String,
      default: "Good things, thoughtfully found.",
      trim: true,
      maxlength: 300,
    },
    logoUrl: { type: String, trim: true, maxlength: 2048 },
    heroHeadline: {
      type: String,
      default: "Good things, thoughtfully found.",
      trim: true,
      maxlength: 180,
    },
    heroSubtitle: { type: String, trim: true, maxlength: 500 },
    heroImage: imageSchema,
    affiliateDisclosure: {
      type: String,
      default:
        "Some links may be affiliate links. As an Amazon Associate I earn from qualifying purchases.",
      trim: true,
      maxlength: 2000,
    },
    contactEmail: { type: String, trim: true, maxlength: 254 },
    socialLinks: {
      instagram: { type: String, trim: true, maxlength: 2048 },
      facebook: { type: String, trim: true, maxlength: 2048 },
      telegram: { type: String, trim: true, maxlength: 2048 },
    },
    seoTitle: { type: String, trim: true, maxlength: 70 },
    seoDescription: { type: String, trim: true, maxlength: 170 },
    featuredCategories: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    featuredProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    featuredCollections: [{ type: Schema.Types.ObjectId, ref: "Collection" }],
  },
  { timestamps: true },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin"], default: "admin", required: true },
    disabled: { type: Boolean, default: false },
    lastLoginAt: { type: Date },
  },
  { timestamps: true },
);

const clickEventSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    retailerId: { type: String, required: true, maxlength: 120 },
    source: { type: String, trim: true, maxlength: 120 },
    clickedAt: { type: Date, required: true, default: Date.now, index: true },
  },
  { timestamps: false },
);
clickEventSchema.index({ product: 1, clickedAt: -1 });
clickEventSchema.index({ retailerId: 1, clickedAt: -1 });

const authAttemptSchema = new Schema(
  {
    key: { type: String, required: true, unique: true },
    attempts: { type: Number, required: true, default: 0 },
    windowStartedAt: { type: Date, required: true, default: Date.now },
    blockedUntil: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);
authAttemptSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const contactMessageSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    createdAt: { type: Date, required: true, default: Date.now },
  },
  { versionKey: false },
);
contactMessageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 60 * 60 * 24 * 90 },
);

export const Product =
  models.Product ?? model("Product", productSchema);
export const Category =
  models.Category ?? model("Category", categorySchema);
export const Collection =
  models.Collection ?? model("Collection", collectionSchema);
export const SiteSettings =
  models.SiteSettings ?? model("SiteSettings", siteSettingsSchema);
export const User = models.User ?? model("User", userSchema);
export const ClickEvent =
  models.ClickEvent ?? model("ClickEvent", clickEventSchema);
export const AuthAttempt =
  models.AuthAttempt ?? model("AuthAttempt", authAttemptSchema);
export const ContactMessage =
  models.ContactMessage ?? model("ContactMessage", contactMessageSchema);

export type ProductDocument = InferSchemaType<typeof productSchema>;
export type CategoryDocument = InferSchemaType<typeof categorySchema>;
export type CollectionDocument = InferSchemaType<typeof collectionSchema>;
export type SiteSettingsDocument = InferSchemaType<typeof siteSettingsSchema>;
export type UserDocument = InferSchemaType<typeof userSchema>;
export type ClickEventDocument = InferSchemaType<typeof clickEventSchema>;
export type ContactMessageDocument = InferSchemaType<
  typeof contactMessageSchema
>;
export type MongoId = Types.ObjectId;
