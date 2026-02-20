import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LawyerCard from "@/components/LawyerCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowLeft, Scale, Building2, Users, Home, Briefcase, Shield, Gavel, FileText, Heart, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  formatPracticeAreaLabel,
  getDisplayPracticeArea,
  getPracticeAreas,
  getPrimaryLocation,
} from "@/lib/lawyerDisplay";

const iconMap: Record<string, any> = {
  "Family Law": Users,
  "Criminal Defense": Shield,
  "Corporate Law": Building2,
  "Real Estate": Home,
  "Employment Law": Briefcase,
  "Civil Litigation": Scale,
  "Immigration Law": Landmark,
  "Personal Injury": Heart,
  "Estate Planning": FileText,
  "Bankruptcy": Gavel,
};

const PracticeArea = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [practiceArea, setPracticeArea] = useState<any>(null);
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (id) {
      fetchPracticeArea();
      fetchLawyers();
    }
  }, [id]);

  const fetchPracticeArea = async () => {
    try {
      const { data, error } = await supabase
        .from("practice_areas")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setPracticeArea(data);
    } catch (error: any) {
      toast({
        title: "Error loading practice area",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      // Get practice area name to filter
      const { data: areaData } = await supabase
        .from("practice_areas")
        .select("name")
        .eq("id", id)
        .single();

      if (!areaData) {
        setLawyers([]);
        setLoading(false);
        return;
      }

      // Get all lawyers
      const { data: lawyersData, error: lawyersError } = await supabase.rpc("get_lawyers_list");

      if (lawyersError) throw lawyersError;

      // Query lawyers who have this practice area in their expertise
      const { data: expertiseData } = await supabase
        .from("lawyer_expertise")
        .select("lawyer_id")
        .eq("practice_area_id", id);

      // Create set of lawyer IDs with expertise in this practice area
      const lawyerIdsWithExpertise = new Set(
        (expertiseData || []).map((exp: any) => exp.lawyer_id)
      );

      // Filter lawyers: either have expertise or practice area matches
      const filteredLawyers = (lawyersData || []).filter((lawyer: any) => {
        // Check if lawyer has expertise in this practice area
        if (lawyerIdsWithExpertise.has(lawyer.id)) {
          return true;
        }
        
        const practiceAreas = getPracticeAreas(lawyer);
        if (
          practiceAreas.some(
            (area) => area.toLowerCase() === areaData.name.toLowerCase()
          )
        ) {
          return true;
        }

        return false;
      });

      setLawyers(filteredLawyers);
    } catch (error: any) {
      toast({
        title: "Error loading lawyers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!practiceArea && !loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-20 px-4">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">Practice Area Not Found</h1>
            <p className="text-muted-foreground mb-6">
              The practice area you're looking for doesn't exist.
            </p>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  const Icon = practiceArea ? (iconMap[practiceArea.name] || Scale) : Scale;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>

          {practiceArea && (
            <Card className="mb-12">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Icon className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-3xl">{practiceArea.name}</CardTitle>
                    <CardDescription className="text-base mt-2">
                      {practiceArea.description || "Expert legal services in this practice area"}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          )}

          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-2">
              {lawyers.length} {lawyers.length === 1 ? "Lawyer" : "Lawyers"} Available
            </h2>
            <p className="text-muted-foreground">
              Find experienced attorneys specializing in {practiceArea?.name}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : lawyers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg mb-4">
                No lawyers found for this practice area.
              </p>
              <p className="text-muted-foreground mb-6">
                Try browsing all lawyers or check back later.
              </p>
              <Button onClick={() => navigate("/lawyers")}>
                Browse All Lawyers
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {lawyers.map((lawyer) => {
                const displayArea = getDisplayPracticeArea(lawyer, practiceArea?.name || "");
                return (
                  <LawyerCard
                    key={lawyer.id}
                    id={lawyer.id}
                    name={lawyer.full_name || "Unknown"}
                    specialty={displayArea.area}
                    practiceAreaDisplay={formatPracticeAreaLabel(displayArea.area, displayArea.years)}
                    location={getPrimaryLocation(lawyer)}
                    experience={`${lawyer.experience_years} years experience`}
                    rating={lawyer.rating || 0}
                    reviews={lawyer.total_reviews || 0}
                    image={lawyer.avatar_url || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop"}
                    hourlyRate={lawyer.hourly_rate}
                    firmName={lawyer.firm_name}
                    languages={lawyer.languages}
                    nextAvailableAt={lawyer.next_available_at}
                  />
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default PracticeArea;
