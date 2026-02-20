# Your Next Steps - Action Plan

## ✅ What You've Completed

- [x] Fixed migration SQL (DROP FUNCTION added)
- [x] Added `SYNC_CRON_KEY` to Supabase Dashboard
- [x] Deployed all Edge Functions:
  - [x] `google-calendar-auth`
  - [x] `sync-calendar`
  - [x] `scheduled-sync-calendar`
- [x] Understand environment variable setup

---

## 📋 Next Steps (In Order)

### Step 1: Apply the Fixed Migration ⚠️ **CRITICAL**

The migration needs to be applied so slot counts work correctly.

**Run this command:**
```bash
cd /Users/tommasolm/Desktop/lawckin-main
export PATH="$HOME/bin:$PATH"
supabase db push
```

**Expected result:**
- Migration `20251106010000_improve_slot_regeneration_with_count.sql` should apply successfully
- No errors about "cannot change return type"

**If you get an error:**
- Make sure you pulled the latest code from GitHub
- The migration should have `DROP FUNCTION IF EXISTS` at the top

---

### Step 2: Get Google OAuth Credentials 🔐

You need to create OAuth 2.0 credentials in Google Cloud Console.

**Quick steps:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable **Google Calendar API**
3. Create **OAuth consent screen** (External type)
4. Create **OAuth 2.0 Client ID** (Web application type)
5. Add redirect URI: `https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback`
6. Copy **Client ID** and **Client Secret**

**Full guide:** See `GOOGLE_CALENDAR_OAUTH_SETUP.md` for detailed instructions

---

### Step 3: Add OAuth Credentials to Supabase Dashboard

1. Go to **Supabase Dashboard** → **Edge Functions** → **Settings**
2. Add environment variable:
   - **Name:** `GOOGLE_CLIENT_ID`
   - **Value:** [paste your Client ID]
3. Add environment variable:
   - **Name:** `GOOGLE_CLIENT_SECRET`
   - **Value:** [paste your Client Secret]
4. Click **Save** for each

**Important:** These are secrets - never add to `.env` file!

---

### Step 4: Test Calendar Connection ✅

After adding the credentials, test that everything works:

1. **Refresh your browser** (to clear any cached errors)
2. Go to **Lawyer Dashboard** → **Calendar Integration**
3. Click **"Connect Google Calendar"**
4. **Expected:**
   - You should be redirected to Google OAuth consent screen
   - After authorizing, you should be redirected back
   - Connection should show as "Connected"

**If you get errors:**
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are set in Supabase Dashboard
- Verify redirect URI matches exactly in Google Cloud Console
- Check browser console for specific error messages

---

### Step 5: Test Manual Sync 🔄

After connecting your calendar:

1. In **Calendar Integration** section, click **"Sync Now"**
2. **Expected:**
   - Toast notification: "Synced 1 calendar(s)"
   - If slots were removed: "X time slots were removed because they conflict..."
   - Connection shows "Last synced: [timestamp]"

**If slot counts show zero:**
- Verify migration was applied (Step 1)
- Check that `regenerate_slots_excluding_conflicts` function returns counts
- Test in SQL Editor:
  ```sql
  SELECT * FROM regenerate_slots_excluding_conflicts(
    (SELECT id FROM lawyer_profiles LIMIT 1)
  );
  ```

---

### Step 6: (Optional) Set Up Scheduled Syncs ⏰

If you want automatic hourly calendar syncs:

1. Follow `SCHEDULER_SETUP.md` guide
2. Set up cron-job.org (or similar service)
3. Use your `SYNC_CRON_KEY` in the cron configuration

**This is optional** - manual syncs work fine for now.

---

## 🧪 Testing Checklist

After completing the steps above, verify:

- [ ] Migration applied successfully
- [ ] `GOOGLE_CLIENT_ID` added to Supabase Dashboard
- [ ] `GOOGLE_CLIENT_SECRET` added to Supabase Dashboard
- [ ] Can connect Google Calendar (no 404 errors)
- [ ] OAuth flow completes successfully
- [ ] Calendar connection shows as "Connected"
- [ ] Manual sync works and shows slot counts
- [ ] Slots refresh automatically in booking UI after sync

---

## 🐛 Troubleshooting

### Migration fails
- **Error:** "cannot change return type"
- **Fix:** Make sure migration has `DROP FUNCTION IF EXISTS` at the top
- **Check:** Pull latest code from GitHub

### 404 error when connecting calendar
- **Problem:** Edge Functions not deployed
- **Fix:** Already done! Functions are deployed ✅

### "Missing Google OAuth credentials"
- **Problem:** `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` not set
- **Fix:** Add them to Supabase Dashboard → Edge Functions → Settings

### "redirect_uri_mismatch"
- **Problem:** Redirect URI in Google Cloud Console doesn't match
- **Fix:** Must be exactly: `https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback`

### Slot counts show zero
- **Problem:** Migration not applied or function not working
- **Fix:** 
  1. Apply migration (Step 1)
  2. Test function in SQL Editor
  3. Check Edge Functions logs for errors

---

## 📚 Reference Guides

- **Google OAuth Setup:** `GOOGLE_CALENDAR_OAUTH_SETUP.md`
- **Scheduler Setup:** `SCHEDULER_SETUP.md`
- **Environment Variables:** `ENV_VARIABLES_GUIDE.md`
- **Deploy Functions:** `DEPLOY_EDGE_FUNCTIONS.md`

---

## 🎯 Priority Order

1. **HIGH:** Apply migration (Step 1) - Required for slot counts
2. **HIGH:** Add OAuth credentials (Steps 2-3) - Required for calendar connection
3. **MEDIUM:** Test connection and sync (Steps 4-5) - Verify everything works
4. **LOW:** Set up scheduled syncs (Step 6) - Optional automation

---

## Quick Command Reference

```bash
# Apply migration
cd /Users/tommasolm/Desktop/lawckin-main
export PATH="$HOME/bin:$PATH"
supabase db push

# Check migration status
supabase migration list

# View function logs
supabase functions logs google-calendar-auth
supabase functions logs sync-calendar
```

---

## Summary

**Immediate actions:**
1. ✅ Apply migration: `supabase db push`
2. ✅ Get Google OAuth credentials from Google Cloud Console
3. ✅ Add credentials to Supabase Dashboard
4. ✅ Test calendar connection

Once these are done, your calendar integration will be fully functional! 🎉

