# Debug Admin Access Issue

The redirect from `/admin` to `/` means `ProtectedRoute` isn't finding your admin role. Let's debug this:

## Step 1: Verify Admin Role Exists

Run this in Supabase SQL Editor:

```sql
-- Check if you have admin role
SELECT 
  ur.*,
  u.email,
  u.id as user_id
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE u.email = 'YOUR_EMAIL@example.com';
```

**Expected:** Should show a row with `role = 'admin'`

If you don't see it, add it again:

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'YOUR_EMAIL@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

## Step 2: Check RLS Policies

The query might be blocked by Row Level Security. Check:

```sql
-- See what roles you can see (as authenticated user)
SELECT * FROM public.user_roles WHERE user_id = auth.uid();
```

If this returns nothing, RLS might be blocking. Try this:

```sql
-- Check if you can see your own role
SELECT role FROM public.user_roles 
WHERE user_id = auth.uid() 
AND role = 'admin';
```

## Step 3: Sign Out and Back In

After adding the role:
1. **Sign out** completely
2. **Clear browser cache/localStorage** (optional but recommended)
3. **Sign back in**
4. **Try `/admin` again**

## Step 4: Check Browser Console

Open browser DevTools (F12) → Console tab, and look for:
- Any errors when loading `/admin`
- Network requests to `user_roles` table
- Check if the query is returning data

## Step 5: Test with Service Role (Temporary)

If RLS is the issue, you can temporarily disable it for testing:

```sql
-- TEMPORARY: Disable RLS on user_roles (for testing only!)
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;
```

**⚠️ Re-enable after testing:**
```sql
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
```

## Step 6: Add Debug Logging

Let me create a script to help debug what's happening in the browser.

