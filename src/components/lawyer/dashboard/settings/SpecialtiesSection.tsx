import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import PracticeAreaSelector from "@/components/lawyer/PracticeAreaSelector";
import PracticeAreaCard from "@/components/lawyer/PracticeAreaCard";
import ExpertisePieChart from "@/components/lawyer/ExpertisePieChart";
import { getSpecificIssues } from "@/lib/practiceAreaIssues";
import type { MutableRefObject } from "react";
import type { PracticeAreaOption, SettingsFormData, SpecializationPracticeArea } from "@/components/lawyer/dashboard/types";

interface SpecialtiesSectionProps {
  formData: SettingsFormData;
  setFormData: (value: SettingsFormData | ((prev: SettingsFormData) => SettingsFormData)) => void;
  markDirty: () => void;
  practiceAreas: PracticeAreaOption[];
  practiceAreasLoading: boolean;
  practiceAreasError: string;
  practiceAreaYears: Record<string, number>;
  setPracticeAreaYears: (value: Record<string, number> | ((prev: Record<string, number>) => Record<string, number>)) => void;
  practiceAreaYearsInput: Record<string, string>;
  setPracticeAreaYearsInput: (value: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  selectedSpecificIssues: Record<string, string[]>;
  setSelectedSpecificIssues: (value: Record<string, string[]> | ((prev: Record<string, string[]>) => Record<string, string[]>)) => void;
  specializationPracticeAreas: SpecializationPracticeArea[];
  specializationChanges: Record<string, number>;
  updateSpecializationYears: (specializationId: string, years: number) => void;
  removeSpecialization: (specializationId: string) => void;
  addSpecialization: (practiceAreaId: string, specializationId: string) => void;
  saveSpecializations: () => Promise<void>;
  isSavingSpecializations: boolean;
  isLoadingSpecializations: boolean;
  saveSpecializationsRef: MutableRefObject<(() => Promise<void>) | null>;
  refreshSpecializations: () => void;
  fetchLawyerExpertise: (userId: string) => Promise<void>;
  userId: string;
  lawyerProfileId?: string | null;
}

const SpecialtiesSection = ({
  formData,
  setFormData,
  markDirty,
  practiceAreas,
  practiceAreasLoading,
  practiceAreasError,
  practiceAreaYears,
  setPracticeAreaYears,
  practiceAreaYearsInput,
  setPracticeAreaYearsInput,
  selectedSpecificIssues,
  setSelectedSpecificIssues,
  specializationPracticeAreas,
  specializationChanges,
  updateSpecializationYears,
  removeSpecialization,
  addSpecialization,
  saveSpecializations,
  isSavingSpecializations,
  isLoadingSpecializations,
  saveSpecializationsRef,
  refreshSpecializations,
  fetchLawyerExpertise,
  userId,
  lawyerProfileId,
}: SpecialtiesSectionProps) => {
  return (
    <div className="pt-6 border-t">
      <Card className="mb-6 bg-muted/20 border-muted">
        <CardHeader>
          <CardTitle className="text-sm">Specialties *</CardTitle>
          <CardDescription className="text-xs">
            Select all practice areas where you specialize and enter years of experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          {practiceAreasLoading ? (
            <p className="text-sm text-muted-foreground">Loading practice areas...</p>
          ) : practiceAreasError ? (
            <p className="text-sm text-destructive">{practiceAreasError}</p>
          ) : practiceAreas.length === 0 ? (
            <p className="text-sm text-muted-foreground">No practice areas available.</p>
          ) : (
            <div className="space-y-3 p-4 border rounded-lg bg-background">
              {practiceAreas.map((area) => {
                const areaName = area.name;
                const isSelected = formData.specialty.includes(areaName);
                const years = practiceAreaYears[areaName] || 0;
                const inputValue = practiceAreaYearsInput[areaName] !== undefined
                  ? practiceAreaYearsInput[areaName]
                  : years > 0 ? years.toString() : "";

                return (
                  <div key={area.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                    <Checkbox
                      id={`specialty-${areaName}`}
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setFormData((prev) => ({
                            ...prev,
                            specialty: [...prev.specialty, areaName],
                          }));
                          markDirty();
                          if (practiceAreaYearsInput[areaName] === undefined && years > 0) {
                            setPracticeAreaYearsInput((prev) => ({
                              ...prev,
                              [areaName]: years.toString(),
                            }));
                          }
                        } else {
                          setFormData((prev) => ({
                            ...prev,
                            specialty: prev.specialty.filter((s) => s !== areaName),
                          }));
                          markDirty();
                          setPracticeAreaYearsInput((prev) => {
                            const updated = { ...prev };
                            delete updated[areaName];
                            return updated;
                          });
                        }
                      }}
                    />
                    <Label htmlFor={`specialty-${areaName}`} className="text-sm cursor-pointer flex-1">
                      {areaName}
                    </Label>
                    {isSelected && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="60"
                          value={inputValue}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setPracticeAreaYearsInput((prev) => ({
                              ...prev,
                              [areaName]: newValue,
                            }));
                          }}
                          onBlur={(e) => {
                            const inputValue = e.target.value.trim();
                            if (inputValue === "" || inputValue === "-") {
                              setPracticeAreaYears((prev) => ({
                                ...prev,
                                [areaName]: 0,
                              }));
                              setPracticeAreaYearsInput((prev) => {
                                const updated = { ...prev };
                                delete updated[areaName];
                                return updated;
                              });
                            } else {
                              const numValue = parseInt(inputValue, 10);
                              if (Number.isNaN(numValue) || numValue < 0) {
                                setPracticeAreaYears((prev) => ({
                                  ...prev,
                                  [areaName]: 0,
                                }));
                                setPracticeAreaYearsInput((prev) => {
                                  const updated = { ...prev };
                                  delete updated[areaName];
                                  return updated;
                                });
                              } else {
                                const clampedValue = Math.min(60, Math.max(0, numValue));
                                setPracticeAreaYears((prev) => ({
                                  ...prev,
                                  [areaName]: clampedValue,
                                }));
                                setPracticeAreaYearsInput((prev) => ({
                                  ...prev,
                                  [areaName]: clampedValue.toString(),
                                }));
                              }
                            }
                          }}
                          className="w-20 h-8 text-sm"
                          placeholder="Years"
                        />
                        <span className="text-xs text-muted-foreground">years</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {formData.specialty.length === 0 && (
            <p className="text-sm text-destructive mt-2">Please select at least one specialty</p>
          )}
        </CardContent>
      </Card>

      {formData.specialty.length > 0 && (
        <Card className="mb-6 bg-muted/20 border-muted">
          <CardHeader>
            <CardTitle className="text-sm">Specific Issues</CardTitle>
            <CardDescription className="text-xs">
              Select the specific issues you handle within each practice area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {formData.specialty.map((areaName) => {
                const specificIssues = getSpecificIssues(areaName);
                const selectedIssues = selectedSpecificIssues[areaName] || [];

                if (specificIssues.length === 0) {
                  return null;
                }

                const allSelected = specificIssues.length > 0 && specificIssues.every((issue) => selectedIssues.includes(issue));

                return (
                  <div key={areaName} className="space-y-3">
                    <Label className="text-sm font-semibold">{areaName}</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4 border rounded-lg bg-background">
                      {specificIssues.map((issue) => {
                        const isSelected = selectedIssues.includes(issue);
                        return (
                          <div key={issue} className="flex items-center space-x-2">
                            <Checkbox
                              id={`issue-${areaName}-${issue}`}
                              checked={isSelected}
                              onCheckedChange={(checked) => {
                                setSelectedSpecificIssues((prev) => {
                                  const current = prev[areaName] || [];
                                  if (checked) {
                                    return { ...prev, [areaName]: [...current, issue] };
                                  }
                                  return { ...prev, [areaName]: current.filter((i) => i !== issue) };
                                });
                                markDirty();
                              }}
                            />
                            <Label htmlFor={`issue-${areaName}-${issue}`} className="text-sm cursor-pointer flex-1">
                              {issue}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (allSelected) {
                            setSelectedSpecificIssues((prev) => ({
                              ...prev,
                              [areaName]: [],
                            }));
                          } else {
                            setSelectedSpecificIssues((prev) => ({
                              ...prev,
                              [areaName]: [...specificIssues],
                            }));
                          }
                          markDirty();
                        }}
                        className="text-xs"
                      >
                        {allSelected ? "Deselect All" : "Select All"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {(() => {
        const specializationChartData: Array<{ specialization: string; years: number }> = [];

        specializationPracticeAreas.forEach((area) => {
          area.specializations.forEach((spec) => {
            const years = specializationChanges[spec.specialization_id] ?? spec.years_experience ?? 0;
            if (years > 0) {
              specializationChartData.push({
                specialization: spec.specialization_name,
                years,
              });
            }
          });
        });

        const areasWithYears = formData.specialty
          .map((areaName) => ({
            name: areaName,
            years: practiceAreaYears[areaName] || 0,
          }))
          .filter((area) => area.years > 0);

        const hasSpecializations = specializationChartData.length > 0;
        const chartData = hasSpecializations
          ? specializationChartData
          : areasWithYears.map((area) => ({
              practiceArea: area.name,
              years: area.years,
            }));

        return chartData.length > 0 ? (
          <Card className="mb-6 bg-muted/20 border-muted">
            <CardHeader>
              <CardTitle className="text-sm">Overall Expertise Distribution</CardTitle>
              <CardDescription className="text-xs">
                {hasSpecializations
                  ? "Breakdown by specializations across all practice areas"
                  : "Summary across all practice areas"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="text-sm font-semibold mb-3 text-center">Combined Overview</h4>
                <ExpertisePieChart expertiseData={chartData} height={300} />
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                  {hasSpecializations
                    ? specializationChartData.slice(0, 10).map((item, idx) => (
                        <Badge key={idx} variant="secondary" className="text-sm py-1.5 px-3">
                          {item.specialization}: {item.years} year{item.years !== 1 ? "s" : ""}
                        </Badge>
                      ))
                    : areasWithYears.map((area) => (
                        <Badge key={area.name} variant="secondary" className="text-sm py-1.5 px-3">
                          {area.name}: {area.years} year{area.years !== 1 ? "s" : ""}
                        </Badge>
                      ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null;
      })()}

      {isLoadingSpecializations ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-muted-foreground">Loading specializations...</div>
        </div>
      ) : specializationPracticeAreas.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Specializations by Practice Area</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {specializationPracticeAreas.map((area) => (
              <PracticeAreaCard
                key={area.practice_area_id}
                practiceAreaId={area.practice_area_id}
                practiceAreaName={area.practice_area_name}
                specializations={area.specializations}
                localChanges={specializationChanges}
                onUpdateYears={updateSpecializationYears}
                onRemoveSpecialization={removeSpecialization}
                onAddSpecialization={addSpecialization}
                onSave={async () => {
                  await saveSpecializations();
                  await fetchLawyerExpertise(userId);
                }}
                isSaving={isSavingSpecializations}
              />
            ))}
          </div>
        </div>
      ) : null}

      {specializationPracticeAreas.length === 0 && lawyerProfileId && (
        <div className="mt-6">
          <PracticeAreaSelector
            lawyerId={lawyerProfileId}
            specialties={formData.specialty.length > 0 ? formData.specialty : undefined}
            onUpdate={() => {
              fetchLawyerExpertise(userId);
              refreshSpecializations();
            }}
            onSaveRef={saveSpecializationsRef}
          />
        </div>
      )}
    </div>
  );
};

export default SpecialtiesSection;
