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
    <div className="min-h-screen bg-gradient-to-b from-[#FDF8F3] via-[#FAF6EF] to-[#F3EBE2] px-4 py-8 pb-16 md:px-8 md:py-10">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-stone-200/80 bg-white/80 px-4 py-2.5 text-sm font-medium text-stone-700 shadow-sm backdrop-blur-sm transition hover:border-amber-200 hover:bg-white hover:text-stone-900"
        >
          <ChevronLeft className="h-4 w-4 shrink-0" aria-hidden />
          カレンダーに戻る
        </button>

        <article className="overflow-hidden rounded-[2rem] border border-rose-100/80 bg-gradient-to-br from-white via-[#FFFBF8] to-sky-50/20 shadow-[0_8px_40px_-12px_rgba(150,100,90,0.15)] ring-1 ring-rose-100/40">
          <header className="border-b border-rose-100/70 bg-white/50 px-6 py-6 backdrop-blur-sm md:px-8 md:py-7">
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
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500">
                    <PenLine className="h-3.5 w-3.5" aria-hidden />
                    日記を書く
                  </span>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-stone-900 md:text-3xl">
                  {pageHeadline()}
                </h1>
                <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-stone-600 md:text-base">
                  <span className="inline-flex items-center gap-1.5 font-medium text-stone-800">
                    <CalendarDays className="h-4 w-4 text-sky-500" aria-hidden />
                    {dateLabel}
                  </span>
                  <span className="text-stone-400" aria-hidden>
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />
                    <span className="font-medium text-stone-700">未来の自分</span>
                    <span className="max-w-[min(100%,18rem)] truncate text-stone-600" title={futureTitle}>
                      「{futureTitle}」
                    </span>
                  </span>
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200/80 bg-white/90 px-4 py-3 text-right shadow-sm">
                <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-stone-400">
                  対象日（ISO）
                </p>
                <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-stone-800">{dateISO}</p>
              </div>
            </div>
          </header>

          <div className="space-y-8 px-6 py-8 md:px-8 md:py-9">
            {coreValue ? (
              <section
                className="rounded-2xl border border-amber-200/60 bg-amber-50/50 px-5 py-5 shadow-sm md:px-6 md:py-5"
                aria-label="合言葉"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="flex min-w-0 flex-1 gap-3">
                    <Heart className="mt-1 h-6 w-6 shrink-0 fill-rose-100 text-rose-400" aria-hidden />
                    <div className="min-w-0">
                      <p
                        className="font-semibold uppercase tracking-wider text-amber-900/90"
                        style={{ fontSize: "0.8125rem", letterSpacing: "0.06em" }}
                      >
                        合言葉
                      </p>
                      <p
                        className="mt-1.5 font-medium leading-snug text-stone-800"
                        style={{ fontSize: "1.25rem", lineHeight: 1.45 }}
                      >
                        {coreValueEnriched}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    type="button"
                    className="!h-auto w-full shrink-0 rounded-2xl border-sky-300/80 bg-white px-6 py-3.5 font-semibold text-sky-800 shadow-sm hover:bg-sky-50 sm:w-auto md:min-h-[4rem] md:px-8 md:py-4"
                    style={{ fontSize: "1.5rem", lineHeight: 1.35 }}
                    onClick={() => router.push("/onboarding/core?edit=1")}
                  >
                    合言葉を変更
                  </Button>
                </div>
              </section>
            ) : null}

            <section aria-labelledby="mode-heading">
              <h2 id="mode-heading" className="text-lg font-bold text-stone-900 md:text-xl">
                対話モード
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-stone-600 md:text-base">
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
              <p className="mt-4 rounded-xl bg-stone-100/60 px-4 py-3 text-sm text-stone-700 md:text-base">
                <span className="font-semibold text-sky-800">「{diaryMode}」</span>
                <span className="mx-1.5 text-stone-400">—</span>
                {modeDescription}
              </p>
            </section>

            <section aria-labelledby="entry-heading">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="entry-heading" className="text-lg font-bold text-stone-900 md:text-xl">
                    本文
                  </h2>
                  <p className="mt-1 text-sm text-stone-600">
                    {mode === "reflection"
                      ? "当時の気持ちと、今の解釈を自由に綴ってください。"
                      : "今日の出来事や気づきを、未来の自分へ残してください。"}
                  </p>
                </div>
                <span className="text-xs font-medium tabular-nums text-stone-400 md:text-sm">
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
                className="min-h-[min(50vh,22rem)] rounded-2xl border-amber-200/80 bg-[#FFFDF9] px-5 py-5 text-[28px] leading-[1.65] text-stone-800 shadow-inner placeholder:text-stone-400 placeholder:text-xl focus-visible:border-sky-400 focus-visible:ring-2 focus-visible:ring-sky-200/50 md:min-h-[26rem] md:leading-[1.7] md:placeholder:text-2xl"
              />
            </section>

            {errorMsg ? (
              <div
                className="flex items-start gap-3 rounded-2xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm font-medium text-red-900 md:text-base"
                role="alert"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
                <span>{errorMsg}</span>
              </div>
            ) : null}

            {infoMsg ? (
              <div className="flex items-start gap-3 rounded-2xl border border-emerald-200/90 bg-emerald-50/90 px-4 py-3 text-sm font-medium text-emerald-900 md:text-base">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
                <span>{infoMsg}</span>
              </div>
            ) : null}

            <footer className="flex flex-col gap-4 border-t border-rose-100/60 pt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
              <p
                className="order-last max-w-xl text-stone-600 sm:order-first"
                style={{ fontSize: "1rem", lineHeight: 1.55 }}
              >
                一時保存はこの端末に下書きとして残ります。確定は「保存」でカレンダーに反映されます。
              </p>
              <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:flex-row sm:justify-end">
                <Button
                  variant="secondary"
                  type="button"
                  size="lg"
                  className="!h-auto min-h-[4.5rem] w-full rounded-2xl border-2 border-amber-200/90 px-8 py-4 font-semibold sm:w-auto sm:min-w-[11rem]"
                  style={{ fontSize: "1.5rem", lineHeight: 1.35 }}
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
                  className="!h-auto min-h-[4.5rem] w-full rounded-2xl bg-gradient-to-r from-sky-500 to-sky-600 px-8 py-4 font-semibold text-white shadow-md transition hover:from-sky-600 hover:to-sky-700 hover:shadow-lg sm:w-auto sm:min-w-[11rem]"
                  style={{ fontSize: "1.5625rem", lineHeight: 1.35, fontWeight: 600 }}
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
    </div>
  );
}
