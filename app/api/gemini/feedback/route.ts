import { NextResponse } from "next/server";
import {
  GoogleGenerativeAI,
  GoogleGenerativeAIFetchError,
} from "@google/generative-ai";

type Body = {
  diaryContent: string;
  userType: "A" | "B" | "C" | string;
  selectedMode: "禅" | "ライバル" | "秘書" | string;
  targetYears: number;
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
  targetYears,
  futureTitle,
  coreValue,
  context,
}: Body) {
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

  const outputFormat = [
    "先頭は「未来の私より：」で開始する。",
    `最後は「シンクロ率: <数字>%（理由: 〇〇を意識できたため）」で締めくくり、その最後に合言葉「${coreValue}」を必ず添える（例: シンクロ率: 82%（理由: ...）—合言葉:「${coreValue}」）。`,
  ];

  const contextHint =
    context === "reflection"
      ? "これは過去の自分を振り返る日記です。過去の感情・選択を、今の視点で言語化してください。"
      : "これは現在の自分の編集・振り返り日記です。前向きに言語化してください。";

  const prompt = sanitize(`# Role
あなたは、ユーザーが設定した「理想的な未来の自分」です。

# Future Identity (Context)
- 私は **${targetYears}年後** の未来から来た、**${futureTitle}** としてのあなたです。
- 私たちが共有する合言葉は「${coreValue}」です。この言葉を指針としています。

# User Personality
${personality}

# Mode Perspective
${modePerspective}

# 厳守・禁止事項
- ${strictRules.join("\n- ")}

# 出力フォーマット
- ${outputFormat.join("\n- ")}

# 指示
${contextHint}

# 今日の日記
${diaryContent}

# あなたの応答
上記のルールに従って、未来の私としてフィードバックを返してください。`);

  return prompt;
}

function parseSyncScore(aiText: string): number | null {
  // 例: シンクロ率: 82%（理由: ...）
  const m = aiText.match(/シンクロ率[:：]\s*([0-9]{1,3})\s*%/);
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
      targetYears,
      futureTitle,
      coreValue,
      context,
    } = body;

    if (!diaryContent?.trim()) {
      return NextResponse.json({ error: "diaryContent is required" }, { status: 400 });
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
      targetYears,
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

