import { isValidObjectId } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { ContactMessage } from "@/lib/models";
import { adminAuthFailure, unavailable } from "@/lib/api";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authFailure = await adminAuthFailure();
  if (authFailure) return authFailure;
  const { id } = await params;
  if (!isValidObjectId(id)) {
    return Response.json({ error: "Message not found." }, { status: 404 });
  }
  try {
    await connectToDatabase();
    const result = await ContactMessage.findByIdAndDelete(id);
    return result
      ? Response.json({ success: true })
      : Response.json({ error: "Message not found." }, { status: 404 });
  } catch (error) {
    return unavailable(error, "Contact inbox");
  }
}
