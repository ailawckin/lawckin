# Supabase CLI Setup Guide

## Installation Options

### Option 1: Update Command Line Tools (Recommended for Homebrew)

1. **Update Command Line Tools:**
   ```bash
   sudo rm -rf /Library/Developer/CommandLineTools
   sudo xcode-select --install
   ```
   
   Or update via **System Settings** → **Software Update**

2. **Then install Supabase CLI:**
   ```bash
   brew install supabase/tap/supabase
   ```

### Option 2: Direct Download (No Homebrew needed)

1. **Download the binary:**
   ```bash
   # For macOS (Apple Silicon)
   curl -L https://github.com/supabase/cli/releases/latest/download/supabase_darwin_arm64.tar.gz -o supabase.tar.gz
   
   # For macOS (Intel)
   curl -L https://github.com/supabase/cli/releases/latest/download/supabase_darwin_amd64.tar.gz -o supabase.tar.gz
   ```

2. **Extract and install:**
   ```bash
   tar -xzf supabase.tar.gz
   sudo mv supabase /usr/local/bin/
   rm supabase.tar.gz
   ```

3. **Verify installation:**
   ```bash
   supabase --version
   ```

### Option 3: Use SQL Editor Instead (Easiest!)

If CLI setup is too complicated, you can use the Supabase Dashboard SQL Editor instead:
- No installation needed
- Just copy/paste migration files
- Works just as well

---

## After Installation: Using Supabase CLI

Once installed, follow these steps:

### Step 1: Login to Supabase

```bash
supabase login
```

This will open your browser to authenticate.

### Step 2: Link Your Project

After creating your new Supabase project, get the project reference ID:
- It's in your project URL: `https://supabase.com/dashboard/project/YOUR_PROJECT_REF`
- Or in Settings → General → Reference ID

Then link:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

You'll need:
- Database password (the one you set when creating the project)
- Connection string (optional, can be auto-detected)

### Step 3: Push All Migrations

From your project root:
```bash
cd /Users/tommasolm/Desktop/lawckin-main
supabase db push
```

This will apply all migrations in `supabase/migrations/` folder automatically!

### Step 4: Verify Migrations Applied

```bash
supabase db diff
```

---

## Quick Command Reference

```bash
# Check if linked
supabase status

# View migration history
supabase migration list

# Generate TypeScript types
supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/integrations/supabase/types.ts

# Pull remote schema (if needed)
supabase db pull
```

---

## Troubleshooting

### "Command not found" after installation
- Make sure `/usr/local/bin` is in your PATH
- Try: `export PATH="/usr/local/bin:$PATH"`

### "Project not linked"
- Make sure you're in the project directory
- Run `supabase link` again

### Migration errors
- Check that you're using the correct project reference ID
- Verify database password is correct
- Some migrations might need to be run manually if they have dependencies

---

## Recommendation

**If you want to get started quickly:** Use SQL Editor (Option 3)
- It's faster and doesn't require installation
- Just copy/paste migration files one by one

**If you want automation:** Use CLI (Options 1 or 2)
- Better for ongoing development
- Can regenerate types automatically
- Useful for managing multiple environments

---

## Next Steps After Setup

Once CLI is working:

1. ✅ Login: `supabase login`
2. ✅ Link project: `supabase link --project-ref YOUR_PROJECT_REF`
3. ✅ Push migrations: `supabase db push`
4. ✅ Import data: `npm run import-data`
5. ✅ Regenerate types: `supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/integrations/supabase/types.ts`

Good luck! 🚀

