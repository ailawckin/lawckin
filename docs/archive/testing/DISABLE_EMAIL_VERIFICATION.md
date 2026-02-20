# Disable Email Verification for Testing

## Quick Steps

1. **Go to Supabase Dashboard**
   - https://supabase.com/dashboard
   - Select your project

2. **Navigate to Authentication Settings**
   - Click **Authentication** in the left sidebar
   - Click **Providers** (or go directly to **Email**)

3. **Disable Email Confirmation**
   - Find **"Email"** provider
   - Toggle OFF **"Confirm email"** (or "Enable email confirmations")
   - The toggle should be **OFF/GRAY**

4. **Save Changes**
   - Click **Save** if there's a save button
   - Or changes might auto-save

## That's It!

After disabling email confirmation:
- ✅ Users will be signed in immediately after signup
- ✅ No email confirmation required
- ✅ Can use any email (even fake ones like `test@test.com`)
- ✅ Perfect for development and testing

## Re-enable for Production

⚠️ **IMPORTANT:** Before going to production, you MUST re-enable email verification for security!

