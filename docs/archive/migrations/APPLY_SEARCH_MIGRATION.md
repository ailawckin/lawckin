# Apply Search Migration

The new smart search function needs to be applied to your Supabase database.

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy and paste the contents of `supabase/migrations/20251114000000_create_smart_search_function.sql`
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. You should see "Success. No rows returned"

## Option 2: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push
```

## Verify It Works

After applying the migration, the search should:
- Use the new `search_lawyers` function
- Show match scores on lawyer cards
- Provide better, ranked results

If the function doesn't exist, the app will automatically fall back to the old search method with fuzzy matching support.

