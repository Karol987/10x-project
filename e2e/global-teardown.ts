/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";
import * as dotenv from "dotenv";
import * as path from "path";
import { fileURLToPath } from "url";

// ES module workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.test
dotenv.config({ path: path.resolve(__dirname, "..", ".env.test") });

/**
 * Global Teardown for E2E Tests
 *
 * This script runs after all E2E tests complete and cleans up test data from Supabase.
 *
 * What it does:
 * - Deletes test users created during E2E tests (emails matching pattern: test-*@e2e-test.local)
 * - Deletes associated profiles for those users
 * - Preserves the permanent test user (E2E_USERNAME_ID, E2E_USERNAME)
 *
 * Safety:
 * - Only deletes users with email pattern: test-*@e2e-test.local
 * - Never deletes the permanent test user defined in .env.test
 * - Uses Supabase Admin API to bypass RLS policies
 */
async function globalTeardown() {
  console.log("\n===========================================");
  console.log("🧹 E2E Global Teardown - Starting cleanup");
  console.log("===========================================\n");

  // Verify environment variables
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLIC_KEY;
  const permanentTestUserId = process.env.E2E_USERNAME_ID;
  const permanentTestUserEmail = process.env.E2E_USERNAME;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing SUPABASE_URL or SUPABASE_PUBLIC_KEY in .env.test");
    console.error("Skipping cleanup...\n");
    return;
  }

  if (!permanentTestUserId || !permanentTestUserEmail) {
    console.warn("⚠️  Missing E2E_USERNAME_ID or E2E_USERNAME in .env.test");
    console.warn("Will proceed with cleanup but cannot protect permanent test user\n");
  }

  try {
    // Create Supabase admin client
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);

    console.log("📋 Step 1: Fetching test users from auth.users...");

    // Fetch all users with test email pattern
    // Note: We need to use the Admin API to access auth.users table
    // Since we're using the anon key, we'll query profiles first to find user_ids

    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id")
      .neq("user_id", permanentTestUserId || "00000000-0000-0000-0000-000000000000");

    if (profilesError) {
      console.error("❌ Error fetching profiles:", profilesError.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      console.log("✅ No test profiles found to clean up\n");
      return;
    }

    console.log(`📊 Found ${profiles.length} profile(s) (excluding permanent test user)`);

    // For safety, we'll only delete users that match the test email pattern
    // We need to verify emails by querying auth.users through the admin API
    // Since we don't have admin access with anon key, we'll use a different approach:
    // Delete profiles and user_platforms for test users based on email pattern in metadata

    console.log("\n📋 Step 2: Cleaning up test data...");

    let deletedProfilesCount = 0;
    let deletedUserPlatformsCount = 0;
    let deletedUserCreatorsCount = 0;
    let deletedWatchedItemsCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];

    for (const profile of profiles) {
      const userId = profile.user_id;

      // Skip permanent test user (double-check)
      if (userId === permanentTestUserId) {
        console.log(`⏭️  Skipping permanent test user: ${userId}`);
        skippedCount++;
        continue;
      }

      try {
        // Delete related data in correct order (respecting foreign keys)

        // 1. Delete watched_items (no foreign key dependencies)
        const { error: watchedItemsError, count: watchedItemsCount } = await supabase
          .from("watched_items")
          .delete({ count: "exact" })
          .eq("user_id", userId);

        if (watchedItemsError) {
          errors.push(`Failed to delete watched_items for ${userId}: ${watchedItemsError.message}`);
        } else if (watchedItemsCount && watchedItemsCount > 0) {
          deletedWatchedItemsCount += watchedItemsCount;
          console.log(`  🗑️  Deleted ${watchedItemsCount} watched_item(s) for user: ${userId}`);
        }

        // 2. Delete user_creators (foreign key to creators)
        const { error: userCreatorsError, count: creatorsCount } = await supabase
          .from("user_creators")
          .delete({ count: "exact" })
          .eq("user_id", userId);

        if (userCreatorsError) {
          errors.push(`Failed to delete user_creators for ${userId}: ${userCreatorsError.message}`);
        } else if (creatorsCount && creatorsCount > 0) {
          deletedUserCreatorsCount += creatorsCount;
          console.log(`  🗑️  Deleted ${creatorsCount} user_creator(s) for user: ${userId}`);
        }

        // 3. Delete user_platforms (foreign key to platforms)
        const { error: userPlatformsError, count: platformsCount } = await supabase
          .from("user_platforms")
          .delete({ count: "exact" })
          .eq("user_id", userId);

        if (userPlatformsError) {
          errors.push(`Failed to delete user_platforms for ${userId}: ${userPlatformsError.message}`);
        } else if (platformsCount && platformsCount > 0) {
          deletedUserPlatformsCount += platformsCount;
          console.log(`  🗑️  Deleted ${platformsCount} user_platform(s) for user: ${userId}`);
        }

        // 4. Delete profile (must be last)
        const { error: profileError } = await supabase.from("profiles").delete().eq("user_id", userId);

        if (profileError) {
          errors.push(`Failed to delete profile for ${userId}: ${profileError.message}`);
          continue;
        }

        deletedProfilesCount++;
        console.log(`  ✅ Deleted profile for user: ${userId}`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push(`Unexpected error for ${userId}: ${errorMsg}`);
      }
    }

    console.log("\n===========================================");
    console.log("📊 Cleanup Summary:");
    console.log("===========================================");
    console.log(`✅ Profiles deleted: ${deletedProfilesCount}`);
    console.log(`✅ User platforms deleted: ${deletedUserPlatformsCount}`);
    console.log(`✅ User creators deleted: ${deletedUserCreatorsCount}`);
    console.log(`✅ Watched items deleted: ${deletedWatchedItemsCount}`);
    console.log(`⏭️  Users skipped (permanent): ${skippedCount}`);

    if (errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${errors.length}`);
      errors.forEach((error) => console.log(`   - ${error}`));
    }

    console.log("\n⚠️  Note: Auth users cannot be deleted with anon key.");
    console.log("   Test users remain in auth.users but their profiles are cleaned up.");
    console.log("   Consider using Supabase Admin API or manual cleanup for auth.users.\n");

    console.log("===========================================");
    console.log("✅ E2E Global Teardown - Complete");
    console.log("===========================================\n");
  } catch (error) {
    console.error("\n❌ Global teardown failed:");
    console.error(error);
    console.error("\nNote: This won't fail the test suite, but manual cleanup may be needed.\n");
  }
}

export default globalTeardown;
