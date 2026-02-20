# Quick Migration Steps - You're 50% Done! 🎉

## ✅ COMPLETED
- [x] Exported all data (173 rows saved to `exported-data.json`)

## 📋 NEXT STEPS

### Step 1: Create Your Supabase Project (5 minutes)

1. Go to https://supabase.com/
2. Sign up / Sign in
3. Click **"New Project"**
4. Fill in:
   - **Name**: `Lawckin`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - **Plan**: Free tier
5. Click **"Create new project"**
6. Wait 2-3 minutes

### Step 2: Get Your New Project Credentials

1. In your new project dashboard, go to **Settings** → **API**
2. Copy:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the long JWT token)

### Step 3: Apply All Migrations (10-15 minutes)

**Option A: Using SQL Editor (Easiest)**

1. Go to **SQL Editor** in your new Supabase dashboard
2. For each file in `supabase/migrations/` folder (in chronological order):
   - Open the migration file
   - Copy all SQL
   - Paste into SQL Editor
   - Click **Run**
   - Repeat for next migration

**Important:** Apply migrations in this order (by filename):
- `20251013220129_*.sql` (first)
- `20251013220148_*.sql`
- `20251013225854_*.sql`
- ... (all others)
- `20251105040000_add_street_address_to_lawyer_profiles.sql` (last)

**Option B: Using Supabase CLI** (if you install it)

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Link your project
supabase link --project-ref YOUR_NEW_PROJECT_ID

# Push all migrations
supabase db push
```

### Step 4: Update Your .env File

**IMPORTANT:** Keep the old values commented so you can reference them!

1. Open `.env` file
2. Update it like this:

```env
# ============================================
# OLD LOVABLE PROJECT (for reference)
# ============================================
# VITE_SUPABASE_URL=https://zrnklcpgumwcswyxnumk.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# NEW PROJECT (active)
# ============================================
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key-here
```

### Step 5: Import Your Data (2 minutes)

```bash
npm run import-data
```

This will import all 173 rows to your new project!

### Step 6: Verify Everything Works

1. Check your data in Supabase Dashboard → **Table Editor**:
   - `lawyer_profiles` should have 3 rows
   - `time_slots` should have 149 rows
   - etc.

2. Test your app:
   ```bash
   npm run dev
   ```
   - Try logging in
   - Check if your data appears

### Step 7: Apply street_address Migration

Now that you have your own project, you can run migrations!

1. Go to **SQL Editor**
2. Run:
   ```sql
   ALTER TABLE public.lawyer_profiles
   ADD COLUMN IF NOT EXISTS street_address TEXT;

   COMMENT ON COLUMN public.lawyer_profiles.location IS 'Primary service area visible to clients (e.g., "Manhattan", "Brooklyn"). Must match curated NY service areas.';
   COMMENT ON COLUMN public.lawyer_profiles.street_address IS 'Full business address for internal use only. Not displayed to clients.';
   ```

3. Regenerate TypeScript types:
   ```bash
   # Update the project ID in scripts/regenerate-types.sh first
   ./scripts/regenerate-types.sh
   ```

---

## 🎯 What You've Accomplished

✅ **Backed up all your data** (173 rows)  
⬜ Created your own Supabase project  
⬜ Recreated database schema  
⬜ Imported your data  
⬜ Applied street_address migration  

**You're halfway there!** The hard part (export) is done. Now just create the project and import! 🚀

---

## 💡 Tips

- **Don't delete** `exported-data.json` - it's your backup!
- If you hit issues importing, check the error messages - some tables might have foreign key constraints
- The `oauth_nonces` table error is fine - that migration wasn't applied in Lovable's project yet

---

## 🆘 Need Help?

If you get stuck:
1. Check error messages in the terminal
2. Verify your `.env` file has the correct new project credentials
3. Make sure all migrations are applied before importing
4. Check `MIGRATE_DATA_GUIDE.md` for detailed troubleshooting

Good luck! 🎉

