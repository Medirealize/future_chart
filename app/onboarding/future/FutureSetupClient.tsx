"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Props = {
  userType: string;
  initialTargetYears: number | null;
  initialFutureTitle: string | null;
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
}: Props) {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const [targetYears, setTargetYears] = React.useState<string>(
    initialTargetYears != null ? String(initialTargetYears) : ""
  );
  const [futureTitle, setFutureTitle] = React.useState<string>(
    initialFutureTitle ?? ""
  );
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    // DBにある既存値を優先しつつ、ローカルにも保存して途中リロードに強くします
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

      localStorage.setItem(
        "onboarding_future",
        JSON.stringify({
          targetYears:
            initialTargetYears != null ? Number(initialTargetYears) : Number(targetYears || 0),
          futureTitle: initialFutureTitle ?? futureTitle,
        })
      );
    } catch {
      // localStorageが無効な環境などは無視
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleNext() {
    if (isSaving) return;

    const years = Number(targetYears);
    if (!Number.isFinite(years) || years <= 0) {
      alert("何年後か（target_years）を正しく入力してください。");
      return;
    }
    const title = futureTitle.trim();
    if (!title) {
      alert("未来の肩書き（future_title）を入力してください。");
      return;
    }

    localStorage.setItem(
      "onboarding_future",
      JSON.stringify({ targetYears: years, futureTitle: title })
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
            user_type: userType,
            target_years: years,
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
          あなたは何年後の自分からメッセージを受け取りますか？
        </h1>

        <div className="mt-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              target_years
            </label>
            <Input
              inputMode="numeric"
              type="number"
              min={1}
              step={1}
              value={targetYears}
              onChange={(e) => setTargetYears(e.target.value)}
              placeholder="例: 20"
            />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              何年後の自分からメッセージを受け取りますか？
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              future_title
            </label>
            <Input
              value={futureTitle}
              onChange={(e) => setFutureTitle(e.target.value)}
              placeholder="会社の会長 / ベストセラー作家 / 孫に慕われる隠居生活"
            />
            <div className="text-xs text-slate-500 dark:text-slate-400">
              その時のあなたの肩書きや状態は？
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

