# How to Add SYNC_CRON_KEY

## Step-by-Step Instructions

### Step 1: Generate a Secure Key

First, generate a random secure key using one of these methods:

**Option 1: Using OpenSSL (Recommended)**
```bash
openssl rand -hex 32
```

**Option 2: Using Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 3: Using Python**
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

**Example output:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
```

**Copy this key** - you'll need it in the next steps!

---

### Step 2: Add to Supabase Dashboard

1. **Go to your Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard
   - Select your project

2. **Navigate to Edge Functions Settings**
   - In the left sidebar, click **"Edge Functions"**
   - Click on **"Settings"** (or the gear icon)

3. **Find Environment Variables Section**
   - Scroll down to find **"Environment Variables"** or **"Secrets"** section
   - This is where you add environment variables for your Edge Functions

4. **Add the New Variable**
   - Click **"Add new secret"** or **"Add variable"** button
   - **Name:** `SYNC_CRON_KEY`
   - **Value:** Paste the key you generated in Step 1
   - Click **"Save"** or **"Add"**

---

### Step 3: Verify It's Set

After adding, you should see `SYNC_CRON_KEY` in your environment variables list.

**Important Notes:**
- ✅ The key is stored securely and encrypted
- ✅ It's only accessible to Edge Functions (not visible in client code)
- ✅ Never commit this key to git
- ✅ Use the same key in your cron service configuration

---

### Step 4: Use in Cron Service

When setting up your cron job (e.g., cron-job.org), use this key:

**In the Authorization Header:**
```
Authorization: Bearer YOUR_SYNC_CRON_KEY
```

Replace `YOUR_SYNC_CRON_KEY` with the actual key you generated.

---

## Visual Guide

```
Supabase Dashboard
├── Your Project
    ├── Edge Functions (left sidebar)
        ├── Settings
            └── Environment Variables / Secrets
                └── Add: SYNC_CRON_KEY = [your-generated-key]
```

---

## Troubleshooting

### Can't Find Environment Variables Section?
- Make sure you're in **Edge Functions** → **Settings**
- Some projects might call it "Secrets" instead of "Environment Variables"
- Look for a section related to function configuration

### Key Not Working?
- Verify there are no extra spaces or newlines in the key
- Make sure you copied the entire key (64 characters for hex-32)
- Check that you're using the same key in both Supabase and your cron service

### Need to Rotate the Key?
1. Generate a new key
2. Update it in Supabase Dashboard
3. Update it in your cron service configuration
4. Old key will stop working immediately

---

## Security Best Practices

1. **Generate a strong key** - Use at least 32 bytes (64 hex characters)
2. **Keep it secret** - Never commit to git or share publicly
3. **Rotate periodically** - Change the key every 6-12 months
4. **Use different keys** - Use separate keys for dev/staging/production if you have multiple environments

---

## Quick Reference

**Where:** Supabase Dashboard → Edge Functions → Settings → Environment Variables  
**Name:** `SYNC_CRON_KEY`  
**Value:** Random 64-character hex string  
**Used by:** `sync-calendar` and `scheduled-sync-calendar` Edge Functions

