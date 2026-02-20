import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { ScheduleManager } from "@/components/lawyer/ScheduleManager";

interface ScheduleTabProps {
  lawyerProfileId?: string | null;
  lawyerProfileTimezone?: string | null;
  lawyerProfileSlotDuration?: number | null;
}

const ScheduleTab = ({
  lawyerProfileId,
  lawyerProfileTimezone,
  lawyerProfileSlotDuration,
}: ScheduleTabProps) => {
  return (
    <TabsContent value="schedule" className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Manage Availability</CardTitle>
          <CardDescription>Set your available hours for clients to book.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleManager
            lawyerId={lawyerProfileId || ""}
            timezone={lawyerProfileTimezone || undefined}
            slotDurationMinutes={lawyerProfileSlotDuration || 30}
          />
        </CardContent>
      </Card>
    </TabsContent>
  );
};

export default ScheduleTab;
