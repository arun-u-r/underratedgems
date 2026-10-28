import {
  adminAuthFailure,
  isDuplicateKeyError,
  invalidInput,
  readJson,
  unavailable,
} from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { Category } from "@/lib/models";
import { categoryInputSchema } from "@/lib/validation";

export async function GET() {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  try {
    await connectToDatabase();
    const categories = await Category.find().sort({ position: 1, name: 1 }).lean();
    return Response.json({ categories }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return unavailable(error, "Category administration");
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
  const parsed = categoryInputSchema.safeParse(body);
  if (!parsed.success) return invalidInput(parsed.error);
  try {
    await connectToDatabase();
    const category = await Category.create(parsed.data);
    return Response.json({ category }, { status: 201 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "That category slug is already in use." }, { status: 409 });
    }
    return unavailable(error, "Category administration");
  }
}
