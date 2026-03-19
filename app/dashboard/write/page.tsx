import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import WriteEntryClient from "./WriteEntryClient";

export const dynamic = "force-dynamic";

export default async function WriteEntryPage({
  searchParams,
}: {
  searchParams: { date?: string; mode?: "reflection" | "edit" };
}) {
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
  if (profile.target_years == null || profile.future_title == null) redirect("/onboarding/future");
  if (profile.core_value == null) redirect("/onboarding/core");

  const date = searchParams.date;
  const mode = searchParams.mode ?? "reflection";

  if (!date) redirect("/dashboard");

  // mode/reflection を安全側に
  const safeMode = mode === "edit" ? "edit" : "reflection";

  return (
    <WriteEntryClient
      dateISO={date}
      mode={safeMode}
      futureTitle={profile.future_title}
      coreValue={profile.core_value}
    />
  );
}

