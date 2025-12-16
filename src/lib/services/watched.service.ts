// src/lib/services/watched.service.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { WatchedItemCreateCommand, WatchedItemDTO, UUID } from "../../types";

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
}
