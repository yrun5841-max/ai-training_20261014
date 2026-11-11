# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## 重要: Next.js のバージョンについて

このプロジェクトは **Next.js 16.4 / React 19.3** を使用しています。学習データの Next.js とは API・規約・ファイル構成が異なる可能性があるため、コードを書く前に必ず `node_modules/next/dist/docs/`（`01-app/`, `03-architecture/` など）の該当ガイドを読み、非推奨の通知に従ってください。

## 環境

- Docker コンテナの中で動いています。
- 開発サーバーは人が実行するので、`npm run dev` は実行しないでください。

## git

- コミットとプッシュは、頼まれたときだけ行ってください。
- コミットの前に、対象のファイルとコミットメッセージを見せてください。
- コミットメッセージは日本語で書いてください。

## コマンド

```bash
npm run dev     # 開発サーバー起動 (http://localhost:3000) ※人が実行する。Claude は実行しない
npm run build   # 本番ビルド
npm run start   # ビルド済みアプリの起動
npm run lint    # ESLint (flat config: eslint.config.mjs)
npx tsc --noEmit  # 型チェック
```

### テスト

- Vitest（`vitest.config.mts`）。テスト対象は `lib/` の関数だけで、画面（コンポーネント）のテストは作りません。
- テストファイルは対象の隣に `lib/<name>.test.ts` として置きます（`include: ["lib/**/*.test.ts"]`）。
- テスト用のダミーデータ（画面設計 Artifact の申込者10人）と、条件を満たすグループ分けを先に作ってから並びを崩したデータを作る関数は、`lib/test-data.ts` にあります。
- 申し込み内容のチェックは `lib/validation.ts` にあり、`app/actions.ts` から呼んでいます。
- `npm run test` はファイルの変更を監視します。1回だけ実行するときは `npx vitest run` を使います。

## アーキテクチャ

- **App Router のみ**（`app/` ディレクトリ）。`app/layout.tsx` がルートレイアウトで、`<html lang="ja">` と Noto Sans JP フォント（`next/font/google`、CSS 変数 `--font-noto-sans-jp`。等幅は `--font-geist-mono`）を設定しています。
- シャッフルランチアプリです（仕様は `SPEC.md`）。
  - `app/page.tsx`: 参加者用のトップ画面（申し込み・取り消し・自分のグループ表示を1画面で切り替え）。フォームは `app/apply-form.tsx`（Client Component）。区分バッジは `app/category-badge.tsx`。
  - 画面デザインの元は Artifact「シャッフルランチ 画面設計」（https://claude.ai/artifact/5TmR2vHfSogAft4UfEEeWR）。募集設定・結果確認の画面と年代の項目は採用していません。
  - `app/admin/`: 管理画面（`page.tsx` 申込者一覧、`shuffle/page.tsx` シャッフル・公開）。
  - `app/actions.ts`: Server Actions（申し込み、取り消し、シャッフル、公開）。
  - `lib/schedule.ts`: 開催日（第3金曜）・締め切り日の計算。月ごとの上書きは `overrides`。
  - `lib/participant.ts`: トップ画面に出す内容の判定（`participantStatus`）と、そのためのデータ読み込み（`loadParticipantView`）。`app/page.tsx` は表示だけを書きます。
  - `lib/store.ts`: データ保存（`data/lunch.json`）、部署・区分の一覧。`lib/shuffle.ts`: グループ分け。`lib/session.ts`: Cookie による本人判定。
  - 日付や Cookie・ファイルを読むコンポーネントは `await io()` を呼び、`<Suspense>` で囲んでいます（Cache Components のため）。
- レイアウトの props 型には Next.js が生成するグローバル型ヘルパー `LayoutProps<"/">` を使用しています（`.next/types` から生成され、`tsconfig.json` の `include` に含まれています）。
- パスエイリアス: `@/*` → プロジェクトルート。

### next.config.ts の要点

- `cacheComponents: true` と `partialPrefetching: true` が有効です。データ取得やキャッシュの挙動は従来の Next.js と異なるため、動的データを扱う前にドキュメントを確認してください。
- Tailwind CSS v4 は PostCSS ではなく、Turbopack のローダー（`@tailwindcss/turbopack`）経由で `*.css` に適用されています。PostCSS 設定ファイルは存在しません。

### スタイリング

- Tailwind CSS v4（`app/globals.css` で `@import "tailwindcss"`）。テーマトークンは `@theme inline` で定義しています。
- 配色は主色オレンジ（`primary`）とアクセント色ティール（`accent`）の2色です。文字色には濃いめの `primary-ink` / `accent-ink` を使います。背景・枠線・補助文字は `background` / `surface` / `line` / `muted` です。
- ダークモードは `prefers-color-scheme` に従い、上記のトークンを `globals.css` で切り替えています。

## 注意事項

- `.env` は `.claude/settings.json` で読み書きが禁止されています。中身を読もうとせず、必要な場合はユーザーに確認してください。
