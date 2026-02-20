# Migration Instructions: Add street_address Column

## Issue
The code references `street_address` column in `lawyer_profiles` table, but the migration hasn't been applied yet.

## Quick Fix: Apply Migration

You need to apply the migration to add the `street_address` column to your database.

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of: `supabase/migrations/20251105040000_add_street_address_to_lawyer_profiles.sql`
5. Click **Run** to execute the migration

### Option 2: Using Supabase CLI

```bash
# From the repo root
supabase db push
```

This will apply all pending migrations including the `street_address` column.

### Option 3: Manual SQL Execution

If you have direct database access, run:

```sql
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS street_address TEXT;

COMMENT ON COLUMN public.lawyer_profiles.location IS 'Primary service area visible to clients (e.g., "Manhattan", "Brooklyn"). Must match curated NY service areas.';
COMMENT ON COLUMN public.lawyer_profiles.street_address IS 'Full business address for internal use only. Not displayed to clients.';
```

## Verify Migration Applied

After running the migration, verify it worked:

1. In Supabase Dashboard → **Table Editor** → `lawyer_profiles`
2. Check that `street_address` column appears in the table
3. Or run this query in SQL Editor:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'lawyer_profiles' 
   AND column_name = 'street_address';
   ```

## Temporary Workaround

The code has been updated to handle the missing column gracefully:
- If `street_address` column doesn't exist, the code will skip saving it
- The business address field will still appear in the UI but won't be saved until migration is applied
- Once migration is applied, the field will work normally

## After Migration

Once the migration is applied:
1. ✅ Business address will be saved to the database
2. ✅ Business address will persist when editing profile
3. ✅ No more schema cache errors

## Next Step

After applying the migration, you should also regenerate TypeScript types:

```bash
./scripts/regenerate-types.sh
```

Or manually:
```bash
supabase gen types typescript --project-id zrnklcpgumwcswyxnumk --schema public > src/integrations/supabase/types.ts
```

This will update the TypeScript types to include the new `street_address` field.

