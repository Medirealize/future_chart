import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import CalendarClient from "./CalendarClient";
import { fetchProfileWithSchemaFallback } from "@/lib/profiles/fetchProfileWithSchemaFallback";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { profile, hasBirthDateColumn } = await fetchProfileWithSchemaFallback(supabase, user.id);

  if (!profile?.user_type) redirect("/onboarding/diagnosis");
  if (
    profile.target_years == null ||
    profile.future_title == null ||
    (hasBirthDateColumn && profile.birth_date == null)
  ) {
    redirect("/onboarding/future");
  }
  if (profile.core_value == null) redirect("/onboarding/core");

  const { data: entries } = await supabase
    .from("entries")
    .select("created_at, content, mode, ai_response")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <CalendarClient
      userType={profile.user_type}
      futureTitle={profile.future_title}
      birthDate={profile.birth_date}
      targetAge={profile.target_years}
      coreValue={profile.core_value}
      entries={(entries ?? []).map((e: any) => ({
        created_at: e.created_at,
        content: e.content,
        mode: e.mode,
        ai_response: e.ai_response,
      }))}
    />
  );
}

