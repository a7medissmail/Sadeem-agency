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
| `design-system.spec.ts` | tokens | The --sdm-* layer resolves on .admin-root (incl. status.danger, which the spec spells status.error) |
| `design-system.spec.ts` | focus rings | Real keyboard Tab paints a ring on a button and a glow on a field |
| `design-system.spec.ts` | geometry | Button 44px / field 36px / radius 6, sentence-case labels |
| `design-system.spec.ts` | Arabic | :lang(ar) drops tracking and uppercase and switches to Plex Arabic |
| `design-system.spec.ts` | shadow classes | No arbitrary var() shadow is compiled as a shadow *colour* |

## Adding new tests

- Keep tests **read-only** by default. If a test must write (e.g. full admin flow),
  use a recognisable test email like `playwright-<flow>@example.invalid` so rows
  are easy to find and delete.
- The base URL is configured by `PLAYWRIGHT_BASE_URL` (defaults to
  `http://localhost:3000`). Don't hard-code URLs in tests — use relative paths.

## Why `design-system.spec.ts` exists

`shadow-[var(--sdm-ring)]` compiled to `--tw-shadow-color` instead of to a
shadow, so every focus ring in the components rendered nothing. Type checking
could not see it, and neither could the in-app browser pane: that pane reports
`document.activeElement` correctly but never matches `:focus`, so a
computed-style reading of a focus state comes back empty whether the CSS is
right or wrong.

A real focused browser window is the only thing that can tell the difference.
These tests are cheap and they run unauthenticated, so keep them passing.

**One gotcha with the shadow-class test.** It reads the stylesheets the page
actually links, which is the right thing to assert — but `next dev` keeps
serving older CSS chunks after an edit, so the test can fail on a rule you have
already fixed. If it fails and the source looks correct, `rm -rf .next` and
restart the dev server before believing it.
