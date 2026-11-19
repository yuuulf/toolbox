# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `markdown-autosave`。依存パッケージは追加しない。

## 1. 自動保存

- [ ] 1.1 `components/tools/markdown-preview/use-auto-save.ts` に `useAutoSave` を実装する（design.md D1・D2）。`use-auto-save.test.tsx`（`vi.useFakeTimers`）で次を検証する。`npm test` が成功することを確認
  - 値が変わってから 500ms 後に1回だけ保存し、その間に続けて変わったら最後の値だけを保存する
  - 開いただけ（読み込んだ値のまま）や、`ready` が false の間は保存しない
  - 500ms たつ前に `pagehide`、`visibilitychange`（`hidden`）、アンマウントが起きたら、すぐに保存する。未保存の値がなければ保存しない
  - 保存が失敗したら `failed` が true になり、次に成功したら false に戻る
- [ ] 1.2 `markdown-preview.tsx` から `SaveButton` を外して `useAutoSave` を使い、保存できないときの文言を、今まで保存ボタンを置いていた見出しに出す（design.md D3）。`markdown-preview.test.tsx` を spec の「入力を自動で保存する」に合わせて更新する（どの表示でも「保存」ボタンがない、入力して待つと保存され作り直すと復元される、入力しただけで待たなければ保存されない、書き込みが例外を投げると文言が `aria-live` の領域に出て入力とプレビューは使える、その後に成功すると文言が消える）。`npm test` が成功することを確認

## 2. 使わなくなった部品と文書

- [ ] 2.1 `components/save-button.tsx`・`save-button.test.tsx` を削除し、`components/icons.tsx` と `icons.test.tsx` から `SaveIcon`・`CheckIcon`・`CrossIcon` を削除する（design.md D4）。`grep` で参照が残っていないこと、`npm test` と `npm run lint` が成功することを確認
- [ ] 2.2 AGENTS.md の構成図と UI の約束（design.md D4）、README.md のツール一覧の保存の列とデータの扱い（「保存」を押したとき → 入力した Markdown を自動で1件）を更新する。`npm run format:check` が通ることを確認
- [ ] 2.3 `openspec/specs/tool-markdown-preview/spec.md` の Purpose の文を自動保存に直す（design.md D5）。`openspec validate markdown-autosave --strict` が通ることを確認

## 3. 最終確認

- [ ] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [ ] 3.2 開発サーバーで、ライト・ダーク両方で次を確認する（確認用のツールはリポジトリの外に置く）
  - 3つの表示のどれにも保存ボタンがないこと
  - 入力して約0.5秒待ってから再読み込みすると、入力が残っていること
  - 入力した直後にサイドバーからほかのツールへ移って戻る、または再読み込みすると、入力が残っていること
  - localStorage への書き込みを失敗させると、見えている欄の見出しに文言が出て、入力とプレビューは使えること
  - 1470×800 で縦スクロールが出ないこと（失敗の文言が出ているときも含む）
- [ ] 3.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版で自動保存が動くことを確認する
