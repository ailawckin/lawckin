import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SecurityDialogsProps {
  passwordDialogOpen: boolean;
  setPasswordDialogOpen: (open: boolean) => void;
  emailDialogOpen: boolean;
  setEmailDialogOpen: (open: boolean) => void;
  securityLoading: boolean;
  currentPassword: string;
  setCurrentPassword: (value: string) => void;
  newPassword: string;
  setNewPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  newEmail: string;
  setNewEmail: (value: string) => void;
  handleChangePassword: () => void;
  handleChangeEmail: () => void;
}

const SecurityDialogs = ({
  passwordDialogOpen,
  setPasswordDialogOpen,
  emailDialogOpen,
  setEmailDialogOpen,
  securityLoading,
  currentPassword,
  setCurrentPassword,
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  newEmail,
  setNewEmail,
  handleChangePassword,
  handleChangeEmail,
}: SecurityDialogsProps) => {
  return (
    <>
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Update your account password.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Current password</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>New password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={securityLoading}>
              {securityLoading ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Change Email</DialogTitle>
            <DialogDescription>
              We'll send a verification email to confirm the change.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>New email</Label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleChangeEmail} disabled={securityLoading}>
              {securityLoading ? "Updating..." : "Update Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SecurityDialogs;
