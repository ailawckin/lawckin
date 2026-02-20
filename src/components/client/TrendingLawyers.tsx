import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LawyerCard from "@/components/LawyerCard";
import { TrendingUp } from "lucide-react";
import { formatPracticeAreaLabel, getDisplayPracticeArea, getPrimaryLocation } from "@/lib/lawyerDisplay";

const TrendingLawyers = () => {
  const [trendingLawyers, setTrendingLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrendingLawyers();
  }, []);

  const fetchTrendingLawyers = async () => {
    setLoading(true);

    const { data: statsData, error } = await supabase
      .from("lawyer_view_stats")
      .select("lawyer_id, views_last_7_days, total_views")
      .gt("views_last_7_days", 0)
      .order("views_last_7_days", { ascending: false })
      .limit(10);

    if (!error && statsData) {
      const lawyerIds = statsData.map(s => s.lawyer_id);
      
      const { data: lawyersData, error: lawyersError } = await supabase.rpc("get_lawyers_list");
      if (lawyersError) throw lawyersError;

      if (lawyersData) {
        const statsMap = new Map(statsData.map(s => [s.lawyer_id, s]));
        const filteredLawyers = (lawyersData || []).filter((lawyer) => lawyerIds.includes(lawyer.id));

        const formattedLawyers = filteredLawyers.map(lawyer => {
          const stats = statsMap.get(lawyer.id);
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
            viewCount: stats?.total_views || 0,
            hourlyRate: lawyer.hourly_rate,
            firmName: lawyer.firm_name || null,
            languages: lawyer.languages,
            nextAvailableAt: lawyer.next_available_at,
          };
        });

        setTrendingLawyers(formattedLawyers.slice(0, 6));
      }
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Trending Lawyers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (trendingLawyers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Trending Lawyers This Week
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {trendingLawyers.map((lawyer) => (
            <LawyerCard key={lawyer.id} {...lawyer} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendingLawyers;
