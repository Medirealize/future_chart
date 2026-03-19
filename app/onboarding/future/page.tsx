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
    .select("user_type, target_years, future_title, core_value")
    .eq("id", user.id)
    .single();

  if (!profile?.user_type) redirect("/onboarding/diagnosis");

  if (profile.core_value != null) redirect("/dashboard");

  return (
    <FutureSetupClient
      userType={profile.user_type}
      initialTargetYears={profile.target_years}
      initialFutureTitle={profile.future_title}
    />
  );
}

