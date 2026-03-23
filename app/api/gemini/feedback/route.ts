import { NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";

type Body = {
  diaryContent: string;
  userType: "A" | "B" | "C" | string;
  selectedMode: "禅" | "ライバル" | "秘書" | string;
  /** 目標年齢（歳）。旧クライアント互換で targetYears も受け付ける */
  targetAge?: number;
  targetYears?: number;
  futureTitle: string;
  coreValue: string;
  context: "reflection" | "edit";
};

function sanitize(text: string) {
  // 既存のプロンプト雛形に混ざるタグを除去
  return text.replace(/\[cite_start\]/g, "").trim();
}

function buildPrompt({
  diaryContent,
  userType,
  selectedMode,
  targetAge,
  futureTitle,
  coreValue,
  context,
}: Omit<Body, "targetYears"> & { targetAge: number }) {
  const personality =
    userType === "A"
      ? "Type A (Logical): 効率、結論、実利を重視。論理的で納得感を求める。"
      : userType === "B"
        ? "Type B (Vision): 直感、可能性、ワクワクを重視。イメージや感性で動く。"
        : "Type C (Peace): 共感、調和、人との繋がりを重視。安心感と他者への貢献を求める。";

  const modePerspective =
    selectedMode === "禅"
      ? "【禅 (Zen)】: 感情を挟まず、事実を鏡のように映し出す「静かな内省」。"
      : selectedMode === "ライバル"
        ? "【ライバル (Rival)】: 「今の自分」を越えるべき壁とする「ストイックな鼓舞」。"
        : "【秘書 (Concierge)】: 最高のパフォーマンスを引き出す「有能な右腕」。";

  const strictRules = [
    "医療・診断行為の禁止（数値目標の強制、薬の推奨、病名の断定）。",
    "回想形式で回答すること（当時の自分の気持ちや判断を振り返りとして語る）。",
    "決めつけの禁止。「君は〇〇だ」ではなく「私は〇〇だった」と自分の経験として語ること。",
    "「動物占い」等の占術用語は一切使用しないこと。",
  ];

  const contextHint =
    context === "reflection"
      ? "これは過去の自分を振り返る日記です。過去の感情・選択を、今の視点で言語化してください。"
      : "これは現在の自分の編集・振り返り日記です。前向きに言語化してください。";

  const prompt = sanitize(`# Role
あなたは、ユーザーが目指す **${targetAge}歳の理想の姿を実現した未来の自分** です。

# Future Identity (Context)
- 私は **${targetAge}歳の** あなたとして、**${futureTitle}** という在り方を実現した未来から来ています。
- 私たちが共有する合言葉は「${coreValue}」です。この言葉を指針としています。

# User Personality
${personality}

# Mode Perspective
${modePerspective}

# 厳守・禁止事項
- ${strictRules.join("\n- ")}
- 冗長な挨拶は禁止。日記の内容をそのまま繰り返すだけの記述を禁止。
- 四字熟語を用いる場合は、その直後に（ ）で簡単な意味を添えること。

# 出力の厳格ルール（最優先）
- 回答はMarkdown形式で、箇条書きを活用すること。
- 全体の文字数を300〜400文字以内に収めること。
- 400文字を超えた場合、自己評価スコアを強制的にマイナス修正すること。

# フィードバック構成（この順番）
- [共感]: 日記の感情や出来事に対し、未来の視点から短く1文で共感する。
- [本質的指摘]: 今日の出来事から抽出できる人生の教訓や改善点を、成長を促す視点で鋭く指摘する。
- [未来への投資]: 明日から取るべき具体的な行動指針を1文で提示する。
- [未来行動一致率 (FAA)]: 「${targetAge}歳で成功している自分なら、今日この場面でどう行動したか」を基準に、現在のアクションとの一致度を0〜100%で算出し、短い理由を添える。

# 指示
${contextHint}
- 威厳がありつつも、今の自分を愛おしく思う温かさを忘れないこと。
- 合言葉「${coreValue}」を文脈に自然な形で必ず含めること。

# 今日の日記
${diaryContent}

# あなたの応答
上記のルールに従って、未来の私としてフィードバックを返してください。`);

  return prompt;
}

function parseSyncScore(aiText: string): number | null {
  // 例: 未来行動一致率 (FAA): 82% / FAA: 82% / シンクロ率: 82%
  const m = aiText.match(
    /(?:未来行動一致率(?:\s*\(FAA\))?|FAA|シンクロ率)[:：]\s*([0-9]{1,3})\s*%/i
  );
  if (!m) return null;
  const v = Number(m[1]);
  if (!Number.isFinite(v)) return null;
  return Math.max(0, Math.min(100, Math.trunc(v)));
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const {
      diaryContent,
      userType,
      selectedMode,
      targetAge: bodyTargetAge,
      targetYears: bodyTargetYears,
      futureTitle,
      coreValue,
      context,
    } = body;

    if (!diaryContent?.trim()) {
      return NextResponse.json({ error: "diaryContent is required" }, { status: 400 });
    }

    const targetAge = Number(bodyTargetAge ?? bodyTargetYears);
    if (!Number.isFinite(targetAge) || targetAge < 1) {
      return NextResponse.json({ error: "targetAge（目標の年齢）が不正です" }, { status: 400 });
    }

    const apiKey =
      process.env.GEMINI_API_KEY ??
      process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      console.error("[Gemini] API key is missing", {
        hasGEMINI_API_KEY: Boolean(process.env.GEMINI_API_KEY),
        hasGOOGLE_GENERATIVE_AI_API_KEY: Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY),
      });
      return NextResponse.json(
        { error: "GEMINI_API_KEY が未設定です" },
        { status: 500 }
      );
    }

    const modelId = (process.env.GEMINI_MODEL ?? "gemini-1.5-flash").replace(/^models\//, "");
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = buildPrompt({
      diaryContent: diaryContent.trim(),
      userType: userType as any,
      selectedMode: selectedMode as any,
      targetAge,
      futureTitle,
      coreValue,
      context,
    });

    const candidates: Array<{ model: string; apiVersion: "v1" | "v1beta" }> = [
      { model: modelId, apiVersion: "v1" },
      { model: modelId, apiVersion: "v1beta" },
      { model: "gemini-1.5-flash-latest", apiVersion: "v1beta" },
      { model: "gemini-2.5-flash", apiVersion: "v1" },
      { model: "gemini-flash-latest", apiVersion: "v1beta" },
    ];

    let result: Awaited<ReturnType<ReturnType<typeof genAI.getGenerativeModel>["generateContent"]>> | null =
      null;
    let lastError: unknown = null;

    for (const candidate of candidates) {
      try {
        const model = genAI.getGenerativeModel(
          { model: candidate.model },
          { apiVersion: candidate.apiVersion }
        );
        result = await model.generateContent(prompt);
        console.info("[Gemini] generateContent succeeded", candidate);
        break;
      } catch (err: any) {
        lastError = err;
        console.warn("[Gemini] model candidate failed", {
          model: candidate.model,
          apiVersion: candidate.apiVersion,
          message: String(err?.message ?? err),
        });
      }
    }

    if (!result) {
      throw lastError ?? new Error("No available Gemini model for generateContent");
    }
    const ai_response = result.response.text();
    const sync_score = parseSyncScore(ai_response);

    return NextResponse.json({ ai_response, sync_score });
  } catch (e: any) {
    const message = String(e?.message ?? "Gemini API 呼び出しに失敗しました");

    if (e instanceof GoogleGenerativeAIFetchError) {
      console.error("[Gemini] Fetch error", {
        message: e.message,
        status: e.status,
        statusText: e.statusText,
        errorDetails: e.errorDetails,
      });
      if (e.status === 401 || e.status === 403) {
        return NextResponse.json(
          {
            error:
              "Gemini APIキーが無効、または権限不足の可能性があります。APIキー設定とプロジェクト権限をご確認ください。",
          },
          { status: 500 }
        );
      }
    } else {
      console.error("[Gemini] Unexpected error", {
        message,
        name: e?.name,
        stack: e?.stack,
      });
    }

    const isQuotaError =
      message.includes("429") ||
      message.toLowerCase().includes("quota") ||
      message.toLowerCase().includes("rate limit");
    if (isQuotaError) {
      return NextResponse.json(
        {
          error:
            "Gemini APIの利用上限に達しています。しばらく待って再実行するか、Google AI Studioで課金・クォータ設定をご確認ください。",
          detail: message,
        },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: message || "Gemini API 呼び出しに失敗しました" },
      { status: 500 }
    );
  }
}

