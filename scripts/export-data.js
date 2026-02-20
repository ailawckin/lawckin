// Export data from Supabase project
// Usage: node scripts/export-data.js

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
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Make sure VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// List of tables to export (in order - dependencies first)
const tables = [
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

async function exportTable(tableName) {
  console.log(`Exporting ${tableName}...`);
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*');
  
  if (error) {
    // Some tables might not exist or have RLS blocking access
    if (error.code === 'PGRST116') {
      console.log(`⚠️  Table ${tableName} doesn't exist or is not accessible`);
      return null;
    }
    console.error(`❌ Error exporting ${tableName}:`, error.message);
    return null;
  }
  
  return data || [];
}

async function exportAll() {
  console.log('📦 Starting data export...\n');
  console.log(`Project: ${SUPABASE_URL}\n`);
  
  const exportData = {};
  let totalRows = 0;
  
  for (const table of tables) {
    const data = await exportTable(table);
    if (data !== null) {
      exportData[table] = data;
      totalRows += data.length;
      console.log(`✓ Exported ${data.length} rows from ${table}`);
    }
  }
  
  // Save to file
  const outputPath = join(dirname(fileURLToPath(import.meta.url)), '../exported-data.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(exportData, null, 2)
  );
  
  console.log('\n✅ Export complete!');
  console.log(`📁 Data saved to: ${outputPath}`);
  console.log(`📊 Total tables exported: ${Object.keys(exportData).length}`);
  console.log(`📈 Total rows exported: ${totalRows}`);
}

exportAll().catch(console.error);

