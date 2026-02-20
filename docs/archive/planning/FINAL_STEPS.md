# Final Steps - Almost Done! 🎉

## ✅ COMPLETED
- [x] Exported all data (173 rows)
- [x] Created Supabase project
- [x] Linked project with CLI
- [x] Applied all migrations (including street_address!)

## 📋 REMAINING STEPS

### Step 1: Get Your New Project Credentials

1. Go to your Supabase Dashboard
2. Navigate to **Settings** → **API**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (the long JWT token)

### Step 2: Update Your .env File

1. Open `.env` file in your project root
2. Update it like this:

```env
# ============================================
# OLD LOVABLE PROJECT (keep for reference)
# ============================================
# VITE_SUPABASE_URL=https://zrnklcpgumwcswyxnumk.supabase.co
# VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ============================================
# NEW PROJECT (active - use these!)
# ============================================
VITE_SUPABASE_URL=https://your-new-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-new-anon-key-here

# Google Maps API (if you added it)
VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
```

**Important:** Replace the values with your actual new project credentials!

### Step 3: Import Your Data

```bash
npm run import-data
```

This will import all 173 rows from `exported-data.json` to your new project.

### Step 4: Verify Data Import

1. Go to Supabase Dashboard → **Table Editor**
2. Check these tables should have data:
   - `practice_areas` → 6 rows
   - `lawyer_profiles` → 3 rows
   - `lawyer_expertise` → 5 rows
   - `lawyer_specializations` → 6 rows
   - `time_slots` → 149 rows
   - etc.

### Step 5: Regenerate TypeScript Types

Get your project reference ID (from the dashboard URL or Settings → General):

```bash
export PATH="$HOME/bin:$PATH"
supabase gen types typescript --project-id YOUR_PROJECT_REF --schema public > src/integrations/supabase/types.ts
```

Or if you know your project reference ID, I can help you run it.

### Step 6: Test Your App

```bash
npm run dev
```

Then:
- Try logging in
- Check if your data appears
- Test the lawyer dashboard
- Verify the street_address field works

---

## 🎯 Quick Checklist

- [ ] Updated `.env` with new project credentials
- [ ] Imported data: `npm run import-data`
- [ ] Verified data in Supabase Dashboard
- [ ] Regenerated TypeScript types
- [ ] Tested app with `npm run dev`

---

## 🆘 Troubleshooting

### "Could not find column street_address"
- ✅ Already fixed! The migration was applied
- Just regenerate types: `supabase gen types ...`

### "No data showing"
- Check that `npm run import-data` completed successfully
- Verify data in Supabase Dashboard → Table Editor
- Check browser console for errors

### "Authentication errors"
- Verify your `.env` file has the correct new project credentials
- Restart dev server after updating `.env`

---

## 🎉 You're Almost There!

Just a few more steps and you'll have:
- ✅ Full control of your database
- ✅ All your data migrated
- ✅ All migrations applied
- ✅ Ready to continue development

Let me know when you've updated `.env` and I can help with the data import! 🚀

