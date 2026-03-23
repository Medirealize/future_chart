"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { broadcastCoreValueUpdate } from "@/utils/core-value-sync";
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

const CORE_VALUE_MEANINGS: Record<(typeof CORE_VALUES)[number], string> = {
  初志貫徹: "最初に決めた志を最後まで突き通すこと",
  着眼大局: "目先ではなく大きな目的を見て判断すること",
  一期一会: "一生に一度しかない出会いを大切にすること",
  虚心坦懐: "心を開いて素直に向き合うこと",
  不撓不屈: "くじけず最後まで努力し続けること",
  明朗快活: "明るく前向きで元気に振る舞うこと",
  自他共栄: "自分も相手も、ともに栄えること",
  迅速果断: "素早く決断し行動すること",
  質実剛健: "飾らずに堅実で、心身を強く保つこと",
  温故知新: "古い知識を学び、そこから新しい知恵を得ること",
};

type Props = {
  userType: string;
  targetYears: number | null;
  futureTitle: string | null;
  birthDate: string | null;
};

export default function CoreValueClient({
  userType,
  targetYears,
  futureTitle,
  birthDate,
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
          birthDate: birthDate ?? undefined,
          targetYears: targetYears ?? undefined,
          futureTitle: futureTitle ?? undefined,
        })
      );
    } catch {
      // ignore
    }
  }, [birthDate, futureTitle, targetYears, userType]);

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
      const finalBirthDate: string = String(
        future?.birthDate ?? birthDate ?? ""
      ).trim();

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
      if (!/^\d{4}-\d{2}-\d{2}$/.test(finalBirthDate)) {
        alert("生年月日のデータが不足しています。未来設定からやり直してください。");
        router.push("/onboarding/future");
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authData.user.id,
            user_type: finalUserType,
            birth_date: finalBirthDate,
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

      broadcastCoreValueUpdate(selected);

      // 後続で不要な状態を消す
      localStorage.removeItem("onboarding_diagnosis");
      localStorage.removeItem("onboarding_future");

      await router.refresh();
      router.push("/dashboard");
    } finally {
      setIsSaving(false);
    }
  }

  const options: ToggleGroupOption[] = CORE_VALUES.map((v) => ({
    value: v,
    label: `${v}（${CORE_VALUE_MEANINGS[v]}）`,
  }));

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

