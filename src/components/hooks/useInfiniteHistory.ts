// src/components/hooks/useInfiniteHistory.ts
import { useState, useCallback, useEffect } from "react";
import type { WatchedItemViewModel, UUID } from "@/types";
import { fetchWatchedHistory, deleteWatchedItem } from "@/lib/api";
import { toast } from "sonner";

interface UseInfiniteHistoryState {
  items: WatchedItemViewModel[];
  isLoading: boolean;
  isFetchingNextPage: boolean;
  error: Error | null;
  cursor: UUID | null;
  hasMore: boolean;
}

interface UseInfiniteHistoryReturn extends UseInfiniteHistoryState {
  fetchNextPage: () => Promise<void>;
  handleDelete: (id: string) => Promise<void>;
  retry: () => Promise<void>;
}

const ITEMS_PER_PAGE = 20;

/**
 * Custom hook for managing watched items history with infinite scroll
 * Handles fetching, pagination, and delete operations with optimistic updates
 */
export function useInfiniteHistory(): UseInfiniteHistoryReturn {
  const [state, setState] = useState<UseInfiniteHistoryState>({
    items: [],
    isLoading: true,
    isFetchingNextPage: false,
    error: null,
    cursor: null,
    hasMore: true,
  });

  /**
   * Fetches initial history on mount
   */
  const fetchInitialHistory = useCallback(async () => {
    try {
      setState((prev) => ({
        ...prev,
        isLoading: true,
        error: null,
      }));

      const response = await fetchWatchedHistory({ limit: ITEMS_PER_PAGE });

      setState((prev) => ({
        ...prev,
        items: response.data,
        isLoading: false,
        hasMore: response.next_cursor !== null && response.next_cursor !== undefined,
        cursor: response.next_cursor || null,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error("Unknown error"),
      }));
    }
  }, []);

  /**
   * Fetches next page of history items using cursor-based pagination
   */
  const fetchNextPage = useCallback(async () => {
    if (state.isFetchingNextPage || !state.hasMore || !state.cursor) {
      return;
    }

    try {
      setState((prev) => ({ ...prev, isFetchingNextPage: true }));

      const response = await fetchWatchedHistory({
        limit: ITEMS_PER_PAGE,
        cursor: state.cursor,
      });

      setState((prev) => ({
        ...prev,
        items: [...prev.items, ...response.data],
        isFetchingNextPage: false,
        hasMore: response.next_cursor !== null && response.next_cursor !== undefined,
        cursor: response.next_cursor || null,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        isFetchingNextPage: false,
      }));
      toast.error("Nie udało się załadować więcej elementów");
    }
  }, [state.cursor, state.hasMore, state.isFetchingNextPage]);

  /**
   * Handles deletion of a watched item with optimistic UI update
   * Sets isDeleting flag, removes item on success, restores on error
   */
  const handleDelete = useCallback(async (id: string) => {
    // Set isDeleting flag for the item
    setState((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, isDeleting: true } : item)),
    }));

    try {
      await deleteWatchedItem(id);

      // Remove item from list on success
      setState((prev) => ({
        ...prev,
        items: prev.items.filter((item) => item.id !== id),
      }));

      toast.success("Usunięto z historii");
    } catch {
      // Restore item on error (remove isDeleting flag)
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item) => (item.id === id ? { ...item, isDeleting: false } : item)),
      }));

      toast.error("Nie udało się usunąć elementu. Spróbuj ponownie później.");
    }
  }, []);

  /**
   * Retries fetching initial history after an error
   */
  const retry = useCallback(async () => {
    await fetchInitialHistory();
  }, [fetchInitialHistory]);

  // Fetch initial data on mount
  useEffect(() => {
    fetchInitialHistory();
  }, [fetchInitialHistory]);

  return {
    ...state,
    fetchNextPage,
    handleDelete,
    retry,
  };
}
