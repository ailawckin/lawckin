# Calendar Sync Scheduler Setup Guide

## Overview
This guide explains how to set up automatic calendar syncing using external cron services. The calendar sync system supports both manual syncs (via "Sync Now" button) and scheduled syncs (via cron).

---

## Prerequisites

1. **Deploy Edge Functions**
   - `sync-calendar` - Main sync function (already deployed)
   - `scheduled-sync-calendar` - Wrapper for scheduled syncs (optional)

2. **Set Environment Variables**
   In Supabase Dashboard → Edge Functions → Settings:
   - `GOOGLE_CLIENT_ID` - Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` - Your Google OAuth client secret
   - `SYNC_CRON_KEY` - **NEW**: A secure random string for cron authentication
     - Generate with: `openssl rand -hex 32`
     - Or use: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Option 1: External Cron Service (Recommended)

### Using cron-job.org

1. **Sign up** at [cron-job.org](https://cron-job.org) (free tier available)

2. **Create a new cron job:**
   - **Title:** Calendar Sync
   - **URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-sync-calendar`
   - **Schedule:** Every hour (`0 * * * *`)
   - **Request Method:** POST
   - **Request Headers:**
     ```
     Authorization: Bearer YOUR_SYNC_CRON_KEY
     Content-Type: application/json
     ```
   - **Request Body:** (optional, leave empty to sync all lawyers)
     ```json
     {}
     ```

3. **Test the cron job:**
   - Click "Run now" to test
   - Check Supabase logs: Dashboard → Edge Functions → Logs
   - Verify syncs appear in `calendar_sync_log` table with `sync_type = 'scheduled'`

### Using GitHub Actions (Alternative)

Create `.github/workflows/sync-calendar.yml`:

```yaml
name: Sync Calendar

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Allow manual trigger

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Sync Calendar
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SYNC_CRON_KEY }}" \
            -H "Content-Type: application/json" \
            https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-sync-calendar
        env:
          SYNC_CRON_KEY: ${{ secrets.SYNC_CRON_KEY }}
```

Add `SYNC_CRON_KEY` to GitHub Secrets:
- Settings → Secrets → Actions → New repository secret

---

## Option 2: Direct Function Call (Simpler)

If you don't want to use the wrapper function, call `sync-calendar` directly:

**URL:** `https://YOUR_PROJECT.supabase.co/functions/v1/sync-calendar`

**Headers:**
```
Authorization: Bearer YOUR_SYNC_CRON_KEY
Content-Type: application/json
```

**Body (optional):**
```json
{
  "lawyer_id": "uuid-here"  // Omit to sync all active connections
}
```

---

## Option 3: Supabase Edge Scheduler (Future)

When Supabase Edge Scheduler becomes available, you can use:

```sql
-- This is a placeholder for future implementation
SELECT cron.schedule(
  'sync-calendar-hourly',
  '0 * * * *',  -- Every hour
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/sync-calendar',
    headers := jsonb_build_object(
      'Authorization', 'Bearer YOUR_SYNC_CRON_KEY',
      'Content-Type', 'application/json'
    )
  );
  $$
);
```

---

## Security Best Practices

1. **Never commit `SYNC_CRON_KEY` to git**
   - Add to `.env` (already in `.gitignore`)
   - Store in Supabase Dashboard → Edge Functions → Settings
   - Use environment-specific keys for dev/staging/prod

2. **Rotate keys periodically**
   - Generate new `SYNC_CRON_KEY`
   - Update in Supabase Dashboard
   - Update cron service configuration
   - Old key will stop working immediately

3. **Monitor sync logs**
   - Check `calendar_sync_log` table regularly
   - Set up alerts for sync failures
   - Review Supabase Edge Functions logs

---

## Testing

### Test Manual Sync
1. Go to Lawyer Dashboard → Calendar Integration
2. Click "Sync Now"
3. Verify toast shows slot counts
4. Check `calendar_sync_log` shows `sync_type = 'manual'`

### Test Scheduled Sync
1. Call the scheduled endpoint manually:
   ```bash
   curl -X POST \
     -H "Authorization: Bearer YOUR_SYNC_CRON_KEY" \
     -H "Content-Type: application/json" \
     https://YOUR_PROJECT.supabase.co/functions/v1/scheduled-sync-calendar
   ```
2. Verify response shows sync results
3. Check `calendar_sync_log` shows `sync_type = 'scheduled'`

---

## Troubleshooting

### "Unauthorized" Error
- Verify `SYNC_CRON_KEY` matches in:
  - Supabase Dashboard → Edge Functions → Settings
  - Cron service configuration
- Check for extra spaces or newlines in the key

### "Missing SYNC_CRON_KEY" Error
- Add `SYNC_CRON_KEY` to Supabase Dashboard → Edge Functions → Settings
- Redeploy the function if needed

### Syncs Not Running
- Check cron service logs
- Verify cron schedule is correct (`0 * * * *` = every hour)
- Check Supabase Edge Functions logs for errors
- Verify calendar connections have `status = 'active'`

### Slots Not Updating
- Ensure migration `20251106010000_improve_slot_regeneration_with_count.sql` is applied
- Check `regenerate_slots_excluding_conflicts` returns counts correctly
- Verify calendar events are being cached in `calendar_events_cache`

---

## Monitoring

### Check Sync Status
```sql
SELECT 
  sync_type,
  status,
  COUNT(*) as count,
  MAX(sync_end) as last_sync
FROM calendar_sync_log
WHERE sync_end > NOW() - INTERVAL '24 hours'
GROUP BY sync_type, status;
```

### Check Active Connections
```sql
SELECT 
  lawyer_id,
  calendar_name,
  status,
  last_synced_at
FROM calendar_connections
WHERE status = 'active';
```

---

## Summary

1. ✅ Set `SYNC_CRON_KEY` in Supabase Dashboard
2. ✅ Choose cron service (cron-job.org recommended)
3. ✅ Configure cron job with correct URL and headers
4. ✅ Test manually first
5. ✅ Monitor logs and sync status

Once set up, calendar syncs will run automatically every hour, keeping availability slots in sync with Google Calendar events! 🎉

