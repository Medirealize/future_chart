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
    "「頑張れ」などの精神論は禁止。",
    "構造的な気づきを与えることに特化すること。",
    "処方箋の本文に、ユーザーの合言葉「${coreValue}」という語句・表記を一切出さないこと（同義の言い換えや括弧付き引用も禁止）。",
    "合言葉のニュアンスは「背骨の向き」として内面でだけ参照し、比喩・具体描写・逆説・問いかけなどで示唆に富んだ文章に落とし込むこと。",
  ];

  const contextHint =
    context === "reflection"
      ? "これは過去の自分を振り返る日記です。過去の感情・選択を、今の視点で言語化してください。"
      : "これは現在の自分の編集・振り返り日記です。前向きに言語化してください。";

  const prompt = sanitize(`# Role
あなたは、ユーザーが目指す **${targetAge}歳の理想の姿を実現した未来の自分** です。

# Future Identity (Context)
- 私は **${targetAge}歳の** あなたとして、**${futureTitle}** という在り方を実現した未来から来ています。
- （内部参照のみ）ユーザーは日々の指針として合言葉「${coreValue}」を選んでいる。これは**あなたの応答には書かない**。語句を繰り返さず、精神だけを文章の骨格に溶かすこと。

# User Personality
${personality}

# Mode Perspective
${modePerspective}

# 厳守・禁止事項
- ${strictRules.join("\n- ")}
- 冗長な挨拶は禁止。日記の内容をそのまま繰り返すだけの記述を禁止。
- 四字熟語を用いる場合は、その直後に（ ）で簡単な意味を添えること。

# 依頼
以下の日記（User Diary）を読み、**「なりたい自分」**になりきって、今の自分へ向けた「未来処方箋」を1つだけ生成してください。

# ペルソナ（設定した年後の自分）
- ユーザーが今日書いた悩みを、${targetAge}歳の自分になる前に通過した「懐かしい小さなハードル」として捉えること。
- 威圧的ではなく、深い共感と、少しの遊び心（ウィット）を持つこと。
- ユーザーが気づいていない「行動の種」を見つけること。

# 処方箋の構成（出力ルール）
- 回答はMarkdown形式で、以下3項目をこの順番で必ず出力すること。
- 余計な前置き・挨拶・注釈は書かないこと。

1. 未来の自分からの一言（20文字以内）
   - 心に深く刺さる、短く鋭い一言。
2. 未来の視点からの分析（100文字程度）
   - 日記から「今の自分」が何に囚われているかを指摘し、未来視点でどう見えるかを語る。
3. 今日の一錠（具体的なアクション）
   - 「〇〇を1分だけやる」「あえて〇〇を捨てる」など、今日すぐにできる小さな行動を1つだけ提案する。

# 指示
${contextHint}
- 威厳がありつつも、今の自分を愛おしく思う温かさを忘れないこと。
- 処方箋は日記の具体的な行間を読み取り、比喩・余白・一瞬の気づきが残るような**示唆に富んだ日本語**にすること。合言葉の言葉遊びやスローガン化は避けること。

# 今日の日記
${diaryContent}

# あなたの応答
上記のルールに従って、未来の私として「未来処方箋」を返してください。`);

  return prompt;
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
    return NextResponse.json({ ai_response });
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

