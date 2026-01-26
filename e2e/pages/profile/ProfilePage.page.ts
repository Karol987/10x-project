import { Locator, Page } from "@playwright/test";
import { PlatformGridPage } from "./PlatformGrid.page";

/**
 * Page Object Model for Profile Page
 * Represents the main profile page with all sections
 */
export class ProfilePage {
  readonly page: Page;
  readonly platformsSection: Locator;
  readonly platformGrid: PlatformGridPage;

  constructor(page: Page) {
    this.page = page;
    this.platformsSection = page.locator('[data-test-id="platforms-section"]');
    this.platformGrid = new PlatformGridPage(page);
  }

  /**
   * Navigate to the profile page
   */
  async goto() {
    await this.page.goto("/profile");
  }

  /**
   * Wait for the page to load completely
   */
  async waitForPageLoad() {
    await this.platformsSection.waitFor({ state: "visible" });
    await this.platformGrid.waitForLoadingComplete().catch(() => {
      // Grid might not be in loading state
    });
  }

  /**
   * Navigate to profile and wait for load
   */
  async gotoAndWaitForLoad() {
    await this.goto();
    await this.waitForPageLoad();
  }

  /**
   * Check if platforms section is visible
   */
  async isPlatformsSectionVisible(): Promise<boolean> {
    return await this.platformsSection.isVisible();
  }

  /**
   * Get the platforms section heading
   */
  getPlatformsSectionHeading(): Locator {
    return this.platformsSection.locator("h2");
  }

  /**
   * Get the platforms section description
   */
  getPlatformsSectionDescription(): Locator {
    return this.platformsSection.locator("p.text-sm");
  }
}
