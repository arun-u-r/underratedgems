import { getPublicCollection } from "@/lib/public-data";
import { unavailable } from "@/lib/api";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return Response.json({ error: "Collection not found." }, { status: 404 });
  }
  try {
    const collection = await getPublicCollection(slug);
    return collection
      ? Response.json(collection, {
          headers: {
            "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
          },
        })
      : Response.json({ error: "Collection not found." }, { status: 404 });
  } catch (error) {
    return unavailable(error, "Collection catalogue");
  }
}
