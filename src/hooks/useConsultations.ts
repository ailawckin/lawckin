import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatInTimeZone } from "date-fns-tz";

interface EnrichedConsultation {
  id: string;
  lawyer_id: string;
  scheduled_at: string;
  status: string;
  duration_minutes: number;
  meeting_link?: string | null;
  notes?: string | null;
  amount?: number | null;
  payment_status?: string | null;
  profiles?: {
    full_name: string | null;
    email: string | null;
  } | null;
  lawyer_profiles?: {
    practice_areas?: string[] | null;
    ny_locations?: string[] | null;
    specialty?: string | null;
    location?: string | null;
    user_id: string;
    timezone?: string | null;
    profiles?: {
      full_name: string | null;
      email: string | null;
    } | null;
  } | null;
  practice_areas?: {
    name: string;
  } | null;
  formattedTime?: string;
}

export const useConsultations = () => {
  const [consultations, setConsultations] = useState<EnrichedConsultation[]>([]);
  const [loading, setLoading] = useState(false);

  const enrichConsultationData = async (
    consultation: EnrichedConsultation & { client_id?: string; practice_area_id?: string | null },
    userType: "client" | "lawyer"
  ): Promise<EnrichedConsultation> => {
    if (userType === "client") {
      const { data: lawyerProfile } = await supabase
        .from("lawyer_profiles")
        .select("practice_areas, ny_locations, specialty, location, user_id, timezone")
        .eq("id", consultation.lawyer_id)
        .maybeSingle();

      const { data: lawyerProfileData } = lawyerProfile
        ? await supabase
            .from("profiles")
            .select("full_name, email")
            .eq("user_id", lawyerProfile.user_id)
            .maybeSingle()
        : { data: null };

      const { data: practiceArea } = consultation.practice_area_id
        ? await supabase
            .from("practice_areas")
            .select("name")
            .eq("id", consultation.practice_area_id)
            .maybeSingle()
        : { data: null };

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
    }

    const { data: clientProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("user_id", consultation.client_id as string)
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

    const enrichedConsultations = await Promise.all(
      consultationsData.map(async (consultation) => enrichConsultationData(consultation as any, "client"))
    );

    setConsultations(enrichedConsultations);
    setLoading(false);
    return enrichedConsultations;
  };

  const fetchLawyerConsultations = async (userId: string) => {
    setLoading(true);

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

    const { data: upcomingData } = await supabase
      .from("consultations")
      .select("*")
      .eq("lawyer_id", lawyerData.id)
      .gte("scheduled_at", now)
      .in("status", ["pending", "confirmed"])
      .order("scheduled_at", { ascending: true });

    const { data: pastData } = await supabase
      .from("consultations")
      .select("*")
      .eq("lawyer_id", lawyerData.id)
      .or(`scheduled_at.lt.${now},status.in.(completed,cancelled)`)
      .order("scheduled_at", { ascending: false });

    const enrichedUpcoming = await Promise.all(
      (upcomingData || []).map(async (consultation) => enrichConsultationData(consultation as any, "lawyer"))
    );

    const enrichedPast = await Promise.all(
      (pastData || []).map(async (consultation) => enrichConsultationData(consultation as any, "lawyer"))
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
