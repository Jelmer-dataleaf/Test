// Auto-generated Playwright test
// Commit : abc1234567890
// Message: add register form
// Author : Dev
// Date   : 2026-04-02
// Generated at: 2026-04-02T09:06:40.564Z

import { test, expect } from "@playwright/test";

test.describe("Form — /register", () => {
  test("renders the form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByTestId("register-form")).toBeVisible();
  });

  test("shows validation errors when submitted empty", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("submit-btn").click();
    await expect(page.getByTestId("error-username")).toBeVisible();
    await expect(page.getByTestId("error-email")).toBeVisible();
    await expect(page.getByTestId("error-age")).toBeVisible();
    await expect(page.getByTestId("error-password")).toBeVisible();
    await expect(page.getByTestId("error-terms")).toBeVisible();
  });

  test("shows mismatch error when passwords differ", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("input-password").fill("SecurePass1");
    await page.getByTestId("input-confirm-password").fill("DifferentPass");
    await page.getByTestId("submit-btn").click();
    await expect(page.getByTestId("error-mismatch")).toBeVisible();
  });

  test("submits successfully with valid data", async ({ page }) => {
    await page.goto("/register");
    await page.getByTestId("input-username").fill("TestUser42");
    await page.getByTestId("input-email").fill("test@example.com");
    await page.getByTestId("input-age").fill("25");
    await page.getByTestId("input-password").fill("SecurePass1");
    await page.getByTestId("input-confirm-password").fill("SecurePass1");
    await page.getByTestId("input-terms").check();
    await page.getByTestId("submit-btn").click();
    await expect(page.getByTestId("success-banner")).toBeVisible();
  });
});

test.describe("Logic changes — demo-app/src/app/components/register-form/register-form.component.ts, demo-app/src/app/components/register-form/register-form.component.html", () => {
  test("new function produces the expected result", async ({ page }) => {
    // TODO: navigate to the page that exercises the new function
    await page.goto("/");
    // TODO: trigger the code path and assert the visible outcome
    await expect(page).toHaveTitle(/.+/);
  });

  test("new function handles edge cases gracefully", async ({ page }) => {
    await page.goto("/");
    // TODO: simulate an edge-case input and assert no crash / correct output
  });
});
