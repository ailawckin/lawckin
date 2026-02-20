import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PRACTICE_AREAS = [
  "Criminal Defense",
  "Family Law",
  "Immigration",
  "Personal Injury",
  "Real Estate",
  "Employment Law",
  "Business Law",
  "Estate Planning",
  "Bankruptcy",
  "Civil Rights",
];

interface PracticeInfoStepProps {
  specialty: string;
  practiceAreas: string[];
  onSpecialtyChange: (value: string) => void;
  onTogglePracticeArea: (area: string) => void;
}

export function PracticeInfoStep({
  specialty,
  practiceAreas,
  onSpecialtyChange,
  onTogglePracticeArea,
}: PracticeInfoStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Practice Information</h2>
      <div className="space-y-2">
        <Label htmlFor="specialty">Primary Specialty</Label>
        <Select value={specialty} onValueChange={onSpecialtyChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select specialty" />
          </SelectTrigger>
          <SelectContent>
            {PRACTICE_AREAS.map((area) => (
              <SelectItem key={area} value={area}>
                {area}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Additional Practice Areas</Label>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
          {PRACTICE_AREAS.map((area) => (
            <div key={area} className="flex items-center space-x-2">
              <Checkbox
                id={area}
                checked={practiceAreas.includes(area)}
                onCheckedChange={() => onTogglePracticeArea(area)}
              />
              <Label htmlFor={area} className="text-sm cursor-pointer">
                {area}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
