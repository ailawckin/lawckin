import { readFileSync } from "node:fs";

const appSource = readFileSync("src/App.tsx", "utf8");

const requiredRoutes = [
  'path="/auth"',
  'path="/search-results"',
  'path="/admin/*"',
  'path="/lawyer-dashboard"',
  'path="/dashboard"',
];

const missing = requiredRoutes.filter((route) => !appSource.includes(route));

if (missing.length > 0) {
  console.error("Smoke check failed. Missing critical routes:");
  for (const route of missing) console.error(`- ${route}`);
  process.exit(1);
}

console.log("✅ Critical route smoke checks passed");
