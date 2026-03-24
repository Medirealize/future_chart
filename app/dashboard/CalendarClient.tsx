"use client";

import * as React from "react";
import { format, isBefore, addYears, startOfDay, parseISO } from "date-fns";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import {
  CORE_VALUE_STORAGE_KEY,
  CORE_VALUE_UPDATED_EVENT,
  clearCachedCoreValue,
  readCachedCoreValue,
  writeCachedCoreValue,
  type CoreValueUpdatedDetail,
} from "@/utils/core-value-sync";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup } from "@/components/ui/toggle-group";
import type { ToggleGroupOption } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Heart, Sparkles, Timer } from "lucide-react";
import {
  computeTimeLeftYearsMonthsDays,
  normalizeBirthDateString,
  parseDateOnlyLocal,
} from "@/lib/dashboard/countdown";
import { CORE_VALUE_MEANINGS, enrichFourCharIdioms } from "@/lib/dashboard/enrich-idioms";

type EntryRow = {
  created_at: string; // YYYY-MM-DD
  content: string | null;
  mode: string | null;
  ai_response: string | null;
};

export default function CalendarClient({
  userType,
  futureTitle,
  birthDate,
  targetAge,
  coreValue,
  entries,
}: {
  userType: string;
  futureTitle: string;
  /** YYYY-MM-DD */
  birthDate: string | null;
  /** 目標とする年齢（DBの target_years カラムと同じ値） */
  targetAge: number;
  coreValue: string | null;
  entries: EntryRow[];
}) {
  const router = useRouter();
  type DiaryMode = "禅" | "ライバル" | "秘書";
  const isDiaryMode = (value: string): value is DiaryMode =>
    value === "禅" || value === "ライバル" || value === "秘書";

  const supabase = React.useMemo(() => {
    try {
      return createSupabaseBrowserClient();
    } catch {
      return null;
    }
  }, []);

  /** DBに birth_date が無い・旧データ向け: 端末の onboarding_future を参照 */
  const [storedFuture, setStoredFuture] = React.useState<{
    birth: string | null;
    age: number | null;
  }>({ birth: null, age: null });

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("onboarding_future");
      if (!raw) return;
      const p = JSON.parse(raw) as { birthDate?: string; targetYears?: number };
      const b = normalizeBirthDateString(p?.birthDate);
      const a = Number(p?.targetYears);
      setStoredFuture({
        birth: b,
        age: Number.isFinite(a) && a >= 1 ? Math.trunc(a) : null,
      });
    } catch {
      setStoredFuture({ birth: null, age: null });
    }
  }, []);

  const effectiveBirthDate =
    normalizeBirthDateString(birthDate) ?? storedFuture.birth;

  const serverTargetAge = Math.trunc(Number(targetAge));
  const effectiveTargetAgeNum =
    Number.isFinite(serverTargetAge) && serverTargetAge >= 1
      ? serverTargetAge
      : storedFuture.age;

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
  /** 画面表示・カウントダウン用の「今日」（日付が変わると更新） */
  const [calendarNow, setCalendarNow] = React.useState<Date | null>(null);
  React.useEffect(() => {
    const sync = () => {
      const n = startOfDay(new Date());
      setCalendarNow((prev) => {
        if (!prev) return n;
        return prev.getTime() === n.getTime() ? prev : n;
      });
    };
    sync();
    setIsMounted(true);
    const id = window.setInterval(sync, 60_000);
    const onFocus = () => sync();
    const onVis = () => {
      if (document.visibilityState === "visible") sync();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const diaryModeOptions: ToggleGroupOption[] = [
    { value: "禅", label: "禅" },
    { value: "ライバル", label: "ライバル" },
    { value: "秘書", label: "秘書" },
  ];

  const [selectedDateISO, setSelectedDateISO] = React.useState<string>("");
  React.useEffect(() => {
    if (!calendarNow) return;
    setSelectedDateISO((prev) => (prev ? prev : format(calendarNow, "yyyy-MM-dd")));
  }, [calendarNow]);

  const selectedEntry = entriesByDate.get(selectedDateISO) ?? null;
  const selectedDate = React.useMemo(() => {
    if (!selectedDateISO) return null;
    return startOfDay(parseISO(selectedDateISO));
  }, [selectedDateISO]);
  const selectedDateLabel = React.useMemo(() => {
    if (!selectedDate) return "";
    return format(selectedDate, "yyyy年M月d日");
  }, [selectedDate]);
  /**
   * 「○歳の自分」の誕生日（生年月日 + 目標年齢）。カレンダー選択とは無関係に固定。
   */
  const milestoneBirthday = React.useMemo(() => {
    try {
      if (!effectiveBirthDate || effectiveTargetAgeNum == null || effectiveTargetAgeNum < 1) {
        return null;
      }
      const b = parseDateOnlyLocal(effectiveBirthDate);
      return startOfDay(addYears(b, effectiveTargetAgeNum));
    } catch {
      return null;
    }
  }, [effectiveBirthDate, effectiveTargetAgeNum]);

  /** 今日（カレンダー日）から、目標の誕生日までの残り年・月・日 */
  const timeLeft = React.useMemo(() => {
    if (!milestoneBirthday || !calendarNow) return null;
    return computeTimeLeftYearsMonthsDays(calendarNow, milestoneBirthday);
  }, [milestoneBirthday, calendarNow]);

  const countdownLabel = React.useMemo(() => {
    if (!calendarNow) return "読み込み中…";
    if (!milestoneBirthday || effectiveTargetAgeNum == null || effectiveTargetAgeNum < 1) {
      return "未来設定で生年月日と目標年齢を確認してください";
    }
    if (isBefore(milestoneBirthday, calendarNow)) {
      return "その日はすでに到来しています";
    }
    if (!timeLeft) return "計算できません";
    return `${timeLeft.years}年${timeLeft.months}ヶ月${timeLeft.days}日`;
  }, [calendarNow, milestoneBirthday, effectiveTargetAgeNum, timeLeft]);
  const needsFutureSetup =
    milestoneBirthday == null || effectiveTargetAgeNum == null || effectiveTargetAgeNum < 1;

  const selectedIsPast = React.useMemo(() => {
    if (!calendarNow || !selectedDateISO) return false;
    const d = startOfDay(parseISO(selectedDateISO));
    return isBefore(d, calendarNow);
  }, [selectedDateISO, calendarNow]);
  const selectedIsFuture = React.useMemo(() => {
    if (!calendarNow || !selectedDateISO) return false;
    const d = startOfDay(parseISO(selectedDateISO));
    return isBefore(calendarNow, d);
  }, [selectedDateISO, calendarNow]);

  const isReflectionContext = React.useMemo(() => {
    return selectedIsPast && !selectedEntry?.content;
  }, [selectedIsPast, selectedEntry?.content]);

  const [diaryMode, setDiaryMode] = React.useState<DiaryMode>("禅");
  const [content, setContent] = React.useState<string>("");
  const [currentCoreValue, setCurrentCoreValue] = React.useState<string | null>(coreValue);
  const skipNextCoreValuePropSyncRef = React.useRef(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [infoMsg, setInfoMsg] = React.useState<string | null>(null);

  React.useLayoutEffect(() => {
    const cached = readCachedCoreValue();
    if (cached) {
      setCurrentCoreValue(cached);
      skipNextCoreValuePropSyncRef.current = true;
    }
  }, []);

  React.useEffect(() => {
    if (skipNextCoreValuePropSyncRef.current) {
      skipNextCoreValuePropSyncRef.current = false;
      return;
    }
    setCurrentCoreValue(coreValue);
  }, [coreValue]);

  React.useEffect(() => {
    const client = supabase;
    if (!client) return;
    let cancelled = false;

    async function refreshCoreValue() {
      const c = client;
      if (!c) return;
      try {
        const { data: authData, error: authError } = await c.auth.getUser();
        if (authError || !authData.user || cancelled) return;
        const { data: profile } = await c
          .from("profiles")
          .select("core_value")
          .eq("id", authData.user.id)
          .maybeSingle();
        if (!cancelled) {
          const next = profile?.core_value ?? null;
          setCurrentCoreValue(next);
          if (next) writeCachedCoreValue(next);
        }
      } catch {
        // ignore
      }
    }

    void refreshCoreValue();
    const onFocus = () => {
      void refreshCoreValue();
    };
    const onVisible = () => {
      if (document.visibilityState === "visible") void refreshCoreValue();
    };
    const onCoreValueUpdated = (e: Event) => {
      const detail = (e as CustomEvent<CoreValueUpdatedDetail>).detail;
      if (detail?.coreValue) setCurrentCoreValue(detail.coreValue);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== CORE_VALUE_STORAGE_KEY) return;
      if (e.newValue) setCurrentCoreValue(e.newValue);
      else void refreshCoreValue();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener(CORE_VALUE_UPDATED_EVENT, onCoreValueUpdated);
    window.addEventListener("storage", onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener(CORE_VALUE_UPDATED_EVENT, onCoreValueUpdated);
      window.removeEventListener("storage", onStorage);
    };
  }, [supabase]);

  const selectedCoreValue = React.useMemo(() => {
    if (!selectedEntry?.content?.trim()) return currentCoreValue ?? null;
    const sourceText = `${selectedEntry.content ?? ""}\n${selectedEntry.ai_response ?? ""}`;
    for (const idiom of Object.keys(CORE_VALUE_MEANINGS)) {
      if (sourceText.includes(idiom)) return idiom;
    }
    return currentCoreValue ?? null;
  }, [selectedEntry, currentCoreValue]);
  const selectedCoreValueEnriched = React.useMemo(() => {
    if (!selectedCoreValue) return "";
    return enrichFourCharIdioms(selectedCoreValue);
  }, [selectedCoreValue]);

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
        if (supabase) {
          try {
            const { data: authData, error: authError } = await supabase.auth.getUser();
            if (!authError && authData.user) {
              const { data: row } = await supabase
                .from("entries")
                .select("created_at, content, mode, ai_response")
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

  React.useEffect(() => {
    if (!selectedDateISO) return;
    const timer = window.setTimeout(() => {
      try {
        localStorage.setItem(
          `entry_draft_${selectedDateISO}`,
          JSON.stringify({
            content,
            mode: diaryMode,
            savedAt: new Date().toISOString(),
          })
        );
      } catch {
        // ignore
      }
    }, 450);
    return () => window.clearTimeout(timer);
  }, [content, diaryMode, selectedDateISO]);

  if (!isMounted || !calendarNow || !selectedDateISO) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] via-[#FAF6EF] to-[#F3EBE2] px-5 py-10 md:px-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-amber-200/50 bg-[#FFFCF8] p-8 shadow-[0_8px_40px_-12px_rgba(160,110,70,0.12)]">
            <p className="text-sm font-medium text-stone-500">準備中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] via-[#FAF6EF] to-[#F3EBE2] px-5 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-amber-200/50 bg-[#FFFCF8] p-8 shadow-[0_8px_40px_-12px_rgba(160,110,70,0.12)] md:p-10">
        <div className="mt-2 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100/90 text-sky-600 shadow-sm ring-1 ring-sky-200/40">
                <CalendarDays className="h-6 w-6" strokeWidth={1.75} aria-hidden />
              </span>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-stone-800 md:text-4xl">カレンダー</h1>
              </div>
            </div>
            <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-base leading-relaxed text-stone-600 md:text-lg">
              <Timer className="h-5 w-5 shrink-0 text-sky-500" aria-hidden />
              <span className="font-semibold text-sky-700">{futureTitle}</span>
              <span className="text-stone-600">としての、</span>
              <span className="font-semibold text-stone-800">
                {effectiveTargetAgeNum != null && effectiveTargetAgeNum >= 1
                  ? `${effectiveTargetAgeNum}歳`
                  : "—"}
              </span>
              <span className="text-stone-600">の誕生日まで、あと</span>
              <span className="font-semibold tabular-nums text-stone-800">{countdownLabel}</span>
            </p>
            {needsFutureSetup ? (
              <div className="mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="min-h-12 rounded-xl border-amber-300 bg-amber-50/70 px-5 text-base font-semibold text-amber-900 hover:bg-amber-100 md:text-lg"
                  onClick={() => router.push("/onboarding/future?edit=1")}
                >
                  未来設定ページに戻る
                </Button>
              </div>
            ) : null}
            {selectedCoreValue ? (
              <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-amber-200/60 bg-amber-50/40 px-5 py-4 shadow-sm">
                <Heart className="h-5 w-5 shrink-0 fill-rose-200 text-rose-400 sm:h-6 sm:w-6" aria-hidden />
                <p className="text-base leading-snug text-stone-600 md:text-lg">
                  <span className="font-semibold text-stone-600">合言葉</span>
                  <span className="mx-1.5 text-stone-400">·</span>
                  <span className="font-semibold text-stone-800">{selectedCoreValueEnriched}</span>
                </p>
                <Button
                  variant="ghost"
                  size="lg"
                  className="ml-auto min-h-[3.25rem] shrink-0 rounded-2xl px-6 text-lg font-semibold text-sky-700 hover:bg-sky-100/60 md:min-h-14 md:px-8 md:text-xl"
                  onClick={() => router.push("/onboarding/core?edit=1")}
                >
                  合言葉を変更
                </Button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-amber-100/90 bg-gradient-to-b from-white/90 to-[#FFF9F3]/90 p-4 shadow-[0_4px_24px_-8px_rgba(140,100,60,0.1)] ring-1 ring-amber-100/50 sm:p-6 md:p-8">
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
                const hasAiResponse = Boolean(entry?.ai_response);

                return (
                  <button {...buttonProps}>
                    <div className="relative flex h-full w-full items-center justify-center">
                      {children}
                      {hasEntry ? (
                        <span
                          className={
                            hasAiResponse
                              ? "absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-sky-500 shadow-[0_0_0_2px_rgba(255,251,247,0.9)]"
                              : "absolute -bottom-0.5 h-1.5 w-1.5 rounded-full bg-amber-300/90"
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

        <div className="mt-6 flex justify-center sm:justify-start">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="min-h-[4.75rem] w-full rounded-2xl border-violet-200/90 bg-violet-50/40 px-10 py-6 text-2xl font-bold text-violet-900 shadow-sm transition-all hover:border-violet-300 hover:bg-violet-100/50 sm:w-auto sm:min-w-[min(100%,22rem)] md:min-h-[5.25rem] md:text-3xl"
            onClick={() => router.push("/dashboard/timeline")}
          >
            年表（タイムライン）を見る
          </Button>
        </div>

        {/* 日記入力フォーム（要件: /dashboard に配置） */}
        <div className="mt-10 rounded-[2rem] border border-rose-100/80 bg-gradient-to-br from-white via-[#FFFBF8] to-sky-50/25 p-8 shadow-[0_6px_32px_-12px_rgba(150,100,90,0.14)] ring-1 ring-rose-100/30 md:p-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sky-500" aria-hidden />
                <h2 className="text-2xl font-bold tracking-tight text-stone-800 md:text-3xl">
                  {selectedDateLabel}の日記を{selectedEntry?.content ? "編集" : "記入"}
                </h2>
              </div>
              <p className="text-base leading-relaxed text-stone-600 md:text-lg">
                対象日:{" "}
                <span className="rounded-lg bg-white/80 px-2 py-0.5 text-lg font-semibold text-stone-800 shadow-sm ring-1 ring-amber-100/80 md:text-xl">
                  {selectedDateISO}
                </span>
                {" "}
                <span className="text-stone-500">
                  {selectedIsFuture
                    ? "（未来日は入力できません）"
                    : isReflectionContext
                      ? "（過去の自分を振り返る）"
                      : selectedEntry?.content
                        ? "（編集）"
                        : ""}
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-sky-100/90 bg-sky-50/50 px-4 py-3 text-right shadow-sm">
              <p className="text-sm font-medium text-stone-500">
                {selectedEntry?.ai_response ? "処方箋生成済み" : "未生成"}
              </p>
            </div>
          </div>

          <div className="mt-8">
            <div className="text-xl font-semibold text-stone-800 md:text-2xl">モード（禅 / ライバル / 秘書）</div>
            <p className="mt-2 text-lg text-stone-600 md:text-xl">
              今日の気分に合わせて、未来の自分との対話のトーンを選べます
            </p>
            <div className="mt-4">
              <ToggleGroup
                type="single"
                value={diaryMode}
                onValueChange={(v) => {
                  if (isDiaryMode(v)) setDiaryMode(v);
                }}
                options={diaryModeOptions}
                size="xlarge"
                className="grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4"
              />
              <div className="mt-4 text-lg font-semibold text-sky-800/90 md:text-xl">
                現在のモード: <span className="font-bold">{diaryMode}</span>
              </div>
              <div className="mt-2 text-lg leading-relaxed text-stone-600 md:text-xl">
                {diaryMode === "禅"
                  ? "静かに自分と向き合い、未来を俯瞰するスタイル"
                  : diaryMode === "ライバル"
                    ? "切磋琢磨し、互いを高め合う熱いスタイル"
                    : "緻密な計画とサポートで、着実に未来を支えるスタイル"}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                isReflectionContext
                  ? "当時の自分は、何を感じ、何を選びましたか？ 今の自分はそれをどう解釈しますか？"
                  : "ここに日記を書いてください。"
              }
              disabled={isGenerating || selectedIsFuture}
              className="min-h-[220px] rounded-2xl border-amber-200/70 bg-[#FFFDF9] px-4 py-4 text-xl leading-[1.7] text-stone-800 shadow-inner placeholder:text-stone-400 placeholder:text-lg md:min-h-[240px] md:px-5 md:py-5 md:text-2xl md:leading-[1.72] md:placeholder:text-xl focus-visible:border-sky-300 focus-visible:ring-sky-200/60"
            />
          </div>

          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <div className="flex flex-1 flex-wrap items-center gap-4 rounded-2xl border border-amber-200/50 bg-amber-50/30 px-5 py-5 text-lg text-stone-600 shadow-sm md:px-6 md:text-xl">
              <Heart className="h-5 w-5 shrink-0 text-rose-400 sm:h-6 sm:w-6" aria-hidden />
              <span className="min-w-0 flex-1 font-medium leading-snug">
                {selectedCoreValue
                  ? `合言葉: ${selectedCoreValueEnriched}`
                  : "合言葉: 未来の自分を待機中..."}
              </span>
              <Button
                variant="ghost"
                size="lg"
                className="ml-auto min-h-[3.25rem] shrink-0 rounded-2xl px-6 text-lg font-semibold text-sky-700 hover:bg-sky-100/70 md:min-h-14 md:px-8 md:text-xl"
                onClick={() => router.push("/onboarding/core?edit=1")}
              >
                合言葉を変更
              </Button>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end sm:gap-4">
              {selectedEntry?.ai_response ? (
                <Button
                  variant="secondary"
                  type="button"
                  size="lg"
                  disabled
                  className="hidden min-h-12 rounded-2xl border border-stone-200/80 bg-white/90 text-base sm:inline-flex"
                  title="AI回答は下に表示します"
                >
                  生成済み
                </Button>
              ) : null}
              <Button
                variant="secondary"
                type="button"
                size="lg"
                disabled={isGenerating || selectedIsFuture}
                className="min-h-[4.25rem] w-full rounded-2xl border border-amber-200/80 bg-white px-8 py-5 text-xl font-semibold text-stone-800 shadow-sm hover:bg-amber-50/80 sm:w-auto md:min-h-[4.5rem] md:text-2xl"
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
                size="lg"
                onClick={async () => handleGenerate()}
                disabled={isGenerating || !content.trim() || selectedIsFuture}
                className="h-auto min-h-[5.75rem] w-full whitespace-normal rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-6 py-6 text-center !text-2xl !leading-snug font-semibold text-white shadow-md transition-all hover:from-sky-600 hover:to-sky-700 hover:shadow-lg disabled:opacity-50 sm:w-auto sm:px-8 md:min-h-[6.75rem] md:py-7 md:!text-3xl"
              >
                {isGenerating ? "生成中..." : `${selectedDateLabel}を保存して処方箋を生成`}
              </Button>
            </div>
          </div>
          {selectedIsFuture ? (
            <div className="mt-4 rounded-2xl border border-amber-200/80 bg-amber-50/50 px-4 py-3 text-sm font-medium text-amber-900">
              今日以降の未来日には日記を保存できません。今日以前の日付を選択してください。
            </div>
          ) : null}

          {selectedEntry?.ai_response ? (
            <div className="mt-6 rounded-2xl border border-sky-100/90 bg-white/90 p-5 text-sm shadow-[0_4px_20px_-8px_rgba(60,120,160,0.12)] ring-1 ring-sky-50">
              <div className="flex items-center gap-2 text-sm font-bold text-sky-800">
                <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
                未来の君からの処方箋
              </div>
              <pre className="mt-3 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-stone-800">
                {selectedEntry.ai_response}
              </pre>
            </div>
          ) : null}

          {errorMsg ? (
            <div className="mt-4 rounded-2xl border border-red-200/80 bg-red-50/80 px-4 py-3 text-sm font-medium text-red-800">
              {errorMsg}
            </div>
          ) : null}
          {infoMsg ? (
            <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3 text-sm font-medium text-emerald-900">
              {infoMsg}
            </div>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );

  async function handleGenerate() {
    if (selectedIsFuture) {
      setErrorMsg("未来の日付には日記を保存できません。今日以前の日付を選択してください。");
      return;
    }
    if (!supabase) {
      setErrorMsg("接続設定を確認してください（Supabase）。");
      return;
    }
    if (effectiveTargetAgeNum == null || effectiveTargetAgeNum < 1) {
      setErrorMsg("目標年齢が取得できません。未来設定で目標年齢を登録してください。");
      return;
    }
    if (!currentCoreValue) {
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
          targetAge: effectiveTargetAgeNum,
          futureTitle,
          coreValue: currentCoreValue,
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
      const json: { ai_response: string } = await res.json();

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error("ログイン情報の取得に失敗しました。");

      const { error: upsertError } = await supabase.from("entries").upsert(
        {
          user_id: authData.user.id,
          created_at: selectedDateISO,
          content: diary,
          mode: diaryMode,
          ai_response: json.ai_response,
        },
        { onConflict: "user_id,created_at" }
      );
      if (upsertError) throw new Error(upsertError.message);

      try {
        localStorage.removeItem(`entry_draft_${selectedDateISO}`);
      } catch {
        // ignore
      }

      // UI更新（すでにentriesStateにある前提で上書き）
      setEntriesState((prev) => {
        const next = [...prev];
        const idx = next.findIndex((e) => e.created_at === selectedDateISO);
        const updated: EntryRow = {
          created_at: selectedDateISO,
          content: diary,
          mode: diaryMode,
          ai_response: json.ai_response,
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

