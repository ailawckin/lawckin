import { AlertCircle, ArrowRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ProfileSummary, Consultation } from "@/components/lawyer/dashboard/types";

interface DashboardHeaderProps {
  profile: ProfileSummary | null;
  upcomingConsultations: Consultation[];
  pendingConsultations: Consultation[];
  formatConsultationDateTime: (value: string) => string;
  onReviewPending: () => void;
}

const DashboardHeader = ({
  profile,
  upcomingConsultations,
  pendingConsultations,
  formatConsultationDateTime,
  onReviewPending,
}: DashboardHeaderProps) => {
  const upcomingCount = upcomingConsultations.length;

  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-2">
        Welcome back, {profile?.full_name || "Lawyer"}! 👋
      </h1>
      <p className="text-muted-foreground">
        {upcomingCount > 0
          ? `You have ${upcomingCount} upcoming consultation${upcomingCount > 1 ? "s" : ""}`
          : "Manage your practice and grow your client base"}
      </p>
      {upcomingCount > 0 && (
        <p className="text-xs text-muted-foreground mt-2">
          Next consultation: {formatConsultationDateTime(upcomingConsultations[0].scheduled_at)} —{" "}
          {upcomingConsultations[0].profiles?.full_name || "Client"}
        </p>
      )}

      {pendingConsultations.length > 0 && (
        <Alert className="mt-6 border-primary/20 bg-primary/5">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              You have <strong>{pendingConsultations.length}</strong> consultation
              {pendingConsultations.length > 1 ? "s" : ""} awaiting confirmation
            </span>
            <Button variant="ghost" size="sm" className="ml-4" onClick={onReviewPending}>
              Review Now <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DashboardHeader;
