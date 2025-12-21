// src/components/hooks/useRecommendations.ts
import { useState, useCallback, useEffect } from "react";
import type { RecommendationViewModel, UUID } from "@/types";
import { fetchRecommendations, markMovieAsWatched } from "@/lib/api";
import { toast } from "sonner";

interface UseRecommendationsState {
  items: RecommendationViewModel[];
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  error: Error | null;
  hasMore: boolean;
  cursor: UUID | null;
}

interface UseRecommendationsReturn extends UseRecommendationsState {
  loadMore: () => Promise<void>;
  markAsWatched: (item: RecommendationViewModel) => Promise<void>;
  retry: () => Promise<void>;
}

const ITEMS_PER_PAGE = 50;

/**
 * Custom hook for managing recommendations feed
 * Handles fetching, pagination, and optimistic updates for marking items as watched
 */
export function useRecommendations(): UseRecommendationsReturn {
  const [state, setState] = useState<UseRecommendationsState>({
    items: [],
    isInitialLoading: true,
    isLoadingMore: false,
    error: null,
    hasMore: true,
    cursor: null,
  });

  /**
   * Fetches initial recommendations on mount
   */
  const fetchInitialRecommendations = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isInitialLoading: true,
        error: null,
      }));

      const data = await fetchRecommendations({ limit: ITEMS_PER_PAGE });

      setState((prev) => ({
        ...prev,
        items: data,
        isInitialLoading: false,
        hasMore: data.length === ITEMS_PER_PAGE,
        cursor: data.length > 0 ? data[data.length - 1].id : null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isInitialLoading: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
    }
  }, []);

  /**
   * Loads more recommendations using cursor-based pagination
   */
  const loadMore = useCallback(async () => {
    if (state.isLoadingMore || !state.hasMore || !state.cursor) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, isLoadingMore: true }));

      const data = await fetchRecommendations({
        limit: ITEMS_PER_PAGE,
        cursor: state.cursor,
      });

      setState((prev) => ({
        ...prev,
        items: [...prev.items, ...data],
        isLoadingMore: false,
        hasMore: data.length === ITEMS_PER_PAGE,
        cursor: data.length > 0 ? data[data.length - 1].id : prev.cursor,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoadingMore: false,
      }));
      toast.error("Nie udało się załadować więcej rekomendacji");
    }
  }, [state.cursor, state.hasMore, state.isLoadingMore]);

  /**
   * Marks an item as watched with optimistic UI update
   * Removes item from list immediately and restores it on error
   */
  const markAsWatched = useCallback(async (item: RecommendationViewModel) => {
    // Optimistically remove item from list
    setState((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== item.id),
    }));

    try {
      // Prepare command data for API
      const command = {
        external_movie_id: item.external_movie_id,
        media_type: item.media_type,
        title: item.title,
        year: item.year ?? undefined,
        meta_data: {
          poster_path: item.poster_path || "",
        },
      };

      await markMovieAsWatched(command);

      toast.success("Oznaczono jako obejrzane");
    } catch (error) {
      // Restore item on error
      setState((prev) => ({
        ...prev,
        items: [...prev.items, item].sort((a, b) => {
          // Try to maintain original order by comparing with nearby items
          return 0;
        }),
      }));

      toast.error("Nie udało się zapisać zmian. Sprawdź połączenie.");
    }
  }, []);

  /**
   * Retries fetching initial recommendations after an error
   */
  const retry = useCallback(async () => {
    await fetchInitialRecommendations();
  }, [fetchInitialRecommendations]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialRecommendations();
  }, [fetchInitialRecommendations]);

  return {
    ...state,
    loadMore,
    markAsWatched,
    retry,
  };
}
