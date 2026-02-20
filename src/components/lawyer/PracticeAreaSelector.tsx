import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Practice areas available during onboarding (same as LawyerOnboarding.tsx)
const PRACTICE_AREAS = [
  "Criminal Defense", "Family Law", "Immigration", "Personal Injury",
  "Real Estate", "Employment Law", "Business Law", "Estate Planning",
  "Bankruptcy", "Civil Rights"
];

interface PracticeArea {
  id: string;
  name: string;
}

interface Specialization {
  id: string;
  practice_area_id: string;
  specialization_name: string;
}

interface LawyerSpecialization {
  specialization_id: string;
  years_experience: number;
}

interface PracticeAreaSelectorProps {
  lawyerId: string;
  specialty?: string; // Deprecated: use specialties instead
  specialties?: string[]; // Filter specializations by selected specialties
  onUpdate?: () => void;
  onSaveRef?: React.MutableRefObject<(() => Promise<void>) | null>;
}

const PracticeAreaSelector = ({ lawyerId, specialty, specialties, onUpdate, onSaveRef }: PracticeAreaSelectorProps) => {
  const { toast } = useToast();
  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>([]);
  const [specializations, setSpecializations] = useState<Specialization[]>([]);
  const [lawyerSpecializations, setLawyerSpecializations] = useState<Record<string, number>>({});
  const [expandedAreas, setExpandedAreas] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newSpecializationName, setNewSpecializationName] = useState<Record<string, string>>({}); // areaId -> name
  const [showAddSpecialization, setShowAddSpecialization] = useState<Record<string, boolean>>({}); // areaId -> show

  useEffect(() => {
    fetchData();
  }, [lawyerId, specialty, specialties]); // Refetch when specialties change

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch practice areas
      const { data: areasData, error: areasError } = await supabase
        .from("practice_areas")
        .select("id, name")
        .order("name");

      if (areasError) throw areasError;

      // Filter practice areas to only include those from onboarding
      let allowedPracticeAreas = (areasData || []).filter((area) =>
        PRACTICE_AREAS.includes(area.name)
      );

      // If specialties are selected, filter to only those practice areas
      const selectedSpecialties = specialties && specialties.length > 0 
        ? specialties 
        : specialty 
          ? [specialty] 
          : [];
      
      if (selectedSpecialties.length > 0) {
        allowedPracticeAreas = allowedPracticeAreas.filter((area) => 
          selectedSpecialties.includes(area.name)
        );
      }

      // Fetch specializations
      const { data: specsData, error: specsError } = await supabase
        .from("practice_area_specializations")
        .select("id, practice_area_id, specialization_name")
        .order("specialization_name");

      if (specsError) throw specsError;

      // Filter specializations to only include those for allowed practice areas
      const allowedPracticeAreaIds = new Set(allowedPracticeAreas.map((area) => area.id));
      const allowedSpecializations = (specsData || []).filter((spec) =>
        allowedPracticeAreaIds.has(spec.practice_area_id)
      );

      // Fetch lawyer's current specializations
      const { data: lawyerSpecsData, error: lawyerSpecsError } = await supabase
        .from("lawyer_specializations")
        .select("specialization_id, years_experience")
        .eq("lawyer_id", lawyerId);

      if (lawyerSpecsError) throw lawyerSpecsError;

      setPracticeAreas(allowedPracticeAreas);
      setSpecializations(allowedSpecializations);

      // Convert to Record for easy lookup
      const specsMap: Record<string, number> = {};
      (lawyerSpecsData || []).forEach((spec) => {
        specsMap[spec.specialization_id] = spec.years_experience;
      });
      setLawyerSpecializations(specsMap);

      // Auto-expand areas that have selections
      const areasWithSelections = new Set<string>();
      (specsData || []).forEach((spec) => {
        if (specsMap[spec.id] > 0) {
          areasWithSelections.add(spec.practice_area_id);
        }
      });
      setExpandedAreas(areasWithSelections);
    } catch (error: any) {
      toast({
        title: "Error loading specializations",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addNewSpecialization = async (areaId: string, areaName: string) => {
    const specName = newSpecializationName[areaId]?.trim();
    if (!specName) {
      toast({
        title: "Name required",
        description: "Please enter a specialization name",
        variant: "destructive",
      });
      return;
    }

    try {
      // Find the practice area
      const practiceArea = practiceAreas.find((a) => a.id === areaId);
      if (!practiceArea) return;

      // Check if specialization already exists
      const existingSpec = specializations.find(
        (s) => s.practice_area_id === areaId && s.specialization_name.toLowerCase() === specName.toLowerCase()
      );

      let specId: string;
      if (existingSpec) {
        specId = existingSpec.id;
      } else {
        // Create new specialization
        const { data: newSpec, error: createError } = await supabase
          .from("practice_area_specializations")
          .insert({
            practice_area_id: areaId,
            specialization_name: specName,
          })
          .select()
          .single();

        if (createError) throw createError;
        specId = newSpec.id;

        // Add to local state
        setSpecializations((prev) => [...prev, newSpec]);
      }

      // Add to lawyer's specializations with default 1 year
      setLawyerSpecializations((prev) => ({
        ...prev,
        [specId]: 1,
      }));

      // Clear input and hide form
      setNewSpecializationName((prev) => {
        const updated = { ...prev };
        delete updated[areaId];
        return updated;
      });
      setShowAddSpecialization((prev) => ({
        ...prev,
        [areaId]: false,
      }));

      toast({
        title: "Specialization added",
        description: "Don't forget to save your changes",
      });
    } catch (error: any) {
      toast({
        title: "Error adding specialization",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);

      // Delete all existing specializations
      const { error: deleteError } = await supabase
        .from("lawyer_specializations")
        .delete()
        .eq("lawyer_id", lawyerId);

      if (deleteError) throw deleteError;

      // Insert new specializations (only non-zero years)
      const specsToInsert = Object.entries(lawyerSpecializations)
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

      onUpdate?.();
    } catch (error: any) {
      toast({
        title: "Error saving specializations",
        description: error.message,
        variant: "destructive",
      });
      throw error; // Re-throw so parent can handle
    } finally {
      setIsSaving(false);
    }
  };

  // Expose save function to parent via ref
  useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = handleSave;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lawyerSpecializations]);

  const toggleArea = (areaId: string) => {
    const newExpanded = new Set(expandedAreas);
    if (newExpanded.has(areaId)) {
      newExpanded.delete(areaId);
    } else {
      newExpanded.add(areaId);
    }
    setExpandedAreas(newExpanded);
  };

  const updateYears = (specId: string, years: number) => {
    setLawyerSpecializations((prev) => ({
      ...prev,
      [specId]: years,
    }));
  };

  const removeSpecialization = (specId: string) => {
    setLawyerSpecializations((prev) => {
      const updated = { ...prev };
      delete updated[specId];
      return updated;
    });
  };

  const getSelectedCount = (areaId: string) => {
    const areaSpecs = specializations.filter((s) => s.practice_area_id === areaId);
    return areaSpecs.filter((s) => lawyerSpecializations[s.id] > 0).length;
  };

  const hasChanges = () => {
    return true; // Simple approach - always allow save
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading specializations...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4">
        {practiceAreas.map((area) => {
          const areaSpecs = specializations
            .filter((s) => s.practice_area_id === area.id)
            .sort((a, b) => a.specialization_name.localeCompare(b.specialization_name));
          
          const selectedCount = getSelectedCount(area.id);
          const isExpanded = expandedAreas.has(area.id);

          if (areaSpecs.length === 0) return null;

          return (
            <Card key={area.id} className={selectedCount > 0 ? "border-primary/50 bg-primary/5" : ""}>
              <CardHeader
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => toggleArea(area.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{area.name}</CardTitle>
                    {selectedCount > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedCount} selected
                      </Badge>
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent>
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      Select existing specializations or add your own
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddSpecialization((prev) => ({
                          ...prev,
                          [area.id]: !prev[area.id],
                        }));
                      }}
                    >
                      {showAddSpecialization[area.id] ? "Cancel" : "+ Add Specialization"}
                    </Button>
                  </div>

                  {showAddSpecialization[area.id] && (
                    <div className="mb-4 p-4 border rounded-lg bg-muted/20">
                      <Label htmlFor={`new-spec-${area.id}`} className="text-sm font-medium mb-2 block">
                        New Specialization Name
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id={`new-spec-${area.id}`}
                          value={newSpecializationName[area.id] || ""}
                          onChange={(e) =>
                            setNewSpecializationName((prev) => ({
                              ...prev,
                              [area.id]: e.target.value,
                            }))
                          }
                          placeholder="e.g., Divorce Mediation"
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              addNewSpecialization(area.id, area.name);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => addNewSpecialization(area.id, area.name)}
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {areaSpecs.map((spec) => {
                      const years = lawyerSpecializations[spec.id] || 0;
                      const isSelected = years > 0;

                      return (
                        <div
                          key={spec.id}
                          className={`p-3 rounded-lg border transition-all ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <Checkbox
                                id={spec.id}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  if (!checked) {
                                    removeSpecialization(spec.id);
                                  } else {
                                    updateYears(spec.id, 1);
                                  }
                                }}
                                className="mt-1"
                              />
                              <Label
                                htmlFor={spec.id}
                                className="text-sm font-medium leading-tight cursor-pointer flex-1"
                              >
                                {spec.specialization_name}
                              </Label>
                            </div>

                            {isSelected && (
                              <div className="pl-6 space-y-1">
                                <Label htmlFor={`years-${spec.id}`} className="text-xs text-muted-foreground">
                                  Years of experience
                                </Label>
                                <Input
                                  id={`years-${spec.id}`}
                                  type="number"
                                  min="1"
                                  max="60"
                                  value={years}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    if (val > 50) {
                                      toast({
                                        title: "High experience value",
                                        description: "Please verify this is correct",
                                        variant: "default",
                                      });
                                    }
                                    updateYears(spec.id, val);
                                  }}
                                  className="h-8 text-sm"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Enter 0 or uncheck to remove
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PracticeAreaSelector;
