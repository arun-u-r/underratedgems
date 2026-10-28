import mongoose from "mongoose";
import {
  Category,
  Collection,
  Product,
  SiteSettings,
} from "../lib/models.ts";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Set MONGODB_URI before seeding the database.");
}

const demoCategories = [
  {
    name: "[DEMO] Home & living",
    slug: "demo-home-living",
    description: "Demonstration category. Replace this copy before publishing.",
    published: false,
    position: 0,
  },
  {
    name: "[DEMO] Personal style",
    slug: "demo-personal-style",
    description: "Demonstration category. Replace this copy before publishing.",
    published: false,
    position: 1,
  },
  {
    name: "[DEMO] Everyday details",
    slug: "demo-everyday-details",
    description: "Demonstration category. Replace this copy before publishing.",
    published: false,
    position: 2,
  },
];

const demoProducts = [
  {
    title: "[DEMO] A considered everyday object",
    slug: "demo-considered-everyday-object",
    description:
      "Demonstration content only. Replace all product details and add authorized images and retailer information before publishing.",
    categorySlug: "demo-home-living",
    tags: ["demo"],
  },
  {
    title: "[DEMO] A thoughtful personal detail",
    slug: "demo-thoughtful-personal-detail",
    description:
      "Demonstration content only. Replace all product details and add authorized images and retailer information before publishing.",
    categorySlug: "demo-personal-style",
    tags: ["demo"],
  },
  {
    title: "[DEMO] A useful finishing touch",
    slug: "demo-useful-finishing-touch",
    description:
      "Demonstration content only. Replace all product details and add authorized images and retailer information before publishing.",
    categorySlug: "demo-everyday-details",
    tags: ["demo"],
  },
];

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 8000 });

  const categories = new Map();
  for (const category of demoCategories) {
    const record = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categories.set(category.slug, record);
  }

  const products = [];
  for (const product of demoProducts) {
    const { categorySlug, ...values } = product;
    const record = await Product.findOneAndUpdate(
      { slug: values.slug },
      {
        $set: {
          ...values,
          category: categories.get(categorySlug)._id,
          status: "draft",
          featured: false,
          retailerOffers: [],
          images: [],
          features: [],
          specifications: [],
          seoTitle: values.title,
          seoDescription: values.description,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    products.push(record);
  }

  await Collection.findOneAndUpdate(
    { slug: "demo-first-collection" },
    {
      $set: {
        title: "[DEMO] A first collection",
        slug: "demo-first-collection",
        description: "Demonstration collection. Replace before publishing.",
        products: products.map((product) => product._id),
        published: false,
        position: 0,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  await SiteSettings.findOneAndUpdate(
    { key: "main" },
    {
      $setOnInsert: {
        siteName: "UR",
        siteDescription: "Good things, thoughtfully found.",
        heroHeadline: "Good things, thoughtfully found.",
        heroSubtitle:
          "A growing edit of things worth knowing about, chosen to make everyday life feel a little more like yours.",
        affiliateDisclosure:
          "Some links may be affiliate links. As an Amazon Associate I earn from qualifying purchases.",
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );

  console.info(
    `Seeded ${categories.size} demo categories, ${products.length} draft demo products, and one unpublished demo collection.`,
  );
} finally {
  await mongoose.disconnect();
}
