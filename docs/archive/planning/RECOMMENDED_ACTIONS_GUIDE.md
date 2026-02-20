# Recommended Actions Implementation Guide

**Generated**: 2025-11-04
**Based on commit**: `773d2d4` (Fix: Client search budget band constraint)
**Project**: Lawckin - Lawyer-Client Matching Platform

---

## Overview

This guide provides detailed implementation roadmaps for the next recommended actions after completing Quick Wins. These items represent significant feature enhancements that will improve the platform's core matching functionality and user experience.

**Total Estimated Time**: 7 days
**Priority Order**: Based on dependencies and business impact

---

## Table of Contents

1. [Leverage Specialization Data in Search/Matching](#1-leverage-specialization-data-in-search-matching) (2 hours)
2. [Display Specializations on Public Profiles](#2-display-specializations-on-public-profiles) (1 hour)
3. [Payment Integration](#3-payment-integration) (3 days)
4. [Review System](#4-review-system) (1 day)

---

## 1. Leverage Specialization Data in Search/Matching

**Estimated Time**: 2 hours

**Priority**: HIGH (unlocks value of recent specialization work)

**Current State**:
- ✅ Specialization system fully implemented (commit `f78988a` + `7a3e124`)
- ✅ Tables created: `practice_area_specializations`, `lawyer_specializations`
- ✅ Lawyers can select specializations with years of experience
- ✅ Data stored and displayed in lawyer dashboard
- ❌ Search/matching logic doesn't use specialization data yet

**Problem**:
The search system currently matches on `lawyer_profiles.specialty` (text field), but the new granular specialization data isn't integrated into search results or matching algorithms.

### Current Search Implementation

**File**: `/src/pages/SearchResults.tsx` (lines 24-56)

```typescript
const fetchMatchingLawyers = async () => {
  const { data, error } = await supabase.rpc("get_lawyers_list");

  let filteredLawyers = data || [];

  // Current filtering: basic text match on specialty field
  if (practiceArea) {
    filteredLawyers = filteredLawyers.filter((lawyer: any) =>
      lawyer.specialty?.toLowerCase().includes(practiceArea.toLowerCase())
    );
  }

  if (location) {
    filteredLawyers = filteredLawyers.filter((lawyer: any) =>
      lawyer.location?.toLowerCase().includes(location.toLowerCase())
    );
  }

  setLawyers(filteredLawyers);
};
```

**Limitation**: Simple text matching doesn't leverage:
- Specific specializations within practice areas
- Years of experience per specialization
- Multiple practice areas per lawyer
- Hierarchical practice area structure

### Database Schema

**Tables**:
```sql
-- Practice areas (top level)
practice_areas (
  id UUID,
  name TEXT
)

-- Specializations within each practice area
practice_area_specializations (
  id UUID,
  practice_area_id UUID → practice_areas(id),
  specialization_name TEXT
)

-- Lawyer expertise
lawyer_specializations (
  id UUID,
  lawyer_id UUID → lawyer_profiles(id),
  specialization_id UUID → practice_area_specializations(id),
  years_experience INTEGER
)
```

**Example Data**:
- Practice Area: "Family & Divorce"
  - Specializations: "Divorce (contested)", "Child custody", "Child support", etc.
- Lawyer can have multiple specializations with different experience levels:
  - "Divorce (contested)" - 10 years
  - "Child custody" - 8 years
  - "Prenup / postnup" - 5 years

### Implementation Plan

#### Phase 1: Update Database Function (30 min)

Create new RPC function for specialized search:

**File**: Create migration `supabase/migrations/[timestamp]_enhanced_lawyer_search.sql`

```sql
-- Enhanced lawyer search with specialization matching
CREATE OR REPLACE FUNCTION get_lawyers_with_specializations(
  p_practice_area_id UUID DEFAULT NULL,
  p_specialization_ids UUID[] DEFAULT NULL,
  p_location TEXT DEFAULT NULL,
  p_min_experience INTEGER DEFAULT 0,
  p_max_hourly_rate NUMERIC DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  specialty TEXT,
  location TEXT,
  experience_years INTEGER,
  hourly_rate NUMERIC,
  rating NUMERIC,
  total_reviews INTEGER,
  verified BOOLEAN,
  specializations JSONB,
  total_specialization_years INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    lp.id,
    lp.user_id,
    p.full_name,
    p.avatar_url,
    lp.specialty,
    lp.location,
    lp.experience_years,
    lp.hourly_rate,
    COALESCE(lp.rating, 0) as rating,
    COALESCE(lp.total_reviews, 0) as total_reviews,
    lp.verified,
    -- Aggregate specializations as JSONB
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'specialization_id', ls.specialization_id,
          'specialization_name', pas.specialization_name,
          'practice_area', pa.name,
          'years_experience', ls.years_experience
        )
      ) FILTER (WHERE ls.id IS NOT NULL),
      '[]'::jsonb
    ) as specializations,
    -- Sum of all specialization experience
    COALESCE(SUM(ls.years_experience), 0)::INTEGER as total_specialization_years
  FROM lawyer_profiles lp
  JOIN profiles p ON p.user_id = lp.user_id
  LEFT JOIN lawyer_specializations ls ON ls.lawyer_id = lp.id
  LEFT JOIN practice_area_specializations pas ON pas.id = ls.specialization_id
  LEFT JOIN practice_areas pa ON pa.id = pas.practice_area_id
  WHERE
    lp.verified = true
    -- Filter by practice area if specified
    AND (p_practice_area_id IS NULL OR pa.id = p_practice_area_id)
    -- Filter by specific specializations if specified
    AND (
      p_specialization_ids IS NULL
      OR ls.specialization_id = ANY(p_specialization_ids)
    )
    -- Filter by location if specified
    AND (p_location IS NULL OR lp.location ILIKE '%' || p_location || '%')
    -- Filter by hourly rate if specified
    AND (p_max_hourly_rate IS NULL OR lp.hourly_rate <= p_max_hourly_rate)
  GROUP BY lp.id, p.user_id, p.full_name, p.avatar_url
  -- Filter by minimum experience AFTER aggregation
  HAVING (p_min_experience = 0 OR COALESCE(SUM(ls.years_experience), 0) >= p_min_experience)
  ORDER BY
    -- Prioritize lawyers with matching specializations
    (CASE WHEN p_specialization_ids IS NOT NULL THEN COUNT(ls.id) ELSE 0 END) DESC,
    -- Then by rating
    lp.rating DESC NULLS LAST,
    -- Then by total experience
    COALESCE(SUM(ls.years_experience), 0) DESC;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_lawyers_with_specializations TO authenticated, anon;
```

#### Phase 2: Update FindLawyerModal to Capture Specializations (45 min)

**File**: `/src/components/FindLawyerModal.tsx`

**Current**: Captures practice area as text string
**Goal**: Capture practice area ID and selected specialization IDs

**Changes Needed**:

1. **Fetch Practice Areas with IDs** (lines 42-56):
```typescript
const [practiceAreas, setPracticeAreas] = useState<Array<{id: string, name: string}>>([]);
const [selectedPracticeAreaId, setSelectedPracticeAreaId] = useState<string>("");

useEffect(() => {
  fetchPracticeAreas();
}, []);

const fetchPracticeAreas = async () => {
  const { data } = await supabase
    .from('practice_areas')
    .select('id, name')
    .order('name');

  if (data) {
    setPracticeAreas(data);
  }
};
```

2. **Add Specialization Selection** (new step in modal):
```typescript
// Add after practice area selection
const [specializations, setSpecializations] = useState<Array<{id: string, name: string}>>([]);
const [selectedSpecializationIds, setSelectedSpecializationIds] = useState<string[]>([]);

useEffect(() => {
  if (selectedPracticeAreaId) {
    fetchSpecializations(selectedPracticeAreaId);
  }
}, [selectedPracticeAreaId]);

const fetchSpecializations = async (practiceAreaId: string) => {
  const { data } = await supabase
    .from('practice_area_specializations')
    .select('id, specialization_name')
    .eq('practice_area_id', practiceAreaId)
    .order('specialization_name');

  if (data) {
    setSpecializations(data.map(s => ({ id: s.id, name: s.specialization_name })));
  }
};

// In modal step for specialization selection:
<div className="space-y-3">
  <Label>What specific area? (optional - select all that apply)</Label>
  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
    {specializations.map((spec) => (
      <div key={spec.id} className="flex items-center space-x-2">
        <Checkbox
          id={spec.id}
          checked={selectedSpecializationIds.includes(spec.id)}
          onCheckedChange={(checked) => {
            if (checked) {
              setSelectedSpecializationIds([...selectedSpecializationIds, spec.id]);
            } else {
              setSelectedSpecializationIds(
                selectedSpecializationIds.filter(id => id !== spec.id)
              );
            }
          }}
        />
        <Label htmlFor={spec.id} className="text-sm font-normal cursor-pointer">
          {spec.name}
        </Label>
      </div>
    ))}
  </div>
  <p className="text-xs text-muted-foreground">
    Leave unselected to search all {practiceArea} lawyers
  </p>
</div>
```

3. **Update Navigation Logic**:
```typescript
const handleFindLawyers = () => {
  const params = new URLSearchParams({
    practice_area_id: selectedPracticeAreaId,
    ...(selectedSpecializationIds.length > 0 && {
      specialization_ids: selectedSpecializationIds.join(',')
    }),
    location: nyLocation,
    urgency: urgency,
  });

  navigate(`/search-results?${params.toString()}`);
  onOpenChange(false);
};
```

#### Phase 3: Update SearchResults Component (45 min)

**File**: `/src/pages/SearchResults.tsx`

```typescript
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LawyerCard from "@/components/LawyerCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const SearchResults = () => {
  const [searchParams] = useSearchParams();
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const practiceAreaId = searchParams.get("practice_area_id") || "";
  const specializationIdsParam = searchParams.get("specialization_ids") || "";
  const location = searchParams.get("location") || "";
  const urgency = searchParams.get("urgency") || "";

  const specializationIds = specializationIdsParam
    ? specializationIdsParam.split(',').filter(Boolean)
    : [];

  useEffect(() => {
    fetchMatchingLawyers();
  }, [practiceAreaId, specializationIdsParam, location]);

  const fetchMatchingLawyers = async () => {
    setLoading(true);
    try {
      // Use new specialized search function
      const { data, error } = await supabase.rpc(
        "get_lawyers_with_specializations",
        {
          p_practice_area_id: practiceAreaId || null,
          p_specialization_ids: specializationIds.length > 0 ? specializationIds : null,
          p_location: location || null,
          p_min_experience: 0,
          p_max_hourly_rate: null,
        }
      );

      if (error) throw error;

      setLawyers(data || []);
    } catch (error: any) {
      toast({
        title: "Error loading results",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Get practice area name for display
  const [practiceAreaName, setPracticeAreaName] = useState<string>("");

  useEffect(() => {
    if (practiceAreaId) {
      supabase
        .from('practice_areas')
        .select('name')
        .eq('id', practiceAreaId)
        .single()
        .then(({ data }) => {
          if (data) setPracticeAreaName(data.name);
        });
    }
  }, [practiceAreaId]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="py-20 px-4">
        <div className="container mx-auto">
          {/* Search Summary */}
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Search Results</h1>
            <div className="flex justify-center gap-2 flex-wrap">
              {practiceAreaName && (
                <Badge variant="secondary" className="text-base px-4 py-2">
                  {practiceAreaName}
                </Badge>
              )}
              {location && (
                <Badge variant="outline" className="text-base px-4 py-2">
                  {location}
                </Badge>
              )}
              {specializationIds.length > 0 && (
                <Badge variant="outline" className="text-base px-4 py-2">
                  {specializationIds.length} specializations selected
                </Badge>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : lawyers.length === 0 ? (
            <div className="text-center py-12">
              <Filter className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg mb-4">
                No lawyers found matching your criteria.
              </p>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search filters or browse all lawyers.
              </p>
              <Button onClick={() => window.location.href = '/lawyers'}>
                Browse All Lawyers
              </Button>
            </div>
          ) : (
            <>
              <p className="text-center text-muted-foreground mb-8">
                Found {lawyers.length} {lawyers.length === 1 ? "lawyer" : "lawyers"}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lawyers.map((lawyer) => (
                  <LawyerCard
                    key={lawyer.id}
                    id={lawyer.id}
                    name={lawyer.full_name || "Unknown"}
                    specialty={lawyer.specialty}
                    location={lawyer.location || "Not specified"}
                    experience={
                      lawyer.total_specialization_years > 0
                        ? `${lawyer.total_specialization_years} years specialized experience`
                        : `${lawyer.experience_years} years experience`
                    }
                    rating={lawyer.rating || 0}
                    reviews={lawyer.total_reviews || 0}
                    image={
                      lawyer.avatar_url ||
                      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop"
                    }
                    specializations={lawyer.specializations}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SearchResults;
```

#### Phase 4: Update LawyerCard Component (Optional Enhancement)

**File**: `/src/components/LawyerCard.tsx`

Add specialization badges to lawyer cards:

```typescript
interface LawyerCardProps {
  // ... existing props
  specializations?: Array<{
    specialization_name: string;
    years_experience: number;
  }>;
}

// In component render, add before rating section:
{specializations && specializations.length > 0 && (
  <div className="mt-3 flex flex-wrap gap-1">
    {specializations.slice(0, 3).map((spec, index) => (
      <Badge key={index} variant="outline" className="text-xs">
        {spec.specialization_name}
      </Badge>
    ))}
    {specializations.length > 3 && (
      <Badge variant="outline" className="text-xs">
        +{specializations.length - 3} more
      </Badge>
    )}
  </div>
)}
```

### Testing Checklist
- [ ] Practice areas load from database (not hardcoded)
- [ ] Selecting practice area loads relevant specializations
- [ ] Multiple specializations can be selected
- [ ] Search without specializations returns all lawyers in practice area
- [ ] Search with specializations returns only matching lawyers
- [ ] Lawyer cards show specialization badges
- [ ] Results sorted by relevance (matching specs first, then rating)
- [ ] Location filter still works
- [ ] No results message shows when no matches
- [ ] "Browse All Lawyers" fallback works

### Acceptance Criteria
- [ ] Search uses new `get_lawyers_with_specializations` RPC function
- [ ] FindLawyerModal captures practice area ID and specialization IDs
- [ ] SearchResults page displays filtered results
- [ ] Lawyer cards show relevant specializations
- [ ] Results prioritize lawyers with matching specializations
- [ ] Years of experience per specialization considered in ranking
- [ ] Performance: Search completes in <500ms for typical queries

### Lovable Prompt
```
Enhance lawyer search to use new specialization system:

1. Create database migration for get_lawyers_with_specializations function
   - Takes: practice_area_id, specialization_ids[], location, min_experience, max_rate
   - Returns: lawyers with aggregated specializations as JSONB
   - Sorts by: matching specs count DESC, rating DESC, total experience DESC

2. Update FindLawyerModal.tsx:
   - Fetch practice_areas from database (with IDs)
   - When practice area selected, fetch its specializations
   - Add checkbox list for specialization selection (multi-select)
   - Update handleFindLawyers to pass IDs in URL params

3. Update SearchResults.tsx:
   - Parse specialization_ids from URL params
   - Call new RPC function instead of get_lawyers_list
   - Display search criteria badges (practice area, location, # specializations)
   - Show better empty state with "Browse All Lawyers" button

4. Update LawyerCard.tsx:
   - Add specializations prop (optional)
   - Display up to 3 specialization badges
   - Show "+X more" if >3 specializations

Test with:
- Family & Divorce → "Divorce (contested)" + "Child custody" → Manhattan
- Should return only lawyers with those specific specializations
```

---

## 2. Display Specializations on Public Profiles

**Estimated Time**: 1 hour

**Priority**: MEDIUM (enhances transparency, builds trust)

**Current State**:
- ✅ Public lawyer profile page exists (`/lawyers/:id`)
- ✅ Shows basic info: name, specialty, location, experience, bio
- ✅ Already fetches expertise data (lines 80-100)
- ✅ Shows ExpertisePieChart component
- ❌ Doesn't show detailed specialization list with years of experience

**Goal**: Display lawyer's specializations in a clear, organized way on their public profile

### Current Implementation

**File**: `/src/pages/LawyerProfile.tsx` (lines 80-100)

```typescript
const fetchExpertiseData = async () => {
  if (!id) return;

  setLoadingExpertise(true);
  const { data, error } = await supabase
    .from("lawyer_expertise")
    .select(`
      years_experience,
      practice_areas (name)
    `)
    .eq("lawyer_id", id);

  if (!error && data) {
    const formattedData = data.map((item: any) => ({
      practiceArea: item.practice_areas.name,
      years: item.years_experience,
    }));
    setExpertiseData(formattedData);
  }
  setLoadingExpertise(false);
};
```

**Note**: This fetches from `lawyer_expertise` table (old schema), but we now have `lawyer_specializations` (new schema).

### Implementation

#### Step 1: Update Data Fetching (15 min)

**File**: `/src/pages/LawyerProfile.tsx`

Replace fetchExpertiseData function:

```typescript
const [specializationData, setSpecializationData] = useState<Array<{
  practiceArea: string;
  specializations: Array<{
    name: string;
    years: number;
  }>;
}>>([]);

const fetchSpecializationData = async () => {
  if (!id) return;

  setLoadingExpertise(true);
  const { data, error } = await supabase
    .from("lawyer_specializations")
    .select(`
      years_experience,
      practice_area_specializations (
        specialization_name,
        practice_areas (name)
      )
    `)
    .eq("lawyer_id", id)
    .order("years_experience", { ascending: false });

  if (!error && data) {
    // Group by practice area
    const grouped = data.reduce((acc: any, item: any) => {
      const practiceArea = item.practice_area_specializations.practice_areas.name;
      const specialization = {
        name: item.practice_area_specializations.specialization_name,
        years: item.years_experience,
      };

      if (!acc[practiceArea]) {
        acc[practiceArea] = [];
      }
      acc[practiceArea].push(specialization);
      return acc;
    }, {});

    // Convert to array format
    const formatted = Object.entries(grouped).map(([practiceArea, specs]) => ({
      practiceArea,
      specializations: specs as Array<{ name: string; years: number }>,
    }));

    setSpecializationData(formatted);
  }
  setLoadingExpertise(false);
};
```

#### Step 2: Create SpecializationsList Component (30 min)

Create `/src/components/lawyer/SpecializationsList.tsx`:

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Briefcase } from "lucide-react";

interface Specialization {
  name: string;
  years: number;
}

interface SpecializationGroup {
  practiceArea: string;
  specializations: Specialization[];
}

interface SpecializationsListProps {
  data: SpecializationGroup[];
  loading?: boolean;
}

const SpecializationsList = ({ data, loading }: SpecializationsListProps) => {
  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-muted-foreground">
          <Briefcase className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No specializations listed</p>
        </CardContent>
      </Card>
    );
  }

  const maxYears = Math.max(
    ...data.flatMap(g => g.specializations.map(s => s.years))
  );

  return (
    <div className="space-y-6">
      {data.map((group, groupIndex) => (
        <Card key={groupIndex}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              {group.practiceArea}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {group.specializations.map((spec, specIndex) => (
              <div key={specIndex} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{spec.name}</span>
                  <Badge variant="secondary">
                    {spec.years} {spec.years === 1 ? 'year' : 'years'}
                  </Badge>
                </div>
                <Progress
                  value={(spec.years / maxYears) * 100}
                  className="h-2"
                />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default SpecializationsList;
```

#### Step 3: Integrate into LawyerProfile Page (15 min)

**File**: `/src/pages/LawyerProfile.tsx`

```typescript
import SpecializationsList from "@/components/lawyer/SpecializationsList";

// In component, replace useEffect to call fetchSpecializationData
useEffect(() => {
  fetchLawyerProfile();
  trackProfileView();
  fetchSpecializationData(); // Changed from fetchExpertiseData
}, [id]);

// In JSX, add new section after expertise pie chart:
{/* Detailed Specializations */}
<div className="mt-8">
  <h3 className="text-2xl font-bold mb-4">Areas of Expertise</h3>
  <SpecializationsList
    data={specializationData}
    loading={loadingExpertise}
  />
</div>
```

### Visual Design

The specialization list will show:
```
┌─────────────────────────────────────┐
│ 🎓 Family & Divorce                 │
├─────────────────────────────────────┤
│ Divorce (contested)        [10 yrs] │
│ ████████████████████████████░░ 100% │
│                                     │
│ Child custody / visitation  [8 yrs] │
│ ██████████████████████░░░░░░  80%   │
│                                     │
│ Child support / alimony     [8 yrs] │
│ ██████████████████████░░░░░░  80%   │
└─────────────────────────────────────┘
```

### Testing Checklist
- [ ] Specializations grouped by practice area
- [ ] Each specialization shows name and years
- [ ] Progress bars scale relative to max years
- [ ] Loading state shows skeleton
- [ ] Empty state shows friendly message
- [ ] Mobile responsive layout
- [ ] Looks good with 1-20+ specializations

### Acceptance Criteria
- [ ] Public profile shows all lawyer specializations
- [ ] Grouped by practice area
- [ ] Sorted by years of experience (desc)
- [ ] Visual progress bars for easy comparison
- [ ] Years of experience prominently displayed
- [ ] Professional, trustworthy design

### Lovable Prompt
```
Add detailed specializations display to public lawyer profiles:

1. Create SpecializationsList component (/src/components/lawyer/SpecializationsList.tsx):
   - Takes grouped data: { practiceArea, specializations: [{ name, years }] }[]
   - Groups shown as separate cards with practice area header
   - Each specialization: name on left, years badge on right, progress bar
   - Progress bar scaled relative to lawyer's max years across all specs
   - Loading skeleton and empty state
   - Use Briefcase icon for headers

2. Update LawyerProfile.tsx:
   - Replace fetchExpertiseData with fetchSpecializationData
   - Query lawyer_specializations table with joins
   - Group results by practice area
   - Add new "Areas of Expertise" section after pie chart
   - Render SpecializationsList component

Make it look professional and trustworthy - this shows credibility to potential clients.
```

---

## 3. Payment Integration

**Estimated Time**: 3 days

**Priority**: CRITICAL (required for revenue)

**Current State**:
- ❌ No payment system integrated
- ❌ Consultations booked without payment
- ❌ No Stripe/payment processor account
- ❌ No payment flow in UI

**Business Impact**: Cannot monetize platform without payments

### Technical Architecture

**Payment Provider**: Stripe (industry standard, excellent developer experience)

**Flow**:
1. Client selects consultation slot
2. Client enters payment details (Stripe Checkout or Elements)
3. Payment captured (or authorized)
4. Consultation created with `payment_status: 'paid'`
5. Funds held until consultation completion
6. Automatic refund if cancelled >24h before
7. Payout to lawyer after consultation

### Database Schema Updates

**Migration**: Create `payment_transactions` table

```sql
CREATE TABLE public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE NOT NULL,
  stripe_charge_id TEXT,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN (
    'pending',
    'succeeded',
    'failed',
    'refunded',
    'partially_refunded'
  )),
  refund_amount NUMERIC DEFAULT 0,
  stripe_refund_id TEXT,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  lawyer_payout NUMERIC,
  payout_status TEXT CHECK (payout_status IN (
    'pending',
    'processing',
    'paid',
    'failed'
  )),
  stripe_payout_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ
);

CREATE INDEX idx_payment_transactions_consultation ON public.payment_transactions(consultation_id);
CREATE INDEX idx_payment_transactions_stripe_intent ON public.payment_transactions(stripe_payment_intent_id);
CREATE INDEX idx_payment_transactions_status ON public.payment_transactions(status);

-- Update consultations table
ALTER TABLE public.consultations
ADD COLUMN payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN (
  'pending',
  'paid',
  'refunded',
  'failed'
)),
ADD COLUMN amount_paid NUMERIC,
ADD COLUMN payment_method TEXT;
```

### Implementation Phases

#### Phase 1: Stripe Account Setup (1 day)

1. **Create Stripe Account**
   - Sign up at https://stripe.com
   - Complete business verification
   - Set up bank account for payouts
   - Enable Connect for lawyer payouts (marketplace model)

2. **Get API Keys**
   - Test mode: `pk_test_...` and `sk_test_...`
   - Production mode: `pk_live_...` and `sk_live_...`

3. **Configure Webhooks**
   - Set webhook URL: `https://[PROJECT].supabase.co/functions/v1/stripe-webhook`
   - Listen for events:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
     - `payout.paid`

4. **Environment Variables**
   ```
   VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_... (server-side only)
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

#### Phase 2: Backend Payment Logic (1 day)

Create Edge Function: `supabase/functions/create-payment-intent/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

serve(async (req) => {
  try {
    const { consultationId, amount, lawyerId, clientId } = await req.json();

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: {
        consultation_id: consultationId,
        lawyer_id: lawyerId,
        client_id: clientId,
      },
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

Create Edge Function: `supabase/functions/stripe-webhook/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  const body = await req.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    );
  } catch (err) {
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const consultationId = paymentIntent.metadata.consultation_id;

      // Update consultation
      await supabase
        .from('consultations')
        .update({
          payment_status: 'paid',
          amount_paid: paymentIntent.amount / 100,
          status: 'confirmed',
        })
        .eq('id', consultationId);

      // Create transaction record
      await supabase.from('payment_transactions').insert({
        consultation_id: consultationId,
        stripe_payment_intent_id: paymentIntent.id,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency,
        status: 'succeeded',
        paid_at: new Date().toISOString(),
      });
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const consultationId = paymentIntent.metadata.consultation_id;

      await supabase
        .from('consultations')
        .update({ payment_status: 'failed' })
        .eq('id', consultationId);
      break;
    }

    case 'charge.refunded': {
      const charge = event.data.object;

      await supabase
        .from('payment_transactions')
        .update({
          status: 'refunded',
          refund_amount: charge.amount_refunded / 100,
          refunded_at: new Date().toISOString(),
        })
        .eq('stripe_charge_id', charge.id);
      break;
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
```

#### Phase 3: Frontend Payment UI (1 day)

Install Stripe React library:
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

Update `/src/pages/BookConsultation.tsx`:

```typescript
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '@/components/payment/PaymentForm';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// In component:
const [clientSecret, setClientSecret] = useState<string>('');
const [paymentStep, setPaymentStep] = useState<'select-slot' | 'payment' | 'confirmation'>('select-slot');

const handleSlotSelected = async (slot: any) => {
  setSelectedSlot(slot);

  // Calculate amount
  const amount = lawyer.hourly_rate * (slot.duration_minutes / 60);

  // Create payment intent
  const { data, error } = await supabase.functions.invoke('create-payment-intent', {
    body: {
      consultationId: null, // Will create consultation after payment
      amount: amount,
      lawyerId: lawyerId,
      clientId: user.id,
    },
  });

  if (!error && data.clientSecret) {
    setClientSecret(data.clientSecret);
    setPaymentStep('payment');
  }
};

// In render:
{paymentStep === 'payment' && clientSecret && (
  <Elements stripe={stripePromise} options={{ clientSecret }}>
    <PaymentForm
      amount={lawyer.hourly_rate * (selectedSlot.duration_minutes / 60)}
      onSuccess={handlePaymentSuccess}
      onError={handlePaymentError}
    />
  </Elements>
)}
```

Create `/src/components/payment/PaymentForm.tsx`:

```typescript
import { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Lock } from 'lucide-react';

interface PaymentFormProps {
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const PaymentForm = ({ amount, onSuccess, onError }: PaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/consultation-confirmed`,
      },
    });

    if (error) {
      onError(error.message || 'Payment failed');
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Secure Payment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted p-4 rounded-lg mb-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total Amount</span>
              <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
            </div>
          </div>

          <PaymentElement />

          <Button
            type="submit"
            disabled={!stripe || processing}
            className="w-full"
            size="lg"
          >
            {processing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Pay $${amount.toFixed(2)}`
            )}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Your payment is secured by Stripe.
            Cancel anytime up to 24 hours before for full refund.
          </p>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentForm;
```

### Testing Checklist

**Test Mode**:
- [ ] Use Stripe test cards: `4242 4242 4242 4242`
- [ ] Successful payment flow end-to-end
- [ ] Payment failure handling (card `4000 0000 0000 0002`)
- [ ] Requires authentication (3D Secure): `4000 0027 6000 3184`
- [ ] Webhook delivery and processing
- [ ] Consultation status updates after payment
- [ ] Refund flow for cancellations

**Production**:
- [ ] Real card processing
- [ ] Webhook signature verification
- [ ] Error handling and logging
- [ ] Email notifications with payment confirmation
- [ ] Refund policy enforcement

### Lovable Prompt (Too Complex for Single Prompt)

This is a 3-day integration that requires multiple steps. Break it into phases:

**Phase 1 Prompt**:
```
Set up Stripe payment infrastructure:

1. Create payment_transactions table migration with fields:
   - consultation_id, stripe_payment_intent_id, amount, currency
   - status (pending/succeeded/failed/refunded)
   - platform_fee, lawyer_payout, payout_status
   - timestamps

2. Add payment fields to consultations table:
   - payment_status, amount_paid, payment_method

3. Create Edge Function: create-payment-intent
   - Takes: consultationId, amount, lawyerId, clientId
   - Creates Stripe PaymentIntent
   - Returns clientSecret

4. Create Edge Function: stripe-webhook
   - Verifies webhook signature
   - Handles payment_intent.succeeded
   - Updates consultation and creates transaction record

I'll manually set up Stripe account and configure webhooks.
```

**Phase 2 Prompt** (after Phase 1 complete):
```
Build payment UI for consultation booking:

1. Install @stripe/stripe-js and @stripe/react-stripe-js

2. Create PaymentForm component:
   - Uses Stripe PaymentElement
   - Shows total amount prominently
   - Secure payment badge with Lock icon
   - "Pay $X.XX" button with loading state
   - Refund policy disclaimer

3. Update BookConsultation page:
   - Add payment step after slot selection
   - Call create-payment-intent Edge Function
   - Wrap PaymentForm in Elements provider
   - Handle payment success/failure

4. Create confirmation page for post-payment redirect

Use Stripe test mode with test API keys for now.
```

---

## 4. Review System

**Estimated Time**: 1 day

**Priority**: HIGH (builds trust, improves matching)

**Current State**:
- ❌ No review/rating system
- ❌ Ratings hardcoded or null in lawyer cards
- ❌ No feedback mechanism post-consultation

**Business Impact**: Reviews are critical for:
- Building trust with new clients
- Quality control for lawyers
- Improving search ranking
- Platform credibility

### Database Schema

**Migration**: Create reviews table

```sql
CREATE TABLE public.consultation_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id),
  lawyer_id UUID NOT NULL REFERENCES public.lawyer_profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  expertise_rating INTEGER CHECK (expertise_rating >= 1 AND expertise_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  would_recommend BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT true,
  helpful_count INTEGER DEFAULT 0,
  response_from_lawyer TEXT,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(consultation_id, reviewer_id)
);

-- Trigger to update lawyer's average rating
CREATE OR REPLACE FUNCTION update_lawyer_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE lawyer_profiles
  SET
    rating = (
      SELECT AVG(rating)::NUMERIC(3,2)
      FROM consultation_reviews
      WHERE lawyer_id = NEW.lawyer_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM consultation_reviews
      WHERE lawyer_id = NEW.lawyer_id
    )
  WHERE id = NEW.lawyer_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_lawyer_rating
AFTER INSERT OR UPDATE ON consultation_reviews
FOR EACH ROW
EXECUTE FUNCTION update_lawyer_rating();

-- RLS Policies
ALTER TABLE public.consultation_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON public.consultation_reviews FOR SELECT
  USING (true);

CREATE POLICY "Clients can create reviews for their consultations"
  ON public.consultation_reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM consultations
      WHERE id = consultation_id
      AND client_id = auth.uid()
      AND status = 'completed'
    )
  );

CREATE POLICY "Reviewers can update their own reviews"
  ON public.consultation_reviews FOR UPDATE
  USING (reviewer_id = auth.uid());

CREATE POLICY "Lawyers can add responses to reviews"
  ON public.consultation_reviews FOR UPDATE
  USING (
    lawyer_id IN (
      SELECT id FROM lawyer_profiles WHERE user_id = auth.uid()
    )
  );
```

### Implementation (Not Fully Detailed - Out of Scope)

This is a 1-day feature that includes:
1. Review form component (star ratings + text)
2. Display reviews on lawyer profile
3. Lawyer response functionality
4. Helpful vote system
5. Admin moderation tools

Due to length constraints, I'm not providing full implementation details. This should be its own dedicated document.

### Lovable Prompt (High Level)
```
Create consultation review system:

1. Database migration for consultation_reviews table with:
   - Overall rating + breakdown (communication, expertise, professionalism)
   - Review text, would_recommend boolean
   - Lawyer response capability
   - Trigger to update lawyer avg rating and count

2. ReviewForm component for post-consultation rating:
   - 5-star overall rating
   - Optional detailed breakdown ratings
   - Text area for written review
   - "Would you recommend?" toggle
   - Submit to consultation_reviews table

3. ReviewsList component for lawyer profile:
   - Display all reviews sorted by date
   - Show ratings with stars
   - Verified badge for confirmed bookings
   - Lawyer responses (if any)
   - "Helpful" vote buttons

4. Add review prompt to ClientConsultations after completed consultations
   - Modal or embedded form
   - Only show if not already reviewed

Full UX specifications will be provided separately.
```

---

## Summary & Prioritization

### Recommended Implementation Order

1. **Quick Wins** (1 hour) - Complete remaining items (cancellation confirmations, console cleanup, email verification)

2. **Leverage Specialization Data** (2 hours) - HIGH ROI, unlocks recent work
   - Enables precise matching
   - Improves search relevance
   - Better client experience

3. **Display Specializations on Profiles** (1 hour) - Enhances trust
   - Shows lawyer expertise clearly
   - Improves conversion
   - Professional presentation

4. **Enable Email Verification** (20 min) - PRODUCTION BLOCKER
   - Must do before any public launch
   - Security and reliability requirement

5. **Payment Integration** (3 days) - REVENUE BLOCKER
   - Required to monetize
   - Complex but essential
   - Start ASAP for launch

6. **Review System** (1 day) - Trust & Quality
   - Builds platform credibility
   - Improves search rankings
   - Feedback loop for lawyers

### Total Timeline: ~7 days of focused development

**Critical Path**: Email Verification → Payment Integration → Public Launch

**Post-Launch**: Review System, continued optimization of search/matching
