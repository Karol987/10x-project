/* eslint-disable no-console */
import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerInstance } from "@/db/supabase.client";

// Disable prerendering for API routes
export const prerender = false;

// Validation schema for login request
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

/**
 * POST /api/auth/login
 * Authenticates user with email and password
 * Sets session cookies on success
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = loginSchema.safeParse(body);

    if (!validationResult.success) {
      const errors = validationResult.error.flatten().fieldErrors;
      return new Response(
        JSON.stringify({
          error: "Validation failed",
          fields: errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase SSR client
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map Supabase errors to user-friendly messages
      let errorMessage = "Nieprawidłowy email lub hasło";

      // Handle specific error cases
      if (error.message.includes("Email not confirmed")) {
        errorMessage = "Email nie został potwierdzony. Sprawdź swoją skrzynkę pocztową.";
      } else if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Nieprawidłowy email lub hasło";
      } else if (error.message.includes("Email rate limit exceeded")) {
        errorMessage = "Zbyt wiele prób logowania. Spróbuj ponownie za chwilę.";
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Success - cookies are automatically set by Supabase SSR client
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Login error:", error);

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas logowania. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
