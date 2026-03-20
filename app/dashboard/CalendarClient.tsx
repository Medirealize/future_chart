"use client";

import * as React from "react";
import {
  format,
  isBefore,
  addYears,
  addMonths,
  differenceInCalendarDays,
  differenceInMonths,
  differenceInYears,
  startOfDay,
  parseISO,
} from "date-fns";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";
import type { ToggleGroupOption } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";

type EntryRow = {
  created_at: string; // YYYY-MM-DD
  content: string | null;
  mode: string | null;
  ai_response: string | null;
  sync_score: number | null;
};

export default function CalendarClient({
  userType,
  futureTitle,
  targetYears,
  coreValue,
  entries,
}: {
  userType: string;
  futureTitle: string;
  targetYears: number;
  coreValue: string | null;
  entries: EntryRow[];
}) {
  const router = useRouter();
  type DiaryMode = "禅" | "ライバル" | "秘書";
  const isDiaryMode = (value: string): value is DiaryMode =>
    value === "禅" || value === "ライバル" || value === "秘書";

  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const [entriesState, setEntriesState] = React.useState<EntryRow[]>(entries);
  React.useEffect(() => {
    setEntriesState(entries);
  }, [entries]);

  const entriesByDate = React.useMemo(() => {
    const m = new Map<string, EntryRow>();
    for (const e of entriesState) m.set(e.created_at, e);
    return m;
  }, [entriesState]);

  const [isMounted, setIsMounted] = React.useState(false);
  const [today, setToday] = React.useState<Date | null>(null);
  React.useEffect(() => {
    setToday(startOfDay(new Date()));
    setIsMounted(true);
  }, []);

  const futureDate = React.useMemo(
    () => (today ? addYears(today, targetYears) : null),
    [today, targetYears]
  );

  const diaryModeOptions: ToggleGroupOption[] = [
    { value: "禅", label: "禅" },
    { value: "ライバル", label: "ライバル" },
    { value: "秘書", label: "秘書" },
  ];

  const [selectedDateISO, setSelectedDateISO] = React.useState<string>("");
  React.useEffect(() => {
    if (!today) return;
    setSelectedDateISO((prev) => (prev ? prev : format(today, "yyyy-MM-dd")));
  }, [today]);

  const selectedEntry = entriesByDate.get(selectedDateISO) ?? null;
  const selectedDate = React.useMemo(() => {
    if (!selectedDateISO) return null;
    return startOfDay(parseISO(selectedDateISO));
  }, [selectedDateISO]);
  const selectedDateLabel = React.useMemo(() => {
    if (!selectedDate) return "";
    return format(selectedDate, "yyyy年M月d日");
  }, [selectedDate]);
  const timeLeft = React.useMemo(() => {
    if (!futureDate || !selectedDate) return null;
    if (isBefore(futureDate, selectedDate)) return { years: 0, months: 0, days: 0 };
    // 月単位・日単位がズレないよう、段階的に差分を積み上げて計算する
    const years = Math.max(0, differenceInYears(futureDate, selectedDate));
    const afterYears = addYears(selectedDate, years);
    const months = Math.max(0, differenceInMonths(futureDate, afterYears));
    const afterMonths = addMonths(afterYears, months);
    const days = Math.max(0, differenceInCalendarDays(futureDate, afterMonths));
    return { years, months, days };
  }, [futureDate, selectedDate]);
  const selectedIsPast = React.useMemo(() => {
    if (!today || !selectedDateISO) return false;
    const d = startOfDay(parseISO(selectedDateISO));
    return isBefore(d, today);
  }, [selectedDateISO, today]);
  const selectedIsFuture = React.useMemo(() => {
    if (!today || !selectedDateISO) return false;
    const d = startOfDay(parseISO(selectedDateISO));
    return isBefore(today, d);
  }, [selectedDateISO, today]);

  const isReflectionContext = React.useMemo(() => {
    return selectedIsPast && !selectedEntry?.content;
  }, [selectedIsPast, selectedEntry?.content]);

  const [diaryMode, setDiaryMode] = React.useState<DiaryMode>("禅");
  const [content, setContent] = React.useState<string>("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);

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
      // すでに「（意味）」が付いている場合は二重付与しない
      const re = new RegExp(`${idiom}(?!（)`);
      out = out.replace(re, `${idiom}（${meaning}）`);
    }
    return out;
  }

  const selectedCoreValue = React.useMemo(() => {
    if (!selectedEntry?.content?.trim()) return null;
    const sourceText = `${selectedEntry.content ?? ""}\n${selectedEntry.ai_response ?? ""}`;
    for (const idiom of Object.keys(coreValueMeanings)) {
      if (sourceText.includes(idiom)) return idiom;
    }
    return coreValue ?? null;
  }, [selectedEntry, coreValue]);
  const selectedCoreValueEnriched = React.useMemo(() => {
    if (!selectedCoreValue) return "";
    return enrichFourCharIdioms(selectedCoreValue);
  }, [selectedCoreValue]);

  const timelineYearBlocks = React.useMemo(() => {
    const START_YEAR = 2026;

    const items = entriesState
      .filter((e) => typeof e.content === "string" && e.content.trim().length > 0)
      .slice()
      .filter((e) => typeof e.created_at === "string" && e.created_at.length >= 4)
      .map((e) => ({
        ...e,
        year: Number(e.created_at.slice(0, 4)),
      }))
      .filter((e) => Number.isFinite(e.year) && e.year >= START_YEAR)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

    const byYear = new Map<number, typeof items>();
    for (const item of items) {
      const list = byYear.get(item.year) ?? [];
      list.push(item);
      byYear.set(item.year, list);
    }

    const years = Array.from(byYear.keys()).sort((a, b) => a - b);
    return years.map((year) => ({ year, events: byYear.get(year) ?? [] }));
  }, [entriesState]);

  React.useEffect(() => {
    if (!selectedDateISO) return;
    let cancelled = false;
    const targetDateISO = selectedDateISO;

    async function loadEntryForSelectedDate() {
    // 日付が切り替わったら、まず下書きを優先してロード
    let loadedFromDraft = false;
    try {
        const raw = localStorage.getItem(`entry_draft_${targetDateISO}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { content?: string; mode?: string };
          if (cancelled) return;
          setContent(typeof parsed.content === "string" ? parsed.content : "");
          const draftMode = parsed.mode;
          if (draftMode && isDiaryMode(draftMode)) setDiaryMode(draftMode);
          else setDiaryMode("禅");
        loadedFromDraft = true;
      }
    } catch {
      // ignore
    }

      // 下書きがなければ、DBの既存日記をロード
    if (!loadedFromDraft) {
        try {
          const { data: authData, error: authError } = await supabase.auth.getUser();
          if (!authError && authData.user) {
            const { data: row } = await supabase
              .from("entries")
              .select("created_at, content, mode, ai_response, sync_score")
              .eq("user_id", authData.user.id)
              .eq("created_at", targetDateISO)
              .maybeSingle();

            if (cancelled) return;
            if (row) {
              const dbEntry: EntryRow = {
                created_at: row.created_at,
                content: row.content,
                mode: row.mode,
                ai_response: row.ai_response,
                sync_score: row.sync_score,
              };
              setEntriesState((prev) => {
                const next = [...prev];
                const idx = next.findIndex((e) => e.created_at === targetDateISO);
                if (idx >= 0) next[idx] = { ...next[idx], ...dbEntry };
                else next.push(dbEntry);
                return next;
              });
              setContent(row.content ?? "");
              if (row.mode && isDiaryMode(row.mode)) setDiaryMode(row.mode);
              else setDiaryMode("禅");
            } else {
              setContent("");
              setDiaryMode("禅");
            }
            setErrorMsg(null);
            setInfoMsg(null);
            return;
          }
        } catch {
          // fallback to local state
        }

        if (cancelled) return;
        if (selectedEntry?.content) setContent(selectedEntry.content);
        else setContent("");

        const existingMode = selectedEntry?.mode;
        if (existingMode && isDiaryMode(existingMode)) {
          setDiaryMode(existingMode);
        } else {
          setDiaryMode("禅");
        }
      }

      if (!cancelled) {
        setErrorMsg(null);
        setInfoMsg(null);
      }
    }

    void loadEntryForSelectedDate();
    return () => {
      cancelled = true;
    };
  }, [selectedDateISO, supabase]); // selectedDate 変更時に再読込

  if (!isMounted || !today || !selectedDateISO) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-600 dark:text-slate-300">準備中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex items-start justify-end">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-[#F97316]/40 text-[#C2410C] hover:bg-[#F97316]/10 dark:text-[#FDBA74]"
            disabled={isSigningOut}
            onClick={() => handleSignOut()}
          >
            {isSigningOut ? "ログアウト中..." : "🚪 ログアウト"}
          </Button>
        </div>

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">カレンダー</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              未来の自分（{futureTitle}）まで、
              あと
              {timeLeft ? `${timeLeft.years}年${timeLeft.months}ヶ月${timeLeft.days}日` : "準備中..."}
            </p>
            {selectedCoreValue ? (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  合言葉：{selectedCoreValueEnriched}
                </p>
                <Button
                  variant="ghost"
                  className="rounded-full px-4 py-1.5"
                  onClick={() => router.push("/onboarding/core?edit=1")}
                >
                  合言葉を変更
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-6">
          <Calendar
            mode="single"
            onDayClick={(day) => {
              if (!day) return;
              const dateISO = format(day, "yyyy-MM-dd");
              setSelectedDateISO(dateISO);
            }}
            components={{
              DayButton: ({ day, children, ...buttonProps }: any) => {
                const dateISO: string = day.isoDate;
                const entry = entriesByDate.get(dateISO);
                const hasEntry = Boolean(entry?.content);
                const synced = entry?.sync_score != null && entry.sync_score >= 80;

                return (
                  <button {...buttonProps}>
                    <div className="relative flex h-full w-full items-center justify-center">
                      {children}
                      {hasEntry ? (
                        <span
                          className={
                            synced
                              ? "absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-indigo-600"
                              : "absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-slate-400"
                          }
                        />
                      ) : null}
                    </div>
                  </button>
                );
              },
            }}
          />
        </div>

        {/* 年表（バーティカル・タイムライン） */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">年表（タイムライン）</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">2026年〜の記録</span>
          </div>

          {timelineYearBlocks.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              まだ年表がありません。日々の気持ちを、そっと書き留めていきましょう。
            </p>
          ) : (
            <div className="relative mt-5">
              {/* 左側のタイムラインライン */}
              <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

              <div className="space-y-8">
                {timelineYearBlocks.map((block, idx) => (
                  <div key={block.year} className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
                    {/* 年のドット + 年ラベル */}
                    <div className="relative pl-7 sm:pl-0 sm:w-28">
                      <div className="absolute left-0 top-2 h-3 w-3 rounded-full bg-[#3B82F6]" />
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-50">
                        {block.year}年
                      </div>
                      <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        {idx === 0 ? "はじまり" : "つづき"}
                      </div>
                    </div>

                    {/* イベント（カード） */}
                    <div className="flex-1 space-y-3">
                      {block.events.map((e) => {
                        const mode = e.mode ?? "禅";
                        const isZen = mode === "禅";
                        const pillClass = isZen
                          ? "bg-[#3B82F6]/10 text-[#1D4ED8]"
                          : "bg-[#F97316]/10 text-[#C2410C]";
                        const content = (e.content ?? "").trim();
                        const preview =
                          content.length > 160 ? `${content.slice(0, 160)}...` : content;

                        return (
                          <div
                            key={`${e.created_at}:${mode}`}
                            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950"
                          >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {e.created_at}
                              </span>
                              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pillClass}`}>
                                {mode}
                              </span>
                            </div>

                            <div className="mt-2 text-sm leading-relaxed text-slate-900 dark:text-slate-50">
                              {enrichFourCharIdioms(preview)}
                            </div>

                            {e.sync_score != null ? (
                              <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                シンクロ率:{" "}
                                <span className="font-semibold text-slate-700 dark:text-slate-200">
                                  {e.sync_score}%
                                </span>
                              </div>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 日記入力フォーム（要件: /dashboard に配置） */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                {selectedDateLabel}の日記を{selectedEntry?.content ? "編集" : "記入"}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                対象日: <span className="font-medium text-slate-900 dark:text-slate-50">{selectedDateISO}</span>
                {" "}
                {selectedIsFuture
                  ? "（未来日は入力できません）"
                  : isReflectionContext
                    ? "（過去の自分を振り返る）"
                    : selectedEntry?.content
                      ? "（編集）"
                      : ""}
              </p>
            </div>
            <div className="text-right">
              {selectedEntry?.sync_score != null ? (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  シンクロ率:{" "}
                  <span className="font-medium text-slate-900 dark:text-slate-50">
                    {selectedEntry.sync_score}%
                  </span>
                </p>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">未生成</p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium text-slate-700 dark:text-slate-200">モード（禅/ライバル/秘書）</div>
            <div className="mt-2">
              <ToggleGroup
                type="single"
                value={diaryMode}
                onValueChange={(v) => {
                  if (isDiaryMode(v)) setDiaryMode(v);
                }}
                options={diaryModeOptions}
              />
              <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                現在のモード: {diaryMode}
              </div>
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                {diaryMode === "禅"
                  ? "（静かに自分と向き合い、未来を俯瞰するスタイル）"
                  : diaryMode === "ライバル"
                    ? "（切磋琢磨し、互いを高め合う熱いスタイル）"
                    : "（緻密な計画とサポートで、着実に未来を支えるスタイル）"}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isReflectionContext
                  ? "当時の自分は、何を感じ、何を選びましたか？ 今の自分はそれをどう解釈しますか？"
                  : "ここに日記を書いてください。"
              }
              disabled={isGenerating || selectedIsFuture}
            />
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {selectedCoreValue
                ? `合言葉: ${selectedCoreValueEnriched}`
                : "合言葉: 未来の自分を待機中..."}
            </div>
            <Button
              variant="ghost"
              className="rounded-full px-4 py-1.5 sm:self-center"
              onClick={() => router.push("/onboarding/core?edit=1")}
            >
              合言葉を変更
            </Button>
            <div className="flex items-center gap-2">
              {selectedEntry?.ai_response ? (
                <Button
                  variant="secondary"
                  type="button"
                  disabled
                  className="hidden sm:inline-flex"
                  title="AI回答は下に表示します"
                >
                  生成済み
                </Button>
              ) : null}
              <Button
                variant="secondary"
                type="button"
                disabled={isGenerating || selectedIsFuture}
                onClick={() => {
                  try {
                    localStorage.setItem(
                      `entry_draft_${selectedDateISO}`,
                      JSON.stringify({
                        content,
                        mode: diaryMode,
                        savedAt: new Date().toISOString(),
                      })
                    );
                    setInfoMsg("一時保存しました。");
                    setErrorMsg(null);
                  } catch {
                    setErrorMsg("一時保存に失敗しました。");
                    setInfoMsg(null);
                  }
                }}
              >
                一時保存
              </Button>
              <Button
                onClick={async () => handleGenerate()}
                disabled={isGenerating || !content.trim() || selectedIsFuture}
              >
                {isGenerating ? "生成中..." : `${selectedDateLabel}を保存してフィードバック生成`}
              </Button>
            </div>
          </div>
          {selectedIsFuture ? (
            <div className="mt-3 text-sm text-amber-700 dark:text-amber-400">
              今日以降の未来日には日記を保存できません。今日以前の日付を選択してください。
            </div>
          ) : null}

          {selectedEntry?.ai_response ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-white p-3 text-sm dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs font-medium text-slate-600 dark:text-slate-300">AIフィードバック</div>
              <pre className="mt-2 whitespace-pre-wrap text-slate-900 dark:text-slate-50">
                {selectedEntry.ai_response}
              </pre>
            </div>
          ) : null}

          {errorMsg ? (
            <div className="mt-3 text-sm text-red-600 dark:text-red-400">{errorMsg}</div>
          ) : null}
          {infoMsg ? (
            <div className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">{infoMsg}</div>
          ) : null}
        </div>
      </div>
    </div>
  );

  async function handleGenerate() {
    if (selectedIsFuture) {
      setErrorMsg("未来の日付には日記を保存できません。今日以前の日付を選択してください。");
      return;
    }
    if (!coreValue) {
      setErrorMsg("合言葉（core_value）が未設定です。オンボーディングを完了してください。");
      return;
    }
    const diary = content.trim();
    if (!diary) return;

    setIsGenerating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/gemini/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diaryContent: diary,
          userType,
          selectedMode: diaryMode,
          targetYears,
          futureTitle,
          coreValue,
          context: isReflectionContext ? "reflection" : "edit",
        }),
      });
      if (!res.ok) {
        let message = "Gemini API 呼び出しに失敗しました。";
        try {
          const errJson = (await res.json()) as { error?: string };
          if (errJson?.error) message = errJson.error;
        } catch {
          const text = await res.text();
          if (text) message = text;
        }
        throw new Error(message);
      }
      const json: { ai_response: string; sync_score: number | null } = await res.json();

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("ログイン情報の取得に失敗しました。");

      const { error: upsertError } = await supabase.from("entries").upsert(
        {
          user_id: authData.user.id,
          created_at: selectedDateISO,
          content: diary,
          mode: diaryMode,
          ai_response: json.ai_response,
          sync_score: json.sync_score,
        },
        { onConflict: "user_id,created_at" }
      );
      if (upsertError) throw new Error(upsertError.message);

      // UI更新（すでにentriesStateにある前提で上書き）
      setEntriesState((prev) => {
        const next = [...prev];
        const idx = next.findIndex((e) => e.created_at === selectedDateISO);
        const updated: EntryRow = {
          created_at: selectedDateISO,
          content: diary,
          mode: diaryMode,
          ai_response: json.ai_response,
          sync_score: json.sync_score,
        };
        if (idx >= 0) next[idx] = { ...next[idx], ...updated };
        else next.push(updated);
        return next;
      });
    } catch (e: any) {
      setErrorMsg(e?.message ?? "不明なエラーが発生しました。");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    setErrorMsg(null);
    setInfoMsg(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      try {
        const draftKeys = Object.keys(localStorage).filter((k) => k.startsWith("entry_draft_"));
        for (const key of draftKeys) localStorage.removeItem(key);
        localStorage.removeItem("onboarding_diagnosis");
        localStorage.removeItem("onboarding_future");
      } catch {
        // ignore
      }
      try {
        sessionStorage.clear();
      } catch {
        // ignore
      }

      router.replace("/login");
      router.refresh();
    } catch (e: any) {
      setErrorMsg(e?.message ?? "ログアウトに失敗しました。");
    } finally {
      setIsSigningOut(false);
    }
  }
}

