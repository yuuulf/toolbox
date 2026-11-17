# Tasks

> npm コマンドは mise の Node 24 で実行する（`mise exec -- npm test` など）。作業は main から切った作業ブランチ `icon-only-copy-button` で行う。

## 1. CopyButton のアイコン化

- [x] 1.1 `components/copy-button.tsx` に、コピー・チェック・× のインライン SVG（`aria-hidden="true"`、`focusable="false"`、`stroke="currentColor"`、`data-icon="copy" | "check" | "x"`）を同じファイル内の小さな部品として追加し、ボタンの中身を `label` の文字から `status` に応じたアイコンに替える。ボタンには `aria-label={label}` と `title={label}` を付け、`size-4` のアイコン + `p-2` の正方形にし、成功時は緑系・失敗時は赤系の文字色にする（design.md「アイコンの切り替え」「ボタンの大きさ」）。`label` の doc コメントを「アクセシブルな名前とツールチップ」に直す
- [x] 1.2 結果表示の `aria-live="polite"` の `<span>` を `sr-only` で画面から隠す（文字の内容・2秒で戻るタイマーは変えない）
- [x] 1.3 `components/copy-button.test.tsx` を更新・追加する: ボタンに見える文字がなく（`textContent` が空）`title` が `label` と同じこと／初期はコピーアイコン、成功でチェック、失敗で×に変わること（`data-icon` で確認）／約2秒後にコピーアイコンへ戻ること（fake timers）／Tab でフォーカスして Enter でコピーできること。既存の「コピーしました」「コピーできませんでした」・無効状態・`label` 指定・aria-live のテストが通ることを含め、`npm test` が成功することを確認

## 2. 利用側の確認と規約の更新

- [x] 2.1 `components/tools/json-formatter.test.tsx` と `components/tools/id-generator.test.tsx` がアクセシブルな名前（「コピー」「UUID をコピー」「パスワードをコピー」）と読み上げ用の文字で引き続き通ることを確認し、通らない箇所だけ直す。`id-generator.test.tsx` の UUID コピーのテストが複数件を改行区切りでコピーすることを検証していなければ追加する（spec「UUID のコピー」）。`npm test` が成功することを確認
- [x] 2.2 AGENTS.md の「UI の統一」を更新する: ボタン文言の例から「コピー」を外し、「コピーは必ずアイコンのみの `CopyButton` を使い、`label` で何をコピーするかを示す（結果はアイコンの切り替えと読み上げで伝える）」と書く。README.md に該当する記述がないこと（更新不要）を確認し、`npm run format:check` が通ることを確認
- [x] 2.3 `npm run lint` を実行し、エラーがないことを確認

## 3. 最終確認

- [x] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [x] 3.2 `npm run dev` で JSON整形/検証と UUID/パスワード生成を開き、ライト・ダーク両方でコピーボタンがアイコンのみで表示されること、ホバーでツールチップが出ること、押すとチェックに変わり約2秒で戻ること、出力が空のとき押せないことを目視で確認する（自動化できない手動確認として結果を報告する）

## Workflow follow-up

- ユーザーの確認を取ってから作業ブランチを push して PR を作り、CI（`verify`）の成功を確認する
- レビューで spec と実装の整合を確認した後、PR に `archive` ラベルを付けてアーカイブする
