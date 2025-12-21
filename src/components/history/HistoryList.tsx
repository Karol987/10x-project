// src/components/history/HistoryList.tsx
import { useEffect, useRef, useCallback } from "react";
import { useInfiniteHistory } from "@/components/hooks/useInfiniteHistory";
import { WatchedItemRow } from "./WatchedItemRow";
import { HistorySkeleton } from "./HistorySkeleton";
import { EmptyHistoryState } from "./EmptyHistoryState";
import { ErrorState } from "./ErrorState";
import { Loader2 } from "lucide-react";

/**
 * Main container component for the watched items history list
 * Manages state, infinite scroll, and displays appropriate UI based on state
 */
export function HistoryList() {
  const { items, isLoading, isFetchingNextPage, error, hasMore, fetchNextPage, handleDelete, retry } =
    useInfiniteHistory();

  const observerTarget = useRef<HTMLDivElement>(null);

  /**
   * Callback for IntersectionObserver
   * Triggers fetchNextPage when sentinel element becomes visible
   */
  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [hasMore, isFetchingNextPage, fetchNextPage]
  );

  /**
   * Set up IntersectionObserver for infinite scroll
   * Starts loading 200px before reaching the bottom
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

  // Show error state
  if (error && items.length === 0) {
    return <ErrorState onRetry={retry} />;
  }

  // Show loading skeleton on initial load
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <HistorySkeleton count={10} />
      </div>
    );
  }

  // Show empty state when no items
  if (items.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <EmptyHistoryState />
      </div>
    );
  }

  // Show history list
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Historia Obejrzanych</h1>
        <p className="text-muted-foreground">Przeglądaj filmy i seriale, które oznaczyłeś jako obejrzane</p>
      </div>

      {/* List container */}
      <div className="bg-card border border-border rounded-lg overflow-hidden" role="list">
        {items.map((item) => (
          <WatchedItemRow key={item.id} item={item} onDelete={handleDelete} />
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasMore && (
        <div
          ref={observerTarget}
          className="flex justify-center items-center py-8"
          aria-live="polite"
          aria-busy={isFetchingNextPage}
        >
          {isFetchingNextPage && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              <span>Ĺadowanie kolejnych elementĂłw...</span>
            </div>
          )}
        </div>
      )}

      {/* End of list message */}
      {!hasMore && items.length > 0 && (
        <div className="text-center py-8 text-muted-foreground">To wszystkie obejrzane produkcje</div>
      )}
    </div>
  );
}
