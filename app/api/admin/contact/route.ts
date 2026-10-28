import { connectToDatabase } from "@/lib/db";
import { ContactMessage } from "@/lib/models";
import { adminAuthFailure, unavailable } from "@/lib/api";

export async function GET() {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  try {
    await connectToDatabase();
    const messages = await ContactMessage.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return Response.json({ messages }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return unavailable(error, "Contact inbox");
  }
}
