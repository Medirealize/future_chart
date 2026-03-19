"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { Button } from "@/components/ui/button";
import { ToggleGroup, type ToggleGroupOption } from "@/components/ui/toggle-group";

const CORE_VALUES = [
  "初志貫徹",
  "着眼大局",
  "一期一会",
  "虚心坦懐",
  "不撓不屈",
  "明朗快活",
  "自他共栄",
  "迅速果断",
  "質実剛健",
  "温故知新",
] as const;

type Props = {
  userType: string;
  targetYears: number | null;
  futureTitle: string | null;
};

export default function CoreValueClient({
  userType,
  targetYears,
  futureTitle,
}: Props) {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const [selected, setSelected] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  React.useEffect(() => {
    try {
      localStorage.setItem(
        "onboarding_diagnosis",
        JSON.stringify({ userType, answers: [] })
      );
      localStorage.setItem(
        "onboarding_future",
        JSON.stringify({
          targetYears: targetYears ?? undefined,
          futureTitle: futureTitle ?? undefined,
        })
      );
    } catch {
      // ignore
    }
  }, [futureTitle, targetYears, userType]);

  async function handleSave() {
    if (!selected) return;
    setIsSaving(true);
    try {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error || !authData.user) {
        alert("ログイン情報の取得に失敗しました。");
        router.push("/login");
        return;
      }

      const diagnosisRaw = localStorage.getItem("onboarding_diagnosis");
      const futureRaw = localStorage.getItem("onboarding_future");
      const diagnosis = diagnosisRaw ? JSON.parse(diagnosisRaw) : null;
      const future = futureRaw ? JSON.parse(futureRaw) : null;

      const finalUserType: string = diagnosis?.userType ?? userType;
      const finalTargetYears: number =
        Number(future?.targetYears ?? targetYears);
      const finalFutureTitle: string =
        String(future?.futureTitle ?? futureTitle ?? "").trim();

      if (!finalUserType || !Number.isFinite(finalTargetYears) || finalTargetYears <= 0) {
        alert("未来設定のデータが不足しています。もう一度最初から行ってください。");
        router.push("/onboarding/future");
        return;
      }
      if (!finalFutureTitle) {
        alert("未来の肩書きが不足しています。もう一度最初から行ってください。");
        router.push("/onboarding/future");
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authData.user.id,
            user_type: finalUserType,
            target_years: finalTargetYears,
            future_title: finalFutureTitle,
            core_value: selected,
          },
          { onConflict: "id" }
        );

      if (upsertError) {
        alert(`保存に失敗しました: ${upsertError.message}`);
        return;
      }

      // 後続で不要な状態を消す
      localStorage.removeItem("onboarding_diagnosis");
      localStorage.removeItem("onboarding_future");

      router.push("/dashboard");
    } finally {
      setIsSaving(false);
    }
  }

  const options: ToggleGroupOption[] = CORE_VALUES.map((v) => ({ value: v, label: v }));

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="text-sm text-slate-600 dark:text-slate-300">合言葉選択</div>
        <h1 className="mt-2 text-xl font-semibold">未来のあなたの「合言葉」を選んでください</h1>

        <div className="mt-6">
          <ToggleGroup
            type="single"
            value={selected}
            onValueChange={setSelected}
            options={options}
            className="grid-cols-1 sm:grid-cols-2"
          />
        </div>

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button variant="ghost" onClick={() => router.push("/onboarding/future")} disabled={isSaving}>
            戻る
          </Button>
          <Button onClick={handleSave} disabled={!selected || isSaving}>
            {isSaving ? "保存中..." : "未来の自分と繋がる"}
          </Button>
        </div>
      </div>
    </div>
  );
}

