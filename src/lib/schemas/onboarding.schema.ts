// src/lib/schemas/onboarding.schema.ts

import { z } from "zod";

/**
 * UUID validation schema
 * Ensures the string is a valid UUID v4 format
 */
const uuidSchema = z.string().uuid("Invalid UUID format");

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
 *
 * Used by: PUT /api/onboarding/creators
 */
export const OnboardingCreatorsSchema = z.object({
  creator_ids: z
    .array(uuidSchema)
    .min(3, "At least 3 creators must be selected")
    .max(50, "Maximum 50 creators allowed"),
});

/**
 * Type exports for use in API endpoints
 */
export type OnboardingPlatformsInput = z.infer<typeof OnboardingPlatformsSchema>;
export type OnboardingCreatorsInput = z.infer<typeof OnboardingCreatorsSchema>;
