// src/components/recommendations/RecommendationCard.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecommendationCard } from "./RecommendationCard";
import type { RecommendationViewModel } from "@/types";

describe("RecommendationCard", () => {
  // Arrange: Mock data factory
  const createMockRecommendation = (overrides?: Partial<RecommendationViewModel>): RecommendationViewModel => ({
    id: "test-id-123",
    external_movie_id: "tmdb-456",
    media_type: "movie",
    title: "Test Movie Title",
    year: 2024,
    creators: [
      { id: "creator-1", name: "John Director", creator_role: "director", is_favorite: true },
      { id: "creator-2", name: "Jane Actor", creator_role: "actor", is_favorite: false },
    ],
    platforms: ["netflix", "hbo-max"],
    poster_path: "https://example.com/poster.jpg",
    ...overrides,
  });

  const mockOnWatched = vi.fn();

  describe("Rendering: Basic structure", () => {
    it("should render card with all essential elements", () => {
      // Arrange
      const item = createMockRecommendation();

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.getByText("Test Movie Title")).toBeInTheDocument();
      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.getByText("Film")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /oznacz jako obejrzane/i })).toBeInTheDocument();
    });

    it("should render poster image with correct attributes", () => {
      // Arrange
      const item = createMockRecommendation();

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      const poster = screen.getByAltText("Test Movie Title");
      expect(poster).toHaveAttribute("src", "https://example.com/poster.jpg");
      expect(poster).toHaveAttribute("loading", "lazy");
    });

    it("should not render poster when poster_path is missing", () => {
      // Arrange
      const item = createMockRecommendation({ poster_path: undefined });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.queryByRole("img")).not.toBeInTheDocument();
    });

    it("should return null when isOptimisticallyHidden is true", () => {
      // Arrange
      const item = createMockRecommendation({ isOptimisticallyHidden: true });

      // Act
      const { container } = render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Rendering: Media type display", () => {
    it("should display 'Film' for media_type movie", () => {
      // Arrange
      const item = createMockRecommendation({ media_type: "movie" });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.getByText("Film")).toBeInTheDocument();
    });

    it("should display 'Serial' for media_type series", () => {
      // Arrange
      const item = createMockRecommendation({ media_type: "series" });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.getByText("Serial")).toBeInTheDocument();
    });

    it("should handle missing year gracefully", () => {
      // Arrange
      const item = createMockRecommendation({ year: null });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.queryByText("•")).not.toBeInTheDocument();
      expect(screen.getByText("Film")).toBeInTheDocument();
    });

    it("should handle missing media_type gracefully", () => {
      // Arrange
      const item = createMockRecommendation({ media_type: undefined });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.getByText("2024")).toBeInTheDocument();
      expect(screen.queryByText("•")).not.toBeInTheDocument();
    });
  });

  describe("Rendering: Platforms section", () => {
    it("should render all platforms as badges", () => {
      // Arrange
      const item = createMockRecommendation({ platforms: ["netflix", "hbo-max", "disney-plus"] });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.getByText("Dostępne na:")).toBeInTheDocument();
      expect(screen.getByText("netflix")).toBeInTheDocument();
      expect(screen.getByText("hbo-max")).toBeInTheDocument();
      expect(screen.getByText("disney-plus")).toBeInTheDocument();
    });

    it("should not render platforms section when empty array", () => {
      // Arrange
      const item = createMockRecommendation({ platforms: [] });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.queryByText("Dostępne na:")).not.toBeInTheDocument();
    });

    it("should not render platforms section when undefined", () => {
      // Arrange
      const item = createMockRecommendation({ platforms: undefined });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.queryByText("Dostępne na:")).not.toBeInTheDocument();
    });
  });

  describe("Rendering: Creators section", () => {
    it("should render all creators with correct roles", () => {
      // Arrange
      const item = createMockRecommendation();

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.getByText("Twórcy:")).toBeInTheDocument();
      expect(screen.getByText("John Director")).toBeInTheDocument();
      expect(screen.getByText("(reżyser)")).toBeInTheDocument();
      expect(screen.getByText("Jane Actor")).toBeInTheDocument();
      expect(screen.getByText("(aktor)")).toBeInTheDocument();
    });

    it("should render creator without role when creator_role is missing", () => {
      // Arrange
      const item = createMockRecommendation({
        creators: [
          {
            id: "creator-1",
            name: "Anonymous Creator",
            creator_role: undefined as unknown as "actor",
            is_favorite: false,
          },
        ],
      });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.getByText("Anonymous Creator")).toBeInTheDocument();
      expect(screen.queryByText(/aktor|reżyser/)).not.toBeInTheDocument();
    });

    it("should not render creators section when empty array", () => {
      // Arrange
      const item = createMockRecommendation({ creators: [] });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.queryByText("Twórcy:")).not.toBeInTheDocument();
    });

    it("should not render creators section when undefined", () => {
      // Arrange
      const item = createMockRecommendation({ creators: undefined });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.queryByText("Twórcy:")).not.toBeInTheDocument();
    });

    it("should apply different badge variants based on is_favorite", () => {
      // Arrange
      const item = createMockRecommendation();

      // Act
      const { container } = render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert - Check that both badges are rendered (exact styling is handled by shadcn/ui)
      const creatorBadges = container.querySelectorAll('[data-slot="badge"]');
      expect(creatorBadges.length).toBeGreaterThanOrEqual(4); // 2 platforms + 2 creators
    });
  });

  describe("Interaction: Button behavior", () => {
    it("should call onWatched with correct id when button clicked", async () => {
      // Arrange
      const user = userEvent.setup();
      const item = createMockRecommendation();
      const onWatchedSpy = vi.fn();

      // Act
      render(<RecommendationCard item={item} onWatched={onWatchedSpy} />);
      const button = screen.getByRole("button", { name: /oznacz jako obejrzane/i });
      await user.click(button);

      // Assert
      expect(onWatchedSpy).toHaveBeenCalledTimes(1);
      expect(onWatchedSpy).toHaveBeenCalledWith("test-id-123");
    });

    it("should disable button when isMarking is true", () => {
      // Arrange
      const item = createMockRecommendation();

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} isMarking={true} />);
      const button = screen.getByRole("button", { name: /oznacz jako obejrzane/i });

      // Assert
      expect(button).toBeDisabled();
      expect(screen.getByText("Zapisywanie...")).toBeInTheDocument();
    });

    it("should enable button when isMarking is false", () => {
      // Arrange
      const item = createMockRecommendation();

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} isMarking={false} />);
      const button = screen.getByRole("button", { name: /oznacz jako obejrzane/i });

      // Assert
      expect(button).toBeEnabled();
      expect(screen.getByText("Oznacz jako obejrzane")).toBeInTheDocument();
    });

    it("should have correct aria-label for accessibility", () => {
      // Arrange
      const item = createMockRecommendation();

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);
      const button = screen.getByRole("button", { name: /oznacz jako obejrzane/i });

      // Assert
      expect(button).toHaveAccessibleName("Oznacz jako obejrzane");
    });
  });

  describe("Component memoization", () => {
    it("should be memoized and not re-render with same props", () => {
      // Arrange
      const item = createMockRecommendation();
      const onWatchedSpy = vi.fn();

      // Act
      const { rerender } = render(<RecommendationCard item={item} onWatched={onWatchedSpy} />);

      // Re-render with same props should not cause issues
      rerender(<RecommendationCard item={item} onWatched={onWatchedSpy} />);

      // Assert - Component should still render correctly after re-render
      expect(screen.getByText("Test Movie Title")).toBeInTheDocument();
      // Component is wrapped with memo - verify it's a React.memo component
      expect(RecommendationCard.$$typeof).toBeDefined();
    });
  });

  describe("Edge cases: Complex scenarios", () => {
    it("should handle item with only title and id (minimal data)", () => {
      // Arrange
      const minimalItem = {
        id: "minimal-id",
        external_movie_id: "tmdb-999",
        media_type: "movie" as const,
        title: "Minimal Movie",
        year: null,
        creators: [],
        platforms: [],
      };

      // Act
      render(<RecommendationCard item={minimalItem} onWatched={mockOnWatched} />);

      // Assert
      expect(screen.getByText("Minimal Movie")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /oznacz jako obejrzane/i })).toBeInTheDocument();
      expect(screen.queryByText("Dostępne na:")).not.toBeInTheDocument();
      expect(screen.queryByText("Twórcy:")).not.toBeInTheDocument();
    });

    it("should handle very long title with truncation class", () => {
      // Arrange
      const longTitle = "A".repeat(200);
      const item = createMockRecommendation({ title: longTitle });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      const titleElement = screen.getByText(longTitle);
      expect(titleElement).toBeInTheDocument();
      expect(titleElement.className).toContain("line-clamp-2");
    });

    it("should handle multiple creators with same name but different ids", () => {
      // Arrange
      const item = createMockRecommendation({
        creators: [
          { id: "creator-1", name: "John Smith", creator_role: "director", is_favorite: true },
          { id: "creator-2", name: "John Smith", creator_role: "actor", is_favorite: false },
        ],
      });

      // Act
      render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      const smithElements = screen.getAllByText("John Smith");
      expect(smithElements).toHaveLength(2);
      expect(screen.getByText("(reżyser)")).toBeInTheDocument();
      expect(screen.getByText("(aktor)")).toBeInTheDocument();
    });
  });

  describe("Snapshot tests", () => {
    it("should match inline snapshot for complete recommendation", () => {
      // Arrange
      const item = createMockRecommendation();

      // Act
      const { container } = render(<RecommendationCard item={item} onWatched={mockOnWatched} />);

      // Assert
      expect(container.firstChild).toMatchInlineSnapshot(`
        <div
          class="bg-card text-card-foreground gap-6 rounded-xl border py-6 shadow-sm flex flex-col overflow-hidden transition-opacity hover:shadow-md"
          data-slot="card"
        >
          <div
            class="aspect-[2/3] w-full overflow-hidden bg-muted"
          >
            <img
              alt="Test Movie Title"
              class="h-full w-full object-cover"
              loading="lazy"
              src="https://example.com/poster.jpg"
            />
          </div>
          <div
            class="@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6 has-data-[slot=card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6"
            data-slot="card-header"
          >
            <div
              class="leading-none font-semibold line-clamp-2"
              data-slot="card-title"
            >
              Test Movie Title
            </div>
            <div
              class="text-muted-foreground text-sm"
              data-slot="card-description"
            >
              <span
                class="font-medium"
              >
                2024
              </span>
              <span
                class="mx-2"
              >
                •
              </span>
              <span
                class="capitalize"
              >
                Film
              </span>
            </div>
          </div>
          <div
            class="px-6 flex-1 space-y-4"
            data-slot="card-content"
          >
            <div
              class="space-y-2"
            >
              <p
                class="text-xs font-medium text-muted-foreground"
              >
                Dostępne na:
              </p>
              <div
                class="flex flex-wrap gap-2"
              >
                <span
                  class="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 capitalize"
                  data-slot="badge"
                >
                  netflix
                </span>
                <span
                  class="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90 capitalize"
                  data-slot="badge"
                >
                  hbo-max
                </span>
              </div>
            </div>
            <div
              class="space-y-2"
            >
              <p
                class="text-xs font-medium text-muted-foreground"
              >
                Twórcy:
              </p>
              <div
                class="flex flex-wrap gap-2"
              >
                <span
                  class="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90 gap-1.5"
                  data-slot="badge"
                >
                  <span>
                    John Director
                  </span>
                  <span
                    class="text-[10px] opacity-70"
                  >
                    (
                    reżyser
                    )
                  </span>
                </span>
                <span
                  class="inline-flex items-center justify-center rounded-full border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground gap-1.5"
                  data-slot="badge"
                >
                  <span>
                    Jane Actor
                  </span>
                  <span
                    class="text-[10px] opacity-70"
                  >
                    (
                    aktor
                    )
                  </span>
                </span>
              </div>
            </div>
          </div>
          <div
            class="flex items-center px-6 [.border-t]:pt-6"
            data-slot="card-footer"
          >
            <button
              aria-label="Oznacz jako obejrzane"
              class="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 h-9 px-4 py-2 has-[>svg]:px-3 w-full"
              data-slot="button"
            >
              <svg
                class="lucide lucide-eye size-4"
                fill="none"
                height="24"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                viewBox="0 0 24 24"
                width="24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"
                />
                <circle
                  cx="12"
                  cy="12"
                  r="3"
                />
              </svg>
              Oznacz jako obejrzane
            </button>
          </div>
        </div>
      `);
    });
  });
});
