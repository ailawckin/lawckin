# Test Data Seeding Guide

This guide explains how to seed and clean up test data for demo purposes.

## Prerequisites

1. **Environment Variables**: Add these to your `.env` file:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   > **Note**: You can also use `VITE_SUPABASE_URL` if `SUPABASE_URL` is not set.

2. **Install Dependencies**: Make sure `tsx` is installed:
   ```bash
   npm install
   ```

## Usage

### Seed Test Data

Creates test users, lawyer profiles, time slots, and consultations for demo purposes.

```bash
npm run seed:test
```

**What it creates:**
- 2 test lawyers with profiles and expertise
- 1 test client
- Time slots for lawyers (5 slots each over next 7 days)
- Sample consultations (pending and confirmed)

**Test Accounts:**
- `test+lawyer1@example.com` / `TestLawyer123!`
- `test+lawyer2@example.com` / `TestLawyer123!`
- `test+client1@example.com` / `TestClient123!`

All test data is tagged with email prefix `test+` for easy identification.

### Cleanup Test Data

Removes all test data created by the seed script.

```bash
npm run cleanup:test
```

**What it deletes:**
- All users with email prefix `test+`
- Associated profiles, lawyer profiles, expertise, specializations
- Time slots, consultations, and client search entries
- User roles

**Deletion Order:**
The cleanup script deletes data in the correct order to respect foreign key constraints:
1. Consultations
2. Time slots
3. Lawyer specializations
4. Lawyer expertise
5. Lawyer profiles
6. Client search entries
7. Profiles
8. User roles
9. Auth users (last)

## Safety

- Test data is identified by email prefix `test+` or metadata `test_batch_id: 'demo-seed-001'`
- Only data matching these patterns will be deleted
- Production data is never affected
- The scripts include error handling and validation

## Troubleshooting

**Error: "Missing Supabase credentials"**
- Ensure `.env` file exists in the project root
- Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- The service role key is required to bypass RLS policies

**Error: "tsx: command not found"**
- Run `npm install` to install dependencies
- `tsx` should be in `devDependencies`

**Error: "Permission denied" or RLS errors**
- Ensure you're using the **service role key**, not the anon key
- Service role key bypasses Row Level Security policies

**Test users already exist**
- The seed script will skip creating existing users
- Run `npm run cleanup:test` first if you want fresh data

## Notes

- Test data is minimal and deterministic for easy debugging
- All test users have predictable emails and passwords
- Time slots are created for the next 7 days
- Consultations are scheduled 2-3 days in the future
- The seed script reuses existing practice areas from your database

