import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PersonalInfoStepProps {
  fullName: string;
  phone: string;
  bio: string;
  onFullNameChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onBioChange: (value: string) => void;
}

export function PersonalInfoStep({
  fullName,
  phone,
  bio,
  onFullNameChange,
  onPhoneChange,
  onBioChange,
}: PersonalInfoStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Personal Information</h2>
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          value={fullName}
          onChange={(event) => onFullNameChange(event.target.value)}
          placeholder="Dr. Jane Smith"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phone}
          onChange={(event) => onPhoneChange(event.target.value)}
          placeholder="(555) 123-4567"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="bio">Short Bio</Label>
        <Textarea
          id="bio"
          value={bio}
          onChange={(event) => onBioChange(event.target.value)}
          placeholder="Tell clients about yourself..."
          rows={4}
        />
      </div>
    </div>
  );
}
