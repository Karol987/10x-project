import { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for Platform Card component
 * Represents a single platform VOD card in the profile settings
 */
export class PlatformCardPage {
  readonly page: Page;
  readonly platformId: string;
  readonly card: Locator;
  readonly loadingIndicator: Locator;
  readonly selectedIndicator: Locator;
  readonly platformLogo: Locator;
  readonly platformName: Locator;

  constructor(page: Page, platformId: string) {
    this.page = page;
    this.platformId = platformId;
    this.card = page.locator(`[data-test-id="platform-card-${platformId}"]`);
    this.loadingIndicator = this.card.locator('[data-test-id="platform-card-loading-indicator"]');
    this.selectedIndicator = this.card.locator('[data-test-id="platform-card-selected-indicator"]');
    this.platformLogo = this.card.locator('img, div[aria-hidden="true"]').first();
    this.platformName = this.card.locator('[data-test-id="platform-card-name"]');
  }

  /**
   * Click on the platform card to toggle selection
   */
  async click() {
    await this.card.click();
  }

  /**
   * Check if the platform card is selected
   */
  async isSelected(): Promise<boolean> {
    const selected = await this.card.getAttribute("data-selected");
    return selected === "true";
  }

  /**
   * Check if the platform card is in pending/loading state
   */
  async isPending(): Promise<boolean> {
    const pending = await this.card.getAttribute("data-pending");
    return pending === "true";
  }

  /**
   * Check if the platform card is disabled
   */
  async isDisabled(): Promise<boolean> {
    return await this.card.isDisabled();
  }

  /**
   * Get the platform name
   */
  async getPlatformName(): Promise<string> {
    return (await this.card.getAttribute("data-platform-name")) || "";
  }

  /**
   * Wait for the card to finish loading/saving
   */
  async waitForSaveComplete() {
    await this.card.locator('[data-pending="false"]').waitFor();
  }

  /**
   * Wait for the loading indicator to appear
   */
  async waitForLoadingIndicator() {
    await this.loadingIndicator.waitFor({ state: "visible" });
  }

  /**
   * Wait for the loading indicator to disappear
   */
  async waitForLoadingIndicatorHidden() {
    await this.loadingIndicator.waitFor({ state: "hidden" });
  }

  /**
   * Wait for the selected indicator to appear
   */
  async waitForSelectedIndicator() {
    await this.selectedIndicator.waitFor({ state: "visible" });
  }

  /**
   * Wait for the selected indicator to disappear
   */
  async waitForSelectedIndicatorHidden() {
    await this.selectedIndicator.waitFor({ state: "hidden" });
  }

  /**
   * Verify the card is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.card.isVisible();
  }
}
