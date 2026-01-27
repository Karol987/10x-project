/* eslint-disable no-console */
import type { APIRoute } from "astro";
import { z } from "zod";

import { createSupabaseServerInstance } from "@/db/supabase.client";

// Disable prerendering for API routes
export const prerender = false;

// Validation schema for registration request
const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/\d/, "Hasło musi zawierać przynajmniej jedną cyfrę")
      .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/, "Hasło musi zawierać przynajmniej jeden znak specjalny"),
    confirmPassword: z.string().min(1, "Potwierdzenie hasła jest wymagane"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Hasła nie są zgodne",
    path: ["confirmPassword"],
  });

/**
 * POST /api/auth/register
 * Creates a new user account with email and password
 * Sets session cookies on success
 *
 * Note: In production, Supabase typically sends a confirmation email.
 * Users must verify their email before they can sign in.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = registerSchema.safeParse(body);

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

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email redirect URL after confirmation
        emailRedirectTo: `${new URL(request.url).origin}/auth/login`,
      },
    });

    if (error) {
      // Map Supabase errors to user-friendly messages
      let errorMessage = "Nie udało się utworzyć konta";

      // Handle specific error cases
      if (error.message.includes("User already registered")) {
        errorMessage = "Użytkownik o tym adresie email już istnieje";
      } else if (error.message.includes("Password should be at least")) {
        errorMessage = "Hasło jest zbyt słabe";
      } else if (error.message.includes("Signup requires a valid password")) {
        errorMessage = "Hasło jest wymagane";
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Zbyt wiele prób rejestracji. Spróbuj ponownie za chwilę.";
      }

      return new Response(
        JSON.stringify({
          error: errorMessage,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Check if email confirmation is required
    const requiresConfirmation = data.user && !data.session;

    // Success - cookies are automatically set by Supabase SSR client (if session exists)
    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: data.user?.id,
          email: data.user?.email,
        },
        requiresConfirmation,
        message: requiresConfirmation
          ? "Konto zostało utworzone. Sprawdź swoją skrzynkę pocztową i kliknij w link potwierdzający, aby aktywować konto."
          : "Konto zostało utworzone pomyślnie",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Registration error:", error);

    return new Response(
      JSON.stringify({
        error: "Wystąpił błąd podczas rejestracji. Spróbuj ponownie.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
