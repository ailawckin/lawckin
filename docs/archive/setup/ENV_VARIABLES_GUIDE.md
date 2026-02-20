# Environment Variables Guide

## Overview
This guide explains which environment variables go where: `.env` file vs Supabase Dashboard.

---

## Client-Side Variables (`.env` file)

These variables are used by your **frontend React app** and get bundled into the client code.

### Required Variables

```env
# Supabase Client Configuration
VITE_SUPABASE_URL=https://wulalgwsehjjiczcatpo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here

# Google Maps API (for address autocomplete)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**Where:** `.env` file in project root  
**Why:** These are public keys that get bundled into your frontend JavaScript  
**Security:** These are safe to expose (they're public keys with RLS protection)

---

## Server-Side Variables (Supabase Dashboard)

These variables are used by **Edge Functions** (server-side code) and should NOT be in `.env`.

### Required Variables

```env
# Google Calendar OAuth (for calendar integration)
GOOGLE_CLIENT_ID=your-google-oauth-client-id
GOOGLE_CLIENT_SECRET=your-google-oauth-client-secret

# Calendar Sync Authentication
SYNC_CRON_KEY=your-generated-cron-key

# Optional: App URL for OAuth redirects
APP_URL=https://your-domain.com
```

**Where:** Supabase Dashboard → Edge Functions → Settings → Environment Variables  
**Why:** These are secrets that should never be exposed to the client  
**Security:** These are private and encrypted in Supabase

---

## What Should Go Where?

### ✅ Add to `.env` file:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key
- `VITE_GOOGLE_MAPS_API_KEY` - Google Maps API key (for address autocomplete)

### ✅ Add to Supabase Dashboard (Edge Functions Settings):

- `GOOGLE_CLIENT_ID` - Google OAuth Client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth Client Secret
- `SYNC_CRON_KEY` - Calendar sync authentication key
- `APP_URL` - Your app's URL (optional, defaults to localhost)

### ❌ Do NOT add to Supabase Dashboard:

- `VITE_*` variables (these are for frontend only)
- `SUPABASE_SERVICE_ROLE_KEY` (automatically available to Edge Functions)
- `SUPABASE_URL` (automatically available to Edge Functions)

---

## Quick Reference Table

| Variable | Location | Purpose | Security |
|----------|----------|---------|----------|
| `VITE_SUPABASE_URL` | `.env` | Frontend Supabase connection | Public (safe) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env` | Frontend Supabase auth | Public (safe, RLS protected) |
| `VITE_GOOGLE_MAPS_API_KEY` | `.env` | Address autocomplete | Public (safe, API restricted) |
| `GOOGLE_CLIENT_ID` | Supabase Dashboard | Calendar OAuth | Secret (server-only) |
| `GOOGLE_CLIENT_SECRET` | Supabase Dashboard | Calendar OAuth | Secret (server-only) |
| `SYNC_CRON_KEY` | Supabase Dashboard | Scheduled syncs | Secret (server-only) |
| `APP_URL` | Supabase Dashboard | OAuth redirects | Optional |

---

## How to Check What's Currently Set

### Check `.env` file:
```bash
cat .env
```

### Check Supabase Dashboard:
1. Go to Supabase Dashboard → Edge Functions → Settings
2. View Environment Variables section
3. You should see:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `SYNC_CRON_KEY`
   - `APP_URL` (optional)

---

## Common Mistakes

### ❌ Adding `VITE_*` to Supabase Dashboard
- **Problem:** Edge Functions can't access `VITE_*` variables
- **Fix:** Keep `VITE_*` variables in `.env` only

### ❌ Adding secrets to `.env` and committing to git
- **Problem:** Secrets exposed in git history
- **Fix:** Never commit `.env` with real secrets (use `.env.example`)

### ❌ Adding `GOOGLE_CLIENT_SECRET` to `.env`
- **Problem:** Secret exposed in client-side code
- **Fix:** Only add to Supabase Dashboard

---

## Summary

**`.env` file (Client-side):**
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY`
- ✅ `VITE_GOOGLE_MAPS_API_KEY`

**Supabase Dashboard (Server-side):**
- ✅ `GOOGLE_CLIENT_ID`
- ✅ `GOOGLE_CLIENT_SECRET`
- ✅ `SYNC_CRON_KEY`
- ✅ `APP_URL` (optional)

**Never commit secrets to git!** Use `.env.example` for documentation.

