import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useReviews = () => {
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const submitReview = async (
    consultationId: string,
    lawyerId: string,
    rating: number,
    reviewText?: string
  ) => {
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("lawyer_reviews")
        .insert({
          consultation_id: consultationId,
          client_id: user.id,
          lawyer_id: lawyerId,
          rating,
          review_text: reviewText || null,
        });

      if (error) throw error;

      toast({
        title: "Review submitted",
        description: "Thank you for your feedback!",
      });

      return true;
    } catch (error: any) {
      toast({
        title: "Error submitting review",
        description: error.message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  const getLawyerReviews = async (lawyerId: string) => {
    try {
      const { data, error } = await supabase
        .from("lawyer_reviews")
        .select(`
          *,
          profiles!lawyer_reviews_client_id_fkey(full_name, avatar_url)
        `)
        .eq("lawyer_id", lawyerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  };

  return {
    submitReview,
    getLawyerReviews,
    submitting,
  };
};
