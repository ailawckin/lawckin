import { differenceInHours } from "date-fns";
import { Calendar, CheckCircle, Clock, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Consultation } from "@/components/lawyer/dashboard/types";

interface ConsultationsTabProps {
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  dateRangeFilter: string;
  onDateRangeFilterChange: (value: string) => void;
  practiceAreaFilter: string;
  onPracticeAreaFilterChange: (value: string) => void;
  practiceAreaOptions: string[];
  resetScheduleFilters: () => void;
  filteredUpcoming: Consultation[];
  displayedUpcoming: Consultation[];
  filteredPast: Consultation[];
  displayedPast: Consultation[];
  showAllUpcoming: boolean;
  onToggleShowAllUpcoming: () => void;
  showAllPast: boolean;
  onToggleShowAllPast: () => void;
  formatConsultationDateTime: (value: string) => string;
  getLawyerTimezone: () => string;
  getMeetingLink: (consultation: Consultation) => string;
  isWithinJoinWindow: (scheduledAt: string) => boolean;
  onUpdateStatus: (consultationId: string, status: string) => void;
  onReschedule: (consultation: Consultation) => void;
  onCancel: (consultation: Consultation) => void;
  onMessageClient: (consultation: Consultation) => void;
}

const ConsultationsTab = ({
  statusFilter,
  onStatusFilterChange,
  dateRangeFilter,
  onDateRangeFilterChange,
  practiceAreaFilter,
  onPracticeAreaFilterChange,
  practiceAreaOptions,
  resetScheduleFilters,
  filteredUpcoming,
  displayedUpcoming,
  filteredPast,
  displayedPast,
  showAllUpcoming,
  onToggleShowAllUpcoming,
  showAllPast,
  onToggleShowAllPast,
  formatConsultationDateTime,
  getLawyerTimezone,
  getMeetingLink,
  isWithinJoinWindow,
  onUpdateStatus,
  onReschedule,
  onCancel,
  onMessageClient,
}: ConsultationsTabProps) => {
  return (
    <TabsContent value="consultations" className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Filter Consultations
              </CardTitle>
              <CardDescription>Filter by status, date range, or practice area</CardDescription>
            </div>
            <Button size="sm" variant="ghost" onClick={resetScheduleFilters}>
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date range</Label>
            <Select value={dateRangeFilter} onValueChange={onDateRangeFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All time</SelectItem>
                <SelectItem value="week">This week</SelectItem>
                <SelectItem value="month">This month</SelectItem>
                <SelectItem value="30days">Last 30 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Practice area</Label>
            <Select value={practiceAreaFilter} onValueChange={onPracticeAreaFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All practice areas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {practiceAreaOptions.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Consultations</CardTitle>
            <CardDescription>
              Showing {Math.min(displayedUpcoming.length, filteredUpcoming.length)} of{" "}
              {filteredUpcoming.length} consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUpcoming.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground mb-2">No upcoming consultations</p>
                <p className="text-sm text-muted-foreground">New bookings will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedUpcoming.map((consultation) => {
                  const hoursUntil = differenceInHours(
                    new Date(consultation.scheduled_at),
                    new Date()
                  );
                  const meetingLink = getMeetingLink(consultation);
                  const canJoin = meetingLink && isWithinJoinWindow(consultation.scheduled_at);
                  return (
                    <div key={consultation.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm">
                            {consultation.profiles?.full_name}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {consultation.profiles?.email}
                          </p>
                        </div>
                        <Badge variant={consultation.status === "confirmed" ? "default" : "outline"}>
                          {consultation.status}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Date:</strong> {formatConsultationDateTime(consultation.scheduled_at)}
                        </p>
                        <p>
                          <strong>Practice Area:</strong> {consultation.practice_areas?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Times shown in {getLawyerTimezone()} (client timezone not provided)
                        </p>
                        {hoursUntil < 24 && (
                          <Badge variant="destructive" className="text-xs mt-2">
                            <Clock className="h-3 w-3 mr-1" />
                            Within 24h
                          </Badge>
                        )}
                      </div>
                      {canJoin && (
                        <Button
                          size="sm"
                          className="mt-3"
                          onClick={() =>
                            window.open(meetingLink, "_blank", "noopener,noreferrer")
                          }
                        >
                          Start Consultation
                        </Button>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {consultation.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => onUpdateStatus(consultation.id, "confirmed")}
                          >
                            Confirm
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMessageClient(consultation)}
                          disabled={!consultation.client_id}
                        >
                          Message
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onReschedule(consultation)}>
                          Reschedule
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => onCancel(consultation)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  );
                })}
                {filteredUpcoming.length > 5 && (
                  <Button variant="ghost" onClick={onToggleShowAllUpcoming}>
                    {showAllUpcoming ? "Show less" : "View all"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Past Consultations</CardTitle>
            <CardDescription>
              Showing {Math.min(displayedPast.length, filteredPast.length)} of {filteredPast.length} consultations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPast.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">No past consultations</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedPast.map((consultation) => (
                  <div key={consultation.id} className="border rounded-lg p-4 bg-muted/20">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{consultation.profiles?.full_name}</h3>
                        <p className="text-xs text-muted-foreground">{consultation.profiles?.email}</p>
                      </div>
                      <Badge
                        variant={
                          consultation.status === "completed"
                            ? "secondary"
                            : consultation.status === "cancelled"
                              ? "destructive"
                              : "outline"
                        }
                      >
                        {consultation.status}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-xs">
                      <p>
                        <strong>Date:</strong> {formatConsultationDateTime(consultation.scheduled_at)}
                      </p>
                      <p>
                        <strong>Amount:</strong> ${parseFloat(String(consultation.amount || 0)).toFixed(2)}
                      </p>
                      <p className="text-muted-foreground">
                        Payment status: {consultation.payment_status || "pending"}
                      </p>
                      <p className="text-muted-foreground">
                        Times shown in {getLawyerTimezone()} (client timezone not provided)
                      </p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onMessageClient(consultation)}
                        disabled={!consultation.client_id}
                      >
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredPast.length > 5 && (
                  <Button variant="ghost" onClick={onToggleShowAllPast}>
                    {showAllPast ? "Show less" : "View all"}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
};

export default ConsultationsTab;
