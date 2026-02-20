# Deploy Edge Functions to Supabase

## Problem
You're getting a 404 error because the Edge Functions haven't been deployed to your Supabase project yet.

## Solution: Deploy the Functions

### Option 1: Using Supabase CLI (Recommended)

**Prerequisites:**
- Supabase CLI installed
- Logged in: `supabase login`
- Project linked: `supabase link --project-ref YOUR_PROJECT_REF`

**Deploy all functions:**
```bash
cd /Users/tommasolm/Desktop/lawckin-main

# Deploy google-calendar-auth
supabase functions deploy google-calendar-auth

# Deploy sync-calendar
supabase functions deploy sync-calendar

# Deploy scheduled-sync-calendar (optional)
supabase functions deploy scheduled-sync-calendar
```

**Or deploy all at once:**
```bash
supabase functions deploy
```

---

### Option 2: Using Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions**
   - Click **"Edge Functions"** in the left sidebar
   - Click **"Create a new function"** or **"Deploy"**

3. **Deploy via Dashboard UI**
   - The Dashboard UI allows you to create functions, but for existing functions, CLI is easier
   - Alternatively, you can copy the function code and create it manually

**Note:** The Dashboard method is more manual. CLI is recommended.

---

### Option 3: Using GitHub Actions (If Set Up)

If you have CI/CD set up, functions can be deployed automatically on push.

---

## Verify Deployment

After deploying, verify the functions exist:

1. **In Supabase Dashboard:**
   - Go to Edge Functions
   - You should see:
     - `google-calendar-auth`
     - `sync-calendar`
     - `scheduled-sync-calendar` (if deployed)

2. **Test the function:**
   - Try connecting Google Calendar again
   - The 404 error should be gone

---

## Required Environment Variables

Make sure these are set in **Supabase Dashboard → Edge Functions → Settings**:

- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `SYNC_CRON_KEY` (for scheduled syncs)
- ✅ `APP_URL` (optional, defaults to localhost)

---

## Troubleshooting

### "Function not found" after deployment
- Wait a few seconds for deployment to propagate
- Refresh the page
- Check Supabase Dashboard → Edge Functions to confirm it's listed

### "Missing environment variables"
- Go to Edge Functions → Settings
- Add the required environment variables
- Redeploy the function if needed

### CORS errors
- Edge Functions should handle CORS automatically
- If issues persist, check the function code has proper CORS headers

### Deployment fails
- Check you're logged in: `supabase login`
- Verify project is linked: `supabase status`
- Check function code for syntax errors

---

## Quick Command Reference

```bash
# Check if logged in and linked
supabase status

# Deploy a specific function
supabase functions deploy google-calendar-auth

# Deploy all functions
supabase functions deploy

# View function logs
supabase functions logs google-calendar-auth

# Test function locally (if set up)
supabase functions serve google-calendar-auth
```

---

## Next Steps After Deployment

1. ✅ Deploy `google-calendar-auth` function
2. ✅ Deploy `sync-calendar` function
3. ✅ Verify environment variables are set
4. ✅ Test connecting Google Calendar
5. ✅ Test manual sync

Once deployed, the calendar integration should work! 🎉

