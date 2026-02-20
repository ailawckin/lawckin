export type ProfileSummary = {
  full_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
};

export type PracticeAreaSummary = {
  name?: string | null;
};

export type Consultation = {
  id: string;
  client_id?: string | null;
  scheduled_at: string;
  status: string;
  profiles?: ProfileSummary | null;
  practice_areas?: PracticeAreaSummary | null;
  duration_minutes?: number | null;
  notes?: string | null;
  amount?: number | string | null;
  payment_status?: string | null;
  meeting_link?: string | null;
  meeting_room_id?: string | null;
  lawyer_join_link?: string | null;
};

export type LawyerProfileSummary = {
  id?: string | null;
  timezone?: string | null;
  verification_status?: string | null;
  verification_rejection_reason?: string | null;
};

export type VerificationDocument = {
  id: string;
  type: "bar_certificate" | "professional_license" | "other";
  url: string;
  uploaded_at: string;
  file_name: string | null;
  file_size: number | null;
};

export type MessageItem = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content?: string | null;
  status?: string | null;
  created_at: string;
  delivered_at?: string | null;
  read_at?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  attachment_size?: number | null;
  attachment_type?: string | null;
  local_status?: "pending" | "failed";
};

export type MessageThreadMeta = {
  hasMore: boolean;
  loading: boolean;
  oldest?: string;
};

export type MessageConversation = {
  id: string;
  client_id?: string | null;
  last_message_at?: string | null;
  updated_at?: string | null;
  unread_count?: number;
  last_message_preview?: string | null;
  last_message_sender_id?: string | null;
  client_profile?: ProfileSummary | null;
};

export type MessageClient = {
  client_id: string;
  profile?: ProfileSummary | null;
};

export type SettingsFormErrors = {
  hourlyRate: string;
  experienceYears: string;
  address: string;
  bio: string;
  education: string;
  timezone: string;
};

export type SettingsFormData = {
  full_name: string;
  specialty: string[];
  experience_years: number;
  hourly_rate: number;
  bar_number: string;
  certifications: string[];
  accepting_new_clients: boolean;
  profile_visible: boolean;
  notify_email: boolean;
  notify_sms: boolean;
  notify_consultation_reminders: boolean;
  notify_new_messages: boolean;
  notify_marketing: boolean;
  slot_duration_minutes: number;
  timezone: string;
  languages: string[];
  meeting_types: string[];
  fee_models: string[];
  fee_model_rates: Record<string, string>;
  bio: string;
  education: string;
  location: string[];
  address_street: string;
  address_unit: string;
  address_city: string;
  address_state: string;
  address_postal_code: string;
  address_country: string;
};

export type PracticeAreaOption = {
  id: string;
  name: string;
};

export type SpecializationEntry = {
  specialization_id: string;
  specialization_name: string;
  years_experience: number | null;
};

export type SpecializationPracticeArea = {
  practice_area_id: string;
  practice_area_name: string;
  specializations: SpecializationEntry[];
};
