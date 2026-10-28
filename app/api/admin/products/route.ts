import { NextRequest } from "next/server";
import {
  adminAuthFailure,
  isDuplicateKeyError,
  invalidInput,
  readJson,
  unavailable,
} from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { Category, Product } from "@/lib/models";
import { productInputSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;

  const page = Math.max(1, Number(request.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.min(
    48,
    Math.max(1, Number(request.nextUrl.searchParams.get("limit")) || 20),
  );
  const query = request.nextUrl.searchParams.get("q")?.trim().slice(0, 100);
  const status = request.nextUrl.searchParams.get("status");

  try {
    await connectToDatabase();
    const filter: Record<string, unknown> = {};
    if (status && ["draft", "published", "archived"].includes(status)) {
      filter.status = status;
    }
    if (query) {
      const safeQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = new RegExp(safeQuery, "i");
    }
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Product.countDocuments(filter),
    ]);
    return Response.json(
      { products, page, limit, total, totalPages: Math.ceil(total / limit) },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    return unavailable(error, "Product administration");
  }
}

export async function POST(request: Request) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;

  let body: unknown;
  try {
    body = await readJson(request);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Invalid JSON." },
      { status: 400 },
    );
  }
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) return invalidInput(parsed.error);

  try {
    await connectToDatabase();
    const category = await Category.findById(parsed.data.category)
      .select("_id")
      .lean();
    if (!category) {
      return Response.json({ error: "Select an existing category." }, { status: 400 });
    }
    const product = await Product.create({
      ...parsed.data,
      publishedAt: parsed.data.status === "published" ? new Date() : undefined,
    });
    return Response.json({ product }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "That product slug is already in use." }, { status: 409 });
    }
    return unavailable(error, "Product administration");
  }
}
