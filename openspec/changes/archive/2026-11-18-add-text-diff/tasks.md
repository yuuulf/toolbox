# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `add-text-diff`（main から作る。PR #10 とは別の PR にする）。依存パッケージは追加しない。

## 1. ロジック（lib/tools）

- [x] 1.1 `lib/tools/char-count.ts` の `splitGraphemes` を export する（design.md D1）。既存の `char-count.test.ts` が通ることを確認
- [x] 1.2 `lib/tools/text-diff.ts` に `diffSequences`（Myers の O(ND)）を実装する（design.md D1）。`text-diff.test.ts` で、空の配列どうし・片方だけ空・同じ配列・先頭/中間/末尾の追加と削除・すべて違う場合に、結果を順に適用すると元の2つの配列が復元できることと、共通部分の長さが最長であること（小さな例で全探索の LCS と比べる）を検証する。`npm test` が成功することを確認
- [x] 1.3 `compareTexts` と結果型（`DiffRow` / `CompareResult`）、定数 `MAX_LINES = 5000`・`MAX_LINE_GRAPHEMES = 1000` を実装する（design.md D2）。`text-diff.test.ts` で spec「行単位で差分を示す」「変更された行の中で変わった文字を示す」「結果を左右に並べて表示する」のシナリオ（行番号を含む）、両方空で `empty`、同じテキストで `identical`、5,001 行で `too-many-lines`、1,001 書記素の行の組で行全体が1つの変更になること、隣り合う変わった書記素が1つの Segment にまとまることを検証する。`npm test` が成功することを確認
- [x] 1.4 5,000 行どうしでほぼすべての行が違うテキストの `compareTexts` の時間を手元で測り、目安の 1 秒未満に収まるか確かめる（design.md Risks）。収まらなければ作業を止め、上限を下げる計画の更新を提案する。測った時間をコミットメッセージか PR に残す

## 2. UI（components/tools/text-diff）

- [x] 2.1 `diff-view.tsx`（`DiffView`）を実装する（design.md D3・D4）。`rows` から左右表示（4列のグリッド、片側がない行は空のセル、行番号、行頭の `+`/`-` と読み上げ用の「追加」「削除」、変わった文字の `<del>`/`<ins>`）と、`sm` 未満の1列表示を描く。`diff-view.test.tsx` で、左右の対応と行番号、組にならない行の空のセル、`<del>`/`<ins>` で囲まれる文字、記号が `aria-hidden` で「追加」「削除」が読み上げ用にあること、1列表示の順序（共通 → 削除 → 追加）を検証する。`npm test` が成功することを確認
- [x] 2.2 `text-diff.tsx`（`TextDiff`）を実装する（design.md D5・D6）。「変更前」「変更後」の `textarea`（ラベル付き、`rows={8}`、等幅、`spellCheck={false}`）、`useDeferredValue` で遅らせた値からの比較、`aria-live="polite"` の案内（「比較するテキストを入力してください。」「差分はありません。」「比較できるのは 5,000 行までです。」）、`max-h-64` でスクロールする結果欄を持つ。`text-diff.test.tsx` で、初期表示の案内、入力すると結果が表示されること（ボタン操作なし）、同じテキストで「差分はありません。」、5,001 行で上限の案内が出て表が出ないこと、何も保存しないこと（localStorage に書き込まない）を検証する。`npm test` が成功することを確認
- [x] 2.3 `npm run lint` を実行し、エラーがないことを確認

## 3. 登録とドキュメント

- [x] 3.1 `components/tools/registry.ts` に `text-diff` のエントリ（名前「テキスト差分比較」、説明「2つのテキストを行ごとに比べ、追加・削除された行と変わった文字を左右に並べて表示します。」、`storage: 'none'`）を追加し、`registry.test.ts` の登録済み slug の検証を6件に更新する。`npm test` が成功することを確認
- [x] 3.2 README.md の「ツール一覧」に1行追加する（保存は「なし」）。`npm run format:check` が通ることを確認

## 4. 最終確認

- [x] 4.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [x] 4.2 開発サーバーで `/toolbox/tools/text-diff/` を開き、ライト・ダーク両方で、入力と同時の比較、左右の対応、変わった文字の強調、案内の文言を確認する。1470×800 で初期表示と 100 行ずつのテキストを比べた後に縦スクロールが出ないこと（結果欄の中ではスクロールできること）、幅 360px で1列表示になり横スクロールが出ないこと、5,000 行どうしを貼り付けても入力が止まらないことを確認する（確認用のツールはリポジトリの外に置く）
- [x] 4.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認したら、PR に `archive` ラベルを付けてアーカイブし、承認待ちの CI を Approve and run で通してからマージする
- マージ後、デプロイが成功し、公開版でテキスト差分比較が動くことを確認する
