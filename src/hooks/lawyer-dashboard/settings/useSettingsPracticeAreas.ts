import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useSettingsPracticeAreas() {
  const [practiceAreas, setPracticeAreas] = useState<Array<{ id: string; name: string }>>([]);
  const [practiceAreasLoading, setPracticeAreasLoading] = useState(false);
  const [practiceAreasError, setPracticeAreasError] = useState("");

  useEffect(() => {
    const fetchPracticeAreas = async () => {
      setPracticeAreasLoading(true);
      setPracticeAreasError("");
      try {
        const { data, error } = await supabase
          .from("practice_areas")
          .select("id, name")
          .order("name", { ascending: true });

        if (error) throw error;
        setPracticeAreas(data || []);
        if (!data || data.length === 0) {
          setPracticeAreasError("No practice areas available.");
        }
      } catch (error: any) {
        setPracticeAreasError(error.message || "Failed to load practice areas.");
      } finally {
        setPracticeAreasLoading(false);
      }
    };

    fetchPracticeAreas();
  }, []);

  return {
    practiceAreas,
    practiceAreasLoading,
    practiceAreasError,
  };
}
