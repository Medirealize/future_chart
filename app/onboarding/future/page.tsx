import { redirect } from "next/navigation";
import FutureSetupClient from "./FutureSetupClient";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { fetchProfileWithSchemaFallback } from "@/lib/profiles/fetchProfileWithSchemaFallback";

export const dynamic = "force-dynamic";

export default async function FutureSetupPage({
  searchParams,
}: {
  searchParams?: Promise<{ edit?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const forceEdit = params.edit === "1";
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { profile, hasBirthDateColumn } = await fetchProfileWithSchemaFallback(supabase, user.id);

  const onboardingComplete =
    profile?.target_years != null &&
    profile?.future_title != null &&
    profile?.core_value != null &&
    (!hasBirthDateColumn || profile?.birth_date != null);

  if (onboardingComplete && !forceEdit) redirect("/dashboard");

  return (
    <FutureSetupClient
      userType={profile?.user_type ?? null}
      initialTargetYears={profile?.target_years ?? null}
      initialFutureTitle={profile?.future_title ?? null}
      initialBirthDate={profile?.birth_date ?? null}
    />
  );
}

