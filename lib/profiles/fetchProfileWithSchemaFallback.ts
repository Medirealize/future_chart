type ProfileRow = {
  user_type: string | null;
  target_years: number | null;
  future_title: string | null;
  core_value: string | null;
  birth_date: string | null;
};

type FetchProfileResult = {
  profile: ProfileRow | null;
  hasBirthDateColumn: boolean;
};

function isBirthDateMissingError(error: { message?: string } | null | undefined): boolean {
  return Boolean(error?.message?.includes("birth_date"));
}

export async function fetchProfileWithSchemaFallback(
  supabase: any,
  userId: string
): Promise<FetchProfileResult> {
  const withBirthDate = await supabase
    .from("profiles")
    .select("user_type, target_years, future_title, core_value, birth_date")
    .eq("id", userId)
    .maybeSingle();

  if (!isBirthDateMissingError(withBirthDate.error)) {
    return {
      profile: (withBirthDate.data as ProfileRow | null) ?? null,
      hasBirthDateColumn: true,
    };
  }

  const fallback = await supabase
    .from("profiles")
    .select("user_type, target_years, future_title, core_value")
    .eq("id", userId)
    .maybeSingle();

  return {
    profile: fallback.data
      ? {
          ...(fallback.data as Omit<ProfileRow, "birth_date">),
          birth_date: null,
        }
      : null,
    hasBirthDateColumn: false,
  };
}
