# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `icon-action-buttons`。依存パッケージは追加しない。

## 1. 共通の部品

- [x] 1.1 `components/icons.tsx` に `PlusIcon`・`TrashIcon`・`SaveIcon`・`CheckIcon`・`CrossIcon` を定義する（design.md D1）。`icons.test.tsx` で、どのアイコンも `aria-hidden` で読み上げられないことを検証する。`npm test` が成功することを確認
- [x] 1.2 `components/icon-button.tsx`（`IconButton`）を実装する（design.md D2）。`icon-button.test.tsx` で、文字を表示せず `label` がアクセシブルな名前とツールチップ（`title`）になること、`disabled` で押せないこと、クリックと Enter / Space で `onClick` が呼ばれること、`type="submit"` でフォームを送信できることを検証する。`npm test` が成功することを確認
- [x] 1.3 `components/save-button.tsx`（`SaveButton`）を実装する（design.md D3）。`save-button.test.tsx` で、押すと `onSave` が呼ばれ、成功なら ✓、失敗なら × のアイコンに変わり「保存しました」「保存できませんでした」が読み上げ用の領域に出ること（画面には文字を出さない）、約2秒で元のアイコンに戻ること（`vi.useFakeTimers`）を検証する。`npm test` が成功することを確認

## 2. ツールのボタンを置き換える

- [x] 2.1 チェックリストの追加を `IconButton`（`primary`、`PlusIcon`、`type="submit"`、名前「追加」）に置き換える。`add-item-form.test.tsx` を更新し、ボタンに文字がなく名前が「追加」であること、Enter とボタンで追加できること、空と上限のとき押せないことが通ることを確認。`npm test` が成功することを確認
- [x] 2.2 お気に入りの削除とチェックリストの項目の削除を `IconButton`（`subtle`、`TrashIcon`）に置き換える（design.md D4）。名前（「<対象> を削除」）は変えない。既存のテストが通ることを確認する。`npm test` が成功することを確認
- [x] 2.3 Markdownプレビューの保存を `SaveButton` に置き換え、`saveStatus` と文言の表示を外す（design.md D3）。`markdown-preview.test.tsx` を spec の「ボタンを押したときだけ保存する」に合わせて更新する（結果は読み上げ用の領域に出て、画面には「保存しました。」の文字が出ないこと、保存できないときの読み上げ）。`npm test` が成功することを確認
- [x] 2.4 AGENTS.md の UI の統一の節と構成図を更新する（design.md D5）。`npm run lint` と `npm run format:check` が通ることを確認

## 3. 最終確認

- [x] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [x] 3.2 開発サーバーで、ライト・ダーク両方で次を確認する（確認用のツールはリポジトリの外に置く）
  - チェックリストの追加ボタン・項目の削除ボタン、お気に入りの削除ボタン、Markdown の保存ボタンが、文字なしのアイコンで表示されること
  - ポインタを重ねると名前が出ること、キーボードで操作できること
  - 保存の ✓ / × が約2秒で元に戻ること
  - 1470×800 で各ツールに縦スクロールが出ないこと
- [x] 3.3 チェックリストの項目の削除のアイコン（ゴミ箱）のスクリーンショットをユーザーに見せ、ゴミ箱のままにするか × に戻すかを決めてもらう。× に戻すときは、design.md D4 のとおり実装と spec を直す提案をし、了承を得てから直す
- [ ] 3.4 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版でアイコンのボタンが表示されることを確認する
