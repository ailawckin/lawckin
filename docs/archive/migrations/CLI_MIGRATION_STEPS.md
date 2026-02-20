# Supabase CLI Migration Steps

## ✅ Installation Complete!
Supabase CLI is installed at: `~/bin/supabase` (version 2.54.11)

---

## Step-by-Step Migration Process

### Step 1: Login to Supabase

```bash
export PATH="$HOME/bin:$PATH"
supabase login
```

This will:
- Open your browser
- Ask you to authenticate
- Save your session locally

**Run this command now:**
```bash
supabase login
```

---

### Step 2: Create Your Supabase Project

1. Go to https://supabase.com/dashboard
2. Click **"New Project"**
3. Fill in:
   - **Name**: `Lawckin`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to you
   - **Plan**: Free tier
4. Click **"Create new project"**
5. Wait 2-3 minutes for setup

---

### Step 3: Get Your Project Reference ID

After creating your project:

1. In your Supabase dashboard, look at the URL:
   ```
   https://supabase.com/dashboard/project/YOUR_PROJECT_REF
   ```
   
   OR

2. Go to **Settings** → **General** → **Reference ID**

**Save this ID - you'll need it next!**

---

### Step 4: Link Your Project

From your project directory:

```bash
cd /Users/tommasolm/Desktop/lawckin-main
export PATH="$HOME/bin:$PATH"
supabase link --project-ref YOUR_PROJECT_REF
```

It will ask for:
- **Database password**: The password you set when creating the project
- **Connection string**: Press Enter to auto-detect

**Example:**
```bash
supabase link --project-ref abc123xyz789
```

---

### Step 5: Push All Migrations

Once linked, push all your migrations:

```bash
export PATH="$HOME/bin:$PATH"
supabase db push
```

This will:
- Read all files in `supabase/migrations/`
- Apply them in order automatically
- Show you progress

**This replaces manually copying/pasting each migration!**

---

### Step 6: Update Your .env File

1. Get your new project credentials:
   - Go to **Settings** → **API**
   - Copy **Project URL** and **anon/public key**

2. Update `.env`:
   ```env
   # Old Lovable project (comment out)
   # VITE_SUPABASE_URL=https://zrnklcpgumwcswyxnumk.supabase.co
   # VITE_SUPABASE_PUBLISHABLE_KEY=old-key-here
   
   # New project
   VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key-here
   ```

---

### Step 7: Import Your Data

```bash
npm run import-data
```

This imports all 173 rows from `exported-data.json`!

---

### Step 8: Apply street_address Migration

The `street_address` migration is already in your migrations folder, but if you want to apply it manually:

```bash
export PATH="$HOME/bin:$PATH"
supabase db push
```

Or run it in SQL Editor:
```sql
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS street_address TEXT;
```

---

### Step 9: Regenerate TypeScript Types

```bash
export PATH="$HOME/bin:$PATH"
supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/integrations/supabase/types.ts
```

---

## Quick Command Reference

```bash
# Make sure PATH is set (add to ~/.zshrc for permanent)
export PATH="$HOME/bin:$PATH"

# Check status
supabase status

# View migrations
supabase migration list

# Generate types
supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/integrations/supabase/types.ts
```

---

## Troubleshooting

### "command not found: supabase"
Run this first:
```bash
export PATH="$HOME/bin:$PATH"
```

Or add to `~/.zshrc` permanently:
```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### "Project not linked"
Make sure you:
1. Are in the project directory: `cd /Users/tommasolm/Desktop/lawckin-main`
2. Ran `supabase link --project-ref YOUR_PROJECT_REF`
3. Entered the correct database password

### Migration errors
- Check that your database password is correct
- Verify project reference ID is correct
- Some migrations might need manual review

---

## Next Steps

1. ✅ **Login**: `supabase login`
2. ⬜ **Create project**: In Supabase dashboard
3. ⬜ **Link project**: `supabase link --project-ref YOUR_PROJECT_REF`
4. ⬜ **Push migrations**: `supabase db push`
5. ⬜ **Update .env**: Add new project credentials
6. ⬜ **Import data**: `npm run import-data`
7. ⬜ **Regenerate types**: `supabase gen types ...`

---

## You're Ready!

Start with Step 1: `supabase login`

Good luck! 🚀

