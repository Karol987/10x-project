// src/lib/services/platforms.service.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { PlatformDTO, UUID } from "../../types";

/**
 * Service class for managing platform-related operations.
 * Platforms are dictionary data (Netflix, HBO Max, etc.) and are publicly accessible.
 */
export class PlatformsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Retrieves all available platforms from the database.
   * This is public dictionary data suitable for aggressive caching.
   *
   * @returns Array of PlatformDTO objects
   * @throws Error if database query fails
   */
  async getAllPlatforms(): Promise<PlatformDTO[]> {
    const { data, error } = await this.supabase
      .from("platforms")
      .select("id, slug, name, logo_url")
      .order("name", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch platforms: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    return data;
  }

  /**
   * Retrieves a single platform by its unique slug.
   *
   * @param slug - URL-friendly platform identifier (e.g., "netflix", "hbo-max")
   * @returns PlatformDTO object or null if not found
   * @throws Error if database query fails
   */
  async getPlatformBySlug(slug: string): Promise<PlatformDTO | null> {
    const { data, error } = await this.supabase
      .from("platforms")
      .select("id, slug, name, logo_url")
      .eq("slug", slug)
      .single();

    if (error) {
      // Handle "not found" case separately from other errors
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch platform: ${error.message}`);
    }

    return data;
  }

  /**
   * Retrieves all platforms subscribed by a specific user.
   * Uses a join to fetch full platform details from user_platforms table.
   *
   * @param userId - The UUID of the user
   * @returns Array of PlatformDTO objects representing user's subscribed platforms
   * @throws Error if database query fails
   */
  async getUserPlatforms(userId: UUID): Promise<PlatformDTO[]> {
    const { data, error } = await this.supabase
      .from("user_platforms")
      .select("platform:platforms(id, slug, name, logo_url)")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch user platforms: ${error.message}`);
    }

    if (!data) {
      return [];
    }

    // Extract platform data from the join result
    // Filter out any null values that might occur if FK constraint is violated
    return data.map((item) => item.platform).filter((platform): platform is PlatformDTO => platform !== null);
  }

  /**
   * Replaces all user's platform subscriptions with a new set.
   * This is a full replace operation (not a merge).
   *
   * Steps:
   * 1. Delete all existing user_platforms entries for the user
   * 2. Insert new entries for the provided platform_ids
   * 3. Fetch and return the updated list of platforms
   *
   * @param userId - The UUID of the user
   * @param platformIds - Array of platform UUIDs to subscribe to
   * @returns Array of PlatformDTO objects representing the new subscription list
   * @throws Error if database operation fails (including FK constraint violations)
   */
  async replaceUserPlatforms(userId: UUID, platformIds: UUID[]): Promise<PlatformDTO[]> {
    console.log('DEBUG: replaceUserPlatforms', { userId, platformIds });
    
    // Step 1: Delete all existing user platforms
    const { error: deleteError } = await this.supabase.from("user_platforms").delete().eq("user_id", userId);

    if (deleteError) {
      console.error('DEBUG: Delete error', deleteError);
      throw new Error(`Failed to delete existing user platforms: ${deleteError.message}`);
    }

    // Step 2: Insert new platform subscriptions (skip if empty array)
    if (platformIds.length > 0) {
      const insertData = platformIds.map((platformId) => ({
        user_id: userId,
        platform_id: platformId,
      }));

      console.log('DEBUG: Inserting data', insertData);
      const { error: insertError } = await this.supabase.from("user_platforms").insert(insertData);

      if (insertError) {
        console.error('DEBUG: Insert error', insertError);
        // FK constraint violation means invalid platform ID was provided
        if (insertError.code === "23503") {
          throw new Error("One or more platform IDs are invalid");
        }
        throw new Error(`Failed to insert user platforms: ${insertError.message}`);
      }
    }

    // Step 3: Fetch and return the updated list
    return this.getUserPlatforms(userId);
  }
}
