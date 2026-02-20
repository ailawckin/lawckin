# Setup & Deploy

This guide covers local setup, Supabase configuration, migrations, and deployments.

## Prerequisites

- Node.js 18+ and npm
- Supabase account + project
- (Optional) Google Maps API key for address autocomplete
- (Optional) Resend API key for consultation notification emails

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env`:

```bash
cp .env.example .env
```

3. Set client-side environment variables:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=optional-for-address-autocomplete
```

4. Start the dev server:

```bash
npm run dev
```

## Supabase CLI (Recommended)

Install and link the project:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

## Database Migrations

Apply all migrations:

```bash
supabase db push
```

Or use Supabase SQL Editor to run files from `supabase/migrations/` in order.

## Edge Functions

This repo currently ships one function:

- `send-consultation-notification`

Deploy:

```bash
supabase functions deploy send-consultation-notification
```

### Edge Function Environment Variables

Set these in Supabase Dashboard → Edge Functions → Settings:

- `RESEND_API_KEY` (required for email notifications)

## Types Regeneration

If database changes were applied, regenerate types:

```bash
./scripts/regenerate-types.sh
```

Or manually:

```bash
supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > src/integrations/supabase/types.ts
```

## Notes

- Calendar sync has been removed from the app, so Google OAuth / calendar function setup is no longer required.
- Address autocomplete uses Google Maps; if you skip the API key, the input will still render but won’t autocomplete.

