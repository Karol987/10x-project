// src/pages/api/platforms/[slug].ts

import type { APIRoute } from "astro";
import { PlatformSlugSchema } from "../../../lib/schemas/platforms.schema";
import { PlatformsService } from "../../../lib/services/platforms.service";
import { errorResponse, jsonResponse } from "../../../lib/utils";
import type { PlatformDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/platforms/:slug - Get single platform by slug
 *
 * Public endpoint for retrieving a specific platform by its URL-friendly slug.
 * Used for platform detail pages or when specific platform information is needed.
 *
 * Path Parameters:
 * - slug: string - URL-friendly platform identifier (e.g., "netflix", "hbo-max")
 *
 * Responses:
 * - 200: OK - Returns single PlatformDTO
 * - 400: Bad Request - Invalid slug format
 * - 404: Not Found - Platform with given slug doesn't exist
 * - 500: Internal Server Error - Unexpected error
 */
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    // Extract slug from path parameters
    const { slug } = params;

    // Validate slug parameter with Zod
    const validationResult = PlatformSlugSchema.safeParse({ slug });
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Invalid slug parameter", validationResult.error.format());
    }

    // Fetch platform by slug using service
    const platformsService = new PlatformsService(supabase);
    const platform = await platformsService.getPlatformBySlug(validationResult.data.slug);

    // Handle not found case
    if (!platform) {
      return errorResponse("NotFound", 404, `Platform with slug '${slug}' not found`);
    }

    // Return 200 OK
    // Note: Individual platform details could also be cached, but with shorter duration
    return jsonResponse<PlatformDTO>(platform, 200, {
      "Cache-Control": "public, max-age=1800, s-maxage=1800",
    });
  } catch {
    // Handle all errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};
