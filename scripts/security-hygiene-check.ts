import { readFileSync } from "node:fs";
import { globSync } from "node:fs";

type Finding = { severity: "error" | "warn"; message: string; file: string };

const files = globSync("{src,supabase,docs,scripts}/**/*.{ts,tsx,js,md,sql}", {
  exclude: ["**/node_modules/**", "**/dist/**"],
});

const findings: Finding[] = [];

const secretPatterns = [
  { pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"`][^'"`]+['"`]/, label: "Hardcoded service role key" },
  { pattern: /Authorization\s*:\s*['"`]Bearer\s+sk-[^'"`]+['"`]/, label: "Hardcoded OpenAI key" },
  { pattern: /RESEND_API_KEY\s*=\s*['"`][^'"`]+['"`]/, label: "Hardcoded Resend key" },
];

for (const file of files) {
  const content = readFileSync(file, "utf8");

  for (const { pattern, label } of secretPatterns) {
    if (pattern.test(content)) {
      findings.push({ severity: "error", message: label, file });
    }
  }

  if (file.startsWith("src/") && content.includes("SERVICE_ROLE")) {
    findings.push({
      severity: "error",
      message: "Potential service-role usage in frontend code",
      file,
    });
  }

  if (file.startsWith("supabase/functions/") && content.includes('"Access-Control-Allow-Origin": "*"')) {
    findings.push({
      severity: "warn",
      message: "Wildcard CORS detected (ensure this is intentional for public endpoints)",
      file,
    });
  }
}

if (findings.length === 0) {
  console.log("✅ Security hygiene checks passed");
  process.exit(0);
}

for (const finding of findings) {
  const prefix = finding.severity === "error" ? "❌" : "⚠️";
  console.log(`${prefix} [${finding.severity}] ${finding.file}: ${finding.message}`);
}

if (findings.some((f) => f.severity === "error")) {
  process.exit(1);
}
