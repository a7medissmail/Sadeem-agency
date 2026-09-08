import type { BookingStatus } from "@/types/database";

export type BookingBoardRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  topic: string | null;
  slot_start: string;
  slot_end: string;
  status: BookingStatus;
  meet_link: string | null;
  google_event_id: string | null;
  created_at: string;
};

export type AvailabilityRuleRow = {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  buffer_minutes: number;
  active: boolean;
};

export type BookingSettingsRow = {
  max_per_week: number;
  max_per_day: number;
  min_notice_hours: number;
  min_lead_days: number;
  max_advance_days: number;
  week_starts_on: number;
};

export type BookingBlackoutRow = {
  id: string;
  starts_on: string;
  ends_on: string;
  reason: string | null;
};
