// src/lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

// Vite frontend env vars MUST be prefixed with VITE_
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Don't throw at import-time. It nukes your whole app and gives you that 500.
if (!url || !anon) {
  console.error(
    "Supabase env missing. Make sure you have VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env (and restart dev server).",
    { hasUrl: !!url, hasAnon: !!anon }
  );
}

export const supabaseConfigured = Boolean(url && anon);

// createClient("") throws "supabaseUrl is required" and blanks the whole app,
// so fall back to a harmless placeholder: the page still renders and product
// queries simply fail (logged above) until the env vars are set.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anon || "placeholder-anon-key"
);