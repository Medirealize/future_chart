import { redirect } from "next/navigation";
import QuizDiagnosisClient from "./QuizDiagnosisClient";
import { createSupabaseServerClient } from "@/utils/supabase/server";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, target_years, future_title, core_value, birth_date")
    .eq("id", user.id)
    .single();

  // 既に診断結果がある場合はスキップ（要件）
  if (profile?.user_type) {
    const complete =
      profile.birth_date != null &&
      profile.target_years != null &&
      profile.future_title != null &&
      profile.core_value != null;
    redirect(complete ? "/dashboard" : "/onboarding/future");
  }

  return <QuizDiagnosisClient />;
}

