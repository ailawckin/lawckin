import { existsSync, readFileSync } from "node:fs";

const loadEnvFile = (path: string) => {
  if (!existsSync(path)) return;
  const source = readFileSync(path, "utf8");
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx <= 0) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
};

loadEnvFile(".env");
loadEnvFile(".env.local");

type Rule = {
  name: string;
  required?: boolean;
  validate?: (value: string) => string | null;
};

const isUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const rules: Rule[] = [
  {
    name: "VITE_SUPABASE_URL",
    required: true,
    validate: (value) => (isUrl(value) ? null : "must be a valid URL"),
  },
  {
    name: "VITE_SUPABASE_PUBLISHABLE_KEY",
    required: true,
    validate: (value) => (value.length >= 20 ? null : "looks too short"),
  },
  {
    name: "VITE_COUNTRY",
    validate: (value) => (["nyc", "ch"].includes(value) ? null : "must be nyc or ch"),
  },
  {
    name: "VITE_OBSERVABILITY_ENDPOINT",
    validate: (value) => (isUrl(value) ? null : "must be a valid URL"),
  },
  {
    name: "SUPABASE_URL",
    validate: (value) => (isUrl(value) ? null : "must be a valid URL"),
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    validate: (value) => (value.length >= 20 ? null : "looks too short"),
  },
];

const issues: string[] = [];

for (const rule of rules) {
  const value = process.env[rule.name]?.trim();

  if (!value) {
    if (rule.required) issues.push(`${rule.name} is required`);
    continue;
  }

  if (rule.validate) {
    const err = rule.validate(value);
    if (err) issues.push(`${rule.name}: ${err}`);
  }
}

if (issues.length > 0) {
  console.error("Environment validation failed:\n" + issues.map((v) => `- ${v}`).join("\n"));
  process.exit(1);
}

console.log("✅ Environment validation passed");
