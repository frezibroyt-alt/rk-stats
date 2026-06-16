// Server-side Supabase client. Returns null when not configured,
// so the whole app still works in "API-only" mode without a database.
import "server-only";
import { createClient } from "@supabase/supabase-js";

let cached = null;

export function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (cached) return cached;
  cached = createClient(url, key, {
    auth: { persistSession: false },
  });
  return cached;
}

export const historyEnabled = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
