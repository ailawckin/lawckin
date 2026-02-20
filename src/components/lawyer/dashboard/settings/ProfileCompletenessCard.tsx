import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { ProfileSummary, SettingsFormData } from "@/components/lawyer/dashboard/types";

interface ProfileCompletenessCardProps {
  lawyerExpertise: Record<string, number>;
  profile: ProfileSummary | null;
  formData: SettingsFormData;
}

const ProfileCompletenessCard = ({ lawyerExpertise, profile, formData }: ProfileCompletenessCardProps) => {
  const expertiseCount = Object.values(lawyerExpertise).filter((years) => years > 0).length;
  const fields = {
    avatar: profile?.avatar_url ? 1 : 0,
    bio: formData.bio ? 1 : 0,
    education: formData.education ? 1 : 0,
    location: formData.location.length > 0 ? 1 : 0,
    hourlyRate: formData.hourly_rate > 0 ? 1 : 0,
    expertise: expertiseCount >= 1 ? 1 : 0,
  };
  const completed = Object.values(fields).reduce((a, b) => a + b, 0);
  const total = Object.keys(fields).length;
  const percentage = Math.round((completed / total) * 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Completeness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Profile {percentage}% Complete</span>
          <span className="text-sm text-muted-foreground">
            {completed} of {total} sections
          </span>
        </div>
        <Progress value={percentage} className="h-2" />

        {percentage < 100 && (
          <Alert className="border-primary/20">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <p className="font-medium mb-2">Complete your profile to attract more clients:</p>
              <ul className="space-y-1 text-xs">
                {!fields.avatar && <li>• Upload a professional profile picture</li>}
                {!fields.bio && <li>• Add a bio describing your experience</li>}
                {!fields.education && <li>• List your educational background</li>}
                {!fields.location && <li>• Set your location</li>}
                {!fields.hourlyRate && <li>• Specify your hourly rate</li>}
                {expertiseCount < 1 && <li>• Add at least 1 practice area expertise</li>}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default ProfileCompletenessCard;
