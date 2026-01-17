import { defineMiddleware } from "astro:middleware";

import { createSupabaseServerInstance, supabaseClient } from "../db/supabase.client.ts";

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
  // Public assets
  "/favicon.png",
];

export const onRequest = defineMiddleware(
  async ({ locals, cookies, url, request, redirect }, next) => {
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

        // Redirect authenticated users from root to home
        if (url.pathname === "/") {
          return redirect("/home");
        }
      }

      return next();
    }

    // IMPORTANT: Always get user session first before any other operations
    const {
      data: { user },
    } = await supabaseSSR.auth.getUser();

    if (user) {
      locals.user = {
        email: user.email,
        id: user.id,
      };
    } else {
      // Redirect to login for protected routes
      return redirect("/auth/login");
    }

    return next();
  },
);
