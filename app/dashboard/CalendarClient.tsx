"use client";

import * as React from "react";
import { format, isBefore, addYears, differenceInCalendarDays, startOfDay, parseISO } from "date-fns";
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
  const daysLeft = React.useMemo(() => {
    if (!futureDate || !today) return 0;
    const diff = differenceInCalendarDays(futureDate, today);
    return diff >= 0 ? diff : 0;
  }, [futureDate, today]);

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
  const selectedIsPast = React.useMemo(() => {
    if (!today || !selectedDateISO) return false;
    const d = startOfDay(parseISO(selectedDateISO));
    return isBefore(d, today);
  }, [selectedDateISO, today]);

  const isReflectionContext = React.useMemo(() => {
    return selectedIsPast && !selectedEntry?.content;
  }, [selectedIsPast, selectedEntry?.content]);

  const [diaryMode, setDiaryMode] = React.useState<DiaryMode>("禅");
  const [content, setContent] = React.useState<string>("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);

  const timelineEntries = React.useMemo(() => {
    const items = entriesState
      .filter((e) => typeof e.content === "string" && e.content.trim().length > 0)
      .slice()
      .sort((a, b) => a.created_at.localeCompare(b.created_at));

    // 直近のまとまりとして最大8件まで
    return items.slice(Math.max(0, items.length - 8));
  }, [entriesState]);

  React.useEffect(() => {
    if (!selectedDateISO) return;
    // 日付が切り替わったら、まず下書きを優先してロード
    let loadedFromDraft = false;
    try {
      const raw = localStorage.getItem(`entry_draft_${selectedDateISO}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { content?: string; mode?: string };
        setContent(typeof parsed.content === "string" ? parsed.content : "");
          const draftMode = parsed.mode;
          if (draftMode && isDiaryMode(draftMode)) setDiaryMode(draftMode);
          else setDiaryMode("禅");
        loadedFromDraft = true;
      }
    } catch {
      // ignore
    }

    // 下書きがなければ、既存日記をロード
    if (!loadedFromDraft) {
      if (selectedEntry?.content) setContent(selectedEntry.content);
      else setContent("");

      const existingMode = selectedEntry?.mode;
      if (existingMode && isDiaryMode(existingMode)) {
        setDiaryMode(existingMode);
      } else {
        setDiaryMode("禅");
      }
    }

    setErrorMsg(null);
    setInfoMsg(null);
  }, [selectedDateISO]); // selectedEntry は参照用のみ

  if (!isMounted || !today || !selectedDateISO) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <p className="text-sm text-slate-600 dark:text-slate-300">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-xl dark:border-slate-800 dark:bg-slate-950/70">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">カレンダー</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              未来の自分（{futureTitle}）まで、あと{daysLeft}日
            </p>
            {coreValue ? (
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                合言葉：{coreValue}
              </p>
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

        {/* 年表（タイムライン） */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950/40">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">タイムライン</h2>
            <span className="text-xs text-slate-500 dark:text-slate-400">最近の記録</span>
          </div>

          {timelineEntries.length === 0 ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              まだ記録がありません。日記を書いてみましょう。
            </p>
          ) : (
            <div className="mt-4 relative pl-6">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800" />

              {timelineEntries.map((e) => {
                const mode = e.mode ?? "禅";
                const isZen = mode === "禅";
                const dotClass = isZen ? "bg-[#3B82F6]" : "bg-[#F97316]";
                const pillClass = isZen
                  ? "bg-[#3B82F6]/10 text-[#1D4ED8]"
                  : "bg-[#F97316]/10 text-[#C2410C]";
                const content = (e.content ?? "").trim();
                const preview =
                  content.length > 90 ? `${content.slice(0, 90)}...` : content;

                return (
                  <div key={`${e.created_at}:${mode}`} className="relative mb-5 last:mb-0">
                    <div className={`absolute left-1.5 top-2 h-3 w-3 rounded-full ${dotClass}`} />
                    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {e.created_at}
                        </span>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${pillClass}`}>
                          {mode}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-slate-900 dark:text-slate-50">
                        {preview}
                      </div>
                      {e.sync_score != null ? (
                        <div className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                          シンクロ率: <span className="font-semibold text-slate-700 dark:text-slate-200">{e.sync_score}%</span>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 日記入力フォーム（要件: /dashboard に配置） */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">日記入力</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                対象日: <span className="font-medium text-slate-900 dark:text-slate-50">{selectedDateISO}</span>
                {" "}
                {isReflectionContext ? "（過去の自分を振り返る）" : selectedEntry?.content ? "（編集）" : ""}
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
              disabled={isGenerating}
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {coreValue ? `合言葉: ${coreValue}` : "合言葉が設定されていません"}
            </div>
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
                disabled={isGenerating}
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
              <Button onClick={async () => handleGenerate()} disabled={isGenerating || !content.trim()}>
                {isGenerating ? "生成中..." : "送信（Gemini）"}
              </Button>
            </div>
          </div>

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
}

