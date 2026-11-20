# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `output-view`（main から作成済み）。依存パッケージは追加しない。

## 1. 共通の表示欄

- [x] 1.1 `components/output-view.tsx` に `OutputView`（props: `value`、`labelId`、`className?`）を作る。`role="region"`・`aria-labelledby`・`tabIndex={0}`・`whitespace-pre`・`overflow-auto`・空でも1行分の `min-h`・`bg-zinc-50` / `dark:bg-zinc-900` を持たせる（design D1）。`components/output-view.test.tsx` に、見出しの名前で region として取れる・textbox ではない・`tabIndex` が 0・改行とタブがそのまま `textContent` に入る、のテストを追加し、`npm test` が成功することを確認する
- [x] 1.2 AGENTS.md のディレクトリ構成に `output-view.tsx` を追加し、「UI の統一」に「値を変えられない結果は `OutputView` で表示し、`readOnly` のテキスト欄を使わない。名前は見出しの id を `labelId` で渡して付ける」を追記する。`npm run format:check` が成功することを確認する（1.1 と同じコミットに含める）

## 2. ツールの欄の置き換え

- [ ] 2.1 `components/tools/json-formatter.tsx` の出力の textarea を `OutputView` に、`<label>出力</label>` を `<h2 id>出力</h2>` に置き換え、高さを design D3 のとおり指定する（スマートフォン幅 `h-124`、広い画面は列に `lg:contain-size` を付けて `lg:flex-1`）。`json-formatter.test.tsx` の欄の取り方を `getByRole('region', { name: '出力' })` と `textContent` に変え、出力が textbox でないことのテストを追加して、`npm test` が成功することを確認する
- [ ] 2.2 `components/tools/id-generator.tsx` の UUID の生成結果の textarea とパスワードの input を `OutputView` に、それぞれの `<label>` を `<h3 id>` に置き換え、高さを design D3 のとおり指定し、不要になった `UUID_ROWS_MIN` を消す。`id-generator.test.tsx` の欄の取り方を region と `textContent` に変え、`.rows` のテストを「生成結果は1行に1件ずつ表示する」に置き換え、2つの欄が textbox でないことのテストを追加して、`npm test` が成功することを確認する
- [ ] 2.3 `npm run lint` を実行し、エラーがないことを確認する

## 3. 最終確認

- [ ] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [ ] 3.2 ビルド版（`out/`）をブラウザで開き、ライト・ダークそれぞれで次を確認する（確認用のツールはリポジトリの外に置く）。JSON の出力・UUID の生成結果・パスワードの欄をクリックしても文字カーソルとサイズ変更のつまみが出ない。一部をマウスで選んでコピーできる。Tab でフォーカスして矢印キーでスクロールできる（数百行の JSON、100 件の UUID、128 文字のパスワード）。1470×800 で両ツールのページに縦スクロールが出ず、欄の高さが変更前のスクリーンショットと同じ。幅 1024px 未満で JSON の出力が固定の高さ、UUID が件数に合わせて伸びて `max-h-105` で止まる。スクリーンショットで記録する
- [ ] 3.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認する

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版で JSON整形/検証と UUID/パスワード生成の結果の欄が表示欄になっていることを確認する
