import { listPublicCollections } from "@/lib/public-data";
import { unavailable } from "@/lib/api";
import { connection } from "next/server";

export async function GET() {
  await connection();
  try {
    return Response.json(await listPublicCollections(), {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=900",
      },
    });
  } catch (error) {
    return unavailable(error, "Collection catalogue");
  }
}
