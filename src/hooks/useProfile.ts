import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async (userId: string) => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
    setLoading(false);
    return data;
  };

  const updateProfile = async (userId: string, updates: any) => {
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("user_id", userId);

    if (!error) {
      await fetchProfile(userId);
    }
    return { error };
  };

  return {
    profile,
    loading,
    fetchProfile,
    updateProfile,
  };
};
