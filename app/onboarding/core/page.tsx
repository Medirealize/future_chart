import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import CoreValueClient from "./CoreValueClient";
import { fetchProfileWithSchemaFallback } from "@/lib/profiles/fetchProfileWithSchemaFallback";

export const dynamic = "force-dynamic";

export default async function CoreValuePage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { profile, hasBirthDateColumn } = await fetchProfileWithSchemaFallback(supabase, user.id);

  if (!profile?.user_type) redirect("/onboarding/diagnosis");
  // core_value がすでに設定済みでも、明示的に編集したい場合（?edit=1）は入れる
  if (profile.core_value != null && resolvedSearchParams?.edit !== "1") redirect("/dashboard");
  if (
    profile.target_years == null ||
    profile.future_title == null ||
    (hasBirthDateColumn && profile.birth_date == null)
  ) {
    redirect("/onboarding/future");
  }

  return (
    <CoreValueClient
      userType={profile.user_type}
      targetYears={profile.target_years}
      futureTitle={profile.future_title}
      birthDate={profile.birth_date}
    />
  );
}

