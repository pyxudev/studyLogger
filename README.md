# StudyLog - 勉強打刻アプリ

名前を入力して勉強の開始・終了を記録し、学習時間を管理するアプリです。

## Vercelへのデプロイ手順

### 1. リポジトリをGitHubにプッシュ

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/study-tracker.git
git push -u origin main
```

### 2. Vercel Blobストレージを有効化

1. [Vercel Dashboard](https://vercel.com/dashboard) でプロジェクトを作成
2. **Storage** タブ → **Create Database** → **Blob** を選択
3. データベース名を入力して作成
4. プロジェクトとBlobを接続する

これにより `BLOB_READ_WRITE_TOKEN` 環境変数が自動的にセットされます。

### 3. デプロイ

Vercelのダッシュボードから、GitHubリポジトリをインポートしてデプロイするだけです。

## ローカル開発

```bash
npm install

# Vercel CLIのインストール
npm i -g vercel

# ローカルでVercel Blob環境変数を設定
vercel env pull .env.local

# 開発サーバー起動
npm run dev
```

## 機能

- **勉強開始** ボタン：現在時刻を開始時刻として記録
- **勉強完了** ボタン：現在時刻を終了時刻として記録し、勉強時間を計算
- **記録テーブル**：全ての勉強記録を一覧表示
- **月間ランキング**：今月の名前別合計勉強時間ランキング
- 勉強中はリアルタイムで経過時間を表示

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **DB**: Vercel Blob
- **言語**: TypeScript
- **スタイル**: CSS-in-JS (styled-jsx)
