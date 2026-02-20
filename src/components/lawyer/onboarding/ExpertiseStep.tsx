import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExpertiseStepProps {
  practiceAreas: string[];
  expertiseYears: Record<string, number>;
  onExpertiseChange: (area: string, years: number) => void;
}

export function ExpertiseStep({ practiceAreas, expertiseYears, onExpertiseChange }: ExpertiseStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Practice Area Expertise</h2>
      <p className="text-muted-foreground">Enter your years of experience for each practice area</p>
      {practiceAreas.length === 0 ? (
        <div className="p-4 bg-muted rounded-lg text-center">
          <p className="text-sm text-muted-foreground">
            Please select practice areas in the previous step
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto p-2 border rounded-lg">
          {practiceAreas.map((area) => (
            <div key={area} className="grid grid-cols-2 gap-4 items-center p-3 bg-muted/50 rounded-lg">
              <Label htmlFor={`expertise-${area}`} className="font-medium">
                {area}
              </Label>
              <Input
                id={`expertise-${area}`}
                type="number"
                min="0"
                max="50"
                placeholder="Years"
                value={expertiseYears[area] || ""}
                onChange={(event) => onExpertiseChange(area, Number.parseInt(event.target.value, 10) || 0)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
