import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { Briefcase } from "lucide-react";
import ExpertisePieChart from "@/components/lawyer/ExpertisePieChart";
import { getPrimaryPracticeArea } from "@/lib/lawyerDisplay";

const BookConsultation = () => {
  const { lawyerId } = useParams();
  const navigate = useNavigate();
  const [lawyer, setLawyer] = useState<any>(null);
  const [practiceAreas, setPracticeAreas] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLawyerUser, setIsLawyerUser] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedSlotId, setSelectedSlotId] = useState("");
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [practiceAreaId, setPracticeAreaId] = useState("");
  const [notes, setNotes] = useState("");
  const [expertiseData, setExpertiseData] = useState<Array<{ practiceArea: string; years: number }>>([]);
  const [loadingExpertise, setLoadingExpertise] = useState(true);
  const clientTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    checkAuth();
    fetchLawyer();
  }, [lawyerId]);

  useEffect(() => {
    if (lawyer) {
      fetchLawyerPracticeAreas();
      fetchExpertiseData();
    }
  }, [lawyer]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to book a consultation",
        variant: "destructive",
      });
      navigate("/auth");
    } else {
      setUser(user);
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "lawyer")
        .maybeSingle();

      if (roleError) {
        console.error("Error checking role:", roleError);
      }

      const isLawyer = !!roleData;
      setIsLawyerUser(isLawyer);

      if (isLawyer) {
        toast({
          title: "Client account required",
          description: "Lawyer accounts cannot book consultations. Please use a client account.",
          variant: "destructive",
        });
      }
    }
  };

  const fetchLawyer = async () => {
    const { data, error } = await supabase.rpc("get_lawyer_profile", {
      lawyer_profile_id: lawyerId
    });

    if (error || !data || data.length === 0) {
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

  const fetchLawyerPracticeAreas = async () => {
    if (!lawyer) return;

    const { data } = await supabase
      .from("lawyer_expertise")
      .select(`
        practice_area_id,
        years_experience,
        practice_areas (id, name)
      `)
      .eq("lawyer_id", lawyer.id)
      .order("years_experience", { ascending: false });

    if (data) {
      const areas = data.map((item: any) => ({
        id: item.practice_areas.id,
        name: item.practice_areas.name,
      }));
      setPracticeAreas(areas);
    }
  };

  const fetchExpertiseData = async () => {
    if (!lawyer) return;
    
    setLoadingExpertise(true);
    const { data, error } = await supabase
      .from("lawyer_expertise")
      .select(`
        years_experience,
        practice_areas (name)
      `)
      .eq("lawyer_id", lawyer.id);

    if (!error && data) {
      const formattedData = data.map((item: any) => ({
        practiceArea: item.practice_areas.name,
        years: item.years_experience,
      }));
      setExpertiseData(formattedData);
    }
    setLoadingExpertise(false);
  };

  const fetchAvailableSlots = async (date: Date) => {
    if (!lawyer) return;

    setLoadingSlots(true);

    // Build the day's UTC boundaries based on the LAWYER'S timezone
    const tz = lawyer.timezone || "America/New_York";
    const dateStrInTz = formatInTimeZone(date, tz, "yyyy-MM-dd");
    const startZoned = fromZonedTime(`${dateStrInTz}T00:00:00.000`, tz);
    const endZoned = fromZonedTime(`${dateStrInTz}T23:59:59.999`, tz);

    const { data, error } = await supabase
      .from("time_slots")
      .select("*")
      .eq("lawyer_id", lawyer.id)
      .eq("is_booked", false)
      .gte("start_time", startZoned.toISOString())
      .lte("start_time", endZoned.toISOString())
      .order("start_time");

    if (error) {
      console.error("Error fetching slots:", error);
      toast({
        title: "Error loading slots",
        description: "Could not load available time slots",
        variant: "destructive",
      });
    } else {
      setAvailableSlots(data || []);
    }
    setLoadingSlots(false);
  };

  useEffect(() => {
    if (selectedDate && lawyer) {
      setSelectedSlotId("");
      fetchAvailableSlots(selectedDate);
    } else {
      setAvailableSlots([]);
      setSelectedSlotId("");
    }
  }, [selectedDate, lawyer]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLawyerUser) {
      toast({
        title: "Booking not available",
        description: "Lawyer accounts cannot book consultations. Please use a client account.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedSlotId || !practiceAreaId) {
      toast({
        title: "Missing information",
        description: "Please select a time slot and practice area",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc("book_time_slot", {
        p_slot_id: selectedSlotId,
        p_client_id: user.id,
        p_lawyer_id: lawyer.id,
        p_practice_area_id: practiceAreaId,
        p_notes: notes || null,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; consultation_id?: string };

      if (!result.success) {
        toast({
          title: "Booking unavailable",
          description: result.error || "This time slot is no longer available",
          variant: "destructive",
        });
        // Refresh slots to show current availability
        if (selectedDate) {
          fetchAvailableSlots(selectedDate);
        }
      } else {
        toast({
          title: "Consultation booked!",
          description: "Your consultation has been successfully scheduled.",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message,
        variant: "destructive",
      });
    }

    setSubmitting(false);
  };

  if (loading || !lawyer || isLawyerUser === null) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto py-20 px-4 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (isLawyerUser) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Client account required</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Lawyer accounts cannot book consultations. To book a consultation,
                  please sign in with a client account.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button onClick={() => navigate("/lawyer-dashboard")}>
                    Back to Lawyer Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => navigate("/lawyers")}>
                    Browse Lawyers
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl font-bold mb-8 text-center">Book Consultation</h1>

          <div className="elegant-card mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg bg-muted flex-shrink-0 overflow-hidden">
                <img
                  src={lawyer.avatar_url || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=200&h=200&fit=crop"}
                  alt={lawyer.full_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{lawyer.full_name}</h3>
                <p className="text-muted-foreground">{getPrimaryPracticeArea(lawyer)}</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {expertiseData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Lawyer's Expertise Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingExpertise ? (
                    <p className="text-sm text-muted-foreground">Loading expertise data...</p>
                  ) : (
                    <ExpertisePieChart expertiseData={expertiseData} />
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Consultation Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Practice Area *</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Select from this lawyer's practice areas
                  </p>
                  <Select value={practiceAreaId} onValueChange={setPracticeAreaId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select practice area" />
                    </SelectTrigger>
                    <SelectContent>
                      {practiceAreas.map((area) => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Select Date *</Label>
                  <div className="mt-2">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </div>
                </div>

                <div>
                  <Label>Select Time *</Label>
                  <p className="text-xs text-muted-foreground mt-2">
                    Times are shown in the lawyer's timezone ({lawyer.timezone || "America/New_York"}).
                    {clientTimezone && clientTimezone !== (lawyer.timezone || "America/New_York")
                      ? ` Your local timezone: ${clientTimezone}.`
                      : ""}
                  </p>
                  {!selectedDate ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      Please select a date first
                    </p>
                  ) : loadingSlots ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      Loading available slots...
                    </p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground mt-2">
                      No available slots for this date
                    </p>
                  ) : (
                    <Select value={selectedSlotId} onValueChange={setSelectedSlotId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a time slot" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableSlots.map((slot) => (
                          <SelectItem key={slot.id} value={slot.id}>
                            {formatInTimeZone(slot.start_time, lawyer.timezone || "America/New_York", "h:mm a")} - {formatInTimeZone(slot.end_time, lawyer.timezone || "America/New_York", "h:mm a")}
                            {clientTimezone && clientTimezone !== (lawyer.timezone || "America/New_York")
                              ? ` (your time: ${formatInTimeZone(slot.start_time, clientTimezone, "h:mm a")} - ${formatInTimeZone(slot.end_time, clientTimezone, "h:mm a")})`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Tell the lawyer about your case..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? "Booking..." : "Confirm Booking"}
              </Button>
            </div>
          </form>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default BookConsultation;
