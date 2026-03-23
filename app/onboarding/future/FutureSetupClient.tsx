"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { differenceInYears, isAfter, startOfDay } from "date-fns";
import { parseDateOnlyLocal } from "@/lib/dashboard/countdown";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  userType: string | null;
  initialTargetYears: number | null;
  initialFutureTitle: string | null;
  initialBirthDate: string | null;
};

function parseOnboardingStorage<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function FutureSetupClient({
  userType,
  initialTargetYears,
  initialFutureTitle,
  initialBirthDate,
}: Props) {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const [birthDate, setBirthDate] = React.useState<string>(
    initialBirthDate ? String(initialBirthDate).slice(0, 10) : ""
  );
  const [targetAge, setTargetAge] = React.useState<string>(
    initialTargetYears != null ? String(initialTargetYears) : ""
  );
  const [futureTitle, setFutureTitle] = React.useState<string>(
    initialFutureTitle ?? ""
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [resolvedUserType, setResolvedUserType] = React.useState<string>(userType ?? "");

  React.useEffect(() => {
    try {
      const existingDiagnosis = parseOnboardingStorage<{ userType: string; answers: string[] }>(
        "onboarding_diagnosis"
      );
      if (!existingDiagnosis && userType) {
        localStorage.setItem(
          "onboarding_diagnosis",
          JSON.stringify({ userType, answers: [] })
        );
      }
      const fallbackUserType = existingDiagnosis?.userType ?? userType ?? "";
      if (fallbackUserType) {
        setResolvedUserType(fallbackUserType);
      }

      localStorage.setItem(
        "onboarding_future",
        JSON.stringify({
          birthDate: birthDate || initialBirthDate || undefined,
          targetYears: Number(targetAge || initialTargetYears || 0) || undefined,
          futureTitle: futureTitle || initialFutureTitle || "",
        })
      );
    } catch {
      // ignore
    }
  }, [birthDate, futureTitle, initialBirthDate, initialFutureTitle, initialTargetYears, targetAge, userType]);

  async function handleNext() {
    if (isSaving) return;

    const birth = birthDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) {
      alert("生年月日を「YYYY-MM-DD」形式で入力してください（例: 1990-05-12）。");
      return;
    }
    let birthDay: Date;
    try {
      birthDay = parseDateOnlyLocal(birth);
    } catch {
      alert("生年月日が正しくありません。");
      return;
    }
    if (isAfter(birthDay, startOfDay(new Date()))) {
      alert("生年月日は今日以前の日付を入力してください。");
      return;
    }

    const age = Number(targetAge);
    if (!Number.isFinite(age) || age < 1 || age > 120) {
      alert("目標とする年齢（1〜120歳）を正しく入力してください。");
      return;
    }

    const ageNow = differenceInYears(startOfDay(new Date()), birthDay);
    if (age <= ageNow) {
      alert(`目標の年齢は、現在の年齢（おおよそ${ageNow}歳）より大きい値にしてください。`);
      return;
    }

    const title = futureTitle.trim();
    if (!title) {
      alert("未来の肩書きを入力してください。");
      return;
    }

    const finalUserType = resolvedUserType.trim();
    if (!finalUserType) {
      alert("診断結果が見つかりません。もう一度、簡易タイプ診断から進めてください。");
      router.push("/onboarding/diagnosis");
      return;
    }

    localStorage.setItem(
      "onboarding_future",
      JSON.stringify({
        birthDate: birth,
        targetYears: age,
        futureTitle: title,
      })
    );

    setIsSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        alert("ログイン情報の取得に失敗しました。");
        router.push("/login");
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authData.user.id,
            user_type: finalUserType,
            birth_date: birth,
            target_years: age,
            future_title: title,
          },
          { onConflict: "id" }
        );

      if (upsertError) {
        alert(`未来設定の保存に失敗しました: ${upsertError.message}`);
        return;
      }

      router.push("/onboarding/core");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm text-slate-600 dark:text-slate-300">未来設定</div>
        <h1 className="mt-2 text-xl font-semibold">
          何歳の自分から、メッセージを受け取りますか？
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          生年月日と目標の年齢から、「その誕生日」までの残り日数をカウントダウンします。
        </p>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              生年月日
            </label>
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="rounded-xl"
            />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              カレンダーから選ぶか、YYYY-MM-DD で入力してください。
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              目標とする年齢（○歳の自分）
            </label>
            <Input
              inputMode="numeric"
              type="number"
              min={1}
              max={120}
              step={1}
              value={targetAge}
              onChange={(e) => setTargetAge(e.target.value)}
              placeholder="例: 60"
            />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              その年齢の誕生日まで、あと何年何ヶ月何日と表示します。
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              そのときの肩書き・姿
            </label>
            <Input
              value={futureTitle}
              onChange={(e) => setFutureTitle(e.target.value)}
              placeholder="会社の会長 / ベストセラー作家 / 孫に慕われる隠居生活"
            />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              未来のあなたの肩書きや状態を短く入力してください。
            </div>
          </div>
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => router.push("/onboarding/diagnosis")}
            disabled={isSaving}
          >
            戻る
          </Button>
          <Button onClick={handleNext} disabled={isSaving}>
            {isSaving ? "保存中..." : "次へ"}
          </Button>
        </div>
      </div>
    </div>
  );
}
