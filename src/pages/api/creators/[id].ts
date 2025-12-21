// src/pages/api/creators/[id].ts

import type { APIRoute } from "astro";
import { CreatorIdSchema } from "../../../lib/schemas/creators.schema";
import { CreatorsService, CreatorNotFoundError } from "../../../lib/services/creators.service";
import { errorResponse, jsonResponse } from "../../../lib/utils";
import type { CreatorDTO } from "../../../types";

export const prerender = false;

/**
 * GET /api/creators/:id - Get a single creator by ID
 *
 * Public endpoint for fetching detailed information about a specific creator.
 *
 * Path Parameters:
 * - id: UUID (required) - Creator's unique identifier
 *
 * Responses:
 * - 200: OK - Returns CreatorDTO
 * - 400: Bad Request - Invalid UUID format
 * - 404: Not Found - Creator doesn't exist
 * - 500: Internal Server Error - Unexpected error
 */
export const GET: APIRoute = async ({ locals, params }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    // Validate path parameter with Zod
    const validationResult = CreatorIdSchema.safeParse({ id: params.id });
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Invalid creator ID", validationResult.error.format());
    }

    // Extract validated ID
    const { id } = validationResult.data;

    // Fetch creator using service
    const creatorsService = new CreatorsService(supabase);
    const creator = await creatorsService.getCreatorById(id);

    // Return 200 OK with creator data
    return jsonResponse<CreatorDTO>(creator, 200);
  } catch (error: unknown) {
    // Handle creator not found (404)
    if (error instanceof CreatorNotFoundError) {
      return errorResponse("NotFound", 404, "Creator not found");
    }

    // Handle other errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};
