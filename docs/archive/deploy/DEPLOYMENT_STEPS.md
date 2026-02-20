# Calendar Fixes - Deployment Steps

## Overview
This guide covers the deployment steps needed after the calendar security and functionality fixes.

## Step 1: Apply Database Migrations

Apply the two new migrations to your Supabase database:

### Option A: Using Supabase CLI (Recommended)
```bash
# From the repo root
supabase db push
```

### Option B: Using Supabase Dashboard
1. Go to Supabase Dashboard → SQL Editor
2. Run each migration file in order:
   - `supabase/migrations/20251105030000_fix_calendar_oauth_security.sql`
   - `supabase/migrations/20251105030100_integrate_calendar_conflicts_into_slots.sql`

### Option C: Using psql
```bash
# Connect to your Supabase database
psql "postgresql://[connection-string]"

# Then run each migration file
\i supabase/migrations/20251105030000_fix_calendar_oauth_security.sql
\i supabase/migrations/20251105030100_integrate_calendar_conflicts_into_slots.sql
```

**Verify migrations applied:**
- Check that `oauth_nonces` table exists
- Check that `validate_oauth_nonce()` function exists
- Check that `regenerate_slots_excluding_conflicts()` function exists
- Verify `generate_time_slots_for_availability` has been updated

## Step 2: Configure APP_URL Environment Variable

### In Supabase Dashboard:
1. Go to **Project Settings** → **Edge Functions** → **Settings**
2. Find **Environment Variables** section
3. Add/Update the following variables:
   - `APP_URL` = `https://your-domain.com` (or your staging URL)
   - `GOOGLE_CLIENT_ID` = (should already exist)
   - `GOOGLE_CLIENT_SECRET` = (should already exist)

### For Local Development:
If using Supabase CLI locally, you can set environment variables in `.env` or `supabase/.env`:
```
APP_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### Redeploy Edge Functions

After setting environment variables, redeploy the edge functions:

**Option A: Using Supabase CLI**
```bash
supabase functions deploy google-calendar-auth
supabase functions deploy sync-calendar
```

**Option B: Using Supabase Dashboard**
1. Go to **Edge Functions** → **google-calendar-auth** → Click **Deploy**
2. Go to **Edge Functions** → **sync-calendar** → Click **Deploy**

**Note:** The functions will automatically use the new environment variables after redeployment.

## Step 3: Refresh TypeScript Types

Regenerate TypeScript types to include the new `oauth_nonces` table and RPC functions:

### Option A: Using the Helper Script (Easiest):
```bash
./scripts/regenerate-types.sh
```

### Option B: Using Supabase CLI Directly:
```bash
# Project ID from supabase/config.toml: zrnklcpgumwcswyxnumk
supabase gen types typescript --project-id zrnklcpgumwcswyxnumk --schema public > src/integrations/supabase/types.ts
```

### Alternative: Using Supabase Dashboard
1. Go to **Settings** → **API** → **Generate TypeScript types**
2. Copy the generated types
3. Replace contents of `src/integrations/supabase/types.ts`

### Verify Types Updated:
- Check that `oauth_nonces` table type exists in `Database['public']['Tables']`
- Check that `validate_oauth_nonce` function exists in `Database['public']['Functions']`
- Check that `regenerate_slots_excluding_conflicts` function exists in `Database['public']['Functions']`

## Step 4: Test the Changes

### Test OAuth Flow:
1. Go to Lawyer Dashboard → Calendar Integration
2. Click "Connect Google Calendar"
3. Complete OAuth flow
4. Verify redirect goes to your app (not Supabase Functions domain)
5. Verify connection shows as "Connected"

### Test Conflict Checking:
1. Create availability blocks for a lawyer
2. Sync calendar with busy events overlapping those blocks
3. Verify slots overlapping busy times are NOT generated
4. Verify only available slots show up for booking

### Test Status Updates:
1. Disconnect and reconnect calendar
2. Verify status updates correctly (active/expired/error)
3. Test "Reconnect" button for expired connections

### Test Slot Regeneration:
1. Sync calendar with events
2. Check that slots are automatically regenerated
3. Verify conflicted slots are removed

## Troubleshooting

### Migration Fails:
- Check database connection
- Verify you have necessary permissions
- Check for conflicting migrations

### APP_URL Not Working:
- Verify environment variable is set correctly
- Redeploy edge functions after setting variable
- Check function logs for errors

### Types Not Updating:
- Ensure Supabase CLI is up to date: `supabase update`
- Verify project ID is correct
- Check that schema name is `public`

### Slot Regeneration Not Working:
- Check function logs in Supabase Dashboard
- Verify `regenerate_slots_excluding_conflicts` function exists
- Check that lawyer_id is correct

## Post-Deployment Checklist

- [ ] Migrations applied successfully
- [ ] APP_URL environment variable set
- [ ] Edge functions redeployed
- [ ] TypeScript types regenerated
- [ ] OAuth flow tested and working
- [ ] Conflict checking verified
- [ ] Status updates working
- [ ] Slot regeneration working

## Next Steps

After deployment:
1. Monitor sync logs for any issues
2. Test with real calendar events
3. Consider adding scheduled slot regeneration (optional)
4. Update documentation if needed

