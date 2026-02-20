# OAuth 2.0 Client ID and Redirect URI Guide

## Why OAuth 2.0 Client ID?

**OAuth 2.0** is the standard protocol for secure authentication. When a lawyer clicks "Connect Google Calendar":

1. **Your app** → Asks Google: "Can this user connect their calendar?"
2. **Google** → Shows consent screen: "Do you want to allow Lawckin to access your calendar?"
3. **User** → Clicks "Allow"
4. **Google** → Redirects back to your app with an authorization code
5. **Your app** → Exchanges the code for access tokens

**OAuth 2.0 Client ID** is like a "passport" that identifies your app to Google. It tells Google:
- "This is the Lawckin app"
- "It's allowed to request calendar access"
- "Send the authorization code to this redirect URL"

---

## Where to Add the Redirect URI

### Step-by-Step Instructions

#### 1. Go to Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Select your project (or create a new one)

#### 2. Navigate to Credentials

1. In the left sidebar, click **"APIs & Services"**
2. Click **"Credentials"**
3. You should see a list of credentials (or it might be empty)

#### 3. Create OAuth 2.0 Client ID

1. Click **"Create Credentials"** button (top of the page)
2. Select **"OAuth client ID"** from the dropdown

**If you see a message about OAuth consent screen:**
- Click **"Configure Consent Screen"** first
- Choose **"External"** (unless you have Google Workspace)
- Fill in:
  - **App name:** `Lawckin`
  - **User support email:** Your email
  - **Developer contact:** Your email
- Click **"Save and Continue"**
- **Scopes:** Add:
  - `https://www.googleapis.com/auth/calendar.readonly`
  - `https://www.googleapis.com/auth/calendar.events`
- Click **"Save and Continue"**
- **Test users:** Add your email
- Click **"Save and Continue"**
- Click **"Back to Dashboard"**

#### 4. Create the OAuth Client ID

1. Go back to **"APIs & Services"** → **"Credentials"**
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. **Application type:** Select **"Web application"**
4. **Name:** Enter `Lawckin Calendar OAuth` (or any name you like)

#### 5. Add the Redirect URI ⭐ **THIS IS WHERE YOU ADD IT**

In the **"Authorized redirect URIs"** section:

1. Click **"+ Add URI"** button
2. Paste this exact URL:
   ```
   https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
   ```
3. Click **"Create"** button

**Important:** 
- The redirect URI must match **exactly** (including `?action=callback`)
- Replace `wulalgwsehjjiczcatpo` with your actual Supabase project reference ID if different

#### 6. Copy Your Credentials

After clicking "Create", a popup will appear with:
- **Your Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
- **Your Client secret** (looks like: `GOCSPX-abc123xyz...`)

**⚠️ IMPORTANT:** Copy both values immediately! You won't be able to see the secret again.

---

## Visual Guide

```
Google Cloud Console
├── APIs & Services
    ├── Credentials
        ├── Create Credentials
            └── OAuth client ID
                ├── Application type: Web application
                ├── Name: Lawckin Calendar OAuth
                └── Authorized redirect URIs:
                    └── https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
```

---

## Why This Specific Redirect URI?

The redirect URI is where Google sends the user **after** they authorize your app.

**The flow:**
1. User clicks "Connect Google Calendar" in your app
2. Your app redirects to Google: `https://accounts.google.com/o/oauth2/auth?...`
3. User authorizes on Google's site
4. Google redirects back to: `https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback`
5. Your Edge Function (`google-calendar-auth`) receives the authorization code
6. Your function exchanges the code for tokens and saves them

**The redirect URI must:**
- ✅ Point to your Supabase Edge Function
- ✅ Include `?action=callback` (so the function knows it's a callback)
- ✅ Match exactly what you configure in Google Cloud Console

---

## Common Mistakes

### ❌ Wrong Redirect URI Format
**Wrong:**
```
https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth
```
**Correct:**
```
https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback
```

### ❌ Missing `?action=callback`
- **Problem:** Function won't know it's a callback
- **Fix:** Always include `?action=callback`

### ❌ Wrong Project Reference ID
- **Problem:** Redirect goes to wrong Supabase project
- **Fix:** Use your actual project reference ID (check Supabase Dashboard URL)

### ❌ Multiple Redirect URIs
- **Problem:** Adding multiple URIs can cause confusion
- **Fix:** Start with one, add more only if needed (e.g., for staging)

---

## How to Find Your Supabase Project Reference ID

1. Go to Supabase Dashboard
2. Look at the URL:
   ```
   https://supabase.com/dashboard/project/wulalgwsehjjiczcatpo
   ```
   The part after `/project/` is your project reference ID

3. Or go to **Settings** → **General** → **Reference ID**

---

## After Adding Redirect URI

Once you've:
1. ✅ Created OAuth 2.0 Client ID
2. ✅ Added the redirect URI
3. ✅ Copied Client ID and Client Secret

**Next steps:**
1. Add `GOOGLE_CLIENT_ID` to Supabase Dashboard → Edge Functions → Settings
2. Add `GOOGLE_CLIENT_SECRET` to Supabase Dashboard → Edge Functions → Settings
3. Test the connection!

---

## Summary

**Where to add redirect URI:**
- Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID → Authorized redirect URIs

**Why OAuth 2.0 Client ID:**
- It's the standard secure way to authenticate with Google
- Identifies your app to Google
- Enables the authorization flow

**The redirect URI:**
- Must be: `https://YOUR_PROJECT.supabase.co/functions/v1/google-calendar-auth?action=callback`
- Tells Google where to send users after authorization
- Must match exactly in Google Cloud Console

---

## Quick Checklist

- [ ] Google Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] OAuth 2.0 Client ID created (Web application type)
- [ ] Redirect URI added: `https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback`
- [ ] Client ID and Secret copied
- [ ] Credentials added to Supabase Dashboard

Once all checked, you're ready to test! 🎉

