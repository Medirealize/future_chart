"use client";

import { createBrowserClient } from "@supabase/ssr";

export function createSupabaseBrowserClient() {
  const normalize = (v: string | undefined) =>
    (v ?? "").trim().replace(/^['"]|['"]$/g, "");

  const url = normalize(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    console.error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定または空です。",
      {
        NEXT_PUBLIC_SUPABASE_URL: url ? "(set)" : "(empty)",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? "(set)" : "(empty)",
      }
    );
    throw new Error("Supabase env is not configured.");
  }

  return createBrowserClient(url, anonKey);
}

