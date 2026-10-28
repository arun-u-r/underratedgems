import { connectToDatabase } from "@/lib/db";
import { ClickEvent } from "@/lib/models";
import { adminAuthFailure, unavailable } from "@/lib/api";

export async function GET(request: Request) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  const requestedDays = Number(new URL(request.url).searchParams.get("days"));
  const days = [7, 30, 90].includes(requestedDays) ? requestedDays : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    await connectToDatabase();
    const [total, daily, retailers, products] = await Promise.all([
      ClickEvent.countDocuments({ clickedAt: { $gte: since } }),
      ClickEvent.aggregate([
        { $match: { clickedAt: { $gte: since } } },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$clickedAt" },
            },
            clicks: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: "$_id", clicks: 1 } },
      ]),
      ClickEvent.aggregate([
        { $match: { clickedAt: { $gte: since } } },
        { $group: { _id: "$retailerId", clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "products",
            let: { productId: "$_id" },
            pipeline: [
              { $unwind: "$retailerOffers" },
              { $match: { $expr: { $eq: ["$retailerOffers._id", "$$productId"] } } },
              { $project: { _id: 0, retailer: "$retailerOffers.retailer" } },
            ],
            as: "offer",
          },
        },
        {
          $project: {
            _id: 0,
            retailer: { $ifNull: [{ $first: "$offer.retailer" }, "Unknown retailer"] },
            clicks: 1,
          },
        },
      ]),
      ClickEvent.aggregate([
        { $match: { clickedAt: { $gte: since } } },
        { $group: { _id: "$product", clicks: { $sum: 1 } } },
        { $sort: { clicks: -1 } },
        { $limit: 10 },
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
            title: "$product.title",
            slug: "$product.slug",
            clicks: 1,
          },
        },
      ]),
    ]);
    return Response.json(
      { days, total, daily, retailers, products },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return unavailable(error, "Analytics");
  }
}
