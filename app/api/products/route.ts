import { NextRequest } from "next/server";
import { invalidInput, unavailable } from "@/lib/api";
import { listPublicProducts } from "@/lib/public-data";
import { paginationSchema } from "@/lib/validation";
import { connection } from "next/server";

export async function GET(request: NextRequest) {
  await connection();
  const parsed = paginationSchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return invalidInput(parsed.error);

  try {
    const result = await listPublicProducts(request.nextUrl.searchParams);
    return Response.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return unavailable(error, "Product catalogue");
  }
}
