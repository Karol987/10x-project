// src/pages/api/recommendations.ts
/* eslint-disable no-console */

import type { APIRoute } from "astro";
import { errorResponse, jsonResponse } from "../../lib/utils";
import { RecommendationsPaginationQuerySchema } from "../../lib/schemas/recommendations.schema";
import { RecommendationsService } from "../../lib/services/recommendations.service";
import type { RecommendationDTO } from "../../types";

export const prerender = false;

/**
 * GET /api/recommendations - Get personalized recommendations
 *
 * Returns up to 50 titles that match BOTH criteria:
 * 1. Have at least one creator marked as favorite by the user
 * 2. Are available on platforms the user subscribes to
 *
 * Query params:
 * - cursor (optional): UUID of the last record from previous page
 * - limit (optional): Number of items to return (1-50, default: 50)
 *
 * Responses:
 * - 200: Success - returns array of RecommendationDTO
 * - 400: Bad Request - invalid query parameters
 * - 401: Unauthorized - missing or invalid JWT
 * - 500: Internal Server Error - unexpected error
 */
export const GET: APIRoute = async ({ locals, url }) => {
  console.log("[API /recommendations] GET request received");
  try {
    // Get Supabase client and user from middleware
    const supabase = locals.supabase;
    const user = locals.user;

    console.log("[API /recommendations] User authenticated:", !!user, user?.id);

    // Check authentication
    if (!user) {
      return errorResponse("Unauthorized", 401, "Authentication required");
    }

    const userId = user.id;
    if (!supabase) {
      return errorResponse("ServerError", 500, "Supabase client not available");
    }

    // Parse and validate query parameters
    const queryParams = {
      cursor: url.searchParams.get("cursor") || undefined,
      limit: url.searchParams.get("limit") || undefined,
    };

    console.log("[API /recommendations] Query params:", queryParams);

    const validationResult = RecommendationsPaginationQuerySchema.safeParse(queryParams);

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      const field = firstError.path[0] || "query";
      const message = `${field} ${firstError.message}`;

      return errorResponse("InvalidQuery", 400, message);
    }

    const { cursor, limit } = validationResult.data;
    console.log("[API /recommendations] Calling service with:", { userId, limit, cursor });

    // Fetch recommendations using service
    const recommendationsService = new RecommendationsService(supabase);
    const recommendations = await recommendationsService.get(userId, { limit, cursor });

    console.log("[API /recommendations] Got recommendations:", recommendations.length);

    return jsonResponse<RecommendationDTO[]>(recommendations, 200);
  } catch (error) {
    console.error("[API /recommendations] Error:", error);
    return errorResponse("ServerError", 500, "Unexpected error");
  }
};
