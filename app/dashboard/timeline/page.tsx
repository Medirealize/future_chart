import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import TimelineClient from "./TimelineClient";

export const dynamic = "force-dynamic";

export default async function TimelinePage() {
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

  const { data: entries } = await supabase
    .from("entries")
    .select("created_at, content, mode, ai_response, sync_score")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <TimelineClient
      entries={(entries ?? []).map((e: any) => ({
        created_at: e.created_at,
        content: e.content,
        mode: e.mode,
        ai_response: e.ai_response,
        sync_score: e.sync_score,
      }))}
    />
  );
}
