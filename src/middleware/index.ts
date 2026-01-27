/* eslint-disable no-console */
import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance } from "../db/supabase.client.ts";

// Public paths - Auth API endpoints & Server-Rendered Astro Pages
const PUBLIC_PATHS = [
  // Public landing page
  "/",
  // Server-Rendered Astro Pages
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/update-password",
  // Auth API endpoints
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout",
  "/api/auth/reset-password",
  "/api/auth/update-password",
  // Public API endpoints
  "/api/creators",
  "/api/platforms",
  // Public assets
  "/favicon.png",
];

// Onboarding paths - require authentication but accessible during onboarding
const ONBOARDING_PATHS = [
  "/onboarding/platforms",
  "/onboarding/creators",
  "/api/onboarding/state",
  "/api/onboarding/platforms",
  "/api/onboarding/creators",
];

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  // Create SSR-aware Supabase client for all operations
  const supabaseSSR = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Use SSR client instead of legacy client
  locals.supabase = supabaseSSR;

  // Skip auth check for public paths and static assets
  if (PUBLIC_PATHS.includes(url.pathname) || url.pathname.startsWith("/_")) {
    // IMPORTANT: Always get user session first before any other operations
    const {
      data: { user },
    } = await supabaseSSR.auth.getUser();

    if (user) {
      locals.user = {
        email: user.email,
        id: user.id,
      };

      // Redirect authenticated users from root based on onboarding status
      if (url.pathname === "/") {
        try {
          // Check onboarding status
          const { data: profile } = await supabaseSSR
            .from("profiles")
            .select("onboarding_status")
            .eq("user_id", user.id)
            .single();

          if (profile) {
            // Redirect based on onboarding progress
            if (profile.onboarding_status === "not_started") {
              return redirect("/onboarding/platforms");
            } else if (profile.onboarding_status === "platforms_selected") {
              return redirect("/onboarding/creators");
            } else if (profile.onboarding_status === "completed") {
              return redirect("/home");
            }
          }
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          // Fallback to platforms if error
          return redirect("/onboarding/platforms");
        }
      }
    }

    return next();
  }

  // IMPORTANT: Always get user session first before any other operations
  const {
    data: { user },
  } = await supabaseSSR.auth.getUser();

  if (!user) {
    // Redirect to login for protected routes
    return redirect("/auth/login");
  }

  // User is authenticated - set in locals
  locals.user = {
    email: user.email,
    id: user.id,
  };

  // Check if this is an onboarding path
  const isOnboardingPath = ONBOARDING_PATHS.some((path) => url.pathname.startsWith(path));

  // For onboarding paths, allow access (they handle their own state)
  if (isOnboardingPath) {
    return next();
  }

  // For all other protected routes, check onboarding completion
  try {
    const { data: profile, error: profileError } = await supabaseSSR
      .from("profiles")
      .select("onboarding_status")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Error fetching profile:", profileError);
      // If profile doesn't exist, redirect to start onboarding
      return redirect("/onboarding/platforms");
    }

    // Redirect to appropriate onboarding step if not completed
    if (profile.onboarding_status === "not_started") {
      return redirect("/onboarding/platforms");
    } else if (profile.onboarding_status === "platforms_selected") {
      return redirect("/onboarding/creators");
    }

    // Onboarding completed - allow access to protected routes
    return next();
  } catch (error) {
    console.error("Unexpected error in onboarding check:", error);
    // Safe fallback - redirect to start onboarding
    return redirect("/onboarding/platforms");
  }
});
