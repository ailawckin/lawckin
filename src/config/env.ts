import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url("VITE_SUPABASE_URL must be a valid URL"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(20, "VITE_SUPABASE_PUBLISHABLE_KEY looks too short"),
  VITE_COUNTRY: z.enum(["nyc", "ch"]).optional().default("nyc"),
  VITE_GOOGLE_MAPS_API_KEY: z.string().optional(),
  VITE_APP_PASSCODE: z.string().optional(),
  VITE_OBSERVABILITY_ENDPOINT: z.string().url().optional(),
  VITE_OBSERVABILITY_ENV: z.string().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const messages = parsed.error.issues
    .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Environment validation failed:\n${messages}`);
}

export const env = parsed.data;
export type AppEnv = typeof env;
