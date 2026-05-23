# SADEEM — Handoff & Progress Log

> **Purpose:** running ledger of the project. Read top-to-bottom to pick up cold.
> Every meaningful change appends to **§ Update log** below.

---

## 1. Project at a glance

SADEEM is a premium cinematic strategic-advisory site that's being turned into a full web app:

- **Public site** (`/`) — cinematic one-pager (hero slider with real photo composites, Why/About/Services/Approach/Cases/Clients/Final CTA). Lenis smooth scroll + Framer Motion reveals + custom CSS atmospheres + real WebP imagery.
- **Admin app** (`/admin`) — protected back office for staff: dashboard, Users CRUD (live), and Leads / Bookings / Courses / Team / Careers / Applications coming by phase.
- **Backend** — Supabase (Postgres + Auth + Storage), RLS on every table, server actions for writes, service-role key strictly server-side.

---

## 2. Stack

- **Next.js 14 App Router** · **TypeScript** (TS 5.x, React 18 types)
- **Tailwind CSS** (custom `globals.css` design tokens for marketing; Tailwind utilities for admin)
- **Framer Motion** (section reveals, word-by-word headlines)
- **Lenis** smooth scroll (marketing only, guarded against auth-callback hashes)
- **Supabase JS** (`@supabase/supabase-js`, `@supabase/ssr` cookie-bridged for SSR/RSC)
- **Zod** for shared client/server validation
- **Resend** for transactional email (added in P1)
- **Google Calendar API** (service account) for booking in P5
- **sharp** (dev-only) for one-off image compositing in `scripts/compose-hero.mjs`

---

## 3. Live URLs / accounts

| What | Where |
|---|---|
| Production app (Vercel) | https://sadeem-agency.vercel.app |
| GitHub repo | https://github.com/a7medissmail/Sadeem-agency |
| Supabase project | Sadeem agency — region: Europe — DB region matches |
| Admin login | https://sadeem-agency.vercel.app/admin/login |
| First admin email | ahmed.issmail@gmail.com (role = `admin`) |

---

## 4. Local setup (5 min)

```bash
npm install
cp .env.example .env.local      # then paste real values (NEVER commit .env.local)
npm run dev                     # http://localhost:3000
```

`.env.local` values needed for P0/P1 (already known/wired):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL`

Vercel needs the same env vars under **Project → Settings → Environment Variables** (Production + Preview). Service-role key must be marked sensitive, **not** prefixed `NEXT_PUBLIC_`.

---

## 5. Current state (what works right now)

- ✅ Cinematic marketing one-pager — fully designed.
- ✅ `/admin/login` server-action sign-in (`signInWithPassword`).
- ✅ Middleware-protected `/admin/*`. Hash auth tokens no longer crash the marketing site.
- ✅ Admin shell: dark sidebar, role-aware nav, sign-out, dashboard live counts (Leads/Bookings/Active courses/Applications).
- ✅ Users CRUD (admin-only): invite via service-role, inline name/role edit, delete (self-protected).
- ✅ Full DB schema applied (`supabase/migrations/0001_init.sql`) with enums + RLS + auto-create-profile trigger.

**Not yet built**: lead form on homepage, CRM list/board, courses/team/careers/applications public + admin, booking UI + Google Calendar, marketing email campaigns.

---

## 6. Critical files

```
app/
  layout.tsx                     # minimal <html><body>, global fonts
  (marketing)/
    layout.tsx                   # wraps marketing in <SmoothScroll>
    page.tsx                     # the cinematic homepage
  admin/
    layout.tsx                   # admin metadata (no shell)
    login/
      page.tsx, LoginForm.tsx
      actions.ts                 # loginAction + signOutAction (server actions)
    (authed)/
      layout.tsx                 # requireUser() + sidebar
      page.tsx                   # dashboard tiles
      users/
        page.tsx, InviteForm.tsx, actions.ts

lib/
  supabase/
    server.ts                    # cookie-bound RSC client
    client.ts                    # browser anon client
    admin.ts                     # service-role server-only client
    middleware.ts                # session refresh + /admin gating
  auth.ts                        # getCurrentUser / getCurrentProfile / requireUser / requireRole
  validation/
    user.ts, lead.ts             # zod schemas

middleware.ts                    # entry — delegates to lib/supabase/middleware.ts
types/database.ts                # hand-written Supabase Database type
supabase/migrations/0001_init.sql

components/                      # the cinematic marketing sections + helpers
scripts/compose-hero.mjs         # bakes the figure into hero & CTA images via sharp
public/hero/*.webp               # optimized photo assets

global.d.ts                      # ambient (window.lenis, *.css)
tsconfig.json                    # strict, allowJs, paths "@/*"
tailwind.config.js               # content: js/jsx/ts/tsx for app + components
next.config.mjs                  # reactStrictMode: false, AVIF/WebP image formats
SETUP.md                         # one-time provisioning guide
HANDOFF.md                       # this file
```

---

## 7. Conventions

- **TypeScript everywhere.** New files are `.ts` / `.tsx`. `strict: true`.
- **Forms** = `react-hook-form` (when interactive) or plain `<form action={serverAction}>` (admin tables).
- **Validation** = zod schemas under `lib/validation/`, used by both client and server actions.
- **DB access** = server-side only. Public reads via the cookie-bound `createSupabaseServerClient`; privileged writes via `getSupabaseAdmin()` (service role) inside server actions / route handlers. Never expose the service role to the browser.
- **RLS is the source of truth**, not Next middleware. Middleware only handles session refresh and admin route gating.
- **Role helpers** — `requireUser()` (any signed-in), `requireRole(['admin'])`. Profiles row is auto-created by a trigger; the bootstrap admin is set with raw SQL.
- **Cinematic site untouched** by app-shell concerns. Marketing layout is the only place Lenis runs.
- **Admin UI** — dark theme (`#0d0e10` / `#f5f3f0` / accent `#ff6a00`). Building a reusable primitives library (button, input, select, table, badge, dialog, toast) as we go. Currently inline Tailwind — will be extracted under `components/admin/ui/` in P1.

---

## 8. Important warnings

- 🔒 **`.env.local` is the ONLY place for real keys.** `.env.example` is the template — only placeholders, ever. `.env.local` is gitignored.
- 🔒 **`SUPABASE_SERVICE_ROLE_KEY` is god-mode.** Don't prefix `NEXT_PUBLIC_`. Never log it. Never embed in a client component.
- 🔒 **Supabase URL Configuration** (Auth → URL Configuration) — Site URL = Vercel URL, Redirect URLs include both Vercel and localhost so invites/recovery emails land correctly.
- ⚠️ **Don't use Supabase invite flow** to bootstrap the first admin. Use **Add user → Create new user with Auto Confirm**, then update profile role via SQL.

---

## 9. Phased roadmap

| Phase | Scope | Status |
|---|---|---|
| **P0** | TS migration, Supabase wiring, auth, admin shell, Users CRUD | ✅ Done |
| **P1** | Homepage lead form, CRM list/board, Resend transactional email | ✅ Done |
| **P2** | Courses/Workshops (public + admin toggle/CRUD + image upload) | ✅ Done |
| **P3** | Team page + admin CRUD + photo upload | Planned |
| **P4** | Careers + applications (resume upload, pipeline) | Planned |
| **P5** | Consultation booking (custom UI + Google Calendar API) | Planned |
| **P6** | Marketing email campaigns to CRM | Planned |

Each phase ends in a working deployable state. See the full plan: `C:\Users\ahmed\.claude\plans\ok-now-lets-plan-flickering-lampson.md`.

---

## 10. Update log

### [2026-05-23] P0 — Foundation ✅

**TypeScript migration**
- Installed `typescript@^5.4`, `@types/{react,react-dom,node}@^18/^20`, configured `tsconfig.json` (`strict: true`, `allowJs`, path alias `@/*`, `plugins: [next]`).
- Renamed every `app/**/*.jsx` and `components/**/*.jsx` to `.tsx`, added prop types where needed, fixed `motion[as]` indexing in `RevealSection`.
- Removed `jsconfig.json`; added `global.d.ts` for ambient `window.lenis` + CSS imports.
- Deleted unused `components/scenes/ClosingScene.tsx` (FinalCTA now uses a photo, not SVG).
- `npx tsc --noEmit` clean.

**Supabase scaffold**
- Installed `@supabase/supabase-js`, `@supabase/ssr`, `zod`.
- Created `lib/supabase/{server,client,admin,middleware}.ts`. Service-role client is `server-only` and only reads env at call time.
- Root `middleware.ts` refreshes session and redirects unauthenticated `/admin/*` to `/admin/login` (with `?next=`); already-signed-in users hitting `/admin/login` get bounced to `/admin`. Marketing site continues to render even when env vars are absent (graceful guard).

**Database**
- `supabase/migrations/0001_init.sql` — full schema for P0..P6: profiles, courses, leads, lead_activities, bookings, availability_rules, team_members, jobs, applications, email_campaigns, email_sends.
- Enums for roles, statuses, types. RLS enabled on every table.
- Helper functions `public.is_admin`, `public.is_staff` (SECURITY DEFINER, stable, search_path locked) to avoid RLS recursion.
- Auto-create-profile trigger on `auth.users` insert.
- Policies: public **insert-only** on leads/bookings/applications; staff `select/insert/update/delete` on everything; `courses`/`team_members`/`jobs` public **select only when** active/open.

**Auth / admin shell / Users CRUD**
- Marketing pages moved into `app/(marketing)/` route group so Lenis + reveal context only wrap them. Admin is outside the group.
- `app/admin/(authed)/layout.tsx` calls `requireUser()` → renders dark sidebar with role-aware nav, profile chip, sign-out form.
- Dashboard reads 4 live counts (with a fallback notice if Supabase env is missing).
- Users page (admin-only via `requireRole(['admin'])`):
  - **Invite** — uses `supabase.auth.admin.inviteUserByEmail` + updates the auto-created profile with name/role.
  - **Inline edit** — name + role per row (your own row's role select is disabled to prevent self-lockout).
  - **Delete** — `supabase.auth.admin.deleteUser`; self-delete guarded.

**Docs / artefacts**
- `SETUP.md` — one-time provisioning walkthrough.
- `.env.example` — placeholder template for all phases (Supabase / Resend / Google / app URL).
- `.gitignore` extended (`.env.local`, `.claude/settings.local.json`, `.preview-tmp/`, dev-server logs).

**Commit:** `3ca2888` — *P0 foundation: TypeScript, Supabase, auth, admin shell, user CRUD*

---

### [2026-05-23] P1 — Leads + CRM + transactional email ✅

**Admin UI primitives** under `components/admin/ui/`:
- `Button` (primary / outline / ghost / danger, two sizes), `Field` (Input/Select/Textarea + Label + FieldRow), `Badge` (7 tones), `PageHeader`, `Table` (TableShell / TableHeader / TableRow / EmptyState). All dark-themed, brand-tight. Used by the new Leads page and going forward.

**Email**
- Installed `resend`. `lib/email/resend.ts` exposes `sendEmail` and **gracefully no-ops** when `RESEND_API_KEY` / `EMAIL_FROM` are missing, so the lead row still saves.
- `lib/email/templates.ts` — inline-styled HTML templates: `leadConfirmation(name)` (to the visitor) and `leadNotification({...})` (to `TEAM_NOTIFY_TO`). Survives Gmail / Outlook rendering.

**Public lead capture**
- `lib/actions/leads.ts` — `submitLeadAction` server action: zod validate, honeypot guard (`website` field must be empty), insert via cookie-bound server client (RLS `leads_public_insert` allows it), fire both emails best-effort with `Promise.allSettled`.
- `components/LeadForm.tsx` — reusable client form. `useFormState` for UX, success view, error message, hidden `source` prop so the same component works on the homepage today and courses/consultation in future phases.
- `components/ContactSection.tsx` — new light-themed section (between FinalCTA and Footer) with the cinematic design language: editorial vertical label, eyebrow + headline + body + email/office meta on the left, LeadForm on the right. Soft warm gradient + faint accent radials.
- Re-targeted the FinalCTA's `LET'S TALK` link → `#contact` (the new ContactSection now owns the `#contact` anchor). The navbar Contact link works end-to-end.

**Admin CRM**
- `/admin/leads` — server-rendered list with filters (status + source via search params), inline status badge + change dropdown, owner assignment (from staff profiles), delete (admin-only), expandable message preview. Empty state. Uses the new primitives end-to-end.
- `app/admin/(authed)/leads/actions.ts` — `updateLeadStatusAction`, `assignLeadOwnerAction`, `deleteLeadAction`. All gated by `requireRole`; `delete` is admin-only.
- Removed `soon` flag from the Leads nav item; sidebar now exposes Leads as a live route.

**Env additions for Vercel** (and `.env.local`) when you're ready to send emails:
- `RESEND_API_KEY` (server-only, sensitive)
- `EMAIL_FROM="SADEEM <hello@yourdomain.com>"` — must be a verified Resend sender
- `TEAM_NOTIFY_TO=team@yourdomain.com`

Without these, the form still works: rows save, emails are skipped with a warn log.

**Files added**
- `components/admin/ui/{Button,Field,Badge,PageHeader,Table}.tsx`
- `components/LeadForm.tsx`, `components/ContactSection.tsx`
- `lib/email/{resend,templates}.ts`
- `lib/actions/leads.ts`
- `app/admin/(authed)/leads/{page.tsx,actions.ts}`

---

### [2026-05-23] P2 — Courses / Workshops ✅

**Storage**
- `supabase/migrations/0004_storage.sql` — creates the public `course-images` bucket with policies (public select; staff insert/update/delete via `is_staff`). Uploads from server actions go through the service-role client so RLS is bypassed safely.

**Validation**
- `lib/validation/course.ts` — zod schema covering title/slug/summary/body/location/dates/capacity/price/image_url/is_active, with `optionalString/optionalNumber/optionalIsoDate` coercers and a `slugify(title)` helper.

**Admin CRUD** (`app/admin/(authed)/courses/`)
- `page.tsx` — list with title + slug, location, starts date, capacity, status badge (`Live` / `Off`), inline **on/off toggle**, delete (admin-only). Uses the P1 primitives + a fixed-column grid that matches the leads page pattern.
- `new/page.tsx` + `[id]/page.tsx` — both wrap one `CourseForm` client component with `mode="create"` or `mode="edit"`.
- `CourseForm.tsx` — full form: title with auto-slug, slug override, summary/body, location, capacity, starts/ends (`datetime-local`), price, active checkbox, **image upload** (PNG/JPG/WebP, < 5 MB) with current-image hint when editing. Submits via server action, redirects back to the list on success.
- `actions.ts` — `createCourseAction`, `updateCourseAction`, `toggleCourseActiveAction`, `deleteCourseAction`. Uploads route through `getSupabaseAdmin().storage.from('course-images')` and store the resulting public URL on the row.
- Removed `soon` from the Courses sidebar item.

**Public**
- `app/(marketing)/courses/page.tsx` — cinematic listing: hero header ("Sharpen the operating system."), responsive card grid (cover image + location/date meta + title + summary + "View details →"), graceful empty state that links to `/#contact`.
- `app/(marketing)/courses/[slug]/page.tsx` — detail page: two-column hero (copy + cover), meta list (when / where / cohort / investment), body paragraphs, then a "Register interest" section reusing `<LeadForm source="course" />` so submissions land in the CRM tagged as the course channel.
- New CSS block under `/* ========== COURSES (public) ========== */` in `globals.css`: hero, card grid, course-card hover lift, detail two-column, meta list, etc. Responsive at ≤1100.

**Marketing nav update**
- Replaced the dead `#industries` / `#insights` items with **Workshops → /courses**. All anchors now use `/#…` so they work from any route.
- `LET'S TALK` CTA now points to `/#contact` (cross-route safe).

**Files added**
- `supabase/migrations/0004_storage.sql`
- `lib/validation/course.ts`
- `app/admin/(authed)/courses/{page,CourseForm,actions}.tsx, /new/page.tsx, /[id]/page.tsx`
- `app/(marketing)/courses/{page,[slug]/page}.tsx`

**One-time provisioning**
- Run `0004_storage.sql` in the Supabase SQL Editor (creates the bucket + policies).

---

### [2026-05-23] Post-P1 fixes

- **`supabase/migrations/0002_grants.sql`** — added explicit GRANTs on `public.*` for `anon` + `authenticated` (plus default privileges on future tables). Without this, the project's "Automatically expose new tables" being disabled meant RLS policies were correct but the role had no table-level privilege → lead inserts and profile reads silently failed (form said "Could not save", admin pages ping-ponged through the login redirect).

---

### [2026-05-23] Post-P0 fixes

- **Tailwind content paths** (`f29b458`) — added `ts`/`tsx` so admin utilities actually generate. Without this the admin page rendered as bare HTML on Vercel.
- **SmoothScroll hash guard** (`66dc345`) — Supabase auth callbacks append `#access_token=…&type=invite`. The old code passed that to `lenis.scrollTo()` → `querySelector` SyntaxError. Now only honoured when the hash matches `/^#[A-Za-z][\w-]*$/` and the element exists.
- **`.env.example` scrubbed** (working tree only, never pushed) — real Supabase keys were briefly pasted in; reverted to placeholders, real values moved to `.env.local`. **No leak occurred.**
- **First admin bootstrapped** via Supabase **Add user → Create new user (Auto Confirm)** + SQL `update public.profiles set role='admin' …`. Login confirmed on the deployed URL.

---

## 11. Open / parked items

- **Slide-1 faint foreground wisp** in front of the figure for extra depth (backlog).
- **Industries / Insights** marketing routes — nav links currently point to `#industries` / `#insights` which don't exist yet. Decide content + route or remove links.
- **Stale `.next/types/app/page.ts`** may need clearing once after the marketing route group move; `tsc` is clean now.
- **Admin UI primitives** to extract from inline Tailwind into `components/admin/ui/` during P1.
