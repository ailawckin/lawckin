import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LawyerCard from "@/components/LawyerCard";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  formatPracticeAreaLabel,
  getDisplayPracticeArea,
  getLocations,
  getPrimaryLocation,
  getPracticeAreas,
} from "@/lib/lawyerDisplay";
import { getPracticeAreaSearchTerm, practiceAreaMatches } from "@/lib/practiceAreaMatch";

const Lawyers = () => {
  const [lawyers, setLawyers] = useState<any[]>([]);
  const [practiceAreas, setPracticeAreas] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPracticeArea, setSelectedPracticeArea] = useState("all");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchPracticeAreas();
    fetchLawyers();
  }, []);

  const fetchPracticeAreas = async () => {
    const { data, error } = await supabase
      .from("practice_areas")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error loading practice areas",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setPracticeAreas(data || []);
    }
  };

  const fetchLawyers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_lawyers_list");

    if (error) {
      toast({
        title: "Error loading lawyers",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setLawyers(data || []);
    }
    setLoading(false);
  };

  const trimmedSearch = searchTerm.trim();
  const searchPracticeArea = trimmedSearch ? getPracticeAreaSearchTerm(trimmedSearch) : "";
  const isPracticeAreaSearch =
    !!trimmedSearch &&
    practiceAreas.some((area) => practiceAreaMatches(searchPracticeArea, [area.name]));

  const filteredLawyers = lawyers.filter((lawyer) => {
    const practiceAreas = getPracticeAreas(lawyer);
    const locations = getLocations(lawyer);
    const lowerSearch = trimmedSearch.toLowerCase();
    const matchesSearch = trimmedSearch
      ? isPracticeAreaSearch
        ? practiceAreaMatches(searchPracticeArea, practiceAreas)
        : lawyer.full_name?.toLowerCase().includes(lowerSearch) ||
          practiceAreas.some((area) => area.toLowerCase().includes(lowerSearch)) ||
          locations.some((loc) => loc.toLowerCase().includes(lowerSearch))
      : true;

    const matchesPracticeArea =
      selectedPracticeArea === "all" ||
      practiceAreaMatches(selectedPracticeArea, practiceAreas);

    return matchesSearch && matchesPracticeArea;
  });

  const preferredPracticeArea = isPracticeAreaSearch
    ? searchPracticeArea
    : selectedPracticeArea !== "all"
      ? selectedPracticeArea
      : "";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Find Your Lawyer</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search through our network of experienced attorneys
            </p>
          </div>

          <div className="max-w-4xl mx-auto mb-12 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name, practice area, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={selectedPracticeArea} onValueChange={setSelectedPracticeArea}>
              <SelectTrigger>
                <SelectValue placeholder="All Practice Areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Practice Areas</SelectItem>
                {practiceAreas.map((area) => (
                  <SelectItem key={area.id} value={area.name}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="elegant-card animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-lg bg-muted flex-shrink-0" />
                    <div className="flex-1 space-y-3">
                      <div className="h-5 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="h-4 bg-muted rounded w-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredLawyers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No lawyers found matching your criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLawyers.map((lawyer) => {
                const displayArea = getDisplayPracticeArea(lawyer, preferredPracticeArea);
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

export default Lawyers;
