// src/components/recommendations/RecommendationsFeed.tsx
import { useEffect, useRef, useCallback } from "react";
import { useRecommendations } from "@/components/hooks/useRecommendations";
import { RecommendationCard } from "./RecommendationCard";
import { EmptyState } from "./EmptyState";
import { ErrorState } from "./ErrorState";
import { LoadingSkeleton } from "./LoadingSkeleton";
import { Loader2 } from "lucide-react";

/**
 * Main container component for the recommendations feed
 * Manages state, infinite scroll, and displays appropriate UI based on state
 */
export function RecommendationsFeed() {
  const { items, isInitialLoading, isLoadingMore, error, hasMore, loadMore, markAsWatched, retry } =
    useRecommendations();

  const observerTarget = useRef<HTMLDivElement>(null);

  /**
   * Callback for IntersectionObserver
   * Triggers loadMore when sentinel element becomes visible
   */
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isLoadingMore) {
        loadMore();
      }
    },
    [hasMore, isLoadingMore, loadMore]
  );

  /**
   * Set up IntersectionObserver for infinite scroll
   */
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(handleIntersection, {
      root: null,
      rootMargin: "200px", // Start loading 200px before reaching the bottom
      threshold: 0.1,
    });

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [handleIntersection]);

  /**
   * Handle marking item as watched
   */
  const handleWatched = useCallback(
    async (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (item) {
        await markAsWatched(item);
      }
    },
    [items, markAsWatched]
  );

  // Show error state
  if (error && items.length === 0) {
    return <ErrorState onRetry={retry} />;
  }

  // Show loading skeleton on initial load
  if (isInitialLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSkeleton count={8} />
      </div>
    );
  }

  // Show empty state when no items
  if (items.length === 0 && !isInitialLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyState />
      </div>
    );
  }

  // Show recommendations grid
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Rekomendacje dla Ciebie</h1>
        <p className="text-muted-foreground">
          Odkryj filmy i seriale dopasowane do Twoich ulubionych twórców i platform
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item) => (
          <RecommendationCard key={item.id} item={item} onWatched={handleWatched} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div
          ref={observerTarget}
          className="flex justify-center items-center py-8"
          aria-live="polite"
          aria-busy={isLoadingMore}
        >
          {isLoadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>Ładowanie kolejnych rekomendacji...</span>
            </div>
          )}
        </div>
      )}

      {/* End of list message */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">To wszystkie dostępne rekomendacje</div>
      )}
    </div>
  );
}
