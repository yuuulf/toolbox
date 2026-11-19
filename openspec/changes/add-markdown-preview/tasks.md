# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `add-markdown-preview`。依存パッケージは `react-markdown`・`remark-gfm`・`mermaid` の3つだけを追加する（理由は proposal.md と design.md D1）。

## 1. 依存とロジック

- [ ] 1.1 `npm install react-markdown@10.1.0 remark-gfm@4.0.1 mermaid@12.3.0` で `dependencies` に追加する。`package-lock.json` が更新され、`npm run build` が成功することを確認
- [ ] 1.2 `lib/tools/markdown-preview.ts` に、保存のキー `MARKDOWN_DRAFT_KEY`、保存値の読み書き（`loadDraft` / `saveDraft`、`lib/storage.ts` 経由、文字列だけを有効とする）、Mermaid の `id` に使える文字列への変換、空の `href` の判定を実装する（design.md D2・D3・D6）。`markdown-preview.test.ts` で、保存と読み込み、文字列以外・壊れた JSON で空になること、localStorage が例外を投げても読み込みは空・保存は false になること、`id` の変換を検証する。`npm test` が成功することを確認

## 2. UI（components/tools/markdown-preview）

- [ ] 2.1 `mermaid-diagram.tsx`（`MermaidDiagram`）を実装する（design.md D3・D4）。`mermaid-diagram.test.tsx` で `vi.mock('mermaid')` を使い、返った SVG が入ること、`securityLevel: 'strict'` とライト/ダークのテーマで初期化されること、`render` が例外を投げたら「図を描けませんでした。」とエラーの内容と元のコードが出ること、同じコードでは描き直さないことを検証する。`npm test` が成功することを確認
- [ ] 2.2 `markdown-view.tsx`（`MarkdownView`）を実装する（design.md D1〜D3）。`markdown-view.test.tsx` で、spec「入力と同時にプレビューする」（空のときの案内を含む）「GFM に対応する」「HTML と画像を読み込まない」のシナリオ（`img` 要素が出ないこと、リンクに `target="_blank"` と `rel` が付くこと、`javascript:` がリンクにならないこと）と、`mermaid` のコードブロックが `MermaidDiagram` に渡ること（`MermaidDiagram` を差し替えて確認）を検証する。`npm test` が成功することを確認
- [ ] 2.3 `view-mode-switch.tsx`（`ViewModeSwitch`）を実装する（design.md D5）。`view-mode-switch.test.tsx` で、3つの選択肢が `radio` として読み上げられ、選択中が `aria-checked` で分かること、クリックと Enter / Space で選べることを検証する。`npm test` が成功することを確認
- [ ] 2.4 `markdown-preview.tsx`（`MarkdownPreview`）を実装する（design.md D5〜D7）。`markdown-preview.test.tsx` で、spec「表示を切り替える」「ボタンを押したときだけ保存する」のシナリオ（入力だけでは保存しないこと、保存して作り直すと復元されること、保存後の入力で表示が消えること、書き込みが例外を投げると「保存できませんでした。」になること）を検証する。`npm test` が成功することを確認
- [ ] 2.5 `npm run lint` を実行し、エラーがないことを確認

## 3. 登録とドキュメント

- [ ] 3.1 `components/tools/registry.ts` に `markdown-preview` のエントリ（名前「Markdownプレビュー」、説明「Markdown を入力と同時にプレビューします。表・タスクリストと Mermaid の図に対応しています。」、`storage: 'localStorage'`）を追加し、`registry.test.ts` の登録済み slug の検証を7件に更新する。`npm test` が成功することを確認
- [ ] 3.2 README.md の「ツール一覧」に1行追加し（保存は「localStorage（保存ボタンで保存した Markdown 1件）」）、「データの扱い」に Markdownプレビューの保存と、画像を読み込まないことを書き加える。`npm run format:check` が通ることを確認

## 4. 最終確認

- [ ] 4.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [ ] 4.2 開発サーバーで `/toolbox/tools/markdown-preview/` を開き、ライト・ダーク両方で、GFM と Mermaid の図（フローチャート・シーケンス図）、構文エラーの表示、3つの表示の切り替え、保存と再読み込み後の復元を確認する。画像の記法で外部への通信が起きないこと、図のラベルに `<img src=x onerror=alert(1)>` を書いてもスクリプトが実行されないこと、ほかのツールのページで `mermaid` のチャンクが読み込まれないことを確認する。1470×800 で初期表示と 100 行の Markdown と図を表示した後に縦スクロールが出ないこと、幅 360px で横スクロールが出ないことを確認する（確認用のツールはリポジトリの外に置く）
- [ ] 4.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版で Markdownプレビューと図が表示されることを確認する
