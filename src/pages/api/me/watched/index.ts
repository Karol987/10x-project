// src/pages/api/me/watched.ts

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { WatchedItemCreateSchema, WatchedItemsPaginationSchema } from "../../../lib/schemas/watched.schema";
import { WatchedService, WatchedItemAlreadyExistsError } from "../../../lib/services/watched.service";
import { errorResponse, jsonResponse } from "../../../lib/utils";
import type { WatchedItemDTO, WatchedItemCreateCommand, PaginatedResponse } from "../../../types";

export const prerender = false;

/**
 * GET /api/me/watched - Get user's watched items history
 *
 * Protected endpoint that returns a paginated list of movies/series marked as watched
 * by the authenticated user, sorted by created_at descending (newest first).
 *
 * Query Parameters:
 * - limit: number (optional, default 20, max 100) - Items per page
 * - cursor: UUID (optional) - Cursor for pagination (id of last item from previous page)
 *
 * Responses:
 * - 200: OK - Returns PaginatedResponse<WatchedItemDTO>
 * - 400: Bad Request - Invalid query parameters
 * - 401: Unauthorized - Missing or invalid JWT
 * - 500: Internal Server Error - Unexpected error
 */
export const GET: APIRoute = async ({ locals, url }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID; // TODO: Replace with actual user from auth when middleware is ready

    // Parse query parameters
    const queryParams = {
      limit: url.searchParams.get("limit") ? Number(url.searchParams.get("limit")) : undefined,
      cursor: url.searchParams.get("cursor") || undefined,
    };

    // Validate query parameters with Zod
    const validationResult = WatchedItemsPaginationSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Invalid query parameters", validationResult.error.format());
    }

    // Extract validated data
    const paginationQuery = validationResult.data;

    // Fetch watched items using service
    const watchedService = new WatchedService(supabase);
    const result = await watchedService.getWatchedItems(userId, paginationQuery);

    // Return 200 OK with paginated results
    return jsonResponse<PaginatedResponse<WatchedItemDTO>>(result, 200);
  } catch (error: unknown) {
    console.error("Error fetching watched items:", error);

    // Handle all errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};

/**
 * POST /api/me/watched - Mark a movie or series as watched
 *
 * Creates a new watched item for the authenticated user.
 *
 * Request Body:
 * - external_movie_id: string (required) - ID from external API
 * - media_type: "movie" | "series" (required)
 * - title: string (required, min 1 char)
 * - year: number (optional) - production year
 * - meta_data: object (required) - must contain poster_path field
 *
 * Responses:
 * - 201: Created - Returns WatchedItemDTO
 * - 400: Bad Request - Invalid JSON or validation error
 * - 401: Unauthorized - Missing or invalid JWT
 * - 409: Conflict - Item already marked as watched
 * - 500: Internal Server Error - Unexpected error
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Get Supabase client and user from middleware
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID; // TODO: Replace with actual user from auth when middleware is ready

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("InvalidJSON", 400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = WatchedItemCreateSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Validation error", validationResult.error.format());
    }

    // Extract validated data
    const command: WatchedItemCreateCommand = validationResult.data;

    // Create watched item using service
    const watchedService = new WatchedService(supabase);
    const watchedItem = await watchedService.create(userId, command);

    // Return 201 Created with the new watched item
    return jsonResponse<WatchedItemDTO>(watchedItem, 201);
  } catch (error: unknown) {
    console.error("Error creating watched item:", error);

    // Handle duplicate watched item (409 Conflict)
    if (error instanceof WatchedItemAlreadyExistsError) {
      return errorResponse("Conflict", 409, "Already marked as watched");
    }

    // Handle other errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};
