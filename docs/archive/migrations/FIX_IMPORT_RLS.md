# Fix Import RLS Issues

The data import failed because Row Level Security (RLS) policies are blocking inserts. We need to use the **service role key** instead of the anon key.

## Solution: Use Service Role Key

### Step 1: Get Your Service Role Key

1. Go to Supabase Dashboard
2. **Settings** → **API**
3. Scroll down to **"Project API keys"**
4. Find **"service_role"** key (NOT the anon key)
5. **Copy this key** - it's secret and bypasses RLS

⚠️ **IMPORTANT:** Never commit the service role key to git! It has admin access.

### Step 2: Update Import Script Temporarily

Update `scripts/import-data.js` to use service role key:

```javascript
// Change this line:
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// To this:
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
```

### Step 3: Add Service Role Key to .env

Add to your `.env` file (temporarily):

```env
# Service role key (for data import only - DO NOT COMMIT)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 4: Run Import Again

```bash
npm run import-data
```

### Step 5: Remove Service Role Key

After import is complete:
1. Remove `SUPABASE_SERVICE_ROLE_KEY` from `.env`
2. Revert the import script changes

---

## Alternative: Temporarily Disable RLS

If you prefer, you can temporarily disable RLS in SQL Editor:

1. Go to **SQL Editor**
2. Run this (temporarily disables RLS):

```sql
-- Temporarily disable RLS for import
ALTER TABLE practice_areas DISABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_expertise DISABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_specializations DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_availability DISABLE ROW LEVEL SECURITY;
```

3. Run import: `npm run import-data`
4. Re-enable RLS:

```sql
-- Re-enable RLS
ALTER TABLE practice_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_expertise ENABLE ROW LEVEL SECURITY;
ALTER TABLE lawyer_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_availability ENABLE ROW LEVEL SECURITY;
```

---

## Recommended: Use Service Role Key

I'll update the import script to use service role key if available. Just add it to `.env` temporarily.

