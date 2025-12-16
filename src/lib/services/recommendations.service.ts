// src/lib/services/recommendations.service.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { RecommendationDTO, UUID } from "../../types";

/**
 * Options for getting recommendations
 */
interface GetRecommendationsOptions {
  limit: number;
  cursor?: UUID;
}

/**
 * Recommendations Service
 * Handles fetching personalized recommendations for users
 *
 * Currently uses mock data for development.
 * Will be replaced with actual Supabase RPC call to `get_recommendations` function.
 */
export class RecommendationsService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get personalized recommendations for a user
   *
   * Returns up to 50 titles that match BOTH criteria:
   * 1. Have at least one creator marked as favorite by the user
   * 2. Are available on platforms the user subscribes to
   *
   * @param userId - The user's UUID
   * @param options - Pagination options (limit, cursor)
   * @returns Array of RecommendationDTO
   * @throws Error if database operation fails
   */
  async get(userId: UUID, options: GetRecommendationsOptions): Promise<RecommendationDTO[]> {
    const { limit, cursor } = options;

    // TODO: Replace with actual Supabase RPC call when database function is ready
    // const { data, error } = await this.supabase.rpc('get_recommendations', {
    //   user_id: userId,
    //   cursor: cursor || null,
    //   lim: limit
    // });
    //
    // if (error) {
    //   throw error;
    // }
    //
    // return data || [];

    // MOCK DATA for development
    return this.getMockRecommendations(userId, limit, cursor);
  }

  /**
   * Mock implementation for development
   * Simulates database response with realistic data
   *
   * @private
   */
  private getMockRecommendations(userId: UUID, limit: number, cursor?: UUID): RecommendationDTO[] {
    // Generate mock recommendations
    const allMockRecommendations: RecommendationDTO[] = [
      {
        id: "550e8400-e29b-41d4-a716-446655440001",
        external_movie_id: "tt0133093",
        media_type: "movie",
        title: "The Matrix",
        year: 1999,
        creators: [
          {
            id: "650e8400-e29b-41d4-a716-446655440001",
            name: "Keanu Reeves",
            creator_role: "actor",
            is_favorite: true,
          },
          {
            id: "650e8400-e29b-41d4-a716-446655440002",
            name: "Lana Wachowski",
            creator_role: "director",
            is_favorite: false,
          },
        ],
        platforms: ["netflix", "hbo-max"],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440002",
        external_movie_id: "tt0468569",
        media_type: "movie",
        title: "The Dark Knight",
        year: 2008,
        creators: [
          {
            id: "650e8400-e29b-41d4-a716-446655440003",
            name: "Christian Bale",
            creator_role: "actor",
            is_favorite: true,
          },
          {
            id: "650e8400-e29b-41d4-a716-446655440004",
            name: "Christopher Nolan",
            creator_role: "director",
            is_favorite: true,
          },
        ],
        platforms: ["netflix"],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440003",
        external_movie_id: "tt0816692",
        media_type: "movie",
        title: "Interstellar",
        year: 2014,
        creators: [
          {
            id: "650e8400-e29b-41d4-a716-446655440004",
            name: "Christopher Nolan",
            creator_role: "director",
            is_favorite: true,
          },
          {
            id: "650e8400-e29b-41d4-a716-446655440005",
            name: "Matthew McConaughey",
            creator_role: "actor",
            is_favorite: false,
          },
        ],
        platforms: ["hbo-max", "disney-plus"],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440004",
        external_movie_id: "tt0111161",
        media_type: "movie",
        title: "The Shawshank Redemption",
        year: 1994,
        creators: [
          {
            id: "650e8400-e29b-41d4-a716-446655440006",
            name: "Tim Robbins",
            creator_role: "actor",
            is_favorite: true,
          },
          {
            id: "650e8400-e29b-41d4-a716-446655440007",
            name: "Morgan Freeman",
            creator_role: "actor",
            is_favorite: false,
          },
        ],
        platforms: ["netflix", "prime-video"],
      },
      {
        id: "550e8400-e29b-41d4-a716-446655440005",
        external_movie_id: "tt0944947",
        media_type: "series",
        title: "Game of Thrones",
        year: 2011,
        creators: [
          {
            id: "650e8400-e29b-41d4-a716-446655440008",
            name: "Emilia Clarke",
            creator_role: "actor",
            is_favorite: true,
          },
          {
            id: "650e8400-e29b-41d4-a716-446655440009",
            name: "Kit Harington",
            creator_role: "actor",
            is_favorite: false,
          },
        ],
        platforms: ["hbo-max"],
      },
    ];

    // Simulate cursor-based pagination
    let startIndex = 0;
    if (cursor) {
      const cursorIndex = allMockRecommendations.findIndex((rec) => rec.id === cursor);
      if (cursorIndex !== -1) {
        startIndex = cursorIndex + 1;
      }
    }

    // Return slice based on limit
    return allMockRecommendations.slice(startIndex, startIndex + limit);
  }
}
