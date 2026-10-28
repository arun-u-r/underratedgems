import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/lib/models";
import { unavailable } from "@/lib/api";
import { connection } from "next/server";

export async function GET() {
  await connection();
  try {
    await connectToDatabase();
    const settings = await SiteSettings.findOne({ key: "main" })
      .select("siteName siteDescription logoUrl contactEmail socialLinks")
      .lean();
    return Response.json(
      {
        settings: settings
          ? {
              siteName: settings.siteName,
              siteDescription: settings.siteDescription,
              logoUrl: settings.logoUrl,
              contactEmail: settings.contactEmail,
              socialLinks: settings.socialLinks,
            }
          : null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      },
    );
  } catch (error) {
    return unavailable(error, "Site settings");
  }
}
