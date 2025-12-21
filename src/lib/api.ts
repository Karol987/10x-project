// src/lib/api.ts
// API helper functions for frontend

import type {
  RecommendationDTO,
  WatchedItemCreateCommand,
  WatchedItemDTO,
  PaginationQuery,
  PaginatedResponse,
} from "@/types";

/**
 * Fetches recommendations from the API with optional pagination
 * @param params - Pagination parameters (limit, cursor)
 * @returns Array of recommendations
 */
export async function fetchRecommendations(params: PaginationQuery = {}): Promise<RecommendationDTO[]> {
  const searchParams = new URLSearchParams();

  if (params.limit) {
    searchParams.set("limit", params.limit.toString());
  }

  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  const url = `/api/recommendations${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    throw new Error(`Failed to fetch recommendations: ${response.status}`);
  }

  return response.json();
}

/**
 * Marks a movie/series as watched
 * @param command - Data required to create a watched item
 * @returns Success status
 */
export async function markMovieAsWatched(command: WatchedItemCreateCommand): Promise<void> {
  const response = await fetch("/api/me/watched", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (response.status === 409) {
      // Conflict - already watched, treat as success
      return;
    }

    throw new Error(`Failed to mark as watched: ${response.status}`);
  }
}

/**
 * Fetches watched items history with cursor-based pagination
 * @param params - Pagination parameters (limit, cursor)
 * @returns Paginated response with watched items
 */
export async function fetchWatchedHistory(
  params: PaginationQuery = {}
): Promise<PaginatedResponse<WatchedItemDTO>> {
  const searchParams = new URLSearchParams();

  if (params.limit) {
    searchParams.set("limit", params.limit.toString());
  }

  if (params.cursor) {
    searchParams.set("cursor", params.cursor);
  }

  const url = `/api/me/watched${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    throw new Error(`Failed to fetch watched history: ${response.status}`);
  }

  return response.json();
}

/**
 * Deletes a watched item from user's history
 * @param id - UUID of the watched item to delete
 * @returns Success status
 */
export async function deleteWatchedItem(id: string): Promise<void> {
  const response = await fetch(`/api/me/watched/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Unauthorized - redirect to login
      window.location.href = "/login";
      throw new Error("Unauthorized");
    }

    if (response.status === 404) {
      // Not found - item doesn't exist or already deleted
      throw new Error("Item not found");
    }

    throw new Error(`Failed to delete watched item: ${response.status}`);
  }
}
