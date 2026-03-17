import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'OPENAI_API_KEY が設定されていません' },
      { status: 500 }
    );
  }
  const openai = new OpenAI({ apiKey });

  try {
    const { patientInfo, logs, context, chiefComplaints } = await req.json();

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
■周辺情報: 食欲: ${context?.appetite ?? '―'}, 機嫌: ${context?.mood ?? '―'}, 周囲の流行: ${context?.epidemic ?? '―'}
■経過ログ:
${Array.isArray(logs) ? logs.map((l: { time: string; symptom: string; severity: string }) => `- ${l.time}: ${l.symptom} (${l.severity})`).join('\n') : ''}

### 出力フォーマット
【経過の要約】のみを、3行以内の箇条書きで書いてください。診断はしないでください。患者の表現をそのまま使ってください。
【周辺情報】食欲・機嫌などを1行ずつ簡潔に。
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
    });

    const content = response.choices[0]?.message?.content ?? '';
    return NextResponse.json({ summary: content });
  } catch (error) {
    console.error('summarize error', error);
    return NextResponse.json(
      { error: '要約の生成に失敗しました' },
      { status: 500 }
    );
  }
}
