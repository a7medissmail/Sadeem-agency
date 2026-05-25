import { test, expect } from "@playwright/test";

test.describe("Marketing site", () => {
  test("homepage renders the cinematic hero", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SADEEM/i);
    // Hero headline contains one of the three slide texts. They cross-fade,
    // so we just check that some core hero copy appears.
    const hero = page.locator(".hero");
    await expect(hero).toBeVisible();
    await expect(page.getByText(/STRATEGIC|ENGINEERED|EXECUTION/i).first()).toBeVisible();
  });

  test("contact section is anchored and the lead form is interactive", async ({ page }) => {
    await page.goto("/#contact");
    // The form has name+email inputs and a submit button. We don't submit (so
    // we don't write a row); we only verify the UI is functional.
    await page.waitForSelector('form input[name="name"]');
    await page.fill('input[name="name"]', "Playwright Test");
    await page.fill('input[name="email"]', "playwright-noop@example.invalid");
    await expect(page.locator('input[name="name"]')).toHaveValue("Playwright Test");
  });

  test("/courses public listing loads (200 + cinematic header)", async ({ page }) => {
    const response = await page.goto("/courses");
    expect(response?.status()).toBeLessThan(400);
    // Either there are course cards or the empty-state copy is shown — both ok.
    await expect(page.getByRole("heading", { name: /Workshops|operating system|cohort/i }).first()).toBeVisible();
  });

  test("/careers public listing loads (200)", async ({ page }) => {
    const response = await page.goto("/careers");
    expect(response?.status()).toBeLessThan(400);
  });
});
