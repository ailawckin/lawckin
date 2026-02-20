import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FEE_MODELS = ["hourly", "flat", "contingency"];

interface RatesFeesStepProps {
  hourlyMin: string;
  hourlyMax: string;
  feeModels: string[];
  onHourlyMinChange: (value: string) => void;
  onHourlyMaxChange: (value: string) => void;
  onToggleFeeModel: (model: string) => void;
}

export function RatesFeesStep({
  hourlyMin,
  hourlyMax,
  feeModels,
  onHourlyMinChange,
  onHourlyMaxChange,
  onToggleFeeModel,
}: RatesFeesStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Rates & Fees</h2>
      <div className="space-y-2">
        <Label>Hourly Rate Range</Label>
        <div className="flex gap-2 items-center">
          <Input
            type="number"
            placeholder="Min"
            value={hourlyMin}
            onChange={(event) => onHourlyMinChange(event.target.value)}
          />
          <span>to</span>
          <Input
            type="number"
            placeholder="Max"
            value={hourlyMax}
            onChange={(event) => onHourlyMaxChange(event.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Fee Models</Label>
        <div className="flex flex-wrap gap-2">
          {FEE_MODELS.map((model) => (
            <Button
              key={model}
              type="button"
              variant={feeModels.includes(model) ? "default" : "outline"}
              size="sm"
              onClick={() => onToggleFeeModel(model)}
            >
              {model.charAt(0).toUpperCase() + model.slice(1)}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
