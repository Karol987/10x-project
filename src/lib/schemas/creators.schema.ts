// src/lib/schemas/creators.schema.ts

import { z } from "zod";

/**
 * Schema for validating GET /creators query parameters
 *
 * Validates the CreatorSearchQuery structure:
 * - q: optional string for name search (minimum 2 characters)
 * - role: optional enum "actor" | "director"
 * - limit: optional number (default 20, max 100)
 * - cursor: optional UUID string for keyset pagination
 */
export const CreatorSearchSchema = z.object({
  q: z
    .string()
    .min(2, "Search query must be at least 2 characters")
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  role: z
    .enum(["actor", "director"], {
      errorMap: () => ({ message: "Role must be 'actor' or 'director'" }),
    })
    .optional(),
  limit: z.number().int().positive().max(100, "Limit cannot exceed 100").default(20).optional(),
  cursor: z.string().uuid("Cursor must be a valid UUID").optional(),
});

/**
 * Schema for validating GET /creators/:id path parameter
 *
 * Validates that the id is a valid UUID
 */
export const CreatorIdSchema = z.object({
  id: z.string().uuid("Creator ID must be a valid UUID"),
});

/**
 * Schema for validating DELETE /me/creators/:id path parameter
 *
 * Validates that the id is either a valid UUID or external ID in format "tmdb-{id}"
 */
export const CreatorIdOrExternalIdSchema = z.object({
  id: z.string().refine(
    (val) => {
      // Check if it's a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(val)) return true;

      // Check if it's an external ID (tmdb-{id})
      const externalIdRegex = /^tmdb-\d+$/;
      if (externalIdRegex.test(val)) return true;

      return false;
    },
    { message: "ID must be either a valid UUID or external ID in format 'tmdb-{id}'" }
  ),
});

/**
 * Type inference from the search schema
 */
export type CreatorSearchInput = z.infer<typeof CreatorSearchSchema>;

/**
 * Type inference from the ID schema
 */
export type CreatorIdInput = z.infer<typeof CreatorIdSchema>;

/**
 * Schema for validating POST /me/creators request body (legacy)
 *
 * Validates the AddUserCreatorCommand structure:
 * - creator_id: UUID of the creator to add to favorites
 */
export const AddUserCreatorSchema = z.object({
  creator_id: z.string().uuid("Creator ID must be a valid UUID"),
});

/**
 * Schema for validating POST /me/creators request body (from external API)
 *
 * Validates creator data from external API:
 * - id: External ID in format "tmdb-{id}"
 * - name: Creator's full name
 * - creator_role: "actor" or "director"
 * - avatar_url: URL to creator's avatar (nullable)
 */
export const AddUserCreatorFromExternalApiSchema = z.object({
  id: z.string().regex(/^tmdb-\d+$/, "ID must be in format 'tmdb-{id}'"),
  name: z.string().min(1, "Name is required"),
  creator_role: z.enum(["actor", "director"], {
    errorMap: () => ({ message: "Role must be 'actor' or 'director'" }),
  }),
  avatar_url: z.string().url("Avatar URL must be a valid URL").nullable(),
});

/**
 * Schema for validating GET /me/creators query parameters
 *
 * Validates pagination parameters for user's favorite creators list:
 * - limit: optional number (default 50, max 100)
 * - cursor: optional UUID string for keyset pagination
 */
export const UserCreatorsPaginationSchema = z.object({
  limit: z.number().int().positive().max(100, "Limit cannot exceed 100").default(50).optional(),
  cursor: z.string().uuid("Cursor must be a valid UUID").optional(),
});

/**
 * Type inference from the add user creator schema
 */
export type AddUserCreatorInput = z.infer<typeof AddUserCreatorSchema>;

/**
 * Type inference from the user creators pagination schema
 */
export type UserCreatorsPaginationInput = z.infer<typeof UserCreatorsPaginationSchema>;
