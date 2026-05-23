# SADEEM — App Setup

This project is being upgraded from a static site to a full app. P0 = Supabase + Auth + admin shell + user CRUD. You only need to do this once.

## 1. Install

```bash
npm install
```

## 2. Create the Supabase project

1. Go to **supabase.com → New project**.
2. Open **Settings → API** and copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` `secret` key → `SUPABASE_SERVICE_ROLE_KEY` (server-only)

## 3. Apply the database schema

Open the project's **SQL Editor** and run the file:

```
supabase/migrations/0001_init.sql
```

This creates all tables (profiles, courses, leads, bookings, team_members, jobs, applications, email_campaigns, …) with **RLS enabled** and the policies the app expects. A trigger automatically creates a `profiles` row for every new auth user.

## 4. Bootstrap the first admin

Either in Supabase **Authentication → Users → Invite user**, or via the SQL editor after a user has signed up:

```sql
update public.profiles set role = 'admin' where id = '<auth-user-id>';
```

Roles available: `admin`, `editor`, `viewer`. Only `admin` can manage other users.

## 5. Resend (transactional + later marketing email)

1. Create an account at **resend.com**.
2. **Verify your sending domain** (DNS records).
3. Create an API key → `RESEND_API_KEY`.
4. Set `EMAIL_FROM="SADEEM <hello@yourdomain.com>"` and `TEAM_NOTIFY_TO=team@yourdomain.com`.

## 6. Google Calendar (Phase 5 — booking)

1. Create a project in **Google Cloud Console**.
2. Enable the **Google Calendar API**.
3. Create a **Service Account**, download the JSON key.
4. In your team's Google Workspace, create a calendar (or use one) and **share it with the service account email** (Make changes to events).
5. Fill in `.env.local`:
   - `GOOGLE_SA_EMAIL` = service account email
   - `GOOGLE_SA_PRIVATE_KEY` = private_key from the JSON (keep `\n` line-breaks)
   - `GOOGLE_CALENDAR_ID` = the calendar's ID (Calendar settings → Integrate calendar)
   - `GOOGLE_BOOKING_TIMEZONE` = e.g. `Asia/Riyadh`

## 7. Env file

Copy `.env.example` → `.env.local` and paste the values.

## 8. Run

```bash
npm run dev
```

- Public site: <http://localhost:3000>
- Admin: <http://localhost:3000/admin> (redirects to `/admin/login` if signed out)

## Roadmap (see plan file)

- **P0** ✅ TS migration · Supabase clients · schema · auth · admin shell · user CRUD
- **P1** Leads + CRM + transactional email
- **P2** Courses / Workshops (public + admin toggle)
- **P3** Team page (public + admin)
- **P4** Careers + applications (uploads, pipeline)
- **P5** Consultation booking (Google Calendar + custom UI)
- **P6** Marketing campaigns to the CRM
