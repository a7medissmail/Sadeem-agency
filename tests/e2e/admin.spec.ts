import { test, expect } from "@playwright/test";

test.describe("Admin gate", () => {
  test("unauthenticated /admin redirects to /admin/login", async ({ page }) => {
    await page.goto("/admin");
    // After middleware, the URL must end at /admin/login (the `?next=` is fine).
    await expect(page).toHaveURL(/\/admin\/login(\?.*)?$/);
    await expect(page.getByText(/Sign in to continue/i)).toBeVisible();
  });

  test("login form renders with email + password fields", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });
});
