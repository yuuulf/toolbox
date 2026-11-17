# Tasks

> テストは Vitest + React Testing Library（design.md 決定7）。テストファイルは対象と同じ場所に `*.test.ts(x)` で置き、`npm test` で実行する。各タスクは実装とそのテストをセットで完了させる。コードは `AGENTS.md` の規約に従い（1.2 の統合までは `AGENTS_bk.md`）、npm コマンドは mise の Node 24 で実行する。

## 1. プロジェクトのセットアップ

- [x] 1.1 `mise install` で `mise.toml` の Node 24 を用意し、`mise exec -- node -v` が v24 系であることを確認する。リポジトリ外の一時ディレクトリで `create-next-app@latest`（TypeScript, Tailwind CSS, ESLint, App Router, npm, `src/` なし, `@/*` エイリアス、ほかは既定）を実行し、生成物（`node_modules/` と `.git/` を除く、生成された `AGENTS.md` を含む）をリポジトリ直下へ移して `npm install`。README.md・mise.toml・openspec/・.claude/・AGENTS_bk.md が変わっていないこと（`git status` / `git diff`）と、`npm run dev` で初期ページが表示されることを確認
- [x] 1.2 生成された `AGENTS.md` を優先し、`AGENTS_bk.md` から生成物にない必要分（開発環境・ディレクトリ構成・コードスタイル・UI・テスト・設計上の約束・完了前チェック・コミット）を追記する。生成物と食い違う記述は生成物を残し、食い違った点を報告する。統合後に `AGENTS_bk.md` を削除し、`AGENTS_bk.md` への参照がリポジトリに残っていないこと（`grep -r AGENTS_bk`）を確認
- [x] 1.3 初期テンプレートのサンプル内容（デモページ・不要なアセット・サンプルCSS）を削除し、`globals.css` を Tailwind の import と最小限のベーススタイルにする。`npm run lint` と `npm run build` が成功することを確認
- [x] 1.4 `prettier` と `eslint-config-prettier` を追加し、`.prettierrc.json`（`semi: false`、`singleQuote: true`、`trailingComma: 'all'`）・`.prettierignore`・`package.json` の `format` / `format:check` スクリプトを作成。ESLint 設定（`eslint.config.mjs`）の最後に `eslint-config-prettier/flat` 、`@typescript-eslint/consistent-type-imports`（error）を有効化し、`npm run format` で生成物を整形。`npm run format:check` と `npm run lint` が成功し、生成コードにセミコロン・ダブルクォート（JSX 属性以外）が残っていないことを確認
- [x] 1.5 テスト用の開発依存（`vitest`、`@vitejs/plugin-react`、`jsdom`、`@testing-library/react`、`@testing-library/dom`、`@testing-library/user-event`、`@testing-library/jest-dom`）を追加し、`vitest.config.mts`（既定環境 node、Vite 標準の `resolve.tsconfigPaths` で `@/*` 解決）、`vitest.setup.ts`（jest-dom 読み込み）、`package.json` の `test` / `test:watch` スクリプトを作成。仮のテスト1件（node 環境と `// @vitest-environment jsdom` 環境で各1つ）で `npm test` が成功することを確認し、仮テストを削除

## 2. ツールボックスの枠組み（toolbox-shell）

- [x] 2.1 `lib/storage.ts` に try/catch で包んだ `readJson(key, validate, fallback)` / `writeJson(key, value)` を実装し、`lib/storage.test.ts` で正常な読み書き・`localStorage` が例外を投げるケース（`vi.stubGlobal`）・不正JSON・検証失敗で fallback が返ることをテスト。`npm test` 成功を確認
- [x] 2.2 `components/tools/registry.ts` に `ToolDefinition` 型・`tools` 配列（仮のプレースホルダーコンポーネントで3件）・`getTool(slug)` を実装し、`components/tools/registry.test.ts` で slug の一意性・kebab-case・必須項目の存在・`getTool` の未登録時 `undefined` をテスト。`npm test` 成功を確認
- [x] 2.3 `components/header.tsx`（アプリ名→`/` リンク）と `components/tool-nav.tsx`（client、`usePathname` で現在ツールを強調、`{slug,name}` のみ受け取る）を作り、`app/layout.tsx` に組み込む（`lang="ja"`・`<title>` 既定値）。`components/tool-nav.test.tsx` で全ツールのリンク表示と、`usePathname` をモックした現在ツールの強調（`aria-current="page"`）をテストし、`npm test` 成功とブラウザでの表示を確認
- [x] 2.4 `app/page.tsx` にレジストリから生成するツール一覧（`ToolCard`：名前・説明・リンク）を実装し、`components/tool-card.test.tsx` で名前・説明・`/tools/<slug>` へのリンクをテスト。`/` に3件表示され遷移できることをブラウザで確認
- [x] 2.5 `app/tools/[slug]/page.tsx` に `generateStaticParams`・`generateMetadata`・未登録 slug で `notFound()` を呼ぶ処理（`params` は `await`、`dynamicParams` は使わない）を実装し、`app/not-found.tsx` を追加。Cache Components ではページ内 `notFound()` のステータスが 200 になるため、`proxy.ts`（matcher `/tools/:slug`）で未登録 slug を `/__not-found` へ rewrite して 404 を返し、`proxy.test.ts` で振り分けをテスト。`npm run start` で `/tools/json-formatter` の見出し表示と、`/tools/does-not-exist` が 404 ステータスで not-found ページを表示することを確認（async サーバーコンポーネントは Vitest 対象外）
- [x] 2.6 共通の `components/copy-button.tsx`（クリップボード書き込み、成功時「コピーしました」・失敗時「コピーできませんでした」を一時表示）を実装し、`components/copy-button.test.tsx` で書き込み内容と成功表示（`userEvent.setup()`）、`writeText` を reject させた失敗表示をテスト。`npm test` 成功を確認
- [x] 2.7 README.md にアプリ概要・ツール一覧・セットアップ（mise で Node 24 → `npm install`）・`npm run dev` / `lint` / `format` / `format:check` / `test` / `build` の手順・データ方針（外部送信なし、localStorage のみ）・新ツール追加手順（ロジック＋テスト → UI＋テスト → `components/tools/registry.ts` に1エントリ）を記載し（規約の詳細は AGENTS.md へリンク）、手順どおりにコマンドが動くことを確認。以降のグループでツールを追加したら README のツール一覧も更新する

## 3. JSON整形/検証（tool-json-formatter）

- [x] 3.1 `lib/tools/json-format.ts` に `formatJson(input, indent)` / `minifyJson(input)` を実装（結果型 `{ok, output} | {ok:false, error, line?, column?}`、空入力の判別を含む）。`lib/tools/json-format.test.ts` で2/4スペース・タブ整形、圧縮、`{"a":1,}` のエラー、空白のみ入力をテストし `npm test` 成功を確認
- [x] 3.2 `components/tools/json-formatter.tsx` に入力欄・インデント選択（既定2スペース）・整形/圧縮ボタン・出力欄・エラー表示・`CopyButton` を実装し、レジストリのプレースホルダーを差し替える。`components/tools/json-formatter.test.tsx` で整形・タブ選択・圧縮・不正JSONのエラー表示（出力なし）・空入力メッセージ・`localStorage` に何も書かれないことをテストし、`npm test` 成功とブラウザでの動作を確認

## 4. 文字数カウント（tool-char-counter）

- [x] 4.1 `lib/tools/char-count.ts` に `countText(text)` を実装（`Intl.Segmenter` 書記素、未対応時コードポイント数フォールバック、`/\s/u` で空白除外、行数規則、`TextEncoder` バイト数）。`lib/tools/char-count.test.ts` で `あいう👨‍👩‍👧`→4、`a b　c\n`→空白除外3、3行テキスト→3、`aあ`→4バイト、空→全0、`Intl.Segmenter` 未定義時のフォールバックをテストし `npm test` 成功を確認
- [x] 4.2 `components/tools/char-counter.tsx` にテキストエリアと4つのカウント表示（入力ごとに即時更新）を実装しレジストリに登録。`components/tools/char-counter.test.tsx` で初期表示が全0、入力するたびに各カウントが更新されること、`localStorage` に何も書かれないことをテストし、`npm test` 成功とブラウザでの動作を確認

## 5. UUID/パスワード生成（tool-id-generator）

- [x] 5.1 `lib/tools/id-generate.ts` に `generateUuids(count)`（1〜100検証、`crypto.randomUUID` + `getRandomValues` フォールバック）を実装し、`lib/tools/id-generate.test.ts` で v4 形式の正規表現一致・5件の一意性・0/101 の拒否・`randomUUID` 未定義時のフォールバックをテスト。`npm test` 成功を確認
- [x] 5.2 同ファイルに `generatePassword({length, upper, lower, digits, symbols})`（4〜128検証、文字種未選択の拒否、棄却サンプリング、各文字種1文字以上の保証、安全な乱数による Fisher–Yates）を実装し、テストで既定設定×1000回の長さ16・全文字種を含むこと、数字のみ長さ8、未選択・範囲外の拒否、`Math.random` を使わないこと（`vi.spyOn(Math, "random")` が呼ばれない）を確認
- [x] 5.3 パスワードオプションの検証関数と既定値（長さ16・全文字種）を実装し、`lib/storage.ts` 経由で `toolbox:id-generator:password-options` に読み書きする。テストで正常値の往復・壊れたJSON・範囲外の長さ・型不正で既定値になることを確認し `npm test` 成功を確認
- [x] 5.4 `components/tools/id-generator.tsx` に UUID セクション（個数入力・生成・改行区切り一覧・全件コピー）とパスワードセクション（長さ・文字種チェック・生成・コピー・未選択/範囲外の案内）を実装しレジストリに登録（設定の読み込みは `useSyncExternalStore`）。`components/tools/id-generator.test.tsx` で UUID 5件表示・範囲外の案内・パスワード生成・未選択時の案内・保存済み設定の復元・設定変更の保存・生成値が `localStorage` に含まれないこと・`localStorage` が例外を投げても既定値で表示されることをテストし、`npm test` 成功とブラウザでの動作を確認

## 6. 統合確認

- [x] 6.1 `npm run lint`・`npm run format:check`・`npm test`・`npm run build` がすべてエラー・警告なしで成功し、build 出力で `/tools/*` 3ページが静的生成されていることを確認
- [x] 6.2 `npm run start` で起動し、DevTools の Network タブで各ツール操作中に入力内容を含むリクエストが発生しないこと、localStorage をブロックしても UUID/パスワード生成が既定値で動作することを確認
- [x] 6.3 DevTools のデバイスモードで幅 360px にし、トップページと3ツールでページの横スクロールが発生せず全操作が可能なこと、ダーク/ライト両方の OS 設定で文字が読めることを確認
