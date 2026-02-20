# Quick Fix for 400 Error

## Most Likely Cause: Redirect URI Mismatch

The 400 error is almost always because the redirect URI in Google Cloud Console doesn't match what your app is sending.

---

## Quick Fix (90% of cases)

### Step 1: Check Your Redirect URI in Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Click on your **OAuth 2.0 Client ID**
4. Look at **Authorized redirect URIs**

**It MUST be exactly:**
```
https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
```

### Step 2: Common Mistakes to Check

- ❌ Missing `?action=callback` at the end
- ❌ Wrong project reference ID (should be `wulalgwsehjjiczcatpo`)
- ❌ `http://` instead of `https://`
- ❌ Extra spaces or characters
- ❌ Trailing slash: `/functions/v1/google-calendar-auth/?action=callback` (wrong - no slash before `?`)

### Step 3: Fix It

1. **Edit your OAuth Client ID** in Google Cloud Console
2. **Delete the old redirect URI** if it's wrong
3. **Add this exact URI:**
   ```
   https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
   ```
4. **Copy-paste it** (don't type it manually to avoid typos)
5. **Save**
6. **Wait 1-2 minutes** for changes to propagate
7. **Try connecting again**

---

## Other Common Causes

### Cause 2: OAuth Consent Screen Not Set Up

**Check:**
1. Google Cloud Console → **APIs & Services** → **OAuth consent screen**
2. Make sure:
   - App name is filled
   - User support email is filled
   - Scopes are added (calendar.readonly and calendar.events)
   - Your email is in "Test users" (if in testing mode)

**Fix:** Complete the OAuth consent screen setup.

### Cause 3: Wrong Credentials

**Check:**
1. Google Cloud Console → Credentials → Your OAuth Client
2. Copy the **Client ID** and **Client Secret**
3. Supabase Dashboard → Edge Functions → Settings
4. Compare:
   - `GOOGLE_CLIENT_ID` should match Client ID
   - `GOOGLE_CLIENT_SECRET` should match Client Secret

**Fix:** Update them in Supabase Dashboard if they don't match.

### Cause 4: Google Calendar API Not Enabled

**Check:**
1. Google Cloud Console → **APIs & Services** → **Library**
2. Search for **"Google Calendar API"**
3. Should show **"Enabled"**

**Fix:** Click on it and click **"Enable"** if not enabled.

---

## Step-by-Step Verification

### 1. Verify Redirect URI (Most Important!)

**In Google Cloud Console:**
```
APIs & Services → Credentials → [Your OAuth Client] → Authorized redirect URIs
```

**Must be exactly this (copy-paste it):**
```
https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
```

**Checklist:**
- [ ] Starts with `https://` (not `http://`)
- [ ] Project ID is `wulalgwsehjjiczcatpo`
- [ ] Has `/functions/v1/google-calendar-auth`
- [ ] Has `?action=callback` at the end
- [ ] No trailing slash before `?`
- [ ] No extra spaces

### 2. Verify OAuth Consent Screen

**In Google Cloud Console:**
```
APIs & Services → OAuth consent screen
```

**Checklist:**
- [ ] App name is set
- [ ] User support email is set
- [ ] Scopes include calendar scopes
- [ ] Your email is in test users (if testing)

### 3. Verify Credentials Match

**Compare:**
- Google Cloud Console Client ID = Supabase `GOOGLE_CLIENT_ID`
- Google Cloud Console Client Secret = Supabase `GOOGLE_CLIENT_SECRET`

---

## Test After Fixing

1. **Wait 1-2 minutes** after making changes in Google Cloud Console
2. **Clear browser cache** or use incognito mode
3. **Try connecting calendar again**
4. **Check browser console** (F12) for specific error messages

---

## If Still Getting 400 Error

### Get More Details

**Check Edge Functions logs:**
1. Supabase Dashboard → Edge Functions → google-calendar-auth
2. Click **"Logs"** tab
3. Try connecting again
4. Look for error messages

**Check browser console:**
1. Open DevTools (F12)
2. Console tab
3. Try connecting
4. Look for error messages

**Common error messages:**
- `redirect_uri_mismatch` → Redirect URI doesn't match
- `invalid_client` → Credentials are wrong
- `access_denied` → Consent screen not set up

---

## Most Common Fix

**99% of the time, it's the redirect URI.**

**Do this:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth Client
3. Make sure redirect URI is **exactly:**
   ```
   https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
   ```
4. Save and wait 1-2 minutes
5. Try again

That should fix it! 🎯

