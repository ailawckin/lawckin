import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SecuritySettingsCardProps {
  setPasswordDialogOpen: (value: boolean) => void;
  setEmailDialogOpen: (value: boolean) => void;
}

const SecuritySettingsCard = ({ setPasswordDialogOpen, setEmailDialogOpen }: SecuritySettingsCardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Manage your account credentials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button variant="outline" onClick={() => setPasswordDialogOpen(true)}>
          Change Password
        </Button>
        <Button variant="outline" onClick={() => setEmailDialogOpen(true)}>
          Change Email
        </Button>
        <Button variant="outline" disabled>
          Enable Two-Factor Authentication (coming soon)
        </Button>
      </CardContent>
    </Card>
  );
};

export default SecuritySettingsCard;
