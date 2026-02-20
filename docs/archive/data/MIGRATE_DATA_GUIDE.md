# Migrate Data from Lovable Project to Your Own

This guide will help you:
1. Export all data from the Lovable Supabase project
2. Create your own Supabase project
3. Recreate the schema (run all migrations)
4. Import your data back

**Time estimate:** 30-45 minutes

---

## Overview

Since you don't have dashboard access to the Lovable project, we'll use the Supabase API (which you already have access to via your `.env` file) to export data.

---

## Step 1: Export Data from Lovable Project

Since you have the API keys, you can export data using a script. I'll create a Node.js script that uses your existing credentials.

### Create Export Script

Create a file called `export-data.js` in your project root:

```javascript
// export-data.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env file');
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
    console.error(`Error exporting ${tableName}:`, error.message);
    return null;
  }
  
  return data;
}

async function exportAll() {
  const exportData = {};
  
  for (const table of tables) {
    const data = await exportTable(table);
    if (data !== null) {
      exportData[table] = data;
      console.log(`✓ Exported ${data.length} rows from ${table}`);
    }
  }
  
  // Save to file
  fs.writeFileSync(
    'exported-data.json',
    JSON.stringify(exportData, null, 2)
  );
  
  console.log('\n✅ Export complete! Data saved to exported-data.json');
  console.log(`Total tables exported: ${Object.keys(exportData).length}`);
}

exportAll();
```

### Run the Export

```bash
# Make sure you have the Supabase client installed
npm install @supabase/supabase-js

# Run the export (using Node.js with ES modules)
node --experimental-modules export-data.js
```

Or if you prefer, I can create this script for you as a proper npm script.

---

## Step 2: Create Your Own Supabase Project

1. Go to https://supabase.com/
2. Sign up / Sign in
3. Click "New Project"
4. Fill in:
   - **Name**: `Lawckin` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - **Plan**: Free tier is fine
5. Click "Create new project"
6. Wait 2-3 minutes for setup

---

## Step 3: Apply All Migrations to New Project

1. In your new Supabase dashboard, go to **SQL Editor**
2. Apply migrations **in order** (they're numbered chronologically):

   **Option A: Apply all at once**
   - Copy the entire content of each migration file
   - Paste into SQL Editor
   - Run them one by one in order

   **Option B: Use Supabase CLI** (if you install it)
   ```bash
   supabase link --project-ref YOUR_NEW_PROJECT_ID
   supabase db push
   ```

3. **Important migrations to apply:**
   - All files in `supabase/migrations/` folder
   - Apply them in chronological order (by filename)

---

## Step 4: Update Your .env File

1. Get your new project credentials:
   - Go to **Settings** → **API** in your new project
   - Copy **Project URL** and **anon/public key**

2. Update `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key-here
   ```

3. **Keep the old values commented** for reference:
   ```env
   # Old Lovable project (for reference)
   # VITE_SUPABASE_URL=https://zrnklcpgumwcswyxnumk.supabase.co
   # VITE_SUPABASE_PUBLISHABLE_KEY=old-key-here
   
   # New project
   VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key-here
   ```

---

## Step 5: Import Data to New Project

Create an import script `import-data.js`:

```javascript
// import-data.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Read exported data
const exportData = JSON.parse(fs.readFileSync('exported-data.json', 'utf8'));

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
  for (let i = 0; i < data.length; i += batchSize) {
    const batch = data.slice(i, i + batchSize);
    const { error } = await supabase
      .from(tableName)
      .insert(batch);
    
    if (error) {
      console.error(`❌ Error importing ${tableName}:`, error.message);
      return;
    }
  }
  
  console.log(`✓ Imported ${data.length} rows to ${tableName}`);
}

async function importAll() {
  for (const table of importOrder) {
    if (exportData[table]) {
      await importTable(table, exportData[table]);
    }
  }
  
  console.log('\n✅ Import complete!');
}

importAll();
```

Run it:
```bash
node --experimental-modules import-data.js
```

---

## Step 6: Verify Import

1. Check key tables in Supabase Dashboard → Table Editor:
   - `profiles` - should have your users
   - `lawyer_profiles` - should have lawyer data
   - `consultations` - should have bookings
   - etc.

2. Test your app:
   ```bash
   npm run dev
   ```
   - Log in with your existing account
   - Check if your data appears correctly

---

## Step 7: Apply the street_address Migration

Now that you have your own project, apply the migration:

1. Go to **SQL Editor** in your new Supabase project
2. Run:
   ```sql
   ALTER TABLE public.lawyer_profiles
   ADD COLUMN IF NOT EXISTS street_address TEXT;

   COMMENT ON COLUMN public.lawyer_profiles.location IS 'Primary service area visible to clients (e.g., "Manhattan", "Brooklyn"). Must match curated NY service areas.';
   COMMENT ON COLUMN public.lawyer_profiles.street_address IS 'Full business address for internal use only. Not displayed to clients.';
   ```

3. Regenerate TypeScript types:
   ```bash
   supabase gen types typescript --project-id YOUR_NEW_PROJECT_ID --schema public > src/integrations/supabase/types.ts
   ```

---

## Troubleshooting

### "Permission denied" errors during export
- Some tables might have RLS policies blocking reads
- You may need to temporarily disable RLS or use service role key
- Or ask Lovable to run the export for you

### Foreign key errors during import
- Make sure you're importing in the correct order
- Check that referenced tables (like `auth.users`) exist first
- Some tables reference `auth.users` - you may need to handle user migration separately

### Missing auth.users
- The `auth.users` table is managed by Supabase Auth
- Users will need to sign up again, OR
- You can migrate auth users using Supabase's user migration tools (more complex)

---

## Alternative: Ask Lovable for Help

If the export/import process is too complex, you can:
1. Ask Lovable to export the data for you
2. Ask Lovable to add you as a collaborator to the project
3. Ask Lovable to run the migration for you

---

## Quick Checklist

- [ ] Export data from Lovable project
- [ ] Create new Supabase project
- [ ] Apply all migrations (in order)
- [ ] Update `.env` with new credentials
- [ ] Import data to new project
- [ ] Verify data import
- [ ] Apply `street_address` migration
- [ ] Regenerate TypeScript types
- [ ] Test app with new project

---

## Next Steps

Once migration is complete:
1. ✅ You have full control of your database
2. ✅ You can run migrations anytime
3. ✅ Your data is preserved
4. ✅ You can continue development independently

Good luck! 🚀

