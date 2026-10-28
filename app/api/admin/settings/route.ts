import { adminAuthFailure, invalidInput, readJson, unavailable } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { Category, Collection, Product, SiteSettings } from "@/lib/models";
import { settingsInputSchema } from "@/lib/validation";

export async function GET() {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "main" }).lean();
    return Response.json({ settings }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return unavailable(error, "Site settings");
  }
}

export async function PUT(request: Request) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return Response.json({ error: "Request body must contain valid JSON." }, { status: 400 });
  }
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) return invalidInput(parsed.error);
  if (
    !parsed.data.affiliateDisclosure
      .toLowerCase()
      .includes("as an amazon associate i earn from qualifying purchases")
  ) {
    return Response.json(
      {
        error:
          "The affiliate disclosure must include the Amazon Associates statement.",
      },
      { status: 400 },
    );
  }

  try {
    await connectToDatabase();
    const { featuredCategories, featuredProducts, featuredCollections, ...values } =
      parsed.data;
    const [categoryCount, productCount, collectionCount] = await Promise.all([
      Category.countDocuments({ _id: { $in: featuredCategories } }),
      Product.countDocuments({ _id: { $in: featuredProducts } }),
      Collection.countDocuments({ _id: { $in: featuredCollections } }),
    ]);
    if (
      categoryCount !== new Set(featuredCategories).size ||
      productCount !== new Set(featuredProducts).size ||
      collectionCount !== new Set(featuredCollections).size
    ) {
      return Response.json(
        { error: "A featured category, product, or collection no longer exists." },
        { status: 400 },
      );
    }
    const settings = await SiteSettings.findOneAndUpdate(
      { key: "main" },
      {
        ...values,
        featuredCategories,
        featuredProducts,
        featuredCollections,
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    ).lean();
    return Response.json({ settings });
  } catch (error) {
    return unavailable(error, "Site settings");
  }
}
