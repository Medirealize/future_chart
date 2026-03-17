# Symptom-Block（症状経過要約アプリ）

急性期の症状を**タップだけで**記録し、診察室で医師に**見せるだけ**で伝わる要約を生成する Next.js アプリです。

## 技術スタック

- **Framework**: Next.js (App Router)
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: OpenAI API (gpt-4o-mini)
- **Storage**: LocalStorage (MVP)
- **PWA**: next-pwa（ホーム画面に追加可能）

## セットアップ

```bash
npm install
cp .env.example .env.local
# .env.local に OPENAI_API_KEY を設定
npm run dev
```

ブラウザで **http://localhost:3000** を開いてください。

### サイトにアクセスできない場合

1. **確実に開く方法（推奨）**  
   開発サーバーで 404 が出る場合は、本番ビルドから起動してください。  
   ```bash
   npm run serve
   ```  
   表示された **http://localhost:3000** をブラウザで開いてください。

2. **手順を分けたい場合**  
   ```bash
   npm run build
   npm run start
   ```  
   その後、**http://localhost:3000** を開いてください。

3. **開発サーバー（npm run dev）で 404 のとき**  
   「Ready」表示後に **http://localhost:3000** を開き、まだ 404 なら一度リロードしてください。  
   `EMFILE: too many open files` が出る場合は、他アプリを減らすか、上記の `npm run serve` を使ってください。

4. **別の端末（スマホなど）から開く**  
   同じ Wi‑Fi 内の他端末から **http://\<PCのIPアドレス\>:3000** でアクセスできます。

## PWA アイコン

「ホーム画面に追加」でアイコンを表示するには、次の PNG を `public/` に配置してください。

- `public/icon-192.png`（192×192）
- `public/icon-512.png`（512×512）

`public/icon.svg` を元にエクスポートするか、任意のアイコン画像をリネームして配置してください。

## 主な機能

- **家族タブ**: 初期は「自分」1人のみ。＋ボタンで家族を追加し、タブで切り替え。プロフィールにアレルギーを保持。
- **症状入力**: 全身（発熱・機嫌）／呼吸（咳・鼻水）／消化（軟便・水様便・嘔吐・食欲）。体温はドラムロール（35.0〜41.0℃）。程度は「ひどい／そこそこ／すこし」の3段階。
- **先生に見せる**: 主訴を自動選定し、AI で要約。医師提示用画面（白背景・特大文字・アレルギー最上部・スリープ防止）。
- **48時間アーカイブ**: 経過したログをリセットして新しく始められる。

## 注意

- 診断は行いません。患者の言葉を維持した要約のみ生成します。
- データは端末の LocalStorage にのみ保存されます。
