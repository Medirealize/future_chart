"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, type ToggleGroupOption } from "@/components/ui/toggle-group";

export default function WriteEntryClient({
  dateISO,
  mode,
  futureTitle,
  coreValue,
}: {
  dateISO: string;
  mode: "reflection" | "edit";
  futureTitle: string;
  coreValue: string | null;
}) {
  type DiaryMode = "禅" | "ライバル" | "秘書";
  const isDiaryMode = (value: string): value is DiaryMode =>
    value === "禅" || value === "ライバル" || value === "秘書";

  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const [content, setContent] = React.useState("");
  const [isSaving, setIsSaving] = React.useState(false);
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);
  const diaryModeOptions: ToggleGroupOption[] = [
    { value: "禅", label: "禅" },
    { value: "ライバル", label: "ライバル" },
    { value: "秘書", label: "秘書" },
  ];
  const [diaryMode, setDiaryMode] = React.useState<DiaryMode>("禅");

  const coreValueMeanings: Record<string, string> = {
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

  function enrichFourCharIdioms(text: string) {
    let out = text;
    for (const [idiom, meaning] of Object.entries(coreValueMeanings)) {
      const re = new RegExp(`${idiom}(?!（)`);
      out = out.replace(re, `${idiom}（${meaning}）`);
    }
    return out;
  }

  const coreValueEnriched = React.useMemo(() => {
    if (!coreValue) return "";
    return enrichFourCharIdioms(coreValue);
  }, [coreValue]);

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      // まずはローカル下書き（カレンダークリック時に設定）
      try {
        const raw = localStorage.getItem(`entry_draft_${dateISO}`);
        if (raw) {
          const parsed = JSON.parse(raw) as { content?: string; mode?: string };
          if (!cancelled && typeof parsed.content === "string") setContent(parsed.content);
          const draftMode = parsed.mode;
          if (!cancelled && draftMode && isDiaryMode(draftMode)) setDiaryMode(draftMode);
          return;
        }
      } catch {
        // ignore
      }

      // 見つからなければ、DB から既存日記を取得（編集中/単発遷移に対応）
      try {
        const { data: authData, error } = await supabase.auth.getUser();
        if (error || !authData.user) return;

        const { data: row } = await supabase
          .from("entries")
          .select("content, mode")
          .eq("user_id", authData.user.id)
          .eq("created_at", dateISO)
          .maybeSingle();

        if (!cancelled) {
          setContent(row?.content ?? "");
          const rowMode = row?.mode;
          if (rowMode && isDiaryMode(rowMode)) {
            setDiaryMode(rowMode);
          } else {
            setDiaryMode("禅");
          }
        }
      } catch {
        // ignore
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [dateISO, supabase]);

  function pageTitle() {
    if (mode === "reflection") return "過去の自分を振り返る";
    return "日記を編集";
  }

  async function handleSave() {
    const text = content.trim();
    if (!text) {
      alert("日記の内容を入力してください。");
      return;
    }

    setIsSaving(true);
    try {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error || !authData.user) {
        alert("ログイン情報の取得に失敗しました。");
        router.push("/login");
        return;
      }

      const { error: upsertError } = await supabase.from("entries").upsert(
        {
          user_id: authData.user.id,
          created_at: dateISO,
          content: text,
          mode: diaryMode,
          // ai_response は生成時に別導線で保存
        },
        { onConflict: "user_id,created_at" }
      );

      if (upsertError) {
        alert(`保存に失敗しました: ${upsertError.message}`);
        return;
      }

      router.push("/dashboard");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div>
          <h1 className="text-2xl font-semibold">{pageTitle()}</h1>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            対象日: {dateISO} / 未来の自分（{futureTitle}）へ繋ぐ
          </p>
          {coreValue ? (
            <p className="mt-3 text-base font-medium text-slate-700 dark:text-slate-200 md:text-lg">
              <span className="font-semibold text-slate-600 dark:text-slate-300">合言葉</span>
              <span className="mx-1.5 text-slate-400">·</span>
              <span>{coreValueEnriched}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          <div className="text-lg font-semibold text-slate-800 dark:text-slate-100 md:text-xl">
            モード（禅 / ライバル / 秘書）
          </div>
          <div className="mt-3">
            <ToggleGroup
              type="single"
              value={diaryMode}
              onValueChange={(value) => {
                if (isDiaryMode(value)) setDiaryMode(value);
              }}
              options={diaryModeOptions}
              size="xlarge"
              className="grid-cols-1 gap-4 sm:grid-cols-3"
            />
            <div className="mt-3 text-base font-medium text-sky-800/90 dark:text-sky-300/90 md:text-lg">
              現在のモード: <span className="font-bold">{diaryMode}</span>
            </div>
            <div className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300 md:text-lg">
              {diaryMode === "禅"
                ? "（静かに自分と向き合い、未来を俯瞰するスタイル）"
                : diaryMode === "ライバル"
                  ? "（切磋琢磨し、互いを高め合う熱いスタイル）"
                  : "（緻密な計画とサポートで、着実に未来を支えるスタイル）"}
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              mode === "reflection"
                ? "当時の自分は、何を感じ、何を選びましたか？ 今の自分はそれをどう解釈しますか？"
                : "ここに日記を書いてください。"
            }
            className="min-h-[220px] rounded-2xl border-amber-200/70 bg-[#FFFDF9] px-4 py-4 text-xl leading-[1.7] text-stone-800 shadow-inner placeholder:text-stone-400 placeholder:text-lg md:min-h-[240px] md:px-5 md:py-5 md:text-2xl md:leading-[1.72] md:placeholder:text-xl focus-visible:border-sky-300 focus-visible:ring-sky-200/60 dark:bg-slate-900/40"
          />
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3">
            <Button
              variant="ghost"
              size="lg"
              className="min-h-12 text-lg md:text-xl"
              onClick={() => router.push("/dashboard")}
              disabled={isSaving}
            >
              戻る
            </Button>
            <Button
              variant="secondary"
              type="button"
              size="lg"
              className="min-h-[4.25rem] px-6 text-xl font-semibold md:min-h-[4.5rem] md:px-8 md:text-2xl"
              disabled={isSaving}
              onClick={() => {
                try {
                  localStorage.setItem(
                    `entry_draft_${dateISO}`,
                    JSON.stringify({
                      content,
                      mode: diaryMode,
                      savedAt: new Date().toISOString(),
                    })
                  );
                  setInfoMsg("一時保存しました。");
                } catch {
                  alert("一時保存に失敗しました。");
                }
              }}
            >
              一時保存
            </Button>
            <Button
              size="lg"
              className="min-h-[4.25rem] px-6 text-xl font-semibold md:min-h-[4.5rem] md:px-8 md:text-2xl"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "保存中..." : "保存"}
            </Button>
          </div>
          {infoMsg ? (
            <div className="text-sm text-emerald-700 dark:text-emerald-400">{infoMsg}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

