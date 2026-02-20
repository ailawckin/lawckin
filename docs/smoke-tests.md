# Smoke Tests (Auth, Search, Dashboards)

## Automated baseline

```bash
npm run smoke:ci
```

This runs:
1. env validation
2. lint
3. production build
4. critical route smoke assertions

## Manual smoke plan (pre-release)

### 1) Auth
- [ ] Login with valid user.
- [ ] Invalid password shows non-crashing error state.
- [ ] Protected route redirects unauthenticated user to auth flow.

### 2) Search
- [ ] Search results render for a known practice area.
- [ ] Empty-result state renders cleanly and offers fallback actions.
- [ ] Pagination changes page without UI errors.

### 3) Core dashboards
- [ ] Client dashboard loads with no console errors.
- [ ] Lawyer dashboard loads with consultations/messages sections.
- [ ] Admin dashboard route is accessible only to admin role.

### 4) Notifications/edge (if configured)
- [ ] Consultation notification function succeeds in staging.
- [ ] Failed edge call produces clear user-facing error.

## Exit criteria
- No blocking errors in browser console.
- No 5xx spikes in Supabase logs during smoke run.
- Build and lint pass.
