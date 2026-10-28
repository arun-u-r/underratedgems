import { isValidObjectId } from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import {
  adminAuthFailure,
  isDuplicateKeyError,
  invalidInput,
  readJson,
  unavailable,
} from "@/lib/api";
import { connectToDatabase } from "@/lib/db";
import { getEnvironment, isCloudinaryConfigured } from "@/lib/env";
import {
  Category,
  ClickEvent,
  Collection,
  Product,
  SiteSettings,
  type ProductDocument,
} from "@/lib/models";
import { productInputSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }
  try {
    await connectToDatabase();
    const product = await Product.findById(id).lean();
    return product
      ? Response.json({ product }, { headers: { "Cache-Control": "private, no-store" } })
      : Response.json({ error: "Product not found." }, { status: 404 });
  } catch (error) {
    return unavailable(error, "Product administration");
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return Response.json({ error: "Product not found." }, { status: 404 });
  }
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return Response.json({ error: "Request body must contain valid JSON." }, { status: 400 });
  }
  const parsed = productInputSchema.safeParse(body);
  if (!parsed.success) return invalidInput(parsed.error);

  try {
    await connectToDatabase();
    const [current, category] = await Promise.all([
      Product.findById(id),
      Category.findById(parsed.data.category).select("_id").lean(),
    ]);
    if (!current) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    if (!category) {
      return Response.json({ error: "Select an existing category." }, { status: 400 });
    }
    current.set({
      ...parsed.data,
      publishedAt:
        parsed.data.status === "published"
          ? current.publishedAt ?? new Date()
          : null,
    });
    await current.save();
    return Response.json({ product: current.toObject() });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return Response.json({ error: "That product slug is already in use." }, { status: 409 });
    }
    return unavailable(error, "Product administration");
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
    return Response.json({ error: "Product not found." }, { status: 404 });
  }
  try {
    await connectToDatabase();
    const product = await Product.findById(id).select("images").lean();
    if (!product) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }
    const deleted = await Product.findByIdAndDelete(id);
    if (!deleted) {
      return Response.json({ error: "Product not found." }, { status: 404 });
    }

    const warnings: string[] = [];
    const cleanupResults = await Promise.allSettled([
      Collection.updateMany({ products: id }, { $pull: { products: id } }),
      SiteSettings.updateOne(
        { key: "main" },
        { $pull: { featuredProducts: id } },
      ),
      ClickEvent.deleteMany({ product: id }),
    ]);
    const cleanupLabels = [
      "collection references",
      "featured product settings",
      "product click analytics",
    ];
    cleanupResults.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Unable to clean ${cleanupLabels[index]} for product ${id}`, result.reason);
        warnings.push(`Some ${cleanupLabels[index]} could not be cleaned up.`);
      }
    });

    const publicIds = product.images
      .map((image: ProductDocument["images"][number]) => image.publicId)
      .filter((publicId: string | undefined): publicId is string =>
        Boolean(publicId),
      );
    if (publicIds.length) {
      try {
        if (!isCloudinaryConfigured()) {
          warnings.push(
            "Cloudinary is not configured; product image files were left untouched.",
          );
        } else {
          const environment = getEnvironment();
          cloudinary.config({
            cloud_name: environment.CLOUDINARY_CLOUD_NAME,
            api_key: environment.CLOUDINARY_API_KEY,
            api_secret: environment.CLOUDINARY_API_SECRET,
            secure: true,
          });
          for (const publicId of publicIds) {
            if (!publicId.startsWith("ur/products/")) {
              warnings.push("An image outside the managed product folder was not deleted.");
              continue;
            }
            try {
              const result = await cloudinary.uploader.destroy(publicId, {
                resource_type: "image",
                invalidate: true,
              });
              if (result.result !== "ok" && result.result !== "not found") {
                warnings.push("Cloudinary did not confirm deletion of a product image.");
              }
            } catch (error) {
              console.error(`Unable to delete Cloudinary image ${publicId}`, error);
              warnings.push("A product image could not be deleted from Cloudinary.");
            }
          }
        }
      } catch (error) {
        console.error("Unable to configure Cloudinary image cleanup", error);
        warnings.push("Cloudinary image cleanup could not be completed.");
      }
    }
    return Response.json({ success: true, warnings });
  } catch (error) {
    return unavailable(error, "Product administration");
  }
}
