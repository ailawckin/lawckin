# Comprehensive TODO (Priority-Ordered)

## CRITICAL
1. **Integrate Stripe payment processing** (≈3 days)  
   - Add `payment_transactions` table, payment intent Edge Function, webhook handler.  
   - Build payment UI inside `BookConsultation` and refund logic tied to cancellations.
2. **Complete messaging system** (≈1–2 days)  
   - Ensure conversations/messages tables exist; add real-time subscriptions, notifications, and end-to-end send/receive flow.
3. **Display reviews on lawyer profiles** (≈4 hours)  
   - Leverage existing reviews table; update `LawyerProfile.tsx` with paginated review list showing reviewer names.
4. **Enable email verification** (≈20 min)  
   - Re-enable Supabase email confirmations, add `UnverifiedEmailBanner`, and test full verification flow.

## HIGH
1. **Generate video meeting links** (≈4 hours)  
   - Auto-create Zoom/Google Meet links when consultations are booked; store in `meeting_link` and include in confirmations.
2. **Fix Google Calendar OAuth connection** (≈1 hour)  
   - Resolve `redirect_uri` mismatch, update consent screen test users, verify Edge Function logs.
3. **Complete admin Bookings & Payments** (≈3 hours)  
   - Wire component to real data, add filtering/search, payment status tracking, export capability.
4. **Complete admin Analytics dashboard** (≈2 hours)  
   - Replace placeholder stats with real consultation/lawyer data plus date-range filtering and revenue metrics.
5. **Enhance lawyer search/filtering** (≈2 hours)  
   - Add filters for practice area, location, price range, rating, availability, plus sort options.
6. **Add pagination to lawyer listings** (≈1 hour)  
   - Implement pagination or infinite scroll on `/lawyers` using limit/offset queries.

## MEDIUM
1. **Add cancellation confirmation dialogs** (≈20 min)  
   - Use `AlertDialog` before cancelling consultations, include refund policy reminder.
2. **Add comprehensive form validation** (≈30 min)  
   - Apply Zod schemas + real-time validation to all major forms; include error messages and counters.
3. **Implement React error boundaries** (≈30 min)  
   - Create an `ErrorBoundary` component at route level for graceful fallback UI.
4. **Standardize loading states** (≈30 min)  
   - Add Skeletons/spinners consistently across pages during data fetches.
5. **Remove debug console statements** (≈15 min)  
   - Clean up ~28 `console.log` / `console.error` calls; keep structured logging only where needed.
6. **Fix TypeScript type safety** (≈1 hour)  
   - Replace `any` usage, ensure API responses are fully typed.
7. **Standardize date/time formatting** (≈30 min)  
   - Use shared date-fns helpers and timezone-aware format strings across components.

## LOW
1. **Improve accessibility** (≈30 min)  
   - Add ARIA labels, keyboard navigation, focus states, and screen reader support.
2. **Build in-app notification system** (≈1 day)  
   - Create `notifications` table, bell icon UI, mark-as-read flow, and preference settings.
3. **Fix profile views tracking bug** (≈15 min)  
   - Ensure `fetchProfileViews` runs after `lawyerProfile` loads and passes the ID explicitly.
4. **Create avatars storage bucket** (≈20 min)  
   - Set up Supabase `avatars` bucket with RLS policies; verify uploads.
5. **Replace hard-coded Unsplash URLs** (≈30 min)  
   - Host default images locally or in Supabase storage and reference them consistently.
6. **Fix "Send Message" button on LawyerProfile** (≈15 min)  
   - Wire the button to messaging (or disable until ready) instead of leaving it inert.
7. **Set up scheduled calendar syncs** (≈1 hour)  
   - Configure cron-job.org or GitHub Actions to call `scheduled-sync-calendar` with `SYNC_CRON_KEY`.
8. **Complete admin Support system** (≈2 hours)  
   - Connect UI to `support_tickets` table, implement ticket CRUD and responses.
9. **Complete admin Users & Firms management** (≈2 hours)  
   - Finish CRUD operations, bulk actions, and role management within the admin UI.
