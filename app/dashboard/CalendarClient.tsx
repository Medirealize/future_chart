"use client";

import * as React from "react";
import {
  format,
  isBefore,
  addYears,
  startOfDay,
  parseISO,
  isSameDay,
  isToday,
} from "date-fns";
import { ja } from "date-fns/locale";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import {
  CORE_VALUE_STORAGE_KEY,
  CORE_VALUE_UPDATED_EVENT,
  readCachedCoreValue,
  writeCachedCoreValue,
  type CoreValueUpdatedDetail,
} from "@/utils/core-value-sync";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CalendarDays, ChevronLeft, ChevronRight, Heart, Sparkles, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
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

type DiaryMode = "禅" | "ライバル" | "秘書";

const MODE_OPTIONS: { value: DiaryMode; label: string; description: string }[] = [
  { value: "禅", label: "禅", description: "静かに自分と向き合い、未来を俯瞰するスタイル" },
  { value: "ライバル", label: "ライバル", description: "切磋琢磨し、互いを高め合う熱いスタイル" },
  { value: "秘書", label: "秘書", description: "緻密な計画とサポートで、着実に未来を支えるスタイル" },
];

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
    return format(selectedDate, "yyyy年M月d日", { locale: ja });
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

  const entriesUiMap = React.useMemo(() => {
    const m = new Map<string, { content: string; aiResponse?: string }>();
    for (const e of entriesState) {
      m.set(e.created_at, {
        content: (e.content ?? "").trim(),
        aiResponse: e.ai_response ?? undefined,
      });
    }
    return m;
  }, [entriesState]);

  const hasAiResponse = Boolean(selectedEntry?.ai_response);

  if (!isMounted || !calendarNow || !selectedDateISO || !selectedDate) {
    return (
      <div className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-sky-500" />
            <p className="text-sm font-medium text-slate-500">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 md:py-8">
      <header className="mb-6 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 shadow-sm ring-1 ring-sky-100">
          <CalendarDays className="h-5 w-5" strokeWidth={2} aria-hidden />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 md:text-3xl">カレンダー</h1>
      </header>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
        <p className="flex flex-wrap items-center gap-x-1 gap-y-1 text-sm leading-relaxed text-slate-600 md:text-base">
          <Timer className="h-4 w-4 shrink-0 text-sky-500" aria-hidden />
          <span className="font-semibold text-sky-600">{futureTitle}</span>
          <span>としての、</span>
          <span className="font-semibold text-slate-900">
            {effectiveTargetAgeNum != null && effectiveTargetAgeNum >= 1 ? `${effectiveTargetAgeNum}歳` : "—"}
          </span>
          <span>の誕生日まで、あと</span>
          <span className="font-semibold tabular-nums text-slate-900">{countdownLabel}</span>
        </p>
        {needsFutureSetup ? (
          <div className="mt-4">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={() => router.push("/onboarding/future/edit")}
            >
              未来設定ページに戻る
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        <section className="w-full shrink-0 lg:w-[380px]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:p-5">
            <DayPicker
              mode="single"
              selected={selectedDate}
              onSelect={(d) => {
                if (!d) return;
                setSelectedDateISO(format(startOfDay(d), "yyyy-MM-dd"));
              }}
              locale={ja}
              showOutsideDays
              className="mx-auto w-full"
              classNames={{
                root: "w-full",
                months: "flex w-full flex-col",
                month: "w-full",
                month_caption: "relative mb-2 flex h-10 items-center justify-center",
                caption_label: "text-base font-semibold text-slate-900",
                nav: "absolute inset-x-0 flex items-center justify-between",
                button_previous: cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                  "text-slate-500 transition-colors",
                  "hover:bg-slate-100 hover:text-sky-600",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                ),
                button_next: cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg",
                  "text-slate-500 transition-colors",
                  "hover:bg-slate-100 hover:text-sky-600",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40"
                ),
                month_grid: "w-full border-collapse",
                weekdays: "mb-1 grid grid-cols-7",
                weekday: "py-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500",
                weeks: "space-y-1",
                week: "grid grid-cols-7",
                day: "relative p-0.5 text-center",
                day_button: cn(
                  "mx-auto flex h-10 w-10 items-center justify-center rounded-full",
                  "text-sm font-medium text-slate-900 transition-all",
                  "hover:bg-sky-50 hover:text-sky-600",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-1"
                ),
                outside: "text-slate-300 hover:bg-transparent hover:text-slate-300",
                disabled: "text-slate-300 opacity-50",
                hidden: "invisible",
                today: "",
                selected: "",
              }}
              modifiers={{
                hasEntry: (date) => {
                  const iso = format(date, "yyyy-MM-dd");
                  const e = entriesUiMap.get(iso);
                  return Boolean(e?.content);
                },
                hasPrescription: (date) => {
                  const iso = format(date, "yyyy-MM-dd");
                  const e = entriesUiMap.get(iso);
                  return Boolean(e?.aiResponse);
                },
              }}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === "left" ? (
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  ) : (
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  ),
                DayButton: ({ day, modifiers, className, children, ...props }) => {
                  const dateISO = day.isoDate;
                  const entry = entriesUiMap.get(dateISO);
                  const hasEntry = Boolean(entry?.content);
                  const hasPrescription = Boolean(entry?.aiResponse);
                  const isTodayDate = calendarNow ? isSameDay(day.date, calendarNow) : isToday(day.date);
                  const isSelected = isSameDay(day.date, selectedDate);

                  return (
                    <button
                      type="button"
                      {...props}
                      className={cn(
                        "mx-auto flex h-10 w-10 items-center justify-center rounded-full",
                        "text-sm font-medium transition-all",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40 focus-visible:ring-offset-1",
                        !isTodayDate && !isSelected && "text-slate-900 hover:bg-sky-50 hover:text-sky-600",
                        isTodayDate &&
                          !isSelected && [
                            "font-semibold text-sky-600 ring-2 ring-sky-500 ring-offset-2",
                            "hover:bg-sky-50",
                          ],
                        isSelected && [
                          "bg-sky-500 font-semibold text-white shadow-md shadow-sky-500/25",
                          "hover:bg-sky-600",
                        ],
                        modifiers.outside && "text-slate-300 hover:bg-transparent hover:text-slate-300",
                        className
                      )}
                    >
                      <span className="relative flex h-full w-full items-center justify-center">
                        {children}
                        {hasEntry ? (
                          <span
                            className={cn(
                              "absolute -bottom-0.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                              hasPrescription ? "bg-sky-500" : "bg-amber-400",
                              isSelected && "bg-white"
                            )}
                          />
                        ) : null}
                      </span>
                    </button>
                  );
                },
              }}
            />

            <div className="mt-4 flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full ring-2 ring-sky-500 ring-offset-1" />
                <span>今日</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-sky-500 shadow-sm" />
                <span>選択中</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                <span>日記あり</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sky-500" />
                <span>処方箋済</span>
              </div>
            </div>
          </div>
        </section>

        <section className="flex-1">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-sky-500" aria-hidden />
                  <h2 className="text-lg font-bold text-slate-900 md:text-xl">{selectedDateLabel}の日記</h2>
                </div>
                <p className="text-sm text-slate-500">
                  {selectedIsFuture
                    ? "未来日は入力できません"
                    : isReflectionContext
                      ? "過去の自分を振り返る"
                      : selectedEntry?.content
                        ? "編集モード"
                        : "新規作成"}
                </p>
              </div>
              <div
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium",
                  hasAiResponse
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                    : "bg-slate-100 text-slate-500"
                )}
              >
                {hasAiResponse ? "処方箋生成済み" : "未生成"}
              </div>
            </div>

            <div className="mt-6">
              <label className="text-sm font-semibold text-slate-700">モード選択</label>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setDiaryMode(opt.value)}
                    disabled={selectedIsFuture}
                    className={cn(
                      "rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/40",
                      diaryMode === opt.value
                        ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                      selectedIsFuture && "cursor-not-allowed opacity-50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {MODE_OPTIONS.find((o) => o.value === diaryMode)?.description}
              </p>
            </div>

            <div className="mt-5">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  isReflectionContext
                    ? "当時の自分は、何を感じ、何を選びましたか？ 今の自分はそれをどう解釈しますか？"
                    : "今日のことを書いてみましょう..."
                }
                disabled={isGenerating || selectedIsFuture}
                className={cn(
                  "min-h-[160px] resize-none rounded-xl border-slate-200 bg-slate-50",
                  "px-4 py-3 text-base leading-relaxed text-slate-900",
                  "placeholder:text-slate-400",
                  "focus-visible:border-sky-500 focus-visible:ring-sky-500/20",
                  "disabled:opacity-50"
                )}
              />
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-xl bg-rose-50 px-4 py-3 ring-1 ring-rose-100">
              <Heart className="h-4 w-4 shrink-0 fill-rose-400 text-rose-400" aria-hidden />
              <span className="flex-1 text-sm font-medium text-slate-700">
                合言葉:{" "}
                <span className="font-semibold text-rose-600">
                  {selectedCoreValueEnriched || currentCoreValue || "未来の自分を待機中…"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => router.push("/onboarding/core?edit=1")}
                className="text-sm font-medium text-sky-600 hover:text-sky-700 hover:underline"
              >
                変更
              </button>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                disabled={isGenerating || selectedIsFuture}
                className="w-full rounded-xl border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:w-auto"
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
                disabled={isGenerating || !content.trim() || selectedIsFuture}
                className="w-full rounded-xl bg-sky-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/20 hover:bg-sky-600 sm:w-auto"
                onClick={() => void handleGenerate()}
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    生成中...
                  </span>
                ) : (
                  "保存して処方箋を生成"
                )}
              </Button>
            </div>

            {selectedIsFuture ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                未来の日付には日記を保存できません。今日以前の日付を選択してください。
              </div>
            ) : null}

            {selectedEntry?.ai_response ? (
              <div className="mt-5 rounded-xl border border-sky-100 bg-sky-50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-sky-600">
                  <Sparkles className="h-4 w-4" aria-hidden />
                  未来の君からの処方箋
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                  {selectedEntry.ai_response}
                </p>
              </div>
            ) : null}

            {!selectedEntry && !content && !selectedIsFuture ? (
              <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center">
                <CalendarDays className="mx-auto h-8 w-8 text-slate-300" aria-hidden />
                <p className="mt-2 text-sm text-slate-400">この日の日記はまだありません</p>
              </div>
            ) : null}

            {errorMsg ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{errorMsg}</div>
            ) : null}
            {infoMsg ? (
              <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                {infoMsg}
              </div>
            ) : null}
          </div>
        </section>
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

