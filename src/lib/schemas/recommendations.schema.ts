// src/lib/schemas/recommendations.schema.ts

import { z } from "zod";

/**
 * Schema for validating pagination query parameters for recommendations endpoint
 * Based on PaginationQuery from types.ts
 *
 * - cursor: optional UUID of the last record from previous page
 * - limit: optional integer between 1 and 50, defaults to 50
 */
export const RecommendationsPaginationQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(50),
});

/**
 * Type inference from the schema
 */
export type RecommendationsPaginationQuery = z.infer<typeof RecommendationsPaginationQuerySchema>;

/**
 * Schema for a single creator within a recommendation
 */
export const RecommendationCreatorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  creator_role: z.enum(["actor", "director"]),
  is_favorite: z.boolean(),
});

/**
 * Schema for the main recommendation response item
 */
export const RecommendationDTOSchema = z.object({
  id: z.string().uuid(),
  external_movie_id: z.string(),
  media_type: z.enum(["movie", "series"]),
  title: z.string(),
  year: z.number().nullable(),
  creators: z.array(RecommendationCreatorSchema),
  platforms: z.array(z.string()),
});

/**
 * Schema for the response array
 */
export const RecommendationsResponseSchema = z.array(RecommendationDTOSchema);

/**
 * Type inference for response validation
 */
export type RecommendationsResponse = z.infer<typeof RecommendationsResponseSchema>;
