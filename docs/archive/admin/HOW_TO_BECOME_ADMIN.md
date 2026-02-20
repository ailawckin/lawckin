# How to Become an Admin and Approve Lawyers

## Step 1: Make Yourself an Admin

You need to add the "admin" role to your user account. Here are two ways:

### Option A: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

3. **Run this SQL** (replace `YOUR_USER_EMAIL` with your actual email):

```sql
-- Get your user ID first
SELECT id, email FROM auth.users WHERE email = 'YOUR_USER_EMAIL';

-- Then add admin role (replace USER_ID with the ID from above)
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
```

**Or do it in one step** (if you know your email):

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'YOUR_USER_EMAIL'
ON CONFLICT (user_id, role) DO NOTHING;
```

4. **Verify it worked:**
```sql
SELECT ur.*, u.email
FROM public.user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

You should see your email in the results.

### Option B: Using Supabase CLI

If you have the service role key, you can use the import script or create a temporary script:

```javascript
// make-admin.js
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Get your user ID
const { data: { user } } = await supabase.auth.admin.getUserByEmail('YOUR_EMAIL@example.com');

if (user) {
  // Add admin role
  const { error } = await supabase
    .from('user_roles')
    .insert({ user_id: user.id, role: 'admin' });
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Admin role added!');
  }
}
```

---

## Step 2: Access the Admin Page

1. **Sign out** of your current session (if logged in)
2. **Sign in again** (this refreshes your role)
3. **Go to:** `http://localhost:8081/admin` (or your dev URL)

Or just navigate to `/admin` in your browser.

---

## Step 3: Approve Lawyers

Once you're in the admin panel:

1. **Click on "Lawyers"** in the sidebar (or go to `/admin/lawyers`)
2. You'll see a list of **pending lawyers** waiting for approval
3. For each lawyer:
   - Review their information
   - Click **"Approve"** to verify them
   - Or **"Reject"** to decline their application

---

## Quick SQL to Make Yourself Admin

**Run this in Supabase SQL Editor** (replace with your email):

```sql
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'your-email@example.com'
ON CONFLICT (user_id, role) DO NOTHING;
```

Then sign out and sign back in, and navigate to `/admin`!

---

## Admin Page Routes

- `/admin` - Overview dashboard
- `/admin/lawyers` - **Approve/reject lawyers** ← This is what you need!
- `/admin/users` - Manage users and firms
- `/admin/bookings` - View all bookings
- `/admin/analytics` - Platform analytics
- `/admin/support` - Support tickets
- `/admin/settings` - Platform settings
- `/admin/audit` - Audit log

---

## Troubleshooting

### "Access denied" or redirected to home
- Make sure you added the admin role correctly
- Sign out and sign back in
- Check your user ID matches in the database

### No pending lawyers showing
- Lawyers need to complete onboarding first
- Their `verification_status` should be `'pending'`
- Check `lawyer_profiles` table in Supabase

### Can't see admin page
- Verify role in database: `SELECT * FROM user_roles WHERE user_id = 'YOUR_USER_ID'`
- Check browser console for errors
- Make sure you're signed in

---

That's it! Once you're an admin, you can approve lawyers at `/admin/lawyers` 🎉

