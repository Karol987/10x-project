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
