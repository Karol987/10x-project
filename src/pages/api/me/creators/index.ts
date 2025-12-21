// src/pages/api/me/creators/index.ts

import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../../db/supabase.client";
import { AddUserCreatorSchema, UserCreatorsPaginationSchema } from "../../../../lib/schemas/creators.schema";
import {
  CreatorsService,
  CreatorAlreadyFavoriteError,
  CreatorNotFoundError,
} from "../../../../lib/services/creators.service";
import { errorResponse, jsonResponse } from "../../../../lib/utils";
import type { CreatorDTO, PaginatedResponse } from "../../../../types";

export const prerender = false;

/**
 * GET /api/me/creators - Get user's favorite creators
 *
 * Protected endpoint that returns a paginated list of creators marked as favorites
 * by the authenticated user.
 *
 * Query Parameters:
 * - limit: number (optional, default 50, max 100) - Items per page
 * - cursor: UUID (optional) - Cursor for pagination (creator_id of last item from previous page)
 *
 * Responses:
 * - 200: OK - Returns PaginatedResponse<CreatorDTO>
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
    const validationResult = UserCreatorsPaginationSchema.safeParse(queryParams);
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Invalid query parameters", validationResult.error.format());
    }

    // Extract validated data
    const paginationQuery = validationResult.data;

    // Fetch favorite creators using service
    const creatorsService = new CreatorsService(supabase);
    const result = await creatorsService.getFavorites(userId, paginationQuery);

    // Return 200 OK with paginated results
    return jsonResponse<PaginatedResponse<CreatorDTO>>(result, 200);
  } catch {
    // Handle all errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};

/**
 * POST /api/me/creators - Add a creator to user's favorites
 *
 * Protected endpoint that adds a creator to the authenticated user's favorites list.
 *
 * Request Body:
 * - creator_id: UUID (required) - ID of the creator to add to favorites
 *
 * Responses:
 * - 201: Created - Returns CreatorDTO of the added creator
 * - 400: Bad Request - Invalid JSON or validation error
 * - 401: Unauthorized - Missing or invalid JWT
 * - 404: Not Found - Creator with given ID doesn't exist
 * - 409: Conflict - Creator is already in user's favorites
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
    const validationResult = AddUserCreatorSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Validation error", validationResult.error.format());
    }

    // Extract validated data
    const { creator_id } = validationResult.data;

    // Add creator to favorites using service
    const creatorsService = new CreatorsService(supabase);
    const creator = await creatorsService.addFavorite(userId, creator_id);

    // Return 201 Created with the creator
    return jsonResponse<CreatorDTO>(creator, 201);
  } catch (error: unknown) {
    // Handle creator not found (404)
    if (error instanceof CreatorNotFoundError) {
      return errorResponse("NotFound", 404, "Creator not found");
    }

    // Handle duplicate favorite (409 Conflict)
    if (error instanceof CreatorAlreadyFavoriteError) {
      return errorResponse("Conflict", 409, "Creator is already in favorites");
    }

    // Handle other errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal server error");
  }
};
