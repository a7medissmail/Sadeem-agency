-- ============================================================
-- 0023_nullable_submission_form_id.sql
--
-- Make form_submissions.form_id nullable so that proposal briefs
-- (submitted via the guided BriefStepper — not tied to a forms row)
-- can be stored without a form_id FK.
-- ============================================================

alter table public.form_submissions
  alter column form_id drop not null;
