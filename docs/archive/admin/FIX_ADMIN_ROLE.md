# Fix Admin Role Access Issue

Your user ID is: `a6c35236-6540-421e-bf1e-4e03c6a1688d`

## Step 1: Verify Role Exists

Run this in Supabase SQL Editor:

```sql
-- Check if admin role exists for your user
SELECT 
  ur.*,
  u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.user_id = 'a6c35236-6540-421e-bf1e-4e03c6a1688d';
```

**If this returns nothing**, the role doesn't exist. Go to Step 2.

**If this returns a row**, but `role` is not `'admin'`, you need to add/update it.

## Step 2: Add Admin Role

Run this in Supabase SQL Editor:

```sql
-- Add admin role (will work even if role already exists)
INSERT INTO public.user_roles (user_id, role)
VALUES ('a6c35236-6540-421e-bf1e-4e03c6a1688d', 'admin'::app_role)
ON CONFLICT (user_id, role) DO NOTHING
RETURNING *;
```

## Step 3: Check RLS Policies

The query might be blocked by Row Level Security. Test this:

```sql
-- Test query as your user (this simulates what the app does)
SELECT role 
FROM public.user_roles 
WHERE user_id = 'a6c35236-6540-421e-bf1e-4e03c6a1688d'
AND role = 'admin';
```

If this returns nothing, RLS might be blocking. Check the policies:

```sql
-- View RLS policies on user_roles
SELECT 
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'user_roles';
```

## Step 4: Verify Your User Exists

```sql
-- Make sure your user exists
SELECT id, email, created_at 
FROM auth.users 
WHERE id = 'a6c35236-6540-421e-bf1e-4e03c6a1688d';
```

## Step 5: After Adding Role

1. **Sign out** completely from your app
2. **Clear browser cache** (optional but recommended)
3. **Sign back in**
4. **Try `/admin` again**

The console should now show:
```
Role check: { requireRole: "admin", roleData: { role: "admin" }, user_id: "..." }
```

