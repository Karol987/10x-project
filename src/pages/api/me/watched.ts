// src/pages/api/me/watched.ts

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { WatchedItemCreateSchema } from "../../../lib/schemas/watched.schema";
import { WatchedService, WatchedItemAlreadyExistsError } from "../../../lib/services/watched.service";
import { errorResponse, jsonResponse } from "../../../lib/utils";
import type { WatchedItemDTO, WatchedItemCreateCommand } from "../../../types";

export const prerender = false;

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
