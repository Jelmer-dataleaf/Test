import { test, expect } from '@playwright/test';

test.describe('Dashboard routing and navigation', () => {
  test('redirects root path to dashboard and renders dashboard content', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('app-header')).toBeVisible();
    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText("Welcome back. Here's what's going on.")).toBeVisible();
  });

  test('shows dashboard nav link and allows navigation to dashboard from another page', async ({ page }) => {
    await page.goto('/tasks');
    await page.waitForTimeout(500);

    await expect(page.getByTestId('nav-dashboard')).toBeVisible();
    await page.getByTestId('nav-dashboard').click();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });

  test('dashboard nav link is active on dashboard route and not active on tasks route', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    await expect(page.getByTestId('nav-dashboard')).toHaveClass(/active/);
    await expect(page.getByTestId('nav-tasks')).not.toHaveClass(/active/);

    await page.getByTestId('nav-tasks').click();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/tasks$/);
    await expect(page.getByTestId('nav-dashboard')).not.toHaveClass(/active/);
    await expect(page.getByTestId('nav-tasks')).toHaveClass(/active/);
  });
});

test.describe('Dashboard page content', () => {
  test('renders all stat cards with expected values, units, and labels', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    await expect(page.getByTestId('stats-grid')).toBeVisible();

    const expectedCards = [
      { testId: 'stat-tasks', value: '12', unit: 'open', label: 'Tasks' },
      { testId: 'stat-feedback', value: '5', unit: 'responses', label: 'Feedback' },
      { testId: 'stat-newsletter', value: '38', unit: 'subscribers', label: 'Newsletter' },
      { testId: 'stat-users', value: '7', unit: 'registered', label: 'Users' },
    ];

    for (const card of expectedCards) {
      const locator = page.getByTestId(card.testId);
      await expect(locator).toBeVisible();
      await expect(locator).toContainText(card.value);
      await expect(locator).toContainText(card.unit);
      await expect(locator).toContainText(card.label);
    }

    await expect(page.locator('[data-testid^="stat-"]')).toHaveCount(4);
  });

  test('renders quick action links with expected labels', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    await expect(page.getByTestId('quick-links')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Quick actions' })).toBeVisible();

    await expect(page.getByTestId('link-contact')).toHaveText('+ New message');
    await expect(page.getByTestId('link-feedback')).toHaveText('+ Give feedback');
    await expect(page.getByTestId('link-newsletter')).toHaveText('+ Subscribe');
    await expect(page.getByTestId('link-register')).toHaveText('+ Register');
  });

  test('does not render unexpected extra stat cards or quick links', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    await expect(page.locator('[data-testid^="stat-"]')).toHaveCount(4);
    await expect(page.locator('[data-testid^="link-"]')).toHaveCount(4);
    await expect(page.getByTestId('stat-unknown')).toHaveCount(0);
    await expect(page.getByTestId('link-unknown')).toHaveCount(0);
  });
});

test.describe('Dashboard link behavior', () => {
  test('stat cards navigate to their target routes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    const routes = [
      { testId: 'stat-tasks', url: /\/tasks$/ },
      { testId: 'stat-feedback', url: /\/feedback$/ },
      { testId: 'stat-newsletter', url: /\/newsletter$/ },
      { testId: 'stat-users', url: /\/register$/ },
    ];

    for (const route of routes) {
      await page.goto('/dashboard');
      await page.waitForTimeout(500);
      await page.getByTestId(route.testId).click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(route.url);
    }
  });

  test('quick action links navigate to their target routes', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    const routes = [
      { testId: 'link-contact', url: /\/contact$/ },
      { testId: 'link-feedback', url: /\/feedback$/ },
      { testId: 'link-newsletter', url: /\/newsletter$/ },
      { testId: 'link-register', url: /\/register$/ },
    ];

    for (const route of routes) {
      await page.goto('/dashboard');
      await page.waitForTimeout(500);
      await page.getByTestId(route.testId).click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(route.url);
    }
  });

  test('dashboard page remains usable after direct navigation to dashboard route', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(500);

    await expect(page.getByTestId('dashboard-page')).toBeVisible();
    await expect(page.getByTestId('stats-grid')).toBeVisible();
    await expect(page.getByTestId('quick-links')).toBeVisible();

    await page.getByTestId('stat-tasks').click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/tasks$/);

    await page.getByTestId('nav-dashboard').click();
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByTestId('dashboard-page')).toBeVisible();
  });
});