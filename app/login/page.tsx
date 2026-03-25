import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import LoginClient from "./LoginClient";
import { fetchProfileWithSchemaFallback } from "@/lib/profiles/fetchProfileWithSchemaFallback";

export const metadata: Metadata = {
  title: "ログイン | 未来からの処方箋",
  description: "Prescription from the Future — 日記と未来の自分をつなぐアプリ",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    const { profile, hasBirthDateColumn } = await fetchProfileWithSchemaFallback(supabase, user.id);

    if (
      profile?.user_type &&
      profile.target_years != null &&
      profile.future_title != null &&
      profile.core_value != null &&
      (!hasBirthDateColumn || profile.birth_date != null)
    ) {
      redirect("/dashboard");
    }
    redirect("/onboarding/diagnosis");
  }

  return <LoginClient />;
}

