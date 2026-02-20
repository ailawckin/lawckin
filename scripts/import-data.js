// Import data to Supabase project
// Usage: node scripts/import-data.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load .env file manually (since we're using ES modules)
const envPath = join(dirname(fileURLToPath(import.meta.url)), '../.env');
const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=:#]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    const value = match[2].trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
// Use service role key if available (bypasses RLS), otherwise use anon key
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set');
  console.error('For data import, SUPABASE_SERVICE_ROLE_KEY is recommended (bypasses RLS)');
  process.exit(1);
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('🔑 Using service role key (bypasses RLS)');
} else {
  console.log('⚠️  Using anon key - may hit RLS restrictions');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read exported data
const dataPath = join(dirname(fileURLToPath(import.meta.url)), '../exported-data.json');

if (!fs.existsSync(dataPath)) {
  console.error(`❌ Exported data file not found: ${dataPath}`);
  console.error('Please run export-data.js first');
  process.exit(1);
}

const exportData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

// Import order (dependencies first)
const importOrder = [
  'practice_areas',
  'firms',
  'profiles',
  'user_roles',
  'lawyer_profiles',
  'lawyer_expertise',
  'lawyer_specializations',
  'consultations',
  'time_slots',
  'recurring_availability',
  'availability_overrides',
  'client_search',
  'calendar_connections',
  'calendar_events_cache',
  'oauth_nonces',
  'admin_settings',
  'admin_audit_log',
  'reported_items',
  'support_tickets',
];

async function importTable(tableName, data) {
  if (!data || data.length === 0) {
    console.log(`⏭️  Skipping ${tableName} (no data)`);
    return;
  }
  
  console.log(`Importing ${tableName} (${data.length} rows)...`);
  
  // Insert in batches of 1000
  const batchSize = 1000;
  let imported = 0;
  
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    
    // Remove any null/undefined values that might cause issues
    const cleanBatch = batch.map(row => {
      const clean = {};
      for (const [key, value] of Object.entries(row)) {
        if (value !== undefined) {
          clean[key] = value;
        }
      }
      return clean;
    });
    
    const { error } = await supabase
      .from(tableName)
      .insert(cleanBatch);
    
    if (error) {
      console.error(`❌ Error importing ${tableName} (batch ${Math.floor(i/batchSize) + 1}):`, error.message);
      // Continue with next batch
      continue;
    }
    
    imported += cleanBatch.length;
  }
  
  if (imported > 0) {
    console.log(`✓ Imported ${imported} rows to ${tableName}`);
  }
}

async function importAll() {
  console.log('📥 Starting data import...\n');
  console.log(`Project: ${SUPABASE_URL}\n`);
  
  for (const table of importOrder) {
    if (exportData[table]) {
      await importTable(table, exportData[table]);
    } else {
      console.log(`⏭️  Skipping ${table} (not in export)`);
    }
  }
  
  console.log('\n✅ Import complete!');
  console.log('💡 Verify your data in Supabase Dashboard → Table Editor');
}

importAll().catch(console.error);

