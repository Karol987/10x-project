// src/lib/schemas/watched.schema.ts

import { z } from "zod";

/**
 * Schema for validating POST /me/watched request body
 *
 * Validates the WatchedItemCreateCommand structure:
 * - external_movie_id: required string (ID from external API)
 * - media_type: required enum "movie" | "series"
 * - title: required string with minimum length of 1
 * - year: optional number (production year)
 * - meta_data: required object that must contain poster_path
 */
export const WatchedItemCreateSchema = z.object({
  external_movie_id: z.string().min(1, "External movie ID is required"),
  media_type: z.enum(["movie", "series"], {
    errorMap: () => ({ message: "Media type must be 'movie' or 'series'" }),
  }),
  title: z.string().min(1, "Title is required and must be at least 1 character"),
  year: z.number().int().optional(),
  meta_data: z
    .object({
      poster_path: z.string(),
    })
    .passthrough() // Allow additional properties in meta_data
    .refine((data) => "poster_path" in data, {
      message: "meta_data must contain poster_path field",
    }),
});

/**
 * Type inference from the schema
 */
export type WatchedItemCreateInput = z.infer<typeof WatchedItemCreateSchema>;

/**
 * Schema for validating GET /me/watched query parameters
 *
 * Validates pagination parameters for user's watched items list:
 * - limit: optional number (default 20, max 100)
 * - cursor: optional UUID string for keyset pagination
 */
export const WatchedItemsPaginationSchema = z.object({
  limit: z.number().int().positive().max(100, "Limit cannot exceed 100").default(20).optional(),
  cursor: z.string().uuid("Cursor must be a valid UUID").optional(),
});

/**
 * Schema for validating DELETE /me/watched/:id path parameter
 *
 * Validates that the id is a valid UUID
 */
export const WatchedItemIdSchema = z.object({
  id: z.string().uuid("Watched item ID must be a valid UUID"),
});

/**
 * Type inference from the pagination schema
 */
export type WatchedItemsPaginationInput = z.infer<typeof WatchedItemsPaginationSchema>;

/**
 * Type inference from the ID schema
 */
export type WatchedItemIdInput = z.infer<typeof WatchedItemIdSchema>;
