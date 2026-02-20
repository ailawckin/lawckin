# Create Your Own Supabase Project

Since the current project is owned by Lovable, you'll need to create your own Supabase account and project.

## Step 1: Create Supabase Account

1. Go to https://supabase.com/
2. Click "Start your project" or "Sign Up"
3. Sign up with GitHub, Google, or email
4. Verify your email if needed

## Step 2: Create New Project

1. In your Supabase dashboard, click "New Project"
2. Fill in:
   - **Name**: `Lawckin` (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you (e.g., `US East (North Virginia)`)
   - **Plan**: Free tier is fine for development
3. Click "Create new project"
4. Wait 2-3 minutes for setup

## Step 3: Get Your Project Credentials

1. In your new project dashboard, go to **Settings** → **API**
2. You'll see:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the publishable key)

## Step 4: Update Your .env File

1. Open your `.env` file in the project root
2. Replace the Supabase values:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
```

**Important**: Replace `your-project-id` and `your-anon-key-here` with values from Step 3.

## Step 5: Set Up Database Schema

You'll need to recreate your database schema. Options:

### Option A: If you have the schema files
Run all migrations in `supabase/migrations/` folder through SQL Editor

### Option B: Manual setup
Start with the essential tables and add as needed

## Step 6: Apply the street_address Migration

Once your project is set up:

1. Go to **SQL Editor** in Supabase Dashboard
2. Run the migration:
   ```sql
   ALTER TABLE public.lawyer_profiles
   ADD COLUMN IF NOT EXISTS street_address TEXT;
   ```

## Step 7: Update TypeScript Types

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/integrations/supabase/types.ts
```

Or use the helper script:
```bash
./scripts/regenerate-types.sh
```
(But update the project ID in the script first)

---

## Alternative: Use Existing Project (If You Have Admin Access)

If you have the admin credentials or service role key, you can:
1. Use the SQL Editor with service role key
2. Or use Supabase CLI with service role key

But for long-term development, creating your own project is recommended.

