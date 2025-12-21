// src/lib/services/onboarding.service.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { OnboardingStateDTO, UUID } from "../../types";

/**
 * Retrieves the current onboarding state for the authenticated user.
 *
 * @param supabase - Authenticated Supabase client
 * @returns OnboardingStateDTO with current onboarding step
 * @throws Error if profile not found or database error occurs
 */
export async function getOnboardingState(supabase: SupabaseClient): Promise<OnboardingStateDTO> {
  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // Fetch user profile with onboarding status
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("onboarding_status")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    throw new Error(`Failed to fetch profile: ${profileError.message}`);
  }

  if (!profile) {
    throw new Error("Profile not found");
  }

  return {
    step: profile.onboarding_status,
  };
}

/**
 * Updates user's selected platforms and advances onboarding state.
 * Replaces all existing platform selections with the new ones.
 *
 * @param supabase - Authenticated Supabase client
 * @param platformIds - Array of platform UUIDs to associate with user
 * @throws Error if user not authenticated or database operation fails
 */
export async function updatePlatforms(supabase: SupabaseClient, platformIds: UUID[]): Promise<void> {
  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // Step 1: Delete all existing user_platforms entries
  const { error: deleteError } = await supabase.from("user_platforms").delete().eq("user_id", user.id);

  if (deleteError) {
    throw new Error(`Failed to delete existing platforms: ${deleteError.message}`);
  }

  // Step 2: Insert new platform associations
  const platformsToInsert = platformIds.map((platformId) => ({
    user_id: user.id,
    platform_id: platformId,
  }));

  const { error: insertError } = await supabase.from("user_platforms").insert(platformsToInsert);

  if (insertError) {
    throw new Error(`Failed to insert platforms: ${insertError.message}`);
  }

  // Step 3: Update onboarding status to 'platforms_selected'
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ onboarding_status: "platforms_selected" })
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`Failed to update onboarding status: ${updateError.message}`);
  }
}

/**
 * Updates user's selected creators and completes onboarding.
 * Replaces all existing creator selections with the new ones.
 *
 * @param supabase - Authenticated Supabase client
 * @param creatorIds - Array of creator UUIDs to associate with user
 * @throws Error if user not authenticated or database operation fails
 */
export async function updateCreators(supabase: SupabaseClient, creatorIds: UUID[]): Promise<void> {
  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized: User not authenticated");
  }

  // Step 1: Delete all existing user_creators entries
  const { error: deleteError } = await supabase.from("user_creators").delete().eq("user_id", user.id);

  if (deleteError) {
    throw new Error(`Failed to delete existing creators: ${deleteError.message}`);
  }

  // Step 2: Insert new creator associations
  const creatorsToInsert = creatorIds.map((creatorId) => ({
    user_id: user.id,
    creator_id: creatorId,
  }));

  const { error: insertError } = await supabase.from("user_creators").insert(creatorsToInsert);

  if (insertError) {
    throw new Error(`Failed to insert creators: ${insertError.message}`);
  }

  // Step 3: Update onboarding status to 'completed'
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ onboarding_status: "completed" })
    .eq("user_id", user.id);

  if (updateError) {
    throw new Error(`Failed to update onboarding status: ${updateError.message}`);
  }
}
