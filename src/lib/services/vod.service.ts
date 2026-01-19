// src/lib/services/vod.service.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { CreatorDTO, RecommendationDTO, UUID, PlatformSlug } from "../../types";
import {
  TmdbPersonSearchResponseSchema,
  TmdbPersonSchema,
  TmdbMovieCreditsResponseSchema,
  MotnShowResponseSchema,
  PLATFORM_MAPPING,
  TMDB_IMAGE_BASE_URL,
  CACHE_TTL_MS,
  ApiRateLimitError,
  ExternalApiError,
  ConfigurationError,
  type TmdbPerson,
  type TmdbMovie,
  type VodCacheEntry,
  type CachedAvailability,
} from "./vod.service.types";

/**
 * Mapping of movie ID to creators who worked on it
 */
interface CreatorMovieInfo {
  creatorId: number;
  role: 'actor' | 'director';
  name: string;
}

/**
 * Result type for availability fetching with metadata
 */
interface AvailabilityResult {
  availabilityMap: Map<number, CachedAvailability[]>;
  apiCallsMade: number;
  cacheHits: number;
}

/**
 * VOD Service
 * Handles integration with TMDb and Movie of the Night APIs
 * Implements hybrid approach: TMDb for metadata, MOTN for availability
 */
export class VodService {
  private readonly tmdbApiKey: string;
  private readonly rapidApiKey: string;
  private readonly rapidApiHost: string;
  private readonly tmdbBaseUrl = "https://api.themoviedb.org/3";
  private readonly motnBaseUrl = "https://streaming-availability.p.rapidapi.com";

  constructor(private supabase: SupabaseClient) {
    // Validate required environment variables
    this.tmdbApiKey = import.meta.env.TMDB_API_KEY;
    this.rapidApiKey = import.meta.env.RAPIDAPI_KEY;
    this.rapidApiHost = import.meta.env.RAPIDAPI_HOST || "streaming-availability.p.rapidapi.com";

    if (!this.tmdbApiKey) {
      throw new ConfigurationError("TMDB_API_KEY is not configured");
    }

    if (!this.rapidApiKey) {
      throw new ConfigurationError("RAPIDAPI_KEY is not configured");
    }
  }

  /* ------------------------------------------------------------------ */
  /* Private HTTP Methods                                               */
  /* ------------------------------------------------------------------ */

  /**
   * Fetch data from TMDb API
   * Handles authentication and error responses
   *
   * @param endpoint - API endpoint (e.g., "/search/person")
   * @param params - Query parameters
   * @returns Parsed response data
   * @throws ExternalApiError for HTTP errors
   */
  private async fetchFromTmdb<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    // Build URL with query parameters
    const url = new URL(`${this.tmdbBaseUrl}${endpoint}`);
    url.searchParams.append("api_key", this.tmdbApiKey);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      });

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 429) {
          throw new ApiRateLimitError("TMDb API rate limit exceeded");
        }

        throw new ExternalApiError(`TMDb API error: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof ApiRateLimitError || error instanceof ExternalApiError) {
        throw error;
      }

      throw new ExternalApiError(`Failed to fetch from TMDb: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Fetch data from Movie of the Night API (via RapidAPI)
   * Handles authentication and error responses
   *
   * @param endpoint - API endpoint (e.g., "/shows/tt1234567")
   * @param params - Query parameters
   * @returns Parsed response data
   * @throws ExternalApiError for HTTP errors
   * @throws ApiRateLimitError for rate limiting (429)
   */
  private async fetchFromMotn<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    // Build URL with query parameters
    const url = new URL(`${this.motnBaseUrl}${endpoint}`);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    try {
      // Add timeout to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": this.rapidApiKey,
          "X-RapidAPI-Host": this.rapidApiHost,
          Accept: "application/json",
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        if (response.status === 429) {
          throw new ApiRateLimitError("Movie of the Night API rate limit exceeded (100 requests/day)");
        }

        if (response.status === 404) {
          // Not found is not an error for MOTN - movie might not be in their database
          return { result: null } as T;
        }

        throw new ExternalApiError(`MOTN API error: ${response.statusText}`, response.status);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      if (error instanceof ApiRateLimitError || error instanceof ExternalApiError) {
        throw error;
      }

      // Handle timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ExternalApiError('MOTN API request timeout after 15 seconds');
      }

      throw new ExternalApiError(`Failed to fetch from MOTN: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Public API Methods                                                 */
  /* ------------------------------------------------------------------ */

  /**
   * Get watched movie IDs for a user
   * Used to filter out already watched movies from recommendations
   *
   * @param userId - User's UUID
   * @returns Set of external movie IDs (TMDb IDs as strings)
   * @private
   */
  private async getWatchedMovieIds(userId: UUID): Promise<Set<string>> {
    const { data, error } = await this.supabase
      .from("watched_items")
      .select("external_movie_id")
      .eq("user_id", userId);

    if (error) {
      console.error("Failed to fetch watched items:", error);
      // Return empty set on error - don't break recommendations
      return new Set();
    }

    // Build set of watched external IDs
    const watchedIds = new Set<string>();
    if (data) {
      for (const item of data) {
        watchedIds.add(item.external_movie_id);
      }
    }

    return watchedIds;
  }

  /**
   * Search for creators by name
   * Uses TMDb person search API
   *
   * @param query - Search query string
   * @returns Array of CreatorDTO
   * @throws ExternalApiError for API failures
   */
  async searchCreators(query: string): Promise<CreatorDTO[]> {
    // Early return for empty query
    if (!query || query.trim().length === 0) {
      return [];
    }

    // Fetch from TMDb
    const response = await this.fetchFromTmdb<unknown>("/search/person", {
      query: query.trim(),
      language: "en-US",
      page: "1",
    });

    // Validate response schema
    const validatedResponse = TmdbPersonSearchResponseSchema.parse(response);

    // Filter and map results to CreatorDTO
    const creators: CreatorDTO[] = validatedResponse.results
      .filter((person) => {
        // Filter out persons without profile picture
        if (!person.profile_path) {
          return false;
        }

        // Filter by known department (actors and directors)
        const department = person.known_for_department?.toLowerCase();
        return department === "acting" || department === "directing";
      })
      .map((person) => this.mapTmdbPersonToCreatorDTO(person));

    return creators;
  }

  /**
   * Get recommendations for user based on favorite creators and platforms
   * Implements hybrid approach: TMDb for filmography, MOTN for availability
   * Uses iterative batching to ensure sufficient results without overwhelming the API
   *
   * @param userId - User's UUID
   * @param platformSlugs - Array of platform slugs user subscribes to
   * @param creatorExternalIds - Array of creator external API IDs (TMDb person IDs as strings)
   * @returns Array of RecommendationDTO
   * @throws ExternalApiError for API failures
   */
  async getRecommendations(
    userId: UUID,
    platformSlugs: PlatformSlug[],
    creatorExternalIds: string[]
  ): Promise<RecommendationDTO[]> {
    console.log('[VodService] getRecommendations called', { 
      userId, 
      platformSlugs, 
      creatorExternalIds 
    });

    // Configuration for batched fetching
    const TARGET_RECOMMENDATION_COUNT = 20; // Target number of recommendations to return
    const BATCH_SIZE = 10; // Number of movies to check per batch
    const MAX_API_CALLS_PER_REQUEST = 15; // Safety limit to preserve daily quota (100/day)
    const MAX_RESULTS = 50; // Hard limit per PRD

    // Early return for invalid input
    if (creatorExternalIds.length === 0 || platformSlugs.length === 0) {
      console.log('[VodService] Early return: no creators or platforms');
      return [];
    }

    // Step 1: Fetch user's watched items to exclude from recommendations
    const watchedExternalIds = await this.getWatchedMovieIds(userId);
    console.log('[VodService] User has watched', watchedExternalIds.size, 'items');

    // Step 2: Parse external API IDs to integers (TMDb person IDs)
    const tmdbCreatorIds = creatorExternalIds
      .map((id) => {
        const parsed = parseInt(id, 10);
        return isNaN(parsed) ? null : parsed;
      })
      .filter((id): id is number => id !== null);

    console.log('[VodService] Parsed TMDb creator IDs:', tmdbCreatorIds);

    if (tmdbCreatorIds.length === 0) {
      console.log('[VodService] No valid TMDb creator IDs found');
      return [];
    }

    // Step 3: Fetch filmography for all creators and build creator-movie mapping
    const { movies: allMovies, creatorMovieMap } = await this.fetchFilmographyForCreators(tmdbCreatorIds);
    console.log('[VodService] Fetched movies from filmography:', allMovies.length);

    // Step 4: Filter out already watched movies
    const unwatchedMovies = allMovies.filter((movie) => {
      const externalId = movie.id.toString();
      return !watchedExternalIds.has(externalId);
    });
    console.log('[VodService] Unwatched movies after filtering:', unwatchedMovies.length);

    // Step 5: Deduplicate movies by TMDb ID
    const uniqueMovies = this.deduplicateMovies(unwatchedMovies);
    console.log('[VodService] Unique movies after deduplication:', uniqueMovies.length);

    // Step 6: Sort by release date (newest first)
    const sortedMovies = this.sortMoviesByReleaseDate(uniqueMovies);
    console.log('[VodService] Sorted movies (top 5):', sortedMovies.slice(0, 5).map(m => ({ id: m.id, title: m.title, release_date: m.release_date })));

    // Step 7: Iterative batching to collect recommendations until target is met
    const recommendations: RecommendationDTO[] = [];
    let totalApiCalls = 0;
    let processedCount = 0;
    
    console.log(`[VodService] Starting iterative fetch (target: ${TARGET_RECOMMENDATION_COUNT}, max API calls: ${MAX_API_CALLS_PER_REQUEST})`);

    while (
      recommendations.length < TARGET_RECOMMENDATION_COUNT &&
      processedCount < sortedMovies.length &&
      totalApiCalls < MAX_API_CALLS_PER_REQUEST
    ) {
      // Get next batch of movies to check
      const batch = sortedMovies.slice(processedCount, processedCount + BATCH_SIZE);
      const batchIds = batch.map(m => m.id);
      
      console.log(`[VodService] Batch ${Math.floor(processedCount / BATCH_SIZE) + 1}: Checking ${batch.length} movies (processed: ${processedCount}/${sortedMovies.length})`);

      // Fetch availability for this batch
      const remainingApiCalls = MAX_API_CALLS_PER_REQUEST - totalApiCalls;
      const result = await this.getAvailabilityForMovies(batchIds, "pl", remainingApiCalls);
      
      totalApiCalls += result.apiCallsMade;
      console.log(`[VodService] Batch completed: ${result.apiCallsMade} API calls, ${result.cacheHits} cache hits, total API calls: ${totalApiCalls}`);

      // Filter batch movies by availability on user's platforms
      for (const movie of batch) {
        const availability = result.availabilityMap.get(movie.id) || [];
        const subscriptionOnly = this.filterSubscriptionOnly(availability);
        
        if (this.isAvailableOnUserPlatforms(subscriptionOnly, platformSlugs)) {
          const recommendation = this.mapMovieToRecommendationDTO(
            movie, 
            subscriptionOnly, 
            platformSlugs, 
            creatorExternalIds, 
            creatorMovieMap
          );
          recommendations.push(recommendation);
          
          // Check if we've hit our target
          if (recommendations.length >= TARGET_RECOMMENDATION_COUNT) {
            console.log(`[VodService] Target reached: ${recommendations.length} recommendations found`);
            break;
          }
        }
      }

      processedCount += batch.length;
      
      console.log(`[VodService] Progress: ${recommendations.length} recommendations found, ${processedCount} movies processed, ${totalApiCalls} API calls made`);
    }

    // Step 8: Final limiting and reporting
    const finalRecommendations = recommendations.slice(0, MAX_RESULTS);
    
    console.log(`[VodService] Fetch complete:`, {
      recommendationsFound: finalRecommendations.length,
      moviesProcessed: processedCount,
      totalMovies: sortedMovies.length,
      apiCallsMade: totalApiCalls,
      maxApiCalls: MAX_API_CALLS_PER_REQUEST,
    });

    return finalRecommendations;
  }

  /* ------------------------------------------------------------------ */
  /* Private Filmography Methods                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Fetch filmography for multiple creators
   * Fetches movie credits from TMDb for each creator and tracks which creator worked on which movie
   *
   * @param tmdbCreatorIds - Array of TMDb person IDs
   * @returns Object containing movies array and creator-movie mapping
   */
  private async fetchFilmographyForCreators(tmdbCreatorIds: number[]): Promise<{
    movies: TmdbMovie[];
    creatorMovieMap: Map<number, CreatorMovieInfo[]>;
  }> {
    const allMovies: TmdbMovie[] = [];
    const creatorMovieMap = new Map<number, CreatorMovieInfo[]>();

    // Fetch filmography for each creator sequentially
    // (Could be parallelized with Promise.all, but be mindful of rate limits)
    for (const creatorId of tmdbCreatorIds) {
      try {
        // Fetch both movie credits and person details
        const [creditsResponse, personResponse] = await Promise.all([
          this.fetchFromTmdb<unknown>(`/person/${creatorId}/movie_credits`),
          this.fetchFromTmdb<unknown>(`/person/${creatorId}`)
        ]);

        // Validate response schemas
        const validatedCredits = TmdbMovieCreditsResponseSchema.parse(creditsResponse);
        const validatedPerson = TmdbPersonSchema.parse(personResponse);

        const creatorName = validatedPerson.name;

        // Process cast movies (actor role)
        for (const movie of validatedCredits.cast) {
          allMovies.push(movie);
          
          const existing = creatorMovieMap.get(movie.id) || [];
          // Check if creator already exists for this movie with this role
          const alreadyExists = existing.some(c => c.creatorId === creatorId && c.role === 'actor');
          if (!alreadyExists) {
            existing.push({
              creatorId,
              role: 'actor',
              name: creatorName,
            });
            creatorMovieMap.set(movie.id, existing);
          }
        }

        // Process crew movies (check specific job)
        for (const crewCredit of validatedCredits.crew) {
          // Only include Directors - ignore other crew roles (producers, writers, etc.)
          if (crewCredit.job !== 'Director') {
            continue;
          }

          allMovies.push(crewCredit);
          
          const existing = creatorMovieMap.get(crewCredit.id) || [];
          // Check if creator already exists for this movie with this role
          const alreadyExists = existing.some(c => c.creatorId === creatorId && c.role === 'director');
          if (!alreadyExists) {
            existing.push({
              creatorId,
              role: 'director',
              name: creatorName,
            });
            creatorMovieMap.set(crewCredit.id, existing);
          }
        }
      } catch (error) {
        // Log error but continue with other creators
        console.error(`Failed to fetch filmography for creator ${creatorId}:`, error);
      }
    }

    return { movies: allMovies, creatorMovieMap };
  }

  /**
   * Deduplicate movies by TMDb ID
   * Keeps the first occurrence of each movie
   *
   * @param movies - Array of movies (may contain duplicates)
   * @returns Array of unique movies
   */
  private deduplicateMovies(movies: TmdbMovie[]): TmdbMovie[] {
    const seen = new Set<number>();
    const unique: TmdbMovie[] = [];

    for (const movie of movies) {
      if (!seen.has(movie.id)) {
        seen.add(movie.id);
        unique.push(movie);
      }
    }

    return unique;
  }

  /**
   * Sort movies by release date (newest first)
   * Movies without release date are placed at the end
   *
   * @param movies - Array of movies to sort
   * @returns Sorted array of movies
   */
  private sortMoviesByReleaseDate(movies: TmdbMovie[]): TmdbMovie[] {
    return [...movies].sort((a, b) => {
      // Handle missing release dates
      if (!a.release_date && !b.release_date) return 0;
      if (!a.release_date) return 1;
      if (!b.release_date) return -1;

      // Parse dates and compare
      const dateA = new Date(a.release_date);
      const dateB = new Date(b.release_date);

      return dateB.getTime() - dateA.getTime(); // Descending order (newest first)
    });
  }

  /**
   * Map TMDb movie and availability data to RecommendationDTO
   *
   * @param movie - TMDb movie object
   * @param availability - Availability data for the movie
   * @param platformSlugs - User's platform slugs
   * @param creatorExternalIds - User's creator external API IDs
   * @param creatorMovieMap - Mapping of movie ID to creators
   * @returns RecommendationDTO
   */
  private mapMovieToRecommendationDTO(
    movie: TmdbMovie,
    availability: CachedAvailability[],
    platformSlugs: PlatformSlug[],
    creatorExternalIds: string[],
    creatorMovieMap: Map<number, CreatorMovieInfo[]>
  ): RecommendationDTO {
    // Extract platforms from availability
    const platforms = this.extractPlatformSlugs(availability, platformSlugs);

    // Extract year from release date
    const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;

    // Build poster URL
    const posterPath = movie.poster_path ? `${TMDB_IMAGE_BASE_URL}${movie.poster_path}` : undefined;

    // Extract creators from the creator-movie mapping
    const movieCreators = creatorMovieMap.get(movie.id) || [];
    
    // Convert creator external IDs to numbers for comparison
    const favoriteCreatorIds = new Set(
      creatorExternalIds
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id))
    );

    // Map to RecommendationCreatorDTO format
    const creators: RecommendationDTO["creators"] = movieCreators.map(creator => ({
      id: `tmdb-${creator.creatorId}`,
      name: creator.name,
      creator_role: creator.role,
      is_favorite: favoriteCreatorIds.has(creator.creatorId),
    }));

    return {
      id: `tmdb-movie-${movie.id}`, // Generate unique ID
      external_movie_id: movie.id.toString(),
      media_type: "movie",
      title: movie.title,
      year,
      creators,
      platforms,
      poster_path: posterPath,
    };
  }

  /**
   * Extract platform slugs from availability data
   * Only includes platforms that user subscribes to
   *
   * @param availability - Availability data
   * @param platformSlugs - User's platform slugs
   * @returns Array of unique platform slugs where movie is available
   */
  private extractPlatformSlugs(
    availability: CachedAvailability[],
    platformSlugs: PlatformSlug[]
  ): PlatformSlug[] {
    // Create reverse mapping: service ID -> platform slug
    const reverseMapping: Record<string, PlatformSlug> = {};
    for (const [slug, serviceId] of Object.entries(PLATFORM_MAPPING)) {
      reverseMapping[serviceId] = slug as PlatformSlug;
    }

    // Extract platform slugs from availability
    const availablePlatforms = availability
      .map((item) => reverseMapping[item.serviceId])
      .filter((slug): slug is PlatformSlug => slug !== undefined);

    // Filter to only user's platforms and remove duplicates
    const userPlatforms = availablePlatforms.filter((slug) => platformSlugs.includes(slug));
    return Array.from(new Set(userPlatforms));
  }

  /* ------------------------------------------------------------------ */
  /* Private Cache Methods                                              */
  /* ------------------------------------------------------------------ */

  /**
   * Get cached availability data for multiple movies
   * Returns only fresh entries (within 24h TTL)
   *
   * @param tmdbIds - Array of TMDb movie IDs
   * @param countryCode - ISO country code (e.g., 'pl')
   * @returns Map of tmdbId -> cached availability data
   */
  private async getCachedAvailability(
    tmdbIds: number[],
    countryCode: string
  ): Promise<Map<number, CachedAvailability[]>> {
    // Early return for empty input
    if (tmdbIds.length === 0) {
      return new Map();
    }

    // Calculate TTL cutoff timestamp
    const ttlCutoff = new Date(Date.now() - CACHE_TTL_MS).toISOString();

    // Query cache table
    const { data, error } = await this.supabase
      .from("vod_availability_cache")
      .select("tmdb_id, availability_data, last_updated_at")
      .in("tmdb_id", tmdbIds)
      .eq("country_code", countryCode)
      .gt("last_updated_at", ttlCutoff);

    // Handle database errors
    if (error) {
      console.error("Failed to fetch from cache:", error);
      // Don't throw - gracefully degrade to fetching from API
      return new Map();
    }

    // Build result map
    const cacheMap = new Map<number, CachedAvailability[]>();

    if (data) {
      for (const entry of data) {
        cacheMap.set(entry.tmdb_id, entry.availability_data as CachedAvailability[]);
      }
    }

    return cacheMap;
  }

  /**
   * Save availability data to cache
   * Uses upsert to handle both new entries and updates
   *
   * @param tmdbId - TMDb movie ID
   * @param countryCode - ISO country code
   * @param availability - Availability data to cache
   */
  private async saveToCache(
    tmdbId: number,
    countryCode: string,
    availability: CachedAvailability[]
  ): Promise<void> {
    const { error } = await this.supabase.from("vod_availability_cache").upsert(
      {
        tmdb_id: tmdbId,
        country_code: countryCode,
        availability_data: availability,
        last_updated_at: new Date().toISOString(),
      },
      {
        onConflict: "tmdb_id,country_code",
      }
    );

    if (error) {
      // Log error but don't throw - caching failure shouldn't break the flow
      console.error("Failed to save to cache:", error);
    }
  }

  /**
   * Fetch availability from MOTN API for a single movie
   * Handles rate limiting gracefully by returning empty array
   *
   * @param tmdbId - TMDb movie ID
   * @param countryCode - ISO country code
   * @returns Array of availability data or empty array on error
   */
  private async fetchAvailabilityFromMotn(
    tmdbId: number,
    countryCode: string
  ): Promise<CachedAvailability[]> {
    try {
      // Fetch from MOTN using TMDb ID with movie/ prefix
      // Note: MOTN API requires format "movie/{tmdbId}" for movies
      const response = await this.fetchFromMotn<unknown>(`/shows/movie/${tmdbId}`, {
        country: countryCode,
      });

      // Validate response schema
      const validatedResponse = MotnShowResponseSchema.parse(response);

      // Check if response indicates "not found" (result: null)
      if ('result' in validatedResponse && validatedResponse.result === null) {
        return [];
      }

      // Handle show object (direct format)
      if (!('result' in validatedResponse)) {
        const show = validatedResponse;
        
        // Check for NEW API format (streamingOptions)
        if (show.streamingOptions) {
          const countryOptions = show.streamingOptions[countryCode];
          if (!countryOptions || countryOptions.length === 0) {
            return [];
          }

          // Transform to CachedAvailability format
          const availability: CachedAvailability[] = countryOptions.map((option) => ({
            serviceId: option.service.id,
            name: option.service.name,
            link: option.link,
            type: option.type as "subscription" | "rent" | "buy",
          }));

          return availability;
        }
        
        // Check for OLD API format (streamingInfo) - for backward compatibility
        if (show.streamingInfo) {
          const countryInfo = show.streamingInfo[countryCode];
          if (!countryInfo) {
            return [];
          }

          // Transform to CachedAvailability format (old format)
          const availability: CachedAvailability[] = [];

          for (const [serviceId, serviceInfo] of Object.entries(countryInfo)) {
            if (serviceInfo.subscription?.available) {
              availability.push({
                serviceId,
                name: this.getServiceName(serviceId),
                link: serviceInfo.subscription.link || "",
                type: "subscription",
              });
            }

            if (serviceInfo.rent?.available) {
              availability.push({
                serviceId,
                name: this.getServiceName(serviceId),
                link: serviceInfo.rent.link || "",
                type: "rent",
              });
            }

            if (serviceInfo.buy?.available) {
              availability.push({
                serviceId,
                name: this.getServiceName(serviceId),
                link: serviceInfo.buy.link || "",
                type: "buy",
              });
            }
          }

          return availability;
        }

        // No streaming data available
        return [];
      }

      // Fallback: unknown response format
      return [];
    } catch (error) {
      // Handle rate limiting gracefully
      if (error instanceof ApiRateLimitError) {
        console.warn(`[VodService] MOTN API rate limit reached for TMDb ID ${tmdbId}`);
        return [];
      }

      // Log other errors but don't throw
      console.error(`[VodService] Failed to fetch availability for TMDb ID ${tmdbId}:`, error);
      return [];
    }
  }

  /**
   * Get availability data for multiple movies
   * Uses cache first, then fetches missing data from MOTN
   * Returns metadata about API usage for intelligent batching
   *
   * @param tmdbIds - Array of TMDb movie IDs
   * @param countryCode - ISO country code
   * @param maxApiFetches - Maximum number of API calls to make (optional, defaults to all missing)
   * @returns Object with availability map and metadata
   */
  private async getAvailabilityForMovies(
    tmdbIds: number[],
    countryCode: string,
    maxApiFetches?: number
  ): Promise<AvailabilityResult> {
    console.log(`[VodService] Checking availability for ${tmdbIds.length} movies in country: ${countryCode}`);
    
    // Step 1: Check cache
    const cachedData = await this.getCachedAvailability(tmdbIds, countryCode);
    const cacheHits = cachedData.size;
    console.log(`[VodService] Cache hits: ${cacheHits}/${tmdbIds.length} movies found in cache`);

    // Step 2: Identify missing movies
    const missingIds = tmdbIds.filter((id) => !cachedData.has(id));
    console.log(`[VodService] Cache misses: ${missingIds.length} movies need API fetch`);

    // Step 3: Fetch missing data from MOTN (with optional limit)
    const idsToFetch = maxApiFetches !== undefined 
      ? missingIds.slice(0, maxApiFetches)
      : missingIds;
    
    let apiCallsMade = 0;
    
    if (idsToFetch.length > 0) {
      console.log(`[VodService] Fetching ${idsToFetch.length} movies from MOTN API`);
      
      for (const tmdbId of idsToFetch) {
        const availability = await this.fetchAvailabilityFromMotn(tmdbId, countryCode);

        // Save to cache (both empty and non-empty results)
        await this.saveToCache(tmdbId, countryCode, availability);

        // Add to result map
        cachedData.set(tmdbId, availability);
        
        apiCallsMade++;
        if (apiCallsMade % 5 === 0) {
          console.log(`[VodService] Progress: ${apiCallsMade}/${idsToFetch.length} movies fetched`);
        }
      }
      
      console.log(`[VodService] Completed: ${apiCallsMade} movies fetched and cached`);
    }

    return {
      availabilityMap: cachedData,
      apiCallsMade,
      cacheHits,
    };
  }

  /* ------------------------------------------------------------------ */
  /* Private Helper Methods                                             */
  /* ------------------------------------------------------------------ */

  /**
   * Map TMDb person to CreatorDTO
   *
   * @param person - TMDb person object
   * @returns CreatorDTO
   */
  private mapTmdbPersonToCreatorDTO(person: TmdbPerson): CreatorDTO {
    const department = person.known_for_department?.toLowerCase();
    const role = department === "directing" ? ("director" as const) : ("actor" as const);

    return {
      // Generate a temporary ID based on TMDb ID
      // In production, this should be stored in database
      id: `tmdb-${person.id}`,
      name: person.name,
      creator_role: role,
      avatar_url: person.profile_path ? `${TMDB_IMAGE_BASE_URL}${person.profile_path}` : null,
    };
  }

  /**
   * Get human-readable service name from service ID
   *
   * @param serviceId - MOTN service ID (e.g., 'netflix', 'hbo')
   * @returns Human-readable service name
   */
  private getServiceName(serviceId: string): string {
    const serviceNames: Record<string, string> = {
      netflix: "Netflix",
      hbo: "HBO Max",
      disney: "Disney+",
      prime: "Amazon Prime Video",
      apple: "Apple TV+",
      mubi: "Mubi",
      zee5: "Zee5",
      paramount: "Paramount+",
    };

    return serviceNames[serviceId] || serviceId;
  }

  /**
   * Filter availability data to only include subscription options
   * Excludes rent and buy options per PRD requirements
   *
   * @param availability - Array of availability data
   * @returns Filtered array with only subscription options
   */
  private filterSubscriptionOnly(availability: CachedAvailability[]): CachedAvailability[] {
    return availability.filter((item) => item.type === "subscription");
  }

  /**
   * Check if movie is available on any of user's platforms
   *
   * @param availability - Movie availability data
   * @param platformSlugs - User's platform slugs
   * @returns True if movie is available on at least one user platform
   */
  private isAvailableOnUserPlatforms(
    availability: CachedAvailability[],
    platformSlugs: PlatformSlug[]
  ): boolean {
    // Get MOTN service IDs for user's platforms
    const userServiceIds = platformSlugs
      .map((slug) => PLATFORM_MAPPING[slug])
      .filter((id): id is string => id !== undefined);

    // Check if any availability matches user's platforms
    return availability.some((item) => userServiceIds.includes(item.serviceId));
  }
}
