import { isValidObjectId } from "mongoose";
import {
  adminAuthFailure,
  isDuplicateKeyError,
  invalidInput,
  readJson,
  unavailable,
} from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { Collection, Product, SiteSettings } from "@/lib/models";
import { collectionInputSchema } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return Response.json({ error: "Collection not found." }, { status: 404 });
  }
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
    const collection = await Collection.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();
    return collection
      ? Response.json({ collection })
      : Response.json({ error: "Collection not found." }, { status: 404 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "That collection slug is already in use." }, { status: 409 });
    }
    return unavailable(error, "Collection administration");
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return Response.json({ error: "Collection not found." }, { status: 404 });
  }
  try {
    await connectToDatabase();
    const result = await Collection.findByIdAndDelete(id);
    if (result) {
      await SiteSettings.updateOne(
        { key: "main" },
        { $pull: { featuredCollections: id } },
      );
    }
    return result
      ? Response.json({ success: true })
      : Response.json({ error: "Collection not found." }, { status: 404 });
  } catch (error) {
    return unavailable(error, "Collection administration");
  }
}
