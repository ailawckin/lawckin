# Project Notes

This document tracks ongoing thoughts, decisions, and action items for the Lawckin platform development.

---

## [2025-11-03]

### Lawyer Recruitment & Platform Testing

**Strategy**: Leverage personal network for initial lawyer onboarding in New York market

**Action Items**:
- Request referrals from parents' friends for responsive New York-based lawyers
- Target criteria: lawyers who are known to be responsive to email communications
- Prepare and distribute platform questionnaire to gauge interest and gather requirements
- Focus on New York legal market as primary testing ground

**Next Steps**:
1. Draft lawyer questionnaire covering:
   - Practice areas and specialties
   - Current client acquisition methods
   - Interest in online consultation platform
   - Availability and scheduling preferences
   - Platform feature requirements/feedback
2. Compile list of potential lawyer contacts from family network
3. Send outreach emails with questionnaire attached
4. Track responses and follow-up for onboarding

**Context**: This represents initial manual recruitment effort to build critical mass of verified lawyers on the platform before broader marketing initiatives.

**Related**: Lawyer onboarding flow (`/onboarding/lawyer`), verification process, New York location filtering in `client_search` table

---

### Digital Platform Outreach for Lawyer Recruitment

**Strategy**: Expand lawyer recruitment beyond personal network using professional platforms and legal communities

**Target Platforms**:
- **LinkedIn**: Primary professional networking platform for lawyers
  - Search for lawyers by practice area, location (New York), and experience level
  - Join legal professional groups and communities
  - Direct messaging with personalized outreach
- **Legal Directories**: Avvo, Justia, FindLaw, Martindale-Hubbell
  - Identify active, well-reviewed lawyers
  - Contact information often publicly available
- **Bar Association Platforms**:
  - New York State Bar Association member directory
  - NYC Bar Association networks
  - Specialized bar associations by practice area
- **Professional Forums**:
  - Reddit legal communities (r/LawFirm, r/Lawyers)
  - Legal tech forums and communities
  - Law school alumni networks

**Outreach Strategy**:
1. Create professional LinkedIn profile highlighting Lawckin platform value proposition
2. Develop templated but personalized connection requests and messages
3. Emphasize benefits: flexible scheduling, new client acquisition, platform handles logistics
4. Include link to lawyer questionnaire and platform demo
5. Follow up with engaged contacts to schedule onboarding calls

**Action Items**:
- Draft LinkedIn outreach message template targeting solo practitioners and small firm lawyers
- Identify 50-100 target lawyers on LinkedIn matching criteria (NY-based, relevant practice areas)
- Set weekly outreach goals (e.g., 20 connection requests, 10 follow-up messages)
- Track response rates and conversion to platform sign-ups
- Refine messaging based on what resonates

**Key Messaging Points**:
- Modern clients expect online booking and consultation options
- Lawckin handles scheduling, reminders, and meeting logistics
- Verified platform increases credibility and discoverability
- No upfront costs, flexible participation model
- Early adopter advantage in growing platform

**Status**: Planned

**Related**: Complements personal network recruitment strategy, same onboarding flow and verification process

---

## [2025-11-04]

### ⚠️ CRITICAL: Email Verification Disabled for Development

**⚠️ PRODUCTION BLOCKER - MUST RE-ENABLE BEFORE LAUNCH ⚠️**

**Problem Identified**:
During testing, user signups were failing with rate limit errors. Root cause was email verification sending too many confirmation emails during rapid development/testing cycles, triggering Supabase's email rate limits.

**Temporary Solution Applied**:
Email verification has been **DISABLED** in Supabase Auth configuration to allow instant signups without requiring email confirmation. This enables faster development iteration and testing without hitting rate limits.

**Configuration Location**:
- **Supabase Dashboard** → Authentication → Email Auth Settings → "Enable email confirmations"
- Currently set to: **DISABLED**

**Why This Was Changed**:
- Development and testing require frequent account creation
- Email confirmation flow adds friction to rapid testing
- Rate limits were blocking legitimate development work
- Immediate signup flow allows faster iteration on onboarding flows

**⚠️ CRITICAL ACTION REQUIRED BEFORE PRODUCTION**:

**MUST RE-ENABLE EMAIL VERIFICATION** before:
1. Production launch
2. Beta testing with real users
3. Lawyer recruitment outreach
4. Any public-facing deployment

**Security & Business Implications**:
- Without email verification, users can sign up with any email address (including fake/invalid emails)
- No confirmation that user owns the email address
- Cannot reliably send consultation notifications or platform updates
- Potential for spam accounts and abuse
- Legal/compliance issues for a professional services platform

**Re-enablement Checklist**:
- [ ] Enable "Email confirmations" in Supabase Auth settings
- [ ] Test complete signup flow with email verification
- [ ] Verify confirmation emails are delivered (check spam folders)
- [ ] Test rate limits with realistic usage patterns
- [ ] Consider implementing email rate limit handling in production (exponential backoff, queuing)
- [ ] Update user onboarding messaging to expect confirmation email
- [ ] Add UI for "resend confirmation email" functionality

**Related Components**:
- Authentication flow (`/auth`)
- User registration in both client and lawyer flows
- `ProtectedRoute` component (may need to handle unverified users)
- Welcome page (`/welcome`)

**Future Consideration**:
For production, implement proper email rate limit handling:
- Queue confirmation emails during high-traffic periods
- Implement exponential backoff for retries
- Consider transactional email service (SendGrid, Postmark) for higher limits
- Add monitoring/alerting for email delivery failures

**Status**: ⚠️ TEMPORARY DEVELOPMENT CONFIGURATION - REVERT BEFORE PRODUCTION

---

### Lawyer Dashboard - Practice Area Expertise Enhancement

**Issue Identified**: Current inconsistencies in the lawyer dashboard's practice area expertise management functionality

**Problem Description**:
The lawyer dashboard currently has limitations in how lawyers can specify and manage their practice area expertise. The interface does not provide the same comprehensive categorization system that exists in the client-facing "Find Lawyer" modal.

**Current Limitations**:
- Lawyers cannot easily add multiple different practice areas to their profile
- No support for selecting specializations/subcategories within each practice area
- Missing the hierarchical practice area structure that already exists elsewhere in the platform

**Enhancement Requirements**:

1. **Multiple Practice Areas Support**
   - Enable lawyers to add and manage multiple distinct practice areas to their profile
   - Allow addition and removal of practice areas dynamically

2. **Specialization/Subcategory Selection**
   - Each main practice area should expose its associated specializations
   - These specializations are already defined and used in the "Find Lawyer" modal (`FindLawyerModal` component)
   - Implement expandable/collapsible interface for practice areas

3. **Desired User Experience**:
   - When lawyer selects or clicks on a main practice area, display its subcategories
   - Allow lawyer to toggle/select specific subcategories they specialize in
   - Support multiple subcategory selections per practice area
   - Display subcategories in **alphabetical order** for easy scanning

4. **Data Consistency**:
   - Ensure practice areas and specializations match those available in the client-facing "Find Lawyer" form
   - Maintain consistency between lawyer profile data and search/filtering logic
   - Reference the same data source/structure used in the "Find Lawyer" modal popup

**Technical Context**:
- Route: `/lawyer-dashboard`
- Related component: `FindLawyerModal` (contains existing practice area + specialization structure)
- Database table: `lawyer_profiles` (likely stores expertise data)
- Database table: `practice_areas` (defines available categories)

**Implementation Approach**:
- Extract or reference the practice area/specialization data structure from `FindLawyerModal`
- Create expandable UI component for hierarchical category selection
- Implement alphabetical sorting for subcategories
- Update lawyer profile data model to store multiple practice areas with selected specializations
- Ensure changes are reflected in search results and public lawyer profiles

**Priority**: Medium - Affects lawyer onboarding experience and profile completeness

**Status**: Identified - Ready for implementation

**Related**: Lawyer dashboard (`/lawyer-dashboard`), lawyer onboarding flow (`/onboarding/lawyer`), `FindLawyerModal` component, `practice_areas` table, `lawyer_profiles` table

---

## [2025-11-05]

### Calendar Integration Hardening

**Fixed Issues**
1. **OAuth state tampering risk**
   - Added server-side nonce validation
   - Created `oauth_nonces` table to store nonces with `lawyer_id` and `user_id`
   - Added `validate_oauth_nonce()` function to verify nonce and match `lawyer_id` to the authorized user
   - Nonces expire after 10 minutes and are one-time use
2. **OAuth callback redirect issue**
   - Added `APP_URL` environment variable support
   - Fallback chain: `APP_URL` → `Referer` header → `localhost:5173`
   - Prevents redirects to Supabase Functions domain
3. **External busy times show as available**
   - Integrated `check_calendar_conflicts` into `generate_time_slots_for_availability`
   - Slots are checked for conflicts before creation
   - Conflicted slots are never generated, preventing booking attempts
   - Added `regenerate_slots_excluding_conflicts()` function for manual regeneration
4. **Refresh token missing handling**
   - Added check for `refresh_token` existence before refresh attempt
   - If missing, connection status is set to `expired` with clear error message
   - Prevents infinite error loops
5. **Connection status not updated**
   - Sync function now updates status to `error` or `expired` on failures
   - UI shows all connection statuses with appropriate badges
   - Added “Reconnect” button for non-active connections
   - Sync button is disabled when no active connections exist

**Files Created/Modified**
- New migrations:
  - `supabase/migrations/20251105030000_fix_calendar_oauth_security.sql`
  - `supabase/migrations/20251105030100_integrate_calendar_conflicts_into_slots.sql`
- Updated functions:
  - `supabase/functions/google-calendar-auth/index.ts`
  - `supabase/functions/sync-calendar/index.ts`
- Updated UI:
  - `src/components/lawyer/CalendarIntegration.tsx`
- Documentation:
  - `CALENDAR_FIXES.md` (comprehensive documentation)

**Next Steps**
1. Apply the migrations to your database.
2. Set the `APP_URL` environment variable in Supabase Dashboard (Edge Functions → Settings).
3. Test the OAuth flow to ensure redirects work correctly.
4. Test calendar sync to verify status updates and conflict checking.

All fixes are complete and ready for deployment. The calendar integration is now more secure and handles edge cases properly.

---

### Next Steps for You
- Apply migrations:
  ```bash
  supabase db push
  ```
  *(or run the SQL files through the Supabase Dashboard SQL editor)*
- Set `APP_URL` in Supabase Dashboard:
  - Project Settings → Edge Functions → Settings
  - Add `APP_URL = https://your-domain.com`
  - Redeploy edge functions
- Regenerate types:
  ```bash
  ./scripts/regenerate-types.sh
  ```
  or manually:
  ```bash
  supabase gen types typescript --project-id zrnklcpgumwcswyxnumk --schema public > src/integrations/supabase/types.ts
  ```
- All code changes are on the `cursor` branch—see `DEPLOYMENT_STEPS.md` for more detail.
- Fix the Lawyer Dashboard expertise section:
  - Stop re-fetching expertise whenever `practiceAreaYears` changes (it causes an infinite loop and unnecessary Supabase reads).
  - Prevent `.in("name", formData.specialty)` when the array is empty to avoid Supabase errors on save.
  - Update the pie charts to reflect specializations/years (not just high-level practice areas) and make editing inline with the chart.
  - Add a dedicated save/validation flow for specialization edits so users know when their changes persist.

---

### Location Data Consistency (Follow-up)
- Surface the lawyer’s primary service location inside the dashboard so they can confirm what clients see.
- During lawyer onboarding, replace the free-form location input with a select populated from the same New York location tags used in the “Find Lawyer” flow—no custom values.
- Ensure the lawyer profile distinguishes between:
  1. The street/business address (for internal records or verification), and
  2. The public-facing service area (the selectable tag that powers search and filtering).
- Keep both fields in sync with search metadata so clients can confidently filter by borough/neighborhood.

---

### Matching Algorithm Improvements (To Do)
- Audit the current lawyer-matching flow (intake responses → search query) to ensure consistent use of practice area, location, budget, language, and meeting preferences.
- Add scoring/weighting so matches are ranked (e.g., exact practice area match + same borough > partial matches).
- Provide explainability (“matched because…”) so clients and admins can see why lawyers were surfaced.
- Write regression tests to ensure future changes don’t break matching consistency.

---

### Business Address Migration Enablement
To persist the internal street address, apply the new migration once you’re ready:

**Option A – Supabase Dashboard (recommended)**
1. Navigate to *Supabase Dashboard → SQL Editor*  
2. Create a new query and run:
   ```sql
   ALTER TABLE public.lawyer_profiles
     ADD COLUMN IF NOT EXISTS street_address TEXT;

   COMMENT ON COLUMN public.lawyer_profiles.location
     IS 'Primary service area visible to clients (e.g., "Manhattan", "Brooklyn"). Must match curated NY service areas.';

   COMMENT ON COLUMN public.lawyer_profiles.street_address
     IS 'Full business address for internal use only. Not displayed to clients.';
   ```

**Option B – Supabase CLI**
```bash
supabase db push
```

**Option C – Manual migration file**
Apply `supabase/migrations/20251105040000_add_street_address_to_lawyer_profiles.sql`.

After the migration, regenerate TypeScript types:
```bash
./scripts/regenerate-types.sh
# or
supabase gen types typescript --project-id zrnklcpgumwcswyxnumk --schema public > src/integrations/supabase/types.ts
```

**Status**
- UI gracefully handles the missing column until migration runs.
- Business address field is visible but won’t persist without the column.
- Once migration + type regen are complete, everything stores and reads correctly.

---

### Address Autocomplete Integration

**Changes**
1. Added `AddressAutocomplete` component (`src/components/ui/address-autocomplete.tsx`, new file) featuring:
   - Google Maps Places API integration with autocomplete as the user types
   - US-only suggestions biased toward New York
   - Standardized address formatting
   - Graceful handling when the API key is absent
2. Replaced plain text address fields with the autocomplete in both lawyer onboarding and dashboard flows so behavior stays consistent.

**Setup**
1. Generate a Google Maps Places API key via Google Cloud Console (enable the Places API, create key).
2. Add the key to your `.env`:
   ```bash
   VITE_GOOGLE_MAPS_API_KEY=your-api-key-here
   ```
3. Restart the dev server after updating env vars. See `GOOGLE_MAPS_SETUP.md` for full steps.

**Runtime Notes**
- Without an API key, the component shows a non-blocking warning.
- With a key, suggestions are biased to New York and only US addresses appear.
- The Google script loads once and is shared across usages; loading states are handled.

Once the key is present, autocomplete works automatically across onboarding and dashboard.

---

### Google Calendar Sync Status (Action Needed)
- OAuth + Supabase functions exist, but the Google Calendar sync still isn’t working end-to-end.
- Need to verify environment variables (`APP_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `SYNC_CRON_KEY`) and run through the full connect → sync → slot refresh flow with real credentials.
- Until validation is complete, Google Calendar events may not reliably block availability—plan for manual schedule oversight.
- **What’s left to fix**
  - **Issue:** Calendar OAuth connection still failing with `redirect_uri` errors
  - **Likely causes:**
    - Redirect URI mismatch in Google Cloud Console
    - OAuth consent screen not fully configured
    - Test user email not added (if consent screen is in testing mode)
  - **Quick fix checklist:**
    1. Google Cloud Console → Credentials → OAuth Client → ensure redirect URI is exactly  
       `https://wulalgwsehjjiczcatpo.supabase.co/functions/v1/google-calendar-auth?action=callback`
    2. OAuth consent screen → add your email to **Test users**
    3. Retry the flow in an incognito window after saving changes

---

### Questionnaire Fix (To Do)
- Review and fix the intake questionnaire flow (“Find Lawyer” modal and any follow-up forms).
- Ensure fields align with current data model (practice areas, locations, budgets).
- Validate inputs properly and confirm responses persist so downstream filters/search can rely on them.

---

## [2025-11-04 14:30]

### Lawyer Profile Edit - Location Input Enhancement

**Issue Identified**: Inconsistencies and usability issues in the lawyer profile edit functionality, specifically regarding location/address input

**Current Problems**:
- Location input field lacks intuitive address entry mechanism
- No visual feedback or validation for address accuracy
- Potential for inconsistent address formatting
- No geographic restriction enforcement for New York-only requirement

**Enhancement Requirements**:

1. **Map-Based Address Autocomplete**
   - Implement interactive map component for location input
   - Integrate address autocomplete functionality (Google Maps API or similar)
   - As user types address, display real-time suggestions
   - Allow selection from autocomplete dropdown to auto-populate address field
   - Visual map representation of selected location for confirmation

2. **Geographic Restriction to New York**
   - **CRITICAL**: Platform scope is New York-only legal services
   - Implement strict validation to only accept New York addresses
   - Restrict autocomplete suggestions to New York state locations
   - Validate selected address against New York boundaries
   - Display clear error message if non-New York address is attempted
   - Ensure consistency with `client_search` table's `ny_location` field

3. **Address Standardization**
   - Autocomplete ensures addresses are formatted consistently
   - Geocoding provides standardized address components (street, city, state, ZIP)
   - Store structured address data for reliable filtering and search
   - Improves data quality across lawyer profiles

**Technical Implementation Considerations**:
- Integrate address autocomplete library (e.g., Google Places API, Mapbox Geocoding)
- Configure API to restrict results to New York state boundaries
- Add visual map component for address confirmation (optional but recommended)
- Update `lawyer_profiles` table schema if needed to store geocoded data (latitude/longitude)
- Ensure mobile-responsive map/autocomplete interface
- Handle edge cases: P.O. boxes, multiple office locations, etc.

**User Experience Flow**:
1. Lawyer clicks on location/address field in profile edit
2. Interactive map displays (optional) or autocomplete activates
3. User begins typing address
4. Autocomplete suggests New York addresses only
5. User selects from suggestions
6. Address auto-populates in standardized format
7. Visual confirmation of location (if map enabled)
8. Validation ensures address is within New York before save

**Related Issues**:
- Part of broader lawyer profile edit inconsistencies that need review
- Ties into geographic filtering for client search functionality
- Ensures compliance with platform's New York market focus

**Priority**: Medium-High - Affects lawyer onboarding quality and profile data accuracy

**Status**: Identified - Ready for design and implementation planning

**Related**: Lawyer dashboard (`/lawyer-dashboard`), lawyer profile edit interface, `lawyer_profiles` table (`ny_location` field), `client_search` table (`ny_location` filtering), onboarding flow (`/onboarding/lawyer`)

---

## [2025-11-04 14:45]

### Lawyer Profile Edit - Duplicate Save Buttons & Pricing Structure Issues

**Issue Identified**: UI inconsistencies and confusing pricing structure in the lawyer profile edit interface

**Problems**:

1. **Duplicate Save Buttons Confusion**
   - Two buttons exist on the profile edit page: "Update Profile" and "Save Changes"
   - Unclear distinction between the two buttons
   - Confusing user experience - which button should be used and when?
   - Likely both perform the same action, causing redundancy
   - **Recommendation**: Consolidate into a single, clearly labeled save button

2. **Pricing Structure Needs Separation**
   - Current pricing model lacks clarity between different service types
   - Need to distinguish between two types of pricing:
     - **Hourly Rate**: Standard hourly billing rate for ongoing legal work
     - **Consultation Price**: One-time fee for initial consultation booking
   - These should be displayed as separate, distinct fields
   - Different pricing models serve different purposes and client expectations

3. **Free Consultation Option**
   - Platform should support lawyers offering free initial consultations
   - "Consultation Price" field must allow for $0 or "Free" option
   - This is a common legal industry practice used to attract new clients
   - UI should clearly indicate when consultation is free (not just blank/empty)

**Enhancement Requirements**:

1. **Consolidate Save Buttons**
   - Remove duplicate button implementation
   - Keep single "Save Changes" button (or "Update Profile" - choose one consistent label)
   - Place button in prominent, logical position (typically bottom of form)
   - Ensure button saves all profile changes in one transaction

2. **Restructure Pricing Fields**
   - Create two distinct pricing sections in the profile edit form:
     - **Hourly Rate** section
       - Label: "Hourly Rate ($)" or "Standard Hourly Rate"
       - Description: "Your standard billing rate for ongoing legal work"
       - Required field (or optional, depending on business model)
     - **Consultation Price** section
       - Label: "Initial Consultation Price ($)" or "Consultation Fee"
       - Description: "One-time fee for initial consultation (can be free)"
       - Support for $0/free option
       - Clear indication when set to free

3. **Free Consultation Handling**
   - Add checkbox or toggle: "Offer Free Initial Consultation"
   - When checked, consultation price field becomes disabled and shows "$0" or "Free"
   - Alternatively, allow text input to be "0" or blank, but display as "Free" in UI
   - Ensure free consultations are clearly marked in lawyer profile listings and search results
   - Database field should handle NULL or 0 for free consultations

**Technical Implementation Notes**:
- Update lawyer profile edit form component
- Modify `lawyer_profiles` table schema if needed to separate fields:
  - Existing: `consultation_rate` or similar field
  - May need: separate `hourly_rate` and `consultation_price` columns
- Update validation logic to allow $0 for consultations
- Ensure public lawyer profile displays both rates clearly
- Update consultation booking flow to handle free consultations (skip payment step)

**User Experience Considerations**:
- Clear visual distinction between hourly rate and consultation price
- Tooltip or help text explaining the difference
- Free consultation should be a positive marketing point in lawyer listings
- Consider displaying "Free Initial Consultation" badge in search results

**Priority**: Medium - Affects lawyer profile UX and pricing transparency

**Status**: Identified - Ready for implementation

**Related**: Lawyer dashboard (`/lawyer-dashboard`), lawyer profile edit interface, `lawyer_profiles` table, consultation booking flow (`/book-consultation/:lawyerId`), lawyer public profiles (`/lawyers/:id`)

---

## [2025-11-04 15:00]

### Lawyer Verification Status - Persistent Warning & Workflow Issues

**Issue Identified**: Critical problems with lawyer verification status messaging and workflow integration

**Problems**:

1. **Persistent Unverified Warning Message**
   - Lawyer profiles consistently display "Not Verified" / "Unverified" warning message
   - Warning states: "Your profile is not visible in search results until verified"
   - Message persists even after lawyer completes their full profile
   - Creates confusion and frustration for lawyers who have completed onboarding
   - No clear indication of what additional steps are required for verification

2. **Profile Completion Does Not Trigger Verification**
   - Completing all profile fields does not change verification status
   - Verification status remains unchanged regardless of profile completeness
   - Disconnect between profile completion percentage and verification state
   - No automatic progression in verification workflow after profile completion

3. **Verification Workflow Timing Issue**
   - **Current workflow** (per CLAUDE.md):
     - Lawyer completes onboarding → Uploads documents → Admin manually reviews → Admin sets verification status → Profile becomes visible in search
   - **Problem**: Verification should occur earlier in the process
   - **User expectation**: Verification should be handled automatically at profile creation
   - Manual admin verification creates bottleneck and delays lawyer visibility
   - Not scalable for lawyer recruitment and growth

**Root Cause Analysis**:

The current implementation separates verification from profile creation, requiring manual admin intervention. The `lawyer_profiles` table has two relevant fields:
- `verification_status` - Current status of verification process
- `verified` (boolean) - Whether lawyer is verified and searchable

These fields are likely not being set automatically during profile creation/completion, causing the persistent warning message.

**Enhancement Requirements**:

1. **Automatic Verification at Profile Creation**
   - Set initial verification status when lawyer profile is created
   - Consider automatic verification for completed profiles (pending business decision on what constitutes "verified")
   - Remove dependency on manual admin verification for basic profile visibility

2. **Clear Verification Status Feedback**
   - Update UI to accurately reflect current verification status
   - Remove "unverified" warning when profile is completed and meets verification criteria
   - Provide clear checklist of what's required for verification if not automatic
   - Show progress indicators if verification is pending admin review

3. **Conditional Verification Requirements**
   - Determine business logic: What qualifies a lawyer for automatic verification?
     - Profile completion only?
     - Document upload required?
     - Manual admin review always required?
   - Implement tiered verification: "Profile Complete" vs "Admin Verified" vs "Document Verified"

4. **Database & Logic Updates**
   - Update profile creation logic to set appropriate verification status
   - Modify `verification_status` field on profile completion
   - Set `verified` boolean based on defined criteria
   - Ensure search results query respects updated verification logic

**Technical Context**:
- **Tables**: `lawyer_profiles` (`verification_status`, `verified` fields)
- **Routes**: `/onboarding/lawyer`, `/lawyer-dashboard`
- **Components**: Lawyer profile edit interface, profile completion tracking
- **Search Logic**: Lawyer directory and search results filtering by verification status

**Business Decision Required**:
Determine verification strategy:
- **Option A**: Auto-verify on profile completion (fastest, enables rapid lawyer recruitment)
- **Option B**: Auto-verify with document upload (moderate security)
- **Option C**: Maintain manual admin review but fix UI messaging (current intent, but broken)
- **Recommendation**: Hybrid approach - auto-verify profile completion, flag for admin review later if needed

**Priority**: High - Blocks lawyer recruitment efforts and creates negative onboarding experience

**Status**: Identified - Requires business decision on verification strategy, then technical implementation

**Related**: Lawyer onboarding flow (`/onboarding/lawyer`), lawyer dashboard (`/lawyer-dashboard`), `lawyer_profiles` table, admin verification panel (`/admin`), search results filtering, lawyer directory (`/lawyers`)

---

## [2025-11-07]

### Testimonials Section - Future Enhancement

**Status**: Removed from home page for now, to be added later

**Planned Content**:
- Section title: "What Our Clients Say"
- Subtitle: "Real experiences from clients who found their perfect lawyer"
- Three testimonial cards with:
  1. Sarah M. - Family Law Client
     - "Found an excellent family law attorney within minutes. The booking process was seamless and the lawyer was incredibly knowledgeable."
  2. James D. - Business Law Client
     - "As a small business owner, I needed quick legal advice. Lawckin connected me with a business attorney who understood my needs immediately."
  3. Maria R. - Real Estate Client
     - "The transparency in pricing and lawyer profiles helped me make an informed decision. Highly recommend Lawckin!"

**Implementation Notes**:
- Each testimonial should include 5-star rating display
- Quote icon for visual appeal
- Client initials in circular avatar
- Client name and practice area
- Section should be placed between Practice Areas and FAQ sections
- Use `Card` components with `bg-background` styling
- Grid layout: 1 column on mobile, 3 columns on desktop

**Priority**: Low - Can be added once platform has real client testimonials

**Status**: Planned for future implementation
