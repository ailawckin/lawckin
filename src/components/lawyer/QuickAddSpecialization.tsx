import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Practice areas available during onboarding (same as LawyerOnboarding.tsx)
const PRACTICE_AREAS = [
  "Criminal Defense", "Family Law", "Immigration", "Personal Injury",
  "Real Estate", "Employment Law", "Business Law", "Estate Planning",
  "Bankruptcy", "Civil Rights"
];

interface QuickAddSpecializationProps {
  lawyerId: string;
  specialties: string[];
  onSpecializationAdded: () => void;
}

const QuickAddSpecialization = ({
  lawyerId,
  specialties,
  onSpecializationAdded,
}: QuickAddSpecializationProps) => {
  const { toast } = useToast();
  const [selectedPracticeArea, setSelectedPracticeArea] = useState<string>("");
  const [practiceAreas, setPracticeAreas] = useState<any[]>([]);
  const [availableSpecializations, setAvailableSpecializations] = useState<any[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState<string>("");
  const [newSpecName, setNewSpecName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);

  // Fetch practice areas based on selected specialties, filtered to onboarding list
  useEffect(() => {
    const fetchPracticeAreas = async () => {
      if (specialties.length === 0) return;

      try {
        // Filter specialties to only include those from onboarding
        const validSpecialties = specialties.filter((s) => PRACTICE_AREAS.includes(s as any));
        
        if (validSpecialties.length === 0) {
          setPracticeAreas([]);
          return;
        }

        const { data, error } = await supabase
          .from("practice_areas")
          .select("id, name")
          .in("name", validSpecialties)
          .order("name");

        if (error) throw error;
        
        // Double-check: only include practice areas from onboarding list
        const filtered = (data || []).filter((area) => PRACTICE_AREAS.includes(area.name as any));
        setPracticeAreas(filtered);
      } catch (error: any) {
        toast({
          title: "Error loading practice areas",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchPracticeAreas();
  }, [specialties, toast]);

  // Fetch available specializations for selected practice area
  useEffect(() => {
    const fetchSpecializations = async () => {
      if (!selectedPracticeArea) {
        setAvailableSpecializations([]);
        return;
      }

      setLoading(true);
      try {
        // Get practice area ID
        const practiceArea = practiceAreas.find((pa) => pa.id === selectedPracticeArea);
        if (!practiceArea) return;

        // Fetch all specializations for this practice area
        const { data, error } = await supabase
          .from("practice_area_specializations")
          .select("id, specialization_name")
          .eq("practice_area_id", selectedPracticeArea)
          .order("specialization_name");

        if (error) throw error;

        // Check which ones the lawyer already has
        const { data: existingSpecs } = await supabase
          .from("lawyer_specializations")
          .select("specialization_id")
          .eq("lawyer_id", lawyerId);

        const existingSpecIds = new Set((existingSpecs || []).map((s) => s.specialization_id));
        const available = (data || []).filter((spec) => !existingSpecIds.has(spec.id));

        setAvailableSpecializations(available);
      } catch (error: any) {
        toast({
          title: "Error loading specializations",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSpecializations();
  }, [selectedPracticeArea, lawyerId, practiceAreas, toast]);

  const handleAddExisting = async () => {
    if (!selectedSpecialization || !selectedPracticeArea) {
      toast({
        title: "Selection required",
        description: "Please select a practice area and specialization",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("lawyer_specializations")
        .insert({
          lawyer_id: lawyerId,
          specialization_id: selectedSpecialization,
          years_experience: 1, // Default to 1 year
        });

      if (error) throw error;

      toast({
        title: "Specialization added",
        description: "You can now edit the years of experience in the practice area card",
      });

      setSelectedPracticeArea("");
      setSelectedSpecialization("");
      onSpecializationAdded();
    } catch (error: any) {
      toast({
        title: "Error adding specialization",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateNew = async () => {
    if (!newSpecName.trim() || !selectedPracticeArea) {
      toast({
        title: "Name required",
        description: "Please enter a specialization name",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the specialization
      const { data: newSpec, error: createError } = await supabase
        .from("practice_area_specializations")
        .insert({
          practice_area_id: selectedPracticeArea,
          specialization_name: newSpecName.trim(),
        })
        .select()
        .single();

      if (createError) throw createError;

      // Add it to the lawyer
      const { error: addError } = await supabase
        .from("lawyer_specializations")
        .insert({
          lawyer_id: lawyerId,
          specialization_id: newSpec.id,
          years_experience: 1, // Default to 1 year
        });

      if (addError) throw addError;

      toast({
        title: "Specialization created and added",
        description: "You can now edit the years of experience in the practice area card",
      });

      setNewSpecName("");
      setShowCreateForm(false);
      setSelectedPracticeArea("");
      onSpecializationAdded();
    } catch (error: any) {
      toast({
        title: "Error creating specialization",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (specialties.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center py-4">
            Please select at least one specialty in your profile settings first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="space-y-2">
          <Label>Practice Area</Label>
          <Select
            value={selectedPracticeArea}
            onValueChange={(value) => {
              setSelectedPracticeArea(value);
              setSelectedSpecialization("");
              setShowCreateForm(false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a practice area" />
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

        {selectedPracticeArea && (
          <>
            {!showCreateForm ? (
              <div className="space-y-2">
                <Label>Specialization</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedSpecialization}
                    onValueChange={setSelectedSpecialization}
                    disabled={loading || availableSpecializations.length === 0}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select specialization" />
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
                    onClick={handleAddExisting}
                    disabled={!selectedSpecialization || loading}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
                {availableSpecializations.length === 0 && !loading && (
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
              </div>
            ) : (
              <div className="space-y-2">
                <Label>New Specialization Name</Label>
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
                    onClick={handleCreateNew}
                    disabled={!newSpecName.trim()}
                  >
                    Create
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewSpecName("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default QuickAddSpecialization;

