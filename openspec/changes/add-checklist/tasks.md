# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `add-checklist`。ファイル構成は design.md 決定1のとおり。日付のテストは `vi.useFakeTimers()` と `vi.setSystemTime()` で「今日」を固定する（例: 2026-11-18）。

## 1. ロジック（lib/tools）

- [x] 1.1 `lib/tools/checklist-period.ts` に、月・週（月曜）・日のキーの作成、入力値（`YYYY-MM` / `YYYY-MM-DD`）の検証、週の範囲の表示（「11/16（月）〜11/22（日）」）、保持期間の判定を実装する（design.md 決定3・4）。`checklist-period.test.ts` で、ローカル時刻でのキー、月曜・日曜を含む週の月曜の求め方、年をまたぐ週、不正な入力値、保持期間の境界（日次 90 日目は残り 91 日目より前は消える、週次 52 週、月次 24 か月、未来は残る）を検証する。`npm test` が成功することを確認
- [x] 1.2 `lib/tools/id-generate.ts` の `randomUuid` を export する。既存の `id-generate.test.ts` が通ることを確認
- [x] 1.3 `lib/tools/checklist.ts` に、型、保存値の検証、`addItem`（`empty` / `too-long` / `full`）、`removeItem`（全期間のチェックからも削除）、`toggleCheck`、`toggleTemporary`、`removeCheckedTemporary`、`pruneChecks`、読み書き（キー `toolbox:checklist:data`、`lib/storage.ts` 経由）を実装する（design.md 決定2・4）。`checklist.test.ts` で、末尾への追加・前後の空白の除去・空/101 文字/31 件目の拒否、削除でチェックも消えること、期間ごとに別のチェックになること、チェック済みの削除、古い記録の削除（項目は残る）、不正な保存値（壊れた JSON、形違い、上限超え）で空になること、存在しない ID のチェックが読み込み時に取り除かれること、localStorage が例外を投げても読み込みが空を返すことを検証する。`npm test` が成功することを確認

## 2. UI（components/tools/checklist）

- [x] 2.1 `add-item-form.tsx`（`AddItemForm`）と `item-list.tsx`（`ItemList`）を実装する（design.md 決定5・6）。`add-item-form.test.tsx` で、追加ボタン・Enter での追加、空のとき押せないこと、上限で押せず案内が出ること、追加後に入力欄が空になることを検証する。`item-list.test.tsx` で、ラベルでチェックボックスを取得して切り替えられること、「<項目> を削除」で削除できること、キーボードで操作できることを検証する。`npm test` が成功することを確認
- [x] 2.2 `recurring-list.tsx`（`RecurringList`）を実装する。見出し・完了数（`1/3`、読み上げ用「3件中1件完了」）・期間の入力（月次は `type="month"`、週次・日次は `type="date"`、週次は範囲を表示、不正な値では直前の期間を使う）・`ItemList`・`AddItemForm` を持つ。`recurring-list.test.tsx` で、spec「繰り返しのリストの期間を選ぶ」「期間ごとにチェックする」「完了数を表示する」のシナリオを検証する。`npm test` が成功することを確認
- [x] 2.3 `temporary-list.tsx`（`TemporaryList`）を実装する。見出し・完了数・`ItemList`・`AddItemForm`・「チェック済みを削除」（チェック済みがないとき押せない）を持つ。`temporary-list.test.tsx` で spec「一時的なリストを使う」のシナリオを検証する。`npm test` が成功することを確認
- [x] 2.4 `checklist.tsx`（`Checklist`）で、ストア（`useSyncExternalStore`、サーバーでは空のデータ、保存のたびに `pruneChecks`）と「今日」（サーバーでは `null`）を持ち、4つのリストを `lg` で2列・`xl` で4列に並べる（design.md 決定3〜5）。`checklist.test.tsx` で、4つの見出し、初期値の期間（2026-11-18 に固定して今月・「11/16（月）〜11/22（日）」・今日）、再読み込み相当での復元（選んでいる期間は戻る）、不正な保存値、localStorage が例外を投げても操作できること、項目の削除でほかの期間からも消えること、保存時に古い記録が消えることを検証する。`npm test` が成功することを確認
- [x] 2.5 `npm run lint` を実行し、エラーがないことを確認

## 3. 登録とドキュメント

- [x] 3.1 `components/tools/registry.ts` に `checklist` のエントリ（名前「チェックリスト」、説明「月次・週次・日次の繰り返しのチェックリストと、一時的なチェックリストを使えます。」、`storage: 'localStorage'`）を追加し、`registry.test.ts` の登録済み slug の検証を5件に更新する。`npm test` が成功することを確認
- [x] 3.2 README.md の「ツール一覧」に1行追加し、「データの扱い」にチェックリストの保存と古い記録の自動削除を書き加える（design.md 決定7）。`npm run format:check` が通ることを確認

## 4. 最終確認

- [x] 4.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [x] 4.2 開発サーバーで `/` と `/tools/checklist` を開き、ライト・ダーク両方で、追加・チェック・期間の切り替え（月・週・日）・削除・チェック済みの削除・再読み込み後の復元が動くこと、1470×800 で初期表示と4つのリストに10件ずつ追加した後に縦スクロールが出ないこと、幅 360px で横スクロールが出ないことを確認する（ヘッドレスブラウザで自動確認する場合は、確認用のツールをリポジトリの外に置く）
- [ ] 4.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認した後、PR に `archive` ラベルを付けてアーカイブする。アーカイブのコミットの CI は承認待ちになるので、承認して `verify` の成功を確認してからマージする
