# Setup Walkthrough - Next Steps

**Date:** November 5, 2025  
**Purpose:** Complete setup guide for location alignment and address autocomplete features

---

## Overview

This guide walks you through the setup steps needed after the recent location alignment changes. You'll need to:

1. ✅ Apply database migration (add `street_address` column)
2. ✅ Get Google Maps API key (for address autocomplete)
3. ✅ Configure environment variables
4. ✅ Regenerate TypeScript types
5. ✅ Test the features

---

## Step 1: Apply Database Migration

### What You're Adding
- `street_address` column to `lawyer_profiles` table
- This stores the business address (internal use only)

### How to Apply

#### Option A: Supabase Dashboard (Easiest) ⭐ **RECOMMENDED**

1. Go to your **Supabase Dashboard**
   - URL: `https://supabase.com/dashboard/project/zrnklcpgumwcswyxnumk`
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste this SQL:

```sql
ALTER TABLE public.lawyer_profiles
ADD COLUMN IF NOT EXISTS street_address TEXT;

COMMENT ON COLUMN public.lawyer_profiles.location IS 'Primary service area visible to clients (e.g., "Manhattan", "Brooklyn"). Must match curated NY service areas.';
COMMENT ON COLUMN public.lawyer_profiles.street_address IS 'Full business address for internal use only. Not displayed to clients.';
```

5. Click **Run** (or press Cmd/Ctrl + Enter)
6. You should see "Success. No rows returned"

#### Option B: Supabase CLI

```bash
# From the repo root directory
cd /Users/tommasolm/Desktop/lawckin-main

# Apply all pending migrations
supabase db push
```

### Verify Migration Applied

In Supabase Dashboard → **Table Editor** → `lawyer_profiles`:
- You should see a new column called `street_address`
- Or run this query in SQL Editor:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'lawyer_profiles' 
AND column_name = 'street_address';
```

**Expected Result:** Should return one row with `street_address` and `text` type.

---

## Step 2: Get Google Maps API Key

### Why You Need This
- Powers the address autocomplete feature
- As lawyers type their business address, Google suggests valid addresses
- Ensures addresses are formatted correctly

### Setup Steps

#### 2.1 Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account
3. Click **Select a project** → **New Project**
4. Name it: `Lawckin` (or your preferred name)
5. Click **Create**

#### 2.2 Enable Places API

1. In Google Cloud Console, go to **APIs & Services** → **Library**
2. Search for **"Places API"**
3. Click on **Places API**
4. Click **Enable**
5. Wait for activation (usually instant)

#### 2.3 Create API Key

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy the API key that appears
4. **IMPORTANT:** Don't close this window yet - you need to restrict it!

#### 2.4 Restrict API Key (Security Best Practice)

1. Click on your newly created API key to edit it
2. Under **API restrictions**:
   - Select **Restrict key**
   - Check **Places API** only
3. Under **Application restrictions**:
   - Select **HTTP referrers (web sites)**
   - Click **Add an item**
   - Add these referrers:
     ```
     http://localhost:*
     http://localhost:5173/*
     https://your-production-domain.com/*
     ```
   - Replace `your-production-domain.com` with your actual domain
4. Click **Save**

#### 2.5 Understanding Restrictions

- **API restrictions**: Only allow Places API (prevents unauthorized use)
- **Application restrictions**: Only allow requests from your domains (prevents key theft)

**Note:** For local development, `http://localhost:*` is fine. For production, use your actual domain.

---

## Step 3: Configure Environment Variables

### 3.1 Add Google Maps API Key

1. Open your `.env` file in the project root
2. Add this line:

```env
VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
```

**Replace `your-api-key-here` with the actual API key you copied from Google Cloud Console.**

### 3.2 Verify Your `.env` File

Your `.env` file should now have:

```env
# Supabase (already exists)
VITE_SUPABASE_URL=https://zrnklcpgumwcswyxnumk.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-key

# Google Maps (NEW)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3.3 Restart Development Server

After adding the API key:

```bash
# Stop your dev server (Ctrl+C)
# Then restart it
npm run dev
```

**Why?** Environment variables are loaded when the server starts.

---

## Step 4: Regenerate TypeScript Types

After applying the database migration, update TypeScript types to include the new `street_address` field.

### Option A: Using the Helper Script

```bash
./scripts/regenerate-types.sh
```

### Option B: Manual Command

```bash
supabase gen types typescript --project-id zrnklcpgumwcswyxnumk --schema public > src/integrations/supabase/types.ts
```

### What This Does
- Updates `src/integrations/supabase/types.ts`
- Adds `street_address` field to TypeScript types
- Prevents TypeScript errors in your code

---

## Step 5: Test Everything

### 5.1 Test Address Autocomplete

1. Start your dev server: `npm run dev`
2. Go to lawyer onboarding or dashboard
3. Navigate to the "Business Address" field
4. Start typing an address (e.g., "123 Main St, New York")
5. **Expected:** You should see autocomplete suggestions appear
6. Select a suggestion
7. **Expected:** Address is automatically filled in

### 5.2 Test Service Location Dropdown

1. In lawyer onboarding (step 5) or dashboard profile section
2. Look for "Service Area" dropdown
3. **Expected:** Should show 9 NY service areas:
   - Manhattan
   - Brooklyn
   - Queens
   - Bronx
   - Staten Island
   - Long Island (Nassau / Suffolk)
   - Westchester
   - Upstate NY
   - Remote / Anywhere in NY

### 5.3 Test Saving

1. Fill in service area and business address
2. Save the profile
3. Refresh the page
4. **Expected:** Both fields should retain their values

---

## Troubleshooting

### Issue: "street_address column not found"

**Solution:**
- Make sure you applied the migration (Step 1)
- Check Supabase Dashboard → Table Editor to verify column exists

### Issue: "VITE_GOOGLE_MAPS_API_KEY not set" warning

**Solution:**
- Check your `.env` file has the key
- Restart your dev server after adding it
- Make sure there are no spaces around the `=` sign

### Issue: "Failed to load Google Maps API"

**Possible causes:**
1. API key is incorrect
2. Places API not enabled
3. API key restrictions blocking your domain
4. Check browser console for specific error

**Solution:**
- Verify API key in Google Cloud Console
- Check Places API is enabled
- Temporarily remove restrictions to test, then re-add them

### Issue: No autocomplete suggestions appearing

**Check:**
1. Is API key set correctly?
2. Is Places API enabled?
3. Check browser console for errors
4. Try typing a known address (e.g., "1600 Broadway, New York")

### Issue: TypeScript errors about street_address

**Solution:**
- Run Step 4 (regenerate types)
- Make sure migration was applied first

---

## Quick Checklist

- [ ] Applied database migration (Step 1)
- [ ] Verified `street_address` column exists
- [ ] Created Google Cloud project
- [ ] Enabled Places API
- [ ] Created and restricted API key
- [ ] Added `VITE_GOOGLE_MAPS_API_KEY` to `.env`
- [ ] Restarted dev server
- [ ] Regenerated TypeScript types (Step 4)
- [ ] Tested address autocomplete
- [ ] Tested service location dropdown
- [ ] Verified saving works

---

## Cost Information

### Google Maps Places API Pricing

- **Autocomplete (per session)**: $0.017
- **Free tier**: $200/month credit
- **Free tier covers**: ~11,700 autocomplete sessions per month

**For most applications:** You'll likely stay within the free tier.

**Monitoring:**
- Google Cloud Console → **APIs & Services** → **Dashboard**
- Shows usage and costs

---

## Next Steps After Setup

Once everything is working:

1. ✅ Test with real addresses
2. ✅ Verify autocomplete suggests NY addresses first
3. ✅ Test saving and loading addresses
4. ✅ Consider adding address validation (optional)
5. ✅ Monitor API usage in Google Cloud Console

---

## Support Resources

- **Google Maps API Docs**: https://developers.google.com/maps/documentation/places/web-service/autocomplete
- **Supabase Migrations**: https://supabase.com/docs/guides/cli/local-development#database-migrations
- **Environment Variables**: See `GOOGLE_MAPS_SETUP.md` for detailed API setup

---

## Summary

**What you're setting up:**
1. Database column for business addresses ✅
2. Google Maps API for address autocomplete ✅
3. Consistent location selection across the app ✅

**Time estimate:** 15-20 minutes

**Difficulty:** Easy (just following steps)

Good luck! 🚀

