import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createSupabaseServerClient() {
  const normalize = (v: string | undefined) =>
    (v ?? "").trim().replace(/^['"]|['"]$/g, "");

  const url = normalize(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anonKey = normalize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!url || !anonKey) {
    // SSR でも原因切り分けのためログを出す
    console.error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定または空です。",
      {
        NEXT_PUBLIC_SUPABASE_URL: url ? "(set)" : "(empty)",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey ? "(set)" : "(empty)",
      }
    );
    throw new Error("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です。");
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll: async () => {
        const store = await cookies();
        return store.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
    },
  });
}

