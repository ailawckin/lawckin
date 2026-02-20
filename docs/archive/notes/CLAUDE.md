# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Lawckin is a lawyer-client matching and consultation booking platform that connects clients with lawyers based on practice area, location, budget, and other preferences. The platform features three distinct user roles with separate workflows.

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Backend**: Supabase (PostgreSQL database, authentication, edge functions)
- **UI Components**: shadcn-ui (Radix UI primitives)
- **Styling**: Tailwind CSS
- **Data Fetching**: TanStack React Query
- **Routing**: React Router v6
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns

## Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 8080)
npm run dev

# Build for production
npm run build

# Build in development mode
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Architecture

### User Roles & Authentication

The application implements role-based access control with three roles defined in `user_roles` table:
- **client**: Users seeking legal consultation
- **lawyer**: Legal professionals offering services
- **admin**: Platform administrators

Authentication is handled via Supabase Auth. The `ProtectedRoute` component (src/components/ProtectedRoute.tsx) checks authentication and role requirements before rendering protected pages.

### Routing Structure

Routes are defined in `src/App.tsx`:
- `/` - Public landing page
- `/auth` - Authentication page
- `/welcome` - Post-registration role selection
- `/lawyers` - Browse lawyers directory
- `/lawyers/:id` - Individual lawyer profile
- `/search-results` - Filtered search results
- `/onboarding/client` - Client onboarding flow (protected)
- `/onboarding/lawyer` - Lawyer onboarding flow (protected)
- `/dashboard` - Client dashboard (protected, client role)
- `/lawyer-dashboard` - Lawyer dashboard (protected, lawyer role)
- `/admin/*` - Admin panel (protected, admin role)
- `/book-consultation/:lawyerId` - Consultation booking (protected)

### Database Schema

Key tables (defined in `src/integrations/supabase/types.ts`):

**User Management:**
- `profiles` - Base user profile info (full_name, email, avatar_url, etc.)
- `user_roles` - Role assignments (client/lawyer/admin)
- `lawyer_profiles` - Extended lawyer information (specialty, experience, rates, verification status)

**Matching & Search:**
- `client_search` - Client search queries (practice_area, budget_band, ny_location, matched_lawyers)
- `practice_areas` - Legal practice area definitions

**Scheduling:**
- `consultations` - Booked consultations (scheduled_at, status, payment info, meeting links)
- `time_slots` - Available/booked time slots for lawyers
- `recurring_availability` - Lawyer's weekly schedule template
- `availability_overrides` - One-off schedule changes (time off, special hours)

**Business:**
- `firms` - Law firm entities (for multi-lawyer practices)
- `profile_views` - Analytics for lawyer profile views

**Admin:**
- `admin_audit_log` - Activity logging for admin actions
- `admin_settings` - Platform configuration
- `reported_items` - Content moderation
- `support_tickets` - Support system

### Key Supabase Functions

- `get_lawyer_profile(lawyer_profile_id)` - Joins profiles and lawyer_profiles to return complete lawyer data
- `get_lawyers_list()` - Returns list of lawyers with basic info for directory
- `has_role(_user_id, _role)` - Checks if user has specific role
- `generate_time_slots_for_lawyer(p_lawyer_id, p_start_date, p_end_date, p_slot_duration_minutes)` - Auto-generates bookable time slots

### Component Organization

- `src/components/` - Shared components (Hero, Header, Footer, LawyerCard, etc.)
- `src/components/ui/` - shadcn-ui base components (don't modify directly)
- `src/components/admin/` - Admin panel components
- `src/components/client/` - Client dashboard components
- `src/components/lawyer/` - Lawyer-specific components
- `src/pages/` - Page-level components mapped to routes

### State Management

- React Query handles server state and caching
- Supabase client provides real-time subscriptions
- Local component state via useState/useReducer for UI state
- No global state management library (Redux, Zustand, etc.) is used

### Styling Patterns

- Tailwind utility classes for styling
- Component variants via `class-variance-authority`
- Theme support via `next-themes`
- Tailwind config extends with custom colors/animations in `tailwind.config.ts`
- Use `@/lib/utils` cn() function for conditional class merging

## Environment Variables

Required variables (stored in `.env`):
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon/public key
- `VITE_SUPABASE_PROJECT_ID` - Supabase project ID

Note: .env file is tracked in git (contains public keys only). Never add sensitive keys.

## Supabase Integration

### Client Setup

Supabase client is initialized in `src/integrations/supabase/client.ts`. Import and use throughout the app:

```typescript
import { supabase } from "@/integrations/supabase/client";
```

### Migrations

Database migrations are in `supabase/migrations/`. These are managed through the Supabase CLI or Lovable platform.

### Edge Functions

Located in `supabase/functions/`:
- `send-consultation-notification` - Sends notifications when consultations are booked

## Important Development Notes

### Adding New Routes

1. Create page component in `src/pages/`
2. Add route in `src/App.tsx`
3. Wrap with `ProtectedRoute` if authentication required
4. Specify `requireRole` prop if role-specific

### Working with shadcn-ui Components

- Components in `src/components/ui/` are auto-generated
- To add new shadcn components, use the shadcn CLI or Lovable
- Configuration is in `components.json`
- Customize components by editing after generation, but avoid modifying base primitives

### Database Type Safety

TypeScript types are auto-generated from Supabase schema in `src/integrations/supabase/types.ts`. When schema changes:
1. Update via Supabase dashboard or migrations
2. Regenerate types (typically done through Lovable)

### Lawyer Verification Flow

Lawyers must be verified before appearing in search:
1. Lawyer completes onboarding (`/onboarding/lawyer`)
2. Uploads verification documents (bar number, certifications)
3. Admin reviews in admin panel (`/admin`)
4. Sets `verification_status` and `verified` fields in `lawyer_profiles`
5. Only verified lawyers appear in public search results

### Consultation Booking Flow

1. Client searches for lawyers using `FindLawyerModal` or `/search-results`
2. Client views lawyer profile at `/lawyers/:id`
3. Client clicks "Book Consultation" → `/book-consultation/:lawyerId`
4. System queries available time slots from `time_slots` table
5. Client selects time, provides payment info
6. Consultation record created in `consultations` table
7. Edge function sends notifications to both parties
8. Meeting links generated (stored in `meeting_link`, `client_join_link`, `lawyer_join_link`)

## Lovable Integration

This project is managed through Lovable (lovable.dev), a platform for AI-assisted development:
- Changes can be made locally and pushed to git
- Changes made in Lovable UI are auto-committed to this repo
- Project URL: https://lovable.dev/projects/2756c47b-d405-4b32-a6a4-f87f5365783b

## Testing

No formal test suite is currently implemented. Manual testing workflow:
1. Test each user role's complete flow (client, lawyer, admin)
2. Verify authentication and authorization
3. Test consultation booking end-to-end
4. Check responsive design across device sizes
