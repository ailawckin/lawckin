import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Practice areas available during onboarding (same as LawyerOnboarding.tsx)
const PRACTICE_AREAS = [
  "Criminal Defense", "Family Law", "Immigration", "Personal Injury",
  "Real Estate", "Employment Law", "Business Law", "Estate Planning",
  "Bankruptcy", "Civil Rights"
];

interface SpecializationData {
  specialization_id: string;
  specialization_name: string;
  practice_area_id: string;
  practice_area_name: string;
  years_experience: number;
}

interface PracticeAreaData {
  practice_area_id: string;
  practice_area_name: string;
  specializations: SpecializationData[];
}

export const useLawyerSpecializations = (lawyerId: string | null) => {
  const { toast } = useToast();
  const [practiceAreas, setPracticeAreas] = useState<PracticeAreaData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localChanges, setLocalChanges] = useState<Record<string, number>>({}); // specId -> years

  // Fetch all specializations grouped by practice area
  const fetchSpecializations = useCallback(async () => {
    if (!lawyerId) return;

    try {
      setIsLoading(true);

      // Fetch lawyer's specializations with joins
      const { data: lawyerSpecs, error: lawyerSpecsError } = await supabase
        .from("lawyer_specializations")
        .select(`
          specialization_id,
          years_experience,
          practice_area_specializations!inner(
            id,
            specialization_name,
            practice_area_id,
            practice_areas!inner(
              id,
              name
            )
          )
        `)
        .eq("lawyer_id", lawyerId);

      if (lawyerSpecsError) throw lawyerSpecsError;

      // Group by practice area, only including practice areas from onboarding
      const grouped: Record<string, PracticeAreaData> = {};

      (lawyerSpecs || []).forEach((item: any) => {
        const practiceArea = item.practice_area_specializations?.practice_areas;
        const spec = item.practice_area_specializations;
        
        if (!practiceArea || !spec) return;

        // Only include practice areas from onboarding list
        if (!PRACTICE_AREAS.includes(practiceArea.name as any)) {
          return;
        }

        const areaId = practiceArea.id;
        const areaName = practiceArea.name;

        if (!grouped[areaId]) {
          grouped[areaId] = {
            practice_area_id: areaId,
            practice_area_name: areaName,
            specializations: [],
          };
        }

        grouped[areaId].specializations.push({
          specialization_id: item.specialization_id,
          specialization_name: spec.specialization_name,
          practice_area_id: areaId,
          practice_area_name: areaName,
          years_experience: item.years_experience,
        });
      });

      // Convert to array and filter out areas with no specializations
      const areasArray = Object.values(grouped).filter(
        (area) => area.specializations.length > 0
      );

      setPracticeAreas(areasArray);
      
      // Initialize local changes with all current data (including 0 years for editing)
      const initialChanges: Record<string, number> = {};
      areasArray.forEach((area) => {
        area.specializations.forEach((spec) => {
          initialChanges[spec.specialization_id] = spec.years_experience;
        });
      });
      setLocalChanges(initialChanges);
    } catch (error: any) {
      toast({
        title: "Error loading specializations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [lawyerId, toast]);

  // Update years for a specialization (local state only)
  const updateYears = useCallback((specializationId: string, years: number) => {
    setLocalChanges((prev) => ({
      ...prev,
      [specializationId]: years,
    }));
  }, []);

  // Remove a specialization (local state only)
  const removeSpecialization = useCallback((specializationId: string) => {
    setLocalChanges((prev) => {
      const updated = { ...prev };
      delete updated[specializationId];
      return updated;
    });
  }, []);

  // Add a new specialization (local state only)
  const addSpecialization = useCallback((specializationId: string, years: number = 1) => {
    setLocalChanges((prev) => ({
      ...prev,
      [specializationId]: years,
    }));
  }, []);

  // Save all changes to database
  const saveChanges = useCallback(async () => {
    if (!lawyerId) return;

    try {
      setIsSaving(true);

      // Delete all existing specializations
      const { error: deleteError } = await supabase
        .from("lawyer_specializations")
        .delete()
        .eq("lawyer_id", lawyerId);

      if (deleteError) throw deleteError;

      // Insert new specializations (only non-zero years)
      const specsToInsert = Object.entries(localChanges)
        .filter(([_, years]) => years > 0)
        .map(([specId, years]) => ({
          lawyer_id: lawyerId,
          specialization_id: specId,
          years_experience: years,
        }));

      if (specsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("lawyer_specializations")
          .insert(specsToInsert);

        if (insertError) throw insertError;
      }

      // Refresh data
      await fetchSpecializations();

      toast({
        title: "Specializations saved",
        description: "Your expertise has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error saving specializations",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [lawyerId, localChanges, fetchSpecializations, toast]);

  // Fetch available specializations for a practice area
  const fetchAvailableSpecializations = useCallback(async (practiceAreaId: string) => {
    try {
      const { data, error } = await supabase
        .from("practice_area_specializations")
        .select("id, specialization_name")
        .eq("practice_area_id", practiceAreaId)
        .order("specialization_name");

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      toast({
        title: "Error loading specializations",
        description: error.message,
        variant: "destructive",
      });
      return [];
    }
  }, [toast]);

  // Create a new specialization
  const createSpecialization = useCallback(async (
    practiceAreaId: string,
    specializationName: string
  ) => {
    try {
      const { data, error } = await supabase
        .from("practice_area_specializations")
        .insert({
          practice_area_id: practiceAreaId,
          specialization_name: specializationName,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      toast({
        title: "Error creating specialization",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  useEffect(() => {
    fetchSpecializations();
  }, [fetchSpecializations]);

  return {
    practiceAreas,
    isLoading,
    isSaving,
    localChanges,
    updateYears,
    removeSpecialization,
    addSpecialization,
    saveChanges,
    fetchAvailableSpecializations,
    createSpecialization,
    refresh: fetchSpecializations,
  };
};

