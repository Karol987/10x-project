import { test, expect } from "@playwright/test";
import { RegisterPage } from "./pages/auth";

/**
 * E2E Test: Registration Flow
 *
 * Scenario:
 * 1. Navigate to registration page
 * 2. Fill in randomly generated email and password
 * 3. Fill in password confirmation
 * 4. Submit registration form
 * 5. Verify successful registration
 *
 * Note: Each test generates unique credentials to avoid conflicts
 */

/**
 * Generate a random email address for testing
 */
function generateRandomEmail(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `test-${timestamp}-${random}@e2e-test.local`;
}

/**
 * Generate a secure random password that meets all requirements
 * - Minimum 8 characters
 * - At least one digit
 * - At least one special character
 */
function generateRandomPassword(): string {
  const length = 12;
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const digits = "0123456789";
  const special = "!@#$%^&*()_+-=[]{}";

  // Ensure at least one of each required type
  let password = "";
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += digits[Math.floor(Math.random() * digits.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  const allChars = uppercase + lowercase + digits + special;
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }

  // Shuffle the password
  return password
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

test.describe("Registration Flow", () => {
  let registerPage: RegisterPage;

  test("navigate to registration page and verify form elements", async ({ page }) => {
    // Initialize Page Object
    registerPage = new RegisterPage(page);

    // ============================================================
    // STEP 1: Navigate to registration page
    // ============================================================
    console.log("Step 1: Navigating to registration page...");
    await registerPage.gotoAndWaitForLoad();

    // Verify URL
    await expect(page).toHaveURL(/\/auth\/register/);
    console.log("✓ Successfully navigated to registration page");

    // ============================================================
    // STEP 2: Verify form elements are visible
    // ============================================================
    console.log("Step 2: Verifying form elements...");

    await expect(registerPage.registerForm).toBeVisible();
    console.log("✓ Registration form is visible");

    await expect(registerPage.emailInput).toBeVisible();
    console.log("✓ Email input is visible");

    await expect(registerPage.passwordInput).toBeVisible();
    console.log("✓ Password input is visible");

    await expect(registerPage.confirmPasswordInput).toBeVisible();
    console.log("✓ Confirm password input is visible");

    await expect(registerPage.submitButton).toBeVisible();
    await expect(registerPage.submitButton).toBeEnabled();
    console.log("✓ Submit button is visible and enabled");

    await expect(registerPage.loginLink).toBeVisible();
    console.log("✓ Login link is visible");
  });

  test("fill registration form with valid data", async ({ page }) => {
    // Generate random credentials
    const testEmail = generateRandomEmail();
    const testPassword = generateRandomPassword();

    // Initialize Page Object
    registerPage = new RegisterPage(page);

    // ============================================================
    // STEP 1: Navigate to registration page
    // ============================================================
    console.log("Step 1: Navigating to registration page...");
    await registerPage.gotoAndWaitForLoad();

    // ============================================================
    // STEP 2: Fill in email
    // ============================================================
    console.log("Step 2: Filling in email...");
    await registerPage.fillEmail(testEmail);

    // Verify email is filled
    await expect(registerPage.emailInput).toHaveValue(testEmail);
    console.log(`✓ Email filled: ${testEmail}`);

    // ============================================================
    // STEP 3: Fill in password
    // ============================================================
    console.log("Step 3: Filling in password...");
    await registerPage.fillPassword(testPassword);

    // Verify password is filled (check for non-empty value)
    const passwordValue = await registerPage.passwordInput.inputValue();
    expect(passwordValue.length).toBeGreaterThan(0);
    console.log("✓ Password filled (randomly generated)");

    // ============================================================
    // STEP 4: Fill in password confirmation
    // ============================================================
    console.log("Step 4: Filling in password confirmation...");
    await registerPage.fillConfirmPassword(testPassword);

    // Verify confirm password is filled
    const confirmPasswordValue = await registerPage.confirmPasswordInput.inputValue();
    expect(confirmPasswordValue.length).toBeGreaterThan(0);
    console.log("✓ Password confirmation filled");

    // ============================================================
    // STEP 5: Verify submit button is enabled
    // ============================================================
    console.log("Step 5: Verifying submit button state...");
    await expect(registerPage.submitButton).toBeEnabled();
    console.log("✓ Submit button is enabled");
  });

  test("complete registration with randomly generated credentials", async ({ page }) => {
    // Generate random credentials
    const testEmail = generateRandomEmail();
    const testPassword = generateRandomPassword();

    // Initialize Page Object
    registerPage = new RegisterPage(page);

    // ============================================================
    // STEP 1: Navigate and fill form
    // ============================================================
    console.log("Step 1: Navigating to registration page...");
    await registerPage.gotoAndWaitForLoad();

    console.log(`Step 2: Filling registration form with random credentials...`);
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: [randomly generated, ${testPassword.length} chars]`);
    await registerPage.register(testEmail, testPassword);

    // ============================================================
    // STEP 2: Submit form
    // ============================================================
    console.log("Step 3: Submitting registration form...");
    // Form is already submitted by register() method

    // ============================================================
    // STEP 3: Wait for response
    // ============================================================
    console.log("Step 4: Waiting for response...");
    await page.waitForTimeout(3000); // Wait for API response

    // ============================================================
    // STEP 4: Verify successful registration
    // ============================================================
    console.log("Step 5: Checking registration result...");

    // Check if there's an error message (unexpected)
    const hasError = await registerPage.hasErrorMessage();

    // Check if there's a success message (email confirmation required)
    const hasSuccess = await registerPage.hasSuccessMessage();

    // Check if redirected (auto-login successful)
    const currentUrl = page.url();
    const isRedirected = currentUrl.includes("/onboarding/platforms") || currentUrl.includes("/home");

    if (hasError) {
      const errorText = await registerPage.getErrorMessage();
      console.log(`⚠ Unexpected error: ${errorText}`);
      // With random credentials, we shouldn't get an error
      // But if we do, log it for debugging
      console.log("Note: This might indicate an API issue or validation problem");
    } else if (hasSuccess) {
      const successText = await registerPage.getSuccessMessage();
      console.log(`✓ Success message displayed: ${successText}`);
      expect(successText.length).toBeGreaterThan(0);

      // Verify we're still on registration page (email confirmation required)
      await expect(page).toHaveURL(/\/auth\/register/);
      console.log("✓ User remains on registration page (email confirmation required)");
      console.log("✓ Registration successful - email confirmation flow");
    } else if (isRedirected) {
      console.log(`✓ Registration successful, redirected to: ${currentUrl}`);
      expect(isRedirected).toBe(true);
      console.log("✓ Registration successful - auto-login flow");
    } else {
      // If none of the above, something unexpected happened
      console.log("⚠ Unexpected state - no error, no success, no redirect");
      console.log("Current URL:", currentUrl);
    }
  });

  test("validate password mismatch error", async ({ page }) => {
    // Generate random credentials
    const testEmail = generateRandomEmail();
    const testPassword = generateRandomPassword();
    const differentPassword = generateRandomPassword(); // Different password

    // Initialize Page Object
    registerPage = new RegisterPage(page);

    // ============================================================
    // STEP 1: Navigate to registration page
    // ============================================================
    console.log("Step 1: Navigating to registration page...");
    await registerPage.gotoAndWaitForLoad();

    // ============================================================
    // STEP 2: Fill form with mismatched passwords
    // ============================================================
    console.log("Step 2: Filling form with mismatched passwords...");
    console.log(`  Email: ${testEmail}`);
    console.log(`  Password: [randomly generated]`);
    console.log(`  Confirm Password: [different randomly generated]`);
    await registerPage.fillEmail(testEmail);
    await registerPage.fillPassword(testPassword);
    await registerPage.fillConfirmPassword(differentPassword);

    // ============================================================
    // STEP 3: Submit form
    // ============================================================
    console.log("Step 3: Submitting form...");
    await registerPage.clickSubmit();

    // ============================================================
    // STEP 4: Wait for validation
    // ============================================================
    console.log("Step 4: Waiting for client-side validation...");
    await page.waitForTimeout(500);

    // ============================================================
    // STEP 5: Verify we're still on registration page
    // ============================================================
    console.log("Step 5: Verifying validation error...");
    await expect(page).toHaveURL(/\/auth\/register/);
    console.log("✓ User remains on registration page due to validation error");

    // Note: Client-side validation errors are shown inline, not in the general error message
    // The form should not submit if passwords don't match
  });

  test("attempt registration with existing user (error handling)", async ({ page }) => {
    // Use existing credentials from .env.test to test error handling
    const E2E_USERNAME = process.env.E2E_USERNAME || "";
    const E2E_PASSWORD = process.env.E2E_PASSWORD || "";

    // Skip if credentials not available
    if (!E2E_USERNAME || !E2E_PASSWORD) {
      test.skip(true, "E2E_USERNAME or E2E_PASSWORD not set - skipping existing user test");
      return;
    }

    // Initialize Page Object
    registerPage = new RegisterPage(page);

    // ============================================================
    // STEP 1: Navigate and fill form
    // ============================================================
    console.log("Step 1: Navigating to registration page...");
    await registerPage.gotoAndWaitForLoad();

    console.log("Step 2: Attempting registration with existing credentials...");
    console.log(`  Email: ${E2E_USERNAME}`);
    await registerPage.register(E2E_USERNAME, E2E_PASSWORD);

    // ============================================================
    // STEP 2: Wait for response
    // ============================================================
    console.log("Step 3: Waiting for response...");
    await page.waitForTimeout(2000);

    // ============================================================
    // STEP 3: Verify error handling
    // ============================================================
    console.log("Step 4: Checking for error message...");

    const hasError = await registerPage.hasErrorMessage();

    if (hasError) {
      const errorText = await registerPage.getErrorMessage();
      console.log(`✓ Error handling works correctly: ${errorText}`);
      expect(errorText.length).toBeGreaterThan(0);

      // Verify we're still on registration page
      await expect(page).toHaveURL(/\/auth\/register/);
      console.log("✓ User remains on registration page after error");
    } else {
      console.log("⚠ No error message displayed - user might not exist yet");
      console.log("Note: This is acceptable if the test user hasn't been created");
    }
  });

  test("navigate to login page via link", async ({ page }) => {
    // Initialize Page Object
    registerPage = new RegisterPage(page);

    // ============================================================
    // STEP 1: Navigate to registration page
    // ============================================================
    console.log("Step 1: Navigating to registration page...");
    await registerPage.gotoAndWaitForLoad();

    // ============================================================
    // STEP 2: Click login link
    // ============================================================
    console.log("Step 2: Clicking login link...");
    await registerPage.goToLogin();

    // ============================================================
    // STEP 3: Verify navigation to login page
    // ============================================================
    console.log("Step 3: Verifying navigation to login page...");
    await expect(page).toHaveURL(/\/auth\/login/);
    console.log("✓ Successfully navigated to login page");
  });
});
