# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `replace-favicon`。依存パッケージは追加せず、画像の加工に使うスクリプトはリポジトリの外（作業用ディレクトリ）に置く。

## 1. アイコン画像

- [x] 1.1 元画像（`~/Downloads/icon-ligth.png`・`~/Downloads/ icon-dark.png`）から、背景を透明にして余白 4% の正方形に切り詰め、256×256 に縮小した `public/favicon-light.png`・`public/favicon-dark.png` を作る（design.md D1）。両方が 256×256 の RGBA で、四隅が透明（アルファ 0）、カードの中央が不透明であることを確かめ、ライト・ダークのタブの色に重ねたプレビューで縁が汚れていないことを目で確認する

## 2. ファビコンの設定

- [x] 2.1 `lib/base-path.ts` に `BASE_PATH = '/toolbox'` を置き、`next.config.ts` の `basePath` をこの定数にする（design.md D3）。`npm run build` が成功し、`out/index.html` のアセットの参照が今までどおり `/toolbox` で始まることを確認
- [x] 2.2 `app/layout.tsx` の `metadata.icons` に、ライト用・ダーク用を `media` 付きで書き、`app/favicon.ico` を削除する（design.md D2）。`app/layout.test.ts` で、`metadata.icons` の2つの URL が `BASE_PATH` で始まり、`media` がそれぞれ light / dark であり、指す画像が `public/` に存在することを検証する。`npm test` が成功し、`npm run build` の `out/index.html` に `/toolbox/favicon-light.png`・`/toolbox/favicon-dark.png` の `<link rel="icon">` が `media` 付きで出て、Next.js のロゴの `favicon.ico` の参照がないことを確認
- [x] 2.3 AGENTS.md の構成図に `lib/base-path.ts` と `public/`（ファビコン）を反映する。`npm run format:check` が通ることを確認

## 3. 最終確認

- [x] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [x] 3.2 開発サーバーで、ライト・ダークそれぞれの表示でトップページとツールページを開き、対応するファビコンの画像が読み込まれる（`/toolbox/favicon-*.png` が 200）ことと、タブの見た目をスクリーンショットで確認する（確認用のツールはリポジトリの外に置く）
- [ ] 3.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版で新しいファビコンが表示されることを確認する
