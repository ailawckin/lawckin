import { useState, type ChangeEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { validateImageFile } from "@/lib/fileValidation";

interface UseSettingsAvatarParams {
  user: any | null;
  toast: (args: { title: string; description?: string; variant?: "destructive" }) => void;
  fetchProfile: (userId: string) => Promise<void>;
}

export function useSettingsAvatar({ user, toast, fetchProfile }: UseSettingsAvatarParams) {
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError.message,
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      await fetchProfile(user.id);
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  return {
    uploadingAvatar,
    handleAvatarUpload,
  };
}
