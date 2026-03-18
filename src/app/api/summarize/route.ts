import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const { patientInfo, logs, chiefComplaints } = await req.json();
    const apiKey = process.env.OPENAI_API_KEY;
    const openai = apiKey ? new OpenAI({ apiKey }) : null;

    const systemPrompt = `
あなたは優秀な医療通訳兼編集者です。
患者がアプリで入力した症状ログを、診察室で医師が10秒で理解できる「報告書」に変換してください。

### 厳守事項
1. 診断や医療アドバイスは絶対に行わない。
2. 専門用語への変換はせず、患者の言葉（水様便、咳など）を維持する。
3. 箇条書きで、一目でわかる構造にする。
4. 主訴は最大2個。2個目が「なし」の場合は1個目を強調する。
`;

    const chief1 = chiefComplaints?.[0] ?? '（未選択）';
    const chief2 = chiefComplaints?.[1] ?? '';

    const userPrompt = `
以下のデータを要約してください。

■患者情報: ${patientInfo?.name ?? ''} (${patientInfo?.age ?? ''} / ${patientInfo?.gender ?? ''})
■アレルギー: ${patientInfo?.allergies ?? 'なし'}
■主訴: 1. ${chief1} / 2. ${chief2 || 'なし'}
■経過ログ:
${Array.isArray(logs) ? logs.map((l: { timeRange: string; symptom: string; severity: string }) => `- ${l.timeRange}: ${l.symptom} (${l.severity})`).join('\n') : ''}

### 出力フォーマット
【経過の要約】
- 最優先: 症状を羅列せず、経過が分かるように「出現→悪化/改善→現在」を短くまとめる。
- 形式: 箇条書き。「昨日から」「3日前から」「1週間前から」などの時間経過（いつから）は必ず含める。時刻（23:34など）は一切書かない。
- 行数: 最大5行の箇条書き（短いほど良い）。重要度は「主訴に関係するもの」「程度がひどい」「新しく出現/悪化/改善」を優先。
- 表現: 医療用語に言い換えず、患者の言葉を維持（例: 水様便、咳）。
- 禁止: 診断・助言・推測（〜の可能性、〜だと思う 等）をしない。
`;

    // フォールバック用のシンプルな要約（AIが使えない場合でも最低限返す）
    const fallbackSummary =
      Array.isArray(logs) && logs.length > 0
        ? logs
            .slice(0, 5)
            .map(
              (l: { timeRange: string; symptom: string; severity: string }) =>
                `・${l.timeRange} ${l.symptom}（${l.severity}）`
            )
            .join('\n')
        : '記録から要約を生成できませんでした。症状ログを確認してください。';

    if (!openai) {
      // APIキーが無い場合はAIを使わずフォールバックを返す（HTTP 200）
      return NextResponse.json({ summary: fallbackSummary });
    }

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
      });

      const content = response.choices[0]?.message?.content ?? '';
      return NextResponse.json({ summary: content || fallbackSummary });
    } catch (e) {
      console.error('openai summarize error', e);
      // OpenAI側が落ちてもフォールバックでHTTP 200を返す
      return NextResponse.json({ summary: fallbackSummary });
    }
  } catch (error) {
    console.error('summarize error', error);
    return NextResponse.json(
      { summary: '記録の読み込み時にエラーが発生しました。症状ログをご確認ください。' },
      { status: 200 }
    );
  }
}
