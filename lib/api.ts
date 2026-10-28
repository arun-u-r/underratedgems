import { ZodError } from "zod";
import { connection } from "next/server";
import { requireAdmin } from "./auth";

export function jsonError(message: string, status: number, details?: unknown) {
  return Response.json(
    {
      error: message,
      ...(details === undefined ? {} : { details }),
    },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export function invalidInput(error: ZodError) {
  return jsonError(
    "Please correct the highlighted input.",
    400,
    error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  );
}

export function unavailable(error: unknown, dependency: string) {
  console.error(`UR ${dependency} operation failed`, error);
  return jsonError(`${dependency} is unavailable. Check server configuration.`, 503);
}

export function isDuplicateKeyError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === 11000
  );
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Request body must contain valid JSON.", { cause: "invalid-json" });
  }
}

export function isInvalidJsonError(error: unknown) {
  return (
    error instanceof Error &&
    "cause" in error &&
    error.cause === "invalid-json"
  );
}

export async function adminAuthFailure(): Promise<Response | null> {
  await connection();
  try {
    return (await requireAdmin())
      ? null
      : jsonError("Unauthorized.", 401);
  } catch (error) {
    return unavailable(error, "Admin session verification");
  }
}
