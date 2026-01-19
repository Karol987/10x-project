// src/pages/api/onboarding/creators.ts

import type { APIRoute } from "astro";
import { updateCreators } from "../../../lib/services/onboarding.service";
import { OnboardingCreatorsSchema } from "../../../lib/schemas/onboarding.schema";

export const prerender = false;

/**
 * PUT /api/onboarding/creators
 *
 * Updates user's selected creators during onboarding.
 * Replaces all existing creator selections with the new ones.
 * Completes onboarding by setting status to 'completed'.
 *
 * @body { creators: (UUID | CreatorObject)[] } - Array of creator UUIDs or full creator objects (min: 3, max: 50)
 * @returns 204 No Content on success
 * @returns 400 Bad Request if JSON is malformed
 * @returns 401 Unauthorized if user is not authenticated
 * @returns 422 Unprocessable Entity if validation fails
 * @returns 500 Internal Server Error for database errors
 */
export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const supabase = locals.supabase;

    // Check authentication early
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

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Validate input with Zod schema
    const validationResult = OnboardingCreatorsSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.errors.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      }));

      return new Response(
        JSON.stringify({
          error: "Validation failed",
          details: errors,
        }),
        {
          status: 422,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Update creators via service
    await updateCreators(supabase, validationResult.data.creators);

    // Return 204 No Content on success
    return new Response(null, {
      status: 204,
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

      // Database constraint violations or foreign key errors
      if (error.message.includes("violates foreign key")) {
        return new Response(
          JSON.stringify({
            error: "One or more creator IDs are invalid",
          }),
          {
            status: 422,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Generic server error
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
