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
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["applications"]["Row"], "id" | "created_at" | "status"> & {
          id?: string;
          status?: ApplicationStatus;
          created_at?: string;
        };
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["applications"]["Insert"]>;
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
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Relationships: [];
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
