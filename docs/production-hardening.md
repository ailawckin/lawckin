# Production Hardening Guide

This document is the production-readiness baseline for Lawckin.

## 1) Environment Validation & Deploy Config

### Required checks
- Run `npm run validate:env` before build/deploy.
- `npm run build` now runs env validation automatically.

### Environment matrix

**Frontend required**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

**Frontend optional**
- `VITE_COUNTRY` (`nyc` or `ch`)
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_APP_PASSCODE`
- `VITE_OBSERVABILITY_ENDPOINT`
- `VITE_OBSERVABILITY_ENV`

**Ops/script only (never expose to browser)**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

### Deploy profile recommendation
- **Preview/staging**: separate Supabase project + separate API keys.
- **Production**: production-only keys in host secret manager.
- Never commit `.env`.

---

## 2) Security Hygiene & Rate-Limit Guidance

### Automated hygiene checks
- Run `npm run check:security` in CI.
- It catches:
  - hardcoded API secrets
  - service-role usage in frontend files
  - wildcard CORS usage in edge functions (warning)

### Edge/server interaction controls (recommended)
1. Require POST for mutating endpoints.
2. Validate JSON body shape and max payload size.
3. Keep CORS allowlist explicit in production.
4. Enforce per-IP / per-user request limits for AI + notification endpoints.
5. Log and alert on repeated 4xx/5xx spikes.

### Baseline rate-limit targets
- `ai-lawyer-intake`: 20 requests / 10 minutes / IP
- `ai-lawyer-profile-embedding`: 30 requests / 10 minutes / IP
- `send-consultation-notification`: 10 requests / 5 minutes / actor

Tune with real traffic and false-positive review.

---

## 3) Database Management Checklist

See `docs/database-ops-checklist.md` for full runbook.

Minimum baseline:
- Daily backups enabled.
- PITR enabled with tested restore drill.
- Migration-only schema changes (no ad-hoc dashboard edits).
- Rollback strategy documented per risky migration.

---

## 4) Observability Baseline

Implemented integration points:
- Global browser error + unhandled rejection hooks (`src/lib/observability.ts`).
- Supabase network instrumentation with slow-request warnings and failed-request events.
- Optional remote log shipping via `VITE_OBSERVABILITY_ENDPOINT`.

Operational recommendation:
- Send logs to Sentry/Datadog/OTel gateway.
- Alert on:
  - auth failures burst
  - RPC error-rate > 2%
  - P95 API latency regressions

---

## 5) Smoke Testing

See `docs/smoke-tests.md`.

Quick CI baseline:
```bash
npm run smoke:ci
```

---

## 6) Performance Optimization Shortlist

Low-risk implemented:
- React Query defaults tuned to reduce noisy refetching:
  - `staleTime: 60s`
  - `gcTime: 5m`
  - `refetchOnWindowFocus: false`
  - `retry: 1`

Next candidates:
1. Route-level code splitting for admin/lawyer/client dashboards.
2. Cache search RPC results by normalized query key.
3. Add server-side pagination to high-cardinality admin tables.
4. Add Web Vitals collection to observability endpoint.
