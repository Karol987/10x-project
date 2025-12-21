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
 * Type inference from the search schema
 */
export type CreatorSearchInput = z.infer<typeof CreatorSearchSchema>;

/**
 * Type inference from the ID schema
 */
export type CreatorIdInput = z.infer<typeof CreatorIdSchema>;

/**
 * Schema for validating POST /me/creators request body
 *
 * Validates the AddUserCreatorCommand structure:
 * - creator_id: UUID of the creator to add to favorites
 */
export const AddUserCreatorSchema = z.object({
  creator_id: z.string().uuid("Creator ID must be a valid UUID"),
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
