// src/types.ts

// Shared DTO & Command-Model definitions – generated from database schema
import type { Database } from "./db/database.types";

/* ------------------------------------------------------------------ */
/* Generic helpers bound to Database                                 */
/* ------------------------------------------------------------------ */
type TablesRow<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
type TablesInsert<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
type TablesUpdate<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];

export type UUID = string;

// Enums exported for frontend usage
export type MediaType = Database["public"]["Enums"]["media_type"];
export type CreatorRole = Database["public"]["Enums"]["creator_role"];

/* ------------------------------------------------------------------ */
/* Shared / Utilities                                                */
/* ------------------------------------------------------------------ */

/**
 * Standard pagination query parameters used across list endpoints.
 * Based on API Plan: ?limit=50&cursor=<id>
 */
export interface PaginationQuery {
  limit?: number;
  cursor?: UUID;
}

/**
 * Standard structure for paginated API responses.
 * (Optional generic wrapper if API returns metadata like next_cursor)
 */
export interface PaginatedResponse<T> {
  data: T[];
  next_cursor?: UUID | null;
}

/* ------------------------------------------------------------------ */
/* Profile                                                           */
/* Endpoint: /profile                                                */
/* ------------------------------------------------------------------ */

// Response DTO
export type ProfileDTO = Pick<TablesRow<"profiles">, "user_id" | "created_at" | "onboarding_status">;

// Command: PATCH /profile
export type ProfileUpdateCommand = Pick<TablesUpdate<"profiles">, "onboarding_status">;

/* ------------------------------------------------------------------ */
/* Onboarding                                                        */
/* Endpoints: /onboarding/* */
/* ------------------------------------------------------------------ */

// Response: GET /onboarding/state
export interface OnboardingStateDTO {
  step: TablesRow<"profiles">["onboarding_status"];
}

// Command: PUT /onboarding/platforms
export interface OnboardingPlatformsCommand {
  platform_ids: UUID[];
}

/** Re-use for `PUT /me/platforms` (full replace) */
export type UserPlatformsReplaceCommand = OnboardingPlatformsCommand;

// Command: PUT /onboarding/creators
export interface OnboardingCreatorsCommand {
  creator_ids: UUID[];
}

/* ------------------------------------------------------------------ */
/* Platforms                                                         */
/* Endpoints: /platforms, /me/platforms                              */
/* ------------------------------------------------------------------ */
type PlatformRow = TablesRow<"platforms">;

// Response DTO
export type PlatformDTO = Pick<PlatformRow, "id" | "slug" | "name" | "logo_url">;

// Helper type for slugs used in Recommendations
export type PlatformSlug = PlatformDTO["slug"];

/* ------------------------------------------------------------------ */
/* Creators                                                          */
/* Endpoints: /creators, /me/creators                                */
/* ------------------------------------------------------------------ */
type CreatorRow = TablesRow<"creators">;

// Response DTO
export type CreatorDTO = Pick<CreatorRow, "id" | "name" | "creator_role" | "avatar_url">;

// Query Params: GET /creators?q=...&role=...
export interface CreatorSearchQuery extends PaginationQuery {
  q?: string; // ILIKE search
  role?: CreatorRole;
}

// Response DTO for User's Favorites (includes derived state)
// Note: for /me/creators list, is_favorite is logically true,
// but this DTO is also useful for lists where we need to mark favorites.
export interface UserCreatorListItemDTO extends CreatorDTO {
  /** Derived from presence in `user_creators` table */
  is_favorite: boolean;
}

// Command: POST /me/creators
export interface AddUserCreatorCommand {
  creator_id: UUID;
}

/* ------------------------------------------------------------------ */
/* Watched Items                                                     */
/* Endpoint: /me/watched                                             */
/* ------------------------------------------------------------------ */
type WatchedRow = TablesRow<"watched_items">;
type WatchedInsert = TablesInsert<"watched_items">;

// Response DTO
export type WatchedItemDTO = Pick<
  WatchedRow,
  "id" | "external_movie_id" | "media_type" | "title" | "year" | "created_at"
>;

// Command: POST /me/watched
// strict subset of Insert to match API Plan inputs
export type WatchedItemCreateCommand = Pick<
  WatchedInsert,
  "external_movie_id" | "media_type" | "title" | "year" | "meta_data"
>;

/* ------------------------------------------------------------------ */
/* Recommendations                                                   */
/* Endpoint: /recommendations                                        */
/* ------------------------------------------------------------------ */

// DTO for creators embedded inside a recommendation
export interface RecommendationCreatorDTO extends Pick<CreatorRow, "id" | "name" | "creator_role"> {
  is_favorite: boolean;
}

// Main Response DTO
// Structure matches the aggregated view required by the Plan
export interface RecommendationDTO {
  id: UUID; // Likely generated by the view/function
  external_movie_id: WatchedItemDTO["external_movie_id"];
  media_type: MediaType;
  title: string;
  year: number | null;
  /** List of creators (actors/directors) associated with this item */
  creators: RecommendationCreatorDTO[];
  /** List of platform slugs where this item is available */
  platforms: PlatformSlug[];
  /** Optional poster path for UI display */
  poster_path?: string;
}

/**
 * ViewModel extending RecommendationDTO with UI-specific state
 * Used for optimistic updates in the recommendations feed
 */
export interface RecommendationViewModel extends RecommendationDTO {
  /** Flag to hide element before API confirmation (optimistic UI) */
  isOptimisticallyHidden?: boolean;
}
