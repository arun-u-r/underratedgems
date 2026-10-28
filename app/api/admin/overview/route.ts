import { connectToDatabase } from "@/lib/db";
import { Category, ClickEvent, Collection, Product } from "@/lib/models";
import { adminAuthFailure, unavailable } from "@/lib/api";

export async function GET() {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  try {
    await connectToDatabase();
    const [products, categories, collections, outboundClicks, bestPerformers] =
      await Promise.all([
        Promise.all([
          Product.countDocuments(),
          Product.countDocuments({ status: "published" }),
          Product.countDocuments({ status: "draft" }),
        ]),
        Category.countDocuments(),
        Collection.countDocuments(),
        ClickEvent.countDocuments(),
        ClickEvent.aggregate([
          { $group: { _id: "$product", clicks: { $sum: 1 } } },
          { $sort: { clicks: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "_id",
              as: "product",
            },
          },
          { $unwind: "$product" },
          {
            $project: {
              _id: 0,
              id: { $toString: "$product._id" },
              title: "$product.title",
              slug: "$product.slug",
              clicks: 1,
            },
          },
        ]),
      ]);
    return Response.json(
      {
        products: { total: products[0], published: products[1], drafts: products[2] },
        categories,
        collections,
        outboundClicks,
        bestPerformers,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return unavailable(error, "Admin overview");
  }
}
