# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `favorite-copy`（main から作成済み）。依存パッケージは追加しない。

## 1. コピーボタンの枠なしの見た目

- [x] 1.1 `components/copy-button.tsx` に `variant?: 'default' | 'subtle'` を追加し、`subtle` を `IconButton` の subtle と同じ枠なし・`p-1` の見た目にする（成功・失敗の色は `subtle` でも付ける。design D1）。`copy-button.test.tsx` に、`subtle` のとき枠のクラスを持たないこと、コピーとアイコンの切り替えが既定と同じに動くことのテストを追加し、`npm test` が成功することを確認する
- [x] 1.2 AGENTS.md の「UI の統一」の `CopyButton` の説明に、一覧の項目の中では `variant="subtle"` を使い、削除ボタンと見た目をそろえることを追記し、`npm run format:check` が成功することを確認する（1.1 と同じコミットに含める）

## 2. お気に入りのコピー

- [x] 2.1 `components/tools/color-tool/favorite-colors.tsx` の各色の削除ボタンの左に `CopyButton`（`text={hex}`、`label={`${hex} をコピー`}`、`variant="subtle"`）を追加する（design D2）。`favorite-colors.test.tsx` に、押すとクリップボードに HEX が入り「コピーしました」が読み上げられ `onSelect` が呼ばれないこと、Tab と Enter でコピーできることのテストを追加し、既存のキーボード操作のテストを新しい Tab の順番に合わせて更新して、`npm test` が成功することを確認する
- [x] 2.2 `components/tools/color-tool/color-tool.test.tsx` に、お気に入りに登録した色のコピーボタンを押しても変換の入力欄が変わらないことのテストを追加し、`npm test` が成功することを確認する
- [x] 2.3 `npm run lint` を実行し、エラーがないことを確認する
- [x] 2.4 `favorite-colors.tsx` の削除ボタンと `onRemove`、`color-tool.tsx` の `onRemove` の受け渡しをなくし、AGENTS.md の `CopyButton` の subtle の説明から削除ボタンへの言及を外す（design D2）。`favorite-colors.test.tsx` の削除のテストを、削除のボタンがないことと、キーボードで選択とコピーができることのテストに置き換え、`color-tool.test.tsx` の「一覧から削除できる」を「一覧の色を選んで星のボタンを押すと一覧と localStorage から消える」に置き換えて、`npm test` と `npm run lint` が成功することを確認する

## 3. 最終確認

- [x] 3.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [x] 3.2 ビルド版（`out/`）をブラウザで開き、ライト・ダークそれぞれで、お気に入りを数件登録した状態の一覧に、色見本のボタンとコピーが1つのまとまりとして並び、削除のボタンがないこと、一覧の色を選んで星のボタンを押すと一覧から外れること、コピーを押すとアイコンがチェック（緑）に変わり約2秒で戻ること、クリップボードに HEX が入ること、変換欄の HEX などのコピーボタンは今までの枠ありの見た目のままであることを確認する。幅 390px で 10 件登録したときに一覧が折り返してはみ出さないことも確認する。スクリーンショットで記録する（確認用のツールはリポジトリの外に置く）
- [x] 3.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認する

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版でお気に入りの各色にコピーボタンが表示され、1回の操作で HEX をコピーできることを確認する
