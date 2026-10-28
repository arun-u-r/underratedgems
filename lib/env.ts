import { z } from "zod";

const optionalUrl = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  })
  .optional()
  .or(z.literal("").transform(() => undefined));

const environmentSchema = z.object({
  MONGODB_URI: z.string().trim().min(1).optional(),
  SESSION_SECRET: z.string().min(32).optional(),
  ADMIN_EMAIL: z.string().trim().email().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().trim().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().trim().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().trim().min(1).optional(),
  NEXT_PUBLIC_SITE_URL: optionalUrl,
  AFFILIATE_ALLOWED_HOSTS: z.string().optional(),
});

export type Environment = z.infer<typeof environmentSchema>;

export function getEnvironment(): Environment {
  const parsed = environmentSchema.safeParse(process.env);

  if (!parsed.success) {
    throw new Error(
      `Invalid environment configuration: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  return parsed.data;
}

export function requireEnvironmentValue<K extends keyof Environment>(
  key: K,
): NonNullable<Environment[K]> {
  const value = getEnvironment()[key];
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value as NonNullable<Environment[K]>;
}

export function isCloudinaryConfigured() {
  const environment = getEnvironment();
  return Boolean(
    environment.CLOUDINARY_CLOUD_NAME &&
      environment.CLOUDINARY_API_KEY &&
      environment.CLOUDINARY_API_SECRET,
  );
}
