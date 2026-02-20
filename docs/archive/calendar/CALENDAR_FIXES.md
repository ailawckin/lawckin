# Calendar Integration Security & Functionality Fixes

## Overview

This document outlines the security and functionality fixes applied to the Google Calendar integration system.

## Issues Fixed

### 1. OAuth State Tampering Risk ✅
**Problem:** The OAuth callback trusted the Base64 state blob without validation, allowing an attacker to swap in another lawyer's ID and wire their Google calendar to that account.

**Solution:**
- Created `oauth_nonces` table to store server-side nonces with lawyer_id and user_id
- Added `validate_oauth_nonce()` function to verify nonce and match lawyer_id to user_id
- Nonces expire after 10 minutes and are one-time use (deleted after validation)
- OAuth flow now:
  1. Generates secure random nonce on init
  2. Stores nonce with lawyer_id and user_id in database
  3. Validates nonce and verifies lawyer_id belongs to authorized user on callback
  4. Prevents state tampering attacks

**Files Changed:**
- `supabase/migrations/20251105030000_fix_calendar_oauth_security.sql` (new)
- `supabase/functions/google-calendar-auth/index.ts`

### 2. OAuth Callback Redirect Issue ✅
**Problem:** When Referer header was stripped (common with privacy tools), the callback fell back to `url.origin` which is the Supabase Functions domain, redirecting users to the wrong URL.

**Solution:**
- Added `APP_URL` environment variable support
- Fallback chain: `APP_URL` → `Referer` header → `http://localhost:5173` (for local dev)
- Explicit APP_URL prevents redirect failures

**Files Changed:**
- `supabase/functions/google-calendar-auth/index.ts`

**Configuration Required:**
Set `APP_URL` environment variable in Supabase dashboard for edge functions:
- Production: `https://your-domain.com`
- Staging: `https://staging.your-domain.com`
- Local: Uses fallback to `http://localhost:5173`

### 3. External Busy Times Show as Available ✅
**Problem:** The UI promised that busy times are blocked, but `generate_time_slots_for_availability` never called `check_calendar_conflicts`. Clients could see and attempt to book slots that overlap with synced Google events.

**Solution:**
- Integrated `check_calendar_conflicts` into `generate_time_slots_for_availability`
- Slots are now checked for conflicts before being created
- Conflicted slots are never generated, preventing booking attempts
- Added `regenerate_slots_excluding_conflicts()` function for manual regeneration after calendar syncs

**Files Changed:**
- `supabase/migrations/20251105030100_integrate_calendar_conflicts_into_slots.sql` (new)
- `src/components/lawyer/CalendarIntegration.tsx` (updated description)

### 4. Refresh Token Missing Handling ✅
**Problem:** The sync worker blindly used `refresh_token` which may not exist after first consent. Many Google responses omit refresh tokens, causing `invalid_grant` errors with no recovery path.

**Solution:**
- Added check for `refresh_token` existence before attempting refresh
- If missing, connection status is set to `'expired'` with clear error message
- Users see "Expired" status and can reconnect via "Reconnect" button
- Prevents infinite error loops

**Files Changed:**
- `supabase/functions/sync-calendar/index.ts`

### 5. Connection Status Not Updated ✅
**Problem:** After sync failures, the backend never updated `calendar_connections.status` from 'active', and the UI only showed active connections. Lawyers always saw "Connected" even when broken.

**Solution:**
- Sync function now updates status to `'error'` or `'expired'` on failures
- UI now shows all connection statuses (not just 'active')
- Added status badges: "Connected" (active), "Expired" (expired), "Error" (error)
- Added "Reconnect" button for non-active connections
- Sync button disabled when no active connections
- Clear messaging when connections have issues

**Files Changed:**
- `supabase/functions/sync-calendar/index.ts`
- `src/components/lawyer/CalendarIntegration.tsx`

## Database Migrations

Two new migrations were created:

1. **20251105030000_fix_calendar_oauth_security.sql**
   - Creates `oauth_nonces` table
   - Adds `validate_oauth_nonce()` function
   - Adds cleanup function for expired nonces

2. **20251105030100_integrate_calendar_conflicts_into_slots.sql**
   - Updates `generate_time_slots_for_availability` to check conflicts
   - Adds `regenerate_slots_excluding_conflicts()` function

## Environment Variables

### Required for Edge Functions

Set these in Supabase Dashboard → Edge Functions → Settings:

- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `APP_URL` - Your application URL (e.g., `https://your-domain.com`)

**Note:** `APP_URL` is critical for proper OAuth redirects. Without it, users may be redirected to the Supabase Functions domain instead of your app.

## Testing Recommendations

1. **OAuth Security:**
   - Test OAuth flow with valid credentials
   - Verify nonce validation prevents tampering
   - Test expired nonce rejection

2. **Conflict Checking:**
   - Create availability blocks
   - Sync calendar with busy events
   - Verify slots overlapping busy times are not generated
   - Test booking attempts on conflicted slots (should fail)

3. **Token Refresh:**
   - Test with missing refresh token
   - Verify connection status updates to 'expired'
   - Test reconnection flow

4. **Status Updates:**
   - Trigger sync failures
   - Verify status updates correctly
   - Test UI shows all statuses
   - Verify reconnect button works

## Manual Slot Regeneration

After calendar syncs, you may want to regenerate slots to exclude newly detected conflicts:

```sql
SELECT public.regenerate_slots_excluding_conflicts('lawyer_id_here');
```

This function:
- Deletes unbooked slots that now have conflicts
- Regenerates slots for existing availability blocks
- Skips slots that conflict with calendar events

## Security Improvements Summary

✅ **State validation** - Prevents OAuth state tampering  
✅ **User verification** - Ensures lawyer_id matches authorized user  
✅ **Nonce expiration** - 10-minute window prevents replay attacks  
✅ **Conflict prevention** - Blocks conflicted slots at generation time  
✅ **Status tracking** - Proper error state management  
✅ **Token handling** - Graceful handling of missing refresh tokens  

## Next Steps

1. Apply database migrations
2. Set `APP_URL` environment variable in Supabase
3. Test OAuth flow end-to-end
4. Monitor sync logs for any issues
5. Consider adding scheduled slot regeneration after calendar syncs

