// src/pages/api/me/watched/[id].ts

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { WatchedItemIdSchema } from "../../../../lib/schemas/watched.schema";
import { WatchedService, WatchedItemNotFoundError } from "../../../../lib/services/watched.service";
import { errorResponse } from "../../../../lib/utils";

export const prerender = false;

/**
 * DELETE /api/me/watched/:id - Remove a watched item from user's history
 *
 * Protected endpoint that removes a movie/series from the authenticated user's watched history.
 *
 * Path Parameters:
 * - id: UUID (required) - ID of the watched item to remove
 *
 * Responses:
 * - 204: No Content - Watched item successfully removed
 * - 400: Bad Request - Invalid watched item ID format
 * - 401: Unauthorized - Missing or invalid JWT
 * - 404: Not Found - Watched item not found or doesn't belong to user
 * - 500: Internal Server Error - Unexpected error
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    // Get Supabase client and user from middleware
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID; // TODO: Replace with actual user from auth when middleware is ready

    // Validate path parameter with Zod
    const validationResult = WatchedItemIdSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Invalid watched item ID", validationResult.error.format());
    }

    // Extract validated watched item ID
    const { id: itemId } = validationResult.data;

    // Remove watched item using service
    const watchedService = new WatchedService(supabase);
    await watchedService.deleteWatchedItem(userId, itemId);

    // Return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    // Handle watched item not found (404)
    if (error instanceof WatchedItemNotFoundError) {
      return errorResponse("NotFound", 404, "Watched item not found");
    }

    // Handle other errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};
