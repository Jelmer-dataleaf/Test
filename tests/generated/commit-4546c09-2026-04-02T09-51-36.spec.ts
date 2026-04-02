import { test, expect } from '@playwright/test';

test.describe('Login form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('renders login route from navigation and shows form fields', async ({ page }) => {
    // Happy path: navigation exposes the new login page and core form UI
    await page.goto('/');
    await page.getByTestId('nav-login').click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-page')).toBeVisible();
    await expect(page.getByText('Sign In')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('input-username')).toBeVisible();
    await expect(page.getByTestId('input-password')).toBeVisible();
    await expect(page.getByTestId('input-remember-me')).toBeVisible();
    await expect(page.getByTestId('toggle-password')).toHaveText('Show');
    await expect(page.getByTestId('submit-btn')).toHaveText('Sign In');
  });

  test('shows validation errors when submitting empty form', async ({ page }) => {
    // Error state: required validation appears after invalid submit
    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('error-username')).toBeVisible();
    await expect(page.getByTestId('error-username')).toContainText('Username is required.');
    await expect(page.getByTestId('error-password')).toBeVisible();
    await expect(page.getByTestId('error-password')).toContainText('Password is required.');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('success-banner')).toHaveCount(0);
  });

  test('shows minlength validation for short username and password', async ({ page }) => {
    // Edge case: minlength messages are shown for too-short credentials
    await page.getByTestId('input-username').fill('ab');
    await page.getByTestId('input-password').fill('12345');
    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('error-username')).toBeVisible();
    await expect(page.getByTestId('error-username')).toContainText('At least 3 characters.');
    await expect(page.getByTestId('error-password')).toBeVisible();
    await expect(page.getByTestId('error-password')).toContainText('At least 6 characters.');
    await expect(page.getByTestId('success-banner')).toHaveCount(0);
  });

  test('toggles password visibility and button label', async ({ page }) => {
    // Edge case: password visibility toggle switches input type and text
    const passwordInput = page.getByTestId('input-password');
    const toggleButton = page.getByTestId('toggle-password');

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleButton).toHaveText('Show');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await expect(toggleButton).toHaveText('Hide');

    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await expect(toggleButton).toHaveText('Show');
  });

  test('submits successfully with valid credentials and remember me checked', async ({ page }) => {
    // Happy path: valid form submission shows success state and hides form
    await page.getByTestId('input-username').fill('validuser');
    await page.getByTestId('input-password').fill('secret1');
    await page.getByTestId('input-remember-me').check();
    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('success-banner')).toBeVisible();
    await expect(page.getByTestId('success-banner')).toContainText('Welcome back! You are now logged in.');
    await expect(page.getByTestId('reset-btn')).toBeVisible();
    await expect(page.getByTestId('login-form')).toHaveCount(0);
  });

  test('sign out resets the form state after successful login', async ({ page }) => {
    // Happy path: reset returns from success banner to clean login form
    await page.getByTestId('input-username').fill('validuser');
    await page.getByTestId('input-password').fill('secret1');
    await page.getByTestId('toggle-password').click();
    await page.getByTestId('submit-btn').click();

    await expect(page.getByTestId('success-banner')).toBeVisible();

    await page.getByTestId('reset-btn').click();

    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('success-banner')).toHaveCount(0);
    await expect(page.getByTestId('input-username')).toHaveValue('');
    await expect(page.getByTestId('input-password')).toHaveValue('');
    await expect(page.getByTestId('input-password')).toHaveAttribute('type', 'password');
    await expect(page.getByTestId('toggle-password')).toHaveText('Show');
    await expect(page.getByTestId('input-remember-me')).not.toBeChecked();
  });

  test('allows direct routing to /login', async ({ page }) => {
    // Happy path: route is registered and accessible directly
    await page.goto('/login');

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-page')).toBeVisible();
    await expect(page.getByTestId('login-form')).toBeVisible();
  });
});