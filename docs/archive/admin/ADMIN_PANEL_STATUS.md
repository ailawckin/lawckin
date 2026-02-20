# Admin Panel Status Report - Cursor AI Context

This document provides context about the current state of the Lawckin admin panel to help guide AI-assisted development in Cursor.

---

## ✅ WHAT'S WORKING WELL (Don't Break These)

### Core Infrastructure
- **Authentication & Authorization**: Role-based access control via `ProtectedRoute` component works correctly
- **Audit Logging**: `useAuditLog` hook (src/hooks/useAuditLog.ts) successfully logs admin actions to `admin_audit_log` table
- **RLS Policies**: All admin tables have proper Row Level Security enabled
- **Component Organization**: Clean separation between admin components in src/components/admin/

### Working Admin Sections

1. **Dashboard Overview** (src/components/admin/AdminOverview.tsx)
   - Real-time statistics display working correctly
   - Date range filtering (7, 30, 90 days) functional
   - Recent bookings and activity feeds working
   - Navigation to other sections via clickable cards works

2. **Lawyer Review & Verification** (src/components/admin/LawyerReview.tsx)
   - Successfully lists pending verifications
   - Approve/reject actions update database correctly
   - Audit logging for verification decisions works
   - Real-time list refresh after actions

3. **Users & Firms Management** (src/components/admin/UsersAndFirms.tsx)
   - User listing with search works
   - Firm listing with search works
   - Role badge display correct
   - Note: This is intentionally read-only currently

4. **Bookings & Payments** (src/components/admin/BookingsAndPayments.tsx)
   - Revenue summary calculations correct
   - Filtering by status and payment status works
   - Uses `bookings_with_details` view correctly
   - Database status updates work

5. **Analytics Dashboard** (src/components/admin/Analytics.tsx)
   - All 4 charts render correctly with Recharts
   - Data aggregation logic is sound
   - Date range filtering works

6. **Support Tickets** (src/components/admin/Support.tsx)
   - Ticket listing and filtering works
   - Status updates save correctly
   - Priority and status badges display properly

7. **Platform Settings** (src/components/admin/Settings.tsx)
   - Settings load from `admin_settings` table correctly
   - Upsert logic works for saving settings
   - JSON storage for settings is appropriate

8. **Audit Log** (src/components/admin/AuditLog.tsx)
   - Successfully displays last 100 admin actions
   - Filtering by action/entity type works
   - Color-coded badges for different action types

---

## ❌ CRITICAL ISSUES (Must Fix)

### 1. Stripe Refund Integration Broken
**File**: src/components/admin/BookingsAndPayments.tsx:334
**Issue**: Refund function only updates database status, doesn't actually process Stripe refunds
**Impact**: Money not being refunded to clients
**Fix Needed**:
```typescript
// Add Stripe API integration
const processStripeRefund = async (paymentIntentId, amount) => {
  const response = await supabase.functions.invoke('process-refund', {
    body: { paymentIntentId, amount }
  });
  // Then update database
};
```

### 2. Content Moderation System Missing
**Database**: `reported_items` table exists but has ZERO UI
**Impact**: Legal liability - cannot moderate reported content
**Fix Needed**: Create new component `src/components/admin/ContentModeration.tsx`
- Display reported items from `reported_items` table
- Show report reason, reporter, reported entity
- Actions: dismiss, hide content, ban user, delete content
- Log all moderation actions to audit log

### 3. Practice Area Management Missing
**Database**: `practice_areas` and `practice_area_specializations` tables exist but no admin UI
**Impact**: Cannot manage core platform taxonomy without direct DB access
**Fix Needed**: Create new component `src/components/admin/PracticeAreaManagement.tsx`
- CRUD interface for practice areas
- Manage specializations per practice area
- Edit icons, descriptions, display order

### 4. Email Sending Not Implemented
**File**: src/components/admin/Support.tsx:153-154
**Issue**: Email sending commented out with TODO
**Impact**: Support responses don't reach users
**Fix Needed**:
```typescript
await supabase.functions.invoke('send-support-email', {
  body: { to, subject, message, ticketId }
});
```

### 5. IP Address Not Captured in Audit Log
**File**: src/hooks/useAuditLog.ts:31
**Issue**: `ip_address` field always null
**Impact**: Incomplete audit trail for security investigations
**Fix Needed**: Capture IP via edge function or client-side with server validation

---

## ⚠️ MISSING FEATURES (Database Exists, No UI)

### High Priority Missing
1. **Lawyer Document Viewer** - `lawyer_profiles.verification_documents` field not accessible
2. **Review Moderation** - `lawyer_reviews` table not managed
3. **Messaging Oversight** - `conversations` and `messages` tables not visible
4. **Calendar Monitoring** - `calendar_connections`, `calendar_sync_log` tables not exposed
5. **Profile Analytics** - `profile_views`, `lawyer_view_stats` data not in dashboard
6. **Search Analytics** - `client_search` table not exposed
7. **Lawyer Specializations** - `lawyer_specializations` and `lawyer_expertise` tables not managed

### What This Means
When implementing new admin features, these database tables already exist with proper RLS policies:
- `reported_items` (content moderation)
- `lawyer_reviews` (review management)
- `conversations`, `messages` (messaging oversight)
- `calendar_connections`, `calendar_events_cache`, `calendar_sync_log` (calendar monitoring)
- `profile_views`, `lawyer_view_stats`, `lawyer_daily_views` (analytics)
- `client_search` (search analytics)
- `lawyer_specializations`, `lawyer_expertise` (expertise management)
- `practice_areas`, `practice_area_specializations` (taxonomy)

You don't need to create these tables or policies - just build the UI to manage them.

---

## 🔧 CODE QUALITY IMPROVEMENTS NEEDED

### Performance Issues

1. **Dashboard Queries Not Optimized** (src/components/admin/AdminOverview.tsx:56-122)
   - Makes 6+ separate queries on load
   - No caching
   - No pagination
   - **Better**: Create materialized view or single aggregated query

2. **No React Query Used**
   - All components use direct Supabase queries
   - No caching, no automatic refetching
   - **Better**: Implement React Query for all data fetching

3. **No Pagination**
   - All list components fetch entire datasets
   - Will slow down as data grows
   - **Better**: Implement cursor-based pagination

### Component Architecture Issues

1. **Large Components**
   - AdminOverview.tsx: 352 lines
   - BookingsAndPayments.tsx: 352 lines
   - **Better**: Extract stat cards, filters, and tables into separate components

2. **Inconsistent Error Handling**
   - Some use toast notifications
   - Some only console.log
   - No error boundaries
   - **Better**: Implement centralized error handling pattern

3. **No Loading Skeletons**
   - Only basic loading states
   - **Better**: Implement skeleton loaders for better UX

### UX Improvements Needed

1. **Table Functionality Missing**
   - No sorting on any columns
   - No column resizing
   - No row selection
   - No bulk actions
   - **Better**: Use a proper table library (TanStack Table) or add these features

2. **Search Limitations**
   - Only basic text search
   - No autocomplete
   - No advanced filters
   - No saved filter presets
   - **Better**: Implement advanced search with filter builder

3. **No Data Export**
   - Cannot export analytics or reports
   - **Better**: Add CSV/Excel export for all major tables

4. **Limited Date Ranges**
   - Only preset ranges (7, 30, 90 days)
   - **Better**: Add custom date range picker

### Security Improvements Needed

1. **Single Admin Role**
   - All admins have full access
   - No granular permissions
   - **Better**: Implement roles: super_admin, moderator, support, analyst
   - Add permission checks per action

2. **No Two-Factor Auth for Sensitive Actions**
   - Refunds, bans, deletions have no additional verification
   - **Better**: Require 2FA confirmation for destructive actions

3. **Incomplete Audit Trail**
   - Missing IP addresses
   - Missing user agents
   - No session tracking
   - **Better**: Capture all security-relevant metadata

---

## 📋 IMPLEMENTATION PATTERNS TO FOLLOW

### When Adding New Admin Features

1. **Always Use Audit Logging**
   ```typescript
   import { useAuditLog } from "@/hooks/useAuditLog";

   const { logAction } = useAuditLog();

   await logAction(
     "UPDATE_ENTITY",
     "entity_type",
     entityId,
     { before: oldValue, after: newValue }
   );
   ```

2. **Follow Existing Component Structure**
   - Use Card components for sections
   - Use Table for data display
   - Use Badge for status indicators
   - Use Dialog for modal actions
   - Use toast for notifications

3. **Error Handling Pattern**
   ```typescript
   try {
     // operation
     toast({ title: "Success message" });
   } catch (error) {
     console.error("Error details:", error);
     toast({
       title: "Error",
       description: "User-friendly message",
       variant: "destructive"
     });
   }
   ```

4. **Data Fetching Pattern** (Current - should migrate to React Query)
   ```typescript
   const [data, setData] = useState([]);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
     const fetchData = async () => {
       const { data, error } = await supabase.from('table').select();
       if (data) setData(data);
       setLoading(false);
     };
     fetchData();
   }, []);
   ```

5. **Always Update Related UI After Mutations**
   - Refetch data after create/update/delete
   - Show optimistic updates where appropriate
   - Handle loading states during mutations

---

## 🎯 RECOMMENDED IMPLEMENTATION ORDER

### Phase 1: Critical Fixes (Week 1-2)
1. Fix Stripe refund integration (BookingsAndPayments.tsx)
2. Implement email sending for support tickets (Support.tsx)
3. Add IP address capture to audit log (useAuditLog.ts)

### Phase 2: Essential Features (Weeks 3-4)
4. Build Content Moderation dashboard (new component)
5. Build Practice Area Management (new component)
6. Add lawyer document viewer to LawyerReview.tsx

### Phase 3: User Management (Month 2)
7. Add user ban/suspend functionality to UsersAndFirms.tsx
8. Build Review Moderation interface (new component)
9. Add user edit capabilities

### Phase 4: Analytics & Insights (Month 2)
10. Add profile view analytics to Analytics.tsx
11. Build Search Analytics dashboard (new component)
12. Add custom date range picker
13. Implement data export functionality

### Phase 5: Architecture Improvements (Month 3)
14. Refactor to use React Query
15. Implement pagination on all lists
16. Add table sorting and filtering
17. Extract large components into smaller pieces
18. Add skeleton loaders

### Phase 6: Security Enhancements (Month 3)
19. Implement admin role permissions
20. Add 2FA for sensitive actions
21. Improve audit trail completeness

---

## 🚫 WHAT NOT TO DO

1. **Don't Break Existing Working Features**
   - Dashboard stats calculations are correct - don't change the logic
   - Audit logging works - maintain the pattern
   - RLS policies are correct - don't modify them

2. **Don't Create New Database Tables for These** (They Already Exist)
   - reported_items
   - lawyer_reviews
   - conversations, messages
   - calendar_connections
   - practice_areas, practice_area_specializations
   - lawyer_specializations, lawyer_expertise

3. **Don't Use Different UI Patterns**
   - Stick with shadcn-ui components
   - Follow existing color coding for badges
   - Use existing toast notification system
   - Maintain current layout structure

4. **Don't Skip Audit Logging**
   - All admin actions that modify data MUST be logged
   - Use the `useAuditLog` hook consistently

5. **Don't Add Dependencies Without Consideration**
   - Project already uses Recharts for charts
   - Uses shadcn-ui for components
   - Uses Supabase client directly (no Prisma, no other ORMs)

---

## 📖 CODE REFERENCES

### Key Files to Understand
- `src/pages/Admin.tsx` - Main admin layout and routing
- `src/hooks/useAuditLog.ts` - Audit logging hook (use this for all admin actions)
- `src/integrations/supabase/types.ts` - Database schema types
- `src/components/ProtectedRoute.tsx` - Role-based auth

### Database Views Available
- `bookings_with_details` - Used in BookingsAndPayments.tsx
- `lawyer_view_stats` - Aggregated profile view stats (not yet used in UI)
- `lawyer_daily_views` - Daily view counts (not yet used in UI)

### Naming Conventions
- Admin components: `AdminComponentName.tsx` in `src/components/admin/`
- Admin pages route through: `src/pages/Admin.tsx`
- Database functions: `snake_case` (e.g., `get_lawyer_profile`)
- React components: `PascalCase`
- Hooks: `useCamelCase`

---

## 💡 TIPS FOR CURSOR AI

1. **When Asked to Add Admin Feature**
   - Check if database table exists first (see "Missing Features" section)
   - Follow existing component patterns in src/components/admin/
   - Always add audit logging
   - Update src/pages/Admin.tsx routing if new page

2. **When Refactoring Existing Components**
   - Don't change working functionality
   - Maintain existing data fetching logic (until React Query migration)
   - Keep existing error handling patterns
   - Preserve audit logging calls

3. **When Fixing Bugs**
   - Check if issue is listed in "Critical Issues" section
   - Follow implementation patterns from working components
   - Test with existing RLS policies
   - Add error handling if missing

4. **When Improving Performance**
   - Consider implementing React Query first
   - Add pagination before optimizing queries
   - Use existing database views where available
   - Don't break existing working queries

---

## 🔍 TESTING CHECKLIST

Before considering any admin feature "complete":
- [ ] Works with existing RLS policies (test as admin user)
- [ ] Audit log entry created for mutations
- [ ] Error handling shows user-friendly messages
- [ ] Loading states display correctly
- [ ] Toast notifications on success/error
- [ ] Data refreshes after mutations
- [ ] Navigation/routing works correctly
- [ ] Responsive on mobile devices
- [ ] No console errors
- [ ] TypeScript types are correct

---

## 📞 CONTEXT FOR SPECIFIC QUESTIONS

**"Why doesn't refund work?"**
→ See "Critical Issues #1" - Stripe API not integrated, only DB update

**"How do I add content moderation?"**
→ See "Critical Issues #2" - Table exists, need to build UI component

**"Where are practice areas managed?"**
→ See "Critical Issues #3" - Currently only via direct DB access

**"Why are there tables with no UI?"**
→ See "Missing Features" section - ~10 tables exist but need UI built

**"How should I structure a new admin component?"**
→ See "Implementation Patterns" and reference existing working components

**"What's the priority order for fixes?"**
→ See "Recommended Implementation Order" - start with Phase 1 critical fixes

---

## Summary for Quick Reference

**🟢 Working Well**: Dashboard, basic CRUD, audit logging, analytics charts, settings
**🔴 Broken**: Stripe refunds, email sending, IP logging
**🟡 Missing**: Content moderation, practice areas, document viewer, review moderation, search analytics
**🔧 Needs Improvement**: React Query, pagination, table features, error handling, component size

**Next Steps**: Fix Stripe refunds → Build content moderation → Add practice area management
