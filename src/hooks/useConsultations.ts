import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

interface EnrichedConsultation {
  id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number;
  notes?: string;
  amount?: number;
  payment_status?: string;
  profiles?: {
    full_name: string;
    email: string;
  };
  lawyer_profiles?: {
    practice_areas?: string[] | null;
    ny_locations?: string[] | null;
    specialty?: string | null;
    location?: string | null;
    user_id: string;
    timezone?: string;
    profiles?: {
      full_name: string;
    };
  };
  practice_areas?: {
    name: string;
  };
  formattedTime?: string; // Pre-formatted time in lawyer's timezone
}

export const useConsultations = () => {
  const [consultations, setConsultations] = useState<EnrichedConsultation[]>([]);
  const [loading, setLoading] = useState(false);

  const enrichConsultationData = async (consultation: any, userType: "client" | "lawyer") => {
    if (userType === "client") {
      // Fetch lawyer profile using lawyer_profiles.id
      const { data: lawyerProfile } = await supabase
        .from("lawyer_profiles")
        .select("practice_areas, ny_locations, specialty, location, user_id, timezone")
        .eq("id", consultation.lawyer_id)
        .maybeSingle();

      // Fetch lawyer name from profiles using the user_id from lawyer_profile
      const { data: lawyerProfileData } = lawyerProfile
        ? await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", lawyerProfile.user_id)
            .maybeSingle()
        : { data: null };

      // Fetch practice area
      const { data: practiceArea } = consultation.practice_area_id
        ? await supabase
            .from("practice_areas")
            .select("name")
            .eq("id", consultation.practice_area_id)
            .maybeSingle()
        : { data: null };

      // Format time in lawyer's timezone for display
      const tz = lawyerProfile?.timezone || "America/New_York";
      const formattedTime = formatInTimeZone(
        consultation.scheduled_at, 
        tz, 
        "MMM d, yyyy 'at' h:mm a zzz"
      );

      return {
        ...consultation,
        lawyer_profiles: {
          ...lawyerProfile,
          profiles: lawyerProfileData,
        },
        practice_areas: practiceArea,
        formattedTime,
      };
    } else {
      // Lawyer view - fetch client data
      const { data: clientProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("user_id", consultation.client_id)
        .maybeSingle();

      const { data: practiceArea } = consultation.practice_area_id
        ? await supabase
            .from("practice_areas")
            .select("name")
            .eq("id", consultation.practice_area_id)
            .maybeSingle()
        : { data: null };

      return {
        ...consultation,
        profiles: clientProfile,
        practice_areas: practiceArea,
      };
    }
  };

  const fetchClientConsultations = async (userId: string) => {
    setLoading(true);
    const { data: consultationsData } = await supabase
      .from("consultations")
      .select("*")
      .eq("client_id", userId)
      .order("scheduled_at", { ascending: true });

    if (!consultationsData) {
      setConsultations([]);
      setLoading(false);
      return [];
    }

    // Enrich each consultation with related data
    const enrichedConsultations = await Promise.all(
      consultationsData.map(async (consultation) => 
        enrichConsultationData(consultation, "client")
      )
    );

    setConsultations(enrichedConsultations);
    setLoading(false);
    return enrichedConsultations;
  };

  const fetchLawyerConsultations = async (userId: string) => {
    setLoading(true);
    
    // First get the lawyer_profile.id for this user
    const { data: lawyerData } = await supabase
      .from("lawyer_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!lawyerData) {
      setConsultations([]);
      setLoading(false);
      return { upcoming: [], past: [] };
    }

    const now = new Date().toISOString();
    
    // Fetch upcoming consultations
    const { data: upcomingData } = await supabase
      .from("consultations")
      .select("*")
      .eq("lawyer_id", lawyerData.id)
      .gte("scheduled_at", now)
      .in("status", ["pending", "confirmed"])
      .order("scheduled_at", { ascending: true });

    // Fetch past consultations
    const { data: pastData } = await supabase
      .from("consultations")
      .select("*")
      .eq("lawyer_id", lawyerData.id)
      .or(`scheduled_at.lt.${now},status.in.(completed,cancelled)`)
      .order("scheduled_at", { ascending: false });

    // Enrich consultations with related data
    const enrichedUpcoming = await Promise.all(
      (upcomingData || []).map(async (consultation) => 
        enrichConsultationData(consultation, "lawyer")
      )
    );

    const enrichedPast = await Promise.all(
      (pastData || []).map(async (consultation) => 
        enrichConsultationData(consultation, "lawyer")
      )
    );

    setLoading(false);
    return { upcoming: enrichedUpcoming, past: enrichedPast };
  };

  return {
    consultations,
    loading,
    fetchClientConsultations,
    fetchLawyerConsultations,
  };
};
