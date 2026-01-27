// src/pages/api/me/creators/index.ts
/* eslint-disable no-console */

import type { APIRoute } from "astro";
import {
  AddUserCreatorSchema,
  AddUserCreatorFromExternalApiSchema,
  UserCreatorsPaginationSchema,
} from "../../../../lib/schemas/creators.schema";
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
    // Get Supabase client and user from middleware
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return errorResponse("Unauthorized", 401, "Authentication required");
    }

    const userId = user.id;

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
 * Supports two workflows:
 * 1. Legacy: Pass creator_id (UUID) for existing creators in database
 * 2. New: Pass creator data from external API (id, name, creator_role, avatar_url)
 *
 * Request Body (Legacy):
 * - creator_id: UUID (required) - ID of the creator to add to favorites
 *
 * Request Body (New):
 * - id: string (required) - External ID in format "tmdb-{id}"
 * - name: string (required) - Creator's full name
 * - creator_role: "actor" | "director" (required)
 * - avatar_url: string | null (required) - URL to creator's avatar
 *
 * Responses:
 * - 201: Created - Returns CreatorDTO of the added creator
 * - 400: Bad Request - Invalid JSON or validation error
 * - 401: Unauthorized - Missing or invalid JWT
 * - 404: Not Found - Creator with given ID doesn't exist (legacy workflow only)
 * - 409: Conflict - Creator is already in user's favorites
 * - 500: Internal Server Error - Unexpected error
 */
export const POST: APIRoute = async ({ locals, request }) => {
  try {
    // Get Supabase client and user from middleware
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return errorResponse("Unauthorized", 401, "Authentication required");
    }

    const userId = user.id;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("InvalidJSON", 400, "Invalid JSON body");
    }

    // Initialize service
    const creatorsService = new CreatorsService(supabase);

    // Try to validate as external API data first (new workflow)
    const externalApiValidation = AddUserCreatorFromExternalApiSchema.safeParse(body);
    if (externalApiValidation.success) {
      // New workflow: Add creator from external API data
      const creatorData = externalApiValidation.data;
      const creator = await creatorsService.addFavoriteFromExternalApi(userId, creatorData);
      return jsonResponse<CreatorDTO>(creator, 201);
    }

    // Try to validate as legacy format (creator_id)
    const legacyValidation = AddUserCreatorSchema.safeParse(body);
    if (legacyValidation.success) {
      // Legacy workflow: Add existing creator by UUID
      const { creator_id } = legacyValidation.data;
      const creator = await creatorsService.addFavorite(userId, creator_id);
      return jsonResponse<CreatorDTO>(creator, 201);
    }

    // If both validations fail, return validation error
    return errorResponse("ValidationError", 400, "Invalid request body", {
      message: "Body must contain either 'creator_id' (UUID) or creator data (id, name, creator_role, avatar_url)",
      legacyErrors: legacyValidation.error.format(),
      externalApiErrors: externalApiValidation.error.format(),
    });
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
    console.error("Error adding creator to favorites:", error);
    return errorResponse("ServerError", 500, "Internal server error");
  }
};
