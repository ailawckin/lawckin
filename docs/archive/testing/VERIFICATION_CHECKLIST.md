# Verification Checklist - Is Everything Working?

## Quick Tests You Can Do Right Now

### ✅ Test 1: Check Migration Applied

**In Supabase Dashboard SQL Editor, run:**
```sql
-- Check if function returns counts (not void)
SELECT proname, pg_get_function_result(oid) as return_type
FROM pg_proc
WHERE proname = 'regenerate_slots_excluding_conflicts';
```

**Expected:** Should show `TABLE(slots_removed integer, slots_added integer)`

**If it shows `void`:** Migration wasn't applied - run `supabase db push`

---

### ✅ Test 2: Check Edge Functions Are Deployed

**In Supabase Dashboard:**
1. Go to **Edge Functions** (left sidebar)
2. You should see these functions listed:
   - ✅ `google-calendar-auth`
   - ✅ `sync-calendar`
   - ✅ `scheduled-sync-calendar`

**If missing:** Functions aren't deployed - run:
```bash
supabase functions deploy google-calendar-auth
supabase functions deploy sync-calendar
```

---

### ✅ Test 3: Check Environment Variables

**In Supabase Dashboard:**
1. Go to **Edge Functions** → **Settings**
2. Check **Environment Variables** section
3. You should see:
   - ✅ `GOOGLE_CLIENT_ID` (should have a value)
   - ✅ `GOOGLE_CLIENT_SECRET` (should have a value)
   - ✅ `SYNC_CRON_KEY` (should have a value)

**If missing:** Add them in Edge Functions → Settings

---

### ✅ Test 4: Test Calendar Connection

**In Your App:**
1. Go to **Lawyer Dashboard** → **Calendar Integration**
2. Click **"Connect Google Calendar"**
3. **Expected flow:**
   - ✅ Redirects to Google OAuth consent screen
   - ✅ Shows "Lawckin wants to access your Google Calendar"
   - ✅ After clicking "Allow", redirects back to your app
   - ✅ Shows "Google Calendar connected successfully!" toast
   - ✅ Connection shows as "Connected" with green badge

**If you get errors:**
- **404 error:** Edge Functions not deployed (see Test 2)
- **"Missing Google OAuth credentials":** Environment variables not set (see Test 3)
- **"redirect_uri_mismatch":** Redirect URI in Google Cloud Console doesn't match

---

### ✅ Test 5: Test Manual Sync

**After connecting calendar:**
1. In **Calendar Integration** section
2. Click **"Sync Now"** button
3. **Expected:**
   - ✅ Button shows "Syncing..." with spinner
   - ✅ Toast notification appears: "Synced 1 calendar(s)"
   - ✅ If slots were removed: "X time slots were removed because they conflict..."
   - ✅ Connection shows "Last synced: [timestamp]"

**If slot counts show zero:**
- Migration might not be applied (see Test 1)
- Check browser console for errors

---

### ✅ Test 6: Test Slot Regeneration

**In Supabase Dashboard SQL Editor:**
```sql
-- Test the function with a real lawyer ID
SELECT * FROM regenerate_slots_excluding_conflicts(
  (SELECT id FROM lawyer_profiles LIMIT 1)
);
```

**Expected:** Returns a row with `slots_removed` and `slots_added` columns (both integers)

**If error:** Function doesn't exist or migration wasn't applied

---

## Browser Console Check

**Open browser DevTools (F12) and check for errors:**

1. **Go to Lawyer Dashboard → Calendar Integration**
2. **Open Console tab**
3. **Click "Connect Google Calendar"**
4. **Check for errors:**
   - ❌ `404` errors → Functions not deployed
   - ❌ `CORS` errors → Functions not deployed or misconfigured
   - ❌ `Missing Google OAuth credentials` → Environment variables not set
   - ✅ No errors → Good!

---

## Edge Functions Logs Check

**In Supabase Dashboard:**
1. Go to **Edge Functions** → **google-calendar-auth**
2. Click **"Logs"** tab
3. **Try connecting calendar again**
4. **Check logs for:**
   - ✅ Successful requests (200 status)
   - ❌ Error messages (will show what's wrong)

**Common log errors:**
- `Missing Google OAuth credentials` → Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `redirect_uri_mismatch` → Check redirect URI in Google Cloud Console
- `Unauthorized` → User not authenticated or lawyer profile missing

---

## Quick Verification Commands

**Run these in terminal:**

```bash
# Check if project is linked
cd /Users/tommasolm/Desktop/lawckin-main
export PATH="$HOME/bin:$PATH"
supabase status

# Check migration status
supabase migration list

# View function logs
supabase functions logs google-calendar-auth --limit 10
supabase functions logs sync-calendar --limit 10
```

---

## Complete Checklist

### Database
- [ ] Migration `20251106010000_improve_slot_regeneration_with_count.sql` applied
- [ ] Function `regenerate_slots_excluding_conflicts` returns counts (not void)
- [ ] Can test function in SQL Editor

### Edge Functions
- [ ] `google-calendar-auth` function deployed
- [ ] `sync-calendar` function deployed
- [ ] `scheduled-sync-calendar` function deployed (optional)

### Environment Variables
- [ ] `GOOGLE_CLIENT_ID` set in Supabase Dashboard
- [ ] `GOOGLE_CLIENT_SECRET` set in Supabase Dashboard
- [ ] `SYNC_CRON_KEY` set in Supabase Dashboard

### Google Cloud Console
- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URI added correctly

### Functionality
- [ ] Can connect Google Calendar (no 404 errors)
- [ ] OAuth flow completes successfully
- [ ] Calendar connection shows as "Connected"
- [ ] Manual sync works
- [ ] Slot counts appear in toast notifications
- [ ] No errors in browser console
- [ ] No errors in Edge Functions logs

---

## If Something Doesn't Work

### Migration Issues
- **Error:** "cannot change return type"
- **Fix:** Make sure migration has `DROP FUNCTION IF EXISTS` at the top
- **Command:** `supabase db push`

### Function Not Found (404)
- **Error:** "Failed to send a request to the Edge Function"
- **Fix:** Deploy the function
- **Command:** `supabase functions deploy google-calendar-auth`

### Missing Credentials
- **Error:** "Missing Google OAuth credentials"
- **Fix:** Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` to Supabase Dashboard

### Redirect URI Mismatch
- **Error:** "redirect_uri_mismatch"
- **Fix:** Check redirect URI in Google Cloud Console matches exactly:
  ```
  https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
  ```

---

## Success Indicators

✅ **Everything works if:**
- You can connect Google Calendar without errors
- OAuth flow completes and redirects back
- Connection shows as "Connected"
- Manual sync works and shows slot counts
- No errors in browser console or Edge Functions logs

🎉 **You're all set!**

