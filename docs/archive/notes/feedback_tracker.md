# Feedback Tracker - Lawckin App

Last Updated: 2025-10-30

## Overview
This document tracks all known issues, missing features, incomplete implementations, and areas needing improvement in the Lawckin application. It serves as a live log to be updated as changes are made or new issues are discovered.

---

## 🔴 Critical Issues

### 1. Google Calendar OAuth Not Production-Ready
**Category:** Integration Problem  
**Description:** Google Calendar integration requires completing Google's verification process. Currently blocked with "Access blocked: app has not completed the Google verification process" for non-test users.  
**Suggested Fix:** Complete Google OAuth verification process in Google Cloud Console, or add users as test users during development.  
**Status:** Identified - Workaround implemented (add test users manually)

### 2. Security Definer View Detected
**Category:** Security  
**Description:** Database has views with SECURITY DEFINER property, which enforces permissions of view creator rather than querying user, potentially bypassing RLS policies.  
**Suggested Fix:** Review and update views to use SECURITY INVOKER or implement proper RLS policies. See: https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view  
**Status:** Pending

### 3. Leaked Password Protection Disabled
**Category:** Security  
**Description:** Password leak protection is currently disabled in authentication system, allowing users to use commonly compromised passwords.  
**Suggested Fix:** Enable leaked password protection in Supabase Auth settings. See: https://supabase.com/docs/guides/auth/password-security  
**Status:** Pending

### 4. ~~No Automatic Calendar Conflict Prevention~~ ✅ FIXED
**Category:** Logic Error  
**Description:** ~~Google Calendar sync exists but `check_calendar_conflicts` function is not integrated into time slot generation~~. Now integrated into booking flow.  
**Suggested Fix:** ~~Integrate `check_calendar_conflicts` into booking logic~~. Implemented in `book_time_slot` function.  
**Status:** Fixed - Calendar conflicts now checked during booking

### 5. ~~Race Condition - Double Booking~~ ✅ FIXED
**Category:** Logic Error  
**Description:** ~~No locking mechanism when booking consultations - multiple clients could book same slot~~. Now uses database-level locking.  
**Suggested Fix:** ~~Add transaction locking and unique constraints~~. Implemented `FOR UPDATE NOWAIT` and unique constraint on (lawyer_id, scheduled_at).  
**Status:** Fixed - Double booking now prevented at database level

### 6. ~~Incomplete Slot Cancellation~~ ✅ FIXED
**Category:** Logic Error  
**Description:** ~~Complex time range calculation for freeing slots could fail~~. Now uses atomic function with booking_id.  
**Suggested Fix:** ~~Use transaction wrapping and booking_id~~. Implemented new `cancel_consultation` function.  
**Status:** Fixed - Cancellation now atomic and reliable

---

## 🟡 Major Missing Features

### 5. Messaging System Not Implemented
**Category:** Missing Feature  
**Description:** ClientMessages component exists but has no functionality. No backend tables or real-time messaging infrastructure.  
**Suggested Fix:** 
- Create `messages` table with RLS policies
- Implement real-time subscriptions using Supabase Realtime
- Build message UI with send/receive functionality
- Add notifications for new messages  
**Status:** Pending

### 6. Payment Processing Not Integrated
**Category:** Missing Feature  
**Description:** Payment status tracked in consultations table but no actual payment gateway integration (Stripe, PayPal, etc.). No refund processing.  
**Suggested Fix:** 
- Integrate Stripe or similar payment processor
- Create edge function for payment processing
- Implement refund logic for cancelled consultations
- Add payment status webhooks  
**Status:** Pending

### 7. Review/Rating System Not Implemented
**Category:** Missing Feature  
**Description:** Database tracks ratings and reviews count, but no UI or backend logic for clients to leave reviews or rate lawyers.  
**Suggested Fix:** 
- Create `reviews` table
- Add review submission form after completed consultations
- Implement rating aggregation logic
- Display reviews on lawyer profiles  
**Status:** Pending

### 8. Admin Panel Incomplete
**Category:** Missing Feature  
**Description:** Multiple admin sections show "ComingSoon" placeholder:
- Users & Firms management
- Bookings & Payments overview
- Analytics dashboard
- Support system
- Settings management  
**Suggested Fix:** Implement each section progressively based on priority.  
**Status:** In Progress (Audit Log and Lawyer Review implemented)

### 9. Search and Filter Functionality Missing
**Category:** Missing Feature  
**Description:** No way to search or filter lawyers by specialty, location, rating, price range, or availability.  
**Suggested Fix:** 
- Add search bar with filters on /lawyers page
- Implement RPC function for advanced filtering
- Add sort options (rating, price, experience)  
**Status:** Pending

### 10. Notification System Incomplete
**Category:** Missing Feature  
**Description:** Edge function `send-consultation-notification` exists but:
- No in-app notification system
- Only email notifications (not fully tested)
- No notification preferences for users  
**Suggested Fix:** 
- Create `notifications` table
- Implement in-app notification UI with bell icon
- Add email/SMS notification preferences
- Mark notifications as read functionality  
**Status:** Pending

---

## 🟠 Medium Priority Issues

### 11. No Pagination on Lawyer Listings
**Category:** Performance Issue  
**Description:** All lawyers loaded at once on /lawyers page. Will cause performance issues with many lawyers.  
**Suggested Fix:** Implement pagination or infinite scroll with limit/offset queries.  
**Status:** Pending

### 12. No Real-Time Updates for Consultations
**Category:** Missing Feature  
**Description:** Consultation status changes don't update in real-time. Users must refresh to see updates.  
**Suggested Fix:** Implement Supabase Realtime subscriptions for consultations table.  
**Status:** Pending

### 13. Calendar Sync is Manual Only
**Category:** Integration Problem  
**Description:** Google Calendar sync requires manual "Sync Now" button click. No automatic periodic syncing.  
**Suggested Fix:** 
- Create cron job or scheduled edge function for periodic sync
- Implement background sync every 15-30 minutes  
**Status:** Pending

### 14. Limited Calendar Sync Window (14 days)
**Category:** Integration Problem  
**Description:** Calendar sync only fetches 14 days of events, limiting long-term booking availability.  
**Suggested Fix:** Extend sync window to 90+ days and make configurable per lawyer.  
**Status:** Pending

### 15. No Bidirectional Calendar Sync
**Category:** Missing Feature  
**Description:** Bookings made in Lawckin don't automatically create events in lawyer's Google Calendar.  
**Suggested Fix:** Implement calendar event creation in Google Calendar when consultation is booked.  
**Status:** Pending

### 16. Timezone Handling Partially Implemented
**Category:** Logic Error  
**Description:** Timezone column added to lawyer_profiles (defaults to America/New_York). Still needs UI for timezone selection and conversion logic.  
**Suggested Fix:** 
- ~~Store user timezone preferences~~ ✅ Database ready
- Display times in user's local timezone (needs implementation)
- Handle daylight saving time changes (needs implementation)  
**Status:** Partially Fixed - Database support added, UI and conversion logic pending

### 17. Avatar Upload Storage Bucket May Not Exist
**Category:** Bug  
**Description:** Code references 'avatars' storage bucket but it may not be created. Upload will fail.  
**Suggested Fix:** Create 'avatars' storage bucket with proper RLS policies in Supabase.  
**Status:** Pending

### 18. Profile Views Tracking Bug Potential
**Category:** Bug  
**Description:** `fetchProfileViews` in LawyerDashboard depends on `lawyerProfile.id` being set, but called before `lawyerProfile` is fetched, resulting in no views tracked.  
**Suggested Fix:** Ensure `fetchProfileViews` is called after `lawyerProfile` is loaded, or pass lawyer profile ID directly.  
**Status:** Pending

### 19. Hard-coded Fallback Images
**Category:** UI Issue  
**Description:** Multiple components use hard-coded Unsplash URLs as fallback images. Could break if URLs change.  
**Suggested Fix:** Host default avatar/profile images in project assets or Supabase storage.  
**Status:** Pending

### 20. "Send Message" Button Not Functional
**Category:** Bug  
**Description:** "Send Message" button on LawyerProfile page does nothing (no onClick handler or navigation).  
**Suggested Fix:** Implement messaging functionality or disable/hide button until messaging is ready.  
**Status:** Pending

---

## 🟢 Low Priority / Polish Issues

### 21. Missing Error Boundaries
**Category:** Missing Feature  
**Description:** No React Error Boundaries to catch and handle component errors gracefully.  
**Suggested Fix:** Add Error Boundary components at route level.  
**Status:** Pending

### 22. Inconsistent Loading States
**Category:** UI Issue  
**Description:** Some operations show loading states, others don't. Inconsistent user feedback.  
**Suggested Fix:** Audit all async operations and add consistent loading indicators.  
**Status:** Pending

### 23. No Form Validation in Some Forms
**Category:** Missing Feature  
**Description:** Some forms lack client-side validation (e.g., lawyer profile update form).  
**Suggested Fix:** Add Zod validation schemas for all forms, similar to Auth page.  
**Status:** Pending

### 24. Cancel Consultation Doesn't Handle Refunds
**Category:** Logic Error  
**Description:** Cancellation updates status but doesn't process refunds or update payment_status.  
**Suggested Fix:** Implement refund logic through payment gateway and update payment_status to 'refunded'.  
**Status:** Pending

### 25. No Dark Mode Toggle
**Category:** Missing Feature  
**Description:** Design system supports dark mode but no UI toggle for users to switch themes.  
**Suggested Fix:** Add theme toggle in header using next-themes package (already installed).  
**Status:** Pending

### 26. Schedule Manager UX Could Be Simpler
**Category:** UI Issue  
**Description:** Adding availability blocks requires manual date and time selection for each slot. No bulk operations.  
**Suggested Fix:** 
- Add "recurring availability" feature
- Copy/paste week templates
- Multi-day selection  
**Status:** Recently improved, but could be enhanced further

### 27. No Email Verification Flow
**Category:** Missing Feature  
**Description:** Auth is set to auto-confirm emails, but no proper verification flow for production use.  
**Suggested Fix:** Disable auto-confirm for production and implement email verification with resend option.  
**Status:** Pending (acceptable for development)

### 28. No Password Reset Functionality
**Category:** Missing Feature  
**Description:** Auth page has no "Forgot Password" link or reset flow.  
**Suggested Fix:** Add forgot password link and implement password reset flow with Supabase Auth.  
**Status:** Pending

### 29. Lawyer Onboarding Not Visible in Codebase
**Category:** Missing Feature  
**Description:** LawyerOnboarding.tsx exists but not reviewed. May be incomplete.  
**Suggested Fix:** Review and ensure all required fields are collected during onboarding.  
**Status:** Needs Review

### 30. Client Onboarding Not Visible in Codebase
**Category:** Missing Feature  
**Description:** ClientOnboarding.tsx exists but not reviewed. May be incomplete.  
**Suggested Fix:** Review and ensure proper client profile setup.  
**Status:** Needs Review

---

## 📋 Suggested Improvements

### 31. Add Audit Logging for Critical Actions
**Category:** Suggested Improvement  
**Description:** Only admin actions are logged. Should log lawyer and client critical actions too.  
**Suggested Fix:** Expand audit logging to consultation bookings, cancellations, profile updates.  
**Status:** Partial (Admin audit exists)

### 32. Implement Rate Limiting
**Category:** Security  
**Description:** No rate limiting on API calls or edge functions.  
**Suggested Fix:** Implement rate limiting using Supabase edge function middleware.  
**Status:** Pending

### 33. Add Analytics Tracking
**Category:** Suggested Improvement  
**Description:** No analytics for user behavior, popular lawyers, conversion rates.  
**Suggested Fix:** Integrate analytics service (Google Analytics, Mixpanel, or custom).  
**Status:** Pending

### 34. Optimize Database Queries
**Category:** Performance  
**Description:** Multiple sequential database queries in components (N+1 problem).  
**Suggested Fix:** Use database views or RPC functions to fetch related data in single query.  
**Status:** Partial (some RPC functions exist)

### 35. Add Comprehensive E2E Tests
**Category:** Testing  
**Description:** No visible test files in project.  
**Suggested Fix:** Add Playwright or Cypress E2E tests for critical user flows.  
**Status:** Pending

---

## 🔧 Technical Debt

### 36. Inconsistent Error Handling
**Category:** Code Quality  
**Description:** Error handling varies across components - some show toasts, some console.error, some do nothing.  
**Suggested Fix:** Standardize error handling with consistent toast notifications and logging.  
**Status:** Ongoing

### 37. Large Component Files
**Category:** Code Quality  
**Description:** LawyerDashboard.tsx is 813 lines. Should be broken into smaller components.  
**Suggested Fix:** Refactor into smaller, focused components (stats cards, consultation list, etc.).  
**Status:** Pending

### 38. Prop Drilling in Several Components
**Category:** Code Quality  
**Description:** Props passed through multiple component layers without context.  
**Suggested Fix:** Implement React Context for shared state (user, profile, consultations).  
**Status:** Pending

---

## ✅ Recently Completed

*(Items will be moved here as they are fixed)*

### Calendar Logic Critical Fixes - 2025-10-30
**Categories:** Bug Fixes, Security, Performance  
**Fixes Applied:**
1. **Double Booking Prevention:** Added `FOR UPDATE NOWAIT` locking in `book_time_slot` function
2. **Unique Constraint:** Added database constraint on (lawyer_id, scheduled_at) in consultations table
3. **Calendar Conflict Integration:** Integrated `check_calendar_conflicts` into booking flow
4. **Atomic Cancellation:** Created `cancel_consultation` function using booking_id for reliable slot freeing
5. **Timezone Support:** Added timezone column to lawyer_profiles (database ready, UI pending)
6. **Performance Index:** Added composite index on time_slots (lawyer_id, start_time, is_booked)  
**Impact:** Eliminated race conditions, prevented double booking, improved cancellation reliability  
**Completed:** 2025-10-30

### Schedule Manager UI Simplified
**Category:** UI Issue  
**Description:** Schedule creation and visualization was complex.  
**Fix Applied:** Simplified validation, improved layout, better empty states, hover actions.  
**Completed:** 2025-10-30

---

## 📝 Notes

- This tracker should be updated after each development session
- Priority levels may change based on user feedback and business needs
- Security issues should always be addressed before feature additions
- Focus on completing existing features before adding new ones

---

## How to Use This Tracker

1. **For Development:** Pick items based on priority (🔴 → 🟡 → 🟠 → 🟢)
2. **For Bug Reports:** Add new items under appropriate category
3. **After Fixes:** Move items to "Recently Completed" section with date
4. **For Planning:** Use this to estimate workload and sprint planning

