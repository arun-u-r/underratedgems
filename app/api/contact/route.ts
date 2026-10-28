import { createHmac } from "node:crypto";
import { AuthAttempt, ContactMessage } from "@/lib/models";
import { jsonError, invalidInput, readJson, unavailable } from "@/lib/api";
import { requireEnvironmentValue } from "@/lib/env";
import { connectToDatabase } from "@/lib/db";
import { contactInputSchema } from "@/lib/validation";

const limitWindowMs = 60 * 60 * 1000;

function contactRateKey(request: Request) {
  const address =
    request.headers.get("x-real-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";
  return createHmac("sha256", requireEnvironmentValue("SESSION_SECRET"))
    .update(`contact:${address}`)
    .digest("hex");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return jsonError("Invalid contact request.", 400);
  }
  const parsed = contactInputSchema.safeParse(body);
  if (!parsed.success) return invalidInput(parsed.error);
  if (parsed.data.website) {
    return Response.json({ success: true }, { status: 201 });
  }

  try {
    await connectToDatabase();
    const now = new Date();
    const key = contactRateKey(request);
    const previous = await AuthAttempt.findOne({ key });
    if (
      previous &&
      now.getTime() - previous.windowStartedAt.getTime() < limitWindowMs &&
      previous.attempts >= 3
    ) {
      return jsonError("Too many messages. Try again later.", 429);
    }
    if (previous) {
      if (now.getTime() - previous.windowStartedAt.getTime() >= limitWindowMs) {
        previous.attempts = 0;
        previous.windowStartedAt = now;
      }
      previous.attempts += 1;
      previous.expiresAt = new Date(now.getTime() + limitWindowMs * 2);
      await previous.save();
    } else {
      await AuthAttempt.create({
        key,
        attempts: 1,
        windowStartedAt: now,
        expiresAt: new Date(now.getTime() + limitWindowMs * 2),
      });
    }
    await ContactMessage.create(parsed.data);
    return Response.json({ success: true }, { status: 201 });
  } catch (error) {
    return unavailable(error, "Contact service");
  }
}
