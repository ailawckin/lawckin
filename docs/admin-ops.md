# Admin Operations

This guide covers admin access and common troubleshooting.

## Granting Admin Role

Run in Supabase SQL Editor (replace email):

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

Then sign out and sign back in to refresh the session.

## Verify Admin Role

```sql
SELECT ur.*, u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

## Admin Routes

- `/admin` — Overview
- `/admin/lawyers` — Approve/reject lawyers
- `/admin/users` — Manage users & firms
- `/admin/bookings` — Bookings overview
- `/admin/analytics` — Analytics
- `/admin/support` — Support
- `/admin/settings` — Platform settings
- `/admin/audit` — Audit log

## Troubleshooting

### Access denied or redirected
- Ensure your admin role exists in `user_roles`.
- Sign out/in to refresh JWT.
- Confirm RLS policies allow role lookup for the current user.

### No pending lawyers showing
- Lawyer profiles must have `verification_status = 'pending'`.

