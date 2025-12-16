// src/pages/api/profile.ts

import type { APIRoute } from "astro";
import { z } from "zod";
import { DEFAULT_USER_ID } from "../../db/supabase.client";
import { errorResponse, jsonResponse } from "../../lib/utils";
import { ProfileService } from "../../lib/services/profile.service";
import type { ProfileDTO } from "../../types";

export const prerender = false;

/**
 * Zod schema for validating PATCH request body
 * onboarding_step must be an integer between 0 and 2
 */
const profileUpdateSchema = z.object({
  onboarding_step: z.number().int().min(0).max(2),
});

/**
 * GET /api/profile - Retrieve authenticated user's profile
 * PATCH /api/profile - Update onboarding_step
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Fetch profile using service
    const profileService = new ProfileService(supabase);
    const profile = await profileService.getByUserId(userId);

    if (!profile) {
      return errorResponse("NotFound", 404, "Profile not found");
    }

    return jsonResponse<ProfileDTO>(profile, 200);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return errorResponse("ServerError", 500, "Internal server error");
  }
};

export const PATCH: APIRoute = async ({ locals, request }) => {
  try {
    // Get Supabase client from middleware
    const supabase = locals.supabase;
    const userId = DEFAULT_USER_ID;

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("InvalidJSON", 400, "Invalid JSON body");
    }

    // Validate with Zod
    const validationResult = profileUpdateSchema.safeParse(body);
    if (!validationResult.success) {
      return errorResponse("ValidationError", 400, "Invalid request body", validationResult.error.format());
    }

    const { onboarding_step } = validationResult.data;

    // Update profile using service
    const profileService = new ProfileService(supabase);
    const updatedProfile = await profileService.updateOnboardingStep(userId, onboarding_step);

    return jsonResponse<ProfileDTO>(updatedProfile, 200);
  } catch (error: unknown) {
    console.error("Error updating profile:", error);

    // Handle specific Supabase errors
    if (error && typeof error === "object" && "code" in error && error.code === "PGRST116") {
      return errorResponse("NotFound", 404, "Profile not found");
    }

    return errorResponse("ServerError", 500, "Internal server error");
  }
};
