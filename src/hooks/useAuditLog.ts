import { supabase } from "@/integrations/supabase/client";

interface AuditLogParams {
  action: string;
  entityType: string;
  entityId?: string;
  beforeData?: any;
  afterData?: any;
}

// Helper function to get client IP address
const getClientIP = async (): Promise<string | null> => {
  try {
    // Try to get IP from a public IP service (client-side)
    // Note: This is a best-effort approach. For production, use server-side IP capture
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip || null;
  } catch (error) {
    console.warn("Could not fetch IP address:", error);
    return null;
  }
};

export const useAuditLog = () => {
  const logAction = async ({
    action,
    entityType,
    entityId,
    beforeData,
    afterData,
  }: AuditLogParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get IP address (best effort, non-blocking)
      // Use Promise.race to timeout after 2 seconds so it doesn't block audit logging
      const ipAddress = await Promise.race([
        getClientIP(),
        new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 2000))
      ]).catch(() => null);

      await supabase.from("admin_audit_log").insert({
        admin_id: user.id,
        action,
        entity_type: entityType,
        entity_id: entityId,
        before_json: beforeData || null,
        after_json: afterData || null,
        ip_address: ipAddress,
      });
    } catch (error) {
      console.error("Error logging audit action:", error);
    }
  };

  return { logAction };
};
