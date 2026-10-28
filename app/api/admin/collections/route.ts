import {
  adminAuthFailure,
  isDuplicateKeyError,
  invalidInput,
  readJson,
  unavailable,
} from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { Collection, Product } from "@/lib/models";
import { collectionInputSchema } from "@/lib/validation";

export async function GET() {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  try {
    await connectToDatabase();
    const collections = await Collection.find()
      .sort({ position: 1, createdAt: -1 })
      .populate("products", "title slug status")
      .lean();
    return Response.json({ collections }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return unavailable(error, "Collection administration");
  }
}

export async function POST(request: Request) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return Response.json({ error: "Request body must contain valid JSON." }, { status: 400 });
  }
  const parsed = collectionInputSchema.safeParse(body);
  if (!parsed.success) return invalidInput(parsed.error);
  try {
    await connectToDatabase();
    const foundProducts = await Product.countDocuments({
      _id: { $in: parsed.data.products },
    });
    if (foundProducts !== new Set(parsed.data.products).size) {
      return Response.json({ error: "One or more selected products no longer exist." }, { status: 400 });
    }
    const collection = await Collection.create(parsed.data);
    return Response.json({ collection }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "That collection slug is already in use." }, { status: 409 });
    }
    return unavailable(error, "Collection administration");
  }
}
