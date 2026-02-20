import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, MapPin, Briefcase, Calendar, DollarSign, GraduationCap, Languages, Award } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ExpertisePieChart from "@/components/lawyer/ExpertisePieChart";
import { getPrimaryLocation, getPrimaryPracticeArea } from "@/lib/lawyerDisplay";

const LawyerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expertiseData, setExpertiseData] = useState<Array<{ practiceArea: string; years: number }>>([]);
  const [loadingExpertise, setLoadingExpertise] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchLawyerProfile();
    trackProfileView();
    fetchExpertiseData();
  }, [id]);

  const trackProfileView = async () => {
    if (!id) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check for duplicate view in last 24 hours
    if (user) {
      const { data: recentView } = await supabase
        .from('profile_views')
        .select('id')
        .eq('lawyer_id', id)
        .eq('viewer_id', user.id)
        .gte('viewed_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .maybeSingle();
      
      if (recentView) {
        console.log('Profile already viewed in last 24 hours');
        return; // Skip if viewed recently
      }
    }
    
    // Capture user agent
    const userAgent = navigator.userAgent;
    
    const { error } = await supabase.from('profile_views').insert({
      lawyer_id: id,
      viewer_id: user?.id || null,
      user_agent: userAgent,
    });
    
    if (error) {
      console.error('Error tracking profile view:', error);
    } else {
      console.log('Profile view tracked successfully');
    }
  };

  const fetchLawyerProfile = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc("get_lawyer_profile", {
      lawyer_profile_id: id
    });

    if (error) {
      toast({
        title: "Error loading profile",
        description: error.message,
        variant: "destructive",
      });
    } else if (!data || data.length === 0) {
      toast({
        title: "Lawyer not found",
        variant: "destructive",
      });
      navigate("/lawyers");
    } else {
      setLawyer(data[0]);
    }
    setLoading(false);
  };

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-20 px-4 text-center">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!lawyer) return null;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="elegant-card mb-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-32 h-32 rounded-lg bg-muted flex-shrink-0 overflow-hidden mx-auto md:mx-0">
                <img
                  src={lawyer.avatar_url || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop"}
                  alt={lawyer.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{lawyer.full_name || "Unknown"}</h1>
                <Badge className="mb-4">{getPrimaryPracticeArea(lawyer)}</Badge>
                
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 fill-secondary text-secondary" />
                  <span className="text-lg font-semibold">{lawyer.rating || 0}</span>
                  <span className="text-muted-foreground">({lawyer.total_reviews || 0} reviews)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{getPrimaryLocation(lawyer)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span>{lawyer.experience_years} years experience</span>
                  </div>
                  {lawyer.hourly_rate && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>${lawyer.hourly_rate}/hour</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex gap-3">
                  <Button onClick={() => navigate(`/book-consultation/${lawyer.id}`)}>
                    Book Consultation
                  </Button>
                  <Button variant="outline">Send Message</Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {lawyer.bio && (
                <Card>
                  <CardHeader>
                    <CardTitle>About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{lawyer.bio}</p>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Areas of Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingExpertise ? (
                    <p className="text-sm text-muted-foreground">Loading expertise data...</p>
                  ) : expertiseData.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Expertise information not yet provided</p>
                  ) : (
                    <ExpertisePieChart expertiseData={expertiseData} />
                  )}
                </CardContent>
              </Card>

              {lawyer.education && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5" />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{lawyer.education}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-6">
              {lawyer.certifications && lawyer.certifications.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {lawyer.certifications.map((cert: string, index: number) => (
                        <li key={index} className="text-sm text-muted-foreground">• {cert}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {lawyer.languages && lawyer.languages.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Languages className="h-5 w-5" />
                      Languages
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {lawyer.languages.map((lang: string, index: number) => (
                        <Badge key={index} variant="secondary">{lang}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default LawyerProfile;
