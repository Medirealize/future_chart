"use client";

import * as React from "react";
import { format, parseISO, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { enrichFourCharIdioms } from "@/lib/dashboard/enrich-idioms";
import { BookOpen, ChevronDown, ChevronUp } from "lucide-react";
type EntryRow = {
  created_at: string;
  content: string | null;
  mode: string | null;
  ai_response: string | null;
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg border border-border bg-background text-primary shadow-sm">
            <BookOpen className="size-5" strokeWidth={1.75} aria-hidden />
          </span>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">年表（タイムライン）</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">大切な日々を、手帳のように残していきましょう</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => router.push("/dashboard")}>
          ← カレンダー
        </Button>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm md:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="hidden sm:block" aria-hidden />
              <span className="inline-flex w-fit items-center rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-muted-foreground">
                2026年〜の記録
              </span>
            </div>

            {timelineDayBlocks.length === 0 ? (
              <p className="mt-6 text-sm leading-relaxed text-muted-foreground md:text-base">
                まだ年表がありません。日々の気持ちを、そっと書き留めていきましょう。
              </p>
            ) : (
              <div className="relative mt-8">
                <div className="absolute bottom-3 left-2 top-3 w-px bg-gradient-to-b from-chart-2 via-chart-4 to-chart-5 opacity-60" />

                <div className="space-y-3 pl-8">
                  {timelineDayBlocks.map(({ dateISO, entry: e }) => {
                    const open = Boolean(timelineOpenByDate[dateISO]);
                    const mode = e.mode ?? "禅";
                    const isZen = mode === "禅";
                    const pillClass = isZen
                      ? "border border-border bg-muted text-foreground"
                      : "border border-border bg-accent text-accent-foreground";
                    const diaryText = (e.content ?? "").trim();
                    const preview =
                      diaryText.length > 160 ? `${diaryText.slice(0, 160)}...` : diaryText;
                    const labelDate = format(parseISO(dateISO), "yyyy年M月d日");

                    return (
                      <div
                        key={dateISO}
                        className="relative overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="absolute -left-[1.35rem] top-[1.35rem] size-3 rounded-full border-[3px] border-slate-50 bg-primary shadow-sm" />
                        <button
                          type="button"
                          onClick={() => toggleTimelineDay(dateISO)}
                          aria-expanded={open}
                          className="flex w-full items-center gap-4 rounded-lg px-5 py-4 text-left transition-colors hover:bg-muted/50"
                        >
                          <span className="min-w-0 flex-1 text-sm font-medium text-foreground md:text-base">
                            {open ? `${labelDate}の記録` : `${labelDate}の記録を表示`}
                          </span>
                          {open ? (
                            <ChevronUp
                              className="size-5 shrink-0 text-primary transition-opacity duration-200"
                              aria-hidden
                            />
                          ) : (
                            <ChevronDown
                              className="size-5 shrink-0 text-muted-foreground transition-opacity duration-200"
                              aria-hidden
                            />
                          )}
                        </button>

                        <div
                          className="grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none"
                          style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
                        >
                          <div className="min-h-0">
                            <div className="border-t border-border bg-muted/20 px-5 pb-5 pt-4">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  {e.created_at}
                                </span>
                                <span
                                  className={`w-fit rounded-full px-3.5 py-1 text-xs font-semibold shadow-sm ${pillClass}`}
                                >
                                  {mode}
                                </span>
                              </div>

                              <div className="mt-3 text-sm leading-relaxed text-foreground md:text-[0.9375rem]">
                                {enrichFourCharIdioms(preview)}
                              </div>

                              {e.ai_response ? (
                                <div className="mt-4 text-sm font-medium text-muted-foreground">
                                  未来の君からの処方箋生成済み
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
      </section>
    </div>
  );
}
