// src/pages/api/vod/search-creators.ts
/* eslint-disable no-console */

import type { APIRoute } from "astro";
import { z } from "zod";
import { VodService } from "../../../lib/services/vod.service";
import { errorResponse, jsonResponse } from "../../../lib/utils";
import { ConfigurationError, ExternalApiError, ApiRateLimitError } from "../../../lib/services/vod.service.types";
import type { CreatorDTO } from "../../../types";

export const prerender = false;

/**
 * Schema for validating query parameters
 */
const SearchQuerySchema = z.object({
  q: z.string().min(2, "Search query must be at least 2 characters"),
});

/**
 * GET /api/vod/search-creators - Search for creators using TMDb API
 *
 * Test endpoint for VodService.searchCreators() method.
 * Searches TMDb for actors and directors matching the query.
 *
 * Query Parameters:
 * - q: string (required, min 2 chars) - Search query
 *
 * Responses:
 * - 200: OK - Returns array of CreatorDTO
 * - 400: Bad Request - Invalid query parameters
 * - 429: Too Many Requests - API rate limit exceeded
 * - 500: Internal Server Error - Configuration error or unexpected error
 * - 502: Bad Gateway - External API error
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;
    if (!supabase) {
      return errorResponse("ServerError", 500, "Supabase client not available");
    }

    // Parse query parameters
    const queryParams = {
      q: url.searchParams.get("q") || undefined,
    };

    // Validate query parameters
    const validationResult = SearchQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      return errorResponse("ValidationError", 400, firstError.message);
    }

    const { q } = validationResult.data;

    // Initialize VodService
    let vodService: VodService;
    try {
      vodService = new VodService(supabase);
    } catch (error) {
      if (error instanceof ConfigurationError) {
        return errorResponse(
          "ConfigurationError",
          500,
          "VOD service is not configured. Please set TMDB_API_KEY and RAPIDAPI_KEY in environment variables."
        );
      }
      throw error;
    }

    // Search for creators
    const creators = await vodService.searchCreators(q);

    // Return results
    return jsonResponse<CreatorDTO[]>(creators, 200);
  } catch (error) {
    // Handle specific error types
    if (error instanceof ApiRateLimitError) {
      return errorResponse("RateLimitError", 429, error.message);
    }

    if (error instanceof ExternalApiError) {
      return errorResponse("ExternalApiError", 502, error.message);
    }

    // Handle unexpected errors
    console.error("Unexpected error in search-creators:", error);
    return errorResponse("ServerError", 500, "Internal server error");
  }
};
