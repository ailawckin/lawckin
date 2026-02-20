# Google Calendar OAuth Setup

## Overview
To connect Google Calendar, you need OAuth 2.0 credentials from Google Cloud Console. These are different from the Google Maps API key.

---

## Step 1: Create OAuth 2.0 Credentials in Google Cloud Console

### 1.1 Go to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project (or create a new one)

### 1.2 Enable Google Calendar API

1. Go to **APIs & Services** → **Library**
2. Search for **"Google Calendar API"**
3. Click on it and click **Enable**
4. Wait for activation (usually instant)

### 1.3 Create OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have a Google Workspace account)
3. Fill in required information:
   - **App name:** `Lawckin` (or your app name)
   - **User support email:** Your email
   - **Developer contact information:** Your email
4. Click **Save and Continue**
5. **Scopes:** Click **Add or Remove Scopes**
   - Search for and add:
     - `https://www.googleapis.com/auth/calendar.readonly` (Read calendar events)
     - `https://www.googleapis.com/auth/calendar.events` (Create/edit events)
   - Click **Update** then **Save and Continue**
6. **Test users:** Add your email (and any test user emails)
   - Click **Save and Continue**
7. **Summary:** Review and click **Back to Dashboard**

### 1.4 Create OAuth 2.0 Client ID

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. **Application type:** Select **Web application**
4. **Name:** `Lawckin Calendar OAuth` (or any name)
5. **Authorized redirect URIs:** Add:
   ```
   https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
   ```
   Replace `wulalgwsehjjiczcatpo` with your Supabase project reference ID
6. Click **Create**
7. **IMPORTANT:** Copy both values:
   - **Client ID** (this is your `GOOGLE_CLIENT_ID`)
   - **Client secret** (this is your `GOOGLE_CLIENT_SECRET`)
   - ⚠️ You won't be able to see the secret again, so save it now!

---

## Step 2: Add to Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project: `wulalgwsehjjiczcatpo`

2. **Navigate to Edge Functions Settings**
   - Click **Edge Functions** in left sidebar
   - Click **Settings** (gear icon)

3. **Add Environment Variables**
   - Find **Environment Variables** or **Secrets** section
   - Click **Add new secret** or **Add variable**

4. **Add GOOGLE_CLIENT_ID**
   - **Name:** `GOOGLE_CLIENT_ID`
   - **Value:** Paste the Client ID from Google Cloud Console
   - Click **Save**

5. **Add GOOGLE_CLIENT_SECRET**
   - **Name:** `GOOGLE_CLIENT_SECRET`
   - **Value:** Paste the Client secret from Google Cloud Console
   - Click **Save**

---

## Step 3: Verify Setup

After adding the credentials:

1. **Check in Supabase Dashboard:**
   - Go to Edge Functions → Settings
   - Verify both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are listed

2. **Test Calendar Connection:**
   - Go to Lawyer Dashboard → Calendar Integration
   - Click "Connect Google Calendar"
   - You should be redirected to Google OAuth consent screen
   - After authorizing, you should be redirected back to your app

---

## Important Notes

### Redirect URI Format
The redirect URI must match exactly:
```
https://YOUR_PROJECT_REF.supabase.co/functions/v1/google-calendar-auth?action=callback
```

Replace `YOUR_PROJECT_REF` with your actual Supabase project reference ID.

### OAuth Consent Screen
- **External apps** require verification if you want to publish (for now, test mode is fine)
- **Test users** can use the app without verification
- Add all test user emails in OAuth consent screen → Test users

### Security
- ✅ Never commit these credentials to git
- ✅ Keep the Client Secret secure
- ✅ Rotate credentials if compromised
- ✅ Use different credentials for dev/staging/production

---

## Troubleshooting

### "Error 400: redirect_uri_mismatch"
- **Problem:** Redirect URI in Google Cloud Console doesn't match
- **Fix:** Check the redirect URI in OAuth client settings matches exactly:
  ```
  https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
  ```

### "Access blocked: This app's request is invalid"
- **Problem:** OAuth consent screen not configured or app not verified
- **Fix:** 
  - Make sure OAuth consent screen is set up
  - Add your email as a test user
  - For production, you'll need to verify the app with Google

### "Missing Google OAuth credentials"
- **Problem:** Environment variables not set in Supabase
- **Fix:** 
  - Go to Edge Functions → Settings
  - Add `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
  - Redeploy the function if needed

### "Unauthorized" error
- **Problem:** User not authenticated or lawyer profile missing
- **Fix:** Make sure you're logged in as a lawyer with a complete profile

---

## Quick Checklist

- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created (Web application)
- [ ] Redirect URI added: `https://YOUR_PROJECT.supabase.co/functions/v1/google-calendar-auth?action=callback`
- [ ] Client ID and Secret copied
- [ ] `GOOGLE_CLIENT_ID` added to Supabase Dashboard
- [ ] `GOOGLE_CLIENT_SECRET` added to Supabase Dashboard
- [ ] Test user email added to OAuth consent screen
- [ ] Tested calendar connection

---

## Summary

**What you need:**
1. ✅ Google Calendar API enabled
2. ✅ OAuth 2.0 Client ID (Web application type)
3. ✅ Redirect URI configured
4. ✅ Credentials added to Supabase Dashboard

**Where to add:**
- Supabase Dashboard → Edge Functions → Settings → Environment Variables

Once set up, lawyers can connect their Google Calendar and sync events automatically! 🎉

