# Testing & QA

This guide covers seeding demo data and basic verification flows.

## Seed Test Data

Prerequisites in `.env`:

```env
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Run:

```bash
npm run seed:test
```

Cleanup:

```bash
npm run cleanup:test
```

## Quality Gates (Current)

Run these before each merge/deploy:

```bash
npm run lint
npm run build
```

> Current lint baseline is warning-only for explicit `any` while module hardening is in progress.

## Core Route Smoke Test (Manual)

1. `/` home loads and header nav works.
2. `/auth` supports sign in and sign up.
3. `/onboarding/client` redirects unauthenticated users to `/auth`.
4. `/onboarding/lawyer` redirects unauthenticated users to `/auth`.
5. `/dashboard` enforces auth and client role.
6. `/lawyer-dashboard` enforces auth and lawyer role.
7. `/admin` enforces admin role.
8. `/lawyers` search page loads, filter interactions update results.

## Quick QA Checklist

### Auth & Onboarding
- Sign up as lawyer and client
- Complete lawyer onboarding
- Verify the lawyer profile appears in admin review queue

### Admin Approval
- Approve a lawyer in `/admin/lawyers`
- Confirm lawyer can accept bookings after approval

### Booking & Scheduling
- Create availability
- Book a consultation as a client
- Confirm it appears in lawyer dashboard schedule

### Messaging
- Start a client-lawyer conversation
- Send/receive messages
- Verify unread state and read status changes

### Settings
- Update profile fields
- Save and discard changes
- Verify data persists

## Optional: Disable Email Verification (Local Testing)

If you want to skip email verification locally, you can disable it in Supabase Auth settings in the dashboard.

