// src/lib/schemas/platforms.schema.ts

import { z } from "zod";

/**
 * Schema for validating platform slug parameter.
 * Ensures the slug is a valid URL-friendly string.
 *
 * Used by: GET /api/platforms/:slug
 */
export const PlatformSlugSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug cannot be empty")
    .max(100, "Slug is too long")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)"),
});

/**
 * Schema for validating user platforms replace command.
 * Ensures at least one platform is selected and all IDs are valid UUIDs.
 *
 * Used by: PUT /api/me/platforms
 */
export const UserPlatformsReplaceCommandSchema = z.object({
  platform_ids: z
    .array(z.string().uuid("Each platform ID must be a valid UUID"))
    .min(1, "At least one platform must be selected")
    .max(50, "Too many platforms selected"),
});

/**
 * Type exports for use in API endpoints
 */
export type PlatformSlugInput = z.infer<typeof PlatformSlugSchema>;
export type UserPlatformsReplaceCommandInput = z.infer<typeof UserPlatformsReplaceCommandSchema>;
