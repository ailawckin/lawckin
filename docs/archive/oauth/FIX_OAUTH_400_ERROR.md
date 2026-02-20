# Fix OAuth 400 Error

## What the 400 Error Means

A **400 Bad Request** error from Google OAuth usually means:
- Redirect URI doesn't match what's configured in Google Cloud Console
- OAuth consent screen not properly set up
- Missing or incorrect scopes
- Invalid OAuth client credentials

---

## Step-by-Step Fix

### Fix 1: Verify Redirect URI Matches Exactly

**In Google Cloud Console:**
1. Go to **APIs & Services** → **Credentials**
2. Click on your **OAuth 2.0 Client ID**
3. Check **Authorized redirect URIs** section
4. **Must match exactly:**
   ```
   https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
   ```

**Common mistakes:**
- ❌ Missing `?action=callback`
- ❌ Wrong project reference ID
- ❌ `http://` instead of `https://`
- ❌ Extra spaces or trailing slashes

**Fix:** Edit the OAuth client and update the redirect URI to match exactly.

---

### Fix 2: Check OAuth Consent Screen

**In Google Cloud Console:**
1. Go to **APIs & Services** → **OAuth consent screen**
2. Verify:
   - ✅ **App name** is set
   - ✅ **User support email** is set
   - ✅ **Developer contact** is set
   - ✅ **Scopes** include:
     - `https://www.googleapis.com/auth/calendar.readonly`
     - `https://www.googleapis.com/auth/calendar.events`
   - ✅ **Test users** includes your email (if in testing mode)

**If not set up:** Complete the OAuth consent screen configuration.

---

### Fix 3: Verify Environment Variables

**In Supabase Dashboard:**
1. Go to **Edge Functions** → **Settings**
2. Check **Environment Variables**:
   - ✅ `GOOGLE_CLIENT_ID` - Should match your OAuth Client ID from Google
   - ✅ `GOOGLE_CLIENT_SECRET` - Should match your OAuth Client Secret from Google

**To verify:**
- Go to Google Cloud Console → Credentials
- Compare the Client ID and Secret with what's in Supabase Dashboard
- They must match exactly (no extra spaces, no typos)

---

### Fix 4: Check Google Calendar API is Enabled

**In Google Cloud Console:**
1. Go to **APIs & Services** → **Library**
2. Search for **"Google Calendar API"**
3. Verify it shows **"Enabled"** (not "Enable")

**If not enabled:** Click on it and click **"Enable"**

---

### Fix 5: Verify OAuth Client Type

**In Google Cloud Console:**
1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Verify **Application type** is **"Web application"** (not "Desktop app" or "iOS")

---

## Debugging Steps

### Step 1: Check Edge Functions Logs

**In Supabase Dashboard:**
1. Go to **Edge Functions** → **google-calendar-auth**
2. Click **"Logs"** tab
3. Try connecting calendar again
4. Look for error messages in the logs

**Common log errors:**
- `redirect_uri_mismatch` → Fix 1 (redirect URI)
- `invalid_client` → Fix 3 (credentials)
- `access_denied` → Fix 2 (consent screen)

### Step 2: Check Browser Console

**In your browser:**
1. Open DevTools (F12)
2. Go to **Console** tab
3. Try connecting calendar
4. Look for error messages

**Common console errors:**
- `400 Bad Request` → Usually redirect URI or credentials
- `CORS error` → Edge Function not deployed (but we verified it is)
- `Network error` → Check Supabase Dashboard for function status

### Step 3: Test OAuth URL Manually

The OAuth URL should look like:
```
https://accounts.google.com/o/oauth2/auth?
  client_id=YOUR_CLIENT_ID&
  redirect_uri=https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback&
  response_type=code&
  scope=https://www.googleapis.com/auth/calendar.readonly+https://www.googleapis.com/auth/calendar.events&
  access_type=offline&
  prompt=consent
```

**Check:**
- `client_id` matches your `GOOGLE_CLIENT_ID`
- `redirect_uri` matches exactly what's in Google Cloud Console
- `scope` includes calendar scopes

---

## Most Common Causes (In Order)

### 1. Redirect URI Mismatch (90% of cases)
**Symptom:** 400 error immediately
**Fix:** Make sure redirect URI in Google Cloud Console matches exactly:
```
https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
```

### 2. OAuth Consent Screen Not Configured
**Symptom:** 400 error or "Access blocked"
**Fix:** Complete OAuth consent screen setup in Google Cloud Console

### 3. Wrong Credentials
**Symptom:** 400 error or "invalid_client"
**Fix:** Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` match Google Cloud Console

### 4. Google Calendar API Not Enabled
**Symptom:** 400 error
**Fix:** Enable Google Calendar API in Google Cloud Console

---

## Quick Verification Checklist

- [ ] Redirect URI in Google Cloud Console matches exactly (including `?action=callback`)
- [ ] OAuth consent screen is configured
- [ ] Scopes include calendar.readonly and calendar.events
- [ ] Test user email is added (if in testing mode)
- [ ] Google Calendar API is enabled
- [ ] OAuth Client ID type is "Web application"
- [ ] `GOOGLE_CLIENT_ID` in Supabase matches Google Cloud Console
- [ ] `GOOGLE_CLIENT_SECRET` in Supabase matches Google Cloud Console

---

## Step-by-Step Re-Check

### 1. Double-Check Redirect URI

**In Google Cloud Console:**
```
APIs & Services → Credentials → [Your OAuth Client] → Authorized redirect URIs
```

**Must be exactly:**
```
https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
```

**Copy-paste this exactly** - no extra spaces, no trailing slashes.

### 2. Verify Credentials Match

**Compare these two places:**

**Google Cloud Console:**
- APIs & Services → Credentials → [Your OAuth Client]
- Copy Client ID and Client Secret

**Supabase Dashboard:**
- Edge Functions → Settings → Environment Variables
- Compare `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

**They must match exactly!**

### 3. Check OAuth Consent Screen

**In Google Cloud Console:**
- APIs & Services → OAuth consent screen
- Verify all required fields are filled
- Verify scopes are added
- Verify your email is in test users (if testing)

---

## If Still Not Working

### Get More Details

**Check Edge Functions logs:**
1. Supabase Dashboard → Edge Functions → google-calendar-auth → Logs
2. Try connecting again
3. Look for the exact error message

**Check browser network tab:**
1. DevTools (F12) → Network tab
2. Try connecting calendar
3. Look for the failed request
4. Check the response body for error details

**Common error messages:**
- `redirect_uri_mismatch` → Fix redirect URI
- `invalid_client` → Fix credentials
- `access_denied` → Fix consent screen
- `invalid_scope` → Fix scopes

---

## Test After Fixes

1. **Clear browser cache** (or use incognito mode)
2. **Try connecting calendar again**
3. **Check for specific error messages** in:
   - Browser console
   - Edge Functions logs
   - Google OAuth error page

---

## Summary

**Most likely cause:** Redirect URI mismatch

**Quick fix:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth Client ID
3. Update redirect URI to match exactly:
   ```
   https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
   ```
4. Save
5. Try again

If that doesn't work, check the other fixes above!

