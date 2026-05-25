# E2E smoke tests

Playwright smoke tests covering the highest-value flows. They don't write
production data — admin tests stop at the login screen, lead-form test fills
the inputs but **does not submit**, courses/careers tests only check the page
responds successfully.

## Run locally

```bash
# 1. Make sure the dev server is running on http://localhost:3000
npm run dev

# 2. In another terminal, the first time only — install the browser binary
npx playwright install chromium

# 3. Run
npm run test:e2e          # headless
npm run test:e2e:ui       # interactive UI mode
```

## Run against the deployment

```bash
PLAYWRIGHT_BASE_URL=https://sadeem-agency.vercel.app npm run test:e2e
```

## What's covered

| File | Test | What it checks |
|---|---|---|
| `marketing.spec.ts` | homepage hero | `/` returns 200, title contains SADEEM, hero section + headline visible |
| `marketing.spec.ts` | contact form | `#contact` anchor works, lead form has name + email inputs and can be filled |
| `marketing.spec.ts` | /courses | Workshops index loads + heading is visible |
| `marketing.spec.ts` | /careers | Careers index loads with status < 400 |
| `admin.spec.ts` | gate | Unauthenticated `/admin` redirects to `/admin/login` |
| `admin.spec.ts` | login form | Email + password inputs and sign-in button render |

## Adding new tests

- Keep tests **read-only** by default. If a test must write (e.g. full admin flow),
  use a recognisable test email like `playwright-<flow>@example.invalid` so rows
  are easy to find and delete.
- The base URL is configured by `PLAYWRIGHT_BASE_URL` (defaults to
  `http://localhost:3000`). Don't hard-code URLs in tests — use relative paths.
