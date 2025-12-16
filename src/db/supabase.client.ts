import { createClient, type SupabaseClient as SupabaseClientBase } from "@supabase/supabase-js";

import type { Database } from "../db/database.types.ts";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typed SupabaseClient for use across the application
export type SupabaseClient = SupabaseClientBase<Database>;

export const DEFAULT_USER_ID = "0d64eeaf-dbb0-4998-8a07-41eb37696f2a";
