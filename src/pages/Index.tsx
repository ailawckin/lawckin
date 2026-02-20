import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import LawyerCard from "@/components/LawyerCard";
import PracticeAreas from "@/components/PracticeAreas";
import Footer from "@/components/Footer";
import FindLawyerModal from "@/components/FindLawyerModal";
import { countryConfig } from "@/config/country";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, Calendar, CheckCircle, Users, Shield, Clock, ArrowRight } from "lucide-react";
import { formatPracticeAreaLabel, getDisplayPracticeArea, getPrimaryLocation } from "@/lib/lawyerDisplay";

const Index = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [featuredLawyers, setFeaturedLawyers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [findLawyerModalOpen, setFindLawyerModalOpen] = useState(false);
  const [stats, setStats] = useState({
    totalLawyers: 0,
    totalPracticeAreas: 0,
    totalConsultations: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedLawyers();
    fetchStats();
  }, []);

  // Handle hash navigation for smooth scrolling
  useEffect(() => {
    if (location.hash) {
      // Small delay to ensure DOM is ready
      setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          const headerOffset = 80; // Account for fixed header
          const elementPosition = element.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  }, [location]);

  const fetchFeaturedLawyers = async () => {
    const { data } = await supabase.rpc("get_lawyers_list");

    if (data) {
      setFeaturedLawyers(data.slice(0, 6));
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      // Get total verified lawyers
      const { count: lawyerCount } = await supabase
        .from("lawyer_profiles")
        .select("*", { count: "exact", head: true })
        .eq("verified", true)
        .eq("status", "active");

      // Get total practice areas
      const { count: practiceAreaCount } = await supabase
        .from("practice_areas")
        .select("*", { count: "exact", head: true });

      // Get total consultations
      const { count: consultationCount } = await supabase
        .from("consultations")
        .select("*", { count: "exact", head: true });

      setStats({
        totalLawyers: lawyerCount || 0,
        totalPracticeAreas: practiceAreaCount || 0,
        totalConsultations: consultationCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setStatsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main id="main-content">
        <Hero />
      
      {/* Trust Indicators / Stats Section */}
      <section className="py-12 px-4 bg-muted/30 border-y" aria-label="Platform statistics">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-2" aria-hidden="true">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                {statsLoading ? (
                  <div className="h-10 w-20 bg-muted animate-pulse rounded mx-auto mb-1" />
                ) : (
                  <div className="text-3xl font-bold mb-1">
                    {stats.totalLawyers > 0 ? `${stats.totalLawyers}+` : 'Coming Soon'}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">Verified Lawyers</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-2" aria-hidden="true">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                {statsLoading ? (
                  <div className="h-10 w-20 bg-muted animate-pulse rounded mx-auto mb-1" />
                ) : (
                  <div className="text-3xl font-bold mb-1">
                    {stats.totalPracticeAreas > 0 ? `${stats.totalPracticeAreas}+` : 'Coming Soon'}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">Practice Areas</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center mb-2" aria-hidden="true">
                  <CheckCircle className="h-8 w-8 text-primary" />
                </div>
                {statsLoading ? (
                  <div className="h-10 w-20 bg-muted animate-pulse rounded mx-auto mb-1" />
                ) : (
                  <div className="text-3xl font-bold mb-1">
                    {stats.totalConsultations > 0 ? `${stats.totalConsultations}+` : 'Coming Soon'}
                  </div>
                )}
                <div className="text-sm text-muted-foreground">Consultations Booked</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4" aria-label="How Lawckin works">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How Lawckin Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Find and connect with the perfect lawyer in three simple steps
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-2 max-w-5xl mx-auto">
            <Card className="text-center relative w-full md:flex-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
              <CardContent className="pt-6">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                    1
                  </div>
                </div>
                <div className="flex items-center justify-center mb-4 mt-4" aria-hidden="true">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Tell Us What You Need</h3>
                <p className="text-muted-foreground">
                  Answer a few quick questions about your legal situation and location
                </p>
              </CardContent>
            </Card>
            
            {/* Arrow between cards 1 and 2 */}
            <ArrowRight className="hidden md:block h-6 w-6 text-primary/40 flex-shrink-0 mx-2" />
            
            <Card className="text-center relative w-full md:flex-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              <CardContent className="pt-6">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                    2
                  </div>
                </div>
                <div className="flex items-center justify-center mb-4 mt-4" aria-hidden="true">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Browse Verified Lawyers</h3>
                <p className="text-muted-foreground">
                  Review profiles, credentials, and experience of lawyers matched to your needs
                </p>
              </CardContent>
            </Card>
            
            {/* Arrow between cards 2 and 3 */}
            <ArrowRight className="hidden md:block h-6 w-6 text-primary/40 flex-shrink-0 mx-2" />
            
            <Card className="text-center relative w-full md:flex-1 opacity-0 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <CardContent className="pt-6">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shadow-lg">
                    3
                  </div>
                </div>
                <div className="flex items-center justify-center mb-4 mt-4" aria-hidden="true">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Book Instantly</h3>
                <p className="text-muted-foreground">
                  Schedule a consultation at your convenience with instant booking
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      
      <section id="find-lawyers" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Featured Attorneys</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Browse our network of highly-rated, experienced lawyers
            </p>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" aria-label="Loading lawyers" />
              <p className="text-muted-foreground">Loading lawyers...</p>
            </div>
          ) : featuredLawyers.length === 0 ? (
            <div className="text-center py-12 max-w-md mx-auto">
              <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No lawyers available yet</h3>
              <p className="text-muted-foreground mb-4">
                We're building our network of verified attorneys. Check back soon!
              </p>
              <Button onClick={() => setFindLawyerModalOpen(true)} variant="outline">
                Find a Lawyer
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredLawyers.map((lawyer) => {
                const displayArea = getDisplayPracticeArea(lawyer);
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
                  />
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Button onClick={() => navigate("/lawyers")} variant="outline" size="lg">
              View All Lawyers
            </Button>
          </div>
        </div>
      </section>
      
      <PracticeAreas />
      
      {/* FAQ Section */}
      <section className="py-20 px-4" aria-label="Frequently asked questions">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about using Lawckin
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>How do I find a lawyer on Lawckin?</AccordionTrigger>
                <AccordionContent>
                  Simply click "Find Your Lawyer Now" and answer a few questions about your legal needs and location. We'll match you with verified lawyers in your area who specialize in your specific legal issue.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Are all lawyers verified?</AccordionTrigger>
                <AccordionContent>
                  Yes, all lawyers on Lawckin are verified professionals. We verify their credentials, bar admission status, and professional standing before they can join our platform.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How much does a consultation cost?</AccordionTrigger>
                <AccordionContent>
                  All consultations on Lawckin are free. You can book an initial consultation with any lawyer at no cost. This allows you to discuss your legal needs and determine if the lawyer is the right fit for your case before committing to any paid services.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger>Can I book a consultation online?</AccordionTrigger>
                <AccordionContent>
                  Yes! Once you find a lawyer you'd like to work with, you can view their available time slots and book a consultation directly through our platform. It's instant and convenient.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-5">
                <AccordionTrigger>What if I need to cancel or reschedule?</AccordionTrigger>
                <AccordionContent>
                  You can manage your consultations through your dashboard. Most lawyers allow cancellations or rescheduling up to 24 hours before the scheduled time. Check the specific lawyer's cancellation policy on their profile.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-6">
                <AccordionTrigger>Is my information confidential?</AccordionTrigger>
                <AccordionContent>
                  Yes, absolutely. We take your privacy seriously. All information you share with us and with lawyers through the platform is kept confidential. We use industry-standard encryption and security measures to protect your data. Your conversations and consultations are private and not shared with third parties.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-7">
                <AccordionTrigger>Is Lawckin only for {countryConfig.displayName}?</AccordionTrigger>
                <AccordionContent>
                  {countryConfig.copy.faqLocationAnswer}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>
      
      {/* Secondary CTA Section */}
      <section className="py-20 px-4 bg-primary/5" aria-label="Call to action">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Ready to Lawckin your legal solution?
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of clients who found the right legal representation through Lawckin
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => setFindLawyerModalOpen(true)}
                className="h-14 px-8 text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Find a Lawyer
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
                className="h-14 px-8 text-lg font-semibold border-2"
              >
                For Lawyers: Sign Up
              </Button>
            </div>
          </div>
        </div>
      </section>
      
      </main>
      <Footer />
      
      <FindLawyerModal open={findLawyerModalOpen} onOpenChange={setFindLawyerModalOpen} />
    </div>
  );
};

export default Index;
