# Database Operations Checklist

## Backups
- [ ] Automated daily backups enabled in Supabase.
- [ ] Retention window meets business requirement (>= 7 days minimum).
- [ ] Monthly backup restore test performed in non-prod.
- [ ] Backup ownership and escalation contact defined.

## PITR (Point-in-Time Recovery)
- [ ] PITR enabled for production project.
- [ ] Recovery target objective (RTO) documented.
- [ ] Recovery point objective (RPO) documented.
- [ ] PITR dry-run executed quarterly.

## Migration Discipline
- [ ] All schema changes committed under `supabase/migrations/`.
- [ ] No direct schema edits in dashboard for production.
- [ ] Each migration includes:
  - [ ] forward SQL
  - [ ] rollback notes
  - [ ] risk notes for locks/long-running statements
- [ ] `supabase db push` executed in staging before production.
- [ ] Regenerate TS types after schema change.

## Change Safety
- [ ] Large/index-heavy migrations run in low-traffic windows.
- [ ] Backfill jobs are chunked and resumable.
- [ ] Query plans reviewed for new RPC or index changes.

## Access Control
- [ ] Service-role key is never used in frontend.
- [ ] RLS policies reviewed for new tables/functions.
- [ ] Admin actions audited (actor, timestamp, action, target).
