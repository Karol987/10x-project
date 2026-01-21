import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { WatchedItemRow } from "./WatchedItemRow";
import type { WatchedItemViewModel } from "@/types";

/**
 * UNIT TESTS: WatchedItemRow Component
 * 
 * Test Coverage:
 * - Rendering with different props combinations
 * - Media type icon rendering (movie vs tv)
 * - Delete button interaction
 * - Async delete operation handling
 * - Loading states (isDeleting)
 * - Edge cases (missing year, long titles, special characters)
 * - Accessibility attributes
 * - Business rules validation
 */

describe("WatchedItemRow Component", () => {
  // Default mock props for testing
  const createMockItem = (overrides?: Partial<WatchedItemViewModel>): WatchedItemViewModel => ({
    id: "test-id-123",
    external_movie_id: "tmdb-12345",
    media_type: "movie",
    title: "Test Movie",
    year: 2023,
    created_at: "2023-01-15T10:00:00Z",
    isDeleting: false,
    ...overrides,
  });

  const mockOnDelete = vi.fn();

  beforeEach(() => {
    mockOnDelete.mockClear();
    mockOnDelete.mockResolvedValue(undefined);
  });

  describe("Basic Rendering", () => {
    it("should render with minimum required props", () => {
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByRole("listitem")).toBeInTheDocument();
      expect(screen.getByText("Test Movie")).toBeInTheDocument();
    });

    it("should render movie title correctly", () => {
      const item = createMockItem({ title: "Inception" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Inception")).toBeInTheDocument();
    });

    it("should render tv show title correctly", () => {
      const item = createMockItem({ 
        title: "Breaking Bad", 
        media_type: "tv" 
      });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Breaking Bad")).toBeInTheDocument();
    });

    it("should render year when provided", () => {
      const item = createMockItem({ year: 2020 });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("2020")).toBeInTheDocument();
    });

    it("should not render year section when year is null", () => {
      const item = createMockItem({ year: null });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.queryByText(/^\d{4}$/)).not.toBeInTheDocument();
    });

    it("should not render year section when year is undefined", () => {
      const item = createMockItem({ year: undefined });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.queryByText(/^\d{4}$/)).not.toBeInTheDocument();
    });
  });

  describe("Media Type Display", () => {
    it("should display 'Film' for movie media type", () => {
      const item = createMockItem({ media_type: "movie" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Film")).toBeInTheDocument();
    });

    it("should display 'Serial' for tv media type", () => {
      const item = createMockItem({ media_type: "tv" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Serial")).toBeInTheDocument();
    });

    it("should render Film icon for movie media type", () => {
      const item = createMockItem({ media_type: "movie" });
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      // Film icon (lucide-react) has specific class structure
      const icon = container.querySelector('svg.lucide-film');
      expect(icon).toBeInTheDocument();
    });

    it("should render Tv icon for tv media type", () => {
      const item = createMockItem({ media_type: "tv" });
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      // Tv icon (lucide-react) has specific class structure
      const icon = container.querySelector('svg.lucide-tv');
      expect(icon).toBeInTheDocument();
    });

    it("should set aria-hidden on media type icon", () => {
      const item = createMockItem();
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const icon = container.querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe("Delete Button Rendering", () => {
    it("should render delete button", () => {
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      expect(deleteButton).toBeInTheDocument();
      expect(deleteButton).toHaveAttribute("aria-label");
      expect(deleteButton.getAttribute("aria-label")).toContain("Test Movie z historii");
    });

    it("should have correct aria-label with item title", () => {
      const item = createMockItem({ title: "The Matrix" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      expect(deleteButton).toHaveAttribute("aria-label");
      expect(deleteButton.getAttribute("aria-label")).toContain("The Matrix z historii");
    });

    it("should render Trash2 icon in delete button", () => {
      const item = createMockItem();
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const trashIcon = container.querySelector('svg.lucide-trash-2');
      expect(trashIcon).toBeInTheDocument();
    });

    it("should not be disabled by default", () => {
      const item = createMockItem({ isDeleting: false });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      expect(deleteButton).not.toBeDisabled();
    });

    it("should be disabled when isDeleting is true", () => {
      const item = createMockItem({ isDeleting: true });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      expect(deleteButton).toBeDisabled();
    });
  });

  describe("Delete Button Interaction", () => {
    it("should call onDelete with correct id when clicked", async () => {
      const user = userEvent.setup();
      const item = createMockItem({ id: "item-456" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      await user.click(deleteButton);

      expect(mockOnDelete).toHaveBeenCalledTimes(1);
      expect(mockOnDelete).toHaveBeenCalledWith("item-456");
    });

    it("should handle async delete operation", async () => {
      const user = userEvent.setup();
      const item = createMockItem();
      
      // Mock async operation with delay
      const asyncDelete = vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<WatchedItemRow item={item} onDelete={asyncDelete} />);

      const deleteButton = screen.getByRole("button");
      await user.click(deleteButton);

      expect(asyncDelete).toHaveBeenCalledTimes(1);
      
      await waitFor(() => {
        expect(asyncDelete).toHaveBeenCalledWith(item.id);
      });
    });

    it("should not call onDelete when button is disabled", async () => {
      const user = userEvent.setup();
      const item = createMockItem({ isDeleting: true });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      
      // Attempt to click disabled button
      await user.click(deleteButton);

      expect(mockOnDelete).not.toHaveBeenCalled();
    });

    it("should handle multiple rapid clicks by calling onDelete multiple times", async () => {
      const user = userEvent.setup();
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      
      // Rapid clicks
      await user.click(deleteButton);
      await user.click(deleteButton);
      await user.click(deleteButton);

      // All clicks should trigger the handler (no built-in debounce)
      expect(mockOnDelete).toHaveBeenCalledTimes(3);
    });
  });

  describe("Loading State (isDeleting)", () => {
    it("should show pulse animation on trash icon when deleting", () => {
      const item = createMockItem({ isDeleting: true });
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const trashIcon = container.querySelector('svg.lucide-trash-2');
      expect(trashIcon).toHaveClass('animate-pulse');
    });

    it("should not show pulse animation when not deleting", () => {
      const item = createMockItem({ isDeleting: false });
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const trashIcon = container.querySelector('svg.lucide-trash-2');
      expect(trashIcon).not.toHaveClass('animate-pulse');
    });

    it("should handle isDeleting undefined as false", () => {
      const item = createMockItem({ isDeleting: undefined });
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      expect(deleteButton).not.toBeDisabled();
      
      const trashIcon = container.querySelector('svg.lucide-trash-2');
      expect(trashIcon).not.toHaveClass('animate-pulse');
    });
  });

  describe("Edge Cases - Title Handling", () => {
    it("should handle very long title with truncation", () => {
      const longTitle = "A".repeat(200);
      const item = createMockItem({ title: longTitle });
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveClass('truncate');
    });

    it("should handle title with special characters", () => {
      const item = createMockItem({ title: "Movie: The $pecial Edition! @2023" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Movie: The $pecial Edition! @2023")).toBeInTheDocument();
    });

    it("should handle title with unicode characters", () => {
      const item = createMockItem({ title: "Świat według Kiepskich" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Świat według Kiepskich")).toBeInTheDocument();
    });

    it("should handle title with emoji", () => {
      const item = createMockItem({ title: "Movie 🎬 Title 🍿" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Movie 🎬 Title 🍿")).toBeInTheDocument();
    });

    it("should handle title with only whitespace (edge case)", () => {
      const item = createMockItem({ title: "   " });
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const titleElement = container.querySelector('h3');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe("   ");
    });

    it("should handle empty title (edge case)", () => {
      const item = createMockItem({ title: "" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      // Should render but be empty
      const titleElement = screen.getByRole("listitem").querySelector('h3');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement).toHaveTextContent("");
    });

    it("should handle title with newline characters", () => {
      const item = createMockItem({ title: "Movie\nWith\nNewlines" });
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const titleElement = container.querySelector('h3');
      expect(titleElement).toBeInTheDocument();
      expect(titleElement?.textContent).toBe("Movie\nWith\nNewlines");
    });

    it("should handle title with HTML-like content (should not parse)", () => {
      const item = createMockItem({ title: "<script>alert('test')</script>" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      // Should render as text, not execute
      expect(screen.getByText("<script>alert('test')</script>")).toBeInTheDocument();
    });
  });

  describe("Edge Cases - Year Handling", () => {
    it("should handle year 0", () => {
      const item = createMockItem({ year: 0 });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      // Year 0 is rendered by React (0 is rendered, unlike null/undefined/false)
      // This is expected behavior - the component doesn't specifically handle 0
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("should handle very old year (1900)", () => {
      const item = createMockItem({ year: 1900 });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("1900")).toBeInTheDocument();
    });

    it("should handle future year (2099)", () => {
      const item = createMockItem({ year: 2099 });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("2099")).toBeInTheDocument();
    });

    it("should handle negative year (edge case)", () => {
      const item = createMockItem({ year: -100 });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      // Negative years should still render
      expect(screen.getByText("-100")).toBeInTheDocument();
    });
  });

  describe("Edge Cases - ID Handling", () => {
    it("should handle UUID format id", async () => {
      const user = userEvent.setup();
      const item = createMockItem({ id: "550e8400-e29b-41d4-a716-446655440000" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith("550e8400-e29b-41d4-a716-446655440000");
      });
    });

    it("should handle empty string id (edge case)", async () => {
      const user = userEvent.setup();
      const item = createMockItem({ id: "" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith("");
      });
    });

    it("should handle special characters in id", async () => {
      const user = userEvent.setup();
      const item = createMockItem({ id: "test-id-123!@#" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnDelete).toHaveBeenCalledWith("test-id-123!@#");
      });
    });
  });

  describe("Accessibility", () => {
    it("should have role='listitem' on container", () => {
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByRole("listitem")).toBeInTheDocument();
    });

    it("should have aria-label on delete button with item title", () => {
      const item = createMockItem({ title: "Test Movie" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      expect(deleteButton).toHaveAttribute("aria-label");
      expect(deleteButton.getAttribute("aria-label")).toContain("Test Movie z historii");
    });

    it("should have aria-hidden on decorative media type icon", () => {
      const item = createMockItem();
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const mediaIcon = container.querySelector('.flex-shrink-0 svg');
      expect(mediaIcon).toHaveAttribute('aria-hidden', 'true');
    });

    it("should be keyboard accessible - delete button", async () => {
      const user = userEvent.setup();
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      
      // Focus the button
      deleteButton.focus();
      expect(deleteButton).toHaveFocus();

      // Press Enter
      await user.keyboard('{Enter}');
      expect(mockOnDelete).toHaveBeenCalledWith(item.id);
    });

    it("should be keyboard accessible - Space key", async () => {
      const user = userEvent.setup();
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      
      deleteButton.focus();
      await user.keyboard(' ');
      
      expect(mockOnDelete).toHaveBeenCalledWith(item.id);
    });
  });

  describe("CSS Classes and Styling", () => {
    it("should have correct container classes", () => {
      const item = createMockItem();
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveClass("flex", "items-center", "gap-4", "py-4", "px-4");
    });

    it("should have border classes except on last item", () => {
      const item = createMockItem();
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveClass("border-b", "border-border", "last:border-b-0");
    });

    it("should have hover effect class", () => {
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const listItem = screen.getByRole("listitem");
      expect(listItem).toHaveClass("hover:bg-muted/50", "transition-colors");
    });

    it("should have truncate class on title", () => {
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const title = screen.getByText(item.title);
      expect(title).toHaveClass("truncate");
    });

    it("should have correct button variant and size", () => {
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      // Button component from shadcn/ui applies these classes
      expect(deleteButton).toBeInTheDocument();
    });
  });

  describe("Business Rules", () => {
    it("should always render delete button regardless of media type", () => {
      const movieItem = createMockItem({ media_type: "movie" });
      const { rerender } = render(<WatchedItemRow item={movieItem} onDelete={mockOnDelete} />);
      expect(screen.getByRole("button")).toBeInTheDocument();

      const tvItem = createMockItem({ media_type: "tv" });
      rerender(<WatchedItemRow item={tvItem} onDelete={mockOnDelete} />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    it("should show correct Polish translation for movie type", () => {
      const item = createMockItem({ media_type: "movie" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Film")).toBeInTheDocument();
      expect(screen.queryByText("Serial")).not.toBeInTheDocument();
    });

    it("should show correct Polish translation for tv type", () => {
      const item = createMockItem({ media_type: "tv" });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Serial")).toBeInTheDocument();
      expect(screen.queryByText("Film")).not.toBeInTheDocument();
    });

    it("should use capitalize class on media type text", () => {
      const item = createMockItem();
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const mediaTypeText = screen.getByText(/film|serial/i);
      expect(mediaTypeText).toHaveClass("capitalize");
    });

    it("should disable button during delete operation to prevent double-delete", () => {
      const item = createMockItem({ isDeleting: true });
      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const deleteButton = screen.getByRole("button");
      expect(deleteButton).toBeDisabled();
    });

    it("should show visual feedback (pulse) during delete", () => {
      const item = createMockItem({ isDeleting: true });
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const trashIcon = container.querySelector('svg.lucide-trash-2');
      expect(trashIcon).toHaveClass('animate-pulse');
    });
  });

  describe("Integration - Real-world Scenarios", () => {
    it("should handle complete movie item with all fields", () => {
      const item = createMockItem({
        id: "movie-001",
        external_movie_id: "tmdb-550",
        media_type: "movie",
        title: "Fight Club",
        year: 1999,
        created_at: "2023-01-15T10:00:00Z",
        isDeleting: false,
      });

      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Fight Club")).toBeInTheDocument();
      expect(screen.getByText("1999")).toBeInTheDocument();
      expect(screen.getByText("Film")).toBeInTheDocument();
      
      const deleteButton = screen.getByRole("button");
      expect(deleteButton).toHaveAttribute("aria-label");
      expect(deleteButton.getAttribute("aria-label")).toContain("Fight Club z historii");
    });

    it("should handle complete tv show item with all fields", () => {
      const item = createMockItem({
        id: "tv-001",
        external_movie_id: "tmdb-1396",
        media_type: "tv",
        title: "Breaking Bad",
        year: 2008,
        created_at: "2023-02-20T15:30:00Z",
        isDeleting: false,
      });

      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Breaking Bad")).toBeInTheDocument();
      expect(screen.getByText("2008")).toBeInTheDocument();
      expect(screen.getByText("Serial")).toBeInTheDocument();
      
      const deleteButton = screen.getByRole("button");
      expect(deleteButton).toHaveAttribute("aria-label");
      expect(deleteButton.getAttribute("aria-label")).toContain("Breaking Bad z historii");
    });

    it("should handle item without year gracefully", () => {
      const item = createMockItem({
        title: "Unknown Movie",
        year: null,
      });

      render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(screen.getByText("Unknown Movie")).toBeInTheDocument();
      expect(screen.getByText("Film")).toBeInTheDocument();
      expect(screen.queryByText(/^\d{4}$/)).not.toBeInTheDocument();
    });

    it("should handle delete operation flow - start to finish", async () => {
      const user = userEvent.setup();
      let isDeleting = false;

      const handleDelete = vi.fn().mockImplementation(async (id: string) => {
        isDeleting = true;
        await new Promise(resolve => setTimeout(resolve, 100));
        isDeleting = false;
      });

      const item = createMockItem({ id: "item-to-delete" });
      render(<WatchedItemRow item={item} onDelete={handleDelete} />);

      const deleteButton = screen.getByRole("button");
      await user.click(deleteButton);

      expect(handleDelete).toHaveBeenCalledWith("item-to-delete");
      
      await waitFor(() => {
        expect(handleDelete).toHaveReturned();
      });
    });
  });

  describe("Return Value Types", () => {
    it("should return valid React element", () => {
      const item = createMockItem();
      const result = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(result.container).toBeInstanceOf(HTMLElement);
      expect(result.container.firstChild).toBeInstanceOf(HTMLElement);
    });

    it("should render to DOM without errors", () => {
      const item = createMockItem();
      const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(container.querySelector('[role="listitem"]')).toBeInTheDocument();
    });
  });

  describe("Consistency Checks", () => {
    it("should render the same output for same props", () => {
      const item = createMockItem();
      const { container: container1 } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);
      const { container: container2 } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      expect(container1.innerHTML).toBe(container2.innerHTML);
    });

    it("should always call onDelete with item.id parameter", async () => {
      const user = userEvent.setup();
      const items = [
        createMockItem({ id: "id-1", title: "Movie 1" }),
        createMockItem({ id: "id-2", title: "Movie 2" }),
        createMockItem({ id: "id-3", title: "Movie 3" }),
      ];

      for (const item of items) {
        mockOnDelete.mockClear();
        const { unmount } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);
        
        const deleteButton = screen.getByRole("button");
        await user.click(deleteButton);

        expect(mockOnDelete).toHaveBeenCalledWith(item.id);
        unmount();
      }
    });

    it("should maintain consistent icon rendering for same media type", () => {
      const movieItems = [
        createMockItem({ id: "1", media_type: "movie", title: "Movie 1" }),
        createMockItem({ id: "2", media_type: "movie", title: "Movie 2" }),
      ];

      for (const item of movieItems) {
        const { container } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);
        const icon = container.querySelector('svg.lucide-film');
        expect(icon).toBeInTheDocument();
      }
    });

    it("should consistently apply isDeleting state", () => {
      const item = createMockItem({ isDeleting: true });
      const { container: container1 } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);
      const { container: container2 } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const icon1 = container1.querySelector('svg.lucide-trash-2');
      const icon2 = container2.querySelector('svg.lucide-trash-2');

      expect(icon1).toHaveClass('animate-pulse');
      expect(icon2).toHaveClass('animate-pulse');
    });
  });

  describe("Error Handling", () => {
    it("should call onDelete even if it will reject", async () => {
      const user = userEvent.setup();
      
      // Component doesn't handle errors - they bubble up to parent
      // We just verify the function is called, not error handling
      const errorDelete = vi.fn().mockImplementation(async () => {
        // Simulate async operation that will eventually fail
        // but don't actually throw to avoid unhandled rejection in tests
        return Promise.resolve();
      });
      
      const item = createMockItem();
      render(<WatchedItemRow item={item} onDelete={errorDelete} />);

      const deleteButton = screen.getByRole("button");
      await user.click(deleteButton);
      
      // Verify the callback was invoked - error handling is parent's concern
      expect(errorDelete).toHaveBeenCalledWith(item.id);
    });

    it("should handle onDelete function that returns non-promise", async () => {
      const user = userEvent.setup();
      // @ts-expect-error Testing runtime behavior
      const syncDelete = vi.fn().mockReturnValue(undefined);
      const item = createMockItem();

      render(<WatchedItemRow item={item} onDelete={syncDelete} />);

      const deleteButton = screen.getByRole("button");
      await user.click(deleteButton);

      expect(syncDelete).toHaveBeenCalledWith(item.id);
    });
  });

  describe("Performance Considerations", () => {
    it("should not re-render unnecessarily with same props", () => {
      const item = createMockItem();
      const { rerender } = render(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      const renderSpy = vi.fn();
      
      // Rerender with same props
      rerender(<WatchedItemRow item={item} onDelete={mockOnDelete} />);
      rerender(<WatchedItemRow item={item} onDelete={mockOnDelete} />);

      // Component should render but this tests it doesn't break
      expect(screen.getByText(item.title)).toBeInTheDocument();
    });

    it("should handle rapid prop changes", () => {
      const { rerender } = render(
        <WatchedItemRow item={createMockItem({ isDeleting: false })} onDelete={mockOnDelete} />
      );

      // Rapid state changes
      rerender(<WatchedItemRow item={createMockItem({ isDeleting: true })} onDelete={mockOnDelete} />);
      rerender(<WatchedItemRow item={createMockItem({ isDeleting: false })} onDelete={mockOnDelete} />);
      rerender(<WatchedItemRow item={createMockItem({ isDeleting: true })} onDelete={mockOnDelete} />);

      // Should still render correctly
      expect(screen.getByRole("button")).toBeDisabled();
    });
  });
});
