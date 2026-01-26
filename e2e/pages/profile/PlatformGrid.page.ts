import { Locator, Page } from "@playwright/test";
import { PlatformCardPage } from "./PlatformCard.page";

/**
 * Page Object Model for Platform Grid component
 * Represents the grid of platform VOD cards in profile settings
 */
export class PlatformGridPage {
  readonly page: Page;
  readonly grid: Locator;
  readonly loadingState: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.grid = page.locator('[data-test-id="platform-grid"]');
    this.loadingState = page.locator('[data-test-id="platform-grid-loading"]');
    this.emptyState = page.locator('[data-test-id="platform-grid-empty"]');
  }

  /**
   * Get a specific platform card by ID
   */
  getPlatformCard(platformId: string): PlatformCardPage {
    return new PlatformCardPage(this.page, platformId);
  }

  /**
   * Get all platform cards
   */
  getAllPlatformCards(): Locator {
    return this.page.locator('[data-test-id^="platform-card-"]');
  }

  /**
   * Get a random platform card
   */
  async getRandomPlatformCard(): Promise<PlatformCardPage> {
    const cards = this.getAllPlatformCards();
    const count = await cards.count();

    if (count === 0) {
      throw new Error("No platform cards found");
    }

    const randomIndex = Math.floor(Math.random() * count);
    const randomCard = cards.nth(randomIndex);
    const platformId = (await randomCard.getAttribute("data-test-id"))?.replace("platform-card-", "") || "";

    return new PlatformCardPage(this.page, platformId);
  }

  /**
   * Get all selected platform cards
   */
  getSelectedPlatformCards(): Locator {
    return this.page.locator('[data-test-id^="platform-card-"][data-selected="true"]');
  }

  /**
   * Get all unselected platform cards
   */
  getUnselectedPlatformCards(): Locator {
    return this.page.locator('[data-test-id^="platform-card-"][data-selected="false"]');
  }

  /**
   * Get count of all platform cards
   */
  async getPlatformCardsCount(): Promise<number> {
    return await this.getAllPlatformCards().count();
  }

  /**
   * Get count of selected platform cards
   */
  async getSelectedPlatformCardsCount(): Promise<number> {
    return await this.getSelectedPlatformCards().count();
  }

  /**
   * Check if the grid is in pending state (saving changes)
   */
  async isPending(): Promise<boolean> {
    const pending = await this.grid.getAttribute("data-pending");
    return pending === "true";
  }

  /**
   * Wait for the grid to finish saving changes
   */
  async waitForSaveComplete() {
    await this.grid
      .locator('[data-pending="true"]')
      .waitFor({ state: "detached", timeout: 5000 })
      .catch(() => {
        // If element is not in pending state, continue
      });
    await this.grid.locator('[data-pending="false"]').waitFor({ timeout: 5000 });
  }

  /**
   * Wait for the grid to start saving changes
   */
  async waitForPendingState() {
    await this.grid.locator('[data-pending="true"]').waitFor({ timeout: 5000 });
  }

  /**
   * Check if the grid is in loading state
   */
  async isLoading(): Promise<boolean> {
    return await this.loadingState.isVisible();
  }

  /**
   * Wait for the grid to finish loading
   */
  async waitForLoadingComplete() {
    await this.loadingState.waitFor({ state: "hidden" });
    await this.grid.waitFor({ state: "visible" });
  }

  /**
   * Check if the grid is showing empty state
   */
  async isEmpty(): Promise<boolean> {
    return await this.emptyState.isVisible();
  }

  /**
   * Verify the grid is visible
   */
  async isVisible(): Promise<boolean> {
    return await this.grid.isVisible();
  }

  /**
   * Click on a random platform card and wait for save to complete
   */
  async clickRandomPlatformAndWaitForSave(): Promise<PlatformCardPage> {
    const platformCard = await this.getRandomPlatformCard();
    await platformCard.click();
    await this.waitForSaveComplete();
    return platformCard;
  }

  /**
   * Toggle a specific platform by ID and wait for save
   */
  async togglePlatformAndWaitForSave(platformId: string): Promise<PlatformCardPage> {
    const platformCard = this.getPlatformCard(platformId);
    await platformCard.click();
    await this.waitForSaveComplete();
    return platformCard;
  }
}
