import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CredentialsStepProps {
  barNumber: string;
  onBarNumberChange: (value: string) => void;
}

export function CredentialsStep({ barNumber, onBarNumberChange }: CredentialsStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Credentials</h2>
      <div className="space-y-2">
        <Label htmlFor="barNumber">NY Bar Number</Label>
        <Input
          id="barNumber"
          value={barNumber}
          onChange={(event) => onBarNumberChange(event.target.value)}
          placeholder="1234567"
          required
        />
        <p className="text-sm text-muted-foreground">Required for verification</p>
      </div>
    </div>
  );
}
