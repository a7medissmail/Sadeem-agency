// Hand-written Supabase schema types (matches supabase/migrations).
// Once you connect the Supabase CLI you can regenerate this file with:
//   npx supabase gen types typescript --project-id <id> > types/database.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Role = "admin" | "editor" | "viewer";
export type LeadSource = "homepage" | "course" | "consultation" | "other";
export type LeadStatus = "new" | "contacted" | "qualified" | "won" | "lost";
export type BookingStatus = "scheduled" | "completed" | "cancelled" | "no_show";
export type JobType = "job" | "internship";
export type ApplicationStatus = "new" | "review" | "interview" | "offer" | "rejected";
export type CampaignStatus = "draft" | "sending" | "sent" | "failed";
export type CourseCurrency = "SAR" | "USD" | "EUR" | "AED" | "EGP" | "GBP";
export type FormPurpose = "lead" | "application" | "consultation" | "proposal" | "generic";
export type FormFieldType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "url"
  | "select"
  | "multiselect"
  | "checkbox"
  | "file"
  | "date";
export type FormSubmissionStatus = "new" | "reviewed" | "converted" | "archived";
export type ClientPartnerRole = "anchor" | "grid";
export type ProposalStatus =
  | "draft"
  | "sent"
  | "opened"
  | "in_progress"
  | "submitted"
  | "reviewed"
  | "converted"
  | "expired";
export type QuotationStatus =
  | "draft"
  | "sent"
  | "viewed"
  | "accepted"
  | "declined"
  | "expired"
  | "superseded";

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: Role;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
        };
        Insert: { id: string; role?: Role; full_name?: string | null; avatar_url?: string | null };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      courses: {
        Row: {
          id: string;
          slug: string;
          title: string;
          summary: string | null;
          body: string | null;
          location: string | null;
          starts_at: string | null;
          ends_at: string | null;
          capacity: number | null;
          price: number | null;
          currency: CourseCurrency;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["courses"]["Row"],
          "id" | "created_at" | "updated_at" | "currency"
        > & {
          id?: string;
          currency?: CourseCurrency;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["courses"]["Insert"]>;
      };
      leads: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          company: string | null;
          message: string | null;
          source: LeadSource;
          status: LeadStatus;
          owner_id: string | null;
          marketing_unsubscribed_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["leads"]["Row"],
          "id" | "created_at" | "status" | "marketing_unsubscribed_at"
        > & {
          id?: string;
          status?: LeadStatus;
          marketing_unsubscribed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
      };
      lead_notes: {
        Row: {
          id: string;
          lead_id: string;
          author_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lead_notes"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["lead_notes"]["Insert"]>;
      };
      lead_activities: {
        Row: {
          id: string;
          lead_id: string;
          author_id: string | null;
          type: string;
          note: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["lead_activities"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["lead_activities"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          lead_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          topic: string | null;
          slot_start: string;
          slot_end: string;
          status: BookingStatus;
          google_event_id: string | null;
          meet_link: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bookings"]["Row"], "id" | "created_at" | "status"> & {
          id?: string;
          status?: BookingStatus;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      availability_rules: {
        Row: {
          id: string;
          weekday: number; // 0..6 (Sun..Sat)
          start_time: string; // "HH:MM"
          end_time: string;
          slot_minutes: number;
          buffer_minutes: number;
          active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["availability_rules"]["Row"], "id"> & { id?: string };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["availability_rules"]["Insert"]>;
      };
      team_members: {
        Row: {
          id: string;
          name: string;
          role: string | null;
          bio: string | null;
          photo_url: string | null;
          socials: Json | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["team_members"]["Row"], "id"> & { id?: string };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
      };
      jobs: {
        Row: {
          id: string;
          slug: string;
          title: string;
          type: JobType;
          department: string | null;
          location: string | null;
          body: string | null;
          requirements: string | null;
          application_form_id: string | null;
          is_open: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["jobs"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["jobs"]["Insert"]>;
      };
      applications: {
        Row: {
          id: string;
          job_id: string;
          name: string;
          email: string;
          phone: string | null;
          resume_url: string | null;
          cover_note: string | null;
          status: ApplicationStatus;
          owner_id: string | null;
          score: number | null;
          portfolio_url: string | null;
          linkedin_url: string | null;
          custom_answers: Json;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["applications"]["Row"],
          "id" | "created_at" | "status" | "owner_id" | "score" | "portfolio_url" | "linkedin_url" | "custom_answers"
        > & {
          id?: string;
          status?: ApplicationStatus;
          owner_id?: string | null;
          score?: number | null;
          portfolio_url?: string | null;
          linkedin_url?: string | null;
          custom_answers?: Json;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
      };
      application_notes: {
        Row: {
          id: string;
          application_id: string;
          author_id: string | null;
          note: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["application_notes"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["application_notes"]["Insert"]>;
      };
      application_status_history: {
        Row: {
          id: string;
          application_id: string;
          from_status: ApplicationStatus | null;
          to_status: ApplicationStatus;
          actor_id: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["application_status_history"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["application_status_history"]["Insert"]>;
      };
      forms: {
        Row: {
          id: string;
          slug: string;
          name: string;
          purpose: FormPurpose;
          description: string | null;
          submit_label: string;
          success_message: string | null;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["forms"]["Row"],
          "id" | "created_at" | "updated_at" | "purpose" | "submit_label" | "is_active" | "created_by"
        > & {
          id?: string;
          purpose?: FormPurpose;
          submit_label?: string;
          is_active?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["forms"]["Insert"]>;
      };
      form_fields: {
        Row: {
          id: string;
          form_id: string;
          label: string;
          field_key: string;
          type: FormFieldType;
          placeholder: string | null;
          help_text: string | null;
          options: Json;
          is_required: boolean;
          sort_order: number;
          config: Json;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["form_fields"]["Row"],
          "id" | "created_at" | "options" | "is_required" | "sort_order" | "config"
        > & {
          id?: string;
          options?: Json;
          is_required?: boolean;
          sort_order?: number;
          config?: Json;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["form_fields"]["Insert"]>;
      };
      form_submissions: {
        Row: {
          id: string;
          form_id: string | null;
          respondent_name: string | null;
          respondent_email: string | null;
          related_type: string | null;
          related_id: string | null;
          status: FormSubmissionStatus;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["form_submissions"]["Row"],
          "id" | "created_at" | "status" | "metadata"
        > & {
          id?: string;
          status?: FormSubmissionStatus;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["form_submissions"]["Insert"]>;
      };
      form_answers: {
        Row: {
          id: string;
          submission_id: string;
          field_id: string | null;
          field_key: string;
          value: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["form_answers"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["form_answers"]["Insert"]>;
      };
      email_campaigns: {
        Row: {
          id: string;
          subject: string;
          body: string;
          audience: Json;
          status: CampaignStatus;
          created_by: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["email_campaigns"]["Row"],
          "id" | "created_at" | "status" | "sent_at"
        > & {
          id?: string;
          status?: CampaignStatus;
          sent_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["email_campaigns"]["Insert"]>;
      };
      email_sends: {
        Row: {
          id: string;
          campaign_id: string;
          lead_id: string;
          status: "queued" | "sent" | "failed" | "bounced";
          recipient_email: string | null;
          resend_id: string | null;
          error: string | null;
          sent_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["email_sends"]["Row"], "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["email_sends"]["Insert"]>;
      };
      success_stories: {
        Row: {
          id: string;
          slug: string;
          title: string;
          client_name: string | null;
          industry: string | null;
          summary: string | null;
          challenge: string | null;
          solution: string | null;
          results: string | null;
          body: string | null;
          image_url: string | null;
          metric_value: string | null;
          metric_label: string | null;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["success_stories"]["Row"], "id" | "created_at" | "updated_at"> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["success_stories"]["Insert"]>;
      };
      site_settings: {
        Row: {
          id: boolean;
          logo_dark_url: string | null;
          logo_light_url: string | null;
          favicon_url: string | null;
          footer_description: string;
          footer_email: string;
          footer_phone: string | null;
          footer_location: string | null;
          social_links: Json;
          updated_at: string;
          is_maintenance_mode: boolean;
          maintenance_message: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
      };
      client_section: {
        Row: {
          id: boolean;
          eyebrow: string;
          meta_accent: string;
          meta_value: string;
          foot: string;
          nda_count: number;
          nda_label: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["client_section"]["Row"]>;
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["client_section"]["Insert"]>;
      };
      client_partners: {
        Row: {
          id: string;
          name: string;
          caption: string | null;
          logo_url: string;
          role: ClientPartnerRole;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["client_partners"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string; created_at?: string; updated_at?: string };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["client_partners"]["Insert"]>;
      };
      service_categories: {
        Row: {
          id: string;
          slug: string;
          label: string;
          tagline: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["service_categories"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string; created_at?: string; updated_at?: string };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["service_categories"]["Insert"]>;
      };
      services: {
        Row: {
          id: string;
          slug: string;
          title: string;
          category: string;
          tagline: string | null;
          intro: string | null;
          body: string | null;
          deliverables: string[];
          icon_key: string | null;
          sort_order: number;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["services"]["Row"],
          "id" | "created_at" | "updated_at"
        > & { id?: string; created_at?: string; updated_at?: string };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      proposals: {
        Row: {
          id: string;
          form_id: string | null;
          title: string;
          client_name: string;
          client_email: string;
          client_company: string | null;
          token_hash: string;
          token_prefix: string;
          status: ProposalStatus;
          expires_at: string;
          sent_at: string | null;
          opened_at: string | null;
          submitted_at: string | null;
          reviewed_at: string | null;
          created_by: string | null;
          internal_notes: string | null;
          lead_id: string | null;
          booking_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          form_id?: string | null;
          title: string;
          client_name: string;
          client_email: string;
          client_company?: string | null;
          token_hash: string;
          token_prefix: string;
          status?: ProposalStatus;
          expires_at?: string;
          sent_at?: string | null;
          opened_at?: string | null;
          submitted_at?: string | null;
          reviewed_at?: string | null;
          created_by?: string | null;
          internal_notes?: string | null;
          lead_id?: string | null;
          booking_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["proposals"]["Insert"]>;
      };
      quotations: {
        Row: {
          id: string;
          proposal_id: string | null;
          title: string;
          intro_text: string | null;
          currency: string;
          validity_days: number;
          subtotal: number;
          discount_pct: number;
          tax_pct: number;
          total: number;
          token_hash: string | null;
          token_prefix: string | null;
          status: QuotationStatus;
          sent_at: string | null;
          viewed_at: string | null;
          accepted_at: string | null;
          declined_at: string | null;
          decline_reason: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          proposal_id?: string | null;
          title: string;
          intro_text?: string | null;
          currency?: string;
          validity_days?: number;
          subtotal?: number;
          discount_pct?: number;
          tax_pct?: number;
          total?: number;
          token_hash?: string | null;
          token_prefix?: string | null;
          status?: QuotationStatus;
          sent_at?: string | null;
          viewed_at?: string | null;
          accepted_at?: string | null;
          declined_at?: string | null;
          decline_reason?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["quotations"]["Insert"]>;
      };
      quotation_items: {
        Row: {
          id: string;
          quotation_id: string;
          sort_order: number;
          name: string;
          description: string | null;
          quantity: number;
          unit: string | null;
          unit_price: number;
          total: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          quotation_id: string;
          sort_order?: number;
          name: string;
          description?: string | null;
          quantity?: number;
          unit?: string | null;
          unit_price?: number;
          total?: number;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["quotation_items"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
