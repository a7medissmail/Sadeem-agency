import { test, expect, type Page } from "@playwright/test";

/**
 * Design-system regressions that only a real browser can catch.
 *
 * These exist because of a specific miss: `shadow-[var(--sdm-ring)]` compiled to
 * `--tw-shadow-color` rather than to a shadow, so every focus ring in the
 * components rendered nothing. Type checking could not see it, and the in-app
 * browser pane could not either — it reports `document.activeElement` correctly
 * but never matches `:focus`, so every computed-style reading of a focus state
 * came back empty whether the CSS was right or wrong.
 *
 * Playwright drives a real focused window, so `:focus-visible` resolves properly
 * and the ring is observable. Everything here runs unauthenticated against
 * /admin/login, which renders Button and the Field controls — the two primitives
 * the whole admin is built from.
 */

/** Resolved box-shadow, with the empty Tailwind placeholders stripped out. */
async function paintedShadow(page: Page, selector: string): Promise<string> {
  return page.$eval(selector, (el) =>
    getComputedStyle(el)
      .boxShadow.split(/,(?![^(]*\))/)
      .map((s) => s.trim())
      .filter((s) => s && !/^rgba\(0, 0, 0, 0\)/.test(s) && !/^oklab\(0 0 0 \/ 0\)/.test(s))
      .join(", "),
  );
}

test.describe("Design system — focus states", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/login");
  });

  test("tokens resolve on the admin shell", async ({ page }) => {
    const tokens = await page.$eval(".admin-root", (el) => {
      const cs = getComputedStyle(el);
      return {
        ring: cs.getPropertyValue("--sdm-ring").trim(),
        actionPrimary: cs.getPropertyValue("--sdm-action-primary").trim(),
        statusDanger: cs.getPropertyValue("--sdm-status-danger").trim(),
        controlMd: cs.getPropertyValue("--sdm-control-md").trim(),
      };
    });

    // status.danger is spelled status.error in the source spec; both must resolve,
    // or every .sdm-tone-danger surface silently falls back to currentColor.
    expect(tokens.statusDanger).toBe("#e0524a");
    expect(tokens.actionPrimary).toBe("#ff6a00");
    expect(tokens.controlMd).toBe("36px");
    expect(tokens.ring).toContain("0 0 0 4px");
  });

  test("keyboard focus paints a ring on a field", async ({ page }) => {
    const email = page.locator('input[name="email"]');
    // Bounded: an unbounded tab loop turns a focus regression into a CI hang.
    for (let i = 0; i < 12; i++) {
      if (await email.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }

    await expect(email).toBeFocused();

    // Retrying assertions on purpose: border-color and box-shadow both animate
    // over --sdm-motion-fast, so a single synchronous read catches the tween
    // partway and reports a fractional, half-transparent ring.
    await expect(email).toHaveCSS("border-color", "rgb(255, 133, 51)");

    // Matched on geometry, not colour: Chrome serialises a color-mix() result as
    // `color(srgb …)` rather than `rgb(…)`, and that spelling is not worth
    // pinning a test to. The 3 px spread is the field glow's signature.
    await expect
      .poll(() => paintedShadow(page, 'input[name="email"]'), {
        message: "field focus glow must actually paint",
      })
      .toMatch(/0px 0px 0px 3px/);
  });

  test("keyboard focus paints a ring on a button", async ({ page }) => {
    const submit = page.getByRole("button", { name: /sign in/i });

    // Tab until the submit button holds focus.
    for (let i = 0; i < 12; i++) {
      if (await submit.evaluate((el) => el === document.activeElement)) break;
      await page.keyboard.press("Tab");
    }
    await expect(submit).toBeFocused();

    // The assertion that would have failed before the shadow: type hint —
    // box-shadow resolved to none, so this string was empty.
    await expect
      .poll(() => paintedShadow(page, 'button[type="submit"]'), {
        message: "button focus ring must actually paint",
      })
      .toMatch(/rgb\(255,\s*133,\s*51\) 0px 0px 0px 4px/);
  });

  test("buttons and fields carry the system's geometry", async ({ page }) => {
    const submit = page.getByRole("button", { name: /sign in/i });
    await expect(submit).toHaveCSS("height", "44px");
    await expect(submit).toHaveCSS("border-radius", "6px");
    await expect(submit).toHaveCSS("text-transform", "none");
    await expect(submit).toHaveCSS("font-size", "13px");

    const email = page.locator('input[name="email"]');
    await expect(email).toHaveCSS("height", "36px");
    await expect(email).toHaveCSS("border-radius", "6px");
  });

  test("labels are sentence case, not the retired mono-uppercase style", async ({ page }) => {
    const label = page.locator(".sdm-form-label").first();
    await expect(label).toHaveCSS("text-transform", "none");
    await expect(label).toHaveCSS("letter-spacing", "normal");
    await expect(label).toHaveCSS("font-size", "12px");
  });

  test("Arabic collapses the tracked styles", async ({ page }) => {
    const probe = await page.evaluate(() => {
      const root = document.querySelector(".admin-root")!;
      const el = document.createElement("span");
      el.className = "sdm-eyebrow";
      el.lang = "ar";
      el.textContent = "اسم العميل";
      root.appendChild(el);
      const cs = getComputedStyle(el);
      const out = {
        family: cs.fontFamily,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
      };
      el.remove();
      return out;
    });

    expect(probe.family).toContain("IBM Plex Sans Arabic");
    expect(probe.letterSpacing).toBe("normal");
    expect(probe.textTransform).toBe("none");
  });

  test("no Tailwind shadow class is left compiled as a shadow colour", async ({ page }) => {
    const bad = await page.evaluate(async () => {
      const hrefs = [...document.querySelectorAll('link[rel="stylesheet"]')].map(
        (l) => (l as HTMLLinkElement).href,
      );
      let css = "";
      for (const h of hrefs) {
        try {
          css += await (await fetch(h)).text();
        } catch {
          /* ignore */
        }
      }
      return [...css.matchAll(/--tw-shadow-color: var\((--sdm-[a-z-]+|--admin-shadow)\)/g)].map(
        (m) => m[1],
      );
    });

    expect(bad, "arbitrary var() shadows need the shadow: type hint").toEqual([]);
  });
});
