import { isValidObjectId } from "mongoose";
import {
  adminAuthFailure,
  isDuplicateKeyError,
  invalidInput,
  readJson,
  unavailable,
} from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { Category, Product, SiteSettings } from "@/lib/models";
import { categoryInputSchema } from "@/lib/validation";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return Response.json({ error: "Category not found." }, { status: 404 });
  }
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
    const category = await Category.findByIdAndUpdate(id, parsed.data, {
      new: true,
      runValidators: true,
    }).lean();
    return category
      ? Response.json({ category })
      : Response.json({ error: "Category not found." }, { status: 404 });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "That category slug is already in use." }, { status: 409 });
    }
    return unavailable(error, "Category administration");
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
    return Response.json({ error: "Category not found." }, { status: 404 });
  }
  try {
    await connectToDatabase();
    const [category, productCount] = await Promise.all([
      Category.findById(id),
      Product.countDocuments({ category: id }),
    ]);
    if (!category) {
      return Response.json({ error: "Category not found." }, { status: 404 });
    }
    if (productCount > 0) {
      return Response.json(
        { error: "Move or remove this category's products before deleting it." },
        { status: 409 },
      );
    }
    await category.deleteOne();
    await SiteSettings.updateOne(
      { key: "main" },
      { $pull: { featuredCategories: id } },
    );
    return Response.json({ success: true });
  } catch (error) {
    return unavailable(error, "Category administration");
  }
}
