import { v2 as cloudinary } from "cloudinary";
import { isCloudinaryConfigured, getEnvironment } from "@/lib/env";
import { adminAuthFailure, jsonError, readJson, unavailable } from "@/lib/api";

export async function DELETE(request: Request) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  if (!isCloudinaryConfigured()) {
    return jsonError("Cloudinary upload is not configured.", 503);
  }
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return jsonError("Invalid request.", 400);
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("publicId" in body) ||
    typeof body.publicId !== "string" ||
    !body.publicId.startsWith("ur/products/")
  ) {
    return jsonError("A product image public ID is required.", 400);
  }

  try {
    const environment = getEnvironment();
    cloudinary.config({
      cloud_name: environment.CLOUDINARY_CLOUD_NAME,
      api_key: environment.CLOUDINARY_API_KEY,
      api_secret: environment.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const result = await cloudinary.uploader.destroy(body.publicId, {
      resource_type: "image",
      invalidate: true,
    });
    if (result.result !== "ok" && result.result !== "not found") {
      return jsonError("Cloudinary did not confirm image deletion.", 502);
    }
    return Response.json({ success: true });
  } catch (error) {
    return unavailable(error, "Cloudinary image deletion");
  }
}
