import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ExpertisePieChart from "./ExpertisePieChart";

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

interface PracticeAreaCardProps {
  practiceAreaId: string;
  practiceAreaName: string;
  specializations: SpecializationData[];
  localChanges: Record<string, number>;
  onUpdateYears: (specializationId: string, years: number) => void;
  onRemoveSpecialization: (specializationId: string) => void;
  onAddSpecialization: (specializationId: string, years: number) => void;
  onSave: () => Promise<void>;
  isSaving?: boolean;
}

const PracticeAreaCard = ({
  practiceAreaId,
  practiceAreaName,
  specializations,
  localChanges,
  onUpdateYears,
  onRemoveSpecialization,
  onAddSpecialization,
  onSave,
  isSaving = false,
}: PracticeAreaCardProps) => {
  const { toast } = useToast();
  const [availableSpecializations, setAvailableSpecializations] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedSpecId, setSelectedSpecId] = useState<string>("");
  const [newSpecName, setNewSpecName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loadingSpecs, setLoadingSpecs] = useState(false);

  // Get specializations with current local changes (include all, even 0 years for editing)
  // Use useMemo to ensure chart updates when localChanges changes
  const currentSpecializations = useMemo(() => {
    return specializations.map((spec) => ({
      ...spec,
      years_experience: localChanges[spec.specialization_id] ?? spec.years_experience,
    }));
  }, [specializations, localChanges]);

  // Filter for pie chart (only show specializations with years > 0)
  const chartSpecializations = useMemo(() => {
    return currentSpecializations.filter((spec) => spec.years_experience > 0);
  }, [currentSpecializations]);

  // Prepare data for pie chart (only specializations with years > 0)
  const chartData = useMemo(() => {
    return chartSpecializations.map((spec) => ({
      specialization: spec.specialization_name,
      years: spec.years_experience,
    }));
  }, [chartSpecializations]);

  // Fetch available specializations for this practice area
  useEffect(() => {
    const fetchAvailable = async () => {
      setLoadingSpecs(true);
      try {
        const { data, error } = await supabase
          .from("practice_area_specializations")
          .select("id, specialization_name")
          .eq("practice_area_id", practiceAreaId)
          .order("specialization_name");

        if (error) throw error;

        // Filter out already added specializations
        const addedSpecIds = new Set(
          currentSpecializations.map((s) => s.specialization_id)
        );
        const available = (data || []).filter(
          (spec) => !addedSpecIds.has(spec.id)
        );

        setAvailableSpecializations(available);
      } catch (error: any) {
        toast({
          title: "Error loading specializations",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoadingSpecs(false);
      }
    };

    if (showAddForm) {
      fetchAvailable();
    }
  }, [showAddForm, practiceAreaId, currentSpecializations, toast]);

  const handleAddExisting = () => {
    if (!selectedSpecId) {
      toast({
        title: "Selection required",
        description: "Please select a specialization to add",
        variant: "destructive",
      });
      return;
    }

    onAddSpecialization(selectedSpecId, 1);
    setSelectedSpecId("");
    setShowAddForm(false);
  };

  const handleCreateNew = async () => {
    if (!newSpecName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a specialization name",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from("practice_area_specializations")
        .insert({
          practice_area_id: practiceAreaId,
          specialization_name: newSpecName.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      onAddSpecialization(data.id, 1);
      setNewSpecName("");
      setShowCreateForm(false);
      setShowAddForm(false);

      toast({
        title: "Specialization created",
        description: "Don't forget to save your changes",
      });
    } catch (error: any) {
      toast({
        title: "Error creating specialization",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSave = async () => {
    try {
      await onSave();
    } catch (error) {
      // Error already handled in onSave
    }
  };

  // Only show practice areas from onboarding list
  const isOnboardingPracticeArea = PRACTICE_AREAS.includes(practiceAreaName as any);
  
  if (!isOnboardingPracticeArea) {
    return null; // Don't show practice areas not in onboarding list
  }

  // Always show card if there are specializations (even with 0 years) or if we're adding one
  const shouldShow = specializations.length > 0 || showAddForm;
  
  if (!shouldShow) {
    return null; // Don't show empty cards
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{practiceAreaName}</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {chartSpecializations.length} active specialization{chartSpecializations.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pie Chart */}
        {chartData.length > 0 ? (
          <div className="border rounded-lg p-4 bg-muted/20">
            <ExpertisePieChart
              expertiseData={chartData}
              height={250}
            />
          </div>
        ) : (
          <div className="border rounded-lg p-8 text-center text-muted-foreground">
            <p className="text-sm">No specializations added yet</p>
          </div>
        )}

        {/* Specializations List with Editing */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Specializations</Label>
            {!showAddForm && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>

          {/* Add Specialization Form */}
          {showAddForm && (
            <Card className="p-3 bg-muted/20 border-dashed">
              <div className="space-y-3">
                {!showCreateForm ? (
                  <>
                    <div className="flex gap-2">
                      <Select
                        value={selectedSpecId}
                        onValueChange={setSelectedSpecId}
                        disabled={loadingSpecs || availableSpecializations.length === 0}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select existing specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableSpecializations.map((spec) => (
                            <SelectItem key={spec.id} value={spec.id}>
                              {spec.specialization_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddExisting}
                        disabled={!selectedSpecId}
                      >
                        Add
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                    {availableSpecializations.length === 0 && (
                      <p className="text-xs text-muted-foreground">
                        No more specializations available.{" "}
                        <button
                          type="button"
                          className="text-primary underline"
                          onClick={() => setShowCreateForm(true)}
                        >
                          Create a new one
                        </button>
                      </p>
                    )}
                    {availableSpecializations.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Or{" "}
                        <button
                          type="button"
                          className="text-primary underline"
                          onClick={() => setShowCreateForm(true)}
                        >
                          create a new specialization
                        </button>
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <Input
                        value={newSpecName}
                        onChange={(e) => setNewSpecName(e.target.value)}
                        placeholder="Enter specialization name"
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleCreateNew();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleCreateNew}
                        disabled={!newSpecName.trim()}
                      >
                        Create
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowCreateForm(false);
                          setNewSpecName("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </Card>
          )}

          {/* Specializations List */}
            {currentSpecializations.map((spec) => {
              const years = localChanges[spec.specialization_id] ?? spec.years_experience;
              const hasError = years <= 0;

              return (
                <div
                  key={spec.specialization_id}
                  className="relative flex items-center gap-2 p-2 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <Label className="text-sm font-medium truncate">
                      {spec.specialization_name}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        max="60"
                        value={years}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          onUpdateYears(spec.specialization_id, val);
                        }}
                        className={`h-8 text-sm ${hasError ? "border-destructive" : ""}`}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-12">years</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveSpecialization(spec.specialization_id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {hasError && (
                    <p className="text-xs text-destructive absolute -bottom-5 left-2">
                      Must be greater than 0
                    </p>
                  )}
                </div>
              );
            })}
        </div>

        {/* Save Button */}
        <div className="pt-2 border-t">
          <Button
            type="button"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
            className="w-full"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Specializations"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PracticeAreaCard;

