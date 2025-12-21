// src/pages/api/onboarding/state.ts

import type { APIRoute } from "astro";
import { getOnboardingState } from "../../../lib/services/onboarding.service";

export const prerender = false;

/**
 * GET /api/onboarding/state
 *
 * Retrieves the current onboarding state for the authenticated user.
 *
 * @returns 200 OK with OnboardingStateDTO { step: "not_started" | "platforms_selected" | "completed" }
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 404 Not Found if user profile doesn't exist
 * @returns 500 Internal Server Error for database errors
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: User not authenticated" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get onboarding state from service
    const state = await getOnboardingState(supabase);

    return new Response(JSON.stringify(state), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Log error for debugging (in production, use proper logging service)

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (error.message.includes("not found")) {
        return new Response(JSON.stringify({ error: "User profile not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Generic server error
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
