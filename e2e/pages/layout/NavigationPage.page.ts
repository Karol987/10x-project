import { Locator, Page } from "@playwright/test";

/**
 * Page Object Model for Navigation/Header
 * Represents the main navigation header with links and user menu
 */
export class NavigationPage {
  readonly page: Page;
  readonly homeLink: Locator;
  readonly historyLink: Locator;
  readonly profileLink: Locator;
  readonly userMenuButton: Locator;
  readonly userMenuDropdown: Locator;
  readonly userMenuProfileButton: Locator;
  readonly userMenuHistoryButton: Locator;
  readonly userMenuLogoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Navigation links
    this.homeLink = page.locator('[data-test-id="nav-home-link"]');
    this.historyLink = page.locator('[data-test-id="nav-history-link"]');
    this.profileLink = page.locator('[data-test-id="nav-profile-link"]');

    // User menu
    this.userMenuButton = page.locator('[data-test-id="user-menu-button"]');
    this.userMenuDropdown = page.locator('[data-test-id="user-menu-dropdown"]');
    this.userMenuProfileButton = page.locator('[data-test-id="user-menu-profile-button"]');
    this.userMenuHistoryButton = page.locator('[data-test-id="user-menu-history-button"]');
    this.userMenuLogoutButton = page.locator('[data-test-id="user-menu-logout-button"]');
  }

  /**
   * Navigate to home page via nav link
   */
  async goToHome() {
    await this.homeLink.click();
  }

  /**
   * Navigate to history page via nav link
   */
  async goToHistory() {
    await this.historyLink.click();
  }

  /**
   * Navigate to profile page via nav link
   */
  async goToProfile() {
    await this.profileLink.click();
  }

  /**
   * Open user menu dropdown
   */
  async openUserMenu() {
    await this.userMenuButton.click();
    await this.userMenuDropdown.waitFor({ state: "visible" });
  }

  /**
   * Navigate to profile via user menu
   */
  async goToProfileViaMenu() {
    await this.openUserMenu();
    await this.userMenuProfileButton.click();
  }

  /**
   * Navigate to history via user menu
   */
  async goToHistoryViaMenu() {
    await this.openUserMenu();
    await this.userMenuHistoryButton.click();
  }

  /**
   * Logout via user menu
   */
  async logout() {
    await this.openUserMenu();
    await this.userMenuLogoutButton.click();
  }

  /**
   * Check if user menu is open
   */
  async isUserMenuOpen(): Promise<boolean> {
    return await this.userMenuDropdown.isVisible();
  }

  /**
   * Check if navigation is visible (user is logged in)
   */
  async isNavigationVisible(): Promise<boolean> {
    return await this.homeLink.isVisible();
  }
}
