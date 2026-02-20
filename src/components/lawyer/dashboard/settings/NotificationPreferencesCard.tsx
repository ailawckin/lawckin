import { Bell } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { SettingsFormData } from "@/components/lawyer/dashboard/types";

interface NotificationPreferencesCardProps {
  formData: SettingsFormData;
  setFormData: (value: SettingsFormData | ((prev: SettingsFormData) => SettingsFormData)) => void;
  markDirty: () => void;
}

const NotificationPreferencesCard = ({
  formData,
  setFormData,
  markDirty,
}: NotificationPreferencesCardProps) => {
  const updateValue = (key: keyof SettingsFormData, value: boolean) => {
    setFormData({ ...formData, [key]: value });
    markDirty();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>Choose how you want to be notified</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label>Email notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive platform emails about consultations and messages.
            </p>
          </div>
          <Switch
            checked={formData.notify_email}
            onCheckedChange={(value) => updateValue("notify_email", value)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label>Consultation reminders</Label>
            <p className="text-sm text-muted-foreground">
              Get reminder emails before upcoming consultations.
            </p>
          </div>
          <Switch
            checked={formData.notify_consultation_reminders}
            onCheckedChange={(value) => updateValue("notify_consultation_reminders", value)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label>New message alerts</Label>
            <p className="text-sm text-muted-foreground">
              Receive an email when a client sends a new message.
            </p>
          </div>
          <Switch
            checked={formData.notify_new_messages}
            onCheckedChange={(value) => updateValue("notify_new_messages", value)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label>SMS notifications</Label>
            <p className="text-sm text-muted-foreground">Text alerts (coming soon).</p>
          </div>
          <Switch checked={formData.notify_sms} disabled />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label>Marketing communications</Label>
            <p className="text-sm text-muted-foreground">Product updates and announcements.</p>
          </div>
          <Switch
            checked={formData.notify_marketing}
            onCheckedChange={(value) => updateValue("notify_marketing", value)}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationPreferencesCard;
