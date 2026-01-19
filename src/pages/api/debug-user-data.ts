// DEBUG endpoint - usuń po rozwiązaniu problemu
import type { APIRoute } from "astro";
import { jsonResponse, errorResponse } from "../../lib/utils";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    const supabase = locals.supabase;
    const user = locals.user;

    if (!user) {
      return errorResponse("Unauthorized", 401, "Authentication required");
    }

    // Fetch user's creators with full data
    const { data: userCreators, error: creatorsError } = await supabase
      .from("user_creators")
      .select("creator_id, creators(id, external_api_id, name, creator_role)")
      .eq("user_id", user.id);

    // Fetch user's platforms
    const { data: userPlatforms, error: platformsError } = await supabase
      .from("user_platforms")
      .select("platform_id, platforms(id, slug, name)")
      .eq("user_id", user.id);

    return jsonResponse(
      {
        userId: user.id,
        userCreators: {
          data: userCreators,
          error: creatorsError,
        },
        userPlatforms: {
          data: userPlatforms,
          error: platformsError,
        },
      },
      200
    );
  } catch (error) {
    return errorResponse("ServerError", 500, "Internal server error", error);
  }
};
