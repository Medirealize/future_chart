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

  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      // まずはローカル下書き（カレンダークリック時に設定）
      try {
        const raw = localStorage.getItem(`entry_draft_${dateISO}`);
        if (raw) {
          const parsed = JSON.parse(raw) as { content?: string; mode?: string };
          if (!cancelled && typeof parsed.content === "string") setContent(parsed.content);
          if (!cancelled && isDiaryMode(parsed.mode ?? "")) setDiaryMode(parsed.mode);
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
          if (isDiaryMode(row?.mode ?? "")) {
            setDiaryMode(row.mode);
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
          // ai_response / sync_score は未使用（null想定）
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
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              合言葉：{coreValue}
            </p>
          ) : null}
        </div>

        <div className="mt-5">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-200">
            モード（禅/ライバル/秘書）
          </div>
          <div className="mt-2">
            <ToggleGroup
              type="single"
              value={diaryMode}
              onValueChange={(value) => {
                if (isDiaryMode(value)) setDiaryMode(value);
              }}
              options={diaryModeOptions}
            />
            <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              現在のモード: {diaryMode}
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
          />
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => router.push("/dashboard")} disabled={isSaving}>
              戻る
            </Button>
            <Button
              variant="secondary"
              type="button"
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
            <Button onClick={handleSave} disabled={isSaving}>
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

