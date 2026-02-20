import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LawyerCard from "@/components/LawyerCard";
import { Clock } from "lucide-react";
import { formatPracticeAreaLabel, getDisplayPracticeArea, getPrimaryLocation } from "@/lib/lawyerDisplay";

interface RecentlyViewedLawyersProps {
  userId: string;
}

const RecentlyViewedLawyers = ({ userId }: RecentlyViewedLawyersProps) => {
  const [recentLawyers, setRecentLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentlyViewed();
  }, [userId]);

  const fetchRecentlyViewed = async () => {
    setLoading(true);

    const { data: viewsData, error } = await supabase
      .from("profile_views")
      .select("lawyer_id, viewed_at")
      .eq("viewer_id", userId)
      .order("viewed_at", { ascending: false })
      .limit(20);

    if (!error && viewsData) {
      const uniqueLawyerIds = Array.from(new Set(viewsData.map(v => v.lawyer_id))).slice(0, 6);
      
      const { data: lawyersData, error: lawyersError } = await supabase.rpc("get_lawyers_list");
      if (lawyersError) throw lawyersError;

      if (lawyersData) {
        const filteredLawyers = (lawyersData || []).filter((lawyer) =>
          uniqueLawyerIds.includes(lawyer.id)
        );

        const formattedLawyers = filteredLawyers.map(lawyer => {
          const displayArea = getDisplayPracticeArea(lawyer);
          return {
            id: lawyer.id,
            name: lawyer.full_name || "Unknown",
            specialty: displayArea.area,
            practiceAreaDisplay: formatPracticeAreaLabel(displayArea.area, displayArea.years),
            location: getPrimaryLocation(lawyer),
            experience: `${lawyer.experience_years} years`,
            rating: lawyer.rating || 0,
            reviews: lawyer.total_reviews || 0,
            image: lawyer.avatar_url ||
              "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop",
            hourlyRate: lawyer.hourly_rate,
            firmName: lawyer.firm_name || null,
            languages: lawyer.languages,
            nextAvailableAt: lawyer.next_available_at,
          };
        });

        setRecentLawyers(formattedLawyers);
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recently Viewed Lawyers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (recentLawyers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recently Viewed Lawyers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recentLawyers.map((lawyer) => (
            <LawyerCard key={lawyer.id} {...lawyer} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentlyViewedLawyers;
