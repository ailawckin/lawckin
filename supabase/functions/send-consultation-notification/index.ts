import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@4.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: 'cancellation' | 'confirmation' | 'reschedule';
  lawyerEmail: string;
  lawyerName: string;
  clientEmail: string;
  clientName: string;
  consultationDate: string;
  practiceArea: string;
  newConsultationDate?: string | null;
  reason?: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      lawyerEmail, 
      lawyerName, 
      clientEmail, 
      clientName, 
      consultationDate, 
      practiceArea 
    }: NotificationRequest = await req.json();

    console.log(`Sending ${type} notification for consultation on ${consultationDate}`);

    if (type === 'cancellation') {
      // Send email to client
      const clientEmailResponse = await resend.emails.send({
        from: "NY Legal Connect <onboarding@resend.dev>",
        to: [clientEmail],
        subject: "Consultation Cancelled",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a4d8f;">Consultation Cancelled</h2>
            <p>Dear ${clientName},</p>
            <p>We regret to inform you that your consultation has been cancelled.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Lawyer:</strong> ${lawyerName}</p>
              <p style="margin: 5px 0;"><strong>Practice Area:</strong> ${practiceArea}</p>
              <p style="margin: 5px 0;"><strong>Originally Scheduled:</strong> ${consultationDate}</p>
            </div>
            <p>You can search for other available lawyers on our platform.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <p>Best regards,<br>NY Legal Connect Team</p>
          </div>
        `,
      });

      // Send email to lawyer
      const lawyerEmailResponse = await resend.emails.send({
        from: "NY Legal Connect <onboarding@resend.dev>",
        to: [lawyerEmail],
        subject: "You Cancelled a Consultation",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a4d8f;">Consultation Cancelled</h2>
            <p>Dear ${lawyerName},</p>
            <p>You have successfully cancelled a consultation.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Client:</strong> ${clientName}</p>
              <p style="margin: 5px 0;"><strong>Practice Area:</strong> ${practiceArea}</p>
              <p style="margin: 5px 0;"><strong>Originally Scheduled:</strong> ${consultationDate}</p>
            </div>
            <p>The time slot has been made available again for new bookings.</p>
            <p>Best regards,<br>NY Legal Connect Team</p>
          </div>
        `,
      });

      console.log("Cancellation emails sent:", { clientEmailResponse, lawyerEmailResponse });
    }

    if (type === 'reschedule') {
      if (!clientEmail || !lawyerEmail) {
        throw new Error("Missing recipient email");
      }
      const clientEmailResponse = await resend.emails.send({
        from: "NY Legal Connect <onboarding@resend.dev>",
        to: [clientEmail],
        subject: "Consultation Rescheduled",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a4d8f;">Consultation Rescheduled</h2>
            <p>Dear ${clientName},</p>
            <p>Your consultation has been rescheduled.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Lawyer:</strong> ${lawyerName}</p>
              <p style="margin: 5px 0;"><strong>Practice Area:</strong> ${practiceArea}</p>
              <p style="margin: 5px 0;"><strong>Previous Time:</strong> ${consultationDate}</p>
              <p style="margin: 5px 0;"><strong>New Time:</strong> ${newConsultationDate || "Updated time"}</p>
            </div>
            ${reason ? `<p><strong>Note from lawyer:</strong> ${reason}</p>` : ""}
            <p>If this time doesn't work, please contact the lawyer through the platform.</p>
            <p>Best regards,<br>NY Legal Connect Team</p>
          </div>
        `,
      });

      const lawyerEmailResponse = await resend.emails.send({
        from: "NY Legal Connect <onboarding@resend.dev>",
        to: [lawyerEmail],
        subject: "Consultation Rescheduled",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1a4d8f;">Consultation Rescheduled</h2>
            <p>Dear ${lawyerName},</p>
            <p>You rescheduled a consultation.</p>
            <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Client:</strong> ${clientName}</p>
              <p style="margin: 5px 0;"><strong>Practice Area:</strong> ${practiceArea}</p>
              <p style="margin: 5px 0;"><strong>Previous Time:</strong> ${consultationDate}</p>
              <p style="margin: 5px 0;"><strong>New Time:</strong> ${newConsultationDate || "Updated time"}</p>
            </div>
            ${reason ? `<p><strong>Note:</strong> ${reason}</p>` : ""}
            <p>Best regards,<br>NY Legal Connect Team</p>
          </div>
        `,
      });

      console.log("Reschedule emails sent:", { clientEmailResponse, lawyerEmailResponse });
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notifications sent successfully" }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-consultation-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);