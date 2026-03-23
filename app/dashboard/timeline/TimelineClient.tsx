"use client";

import * as React from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { enrichFourCharIdioms } from "@/lib/dashboard/enrich-idioms";
import { BookOpen, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
type EntryRow = {
  created_at: string;
  content: string | null;
  mode: string | null;
  ai_response: string | null;
  sync_score: number | null;
};

export default function TimelineClient({ entries }: { entries: EntryRow[] }) {
  const router = useRouter();
  const [entriesState] = React.useState<EntryRow[]>(entries);

  const timelineDayBlocks = React.useMemo(() => {
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

    return items.map((entry) => ({ dateISO: entry.created_at, entry }));
  }, [entriesState]);

  const [timelineOpenByDate, setTimelineOpenByDate] = React.useState<Record<string, boolean>>({});
  const timelineDefaultAppliedRef = React.useRef(false);
  const [today, setToday] = React.useState<Date | null>(null);

  React.useEffect(() => {
    const tick = () => setToday(startOfDay(new Date()));
    tick();
    const id = window.setInterval(tick, 60_000);
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  React.useEffect(() => {
    if (timelineDayBlocks.length === 0) {
      timelineDefaultAppliedRef.current = false;
      return;
    }
    if (timelineDefaultAppliedRef.current) return;
    timelineDefaultAppliedRef.current = true;
    const todayISO = today ? format(today, "yyyy-MM-dd") : "";
    const hasToday =
      Boolean(todayISO) && timelineDayBlocks.some((b) => b.dateISO === todayISO);
    const defaultKey = hasToday
      ? todayISO
      : timelineDayBlocks[timelineDayBlocks.length - 1]!.dateISO;
    setTimelineOpenByDate((prev) => ({ ...prev, [defaultKey]: true }));
  }, [timelineDayBlocks, today]);

  function toggleTimelineDay(dateISO: string) {
    setTimelineOpenByDate((prev) => ({
      ...prev,
      [dateISO]: !prev[dateISO],
    }));
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] via-[#FAF6EF] to-[#F3EBE2] px-5 py-10 md:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[2rem] border border-amber-200/50 bg-[#FFFCF8] p-8 shadow-[0_8px_40px_-12px_rgba(160,110,70,0.12)] md:p-10">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="min-h-12 rounded-2xl border-amber-200/80 bg-white/80 px-6 py-3 text-base text-stone-700 shadow-sm hover:bg-amber-50/80"
              onClick={() => router.push("/dashboard")}
            >
              ← カレンダーへ戻る
            </Button>
          </div>

          <div className="mt-8 rounded-[2rem] border border-amber-100/90 bg-gradient-to-br from-white/95 via-[#FFFAF5] to-amber-50/30 p-8 shadow-[0_4px_28px_-10px_rgba(130,90,50,0.12)] ring-1 ring-amber-100/40 md:p-9">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100/90 text-violet-600 shadow-sm ring-1 ring-violet-200/40">
                  <BookOpen className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <div>
                  <h1 className="text-xl font-bold tracking-tight text-stone-800 md:text-2xl">
                    年表（タイムライン）
                  </h1>
                  <p className="mt-0.5 text-sm text-stone-500">
                    大切な日々を、手帳のように残していきましょう
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-full border border-amber-200/70 bg-white/80 px-3 py-1 text-xs font-medium text-amber-800/90 shadow-sm">
                2026年〜の記録
              </span>
            </div>

            {timelineDayBlocks.length === 0 ? (
              <p className="mt-6 text-base leading-relaxed text-stone-600">
                まだ年表がありません。日々の気持ちを、そっと書き留めていきましょう。
              </p>
            ) : (
              <div className="relative mt-8">
                <div className="absolute left-2 top-3 bottom-3 w-px bg-gradient-to-b from-sky-200/80 via-amber-200/60 to-rose-200/50" />

                <div className="space-y-3 pl-8">
                  {timelineDayBlocks.map(({ dateISO, entry: e }) => {
                    const open = Boolean(timelineOpenByDate[dateISO]);
                    const mode = e.mode ?? "禅";
                    const isZen = mode === "禅";
                    const pillClass = isZen
                      ? "border border-sky-200/80 bg-sky-50 text-sky-800"
                      : "border border-orange-200/80 bg-orange-50/90 text-orange-900";
                    const diaryText = (e.content ?? "").trim();
                    const preview =
                      diaryText.length > 160 ? `${diaryText.slice(0, 160)}...` : diaryText;
                    const labelDate = format(parseISO(dateISO), "yyyy年M月d日");

                    return (
                      <div
                        key={dateISO}
                        className="relative overflow-hidden rounded-2xl border border-amber-100/90 bg-white/95 shadow-[0_2px_16px_-4px_rgba(120,80,40,0.08)] ring-1 ring-white/80 transition-shadow hover:shadow-[0_6px_24px_-6px_rgba(120,80,40,0.12)]"
                      >
                        <div className="absolute -left-[1.35rem] top-[1.35rem] h-3 w-3 rounded-full border-[3px] border-[#FFFCF8] bg-gradient-to-br from-sky-400 to-sky-500 shadow-sm" />
                        <button
                          type="button"
                          onClick={() => toggleTimelineDay(dateISO)}
                          aria-expanded={open}
                          className="flex w-full items-center gap-4 rounded-2xl px-5 py-4 text-left transition-colors hover:bg-amber-50/40"
                        >
                          <span className="min-w-0 flex-1 text-base font-semibold text-stone-800">
                            {open ? `${labelDate}の記録` : `${labelDate}の記録を表示`}
                          </span>
                          {open ? (
                            <ChevronUp
                              className="h-5 w-5 shrink-0 text-sky-500 transition-opacity duration-200"
                              aria-hidden
                            />
                          ) : (
                            <ChevronDown
                              className="h-5 w-5 shrink-0 text-amber-500 transition-opacity duration-200"
                              aria-hidden
                            />
                          )}
                        </button>

                        <div
                          className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                        >
                          <div className="min-h-0">
                            <div className="border-t border-amber-100/70 bg-[#FFFCF9]/80 px-5 pb-5 pt-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-xs font-semibold uppercase tracking-wide text-stone-400">
                                  {e.created_at}
                                </span>
                                <span
                                  className={`w-fit rounded-full px-3.5 py-1 text-xs font-bold shadow-sm ${pillClass}`}
                                >
                                  {mode}
                                </span>
                              </div>

                              <div className="mt-3 text-[0.9375rem] leading-relaxed text-stone-800">
                                {enrichFourCharIdioms(preview)}
                              </div>

                              {e.sync_score != null ? (
                                <div className="mt-4 flex items-center gap-2 text-sm text-stone-500">
                                  <Sparkles className="h-4 w-4 text-amber-500" aria-hidden />
                                  <span>
                                    シンクロ率:{" "}
                                    <span className="font-bold text-sky-700">{e.sync_score}%</span>
                                  </span>
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
