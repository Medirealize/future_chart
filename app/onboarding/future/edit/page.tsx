import { redirect } from "next/navigation";
import FutureSetupClient from "../FutureSetupClient";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import { fetchProfileWithSchemaFallback } from "@/lib/profiles/fetchProfileWithSchemaFallback";

export const dynamic = "force-dynamic";

export default async function FutureSetupEditPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) redirect("/login");

  const { profile } = await fetchProfileWithSchemaFallback(supabase, user.id);

  return (
    <FutureSetupClient
      userType={profile?.user_type ?? null}
      initialTargetYears={profile?.target_years ?? null}
      initialFutureTitle={profile?.future_title ?? null}
      initialBirthDate={profile?.birth_date ?? null}
    />
  );
}
