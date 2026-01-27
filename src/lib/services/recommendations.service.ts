// src/lib/services/recommendations.service.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { RecommendationDTO, UUID, PlatformSlug } from "../../types";
import { VodService } from "./vod.service";
import { ConfigurationError } from "./vod.service.types";

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
 * Integrates with VodService to fetch recommendations based on:
 * 1. User's favorite creators (from database)
 * 2. User's subscribed platforms (from database)
 * 3. VOD availability (from TMDb + MOTN APIs)
 */
export class RecommendationsService {
  private vodService: VodService | null = null;

  constructor(private supabase: SupabaseClient) {
    // Initialize VodService if API keys are configured
    try {
      this.vodService = new VodService(supabase);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        console.warn("VodService not configured - falling back to mock data");
      } else {
        throw error;
      }
    }
  }

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

    // If VodService is not configured, fall back to mock data
    if (!this.vodService) {
      console.warn("VodService not available - using mock data");
      return this.getMockRecommendations(userId, limit, cursor);
    }

    try {
      // Fetch user's favorite creators from database with JOIN to get external_api_id
      const { data: userCreators, error: creatorsError } = await this.supabase
        .from("user_creators")
        .select("creators(external_api_id)")
        .eq("user_id", userId);

      console.log("[RecommendationsService] User creators query result:", {
        dataLength: userCreators?.length,
        sampleData: userCreators?.slice(0, 3),
        error: creatorsError,
      });

      if (creatorsError) {
        console.error("Failed to fetch user creators:", creatorsError);
        return this.getMockRecommendations(userId, limit, cursor);
      }

      // Fetch user's subscribed platforms from database
      const { data: userPlatforms, error: platformsError } = await this.supabase
        .from("user_platforms")
        .select("platforms(slug)")
        .eq("user_id", userId);

      console.log("[RecommendationsService] User platforms query result:", {
        data: userPlatforms,
        error: platformsError,
      });

      if (platformsError) {
        console.error("Failed to fetch user platforms:", platformsError);
        return this.getMockRecommendations(userId, limit, cursor);
      }

      // Extract external_api_ids and slugs
      const creatorExternalIds =
        userCreators
          ?.map((uc) => {
            const creator = uc.creators as { external_api_id: string } | null;
            return creator?.external_api_id;
          })
          .filter((id): id is string => id !== null && id !== undefined) || [];

      const platformSlugs =
        userPlatforms
          ?.map((up) => (up.platforms as { slug: string } | null)?.slug)
          .filter((slug): slug is PlatformSlug => slug !== null && slug !== undefined) || [];

      console.log("[RecommendationsService] Extracted data:", {
        creatorExternalIds,
        platformSlugs,
      });

      // Early return if user has no favorites or platforms
      if (creatorExternalIds.length === 0 || platformSlugs.length === 0) {
        return [];
      }

      // Fetch recommendations from VodService
      const recommendations = await this.vodService.getRecommendations(userId, platformSlugs, creatorExternalIds);

      // Apply cursor-based pagination
      let filteredRecommendations = recommendations;
      if (cursor) {
        const cursorIndex = recommendations.findIndex((rec) => rec.id === cursor);
        if (cursorIndex !== -1) {
          filteredRecommendations = recommendations.slice(cursorIndex + 1);
        }
      }

      // Apply limit
      return filteredRecommendations.slice(0, limit);
    } catch (error) {
      console.error("Failed to fetch recommendations from VodService:", error);
      // Fall back to mock data on error
      return this.getMockRecommendations(userId, limit, cursor);
    }
  }

  /**
   * Mock implementation for development
   * Simulates database response with realistic data
   * Generates 120 mock recommendations for testing infinite scroll
   *
   * @private
   */
  private getMockRecommendations(userId: UUID, limit: number, cursor?: UUID): RecommendationDTO[] {
    // Generate mock recommendations (120 items for testing infinite scroll)
    const allMockRecommendations: RecommendationDTO[] = this.generateMockData();

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

  /**
   * Generate 120 mock recommendations with variety of movies and series
   * @private
   */
  private generateMockData(): RecommendationDTO[] {
    const mockTitles = [
      {
        title: "The Matrix",
        year: 1999,
        type: "movie",
        id: "tt0133093",
        poster: "https://image.tmdb.org/t/p/w500/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
      },
      {
        title: "The Dark Knight",
        year: 2008,
        type: "movie",
        id: "tt0468569",
        poster: "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
      },
      {
        title: "Interstellar",
        year: 2014,
        type: "movie",
        id: "tt0816692",
        poster: "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      },
      {
        title: "The Shawshank Redemption",
        year: 1994,
        type: "movie",
        id: "tt0111161",
        poster: "https://image.tmdb.org/t/p/w500/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg",
      },
      {
        title: "Inception",
        year: 2010,
        type: "movie",
        id: "tt1375666",
        poster: "https://image.tmdb.org/t/p/w500/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg",
      },
      {
        title: "Pulp Fiction",
        year: 1994,
        type: "movie",
        id: "tt0110912",
        poster: "https://image.tmdb.org/t/p/w500/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
      },
      {
        title: "Fight Club",
        year: 1999,
        type: "movie",
        id: "tt0137523",
        poster: "https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      },
      {
        title: "Forrest Gump",
        year: 1994,
        type: "movie",
        id: "tt0109830",
        poster: "https://image.tmdb.org/t/p/w500/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg",
      },
      {
        title: "The Godfather",
        year: 1972,
        type: "movie",
        id: "tt0068646",
        poster: "https://image.tmdb.org/t/p/w500/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
      },
      {
        title: "Gladiator",
        year: 2000,
        type: "movie",
        id: "tt0172495",
        poster: "https://image.tmdb.org/t/p/w500/ty8TGRuvJLPUmAR1H1nRIsgwvim.jpg",
      },
      {
        title: "Game of Thrones",
        year: 2011,
        type: "series",
        id: "tt0944947",
        poster: "https://image.tmdb.org/t/p/w500/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      },
      {
        title: "Breaking Bad",
        year: 2008,
        type: "series",
        id: "tt0903747",
        poster: "https://image.tmdb.org/t/p/w500/ggFHVNu6YYI5L9pCfOacjizRGt.jpg",
      },
      {
        title: "Stranger Things",
        year: 2016,
        type: "series",
        id: "tt4574334",
        poster: "https://image.tmdb.org/t/p/w500/x2LSRK2Cm7MZhjluni1msVJ3wDF.jpg",
      },
      {
        title: "The Crown",
        year: 2016,
        type: "series",
        id: "tt4786824",
        poster: "https://image.tmdb.org/t/p/w500/1M876KPjulVwppEpldhdc8V4o68.jpg",
      },
      {
        title: "The Witcher",
        year: 2019,
        type: "series",
        id: "tt5180504",
        poster: "https://image.tmdb.org/t/p/w500/7vjaCdMw15FEbXyLQTVa04URsPm.jpg",
      },
      {
        title: "Avatar",
        year: 2009,
        type: "movie",
        id: "tt0499549",
        poster: "https://image.tmdb.org/t/p/w500/kyeqWdyUXW608qlYkRqosgbbJyK.jpg",
      },
      {
        title: "Avengers: Endgame",
        year: 2019,
        type: "movie",
        id: "tt4154796",
        poster: "https://image.tmdb.org/t/p/w500/or06FN3Dka5tukK1e9sl16pB3iy.jpg",
      },
      {
        title: "Titanic",
        year: 1997,
        type: "movie",
        id: "tt0120338",
        poster: "https://image.tmdb.org/t/p/w500/9xjZS2rlVxm8SFx8kPC3aIGCOYQ.jpg",
      },
      {
        title: "Jurassic Park",
        year: 1993,
        type: "movie",
        id: "tt0107290",
        poster: "https://image.tmdb.org/t/p/w500/oU7Oq2kFAAlGqbU4VoAE36g4hoI.jpg",
      },
      {
        title: "The Lion King",
        year: 1994,
        type: "movie",
        id: "tt0110357",
        poster: "https://image.tmdb.org/t/p/w500/sKCr78MXSLixwmZ8DyJLrpMsd15.jpg",
      },
    ];

    const actors = [
      "Leonardo DiCaprio",
      "Brad Pitt",
      "Tom Hanks",
      "Keanu Reeves",
      "Christian Bale",
      "Robert Downey Jr.",
      "Scarlett Johansson",
      "Jennifer Lawrence",
      "Meryl Streep",
      "Denzel Washington",
      "Morgan Freeman",
      "Samuel L. Jackson",
      "Will Smith",
      "Johnny Depp",
      "Matt Damon",
      "Ryan Gosling",
      "Emma Stone",
      "Natalie Portman",
      "Charlize Theron",
      "Cate Blanchett",
    ];

    const directors = [
      "Christopher Nolan",
      "Quentin Tarantino",
      "Steven Spielberg",
      "Martin Scorsese",
      "James Cameron",
      "Ridley Scott",
      "David Fincher",
      "Wes Anderson",
      "Denis Villeneuve",
      "Greta Gerwig",
      "Jordan Peele",
      "Bong Joon-ho",
      "Guillermo del Toro",
      "Peter Jackson",
    ];

    const platforms = ["netflix", "hbo-max", "disney-plus", "prime-video", "apple-tv"];

    const recommendations: RecommendationDTO[] = [];

    // Generate 120 recommendations by repeating and varying the base titles
    for (let i = 0; i < 120; i++) {
      const baseIndex = i % mockTitles.length;
      const base = mockTitles[baseIndex];
      const variation = Math.floor(i / mockTitles.length);

      // Vary the title slightly for uniqueness
      const title = variation > 0 ? `${base.title} (${variation + 1})` : base.title;

      // Generate unique IDs (proper UUID format: 8-4-4-4-12 hex chars)
      // Last segment must be exactly 12 chars: pad index to 8 chars + 4 char suffix
      const idNum = String(i + 1).padStart(8, "0");
      const id = `550e8400-e29b-41d4-a716-${idNum}0001`;

      // Select random actors and directors
      const actor1 = actors[i % actors.length];
      const actor2 = actors[(i + 7) % actors.length];
      const director = directors[i % directors.length];

      // Alternate favorite status
      const actorIsFavorite = i % 3 === 0;
      const directorIsFavorite = i % 5 === 0;

      // Select 1-3 random platforms
      const numPlatforms = (i % 3) + 1;
      const selectedPlatforms = platforms
        .slice(i % platforms.length, (i % platforms.length) + numPlatforms)
        .concat(platforms.slice(0, Math.max(0, numPlatforms - (platforms.length - (i % platforms.length)))));

      recommendations.push({
        id,
        external_movie_id: `${base.id}_${variation}`,
        media_type: base.type as "movie" | "series",
        title,
        year: base.year + variation * 2, // Vary year slightly
        poster_path: base.poster,
        creators: [
          {
            id: `650e8400-e29b-41d4-a716-${(i * 3 + 1).toString(16).padStart(12, "0")}`,
            name: actor1,
            creator_role: "actor",
            is_favorite: actorIsFavorite,
          },
          {
            id: `650e8400-e29b-41d4-a716-${(i * 3 + 2).toString(16).padStart(12, "0")}`,
            name: actor2,
            creator_role: "actor",
            is_favorite: false,
          },
          {
            id: `650e8400-e29b-41d4-a716-${(i * 3 + 3).toString(16).padStart(12, "0")}`,
            name: director,
            creator_role: "director",
            is_favorite: directorIsFavorite,
          },
        ],
        platforms: selectedPlatforms,
      });
    }

    return recommendations;
  }
}
