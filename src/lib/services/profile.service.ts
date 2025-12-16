// src/lib/services/profile.service.ts

import type { SupabaseClient } from "../../db/supabase.client";
import type { ProfileDTO, UUID } from "../../types";

/**
 * Profile Service
 * Handles all profile-related database operations
 */
export class ProfileService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Get user profile by user ID
   * @param userId - The user's UUID
   * @returns ProfileDTO or null if not found
   * @throws Error if database operation fails
   */
  async getByUserId(userId: UUID): Promise<ProfileDTO | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("user_id, created_at, onboarding_status")
      .eq("user_id", userId)
      .single();

    if (error) {
      // PGRST116 = no rows returned
      if (error.code === "PGRST116") {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Update the onboarding step for a user profile
   * @param userId - The user's UUID
   * @param step - The new onboarding status
   * @returns Updated ProfileDTO
   * @throws Error if database operation fails or profile not found
   */
  async updateOnboardingStep(userId: UUID, step: ProfileDTO["onboarding_status"]): Promise<ProfileDTO> {
    const { data, error } = await this.supabase
      .from("profiles")
      .update({ onboarding_status: step })
      .eq("user_id", userId)
      .select("user_id, created_at, onboarding_status")
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Profile not found");
    }

    return data;
  }
}
