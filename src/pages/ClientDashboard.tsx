import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useProfile } from "@/hooks/useProfile";
import { useConsultations } from "@/hooks/useConsultations";
import { useCancelConsultation } from "@/hooks/useCancelConsultation";
import { Home, Calendar, MessageSquare, User } from "lucide-react";
import DashboardHome from "@/components/client/DashboardHome";
import ClientConsultations from "@/components/client/ClientConsultations";
import ClientMessages from "@/components/client/ClientMessages";
import ClientProfile from "@/components/client/ClientProfile";

const ClientDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const { toast } = useToast();

  const getClientStorageKey = (suffix: string) =>
    `clientDashboard.${suffix}.${user?.id || "anonymous"}`;
  const validClientTabs = ["overview", "consultations", "messages", "profile"];
  
  const { profile, fetchProfile, updateProfile } = useProfile();
  const { consultations, fetchClientConsultations } = useConsultations();
  const { cancelConsultation: cancelConsultationHandler } = useCancelConsultation();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(getClientStorageKey("activeTab"));
    if (stored && validClientTabs.includes(stored)) {
      setActiveTab(stored);
    }
  }, [user?.id]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(getClientStorageKey("activeTab"), activeTab);
  }, [activeTab, user?.id]);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please sign in to access your dashboard",
          variant: "destructive",
        });
        navigate("/auth");
        return;
      }

      setUser(user);
      await Promise.all([
        fetchProfile(user.id),
        fetchClientConsultations(user.id)
      ]);
    } catch (error: any) {
      toast({
        title: "Unable to load dashboard",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (formData: any) => {
    const { error } = await updateProfile(user.id, formData);

    if (error) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    }
  };

  const handleCancelConsultation = async (consultationId: string) => {
    const consultation = consultations.find(c => c.id === consultationId);
    if (!consultation || !user) return;

    const result = await cancelConsultationHandler(consultation, user.id, profile, "client");
    
    if (result.success) {
      await fetchClientConsultations(user.id);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto pt-24 pb-20 px-4 text-center">
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="pt-24 pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="inline-flex">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="consultations">Consultations</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="profile">Profile</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <DashboardHome 
                consultations={consultations} 
                onTabChange={setActiveTab}
                profile={profile}
              />
            </TabsContent>

            <TabsContent value="consultations">
              <ClientConsultations 
                consultations={consultations}
                onCancelConsultation={handleCancelConsultation}
              />
            </TabsContent>

            <TabsContent value="messages">
              <ClientMessages />
            </TabsContent>

            <TabsContent value="profile">
              <ClientProfile 
                profile={profile}
                onUpdate={handleProfileUpdate}
                consultations={consultations}
              />
            </TabsContent>
          </Tabs>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ClientDashboard;
