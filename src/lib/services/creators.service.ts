// src/lib/services/creators.service.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type {
  CreatorDTO,
  CreatorSearchQuery,
  PaginatedResponse,
  UUID,
  PaginationQuery,
  CreatorRole,
} from "../../types";

/**
 * Custom error for creator not found
 */
export class CreatorNotFoundError extends Error {
  constructor(message = "Creator not found") {
    super(message);
    this.name = "CreatorNotFoundError";
  }
}

/**
 * Custom error for duplicate favorite creator
 */
export class CreatorAlreadyFavoriteError extends Error {
  constructor(message = "Creator is already in favorites") {
    super(message);
    this.name = "CreatorAlreadyFavoriteError";
  }
}

/**
 * Custom error for favorite creator not found
 */
export class FavoriteCreatorNotFoundError extends Error {
  constructor(message = "Favorite creator not found") {
    super(message);
    this.name = "FavoriteCreatorNotFoundError";
  }
}

/**
 * Interface for upserting a creator from external API
 */
export interface UpsertCreatorData {
  external_api_id: string;
  name: string;
  creator_role: CreatorRole;
  avatar_url: string | null;
}

/**
 * Creators Service
 * Handles read operations for the public creators dictionary
 */
export class CreatorsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get paginated list of creators with optional filtering
   *
   * Supports:
   * - Text search by name (ILIKE)
   * - Filtering by role (actor/director)
   * - Keyset pagination using cursor (UUID)
   *
   * @param query - Search and pagination parameters
   * @returns Paginated response with creators and next cursor
   * @throws Error for database errors
   */
  async getPaginatedCreators(query: CreatorSearchQuery): Promise<PaginatedResponse<CreatorDTO>> {
    const { q, role, limit = 20, cursor } = query;

    // Start building the query
    let queryBuilder = this.supabase
      .from("creators")
      .select("id, name, creator_role, avatar_url")
      .order("id", { ascending: true });

    // Apply text search filter if provided
    if (q) {
      queryBuilder = queryBuilder.ilike("name", `%${q}%`);
    }

    // Apply role filter if provided
    if (role) {
      queryBuilder = queryBuilder.eq("creator_role", role);
    }

    // Apply cursor-based pagination if cursor is provided
    if (cursor) {
      queryBuilder = queryBuilder.gt("id", cursor);
    }

    // Fetch limit + 1 to determine if there's a next page
    queryBuilder = queryBuilder.limit(limit + 1);

    // Execute the query
    const { data, error } = await queryBuilder;

    // Handle database errors
    if (error) {
      throw new Error(`Failed to fetch creators: ${error.message}`);
    }

    // Handle null data (shouldn't happen with select, but be defensive)
    if (!data) {
      return {
        data: [],
        next_cursor: null,
      };
    }

    // Determine if there's a next page
    const hasNextPage = data.length > limit;
    const creators = hasNextPage ? data.slice(0, limit) : data;

    // Calculate next cursor (ID of the last item in current page)
    const nextCursor = hasNextPage && creators.length > 0 ? creators[creators.length - 1].id : null;

    // Map to CreatorDTO (already matches the structure)
    const creatorsDTO: CreatorDTO[] = creators.map((creator) => ({
      id: creator.id,
      name: creator.name,
      creator_role: creator.creator_role,
      avatar_url: creator.avatar_url,
    }));

    return {
      data: creatorsDTO,
      next_cursor: nextCursor,
    };
  }

  /**
   * Get a single creator by ID
   *
   * @param id - Creator's UUID
   * @returns CreatorDTO with external ID format
   * @throws CreatorNotFoundError if creator doesn't exist
   * @throws Error for other database errors
   */
  async getCreatorById(id: UUID): Promise<CreatorDTO> {
    // Execute query
    const { data, error } = await this.supabase
      .from("creators")
      .select("id, external_api_id, name, creator_role, avatar_url")
      .eq("id", id)
      .single();

    // Handle database errors
    if (error) {
      // Check for not found error (PGRST116)
      if (error.code === "PGRST116") {
        throw new CreatorNotFoundError();
      }

      throw new Error(`Failed to fetch creator: ${error.message}`);
    }

    // Validate data was returned
    if (!data) {
      throw new CreatorNotFoundError();
    }

    // Return the DTO with external ID format
    return {
      id: `tmdb-${data.external_api_id}`,
      name: data.name,
      creator_role: data.creator_role,
      avatar_url: data.avatar_url,
    };
  }

  /**
   * Get paginated list of user's favorite creators
   *
   * Fetches creators from the user_creators junction table with JOIN to creators table.
   * Returns creators marked as favorites by the user with pagination support.
   *
   * @param userId - User's UUID from authenticated session
   * @param pagination - Pagination parameters (limit, cursor)
   * @returns Paginated response with favorite creators
   * @throws Error for database errors
   */
  async getFavorites(userId: UUID, pagination: PaginationQuery): Promise<PaginatedResponse<CreatorDTO>> {
    const { limit = 50, cursor } = pagination;

    // Build query: JOIN user_creators with creators table
    let queryBuilder = this.supabase
      .from("user_creators")
      .select("creator_id, creators(id, external_api_id, name, creator_role, avatar_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    // Apply cursor-based pagination if cursor is provided
    if (cursor) {
      queryBuilder = queryBuilder.gt("creator_id", cursor);
    }

    // Fetch limit + 1 to determine if there's a next page
    queryBuilder = queryBuilder.limit(limit + 1);

    // Execute the query
    const { data, error } = await queryBuilder;

    // Handle database errors
    if (error) {
      throw new Error(`Failed to fetch favorite creators: ${error.message}`);
    }

    // Handle null data
    if (!data) {
      return {
        data: [],
        next_cursor: null,
      };
    }

    // Determine if there's a next page
    const hasNextPage = data.length > limit;
    const favorites = hasNextPage ? data.slice(0, limit) : data;

    // Calculate next cursor (creator_id of the last item in current page)
    const nextCursor = hasNextPage && favorites.length > 0 ? favorites[favorites.length - 1].creator_id : null;

    // Map to CreatorDTO (extract nested creators data)
    const creatorsDTO: CreatorDTO[] = favorites
      .filter((item) => item.creators !== null)
      .map((item) => {
        const creator = item.creators as {
          id: string;
          external_api_id: string;
          name: string;
          creator_role: CreatorRole;
          avatar_url: string | null;
        };
        return {
          // Return external ID format for consistency with search results
          id: `tmdb-${creator.external_api_id}`,
          name: creator.name,
          creator_role: creator.creator_role,
          avatar_url: creator.avatar_url,
        };
      });

    return {
      data: creatorsDTO,
      next_cursor: nextCursor,
    };
  }

  /**
   * Upsert a creator from external API data
   *
   * Inserts or updates a creator in the database using data from external API.
   * Uses ON CONFLICT to handle duplicates based on (external_api_id, creator_role).
   *
   * @param data - Creator data from external API
   * @returns The upserted creator's UUID
   * @throws Error for database errors
   */
  async upsertCreatorFromExternalApi(data: UpsertCreatorData): Promise<UUID> {
    const { external_api_id, name, creator_role, avatar_url } = data;

    // Upsert the creator (insert or update if exists)
    const { data: upsertedData, error } = await this.supabase
      .from("creators")
      .upsert(
        {
          external_api_id,
          name,
          creator_role,
          avatar_url,
          last_synced_at: new Date().toISOString(),
        },
        {
          onConflict: "external_api_id,creator_role",
          ignoreDuplicates: false, // Update if exists
        }
      )
      .select("id")
      .single();

    // Handle database errors
    if (error) {
      throw new Error(`Failed to upsert creator: ${error.message}`);
    }

    // Validate data was returned
    if (!upsertedData) {
      throw new Error("Failed to upsert creator: no data returned");
    }

    return upsertedData.id;
  }

  /**
   * Add a creator to user's favorites (with external API integration)
   *
   * This method supports two workflows:
   * 1. Adding an existing creator by UUID (legacy)
   * 2. Adding a creator from external API data (new workflow)
   *
   * Creates a new entry in the user_creators junction table.
   * Handles duplicate entries by catching the unique constraint violation.
   *
   * @param userId - User's UUID from authenticated session
   * @param creatorId - Creator's UUID to add to favorites
   * @returns The creator that was added to favorites
   * @throws CreatorAlreadyFavoriteError if creator is already in favorites (409)
   * @throws CreatorNotFoundError if creator doesn't exist (404)
   * @throws Error for other database errors
   */
  async addFavorite(userId: UUID, creatorId: UUID): Promise<CreatorDTO> {
    // First, verify the creator exists
    const creator = await this.getCreatorById(creatorId);

    // Insert into user_creators junction table
    const { error } = await this.supabase.from("user_creators").insert({
      user_id: userId,
      creator_id: creatorId,
    });

    // Handle database errors
    if (error) {
      // Check for unique constraint violation (23505 = duplicate key)
      if (error.code === "23505") {
        throw new CreatorAlreadyFavoriteError();
      }

      throw new Error(`Failed to add favorite creator: ${error.message}`);
    }

    // Return the creator DTO
    return creator;
  }

  /**
   * Add a creator to user's favorites from external API data
   *
   * This method handles the complete workflow:
   * 1. Upsert the creator into the creators table (from external API data)
   * 2. Add the creator to user's favorites
   *
   * @param userId - User's UUID from authenticated session
   * @param creatorData - Creator data from external API (must include id in format "tmdb-{id}")
   * @returns The creator that was added to favorites
   * @throws CreatorAlreadyFavoriteError if creator is already in favorites (409)
   * @throws Error for other database errors
   */
  async addFavoriteFromExternalApi(userId: UUID, creatorData: CreatorDTO): Promise<CreatorDTO> {
    // Extract TMDb ID from the external ID format "tmdb-{id}"
    const externalApiId = creatorData.id.replace("tmdb-", "");

    // Upsert the creator into the database
    const creatorId = await this.upsertCreatorFromExternalApi({
      external_api_id: externalApiId,
      name: creatorData.name,
      creator_role: creatorData.creator_role,
      avatar_url: creatorData.avatar_url,
    });

    // Check if already in favorites
    const { data: existingFavorite } = await this.supabase
      .from("user_creators")
      .select("creator_id")
      .eq("user_id", userId)
      .eq("creator_id", creatorId)
      .single();

    if (existingFavorite) {
      throw new CreatorAlreadyFavoriteError();
    }

    // Insert into user_creators junction table
    const { error } = await this.supabase.from("user_creators").insert({
      user_id: userId,
      creator_id: creatorId,
    });

    // Handle database errors
    if (error) {
      // Check for unique constraint violation (23505 = duplicate key)
      if (error.code === "23505") {
        throw new CreatorAlreadyFavoriteError();
      }

      throw new Error(`Failed to add favorite creator: ${error.message}`);
    }

    // Return the creator DTO with the external ID format (for consistency with search results)
    return {
      ...creatorData,
      // Keep the original external ID format
      id: creatorData.id,
    };
  }

  /**
   * Remove a creator from user's favorites
   *
   * Deletes the entry from the user_creators junction table.
   * Verifies that the user owns the favorite before deletion.
   * Supports both UUID and external ID formats.
   *
   * @param userId - User's UUID from authenticated session
   * @param creatorIdOrExternalId - Creator's UUID or external ID (format: "tmdb-{id}")
   * @throws FavoriteCreatorNotFoundError if favorite doesn't exist or doesn't belong to user (404)
   * @throws Error for other database errors
   */
  async removeFavorite(userId: UUID, creatorIdOrExternalId: string): Promise<void> {
    let creatorId: UUID;

    // Check if ID is external ID format (tmdb-{id})
    if (creatorIdOrExternalId.startsWith("tmdb-")) {
      // Extract external API ID
      const externalApiId = creatorIdOrExternalId.replace("tmdb-", "");

      // Find creator UUID by external_api_id
      const { data: creator, error: findError } = await this.supabase
        .from("creators")
        .select("id")
        .eq("external_api_id", externalApiId)
        .single();

      if (findError || !creator) {
        throw new FavoriteCreatorNotFoundError();
      }

      creatorId = creator.id;
    } else {
      // ID is already a UUID
      creatorId = creatorIdOrExternalId;
    }

    // Delete from user_creators junction table
    const { error, count } = await this.supabase
      .from("user_creators")
      .delete({ count: "exact" })
      .eq("user_id", userId)
      .eq("creator_id", creatorId);

    // Handle database errors
    if (error) {
      throw new Error(`Failed to remove favorite creator: ${error.message}`);
    }

    // Check if any rows were deleted
    if (count === 0) {
      throw new FavoriteCreatorNotFoundError();
    }
  }
}
