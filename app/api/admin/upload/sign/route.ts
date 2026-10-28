import { v2 as cloudinary } from "cloudinary";
import { adminAuthFailure, jsonError, unavailable } from "@/lib/api";
import { getEnvironment, isCloudinaryConfigured } from "@/lib/env";

export async function POST() {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  if (!isCloudinaryConfigured()) {
    return jsonError("Cloudinary upload is not configured.", 503);
  }

  try {
    const environment = getEnvironment();
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "ur/products";
    cloudinary.config({
      cloud_name: environment.CLOUDINARY_CLOUD_NAME,
      api_key: environment.CLOUDINARY_API_KEY,
      api_secret: environment.CLOUDINARY_API_SECRET,
      secure: true,
    });
    const signature = cloudinary.utils.api_sign_request(
      { folder, timestamp },
      environment.CLOUDINARY_API_SECRET!,
    );
    return Response.json(
      {
        cloudName: environment.CLOUDINARY_CLOUD_NAME,
        apiKey: environment.CLOUDINARY_API_KEY,
        timestamp,
        folder,
        signature,
        uploadUrl: `https://api.cloudinary.com/v1_1/${environment.CLOUDINARY_CLOUD_NAME}/image/upload`,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    return unavailable(error, "Cloudinary upload");
  }
}
