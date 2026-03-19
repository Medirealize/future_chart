import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/utils/supabase/server";
import LoginClient from "./LoginClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, target_years, future_title, core_value")
      .eq("id", user.id)
      .single();

    if (
      profile?.user_type &&
      profile.target_years != null &&
      profile.future_title != null &&
      profile.core_value != null
    ) {
      redirect("/dashboard");
    }
    redirect("/onboarding/diagnosis");
  }

  return <LoginClient />;
}

