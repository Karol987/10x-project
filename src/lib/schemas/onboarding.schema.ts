// src/lib/schemas/onboarding.schema.ts

import { z } from "zod";

/**
 * UUID validation schema
 * Ensures the string is a valid UUID v4 format
 */
const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Schema for validating a single creator item during onboarding
 * Accepts either:
 * - Just an ID string (UUID for existing creators)
 * - Full creator object with external ID (for creators from external API)
 */
const creatorItemSchema = z.union([
  // Option 1: Just a UUID string (for existing creators in database)
  z.string().uuid("ID must be a valid UUID"),
  // Option 2: Full creator object from external API
  z.object({
    id: z.string().regex(/^tmdb-\d+$/, "ID must be in format 'tmdb-{id}'"),
    name: z.string().min(1, "Name is required"),
    creator_role: z.enum(["actor", "director"], {
      errorMap: () => ({ message: "Role must be 'actor' or 'director'" }),
    }),
    avatar_url: z.string().url("Avatar URL must be a valid URL").nullable(),
  }),
]);

/**
 * Schema for validating platform selection during onboarding.
 * Requires at least 1 platform to be selected.
 *
 * Used by: PUT /api/onboarding/platforms
 */
export const OnboardingPlatformsSchema = z.object({
  platform_ids: z
    .array(uuidSchema)
    .min(1, "At least 1 platform must be selected")
    .max(50, "Maximum 50 platforms allowed"),
});

/**
 * Schema for validating creator selection during onboarding.
 * Requires at least 3 creators to be selected.
 * Accepts both UUID strings and full creator objects from external API.
 *
 * Used by: PUT /api/onboarding/creators
 */
export const OnboardingCreatorsSchema = z.object({
  creators: z
    .array(creatorItemSchema)
    .min(3, "At least 3 creators must be selected")
    .max(50, "Maximum 50 creators allowed"),
});

/**
 * Type exports for use in API endpoints
 */
export type OnboardingPlatformsInput = z.infer<typeof OnboardingPlatformsSchema>;
export type OnboardingCreatorsInput = z.infer<typeof OnboardingCreatorsSchema>;
