import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import CoreValueClient from "./CoreValueClient";

export const dynamic = "force-dynamic";

export default async function CoreValuePage() {
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
  if (profile.target_years == null || profile.future_title == null) redirect("/onboarding/future");

  return (
    <CoreValueClient
      userType={profile.user_type}
      targetYears={profile.target_years}
      futureTitle={profile.future_title}
    />
  );
}

