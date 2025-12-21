// src/pages/api/platforms/index.ts

import type { APIRoute } from "astro";
import { PlatformsService } from "../../../lib/services/platforms.service";
import { errorResponse, jsonResponse } from "../../../lib/utils";
import type { PlatformDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/platforms - Get list of all available platforms
 *
 * Public endpoint for retrieving the complete list of VOD platforms (Netflix, HBO Max, etc.).
 * This is dictionary data used primarily in onboarding and search filters.
 * Response is heavily cached due to static nature of the data.
 *
 * Responses:
 * - 200: OK - Returns array of PlatformDTO
 * - 500: Internal Server Error - Unexpected error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    // Fetch all platforms using service
    const platformsService = new PlatformsService(supabase);
    const platforms = await platformsService.getAllPlatforms();

    // Return 200 OK with cache headers
    // Cache for 1 hour (3600 seconds) as this is relatively static data
    return jsonResponse<PlatformDTO[]>(platforms, 200, {
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    });
  } catch (error: unknown) {
    console.error("Error fetching platforms:", error);

    // Handle all errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};

