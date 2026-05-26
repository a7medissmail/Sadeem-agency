-- 0019_maintenance_mode.sql
-- Adds maintenance mode flag to site_settings.
-- The middleware reads is_maintenance_mode via the anon/public key,
-- so we grant SELECT on the table to the anon role.

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS is_maintenance_mode  boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS maintenance_message  text;

-- Allow the anonymous (public) role to read site_settings so that
-- the middleware can check the maintenance flag without a service key.
-- All values here are already public-facing (logos, footer text, etc.).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename   = 'site_settings'
      AND policyname  = 'anon can read site settings'
  ) THEN
    CREATE POLICY "anon can read site settings"
      ON public.site_settings
      FOR SELECT
      TO anon
      USING (true);
  END IF;
END
$$;
