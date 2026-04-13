import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
  AUTH_SESSION_TTL: z
    .string()
    .optional()
    .transform((v) => (v ? Number.parseInt(v, 10) : 60 * 60 * 12)),
  CRON_SECRET: z.string().min(16, "CRON_SECRET must be at least 16 characters"),
  STORE_NAME: z.string().default("Luxe Boutique"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

type Env = z.infer<typeof schema>;

let cached: Env | null = null;

export function env(): Env {
  if (cached) return cached;
  const parsed = schema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration → ${issues}`);
  }
  cached = parsed.data;
  return cached;
}
