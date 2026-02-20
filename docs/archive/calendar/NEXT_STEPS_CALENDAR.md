# Next Steps: Calendar System Fixes

## Immediate Actions Required

### 1. Apply the Fixed Migration ⚠️ **CRITICAL**

The migration `20251106010000_improve_slot_regeneration_with_count.sql` has been fixed and needs to be applied to your database.

**Option A: Using Supabase CLI (Recommended)**
```bash
# Make sure you're in the project directory
cd /Users/tommasolm/Desktop/lawckin-main

# Push the migration
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase Dashboard → SQL Editor
2. Open the file: `supabase/migrations/20251106010000_improve_slot_regeneration_with_count.sql`
3. Copy the entire SQL content
4. Paste into SQL Editor and click "Run"

**Verify the migration:**
```sql
-- Test that the function returns counts correctly
SELECT * FROM regenerate_slots_excluding_conflicts('your-lawyer-id-here');
-- Should return: slots_removed | slots_added
```

---

### 2. Set Up SYNC_CRON_KEY Environment Variable 🔐

**Generate a secure key:**
```bash
# Option 1: Using OpenSSL
openssl rand -hex 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Option 3: Using Python
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Add to Supabase Dashboard:**
1. Go to Supabase Dashboard → Edge Functions → Settings
2. Find "Environment Variables" section
3. Add new variable:
   - **Name:** `SYNC_CRON_KEY`
   - **Value:** (paste the generated key)
4. Click "Save"

**Important:** 
- Keep this key secret - never commit it to git
- Use the same key in your cron service configuration
- You can rotate it later if needed

---

### 3. Test the Fixed Migration ✅

After applying the migration, test that slot counts work:

```sql
-- 1. Check if function exists and returns correct type
SELECT proname, prorettype::regtype 
FROM pg_proc 
WHERE proname = 'regenerate_slots_excluding_conflicts';

-- Should show: TABLE(slots_removed integer, slots_added integer)

-- 2. Test with a real lawyer ID
SELECT * FROM regenerate_slots_excluding_conflicts(
  (SELECT id FROM lawyer_profiles LIMIT 1)
);
```

**In the UI:**
1. Go to Lawyer Dashboard → Calendar Integration
2. Click "Sync Now"
3. **Expected:** Toast should show actual slot counts (not zeros)
   - Example: "Synced 1 calendar(s). Removed 3 conflicting slots."

---

### 4. (Optional) Set Up Scheduled Syncs ⏰

If you want automatic hourly calendar syncs:

**Quick Setup with cron-job.org:**
1. Sign up at [cron-job.org](https://cron-job.org) (free)
2. Create new cron job:
   - **URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-sync-calendar`
   - **Schedule:** `0 * * * *` (every hour)
   - **Method:** POST
   - **Header:** `Authorization: Bearer YOUR_SYNC_CRON_KEY`
3. Test by clicking "Run now"

**See `SCHEDULER_SETUP.md` for detailed instructions.**

---

### 5. Regenerate TypeScript Types (If Needed) 🔄

If you're using TypeScript and want updated types:

```bash
# Using Supabase CLI
supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts

# Or use the script if available
npm run generate-types
```

---

## Testing Checklist

After completing the steps above, verify:

- [ ] Migration applied successfully (no errors in SQL Editor)
- [ ] `regenerate_slots_excluding_conflicts` returns counts
- [ ] `SYNC_CRON_KEY` is set in Edge Functions settings
- [ ] Manual sync shows slot counts in toast notifications
- [ ] Slots refresh automatically in booking UI after sync
- [ ] (Optional) Scheduled sync runs successfully

---

## Troubleshooting

### Migration Fails
- **Error:** "column availability_date does not exist"
  - **Fix:** Make sure you're using the **fixed** migration file (not the old one)
  - **Check:** File should use `DATE(start_time AT TIME ZONE tz)`

### Slot Counts Still Show Zero
- **Check:** Migration was applied successfully
- **Verify:** Function returns counts in SQL Editor
- **Test:** Run manual sync and check browser console for errors

### SYNC_CRON_KEY Not Working
- **Check:** Key is set in Supabase Dashboard → Edge Functions → Settings
- **Verify:** No extra spaces or newlines in the key
- **Test:** Call the function manually with curl to verify

### Scheduled Sync Not Running
- **Check:** Cron service is configured correctly
- **Verify:** `SYNC_CRON_KEY` matches in both places
- **Review:** Supabase Edge Functions logs for errors

---

## What's Fixed

✅ **Migration SQL** - Now uses correct column references and syntax  
✅ **Slot Counts** - Function returns actual counts (not void)  
✅ **Security** - Dedicated `SYNC_CRON_KEY` for scheduled syncs  
✅ **Documentation** - Complete scheduler setup guide  
✅ **UI Feedback** - Toast notifications show slot counts  
✅ **Auto-Refresh** - Booking UI updates automatically after sync  

---

## Priority Order

1. **HIGH:** Apply migration (required for slot counts to work)
2. **HIGH:** Set `SYNC_CRON_KEY` (required for scheduled syncs)
3. **MEDIUM:** Test manual sync and verify slot counts
4. **LOW:** Set up scheduled syncs (optional, can be done later)

---

## Need Help?

- Check `SCHEDULER_SETUP.md` for scheduler configuration
- Review `CALENDAR_IMPROVEMENTS_COMPLETE.md` for all changes
- Check Supabase Dashboard → Edge Functions → Logs for errors

