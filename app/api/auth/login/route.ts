import { compare } from "bcryptjs";
import { AuthAttempt, User } from "@/lib/models";
import { jsonError, invalidInput, readJson, unavailable } from "@/lib/api";
import { createAdminSession, loginRateLimitKey } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { loginInputSchema } from "@/lib/validation";

const windowMs = 15 * 60 * 1000;
const maxAttempts = 5;

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await readJson(request);
  } catch {
    return jsonError("Invalid login request.", 400);
  }
  const parsed = loginInputSchema.safeParse(body);
  if (!parsed.success) return invalidInput(parsed.error);

  try {
    await connectToDatabase();
    const now = new Date();
    const key = loginRateLimitKey(request, parsed.data.email);
    const attempt = await AuthAttempt.findOne({ key });
    if (
      attempt &&
      now.getTime() - attempt.windowStartedAt.getTime() >= windowMs
    ) {
      attempt.attempts = 0;
      attempt.windowStartedAt = now;
      attempt.blockedUntil = undefined;
    }
    let isLocked = Boolean(
      attempt &&
        (attempt.blockedUntil
          ? attempt.blockedUntil > now
          : attempt.attempts >= maxAttempts),
    );
    if (attempt && attempt.attempts >= maxAttempts && !attempt.blockedUntil) {
      attempt.blockedUntil = new Date(now.getTime() + windowMs);
      await attempt.save();
      isLocked = true;
    }

    const user = await User.findOne({
      email: parsed.data.email,
      disabled: false,
      role: "admin",
    }).select("+passwordHash");
    const passwordMatches = user
      ? await compare(parsed.data.password, user.passwordHash)
      : false;

    if (isLocked && (!user || !passwordMatches)) {
      return jsonError("Too many attempts. Try again later.", 429);
    }

    if (!user || !passwordMatches) {
      if (attempt) {
        attempt.attempts += 1;
        if (attempt.attempts >= maxAttempts) {
          attempt.blockedUntil = new Date(now.getTime() + windowMs);
        }
        attempt.expiresAt = new Date(now.getTime() + windowMs * 2);
        await attempt.save();
      } else {
        await AuthAttempt.create({
          key,
          attempts: 1,
          windowStartedAt: now,
          expiresAt: new Date(now.getTime() + windowMs * 2),
        });
      }
      return jsonError("Email or password is incorrect.", 401);
    }

    await Promise.all([
      AuthAttempt.deleteOne({ key }),
      User.updateOne({ _id: user._id }, { $set: { lastLoginAt: now } }),
    ]);
    await createAdminSession(String(user._id));
    return Response.json({ success: true });
  } catch (error) {
    return unavailable(error, "Admin authentication");
  }
}
