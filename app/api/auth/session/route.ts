import { requireAdmin } from "@/lib/auth";
import { unavailable } from "@/lib/api";
import { connection } from "next/server";

export async function GET() {
  await connection();
  try {
    const admin = await requireAdmin();
    return admin
      ? Response.json(
          { user: { id: String(admin._id), email: admin.email, role: admin.role } },
          { headers: { "Cache-Control": "private, no-store" } },
        )
      : Response.json({ error: "Unauthorized." }, { status: 401 });
  } catch (error) {
    return unavailable(error, "Admin authentication");
  }
}
