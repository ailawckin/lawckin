import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseSettingsSecurityParams {
  user: any | null;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
}

export function useSettingsSecurity({ user, toast }: UseSettingsSecurityParams) {
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const handleChangePassword = async () => {
    if (!user?.email) return;
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill out all password fields.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please confirm your new password.",
        variant: "destructive",
      });
      return;
    }
    const hasLetter = /[A-Za-z]/.test(newPassword);
    const hasNumber = /\d/.test(newPassword);
    if (newPassword.length < 8 || !hasLetter || !hasNumber) {
      toast({
        title: "Weak password",
        description: "Password must be at least 8 characters and include a letter and a number.",
        variant: "destructive",
      });
      return;
    }

    setSecurityLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (signInError) throw signInError;

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "Your password has been changed successfully.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Password update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleChangeEmail = async () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail) {
      toast({
        title: "Email required",
        description: "Please enter a new email address.",
        variant: "destructive",
      });
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast({
        title: "Invalid email address",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }
    setSecurityLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
      if (error) throw error;
      toast({
        title: "Email update requested",
        description: "Check your inbox to confirm the new email address.",
      });
      setNewEmail("");
      setEmailDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Email update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSecurityLoading(false);
    }
  };

  return {
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
  };
}
