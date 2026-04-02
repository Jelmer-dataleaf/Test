import { test, expect } from '@playwright/test';

test.describe('Profile form', () => {
  test('should navigate to profile page from nav and render the form', async ({ page }) => {
    // happy path: navigation to the new profile route
    await page.goto('/');
    await page.waitForTimeout(500);

    await page.getByTestId('nav-profile').click();
    await page.waitForTimeout(500);

    await expect(page).toHaveURL(/\/profile$/);
    await expect(page.getByTestId('profile-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Edit Profile' })).toBeVisible();
    await expect(page.getByTestId('profile-form')).toBeVisible();
    await expect(page.getByTestId('input-firstName')).toBeVisible();
    await expect(page.getByTestId('input-lastName')).toBeVisible();
    await expect(page.getByTestId('input-email')).toBeVisible();
    await expect(page.getByTestId('input-phone')).toBeVisible();
    await expect(page.getByTestId('input-birthDate')).toBeVisible();
    await expect(page.getByTestId('input-role')).toBeVisible();
  });

  test('should show required validation errors when submitting an empty form', async ({ page }) => {
    // error state: empty submission should surface required field errors
    await page.goto('/profile');
    await page.waitForTimeout(500);

    await page.getByTestId('profile-form').getByRole('button', { name: /save|submit/i }).click().catch(async () => {
      await page.getByRole('button').last().click();
    });
    await page.waitForTimeout(500);

    await expect(page.getByTestId('error-firstName')).toContainText('First name is required.');
    await expect(page.getByTestId('error-lastName')).toContainText('Last name is required.');
    await expect(page.getByTestId('error-email')).toContainText('Email is required.');
    await expect(page.getByTestId('error-phone')).toContainText('Phone number is required.');
    await expect(page.getByTestId('error-birthDate')).toContainText('Date of birth is required.');
    await expect(page.getByTestId('error-role')).toContainText('Please select a role.');
    await expect(page.getByTestId('profile-form')).toBeVisible();
    await expect(page.getByTestId('success-banner')).toHaveCount(0);
  });

  test('should validate invalid field formats and boundary conditions', async ({ page }) => {
    // edge cases: invalid lengths, whitespace-only, bad email and phone formats
    await page.goto('/profile');
    await page.waitForTimeout(500);

    await page.getByTestId('input-firstName').fill(' ');
    await page.waitForTimeout(500);
    await page.getByTestId('input-lastName').fill('A');
    await page.waitForTimeout(500);
    await page.getByTestId('input-email').fill('not-an-email');
    await page.waitForTimeout(500);
    await page.getByTestId('input-phone').fill('abc');
    await page.waitForTimeout(500);
    await page.getByTestId('input-birthDate').fill('1990-01-01');
    await page.waitForTimeout(500);
    await page.getByTestId('input-role').selectOption('developer');
    await page.waitForTimeout(500);

    await page.getByTestId('input-firstName').click();
    await page.waitForTimeout(500);
    await page.getByTestId('input-lastName').click();
    await page.waitForTimeout(500);
    await page.getByTestId('input-email').click();
    await page.waitForTimeout(500);
    await page.getByTestId('input-phone').click();
    await page.waitForTimeout(500);

    await page.getByTestId('profile-form').getByRole('button', { name: /save|submit/i }).click().catch(async () => {
      await page.getByRole('button').last().click();
    });
    await page.waitForTimeout(500);

    await expect(page.getByTestId('error-firstName')).toContainText(/At least 2 characters\.|Cannot be only spaces\./);
    await expect(page.getByTestId('error-lastName')).toContainText('At least 2 characters.');
    await expect(page.getByTestId('error-email')).toContainText('Enter a valid email address.');
    await expect(page.getByTestId('error-phone')).toContainText('Enter a valid phone number.');
    await expect(page.getByTestId('success-banner')).toHaveCount(0);
  });

  test('should submit successfully with valid profile data and allow reset', async ({ page }) => {
    // happy path: valid submission shows success banner and reset returns to form
    await page.goto('/profile');
    await page.waitForTimeout(500);

    await page.getByTestId('input-firstName').fill('Jane');
    await page.waitForTimeout(500);
    await page.getByTestId('input-lastName').fill('Doe');
    await page.waitForTimeout(500);
    await page.getByTestId('input-email').fill('jane@example.com');
    await page.waitForTimeout(500);
    await page.getByTestId('input-phone').fill('+31 6 12345678');
    await page.waitForTimeout(500);
    await page.getByTestId('input-birthDate').fill('1992-05-14');
    await page.waitForTimeout(500);
    await page.getByTestId('input-role').selectOption('qa');
    await page.waitForTimeout(500);

    const bio = page.getByTestId('input-bio');
    if (await bio.count()) {
      await bio.fill('Experienced QA engineer focused on automation.');
      await page.waitForTimeout(500);
    }

    const website = page.getByTestId('input-website');
    if (await website.count()) {
      await website.fill('https://example.com');
      await page.waitForTimeout(500);
    }

    await page.getByTestId('profile-form').getByRole('button', { name: /save|submit/i }).click().catch(async () => {
      await page.getByRole('button').last().click();
    });
    await page.waitForTimeout(500);

    await expect(page.getByTestId('success-banner')).toBeVisible();
    await expect(page.getByTestId('success-banner')).toContainText('Profile saved successfully!');
    await expect(page.getByTestId('profile-form')).toHaveCount(0);

    await page.getByTestId('reset-btn').click();
    await page.waitForTimeout(500);

    await expect(page.getByTestId('profile-form')).toBeVisible();
    await expect(page.getByTestId('success-banner')).toHaveCount(0);
  });

  test('should keep optional website invalid when malformed if field exists', async ({ page }) => {
    // error state: optional website should reject malformed URL while other required fields are valid
    await page.goto('/profile');
    await page.waitForTimeout(500);

    await page.getByTestId('input-firstName').fill('John');
    await page.waitForTimeout(500);
    await page.getByTestId('input-lastName').fill('Smith');
    await page.waitForTimeout(500);
    await page.getByTestId('input-email').fill('john.smith@example.com');
    await page.waitForTimeout(500);
    await page.getByTestId('input-phone').fill('+1 555 123 4567');
    await page.waitForTimeout(500);
    await page.getByTestId('input-birthDate').fill('1988-11-20');
    await page.waitForTimeout(500);
    await page.getByTestId('input-role').selectOption('manager');
    await page.waitForTimeout(500);

    const website = page.getByTestId('input-website');
    if (await website.count()) {
      await website.fill('not-a-url');
      await page.waitForTimeout(500);

      await page.getByTestId('profile-form').getByRole('button', { name: /save|submit/i }).click().catch(async () => {
        await page.getByRole('button').last().click();
      });
      await page.waitForTimeout(500);

      const websiteError = page.getByTestId('error-website');
      if (await websiteError.count()) {
        await expect(websiteError).toBeVisible();
      }
      await expect(page.getByTestId('success-banner')).toHaveCount(0);
    }
  });
});