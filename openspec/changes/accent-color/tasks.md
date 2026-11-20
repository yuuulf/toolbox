# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `accent-color`。依存パッケージは追加しない。

## 1. アクセント色の定義と規約

- [x] 1.1 `app/globals.css` に `@theme` で `--color-accent-300: #4db6ac`、`--color-accent-500: #009688`、`--color-accent-700: #00796b` を追加し、なぜ既定の `teal` ではなく独自の色を定義するのかを日本語のコメントで残す。`npm run build` が成功することを確認する
- [x] 1.2 AGENTS.md の「コードスタイル」の色の規約に、アクセント色は `globals.css` の `@theme` の `accent-300/500/700` を使うこと（文字はライト `accent-700`・ダーク `accent-300`、チェックボックスなど非テキストはライト `accent-500`）を追記し、`npm run format:check` が成功することを確認する（1.1 と同じコミットに含める）

## 2. リンク・チェックボックス・フォーカスリングへの適用

- [x] 2.1 `components/tools/markdown-preview/markdown-view.tsx` のリンクのクラスを `text-accent-700 underline dark:text-accent-300` に置き換え、`markdown-view.test.tsx` に「リンクはアクセント色の文字で表示する」テスト（`text-accent-700` と `dark:text-accent-300` を持ち、`blue` を含むクラスを持たない）を追加して、`npm test` が成功することを確認する
- [x] 2.2 `app/layout.tsx` の `<body>` に `accent-accent-500 dark:accent-accent-300` を加え、`app/` と `components/` に `blue-` のクラスが残っていないことを `grep` で確認し、`npm test` が成功することを確認する
- [x] 2.3 `npm run lint` を実行し、エラーがないことを確認する
- [x] 2.4 `app/globals.css` の `@layer base` に `:focus-visible { outline-color: var(--color-accent-500) }` とダークの `accent-300`（`@variant dark`）を追加し、`npm run build` が成功して `out/` の CSS にこの指定が含まれることと、ビルド版で入力欄にフォーカスしたとき・キーボードでボタンにフォーカスしたときの `outline-color` がライト #009688・ダーク #4db6ac になることを確認する。AGENTS.md の色の規約にフォーカスリングを追記する

## 3. 最終確認

- [x] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功し、`out/` の CSS に `--color-accent-300`・`--color-accent-500`・`--color-accent-700` が含まれることを確認する
- [x] 3.2 開発サーバーで、ライト・ダークそれぞれについて、Markdownプレビューのリンク、チェックリストのチェック済みの項目、UUID/パスワード生成の文字種のチェックボックス、入力欄とボタンのフォーカスリングがティールで表示され、Markdownプレビューのタスクリスト（disabled）は灰色のままで、主ボタン・ナビの現在地・コピーの成功表示が以前の色のままであることを、スクリーンショットで確認する（確認用のツールはリポジトリの外に置く）
- [ ] 3.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認する

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版でリンク・チェックボックス・フォーカスリングがティールで表示されることを確認する
