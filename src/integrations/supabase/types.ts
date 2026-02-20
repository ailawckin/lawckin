export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string
          after_json: Json | null
          before_json: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
        }
        Insert: {
          action: string
          admin_id: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          after_json?: Json | null
          before_json?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      availability_overrides: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          is_available: boolean
          lawyer_id: string
          override_date: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          lawyer_id: string
          override_date: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          lawyer_id?: string
          override_date?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_overrides_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_connections: {
        Row: {
          access_token: string
          calendar_id: string | null
          calendar_name: string | null
          created_at: string
          id: string
          last_synced_at: string | null
          lawyer_id: string
          metadata: Json | null
          provider: Database["public"]["Enums"]["calendar_provider"]
          provider_account_id: string
          refresh_token: string | null
          scopes: string[] | null
          status:
            | Database["public"]["Enums"]["calendar_connection_status"]
            | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          lawyer_id: string
          metadata?: Json | null
          provider: Database["public"]["Enums"]["calendar_provider"]
          provider_account_id: string
          refresh_token?: string | null
          scopes?: string[] | null
          status?:
            | Database["public"]["Enums"]["calendar_connection_status"]
            | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          calendar_id?: string | null
          calendar_name?: string | null
          created_at?: string
          id?: string
          last_synced_at?: string | null
          lawyer_id?: string
          metadata?: Json | null
          provider?: Database["public"]["Enums"]["calendar_provider"]
          provider_account_id?: string
          refresh_token?: string | null
          scopes?: string[] | null
          status?:
            | Database["public"]["Enums"]["calendar_connection_status"]
            | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_connections_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events_cache: {
        Row: {
          connection_id: string
          created_at: string
          event_end: string
          event_id: string
          event_start: string
          id: string
          is_busy: boolean
          metadata: Json | null
          summary: string | null
          synced_at: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          event_end: string
          event_id: string
          event_start: string
          id?: string
          is_busy?: boolean
          metadata?: Json | null
          summary?: string | null
          synced_at?: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          event_end?: string
          event_id?: string
          event_start?: string
          id?: string
          is_busy?: boolean
          metadata?: Json | null
          summary?: string | null
          synced_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_cache_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_sync_log: {
        Row: {
          connection_id: string
          created_at: string
          error_message: string | null
          events_synced: number | null
          id: string
          metadata: Json | null
          status: string
          sync_end: string
          sync_start: string
          sync_type: string
        }
        Insert: {
          connection_id: string
          created_at?: string
          error_message?: string | null
          events_synced?: number | null
          id?: string
          metadata?: Json | null
          status: string
          sync_end: string
          sync_start: string
          sync_type: string
        }
        Update: {
          connection_id?: string
          created_at?: string
          error_message?: string | null
          events_synced?: number | null
          id?: string
          metadata?: Json | null
          status?: string
          sync_end?: string
          sync_start?: string
          sync_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_sync_log_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "calendar_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      client_search: {
        Row: {
          ai_embedding: number[] | null
          ai_embedding_model: string | null
          ai_confidence: number | null
          ai_keywords: string[] | null
          ai_output: Json | null
          ai_practice_area: string | null
          ai_specific_issue: string | null
          ai_summary: string | null
          budget_band: string
          created_at: string
          fee_model: string | null
          id: string
          intake_mode: string
          matched_lawyers: string[] | null
          meeting_preference: string | null
          ny_location: string
          ny_locations: string[] | null
          practice_area: string
          preferred_language: string | null
          specific_issue: string | null
          situation: string | null
          urgency: string | null
          user_id: string | null
        }
        Insert: {
          ai_embedding?: number[] | null
          ai_embedding_model?: string | null
          ai_confidence?: number | null
          ai_keywords?: string[] | null
          ai_output?: Json | null
          ai_practice_area?: string | null
          ai_specific_issue?: string | null
          ai_summary?: string | null
          budget_band: string
          created_at?: string
          fee_model?: string | null
          id?: string
          intake_mode?: string
          matched_lawyers?: string[] | null
          meeting_preference?: string | null
          ny_location: string
          ny_locations?: string[] | null
          practice_area: string
          preferred_language?: string | null
          specific_issue?: string | null
          situation?: string | null
          urgency?: string | null
          user_id?: string | null
        }
        Update: {
          ai_embedding?: number[] | null
          ai_embedding_model?: string | null
          ai_confidence?: number | null
          ai_keywords?: string[] | null
          ai_output?: Json | null
          ai_practice_area?: string | null
          ai_specific_issue?: string | null
          ai_summary?: string | null
          budget_band?: string
          created_at?: string
          fee_model?: string | null
          id?: string
          intake_mode?: string
          matched_lawyers?: string[] | null
          meeting_preference?: string | null
          ny_location?: string
          ny_locations?: string[] | null
          practice_area?: string
          preferred_language?: string | null
          specific_issue?: string | null
          situation?: string | null
          urgency?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      consultations: {
        Row: {
          amount: number | null
          client_id: string
          client_join_link: string | null
          created_at: string
          duration_minutes: number
          id: string
          lawyer_id: string
          lawyer_join_link: string | null
          meeting_link: string | null
          meeting_room_id: string | null
          notes: string | null
          payment_intent_id: string | null
          payment_status: string | null
          practice_area_id: string | null
          scheduled_at: string
          status: string
          time_slot_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          client_id: string
          client_join_link?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lawyer_id: string
          lawyer_join_link?: string | null
          meeting_link?: string | null
          meeting_room_id?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          practice_area_id?: string | null
          scheduled_at: string
          status?: string
          time_slot_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          client_id?: string
          client_join_link?: string | null
          created_at?: string
          duration_minutes?: number
          id?: string
          lawyer_id?: string
          lawyer_join_link?: string | null
          meeting_link?: string | null
          meeting_room_id?: string | null
          notes?: string | null
          payment_intent_id?: string | null
          payment_status?: string | null
          practice_area_id?: string | null
          scheduled_at?: string
          status?: string
          time_slot_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_practice_area_id_fkey"
            columns: ["practice_area_id"]
            isOneToOne: false
            referencedRelation: "practice_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          last_message_sender_id: string | null
          lawyer_id: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          lawyer_id: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          last_message_sender_id?: string | null
          lawyer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      firms: {
        Row: {
          contact_email: string
          created_at: string
          discount_percentage: number | null
          firm_name: string
          id: string
          plan: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          contact_email: string
          created_at?: string
          discount_percentage?: number | null
          firm_name: string
          id?: string
          plan?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          contact_email?: string
          created_at?: string
          discount_percentage?: number | null
          firm_name?: string
          id?: string
          plan?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      lawyer_date_availability: {
        Row: {
          availability_date: string
          created_at: string
          end_time: string
          id: string
          lawyer_id: string
          start_time: string
          source: string
        }
        Insert: {
          availability_date: string
          created_at?: string
          end_time: string
          id?: string
          lawyer_id: string
          start_time: string
          source?: string
        }
        Update: {
          availability_date?: string
          created_at?: string
          end_time?: string
          id?: string
          lawyer_id?: string
          start_time?: string
          source?: string
        }
        Relationships: []
      }
      lawyer_availability_exceptions: {
        Row: {
          created_at: string
          exception_date: string
          id: string
          lawyer_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          exception_date: string
          id?: string
          lawyer_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          exception_date?: string
          id?: string
          lawyer_id?: string
          reason?: string | null
        }
        Relationships: []
      }
      lawyer_weekly_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          lawyer_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          lawyer_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          lawyer_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      lawyer_expertise: {
        Row: {
          created_at: string
          id: string
          lawyer_id: string
          practice_area_id: string
          updated_at: string
          years_experience: number
        }
        Insert: {
          created_at?: string
          id?: string
          lawyer_id: string
          practice_area_id: string
          updated_at?: string
          years_experience: number
        }
        Update: {
          created_at?: string
          id?: string
          lawyer_id?: string
          practice_area_id?: string
          updated_at?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_expertise_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_expertise_practice_area_id_fkey"
            columns: ["practice_area_id"]
            isOneToOne: false
            referencedRelation: "practice_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_profiles: {
        Row: {
          bar_number: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string
          education: string | null
          embedding: number[] | null
          embedding_model: string | null
          embedding_text: string | null
          embedding_updated_at: string | null
          experience_years: number
          fee_models: string[] | null
          fee_model_rates: Json | null
          firm_id: string | null
          hourly_max: number | null
          hourly_min: number | null
          hourly_rate: number | null
          slot_duration_minutes: number
          id: string
          languages: string[] | null
          last_active: string | null
          location: string | null
          meeting_types: string[] | null
          ny_locations: string[] | null
          practice_areas: string[] | null
          rating: number | null
          specialty: string
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_state: string | null
          address_street: string | null
          address_unit: string | null
          street_address: string | null
          status: string | null
          tier: string | null
          timezone: string | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          verification_documents: Json | null
          verification_rejection_reason: string | null
          verification_status: string | null
          verified: boolean | null
        }
        Insert: {
          bar_number?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          education?: string | null
          embedding?: number[] | null
          embedding_model?: string | null
          embedding_text?: string | null
          embedding_updated_at?: string | null
          experience_years?: number
          fee_models?: string[] | null
          fee_model_rates?: Json | null
          firm_id?: string | null
          hourly_max?: number | null
          hourly_min?: number | null
          hourly_rate?: number | null
          slot_duration_minutes?: number
          id?: string
          languages?: string[] | null
          last_active?: string | null
          location?: string | null
          meeting_types?: string[] | null
          ny_locations?: string[] | null
          practice_areas?: string[] | null
          rating?: number | null
          specialty: string
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          address_unit?: string | null
          street_address?: string | null
          status?: string | null
          tier?: string | null
          timezone?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          verification_documents?: Json | null
          verification_rejection_reason?: string | null
          verification_status?: string | null
          verified?: boolean | null
        }
        Update: {
          bar_number?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          education?: string | null
          embedding?: number[] | null
          embedding_model?: string | null
          embedding_text?: string | null
          embedding_updated_at?: string | null
          experience_years?: number
          fee_models?: string[] | null
          fee_model_rates?: Json | null
          firm_id?: string | null
          hourly_max?: number | null
          hourly_min?: number | null
          hourly_rate?: number | null
          slot_duration_minutes?: number
          id?: string
          languages?: string[] | null
          last_active?: string | null
          location?: string | null
          meeting_types?: string[] | null
          ny_locations?: string[] | null
          practice_areas?: string[] | null
          rating?: number | null
          specialty?: string
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          address_unit?: string | null
          street_address?: string | null
          status?: string | null
          tier?: string | null
          timezone?: string | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          verification_documents?: Json | null
          verification_rejection_reason?: string | null
          verification_status?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_profiles_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firms"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_reviews: {
        Row: {
          client_id: string
          consultation_id: string
          created_at: string
          id: string
          lawyer_id: string
          rating: number
          review_text: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          consultation_id: string
          created_at?: string
          id?: string
          lawyer_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          consultation_id?: string
          created_at?: string
          id?: string
          lawyer_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_reviews_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: true
            referencedRelation: "bookings_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_reviews_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: true
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_reviews_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_specializations: {
        Row: {
          created_at: string
          id: string
          lawyer_id: string
          specialization_id: string
          updated_at: string
          years_experience: number
        }
        Insert: {
          created_at?: string
          id?: string
          lawyer_id: string
          specialization_id: string
          updated_at?: string
          years_experience?: number
        }
        Update: {
          created_at?: string
          id?: string
          lawyer_id?: string
          specialization_id?: string
          updated_at?: string
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_specializations_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_specializations_specialization_id_fkey"
            columns: ["specialization_id"]
            isOneToOne: false
            referencedRelation: "practice_area_specializations"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_name: string | null
          attachment_size: number | null
          attachment_type: string | null
          attachment_url: string | null
          content: string
          conversation_id: string
          created_at: string
          delivered_at: string | null
          id: string
          read_at: string | null
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_area_specializations: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          practice_area_id: string
          specialization_name: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          practice_area_id: string
          specialization_name: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          practice_area_id?: string
          specialization_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_area_specializations_practice_area_id_fkey"
            columns: ["practice_area_id"]
            isOneToOne: false
            referencedRelation: "practice_areas"
            referencedColumns: ["id"]
          },
        ]
      }
      practice_areas: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      profile_views: {
        Row: {
          id: string
          ip_address: string | null
          lawyer_id: string
          user_agent: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          lawyer_id: string
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          lawyer_id?: string
          user_agent?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          onboarding_completed: boolean | null
          phone: string | null
          preferred_language: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean | null
          phone?: string | null
          preferred_language?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recurring_availability: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          lawyer_id: string
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          lawyer_id: string
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          lawyer_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_availability_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reported_items: {
        Row: {
          action_taken: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          reason: string | null
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          reason?: string | null
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          booking_id: string | null
          created_at: string
          end_time: string
          id: string
          is_booked: boolean
          lawyer_id: string
          start_time: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          end_time: string
          id?: string
          is_booked?: boolean
          lawyer_id: string
          start_time: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          end_time?: string
          id?: string
          is_booked?: boolean
          lawyer_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_slots_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      bookings_with_details: {
        Row: {
          amount: number | null
          client_email: string | null
          client_id: string | null
          client_join_link: string | null
          client_name: string | null
          created_at: string | null
          duration_minutes: number | null
          id: string | null
          lawyer_email: string | null
          lawyer_id: string | null
          lawyer_join_link: string | null
          lawyer_name: string | null
          meeting_room_id: string | null
          notes: string | null
          payment_status: string | null
          practice_area_name: string | null
          scheduled_at: string | null
          status: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultations_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_daily_views: {
        Row: {
          lawyer_id: string | null
          view_count: number | null
          view_date: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_view_stats: {
        Row: {
          last_viewed_at: string | null
          lawyer_id: string | null
          total_views: number | null
          unique_viewers: number | null
          views_last_30_days: number | null
          views_last_7_days: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profile_views_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      book_time_slot: {
        Args: {
          p_client_id: string
          p_lawyer_id: string
          p_notes?: string
          p_practice_area_id: string
          p_slot_id: string
        }
        Returns: Json
      }
      cancel_consultation: {
        Args: { p_consultation_id: string; p_user_id: string }
        Returns: Json
      }
      check_calendar_conflicts: {
        Args: { p_end_time: string; p_lawyer_id: string; p_start_time: string }
        Returns: boolean
      }
      apply_weekly_availability: {
        Args: { p_end_date: string; p_lawyer_id: string; p_start_date: string }
        Returns: undefined
      }
      generate_time_slots_for_availability: {
        Args: {
          p_date: string
          p_end: string
          p_lawyer_id: string
          p_slot_minutes?: number
          p_start: string
        }
        Returns: undefined
      }
      rebuild_time_slots_for_lawyer: {
        Args: { p_lawyer_id: string }
        Returns: undefined
      }
      get_lawyer_profile: {
        Args: { lawyer_profile_id: string }
        Returns: {
          avatar_url: string
          bar_number: string
          bio: string
          experience_years: number
          fee_models: string[]
          full_name: string
          hourly_max: number
          hourly_min: number
          hourly_rate: number
          id: string
          languages: string[]
          location: string
          meeting_types: string[]
          ny_locations: string[]
          practice_areas: string[]
          rating: number
          specialty: string
          total_reviews: number
          user_id: string
          verification_status: string
          verified: boolean
        }[]
      }
      get_lawyers_list: {
        Args: never
        Returns: {
          avatar_url: string
          experience_years: number
          full_name: string
          id: string
          location: string | null
          ny_locations: string[] | null
          practice_areas: string[] | null
          rating: number
          specialty: string | null
          total_reviews: number
          user_id: string
          hourly_rate: number | null
          slot_duration_minutes: number
          firm_name: string | null
        }[]
      }
      search_lawyers: {
        Args: {
          p_practice_area?: string | null
          p_location?: string | null
          p_locations?: string[] | null
          p_min_rate?: number | null
          p_max_rate?: number | null
          p_specific_issue?: string | null
          p_languages?: string[] | null
          p_limit?: number
        }
        Returns: {
          avatar_url: string
          experience_years: number
          full_name: string
          id: string
          location: string | null
          ny_locations: string[] | null
          practice_areas: string[] | null
          rating: number
          specialty: string | null
          total_reviews: number
          user_id: string
          hourly_rate: number | null
          slot_duration_minutes: number
          firm_name: string | null
          match_score: number
          specializations: Json
          expertise_areas: Json
        }[]
      }
      search_lawyers_advanced: {
        Args: {
          p_practice_area?: string | null
          p_location?: string | null
          p_locations?: string[] | null
          p_min_rate?: number | null
          p_max_rate?: number | null
          p_specific_issue?: string | null
          p_languages?: string[] | null
          p_keywords?: string[] | null
          p_urgency?: string | null
          p_embedding?: number[] | null
          p_limit?: number
        }
        Returns: {
          avatar_url: string
          experience_years: number
          full_name: string
          id: string
          location: string | null
          ny_locations: string[] | null
          practice_areas: string[] | null
          rating: number
          specialty: string | null
          total_reviews: number
          user_id: string
          hourly_rate: number | null
          slot_duration_minutes: number
          firm_name: string | null
          match_score: number
          specializations: Json
          expertise_areas: Json
        }[]
      }
      search_lawyers_from_search: {
        Args: {
          p_search_id: string
          p_limit?: number
        }
        Returns: {
          avatar_url: string
          experience_years: number
          full_name: string
          id: string
          location: string | null
          ny_locations: string[] | null
          practice_areas: string[] | null
          rating: number
          specialty: string | null
          total_reviews: number
          user_id: string
          hourly_rate: number | null
          slot_duration_minutes: number
          firm_name: string | null
          match_score: number
          specializations: Json
          expertise_areas: Json
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "client" | "lawyer" | "admin"
      calendar_connection_status: "active" | "expired" | "revoked" | "error"
      calendar_provider: "google" | "microsoft"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["client", "lawyer", "admin"],
      calendar_connection_status: ["active", "expired", "revoked", "error"],
      calendar_provider: ["google", "microsoft"],
    },
  },
} as const
