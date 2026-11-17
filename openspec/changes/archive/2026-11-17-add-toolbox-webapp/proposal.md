# Proposal

## Why

日常的に使う小さな便利ツール（JSON整形、文字数カウント、UUID/パスワード生成など）は、それぞれ別のWebサイトに散らばっており、入力データが外部サーバーに送信される不安もある。ブラウザ内で完結し、データを保存しない（または localStorage のみ）ツール集を1つのWebアプリにまとめ、今後ツールを簡単に追加できる土台を作る。

## What Changes

- Next.js（App Router, TypeScript）+ Tailwind CSS のプロジェクトをリポジトリ直下に新規作成する（npm 使用）
- ツールボックスの枠組みを追加する
  - トップページ: 登録済みツールの一覧（カード表示、名前・説明）
  - 共通レイアウト: ヘッダー（トップへのリンク）とツール間ナビゲーション
  - ツールレジストリ: ツールのメタデータ（slug・名前・説明）を1か所で管理し、一覧・ナビ・ルーティングがそこから生成される仕組み
  - 各ツールは `/tools/<slug>` で表示
- 初期ツールとして以下3つを追加する
  - JSON整形/検証 — データ保存: なし
  - 文字数カウント — データ保存: なし
  - UUID/パスワード生成 — データ保存: localStorage（パスワード生成オプションのみ。生成した値そのものは保存しない）
- すべての処理はブラウザ内で完結し、入力内容をサーバーや外部APIへ送信しない

## Capabilities

### New Capabilities
- `toolbox-shell`: トップページのツール一覧、共通レイアウト/ナビゲーション、ツールレジストリによるツール登録・ルーティング、データ非送信の方針
- `tool-json-formatter`: JSONの整形（インデント指定）・圧縮・構文エラー表示
- `tool-char-counter`: 文字数（書記素単位）・空白除外文字数・行数・UTF-8バイト数のカウント
- `tool-id-generator`: UUID v4 生成とランダムパスワード生成（長さ・文字種オプション、オプションの localStorage 保存）

### Modified Capabilities
（なし。既存 spec は存在しない）

## Out of scope

- ユーザー認証、アカウント、サーバー側データベース、API Routes によるデータ処理
- 入力内容・生成結果の履歴保存やクラウド同期
- 上記3つ以外のツール（Base64/URLエンコード等は将来の別チェンジ）
- 多言語対応（UIは日本語のみ）、ダークモード切替UI（OSの設定追従は可）
- デプロイ先の構築・CI 設定

## Impact

- 新規: `package.json`、`next.config.*`、`tsconfig.json`、Tailwind/PostCSS 設定、ESLint 設定、`app/` 配下のページ・レイアウト、`components/` 配下のUIとツールレジストリ、`lib/` 配下のロジック、Prettier 設定
- 依存追加: `next`、`react`、`react-dom`、`tailwindcss`、`typescript`、`eslint` 系（`create-next-app` 標準構成）
- 開発依存追加（テスト）: `vitest`、`jsdom`、`@testing-library/*`、`@vitejs/plugin-react`。`npm test` でユニット/コンポーネントテストを実行
- 開発依存追加（整形）: `prettier`、`eslint-config-prettier`。`npm run format` / `format:check` で整形・確認
- Node.js は既存の `mise.toml`（Node 24）で管理し、ほかのバージョン管理ファイルは追加しない
- `AGENTS.md`: create-next-app の生成物を採用し、既存の規約案 `AGENTS_bk.md` の必要分を統合したうえで `AGENTS_bk.md` を削除
- 既存のアプリコードはないため影響なし（既存ファイルは README.md・mise.toml・OpenSpec 設定・AGENTS_bk.md のみ）
