import { test, expect } from '@playwright/test';

/**
 * Example E2E test
 * This is a basic example to verify Playwright setup is working
 */
test.describe('Example E2E Test', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Add your assertions here
    expect(page).toBeTruthy();
  });
});
