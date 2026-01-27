// src/pages/api/me/platforms.ts

import type { APIRoute } from "astro";
import { UserPlatformsReplaceCommandSchema } from "../../../lib/schemas/platforms.schema";
import { PlatformsService } from "../../../lib/services/platforms.service";
import { errorResponse, jsonResponse } from "../../../lib/utils";
import type { PlatformDTO, UserPlatformsReplaceCommand } from "../../../types";

export const prerender = false;

/**
 * GET /api/me/platforms - Retrieve user's subscribed platforms
 *
 * Returns the list of VOD platforms (Netflix, HBO Max, etc.) that the user
 * has subscribed to. This is used for filtering recommendations.
 *
 * Responses:
 * - 200: OK - Returns PlatformDTO[]
 * - 401: Unauthorized - Missing or invalid session
 * - 500: Internal Server Error - Database error
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client and user from middleware
    const supabase = locals.supabase;
    const user = locals.user;

    // Check authentication
    if (!user) {
      return errorResponse("Unauthorized", 401, "Authentication required");
    }

    const userId = user.id;

    // Fetch user's platforms using service
    const platformsService = new PlatformsService(supabase);
    const platforms = await platformsService.getUserPlatforms(userId);

    // Return 200 OK with platforms list
    return jsonResponse<PlatformDTO[]>(platforms, 200);
  } catch {
    // Handle errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal Server Error");
  }
};

/**
 * PUT /api/me/platforms - Replace user's platform subscriptions
 *
 * Performs a full replacement of the user's platform subscriptions.
 * All existing subscriptions are removed and replaced with the new list.
 *
 * Request Body:
 * - platform_ids: string[] (required) - Array of platform UUIDs (min 1, max 50)
 *
 * Responses:
 * - 200: OK - Returns updated PlatformDTO[]
 * - 400: Bad Request - Invalid JSON, validation error, or invalid platform IDs
 * - 401: Unauthorized - Missing or invalid session
 * - 500: Internal Server Error - Database error
 */
export const PUT: APIRoute = async ({ locals, request }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log("DEBUG: Auth check", {
      hasUser: !!user,
      userId: user?.id,
      localsUserId: locals.user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      return errorResponse("Unauthorized", 401, "Unauthorized Access");
    }

    const userId = user.id;

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("InvalidJSON", 400, "Invalid JSON body");
    }

    // Validate request body with Zod
    const validationResult = UserPlatformsReplaceCommandSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Validation error", validationResult.error.format());
    }

    // Extract validated data
    const command: UserPlatformsReplaceCommand = validationResult.data;

    // Replace user platforms using service
    const platformsService = new PlatformsService(supabase);
    const updatedPlatforms = await platformsService.replaceUserPlatforms(userId, command.platform_ids);

    // Return 200 OK with updated platforms list
    return jsonResponse<PlatformDTO[]>(updatedPlatforms, 200);
  } catch (error: unknown) {
    // Handle invalid platform ID error (FK constraint violation)
    if (error instanceof Error && error.message.includes("invalid")) {
      return errorResponse("ValidationError", 400, error.message);
    }

    // Handle other errors as 500 Internal Server Error
    return errorResponse("ServerError", 500, "Internal Server Error");
  }
};
