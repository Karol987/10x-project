// src/lib/services/vod.service.types.ts

import { z } from "zod";

/* ------------------------------------------------------------------ */
/* TMDb API Types                                                     */
/* ------------------------------------------------------------------ */

/**
 * TMDb Person Search Response
 * Endpoint: GET /search/person
 */
export const TmdbPersonSchema = z.object({
  id: z.number(),
  name: z.string(),
  profile_path: z.string().nullable(),
  known_for_department: z.string().optional(),
  popularity: z.number().optional(),
});

export const TmdbPersonSearchResponseSchema = z.object({
  page: z.number(),
  results: z.array(TmdbPersonSchema),
  total_pages: z.number(),
  total_results: z.number(),
});

export type TmdbPerson = z.infer<typeof TmdbPersonSchema>;
export type TmdbPersonSearchResponse = z.infer<typeof TmdbPersonSearchResponseSchema>;

/**
 * TMDb Movie Credits Response
 * Endpoint: GET /person/{id}/movie_credits
 */
export const TmdbMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  original_title: z.string().optional(),
  release_date: z.string().optional(),
  poster_path: z.string().nullable(),
  overview: z.string().optional(),
  genre_ids: z.array(z.number()).optional(),
  vote_average: z.number().optional(),
});

/**
 * TMDb Crew Credit
 * Extends movie schema with crew-specific fields
 */
export const TmdbCrewCreditSchema = TmdbMovieSchema.extend({
  job: z.string(), // Specific job title (e.g., "Director", "Producer", "Screenplay")
  department: z.string().optional(), // Department (e.g., "Directing", "Production", "Writing")
});

export const TmdbMovieCreditsResponseSchema = z.object({
  id: z.number(),
  cast: z.array(TmdbMovieSchema),
  crew: z.array(TmdbCrewCreditSchema),
});

export type TmdbMovie = z.infer<typeof TmdbMovieSchema>;
export type TmdbCrewCredit = z.infer<typeof TmdbCrewCreditSchema>;
export type TmdbMovieCreditsResponse = z.infer<typeof TmdbMovieCreditsResponseSchema>;

/* ------------------------------------------------------------------ */
/* Movie of the Night API Types                                       */
/* ------------------------------------------------------------------ */

/**
 * MOTN Streaming Option
 * Represents a single streaming option (subscription, rent, buy)
 */
export const MotnStreamingOptionSchema = z.object({
  available: z.boolean(),
  link: z.string().optional(),
  price: z.number().optional(),
});

export type MotnStreamingOption = z.infer<typeof MotnStreamingOptionSchema>;

/**
 * MOTN Service Info
 * Contains streaming options for a specific service (netflix, hbo, etc.)
 */
export const MotnServiceInfoSchema = z.object({
  subscription: MotnStreamingOptionSchema.optional(),
  rent: MotnStreamingOptionSchema.optional(),
  buy: MotnStreamingOptionSchema.optional(),
});

export type MotnServiceInfo = z.infer<typeof MotnServiceInfoSchema>;

/**
 * MOTN Streaming Info
 * Country-specific streaming availability
 * Key structure: { [countryCode]: { [serviceId]: ServiceInfo } }
 */
export const MotnStreamingInfoSchema = z.record(
  z.string(), // country code
  z.record(z.string(), MotnServiceInfoSchema) // service id -> service info
);

export type MotnStreamingInfo = z.infer<typeof MotnStreamingInfoSchema>;

/**
 * MOTN Streaming Option V2 (New API format)
 */
export const MotnStreamingOptionV2Schema = z.object({
  service: z.object({
    id: z.string(),
    name: z.string(),
  }),
  type: z.enum(["subscription", "rent", "buy", "free", "addon"]),
  link: z.string(),
  videoLink: z.string().optional(),
  quality: z.string().optional(),
  audios: z.array(z.any()).optional(),
  subtitles: z.array(z.any()).optional(),
  price: z.object({
    amount: z.string(),
    currency: z.string(),
    formatted: z.string(),
  }).optional(),
  expiresSoon: z.boolean().optional(),
  availableSince: z.number().optional(),
});

/**
 * MOTN Show Response
 * Endpoint: GET /shows/{id}
 * 
 * Note: API can return either:
 * 1. {"result": null} when movie not found
 * 2. Direct show object with itemType, showType, etc.
 * 
 * New API uses streamingOptions instead of streamingInfo
 */
export const MotnShowResponseSchema = z.union([
  // Case 1: Not found
  z.object({
    result: z.null(),
  }),
  // Case 2: Show found (direct object with NEW format)
  z.object({
    itemType: z.string(),
    showType: z.enum(["movie", "series"]),
    id: z.string(),
    imdbId: z.string().optional(),
    tmdbId: z.string().optional(),
    title: z.string(),
    overview: z.string().optional(),
    releaseYear: z.number().optional(),
    firstAirYear: z.number().optional(),
    lastAirYear: z.number().optional(),
    originalTitle: z.string().optional(),
    // New format: streamingOptions (array per country)
    streamingOptions: z.record(z.string(), z.array(MotnStreamingOptionV2Schema)).optional(),
    // Old format: streamingInfo (for backward compatibility)
    streamingInfo: MotnStreamingInfoSchema.optional(),
  }),
]);

export type MotnShowResponse = z.infer<typeof MotnShowResponseSchema>;

/* ------------------------------------------------------------------ */
/* VOD Cache Types (Database)                                         */
/* ------------------------------------------------------------------ */

/**
 * Availability Data stored in cache
 * Simplified structure for database storage
 */
export const CachedAvailabilitySchema = z.object({
  serviceId: z.string(),
  name: z.string(),
  link: z.string(),
  type: z.enum(["subscription", "rent", "buy"]),
});

export type CachedAvailability = z.infer<typeof CachedAvailabilitySchema>;

/**
 * Cache Entry from database
 */
export interface VodCacheEntry {
  tmdb_id: number;
  country_code: string;
  availability_data: CachedAvailability[];
  last_updated_at: string;
}

/* ------------------------------------------------------------------ */
/* Service Configuration                                              */
/* ------------------------------------------------------------------ */

/**
 * Platform mapping between database slugs and MOTN service IDs
 */
export const PLATFORM_MAPPING: Record<string, string> = {
  netflix: "netflix",
  "hbo-max": "hbo",
  "disney-plus": "disney",
  "amazon-prime": "prime",
  "apple-tv-plus": "apple",
  hulu: "hulu",
  mubi: "mubi",
};

/**
 * TMDb image base URL
 */
export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

/**
 * Cache TTL in milliseconds (24 hours)
 */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/* ------------------------------------------------------------------ */
/* Error Types                                                        */
/* ------------------------------------------------------------------ */

/**
 * Custom error for API rate limiting
 */
export class ApiRateLimitError extends Error {
  constructor(message = "API rate limit exceeded") {
    super(message);
    this.name = "ApiRateLimitError";
  }
}

/**
 * Custom error for external API failures
 */
export class ExternalApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}

/**
 * Custom error for invalid configuration
 */
export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}
