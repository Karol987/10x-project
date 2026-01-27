import { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for Register Page
 * Represents the registration form and related actions
 */
export class RegisterPage {
  readonly page: Page;
  readonly registerForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;
  readonly loginLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.registerForm = page.locator('[data-test-id="register-form"]');
    this.emailInput = page.locator('[data-test-id="register-email-input"]');
    this.passwordInput = page.locator('[data-test-id="register-password-input"]');
    this.confirmPasswordInput = page.locator('[data-test-id="register-confirm-password-input"]');
    this.submitButton = page.locator('[data-test-id="register-submit-button"]');
    this.errorMessage = page.locator('[data-test-id="register-error-message"]');
    this.successMessage = page.locator('[data-test-id="register-success-message"]');
    this.loginLink = page.locator('[data-test-id="register-login-link"]');
  }

  /**
   * Navigate to the registration page
   */
  async goto() {
    await this.page.goto("/auth/register");
  }

  /**
   * Wait for the registration form to load
   */
  async waitForPageLoad() {
    await this.registerForm.waitFor({ state: "visible" });
  }

  /**
   * Navigate to register page and wait for load
   */
  async gotoAndWaitForLoad() {
    await this.goto();
    await this.waitForPageLoad();
  }

  /**
   * Fill in the email field
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Fill in the password field
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Fill in the confirm password field
   */
  async fillConfirmPassword(confirmPassword: string) {
    await this.confirmPasswordInput.fill(confirmPassword);
  }

  /**
   * Click the submit button
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Perform a complete registration action
   * @param email - User email
   * @param password - User password
   * @param confirmPassword - Password confirmation (defaults to password if not provided)
   */
  async register(email: string, password: string, confirmPassword?: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword || password);
    await this.clickSubmit();
  }

  /**
   * Wait for successful registration redirect
   * By default, waits for redirect to /onboarding/platforms
   * Checks for errors before waiting for redirect
   */
  async waitForRegisterSuccess(expectedUrl = "**/onboarding/platforms") {
    // Wait a bit for either error message, success message, or navigation
    await this.page.waitForTimeout(1000);

    // Check if there's an error message
    const hasError = await this.hasErrorMessage();
    if (hasError) {
      const errorText = await this.getErrorMessage();
      throw new Error(`Registration failed: ${errorText}`);
    }

    // Check if there's a success message (email confirmation required)
    const hasSuccess = await this.hasSuccessMessage();
    if (hasSuccess) {
      // Email confirmation is required, no redirect will happen
      return;
    }

    // Wait for navigation with increased timeout (auto-login successful)
    await this.page.waitForURL(expectedUrl, { timeout: 15000 });
  }

  /**
   * Check if error message is visible
   */
  async hasErrorMessage(): Promise<boolean> {
    try {
      return await this.errorMessage.isVisible({ timeout: 500 });
    } catch {
      return false;
    }
  }

  /**
   * Get error message text
   */
  async getErrorMessage(): Promise<string> {
    return (await this.errorMessage.textContent()) || "";
  }

  /**
   * Check if success message is visible
   */
  async hasSuccessMessage(): Promise<boolean> {
    try {
      return await this.successMessage.isVisible({ timeout: 500 });
    } catch {
      return false;
    }
  }

  /**
   * Get success message text
   */
  async getSuccessMessage(): Promise<string> {
    return (await this.successMessage.textContent()) || "";
  }

  /**
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Navigate to login page via link
   */
  async goToLogin() {
    await this.loginLink.click();
  }

  /**
   * Complete registration flow: goto → fill → submit → wait for redirect
   */
  async registerAndWaitForSuccess(
    email: string,
    password: string,
    confirmPassword?: string,
    expectedUrl = "**/onboarding/platforms"
  ) {
    await this.gotoAndWaitForLoad();
    await this.register(email, password, confirmPassword);
    await this.waitForRegisterSuccess(expectedUrl);
  }
}
