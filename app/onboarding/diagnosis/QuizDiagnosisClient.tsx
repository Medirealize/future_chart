"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/utils/supabase/browser";
import { Button } from "@/components/ui/button";
import { ToggleGroup } from "@/components/ui/toggle-group";

type QuizChoice = "A" | "B" | "C";

const QUESTIONS: Array<{
  id: string;
  prompt: string;
  options: Record<QuizChoice, string>;
}> = [
  {
    id: "q1",
    prompt: "何を達成した時が一番嬉しい？",
    options: {
      A: "効率よく目標達成",
      B: "新しい可能性にワクワク",
      C: "誰かと喜びを共有",
    },
  },
  {
    id: "q2",
    prompt: "判断の決め手は？",
    options: {
      A: "論理的なデータ",
      B: "自分の直感",
      C: "周囲の評判や安心感",
    },
  },
  {
    id: "q3",
    prompt: "このアプリに期待することは？",
    options: {
      A: "自己管理の徹底",
      B: "理想の自分への刺激",
      C: "日々の心の安定",
    },
  },
];

function computeType(answers: QuizChoice[]): QuizChoice {
  // 「最も選択件数が多いアルファベット」を user_type にする（同率は A → B → C の順で優先）
  const counts: Record<QuizChoice, number> = { A: 0, B: 0, C: 0 };
  for (const a of answers) counts[a] += 1;

  const order: QuizChoice[] = ["A", "B", "C"];
  let best: QuizChoice = "A";
  for (const candidate of order) {
    if (counts[candidate] > counts[best]) best = candidate;
  }
  return best;
}

export default function QuizDiagnosisClient() {
  const router = useRouter();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<QuizChoice[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  /** 最終設問の保存・遷移を二重実行しない（Strict Mode / 連打対策） */
  const isCompletingRef = React.useRef(false);

  const q = QUESTIONS[step];
  const isLastStep = step === QUESTIONS.length - 1;
  const lastAnswer = answers[QUESTIONS.length - 1];
  const canProceedLast = Boolean(lastAnswer);

  /** 1〜2問目: 選ぶと次の設問へ。3問目: 選ぶだけ（完了は「次へ進む」） */
  function handleOptionPick(letter: QuizChoice) {
    if (isSaving || isCompletingRef.current) return;
    const nextAnswers = [...answers.slice(0, step), letter];
    setAnswers(nextAnswers);
    if (isLastStep) return;
    setStep((s) => s + 1);
  }

  async function handleProceedComplete() {
    if (isSaving || isCompletingRef.current) return;
    if (!isLastStep) return;
    if (!canProceedLast || answers.length < QUESTIONS.length) {
      alert("選択肢を選んでください。");
      return;
    }

    isCompletingRef.current = true;

    const userType = computeType(answers);
    localStorage.setItem(
      "onboarding_diagnosis",
      JSON.stringify({ userType, answers })
    );
    setIsSaving(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) {
        alert("ログイン情報の取得に失敗しました。");
        isCompletingRef.current = false;
        router.push("/login");
        return;
      }

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: authData.user.id,
            user_type: userType,
          },
          { onConflict: "id" }
        );

      if (upsertError) {
        alert(`診断結果の保存に失敗しました: ${upsertError.message}`);
        isCompletingRef.current = false;
        return;
      }

      window.location.assign("/onboarding/future");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600 dark:text-slate-300">
            診断 {step + 1}/{QUESTIONS.length}
          </div>
          <div className="text-right text-xs text-slate-500 dark:text-slate-400">
            性格統計学ベースの簡易タイプ診断（A/B/C・全3問）
          </div>
        </div>

        <h1 className="mt-6 text-xl font-semibold">{q.prompt}</h1>

        <div className="mt-6">
          <ToggleGroup
            type="single"
            value={answers[step] ?? null}
            onValueChange={(value) => handleOptionPick(value as QuizChoice)}
            options={[
              { value: "A", label: `A: ${q.options.A}` },
              { value: "B", label: `B: ${q.options.B}` },
              { value: "C", label: `C: ${q.options.C}` },
            ]}
          />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => {
              if (isSaving) return;
              if (step > 0) {
                setAnswers((prev) => prev.slice(0, step));
                setStep((s) => s - 1);
              }
            }}
            disabled={step === 0 || isSaving}
          >
            前へ
          </Button>
          {isLastStep ? (
            <Button
              type="button"
              size="lg"
              className="min-h-12 px-8 text-base font-semibold"
              disabled={isSaving || !canProceedLast}
              onClick={() => void handleProceedComplete()}
            >
              {isSaving ? "保存中..." : "次へ進む"}
            </Button>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              選択すると次に進みます
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

