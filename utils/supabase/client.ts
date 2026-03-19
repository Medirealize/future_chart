"use client";

import { createBrowserClient } from "@supabase/ssr";

function normalizeEnv(v: string | undefined) {
  return (v ?? "").trim().replace(/^['"]|['"]$/g, "");
}

export function getSupabaseEnvDebugInfo() {
  const url = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  let urlHost: string | null = null;
  try {
    urlHost = url ? new URL(url).host : null;
  } catch {
    urlHost = url ? "(invalid url)" : null;
  }

  return {
    urlPresent: Boolean(url),
    anonKeyPresent: Boolean(anonKey),
    urlHost,
    anonKeyPrefix: anonKey ? `${anonKey.slice(0, 6)}...` : null, // 値そのものは出さない
  };
}

export function createSupabaseClient() {
  const url = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalizeEnv(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    const dbg = getSupabaseEnvDebugInfo();
    console.error("[Supabase] client init failed: env not configured.", dbg);
    throw new Error("Supabase env is not configured (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).");
  }

  return createBrowserClient(url, anonKey);
}

