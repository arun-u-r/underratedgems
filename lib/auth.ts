import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import type { HydratedDocument } from "mongoose";
import { requireEnvironmentValue } from "./env.ts";
import { connectToDatabase } from "./db.ts";
import { User, type UserDocument } from "./models.ts";

export const adminCookieName = "ur_admin_session";
const sessionDurationSeconds = 60 * 60 * 8;

function getSessionKey() {
  return new TextEncoder().encode(requireEnvironmentValue("SESSION_SECRET"));
}

export async function createAdminSession(userId: string) {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(`${sessionDurationSeconds}s`)
    .sign(getSessionKey());

  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: sessionDurationSeconds,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(adminCookieName, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentAdmin(): Promise<HydratedDocument<UserDocument> | null> {
  const token = (await cookies()).get(adminCookieName)?.value;
  if (!token) return null;

  const secret = getSessionKey();
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    }));
  } catch {
    return null;
  }
  if (payload.role !== "admin" || !payload.sub) return null;
  await connectToDatabase();
  return User.findOne({
    _id: payload.sub,
    role: "admin",
    disabled: false,
  });
}

export async function requireAdmin() {
  return getCurrentAdmin();
}

export function loginRateLimitKey(request: Request, email: string) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const remoteAddress =
    request.headers.get("x-real-ip") ??
    (forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown");
  const secret = requireEnvironmentValue("SESSION_SECRET");
  return createHmac("sha256", secret)
    .update(`${remoteAddress}\n${email}`)
    .digest("hex");
}

export function constantTimeStringEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}
