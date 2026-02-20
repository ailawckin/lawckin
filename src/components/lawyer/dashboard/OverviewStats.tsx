import { Calendar, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Consultation } from "@/components/lawyer/dashboard/types";

interface OverviewStatsProps {
  consultationsLoading: boolean;
  upcomingConsultations: Consultation[];
  todayConsultations: Consultation[];
  availabilityLoading: boolean;
  availableSlotsCount: number;
  availabilityError: string;
  profileViewsLoading: boolean;
  profileViews: number;
  profileViewsError: string;
}

const OverviewStats = ({
  consultationsLoading,
  upcomingConsultations,
  todayConsultations,
  availabilityLoading,
  availableSlotsCount,
  availabilityError,
  profileViewsLoading,
  profileViews,
  profileViewsError,
}: OverviewStatsProps) => {
  const upcomingThisWeek = upcomingConsultations.filter((consultation) => {
    const now = new Date();
    const inSeven = new Date();
    inSeven.setDate(inSeven.getDate() + 7);
    const scheduledAt = new Date(consultation.scheduled_at);
    return scheduledAt >= now && scheduledAt <= inSeven;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Upcoming
          </CardTitle>
        </CardHeader>
        <CardContent>
          {consultationsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{upcomingConsultations.length}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayConsultations.length > 0
                  ? `${todayConsultations.length} today`
                  : `+${upcomingThisWeek} next 7 days`}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            Available Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          {availabilityLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-24" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{availableSlotsCount}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {availabilityError ? "Failed to load availability" : "Next 7 days"}
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            Profile Views
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profileViewsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-7 w-12" />
              <Skeleton className="h-3 w-20" />
            </div>
          ) : (
            <>
              <div className="text-2xl font-bold">{profileViews}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {profileViewsError ? "Failed to load profile views" : "All time"}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewStats;
