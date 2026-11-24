import { createClient } from "@supabase/supabase-js";

const rawUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const key = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

// Supabase expects the bare project URL (https://<ref>.supabase.co). Values copied from the
// dashboard sometimes include a path such as "/rest/v1/", which makes auth requests fail with
// "Invalid path specified in request URL". Keep only the origin to be resilient to that.
function normalizeSupabaseUrl(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
}

const url = normalizeSupabaseUrl(rawUrl);

export const isSupabaseConfigured = Boolean(url && key && !url.includes("YOUR_PROJECT"));

export const supabase = isSupabaseConfigured
  ? createClient(url!, key!)
  : null;
