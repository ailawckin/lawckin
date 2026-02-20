import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getCustomLanguagesFrom, normalizeFeeModelRates, normalizeFeeModels, normalizeLanguage } from "./utils";

interface UseSettingsProfileDataArgs {
  user: any | null;
  lawyerProfile: any | null;
  setLawyerProfile: (value: any) => void;
  formData: any;
  setFormData: (value: any) => void;
  serviceAreas: string[];
  countryCode: string;
  defaultFormErrors: Record<string, string>;
  setFormErrors: (value: Record<string, string>) => void;
  setCustomLanguageOptions: (value: string[] | ((prev: string[]) => string[])) => void;
  setCustomLanguage: (value: string) => void;
  refreshSpecializations: () => Promise<void>;
  setIsDirty: (value: boolean) => void;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

export function useSettingsProfileData({
  user,
  lawyerProfile,
  setLawyerProfile,
  formData,
  setFormData,
  serviceAreas,
  countryCode,
  defaultFormErrors,
  setFormErrors,
  setCustomLanguageOptions,
  setCustomLanguage,
  refreshSpecializations,
  setIsDirty,
  toast,
}: UseSettingsProfileDataArgs) {
  const [lawyerExpertise, setLawyerExpertise] = useState<Record<string, number>>({});
  const [practiceAreaYears, setPracticeAreaYears] = useState<Record<string, number>>({});
  const [practiceAreaYearsInput, setPracticeAreaYearsInput] = useState<Record<string, string>>({});
  const [practiceAreaIds, setPracticeAreaIds] = useState<Record<string, string>>({});
  const [selectedSpecificIssues, setSelectedSpecificIssues] = useState<Record<string, string[]>>({});
  const [lastSavedSettings, setLastSavedSettings] = useState<any>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const fetchLawyerExpertise = async (userId: string, lawyerProfileId?: string) => {
    const profileId = lawyerProfileId || lawyerProfile?.id;
    if (!profileId) return;

    const { data: expertise } = await supabase
      .from("lawyer_expertise")
      .select("practice_area_id, years_experience, practice_areas(name)")
      .eq("lawyer_id", profileId);

    const { data: specializations } = await supabase
      .from("lawyer_specializations")
      .select(`
        specialization_id,
        years_experience,
        practice_area_specializations!inner(
          id,
          practice_area_id,
          practice_areas!inner(name)
        )
      `)
      .eq("lawyer_id", profileId);

    const expertiseMap: Record<string, number> = {};
    const practiceAreaYearsMap: Record<string, number> = {};

    (expertise || []).forEach((item: any) => {
      const areaName = item.practice_areas?.name;
      if (areaName) {
        const years = item.years_experience || 0;
        expertiseMap[areaName] = Math.max(expertiseMap[areaName] || 0, years);
        practiceAreaYearsMap[areaName] = years;
      }
    });

    (specializations || []).forEach((item: any) => {
      const practiceArea = item.practice_area_specializations?.practice_areas;
      const areaName = practiceArea?.name;
      if (areaName) {
        expertiseMap[areaName] = Math.max(expertiseMap[areaName] || 0, item.years_experience || 0);
      }
    });

    setLawyerExpertise(expertiseMap);
    setPracticeAreaYears(practiceAreaYearsMap);
    setPracticeAreaYearsInput({});
    return { practiceAreaYears: practiceAreaYearsMap, practiceAreaYearsInput: {} };
  };

  const fetchLawyerProfile = async (userId: string) => {
    setSettingsLoading(true);
    const { data, error } = await supabase
      .from("lawyer_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching lawyer profile:", error);
      setSettingsLoading(false);
      return null;
    }

    if (data) {
      setLawyerProfile(data);
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("user_id", userId)
        .maybeSingle();

      const locations =
        data.ny_locations && Array.isArray(data.ny_locations) && data.ny_locations.length > 0
          ? data.ny_locations.filter((loc: string) => serviceAreas.includes(loc as any))
          : data.location
            ? [data.location].filter((loc: string) => serviceAreas.includes(loc as any))
            : [];

      let specialties: string[] = [];
      if (data.practice_areas && Array.isArray(data.practice_areas) && data.practice_areas.length > 0) {
        specialties = data.practice_areas;
      } else if (data.specialty) {
        specialties = [data.specialty];
      }

      const normalizedFeeRates = normalizeFeeModelRates(data.fee_model_rates);
      const normalizedFeeModels = normalizeFeeModels(data.fee_models);
      const hourlyRateValue =
        data.hourly_rate ??
        (normalizedFeeRates["Hourly"] ? Number(normalizedFeeRates["Hourly"]) : 0);
      const syncedFeeRates =
        normalizedFeeModels.includes("Hourly") && hourlyRateValue
          ? {
              ...normalizedFeeRates,
              Hourly: normalizedFeeRates["Hourly"] || String(hourlyRateValue),
            }
          : normalizedFeeRates;

      const nextLanguages = Array.isArray(data.languages)
        ? data.languages.map((lang) => normalizeLanguage(String(lang))).filter(Boolean)
        : [];
      const nextFormData = {
        ...formData,
        full_name: profileData?.full_name || formData.full_name || "",
        specialty: specialties,
        experience_years: data.experience_years || 0,
        hourly_rate: hourlyRateValue || 0,
        bar_number: data.bar_number || "",
        certifications: Array.isArray(data.certifications) ? data.certifications : [],
        accepting_new_clients: data.accepting_new_clients ?? true,
        profile_visible: data.profile_visible ?? true,
        notify_email: data.notify_email ?? true,
        notify_sms: data.notify_sms ?? false,
        notify_consultation_reminders: data.notify_consultation_reminders ?? true,
        notify_new_messages: data.notify_new_messages ?? true,
        notify_marketing: data.notify_marketing ?? false,
        slot_duration_minutes: data.slot_duration_minutes || 30,
        timezone: data.timezone || formData.timezone || "",
        languages: nextLanguages,
        meeting_types: Array.isArray(data.meeting_types) ? data.meeting_types : [],
        fee_models: normalizedFeeModels,
        fee_model_rates: syncedFeeRates,
        bio: data.bio || "",
        education: data.education || "",
        location: locations,
        address_street: data.address_street || data.street_address || "",
        address_unit: data.address_unit || "",
        address_city: data.address_city || "",
        address_state: data.address_state || "",
        address_postal_code: data.address_postal_code || "",
        address_country:
          data.address_country || (countryCode === "ch" ? "Switzerland" : "United States"),
      };
      setFormData(nextFormData);

      const specificIssuesData = (data as any).specific_issues;
      let nextSpecificIssues: Record<string, string[]> = {};
      if (specificIssuesData && typeof specificIssuesData === "object") {
        try {
          const issues =
            typeof specificIssuesData === "string"
              ? JSON.parse(specificIssuesData)
              : specificIssuesData;
          nextSpecificIssues = issues as Record<string, string[]>;
          setSelectedSpecificIssues(nextSpecificIssues);
        } catch (e) {
          console.error("Error parsing specific_issues:", e);
          setSelectedSpecificIssues({});
        }
      } else {
        setSelectedSpecificIssues({});
      }

      const expertiseSnapshot = await fetchLawyerExpertise(userId, data.id);
      const nextCustomLanguages = getCustomLanguagesFrom(nextLanguages);
      setCustomLanguageOptions(nextCustomLanguages);
      setLastSavedSettings({
        formData: nextFormData,
        selectedSpecificIssues: nextSpecificIssues,
        practiceAreaYears: expertiseSnapshot?.practiceAreaYears || {},
        practiceAreaYearsInput: expertiseSnapshot?.practiceAreaYearsInput || {},
        customLanguageOptions: nextCustomLanguages,
      });
      setFormErrors(defaultFormErrors);
    }
    setSettingsLoading(false);
    return data || null;
  };

  const discardSettingsChanges = async (): Promise<boolean> => {
    if (!user?.id) return false;
    setIsDiscarding(true);
    try {
      if (!lastSavedSettings) {
        const profileResult = await fetchLawyerProfile(user.id);
        if (profileResult == null) {
          toast({
            title: "Couldn't discard changes",
            description: "Failed to load saved profile. Please try again.",
            variant: "destructive",
          });
          return false;
        }
        await refreshSpecializations();
        setCustomLanguage("");
        setFormErrors(defaultFormErrors);
        setIsDirty(false);
        return true;
      }

      setFormData(lastSavedSettings.formData);
      setSelectedSpecificIssues(lastSavedSettings.selectedSpecificIssues || {});
      setPracticeAreaYears(lastSavedSettings.practiceAreaYears || {});
      setPracticeAreaYearsInput(lastSavedSettings.practiceAreaYearsInput || {});
      setCustomLanguageOptions(lastSavedSettings.customLanguageOptions || []);
      setCustomLanguage("");
      setFormErrors(defaultFormErrors);
      await refreshSpecializations();
      setIsDirty(false);
      return true;
    } catch (error: any) {
      toast({
        title: "Couldn't discard changes",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsDiscarding(false);
    }
  };

  useEffect(() => {
    if (user && lawyerProfile) {
      fetchLawyerExpertise(user.id);
    }
  }, [user?.id, lawyerProfile?.id, formData.specialty?.join(",")]);

  return {
    lawyerExpertise,
    practiceAreaYears,
    setPracticeAreaYears,
    practiceAreaYearsInput,
    setPracticeAreaYearsInput,
    practiceAreaIds,
    setPracticeAreaIds,
    selectedSpecificIssues,
    setSelectedSpecificIssues,
    lastSavedSettings,
    settingsLoading,
    isDiscarding,
    fetchLawyerExpertise,
    fetchLawyerProfile,
    discardSettingsChanges,
  };
}
