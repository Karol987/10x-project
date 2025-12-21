// src/pages/api/me/creators/[id].ts

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { CreatorIdSchema } from "../../../../lib/schemas/creators.schema";
import { CreatorsService, FavoriteCreatorNotFoundError } from "../../../../lib/services/creators.service";
import { errorResponse } from "../../../../lib/utils";

export const prerender = false;

/**
 * DELETE /api/me/creators/:id - Remove a creator from user's favorites
 *
 * Protected endpoint that removes a creator from the authenticated user's favorites list.
 *
 * Path Parameters:
 * - id: UUID (required) - ID of the creator to remove from favorites
 *
 * Responses:
 * - 204: No Content - Creator successfully removed from favorites
 * - 400: Bad Request - Invalid creator ID format
 * - 401: Unauthorized - Missing or invalid JWT
 * - 404: Not Found - Creator is not in user's favorites or doesn't exist
 * - 500: Internal Server Error - Unexpected error
 */
export const DELETE: APIRoute = async ({ locals, params }) => {
  try {
    // Get Supabase client and user from middleware
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID; // TODO: Replace with actual user from auth when middleware is ready

    // Validate path parameter with Zod
    const validationResult = CreatorIdSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Invalid creator ID", validationResult.error.format());
    }

    // Extract validated creator ID
    const { id: creatorId } = validationResult.data;

    // Remove creator from favorites using service
    const creatorsService = new CreatorsService(supabase);
    await creatorsService.removeFavorite(userId, creatorId);

    // Return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (error: unknown) {
    console.error("Error removing favorite creator:", error);

    // Handle favorite not found (404)
    if (error instanceof FavoriteCreatorNotFoundError) {
      return errorResponse("NotFound", 404, "Favorite creator not found");
    }

    // Handle other errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};
