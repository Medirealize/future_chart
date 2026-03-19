# Future Chart App

未来の自分との対話を軸にした、Next.js + Supabase ベースの日記アプリです。
オンボーディング（診断 → 未来設定 → 合言葉設定）を経て、日々の日記入力とAIフィードバックを提供します。

## 技術スタック

- Next.js (App Router)
- React / TypeScript
- Tailwind CSS
- Supabase (Auth / DB)
- Google Generative AI (Gemini)

## セットアップ

```bash
npm install
cp .env.example .env.local
```

`.env.local` を設定:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `GEMINI_MODEL` (例: `gemini-1.5-flash`)

起動:

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開いてください。

## 主な画面

- `/login`: ログイン / サインアップ
- `/onboarding/diagnosis`: 初回診断
- `/onboarding/future`: 未来設定
- `/onboarding/core`: 合言葉設定
- `/dashboard`: カレンダー + 日記入力 + AIフィードバック

## セキュリティ注意点

- `.env.local` は `.gitignore` で除外済みです。
- APIキーやシークレットはGitHubにコミットしないでください。

## リリースチェックリスト

- `CHECKLIST_RELEASE_v1.0.2.md`: v1.0.2 のリリース前確認項目
