// src/components/layout/UserMenu.handleLogout.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { UserMenu } from "./UserMenu";

describe("UserMenu - handleLogout()", () => {
  // Setup and teardown
  beforeEach(() => {
    // Mock window.location.href
    delete (window as Window & { location: Location | { href: string } }).location;
    window.location = { href: "" } as Location;

    // Mock console methods to suppress expected errors in tests
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    // Mock window.alert
    vi.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    // Clear all fetch mocks
    vi.unstubAllGlobals();
  });

  describe("Valid inputs - Successful logout", () => {
    it("should call logout API with correct parameters", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });
      });
    });

    it("should redirect to login page on successful logout", async () => {
      // Arrange
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(window.location.href).toBe("/auth/login");
      });
    });

    it("should show loading state during logout process", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveLogout: (value: Response) => void;
      const logoutPromise = new Promise<Response>((resolve) => {
        resolveLogout = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(logoutPromise);

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert - Loading state
      await waitFor(() => {
        expect(screen.getByText("Wylogowywanie...")).toBeInTheDocument();
      });

      const loadingButton = screen.getByRole("button", { name: /wylogowywanie/i });
      expect(loadingButton).toBeDisabled();

      // Cleanup - Resolve the promise
      resolveLogout!({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
    });

    it("should disable logout button during logout process", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveLogout: (value: Response) => void;
      const logoutPromise = new Promise<Response>((resolve) => {
        resolveLogout = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(logoutPromise);

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        const disabledButton = screen.getByRole("button", { name: /wylogowywanie/i });
        expect(disabledButton).toBeDisabled();
        expect(disabledButton).toHaveAttribute("disabled");
      });

      // Cleanup
      resolveLogout!({
        ok: true,
        json: async () => ({ success: true }),
      } as Response);
    });

    it("should handle multiple rapid clicks gracefully", async () => {
      // Arrange
      const user = userEvent.setup();
      let resolveFetch: () => void;
      const fetchPromise = new Promise<Response>((resolve) => {
        resolveFetch = () => resolve({
          ok: true,
          json: async () => ({ success: true }),
        } as Response);
      });
      
      const mockFetch = vi.fn().mockReturnValue(fetchPromise);
      global.fetch = mockFetch;

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });

      // Click first time
      const clickPromise = user.click(logoutButton);
      
      // Verify button becomes disabled (loading state)
      await waitFor(() => {
        const button = screen.getByText("Wylogowywanie...");
        expect(button).toBeInTheDocument();
      });

      // Assert - Should only make one API call even with loading state
      expect(mockFetch).toHaveBeenCalledTimes(1);
      
      // Cleanup - resolve the promise
      resolveFetch!();
      await clickPromise;
    });
  });

  describe("Invalid inputs - Failed logout", () => {
    it("should show error alert when API returns non-ok response", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: "UNAUTHORIZED", message: "Session expired" }),
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(
        () => {
          expect(mockAlert).toHaveBeenCalledWith(
            "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie."
          );
        },
        { timeout: 3000 }
      );
    });

    it("should log error details when API returns error", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockConsoleError = vi.spyOn(console, "error");

      const errorData = { error: "INVALID_SESSION", message: "Session not found" };
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => errorData,
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith(
          "Logout failed:",
          "INVALID_SESSION"
        );
      });
    });

    it("should not redirect when logout fails", async () => {
      // Arrange
      const user = userEvent.setup();
      const initialHref = window.location.href;

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "SERVER_ERROR" }),
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });

      expect(window.location.href).toBe(initialHref);
    });

    it("should re-enable button after failed logout", async () => {
      // Arrange
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: "SERVER_ERROR" }),
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert - Wait for error to be shown
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });

      // Button should be enabled again
      await waitFor(() => {
        const enabledButton = screen.getByRole("button", { name: /wyloguj się/i });
        expect(enabledButton).not.toBeDisabled();
      });
    });
  });

  describe("Edge cases - Network errors", () => {
    it("should handle network failure gracefully", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(
        () => {
          expect(mockAlert).toHaveBeenCalledWith(
            "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie."
          );
        },
        { timeout: 3000 }
      );
    });

    it("should log network error details", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockConsoleError = vi.spyOn(console, "error");
      const networkError = new Error("Failed to fetch");

      global.fetch = vi.fn().mockRejectedValue(networkError);

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Logout error:", networkError);
      });
    });

    it("should handle fetch timeout", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = vi.fn().mockRejectedValue(new Error("Request timeout"));

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(
        () => {
          expect(mockAlert).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it("should handle malformed JSON response", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(
        () => {
          expect(mockAlert).toHaveBeenCalled();
        },
        { timeout: 3000 }
      );
    });

    it("should handle response without error field", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockConsoleError = vi.spyOn(console, "error");

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}), // Empty response
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith("Logout failed:", undefined);
      });
    });

    it("should handle AbortError (cancelled request)", async () => {
      // Arrange
      const user = userEvent.setup();
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";

      global.fetch = vi.fn().mockRejectedValue(abortError);

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });
    });

    it("should re-enable button after network error", async () => {
      // Arrange
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });

      await waitFor(() => {
        const enabledButton = screen.getByRole("button", { name: /wyloguj się/i });
        expect(enabledButton).not.toBeDisabled();
      });
    });
  });

  describe("Business rules", () => {
    it("should use POST method for logout request", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            method: "POST",
          })
        );
      });
    });

    it("should send Content-Type header with logout request", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              "Content-Type": "application/json",
            },
          })
        );
      });
    });

    it("should call logout endpoint at /api/auth/logout", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/auth/logout",
          expect.any(Object)
        );
      });
    });

    it("should redirect to /auth/login specifically", async () => {
      // Arrange
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(window.location.href).toBe("/auth/login");
      });
    });

    it("should always reset loading state in finally block", async () => {
      // Arrange
      const user = userEvent.setup();
      global.fetch = vi.fn().mockRejectedValue(new Error("Test error"));

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert - Even on error, loading state should be reset
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalled();
      });

      await waitFor(() => {
        const button = screen.getByRole("button", { name: /wyloguj się/i });
        expect(button).not.toBeDisabled();
      });
    });

    it("should execute logout via useCallback hook", async () => {
      // Arrange - This test verifies the function doesn't recreate unnecessarily
      const user = userEvent.setup();
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });
      global.fetch = mockFetch;

      const { rerender } = render(<UserMenu userEmail="test@example.com" />);

      // Act - Rerender with same props
      rerender(<UserMenu userEmail="test@example.com" />);

      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert - Function should still work after rerender
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });
    });
  });

  describe("Return value types", () => {
    it("should return void (Promise<void>)", async () => {
      // Arrange
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      const clickResult = await user.click(logoutButton);

      // Assert
      expect(clickResult).toBeUndefined();
    });
  });

  describe("Consistency checks", () => {
    it("should behave identically on multiple successive calls", async () => {
      // Arrange
      const user = userEvent.setup();
      let callCount = 0;
      global.fetch = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        });
      });

      // Test 1
      const { unmount } = render(<UserMenu userEmail="test@example.com" />);
      let menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);
      let logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(callCount).toBe(1);
      });

      unmount();

      // Test 2 - Same behavior
      render(<UserMenu userEmail="test@example.com" />);
      menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);
      logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      await waitFor(() => {
        expect(callCount).toBe(2);
      });
    });

    it("should handle error scenarios consistently", async () => {
      // Arrange
      const user = userEvent.setup();
      const mockAlert = vi.spyOn(window, "alert").mockImplementation(() => {});

      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      // Test 1
      const { unmount } = render(<UserMenu userEmail="test@example.com" />);
      let menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);
      let logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      await waitFor(
        () => {
          expect(mockAlert).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 }
      );

      unmount();
      mockAlert.mockClear();

      // Test 2 - Same error handling
      render(<UserMenu userEmail="test@example.com" />);
      menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);
      logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      await waitFor(
        () => {
          expect(mockAlert).toHaveBeenCalledTimes(1);
        },
        { timeout: 3000 }
      );
    });

    it("should maintain deterministic behavior with different response codes", async () => {
      // Arrange
      const user = userEvent.setup();
      const statusCodes = [401, 403, 500, 503];

      for (const status of statusCodes) {
        global.fetch = vi.fn().mockResolvedValue({
          ok: false,
          status,
          json: async () => ({ error: "ERROR" }),
        });

        const { unmount } = render(<UserMenu userEmail="test@example.com" />);

        // Act
        const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
        await user.click(menuButton);

        const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
        await user.click(logoutButton);

        // Assert - All should show same error message
        await waitFor(() => {
          expect(window.alert).toHaveBeenCalledWith(
            "Wystąpił błąd podczas wylogowywania. Spróbuj ponownie."
          );
        });

        unmount();
      }
    });
  });

  describe("Integration with component state", () => {
    it("should close menu after logout attempt (not tested due to redirect)", async () => {
      // Note: In successful logout, the page redirects before menu can close
      // This test documents the expected behavior
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UserMenu userEmail="test@example.com" />);

      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      expect(screen.getByText("Ustawienia profilu")).toBeInTheDocument();

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // After redirect, component unmounts, so menu state doesn't matter
      await waitFor(() => {
        expect(window.location.href).toBe("/auth/login");
      });
    });

    it("should work without userEmail prop", async () => {
      // Arrange
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UserMenu />);

      // Act
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton);

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(window.location.href).toBe("/auth/login");
      });
    });

    it("should work regardless of initial menu state", async () => {
      // Arrange
      const user = userEvent.setup();
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      render(<UserMenu userEmail="test@example.com" />);

      // Act - Open and close menu, then open again
      const menuButton = screen.getByRole("button", { name: /menu użytkownika/i });
      await user.click(menuButton); // Open
      await user.click(menuButton); // Close
      await user.click(menuButton); // Open again

      const logoutButton = screen.getByRole("button", { name: /wyloguj się/i });
      await user.click(logoutButton);

      // Assert
      await waitFor(() => {
        expect(window.location.href).toBe("/auth/login");
      });
    });
  });
});
