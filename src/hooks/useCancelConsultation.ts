import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export const useCancelConsultation = () => {
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  const cancelConsultation = async (
    consultation: any,
    userId: string,
    userProfile: any,
    userType: "client" | "lawyer"
  ) => {
    setCancelling(true);
    try {
      // Use atomic cancel_consultation function
      const { data: cancelResult, error: cancelError } = await supabase.rpc("cancel_consultation", {
        p_consultation_id: consultation.id,
        p_user_id: userId
      });

      if (cancelError) throw cancelError;

      const result = cancelResult as { success: boolean; error?: string };
      
      if (!result.success) {
        throw new Error(result.error || "Failed to cancel consultation");
      }

      // Prepare notification data based on user type
      const notificationData = userType === "client" 
        ? {
            type: 'cancellation',
            clientEmail: userProfile?.email,
            clientName: userProfile?.full_name,
            lawyerEmail: consultation.lawyer_profiles?.profiles?.full_name 
              ? consultation.lawyer_profiles.profiles.email 
              : null,
            lawyerName: consultation.lawyer_profiles?.profiles?.full_name,
            consultationDate: format(new Date(consultation.scheduled_at), "PPP 'at' p"),
            practiceArea: consultation.practice_areas?.name
          }
        : {
            type: 'cancellation',
            lawyerEmail: userProfile?.email,
            lawyerName: userProfile?.full_name,
            clientEmail: consultation.profiles?.email,
            clientName: consultation.profiles?.full_name,
            consultationDate: format(new Date(consultation.scheduled_at), "PPP 'at' p"),
            practiceArea: consultation.practice_areas?.name
          };

      // Send notification email
      await supabase.functions.invoke('send-consultation-notification', {
        body: notificationData
      });

      toast({
        title: "Consultation cancelled",
        description: "The time slot is now available and notifications have been sent",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Error cancelling consultation",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setCancelling(false);
    }
  };

  return {
    cancelConsultation,
    cancelling,
  };
};
