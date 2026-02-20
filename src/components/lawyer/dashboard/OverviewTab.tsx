import { format, formatDistanceToNow, isToday } from "date-fns";
import {
  AlertCircle,
  Clock,
  ExternalLink,
  Loader2,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Consultation, LawyerProfileSummary } from "@/components/lawyer/dashboard/types";

interface OverviewTabProps {
  lastOverviewRefreshFailedAt: Date | null;
  lastOverviewRefreshAt: Date | null;
  overviewRefreshing: boolean;
  canRefresh: boolean;
  onRefresh: () => void;
  profileViewsError: string;
  availabilityError: string;
  overviewScheduleRange: "today" | "week";
  onOverviewScheduleRangeChange: (value: "today" | "week") => void;
  upcomingConsultations: Consultation[];
  todayConsultations: Consultation[];
  consultationsLoading: boolean;
  formatConsultationTime: (value: string) => string;
  getMeetingLink: (consultation: Consultation) => string;
  isWithinJoinWindow: (scheduledAt: string) => boolean;
  onViewSchedule: () => void;
  onViewMessages: () => void;
  onEditProfile: () => void;
  onViewProfile: () => void;
  lawyerProfile?: LawyerProfileSummary | null;
}

const OverviewTab = ({
  lastOverviewRefreshFailedAt,
  lastOverviewRefreshAt,
  overviewRefreshing,
  canRefresh,
  onRefresh,
  profileViewsError,
  availabilityError,
  overviewScheduleRange,
  onOverviewScheduleRangeChange,
  upcomingConsultations,
  todayConsultations,
  consultationsLoading,
  formatConsultationTime,
  getMeetingLink,
  isWithinJoinWindow,
  onViewSchedule,
  onViewMessages,
  onEditProfile,
  onViewProfile,
  lawyerProfile,
}: OverviewTabProps) => {
  return (
    <TabsContent value="overview" className="space-y-6">
      {(() => {
        const lastRefreshStatus = lastOverviewRefreshFailedAt
          ? `Last refresh failed • ${format(lastOverviewRefreshFailedAt, "p")}`
          : lastOverviewRefreshAt
            ? `Last updated ${formatDistanceToNow(lastOverviewRefreshAt, { addSuffix: true })}`
            : "Last updated: not yet";
        return (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-muted-foreground">{lastRefreshStatus}</div>
            <div className="flex items-center gap-2">
              {overviewRefreshing && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Refreshing
                </span>
              )}
              <Button size="sm" variant="outline" disabled={!canRefresh || overviewRefreshing} onClick={onRefresh}>
                Refresh
              </Button>
            </div>
          </div>
        );
      })()}
      {(profileViewsError || availabilityError) && (
        <Alert className="border-destructive/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load:{" "}
            {[profileViewsError ? "Profile views" : null, availabilityError ? "Availability" : null]
              .filter(Boolean)
              .join(", ")}
            .
            <Button
              size="sm"
              variant="ghost"
              className="ml-2 h-auto px-1 py-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={onRefresh}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Schedule */}
      {(() => {
        const now = new Date();
        const inSeven = new Date();
        inSeven.setDate(inSeven.getDate() + 7);
        const isInRange = (dateValue: string) => {
          const scheduledAt = new Date(dateValue);
          if (overviewScheduleRange === "week") {
            return scheduledAt >= now && scheduledAt <= inSeven;
          }
          return isToday(scheduledAt);
        };
        const scheduleConsultations = upcomingConsultations.filter((consultation) =>
          isInRange(consultation.scheduled_at)
        );
        const scheduleDescription =
          overviewScheduleRange === "week"
            ? "Upcoming consultations in the next 7 days"
            : "Your consultations for today";
        const joinable = scheduleConsultations
          .filter((consultation) => {
            const meetingLink = getMeetingLink(consultation);
            return meetingLink && isWithinJoinWindow(consultation.scheduled_at);
          })
          .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
        const joinLink = joinable ? getMeetingLink(joinable) : "";
        return (
          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Schedule</CardTitle>
                  <CardDescription>{scheduleDescription}</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-md border bg-background p-1 text-xs text-muted-foreground">
                    <Button
                      size="sm"
                      variant={overviewScheduleRange === "today" ? "secondary" : "ghost"}
                      className="h-7 px-2"
                      onClick={() => onOverviewScheduleRangeChange("today")}
                    >
                      Today
                    </Button>
                    <Button
                      size="sm"
                      variant={overviewScheduleRange === "week" ? "secondary" : "ghost"}
                      className="h-7 px-2"
                      onClick={() => onOverviewScheduleRangeChange("week")}
                    >
                      Next 7 days
                    </Button>
                  </div>
                  {joinLink && (
                    <Button size="sm" variant="outline" onClick={() => window.open(joinLink, "_blank", "noopener,noreferrer")}>
                      Join now
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={onViewSchedule}>
                    View consultations
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {consultationsLoading ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-lg border bg-muted/30 p-3">
                      <Skeleton className="h-4 w-4 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-40" />
                        <Skeleton className="h-3 w-28" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : scheduleConsultations.length === 0 ? (
                <div className="text-sm text-muted-foreground">No consultations scheduled for this period.</div>
              ) : (
                <div className="space-y-3">
                  {scheduleConsultations.map((consultation) => {
                    const meetingLink = getMeetingLink(consultation);
                    const canJoin = meetingLink && isWithinJoinWindow(consultation.scheduled_at);
                    return (
                      <div key={consultation.id} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                        <Clock className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-sm">
                              {formatConsultationTime(consultation.scheduled_at)}
                            </p>
                            <Badge
                              variant={consultation.status === "confirmed" ? "default" : "outline"}
                              className="text-xs"
                            >
                              {consultation.status}
                            </Badge>
                          </div>
                          <p className="text-sm">{consultation.profiles?.full_name || "Client"}</p>
                          <p className="text-xs text-muted-foreground">
                            {consultation.profiles?.email || "No email"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {consultation.practice_areas?.name || "General"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Duration: {consultation.duration_minutes ? `${consultation.duration_minutes} min` : "Not set"}
                          </p>
                          {consultation.notes && (
                            <p className="text-xs text-muted-foreground mt-1">Notes: {consultation.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Timezone: {lawyerProfile?.timezone || "Not set"}
                          </p>
                          {meetingLink && !canJoin && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Join opens 15 minutes before the meeting.
                            </p>
                          )}
                          {meetingLink && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 h-7 px-2"
                              onClick={() => window.open(meetingLink, "_blank", "noopener,noreferrer")}
                            >
                              {canJoin ? "Join meeting" : "View meeting link"}
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })()}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={onViewSchedule}>
              <Settings className="h-5 w-5" />
              <span className="text-sm">Set Availability</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={onViewProfile}>
              <ExternalLink className="h-5 w-5" />
              <span className="text-sm">View Profile</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" onClick={onEditProfile}>
              <User className="h-5 w-5" />
              <span className="text-sm">Edit Profile</span>
            </Button>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={onViewMessages}>
              View messages
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Verification Status */}
      <Card>
        <CardHeader>
          <CardTitle>Verification Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted/40 rounded-lg border">
            {["verified", "approved"].includes(lawyerProfile?.verification_status || "") ? (
              <>
                <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Verified Lawyer</span>
                    <Badge variant="default" className="text-xs">Verified</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your profile is verified and visible to clients in search results
                  </p>
                </div>
              </>
            ) : lawyerProfile?.verification_status === "pending" ? (
              <>
                <Shield className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Verification Pending</span>
                    <Badge variant="outline" className="text-xs">Under Review</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your verification is being reviewed. You'll be notified once approved.
                  </p>
                </div>
              </>
            ) : (
              <>
                <ShieldAlert className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">Not Verified</span>
                    <Badge variant="secondary" className="text-xs">Unverified</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Your profile is not visible in search results until verified
                  </p>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default OverviewTab;
