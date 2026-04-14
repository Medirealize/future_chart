"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import {
  CalendarDays,
  ChevronLeft,
  PenLine,
  Sparkles,
  Heart,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
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
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const diaryModeOptions: ToggleGroupOption[] = [
    { value: "禅", label: "禅" },
    { value: "ライバル", label: "ライバル" },
    { value: "秘書", label: "秘書" },
  ];
  const [diaryMode, setDiaryMode] = React.useState<DiaryMode>("禅");

  const dateLabel = React.useMemo(() => {
    try {
      return format(parseISO(dateISO), "yyyy年M月d日（EEEE）", { locale: ja });
    } catch {
      return dateISO;
    }
  }, [dateISO]);

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

  const modeDescription =
    diaryMode === "禅"
      ? "静かに自分と向き合い、未来を俯瞰するスタイル"
      : diaryMode === "ライバル"
        ? "切磋琢磨し、互いを高め合う熱いスタイル"
        : "緻密な計画とサポートで、着実に未来を支えるスタイル";

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
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

    void load();
    return () => {
      cancelled = true;
    };
  }, [dateISO, supabase]);

  function pageHeadline() {
    if (mode === "reflection") return "過去の自分を振り返る";
    return "日記を編集";
  }

  async function handleSave() {
    const text = content.trim();
    if (!text) {
      setErrorMsg("日記の内容を入力してから保存してください。");
      return;
    }

    setErrorMsg(null);
    setIsSaving(true);
    try {
      const { data: authData, error } = await supabase.auth.getUser();
      if (error || !authData.user) {
        setErrorMsg("ログイン情報の取得に失敗しました。");
        router.push("/login");
        return;
      }

      const { error: upsertError } = await supabase.from("entries").upsert(
        {
          user_id: authData.user.id,
          created_at: dateISO,
          content: text,
          mode: diaryMode,
        },
        { onConflict: "user_id,created_at" }
      );

      if (upsertError) {
        setErrorMsg(`保存に失敗しました: ${upsertError.message}`);
        return;
      }

      router.push("/dashboard");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="fc-page-medium space-y-5">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 md:text-[15px]"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          カレンダーに戻る
        </button>

        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <header className="border-b border-slate-100 bg-white/80 px-4 py-5 backdrop-blur-sm md:px-5 md:py-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${
                      mode === "reflection"
                        ? "bg-amber-100/90 text-amber-900 ring-1 ring-amber-200/80"
                        : "bg-sky-100/90 text-sky-900 ring-1 ring-sky-200/70"
                    }`}
                  >
                    {mode === "reflection" ? "リフレクション" : "編集"}
                  </span>
                  <span className="fc-muted inline-flex items-center gap-1.5 font-medium">
                    <PenLine className="h-3.5 w-3.5" aria-hidden />
                    日記を書く
                  </span>
                </div>
                <h1 className="fc-page-title">
                  {pageHeadline()}
                </h1>
                <p className="fc-lead flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
                    <CalendarDays className="h-4 w-4 text-sky-500" aria-hidden />
                    {dateLabel}
                  </span>
                  <span className="text-slate-400" aria-hidden>
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                    <span className="font-medium text-slate-700">未来の自分</span>
                    <span className="max-w-[min(100%,18rem)] truncate text-slate-600" title={futureTitle}>
                      「{futureTitle}」
                    </span>
                  </span>
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-right shadow-sm md:px-4 md:py-3">
                <p className="fc-muted font-semibold uppercase tracking-wider">
                  対象日（ISO）
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-800 md:text-[15px]">{dateISO}</p>
              </div>
            </div>
          </header>

          <div className="space-y-6 px-4 py-6 md:px-5 md:py-7">
            {coreValue ? (
              <section
                className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-5 py-5 shadow-sm md:px-6 md:py-5"
                aria-label="合言葉"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <Heart className="mt-1 h-6 w-6 shrink-0 fill-rose-100 text-rose-400" aria-hidden />
                    <div className="min-w-0">
                      <p className="fc-muted font-semibold uppercase tracking-wider text-amber-900/90">
                        合言葉
                      </p>
                      <p className="fc-card-title mt-1.5 leading-snug text-slate-800">
                        {coreValueEnriched}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    type="button"
                    className="h-11 w-full shrink-0 rounded-xl border-sky-200 bg-white px-4 text-sm font-semibold text-sky-800 shadow-sm hover:bg-sky-50 sm:w-auto md:h-12 md:px-6 md:text-[15px]"
                    onClick={() => router.push("/onboarding/core?edit=1")}
                  >
                    合言葉を変更
                  </Button>
                </div>
              </section>
            ) : null}

            <section aria-labelledby="mode-heading">
              <h2 id="mode-heading" className="fc-section-title">
                対話モード
              </h2>
              <p className="fc-lead mt-1.5">
                今日の気分に合わせて、未来の自分とのトーンを選びます。
              </p>
              <div className="mt-4">
                <ToggleGroup
                  type="single"
                  value={diaryMode}
                  onValueChange={(value) => {
                    if (isDiaryMode(value)) setDiaryMode(value);
                  }}
                  options={diaryModeOptions}
                  size="xlarge"
                  className="grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4"
                />
              </div>
              <p className="fc-body mt-4 rounded-xl bg-slate-100 px-4 py-3">
                <span className="font-semibold text-sky-700">「{diaryMode}」</span>
                <span className="mx-1.5 text-slate-400">—</span>
                {modeDescription}
              </p>
            </section>

            <section aria-labelledby="entry-heading">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="entry-heading" className="fc-section-title">
                    本文
                  </h2>
                  <p className="fc-muted mt-1">
                    {mode === "reflection"
                      ? "当時の気持ちと、今の解釈を自由に綴ってください。"
                      : "今日の出来事や気づきを、未来の自分へ残してください。"}
                  </p>
                </div>
                <span className="fc-muted font-medium tabular-nums">
                  {content.length.toLocaleString()} 文字
                </span>
              </div>
              <Textarea
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder={
                  mode === "reflection"
                    ? "当時の自分は、何を感じ、何を選びましたか？ 今の自分はそれをどう解釈しますか？"
                    : "ここに日記を書いてください。"
                }
                className="min-h-[min(50vh,14rem)] rounded-xl border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-900 shadow-inner placeholder:text-slate-400 focus-visible:border-sky-500 focus-visible:ring-2 focus-visible:ring-sky-500/20 md:min-h-[20rem] md:px-4 md:py-3 md:text-[15px]"
              />
            </section>

            {errorMsg ? (
              <div
                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-900 md:text-[15px]"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            {infoMsg ? (
              <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 md:text-[15px]">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <span>{infoMsg}</span>
              </div>
            ) : null}

            <footer className="flex flex-col gap-4 border-t border-slate-100 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
              <p className="fc-body order-last max-w-xl sm:order-first">
                一時保存はこの端末に下書きとして残ります。確定は「保存」でカレンダーに反映されます。
              </p>
              <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:justify-end">
                <Button
                  variant="secondary"
                  type="button"
                  size="lg"
                  className="h-11 w-full rounded-xl border border-slate-200 px-5 text-sm font-semibold sm:w-auto sm:min-w-[10rem] md:h-12 md:text-[15px]"
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
                      setInfoMsg("一時保存しました。この端末に下書きを残しました。");
                      setErrorMsg(null);
                    } catch {
                      setErrorMsg("一時保存に失敗しました。ブラウザの設定をご確認ください。");
                      setInfoMsg(null);
                    }
                  }}
                >
                  一時保存
                </Button>
                <Button
                  size="lg"
                  className="h-11 w-full rounded-xl bg-sky-500 px-5 text-sm font-semibold text-white shadow-md shadow-sky-500/25 transition hover:bg-sky-600 sm:w-auto sm:min-w-[10rem] md:h-12 md:text-[15px]"
                  onClick={() => void handleSave()}
                  disabled={isSaving}
                >
                  {isSaving ? "保存中…" : "保存して戻る"}
                </Button>
              </div>
            </footer>
          </div>
        </article>
    </div>
  );
}
