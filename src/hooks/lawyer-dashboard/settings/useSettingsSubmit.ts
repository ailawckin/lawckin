import { useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MAX_BIO_LENGTH, MAX_EDUCATION_LENGTH } from "@/components/lawyer/dashboard/constants";
import { buildStreetAddress } from "./utils";

const buildEmbeddingText = (formData: any, selectedSpecificIssues: Record<string, string[]>) => {
  const specificIssues = Object.values(selectedSpecificIssues || {}).flat().filter(Boolean);
  const parts = [
    formData.full_name ? `Name: ${formData.full_name}` : null,
    formData.specialty?.length ? `Practice areas: ${formData.specialty.join(", ")}` : null,
    specificIssues.length ? `Specific issues: ${specificIssues.join(", ")}` : null,
    formData.bio ? `Bio: ${formData.bio}` : null,
    formData.education ? `Education: ${formData.education}` : null,
    formData.languages?.length ? `Languages: ${formData.languages.join(", ")}` : null,
    formData.location?.length ? `Locations: ${formData.location.join(", ")}` : null,
    Number.isFinite(Number(formData.experience_years))
      ? `Experience: ${formData.experience_years} years`
      : null,
    formData.hourly_rate ? `Hourly rate: ${formData.hourly_rate}` : null,
    formData.meeting_types?.length ? `Meeting types: ${formData.meeting_types.join(", ")}` : null,
    formData.fee_models?.length ? `Fee models: ${formData.fee_models.join(", ")}` : null,
    formData.certifications?.length ? `Certifications: ${formData.certifications.join(", ")}` : null,
  ];

  return parts.filter(Boolean).join("\n");
};

interface UseSettingsSubmitArgs {
  user: any | null;
  lawyerProfile: any | null;
  formData: any;
  selectedSpecificIssues: Record<string, string[]>;
  practiceAreaYears: Record<string, number>;
  serviceAreas: string[];
  defaultFormErrors: Record<string, string>;
  setFormErrors: (value: Record<string, string>) => void;
  setIsDirty: (value: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  fetchLawyerProfile: (userId: string) => Promise<any>;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
  saveSpecializationsRef: React.MutableRefObject<(() => Promise<void>) | null>;
  getAddressValidation: (postalCode: string, stateValue: string) => string;
}

export function useSettingsSubmit({
  user,
  lawyerProfile,
  formData,
  selectedSpecificIssues,
  practiceAreaYears,
  serviceAreas,
  defaultFormErrors,
  setFormErrors,
  setIsDirty,
  fetchProfile,
  fetchLawyerProfile,
  toast,
  saveSpecializationsRef,
  getAddressValidation,
}: UseSettingsSubmitArgs) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormErrors({
      ...defaultFormErrors,
    });

    try {
      if (!formData.timezone) {
        setFormErrors((prev) => ({ ...prev, timezone: "Please select a timezone." }));
        toast({
          title: "Timezone required",
          description: "Please select your timezone before saving.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (![30, 60].includes(Number(formData.slot_duration_minutes))) {
        toast({
          title: "Invalid consultation length",
          description: "Consultation length must be 30 or 60 minutes.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (formData.specialty.length === 0) {
        toast({
          title: "Specialty required",
          description: "Please select at least one specialty.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (formData.location.length === 0) {
        toast({
          title: "Service area required",
          description: "Please select at least one service area.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (
        !Number.isInteger(formData.experience_years) ||
        formData.experience_years < 0 ||
        formData.experience_years > 60
      ) {
        setFormErrors((prev) => ({
          ...prev,
          experienceYears: "Experience must be between 0 and 60 years.",
        }));
        toast({
          title: "Invalid experience",
          description: "Experience must be a whole number between 0 and 60.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const hourlyRateValue = Number(formData.hourly_rate || 0);
      const requiresHourlyRate = formData.fee_models.includes("Hourly") || hourlyRateValue > 0;
      if (requiresHourlyRate && (hourlyRateValue < 25 || hourlyRateValue > 2000)) {
        setFormErrors((prev) => ({
          ...prev,
          hourlyRate: "Hourly rate must be between $25 and $2,000.",
        }));
        toast({
          title: "Invalid hourly rate",
          description: "Hourly rate must be between $25 and $2,000.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (!formData.address_street || !formData.address_city || !formData.address_postal_code) {
        setFormErrors((prev) => ({
          ...prev,
          address: "Please complete all required address fields.",
        }));
        toast({
          title: "Address required",
          description: "Please complete all required address fields.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      const addressFormatError = getAddressValidation(
        formData.address_postal_code,
        formData.address_state
      );
      if (addressFormatError) {
        setFormErrors((prev) => ({
          ...prev,
          address: addressFormatError,
        }));
        toast({
          title: "Address format issue",
          description: addressFormatError,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (formData.bio.length > MAX_BIO_LENGTH) {
        setFormErrors((prev) => ({
          ...prev,
          bio: `Bio must be under ${MAX_BIO_LENGTH} characters.`,
        }));
        setIsSaving(false);
        return;
      }

      if (formData.education.length > MAX_EDUCATION_LENGTH) {
        setFormErrors((prev) => ({
          ...prev,
          education: `Education must be under ${MAX_EDUCATION_LENGTH} characters.`,
        }));
        setIsSaving(false);
        return;
      }

      const invalidLocations = formData.location.filter(
        (loc: string) => !serviceAreas.includes(loc as any)
      );
      if (invalidLocations.length > 0) {
        toast({
          title: "Invalid location",
          description: "Please select only valid locations from the provided list.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      if (lawyerProfile && user) {
        const previousSlotDuration = Number(lawyerProfile.slot_duration_minutes || 30);
        const nextSlotDuration = Number(formData.slot_duration_minutes || 30);
        const cleanedCertifications = Array.isArray(formData.certifications)
          ? formData.certifications.map((item: string) => item.trim()).filter(Boolean)
          : [];
        if (formData.full_name) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ full_name: formData.full_name })
            .eq("user_id", user.id);

          if (profileError) throw profileError;
        }

        const primaryLocation = formData.location.length > 0 ? formData.location[0] : null;
        const primarySpecialty = formData.specialty.length > 0 ? formData.specialty[0] : null;
          const updateData: any = {
            specialty: primarySpecialty,
            practice_areas: formData.specialty,
            experience_years: formData.experience_years,
            hourly_rate: formData.hourly_rate,
            bar_number: formData.bar_number || null,
            certifications: cleanedCertifications.length > 0 ? cleanedCertifications : null,
            accepting_new_clients: formData.accepting_new_clients,
            profile_visible: formData.profile_visible,
            notify_email: formData.notify_email,
            notify_sms: formData.notify_sms,
            notify_consultation_reminders: formData.notify_consultation_reminders,
            notify_new_messages: formData.notify_new_messages,
            notify_marketing: formData.notify_marketing,
            timezone: formData.timezone,
            languages: formData.languages,
            meeting_types: formData.meeting_types,
            fee_models: formData.fee_models,
          fee_model_rates: formData.fee_model_rates,
          slot_duration_minutes: nextSlotDuration,
          bio: formData.bio,
          education: formData.education,
          location: primaryLocation,
          ny_locations: formData.location,
          specific_issues:
            Object.keys(selectedSpecificIssues).length > 0 ? selectedSpecificIssues : null,
          address_street: formData.address_street || null,
          address_unit: formData.address_unit || null,
          address_city: formData.address_city || null,
          address_state: formData.address_state || null,
          address_postal_code: formData.address_postal_code || null,
          address_country: formData.address_country || null,
        };

        updateData.street_address = buildStreetAddress(formData) || null;

        const { error } = await supabase
          .from("lawyer_profiles")
          .update(updateData)
          .eq("id", lawyerProfile.id);

        if (error) throw error;

        if (lawyerProfile.id && previousSlotDuration !== nextSlotDuration) {
          const { error: rebuildError } = await supabase.rpc("rebuild_time_slots_for_lawyer", {
            p_lawyer_id: lawyerProfile.id,
          });
          if (rebuildError) {
            toast({
              title: "Slot refresh failed",
              description: "Saved, but failed to rebuild time slots. Please try syncing later.",
              variant: "destructive",
            });
          }
        }

        if (lawyerProfile.id) {
          if (formData.specialty.length === 0) {
            await supabase.from("lawyer_expertise").delete().eq("lawyer_id", lawyerProfile.id);
          } else {
            const { data: practiceAreasData } = await supabase
              .from("practice_areas")
              .select("id, name")
              .in("name", formData.specialty);

            if (practiceAreasData && practiceAreasData.length > 0) {
              const selectedAreaIds = practiceAreasData.map((pa) => pa.id);

              const { data: currentExpertise } = await supabase
                .from("lawyer_expertise")
                .select("practice_area_id")
                .eq("lawyer_id", lawyerProfile.id);

              const currentAreaIds = new Set(
                (currentExpertise || []).map((e: any) => e.practice_area_id)
              );

              const areasToDelete = Array.from(currentAreaIds).filter(
                (id) => !selectedAreaIds.includes(id)
              );

              if (areasToDelete.length > 0) {
                await supabase
                  .from("lawyer_expertise")
                  .delete()
                  .eq("lawyer_id", lawyerProfile.id)
                  .in("practice_area_id", areasToDelete);
              }

              const expertiseToUpsert = practiceAreasData
                .filter((pa) => {
                  const years = practiceAreaYears[pa.name] || 0;
                  return years > 0;
                })
                .map((pa) => ({
                  lawyer_id: lawyerProfile.id,
                  practice_area_id: pa.id,
                  years_experience: practiceAreaYears[pa.name] || 0,
                }));

              if (expertiseToUpsert.length > 0) {
                const { error: upsertError } = await supabase
                  .from("lawyer_expertise")
                  .upsert(expertiseToUpsert, {
                    onConflict: "lawyer_id,practice_area_id",
                  });

                if (upsertError) {
                  console.error("Error upserting expertise:", upsertError);
                  throw upsertError;
                }
              } else {
                await supabase
                  .from("lawyer_expertise")
                  .delete()
                  .eq("lawyer_id", lawyerProfile.id)
                  .in("practice_area_id", selectedAreaIds);
              }
            }
          }
        }

        let specializationSaveSuccess = true;
        if (saveSpecializationsRef.current) {
          try {
            await saveSpecializationsRef.current();
          } catch (error: any) {
            console.error("Error saving specializations:", error);
            specializationSaveSuccess = false;
            toast({
              title: "Warning",
              description:
                "Profile saved but some specialization changes may not have been saved. Please check and save again.",
              variant: "destructive",
            });
          }
        }

        if (specializationSaveSuccess) {
          toast({
            title: "Profile updated",
            description: "All changes have been saved successfully",
          });
        }

        await fetchProfile(user.id);
        await fetchLawyerProfile(user.id);
        setIsDirty(false);

        if (lawyerProfile.id) {
          const embeddingText = buildEmbeddingText(formData, selectedSpecificIssues);
          if (embeddingText.trim().length >= 10) {
            void (async () => {
              try {
                const { data, error: embeddingError } = await supabase.functions.invoke(
                  "ai-lawyer-profile-embedding",
                  {
                    body: { input: embeddingText },
                  }
                );

                if (embeddingError) {
                  console.warn("Lawyer embedding refresh failed:", embeddingError);
                  return;
                }

                if (Array.isArray(data?.embedding)) {
                  await supabase
                    .from("lawyer_profiles")
                    .update({
                      embedding: data.embedding,
                      embedding_text: embeddingText,
                      embedding_model:
                        typeof data?.embedding_model === "string"
                          ? data.embedding_model
                          : "text-embedding-3-small",
                      embedding_updated_at: new Date().toISOString(),
                    })
                    .eq("id", lawyerProfile.id);
                }
              } catch (embeddingUpdateError) {
                console.warn("Lawyer embedding refresh failed:", embeddingUpdateError);
              }
            })();
          }
        }
      }
    } catch (error: any) {
      toast({
        title: "Error updating profile",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    handleSubmit,
  };
}
