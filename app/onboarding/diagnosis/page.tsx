import { redirect } from "next/navigation";
import QuizDiagnosisClient from "./QuizDiagnosisClient";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { fetchProfileWithSchemaFallback } from "@/lib/profiles/fetchProfileWithSchemaFallback";

export const dynamic = "force-dynamic";

export default async function DiagnosisPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { profile, hasBirthDateColumn } = await fetchProfileWithSchemaFallback(supabase, user.id);

  // 既に診断結果がある場合はスキップ（要件）
  if (profile?.user_type) {
    const complete =
      profile.target_years != null &&
      profile.future_title != null &&
      profile.core_value != null &&
      (!hasBirthDateColumn || profile.birth_date != null);
    redirect(complete ? "/dashboard" : "/onboarding/future");
  }

  return <QuizDiagnosisClient />;
}

