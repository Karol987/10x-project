import { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for Login Page
 * Represents the login form and related actions
 */
export class LoginPage {
  readonly page: Page;
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.loginForm = page.locator('[data-test-id="login-form"]');
    this.emailInput = page.locator('[data-test-id="login-email-input"]');
    this.passwordInput = page.locator('[data-test-id="login-password-input"]');
    this.submitButton = page.locator('[data-test-id="login-submit-button"]');
    this.errorMessage = page.locator('[data-test-id="login-error-message"]');
  }

  /**
   * Navigate to the login page
   */
  async goto() {
    await this.page.goto("/auth/login");
  }

  /**
   * Wait for the login form to load
   */
  async waitForPageLoad() {
    await this.loginForm.waitFor({ state: "visible" });
  }

  /**
   * Navigate to login page and wait for load
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
   * Click the submit button
   */
  async clickSubmit() {
    await this.submitButton.click();
  }

  /**
   * Perform a complete login action
   * @param email - User email
   * @param password - User password
   */
  async login(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickSubmit();
  }

  /**
   * Wait for successful login redirect
   * By default, waits for redirect to /home
   * Checks for errors before waiting for redirect
   */
  async waitForLoginSuccess(expectedUrl = "**/home") {
    // Wait a bit for either error message or navigation
    await this.page.waitForTimeout(1000);

    // Check if there's an error message
    const hasError = await this.hasErrorMessage();
    if (hasError) {
      const errorText = await this.getErrorMessage();
      throw new Error(`Login failed: ${errorText}`);
    }

    // Wait for navigation with increased timeout
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
   * Check if submit button is disabled
   */
  async isSubmitDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  /**
   * Complete login flow: goto → fill → submit → wait for redirect
   */
  async loginAndWaitForSuccess(email: string, password: string, expectedUrl = "**/home") {
    await this.gotoAndWaitForLoad();
    await this.login(email, password);
    await this.waitForLoginSuccess(expectedUrl);
  }
}
