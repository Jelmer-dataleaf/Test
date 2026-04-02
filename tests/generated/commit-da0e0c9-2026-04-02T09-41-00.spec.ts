import { test, expect } from "@playwright/test";

test.describe("App header navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForTimeout(500);
  });

  test("renders the app header, logo, and all navigation links including newsletter", async ({
    page,
  }) => {
    await expect(page.getByTestId("app-header")).toBeVisible();
    await expect(page.getByText("Task Manager")).toBeVisible();

    await expect(page.getByTestId("nav-tasks")).toBeVisible();
    await expect(page.getByTestId("nav-search")).toBeVisible();
    await expect(page.getByTestId("nav-contact")).toBeVisible();
    await expect(page.getByTestId("nav-meme")).toBeVisible();
    await expect(page.getByTestId("nav-register")).toBeVisible();
    await expect(page.getByTestId("nav-feedback")).toBeVisible();
    await expect(page.getByTestId("nav-newsletter")).toBeVisible();

    await expect(page.getByTestId("nav-tasks")).toHaveText("Tasks");
    await expect(page.getByTestId("nav-search")).toHaveText("Search");
    await expect(page.getByTestId("nav-contact")).toHaveText("Contact");
    await expect(page.getByTestId("nav-meme")).toHaveText("Meme");
    await expect(page.getByTestId("nav-register")).toHaveText("Register");
    await expect(page.getByTestId("nav-feedback")).toHaveText("Feedback");
    await expect(page.getByTestId("nav-newsletter")).toHaveText("Newsletter");
  });

  test("newsletter navigation link is accessible and points to the newsletter route", async ({
    page,
  }) => {
    const newsletterLink = page.getByTestId("nav-newsletter");

    await expect(newsletterLink).toBeVisible();
    await expect(newsletterLink).toHaveAttribute("href", /newsletter$/);
    await expect(newsletterLink).toHaveText("Newsletter");
  });

  test("navigates to newsletter page when newsletter link is clicked", async ({
    page,
  }) => {
    await page.getByTestId("nav-newsletter").click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/newsletter$/);
  });

  test("router outlet is present for route content rendering", async ({
    page,
  }) => {
    await expect(page.getByTestId("router-outlet")).toBeAttached();
  });

  test("newsletter link text is normalized despite multiline HTML formatting", async ({
    page,
  }) => {
    const newsletterLink = page.getByTestId("nav-newsletter");
    await expect(newsletterLink).toContainText("Newsletter");
    await expect(newsletterLink).not.toHaveText(/^\s*$/);
  });
});
