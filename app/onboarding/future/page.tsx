import { redirect } from "next/navigation";
import FutureSetupClient from "./FutureSetupClient";
import { createSupabaseServerClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function FutureSetupPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("user_type, target_years, future_title, core_value, birth_date")
    .eq("id", user.id)
    .single();

  const onboardingComplete =
    profile?.birth_date != null &&
    profile?.target_years != null &&
    profile?.future_title != null &&
    profile?.core_value != null;

  if (onboardingComplete) redirect("/dashboard");

  return (
    <FutureSetupClient
      userType={profile?.user_type ?? null}
      initialTargetYears={profile?.target_years ?? null}
      initialFutureTitle={profile?.future_title ?? null}
      initialBirthDate={profile?.birth_date ?? null}
    />
  );
}

