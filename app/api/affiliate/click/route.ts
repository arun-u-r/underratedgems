import { NextRequest, NextResponse } from "next/server";
import { isValidObjectId } from "mongoose";
import { unavailable } from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { validateAffiliateUrl } from "@/lib/affiliate";
import { ClickEvent, Product } from "@/lib/models";

const botPattern =
  /bot|crawler|spider|slurp|preview|fetch|monitor|uptime|headless/i;

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get("productId") ?? "";
  const retailerId = request.nextUrl.searchParams.get("retailerId") ?? "";
  const source = request.nextUrl.searchParams.get("source")?.slice(0, 120);
  if (!isValidObjectId(productId) || !isValidObjectId(retailerId)) {
    return Response.json({ error: "Offer not found." }, { status: 404 });
  }

  try {
    await connectToDatabase();
    const product = await Product.findOne({
      _id: productId,
      status: "published",
      "retailerOffers._id": retailerId,
    }).select("retailerOffers.$").lean();
    const offer = product?.retailerOffers?.[0];
    if (!offer || !validateAffiliateUrl(offer.url)) {
      return Response.json({ error: "Offer not found." }, { status: 404 });
    }

    const redirect = NextResponse.redirect(offer.url, 302);
    const userAgent = request.headers.get("user-agent") ?? "";
    const cookieValue = `${productId}.${retailerId}`;
    const isRecentRepeat =
      request.cookies.get("ur_recent_click")?.value === cookieValue;
    if (!botPattern.test(userAgent) && !isRecentRepeat) {
      await ClickEvent.create({
        product: productId,
        retailerId,
        ...(source ? { source } : {}),
        clickedAt: new Date(),
      });
      redirect.cookies.set("ur_recent_click", cookieValue, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30,
      });
    }
    return redirect;
  } catch (error) {
    return unavailable(error, "Affiliate redirect");
  }
}
