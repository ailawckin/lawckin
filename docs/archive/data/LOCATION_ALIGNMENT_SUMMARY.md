# Location Data Alignment Summary

## Overview
Aligned lawyer location data across onboarding, dashboard, and client search to use only curated New York service areas.

## Changes Made

### 1. Shared Location Constants
**File:** `src/lib/nyLocations.ts` (NEW)
- Created centralized module with curated NY service areas
- Matches the list from `FindLawyerModal`
- Includes validation helper functions
- Prevents custom/unlisted locations

**NY Service Areas:**
- Manhattan
- Brooklyn
- Queens
- Bronx
- Staten Island
- Long Island (Nassau / Suffolk)
- Westchester
- Upstate NY
- Remote / Anywhere in NY

### 2. Lawyer Onboarding Updates
**File:** `src/pages/LawyerOnboarding.tsx`

**Changes:**
- Replaced free-text location input with dropdown select
- Uses `NY_SERVICE_AREAS` from shared module
- Added separate `streetAddress` field for internal business address
- Service location is now required (step 5)
- Validates location before submission
- Stores service location in `location` field (client-facing)
- Stores business address in `street_address` field (internal use)

**UI Changes:**
- Step 5 now shows:
  - Service Area dropdown (required, client-facing)
  - Business Address input (optional, internal use only)
  - Clear labels explaining which field is visible to clients

### 3. Lawyer Dashboard Updates
**File:** `src/pages/LawyerDashboard.tsx`

**Changes:**
- Replaced free-text location input with dropdown select
- Uses `NY_SERVICE_AREAS` from shared module
- Added separate `street_address` field for business address
- Displays both service area (read-only badge) and business address (editable)
- Validates location selection before saving
- Updates both `location` and `ny_locations` array for consistency
- Uses `getPrimaryServiceArea()` helper for backward compatibility

**UI Changes:**
- Profile form shows:
  - Service Area (Client-Facing) - dropdown select
  - Business Address (Internal Use Only) - text input
  - Clear labels indicating which field clients see

### 4. Find Lawyer Modal Updates
**File:** `src/components/FindLawyerModal.tsx`

**Changes:**
- Now uses `NY_SERVICE_AREAS` from shared module
- Ensures consistency with onboarding options
- Removed hardcoded location list

### 5. Database Migration
**File:** `supabase/migrations/20251105040000_add_street_address_to_lawyer_profiles.sql` (NEW)

**Changes:**
- Added `street_address TEXT` column to `lawyer_profiles` table
- Added column comments explaining field usage
- `location` field: Client-facing service area
- `street_address` field: Internal business address

## Data Flow

### Onboarding Flow:
1. User selects service area from dropdown (required)
2. User optionally enters business address
3. Both values saved to `lawyer_profiles`:
   - `location` = service area (client-facing)
   - `ny_locations` = [service area] (array format)
   - `street_address` = business address (internal)

### Dashboard Flow:
1. Loads existing `location` value (or derives from `ny_locations`)
2. Displays service area in dropdown (read-only for display, editable via dropdown)
3. Displays business address in text input
4. Validates service area is from curated list before saving
5. Updates both `location` and `ny_locations` array

### Client Search Flow:
1. Uses same `NY_SERVICE_AREAS` list
2. Matches lawyers by `location` or `ny_locations` array
3. Only shows curated service areas to clients

## Validation

### Onboarding:
- Service area selection is required (step 5 disabled until selected)
- Validates location is from curated list before submission
- Business address is optional

### Dashboard:
- Validates location is from curated list before saving
- Shows error toast if invalid location attempted
- Prevents saving custom/unlisted locations

## Backward Compatibility

- Existing lawyers with custom locations in `location` field:
  - `getPrimaryServiceArea()` helper attempts to match existing values
  - Falls back gracefully if no match found
  - Lawyers can update to valid service area via dashboard

- `ny_locations` array is kept in sync with `location` field
- Both fields updated together for consistency

## Files Modified

1. **New Files:**
   - `src/lib/nyLocations.ts` - Shared location constants
   - `supabase/migrations/20251105040000_add_street_address_to_lawyer_profiles.sql` - Database migration

2. **Modified Files:**
   - `src/pages/LawyerOnboarding.tsx` - Location dropdown + business address
   - `src/pages/LawyerDashboard.tsx` - Location dropdown + business address display
   - `src/components/FindLawyerModal.tsx` - Uses shared constants

## Testing Checklist

- [ ] Onboarding: Service area dropdown shows all NY service areas
- [ ] Onboarding: Can select service area and proceed
- [ ] Onboarding: Business address is optional
- [ ] Onboarding: Cannot submit without service area
- [ ] Dashboard: Service area dropdown shows current value
- [ ] Dashboard: Can update service area
- [ ] Dashboard: Business address field works
- [ ] Dashboard: Cannot save invalid location
- [ ] Client search: Uses same location list
- [ ] Database: Migration applies successfully
- [ ] Backward compatibility: Existing locations handled gracefully

## Next Steps

1. Apply database migration: `supabase/migrations/20251105040000_add_street_address_to_lawyer_profiles.sql`
2. Test onboarding flow with new location dropdown
3. Test dashboard location updates
4. Verify client search matches correctly
5. Consider data migration for existing lawyers with custom locations

