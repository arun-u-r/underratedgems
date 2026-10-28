import { getPublishedProduct } from "@/lib/public-data";
import { unavailable } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }

  try {
    const product = await getPublishedProduct(slug);
    if (!product) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    return Response.json(product, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return unavailable(error, "Product catalogue");
  }
}
