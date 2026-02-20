export interface ReportedItem {
  id: string;
  reporter_id: string | null;
  entity_type: string;
  entity_id: string;
  reason: string | null;
  status: string | null;
  action_taken: string | null;
  resolved_by: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter_name?: string;
  reporter_email?: string;
  entity_name?: string;
}
