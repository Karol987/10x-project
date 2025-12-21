// src/lib/services/watched.service.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { WatchedItemCreateCommand, WatchedItemDTO, UUID, PaginatedResponse, PaginationQuery } from "../../types";

/**
 * Custom error for duplicate watched items (UNIQUE constraint violation)
 */
export class WatchedItemAlreadyExistsError extends Error {
  constructor(message = "Already marked as watched") {
    super(message);
    this.name = "WatchedItemAlreadyExistsError";
  }
}

/**
 * Custom error for watched item not found
 */
export class WatchedItemNotFoundError extends Error {
  constructor(message = "Watched item not found") {
    super(message);
    this.name = "WatchedItemNotFoundError";
  }
}

/**
 * Watched Items Service
 * Handles CRUD operations for user's watched items (movies/series)
 */
export class WatchedService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new watched item for a user
   *
   * Inserts a record into the watched_items table.
   * The user_id is automatically set via RLS policy using auth.uid().
   *
   * @param userId - The user's UUID
   * @param command - The watched item data to create
   * @returns The created WatchedItemDTO
   * @throws WatchedItemAlreadyExistsError if the item is already marked as watched (UNIQUE constraint)
   * @throws Error for other database errors
   */
  async create(userId: UUID, command: WatchedItemCreateCommand): Promise<WatchedItemDTO> {
    // Prepare the insert data - include user_id for the insert
    const insertData = {
      user_id: userId,
      external_movie_id: command.external_movie_id,
      media_type: command.media_type,
      title: command.title,
      year: command.year ?? null,
      meta_data: command.meta_data,
    };

    // Execute INSERT with RETURNING clause
    const { data, error } = await this.supabase
      .from("watched_items")
      .insert(insertData)
      .select("id, external_movie_id, media_type, title, year, created_at")
      .single();

    // Handle errors
    if (error) {
      // Check for UNIQUE constraint violation (code 23505)
      // This happens when (user_id, external_movie_id, media_type) combination already exists
      if (error.code === "23505") {
        throw new WatchedItemAlreadyExistsError();
      }

      // Log and rethrow other errors
      console.error("Failed to create watched item:", error);
      throw new Error(`Failed to create watched item: ${error.message}`);
    }

    // Validate data was returned
    if (!data) {
      throw new Error("No data returned after creating watched item");
    }

    // Return the DTO matching WatchedItemDTO structure
    return {
      id: data.id,
      external_movie_id: data.external_movie_id,
      media_type: data.media_type,
      title: data.title,
      year: data.year,
      created_at: data.created_at,
    };
  }

  /**
   * Get paginated list of watched items for a user
   *
   * Retrieves watched items sorted by created_at descending (newest first).
   * Uses keyset pagination with cursor for efficient pagination.
   *
   * @param userId - The user's UUID
   * @param pagination - Pagination parameters (limit, cursor)
   * @returns PaginatedResponse with watched items and next cursor
   * @throws Error for database errors
   */
  async getWatchedItems(userId: UUID, pagination: PaginationQuery = {}): Promise<PaginatedResponse<WatchedItemDTO>> {
    const limit = pagination.limit ?? 20;
    const cursor = pagination.cursor;

    // Start building the query
    let query = this.supabase
      .from("watched_items")
      .select("id, external_movie_id, media_type, title, year, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit + 1); // Fetch one extra to determine if there's a next page

    // If cursor is provided, filter records older than the cursor's created_at
    if (cursor) {
      // First, fetch the cursor item to get its created_at timestamp
      const { data: cursorItem, error: cursorError } = await this.supabase
        .from("watched_items")
        .select("created_at")
        .eq("id", cursor)
        .eq("user_id", userId)
        .single();

      if (cursorError || !cursorItem) {
        // If cursor item not found, it might be deleted or invalid
        // Return empty result or throw error based on requirements
        console.warn("Cursor item not found:", cursor);
        return { data: [], next_cursor: null };
      }

      // Filter items created before the cursor item
      query = query.lt("created_at", cursorItem.created_at);
    }

    // Execute the query
    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch watched items:", error);
      throw new Error(`Failed to fetch watched items: ${error.message}`);
    }

    // Determine if there's a next page
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;

    // Set next_cursor to the last item's id if there are more items
    const next_cursor = hasMore && items.length > 0 ? items[items.length - 1].id : null;

    // Map to DTOs
    const watchedItems: WatchedItemDTO[] = items.map((item) => ({
      id: item.id,
      external_movie_id: item.external_movie_id,
      media_type: item.media_type,
      title: item.title,
      year: item.year,
      created_at: item.created_at,
    }));

    return {
      data: watchedItems,
      next_cursor,
    };
  }

  /**
   * Delete a watched item for a user
   *
   * Removes a watched item from the user's history.
   * Ensures that only the owner can delete their own items.
   *
   * @param userId - The user's UUID
   * @param itemId - The watched item's UUID to delete
   * @throws WatchedItemNotFoundError if item doesn't exist or doesn't belong to user
   * @throws Error for other database errors
   */
  async deleteWatchedItem(userId: UUID, itemId: UUID): Promise<void> {
    // Execute DELETE with user_id check to ensure ownership
    const { error, count } = await this.supabase
      .from("watched_items")
      .delete({ count: "exact" })
      .eq("id", itemId)
      .eq("user_id", userId);

    // Handle errors
    if (error) {
      console.error("Failed to delete watched item:", error);
      throw new Error(`Failed to delete watched item: ${error.message}`);
    }

    // Check if any rows were deleted
    if (count === 0) {
      throw new WatchedItemNotFoundError();
    }
  }
}
