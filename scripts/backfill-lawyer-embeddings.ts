// Backfill missing lawyer profile embeddings
// Usage: tsx scripts/backfill-lawyer-embeddings.ts [--all]
// Requires: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY in .env

import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env");
if (!fs.existsSync(envPath)) {
  console.error("❌ .env file not found at:", envPath);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, "utf8");
envContent.split("\n").forEach((line) => {
  const cleanLine = line.split("#")[0].trim();
  if (!cleanLine) return;
  const match = cleanLine.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
});

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase credentials in .env file");
  console.error("Required: SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE || 50);
const FORCE_ALL = process.argv.includes("--all");

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type LawyerEmbeddingRow = {
  id: string;
  user_id: string;
  firm_id: string | null;
  specialty: string | null;
  practice_areas: string[] | null;
  ny_locations: string[] | null;
  location: string | null;
  languages: string[] | null;
  bio: string | null;
  experience_years: number | null;
  embedding: number[] | null;
  embedding_text: string | null;
};

type ProfileRow = { user_id: string; full_name: string | null };
type FirmRow = { id: string; firm_name: string | null };

const buildEmbeddingText = (
  row: LawyerEmbeddingRow,
  profileName: string | null,
  firmName: string | null
) => {
  const parts = [
    profileName ? `Name: ${profileName}` : null,
    row.specialty ? `Specialty: ${row.specialty}` : null,
    row.practice_areas?.length ? `Practice areas: ${row.practice_areas.join(", ")}` : null,
    row.languages?.length ? `Languages: ${row.languages.join(", ")}` : null,
    row.ny_locations?.length ? `Locations: ${row.ny_locations.join(", ")}` : null,
    row.location ? `Location: ${row.location}` : null,
    row.experience_years ? `Experience: ${row.experience_years} years` : null,
    firmName ? `Firm: ${firmName}` : null,
    row.bio ? `Bio: ${row.bio}` : null,
  ];
  return parts.filter(Boolean).join("\n");
};

async function backfillEmbeddings() {
  console.log("🧠 Backfilling lawyer embeddings...");
  console.log(FORCE_ALL ? "Mode: full re-embed" : "Mode: missing only");
  let processed = 0;
  let updated = 0;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from("lawyer_profiles")
      .select(
        "id, user_id, firm_id, specialty, practice_areas, ny_locations, location, languages, bio, experience_years, embedding, embedding_text"
      )
      .order("id", { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    const batchRows = data as LawyerEmbeddingRow[];
    const userIds = Array.from(new Set(batchRows.map((row) => row.user_id).filter(Boolean)));
    const firmIds = Array.from(
      new Set(batchRows.map((row) => row.firm_id).filter(Boolean) as string[])
    );

    const [profilesResult, firmsResult] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
        : Promise.resolve({ data: [] as ProfileRow[], error: null }),
      firmIds.length > 0
        ? supabase.from("firms").select("id, firm_name").in("id", firmIds)
        : Promise.resolve({ data: [] as FirmRow[], error: null }),
    ]);

    if (profilesResult.error) throw profilesResult.error;
    if (firmsResult.error) throw firmsResult.error;

    const profileMap = new Map(
      (profilesResult.data || []).map((profile) => [profile.user_id, profile.full_name || null])
    );
    const firmMap = new Map(
      (firmsResult.data || []).map((firm) => [firm.id, firm.firm_name || null])
    );

    for (const row of batchRows) {
      processed += 1;
      if (!FORCE_ALL && row.embedding && row.embedding_text) {
        continue;
      }

      const embeddingText = buildEmbeddingText(
        row,
        profileMap.get(row.user_id) || null,
        row.firm_id ? firmMap.get(row.firm_id) || null : null
      );
      if (!embeddingText || embeddingText.trim().length < 10) {
        console.warn(`⚠️  Skipping ${row.id}: not enough text for embedding.`);
        continue;
      }

      const { data: embedData, error: embedError } = await supabase.functions.invoke(
        "ai-lawyer-profile-embedding",
        { body: { input: embeddingText } }
      );

      if (embedError || !embedData?.embedding) {
        console.warn(`⚠️  Embedding failed for ${row.id}:`, embedError?.message || "No data");
        continue;
      }

      const { error: updateError } = await supabase
        .from("lawyer_profiles")
        .update({
          embedding: embedData.embedding,
          embedding_model: embedData.embedding_model || "text-embedding-3-small",
          embedding_text: embeddingText,
          embedding_updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updateError) {
        console.warn(`⚠️  Update failed for ${row.id}:`, updateError.message);
        continue;
      }

      updated += 1;
      await delay(120);
    }

    if (data.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  console.log(`✅ Done. Processed ${processed} lawyers, updated ${updated}.`);
}

backfillEmbeddings().catch((error) => {
  console.error("❌ Backfill failed:", error);
  process.exit(1);
});
