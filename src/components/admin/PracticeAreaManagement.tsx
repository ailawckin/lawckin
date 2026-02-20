import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, X, Check, Users } from "lucide-react";
import { format } from "date-fns";

interface PracticeArea {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  created_at: string;
  specializations?: Specialization[];
  lawyerCount?: number; // Number of lawyers using this practice area
}

interface Specialization {
  id: string;
  practice_area_id: string;
  specialization_name: string;
  display_order: number | null;
  created_at: string;
}

export function PracticeAreaManagement() {
  const [practiceAreas, setPracticeAreas] = useState<PracticeArea[]>([]);
  const [selectedArea, setSelectedArea] = useState<PracticeArea | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [specializationDialogOpen, setSpecializationDialogOpen] = useState(false);
  const [selectedSpecialization, setSelectedSpecialization] = useState<Specialization | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    icon: "",
  });
  const [specializationName, setSpecializationName] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { logAction } = useAuditLog();

  useEffect(() => {
    fetchPracticeAreas();
  }, []);

  const fetchPracticeAreas = async () => {
    setLoading(true);
    try {
      const { data: areas, error: areasError } = await supabase
        .from("practice_areas")
        .select("*")
        .order("name", { ascending: true });

      if (areasError) throw areasError;

      // Fetch specializations and usage counts for each area
      const areasWithSpecializations = await Promise.all(
        (areas || []).map(async (area) => {
          const { data: specializations } = await supabase
            .from("practice_area_specializations")
            .select("*")
            .eq("practice_area_id", area.id)
            .order("display_order", { ascending: true });

          // Count lawyers using this practice area
          const { count: lawyerCount } = await supabase
            .from("lawyer_expertise")
            .select("*", { count: "exact", head: true })
            .eq("practice_area_id", area.id);

          return {
            ...area,
            specializations: specializations || [],
            lawyerCount: lawyerCount || 0,
          };
        })
      );

      setPracticeAreas(areasWithSpecializations);
    } catch (error: any) {
      toast({
        title: "Error loading practice areas",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedArea(null);
    setFormData({ name: "", description: "", icon: "" });
    setEditDialogOpen(true);
  };

  const handleEdit = (area: PracticeArea) => {
    setSelectedArea(area);
    setFormData({
      name: area.name,
      description: area.description || "",
      icon: area.icon || "",
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Validation error",
        description: "Practice area name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check for duplicate name (case-insensitive)
      const { data: existing } = await supabase
        .from("practice_areas")
        .select("id, name")
        .ilike("name", formData.name.trim())
        .maybeSingle();

      if (existing && (!selectedArea || existing.id !== selectedArea.id)) {
        toast({
          title: "Duplicate practice area",
          description: `A practice area named "${existing.name}" already exists`,
          variant: "destructive",
        });
        return;
      }

      const beforeData = selectedArea ? { ...selectedArea } : null;

      if (selectedArea) {
        // Update existing
        const { error } = await supabase
          .from("practice_areas")
          .update({
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null,
          })
          .eq("id", selectedArea.id);

        if (error) throw error;

        await logAction({
          action: "UPDATE_PRACTICE_AREA",
          entityType: "practice_area",
          entityId: selectedArea.id,
          beforeData,
          afterData: { ...formData },
        });

        toast({
          title: "Practice area updated",
          description: `${formData.name} has been updated`,
        });
      } else {
        // Create new
        const { data, error } = await supabase
          .from("practice_areas")
          .insert({
            name: formData.name,
            description: formData.description || null,
            icon: formData.icon || null,
          })
          .select()
          .single();

        if (error) throw error;

        await logAction({
          action: "CREATE_PRACTICE_AREA",
          entityType: "practice_area",
          entityId: data.id,
          afterData: { ...formData },
        });

        toast({
          title: "Practice area created",
          description: `${formData.name} has been created`,
        });
      }

      setEditDialogOpen(false);
      fetchPracticeAreas();
    } catch (error: any) {
      toast({
        title: "Error saving practice area",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedArea) return;

    // Warn if practice area is in use
    if (selectedArea.lawyerCount && selectedArea.lawyerCount > 0) {
      toast({
        title: "Cannot delete practice area",
        description: `This practice area is used by ${selectedArea.lawyerCount} lawyer(s). Please reassign or remove those lawyers first.`,
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      return;
    }

    try {
      const beforeData = { ...selectedArea };

      const { error } = await supabase
        .from("practice_areas")
        .delete()
        .eq("id", selectedArea.id);

      if (error) throw error;

      await logAction({
        action: "DELETE_PRACTICE_AREA",
        entityType: "practice_area",
        entityId: selectedArea.id,
        beforeData,
      });

      toast({
        title: "Practice area deleted",
        description: `${selectedArea.name} has been deleted`,
      });

      setDeleteDialogOpen(false);
      setSelectedArea(null);
      fetchPracticeAreas();
    } catch (error: any) {
      toast({
        title: "Error deleting practice area",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddSpecialization = (area: PracticeArea) => {
    setSelectedArea(area);
    setSelectedSpecialization(null);
    setSpecializationName("");
    setSpecializationDialogOpen(true);
  };

  const handleEditSpecialization = (specialization: Specialization, area: PracticeArea) => {
    setSelectedArea(area);
    setSelectedSpecialization(specialization);
    setSpecializationName(specialization.specialization_name);
    setSpecializationDialogOpen(true);
  };

  const handleSaveSpecialization = async () => {
    if (!selectedArea || !specializationName.trim()) {
      toast({
        title: "Validation error",
        description: "Specialization name is required",
        variant: "destructive",
      });
      return;
    }

    try {
      // Check for duplicate specialization name within the practice area
      const { data: existing } = await supabase
        .from("practice_area_specializations")
        .select("id, specialization_name")
        .eq("practice_area_id", selectedArea.id)
        .ilike("specialization_name", specializationName.trim())
        .maybeSingle();

      if (existing && (!selectedSpecialization || existing.id !== selectedSpecialization.id)) {
        toast({
          title: "Duplicate specialization",
          description: `"${existing.specialization_name}" already exists for this practice area`,
          variant: "destructive",
        });
        return;
      }

      if (selectedSpecialization) {
        // Update
        const { error } = await supabase
          .from("practice_area_specializations")
          .update({
            specialization_name: specializationName,
          })
          .eq("id", selectedSpecialization.id);

        if (error) throw error;

        toast({
          title: "Specialization updated",
          description: `${specializationName} has been updated`,
        });
      } else {
        // Create
        const { error } = await supabase
          .from("practice_area_specializations")
          .insert({
            practice_area_id: selectedArea.id,
            specialization_name: specializationName,
          });

        if (error) throw error;

        toast({
          title: "Specialization added",
          description: `${specializationName} has been added to ${selectedArea.name}`,
        });
      }

      setSpecializationDialogOpen(false);
      fetchPracticeAreas();
    } catch (error: any) {
      toast({
        title: "Error saving specialization",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSpecialization = async (specialization: Specialization) => {
    try {
      const { error } = await supabase
        .from("practice_area_specializations")
        .delete()
        .eq("id", specialization.id);

      if (error) throw error;

      toast({
        title: "Specialization deleted",
        description: `${specialization.specialization_name} has been deleted`,
      });

      fetchPracticeAreas();
    } catch (error: any) {
      toast({
        title: "Error deleting specialization",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Practice Area Management</h2>
          <p className="text-muted-foreground">Manage practice areas and specializations</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Practice Area
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Loading...</p>
      ) : (
        <div className="space-y-4">
          {practiceAreas.map((area) => (
            <Card key={area.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {area.icon && <span>{area.icon}</span>}
                      {area.name}
                    </CardTitle>
                    {area.description && (
                      <CardDescription className="mt-2">{area.description}</CardDescription>
                    )}
                    {area.lawyerCount !== undefined && (
                      <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>Used by {area.lawyerCount} lawyer{area.lawyerCount !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(area)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddSpecialization(area)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Specialization
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setSelectedArea(area);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {area.specializations && area.specializations.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold mb-2">Specializations:</h4>
                    <div className="flex flex-wrap gap-2">
                      {area.specializations.map((spec) => (
                        <Badge key={spec.id} variant="secondary" className="flex items-center gap-2">
                          {spec.specialization_name}
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={() => handleEditSpecialization(spec, area)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-4 w-4 p-0"
                              onClick={() => handleDeleteSpecialization(spec)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No specializations yet</p>
                )}
                <p className="text-xs text-muted-foreground mt-4">
                  Created: {format(new Date(area.created_at), "MMM d, yyyy")}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedArea ? "Edit Practice Area" : "Create Practice Area"}
            </DialogTitle>
            <DialogDescription>
              {selectedArea
                ? "Update the practice area details"
                : "Add a new practice area to the platform"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Criminal Defense"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this practice area"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="icon">Icon (Emoji)</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="⚖️"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {selectedArea ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={specializationDialogOpen} onOpenChange={setSpecializationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedSpecialization ? "Edit Specialization" : "Add Specialization"}
            </DialogTitle>
            <DialogDescription>
              {selectedArea && `Add a specialization to ${selectedArea.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="specialization">Specialization Name *</Label>
              <Input
                id="specialization"
                value={specializationName}
                onChange={(e) => setSpecializationName(e.target.value)}
                placeholder="e.g., DWI / DUI"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSpecializationDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveSpecialization}>
              {selectedSpecialization ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Practice Area</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedArea?.name}"? This will also delete all
              associated specializations. This action cannot be undone.
              {selectedArea?.lawyerCount && selectedArea.lawyerCount > 0 && (
                <div className="mt-3 p-3 bg-destructive/10 rounded-md">
                  <p className="text-sm font-medium text-destructive">
                    ⚠️ Warning: This practice area is currently used by {selectedArea.lawyerCount} lawyer{selectedArea.lawyerCount !== 1 ? 's' : ''}.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Deleting this will break those lawyer profiles. Please reassign them first.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

