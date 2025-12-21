// src/pages/api/creators/index.ts

import type { APIRoute } from "astro";
import { CreatorSearchSchema } from "../../../lib/schemas/creators.schema";
import { CreatorsService } from "../../../lib/services/creators.service";
import { errorResponse, jsonResponse } from "../../../lib/utils";
import type { CreatorDTO, PaginatedResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/creators - Get paginated list of creators
 *
 * Public endpoint for searching and browsing the creators dictionary.
 * Supports text search, role filtering, and cursor-based pagination.
 *
 * Query Parameters:
 * - q: string (optional, min 2 chars) - Search by creator name
 * - role: "actor" | "director" (optional) - Filter by creator role
 * - limit: number (optional, default 20, max 100) - Items per page
 * - cursor: UUID (optional) - Cursor for pagination (ID of last item from previous page)
 *
 * Responses:
 * - 200: OK - Returns PaginatedResponse<CreatorDTO>
 * - 400: Bad Request - Invalid query parameters
 * - 500: Internal Server Error - Unexpected error
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    // Parse query parameters
    const queryParams = {
      q: url.searchParams.get("q") || undefined,
      role: url.searchParams.get("role") || undefined,
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
      cursor: url.searchParams.get("cursor") || undefined,
    };

    // Validate query parameters with Zod
    const validationResult = CreatorSearchSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Invalid query parameters", validationResult.error.format());
    }

    // Extract validated data
    const searchQuery = validationResult.data;

    // Fetch creators using service
    const creatorsService = new CreatorsService(supabase);
    const result = await creatorsService.getPaginatedCreators(searchQuery);

    // Return 200 OK with paginated results
    return jsonResponse<PaginatedResponse<CreatorDTO>>(result, 200);
  } catch (error: unknown) {
    console.error("Error fetching creators:", error);

    // Handle all errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};


