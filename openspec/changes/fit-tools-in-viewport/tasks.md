# Tasks

> npm コマンドは mise の Node 24 で実行する。作業ブランチは `fit-tools-in-viewport`。配置は jsdom で測れないため、各タスクは「既存のテストが通ること」と「ヘッドレス Chrome での計測」で確かめる（design.md 決定6）。計測スクリプトと playwright-core はスクラッチパッドに置き、リポジトリに入れない。

## 1. ツールの2列化

- [x] 1.1 `components/tools/json-formatter.tsx` のルートを `lg` 以上でグリッドにし、入力欄を左上、操作とメッセージを入力欄の下、出力欄を右の列に置く（DOM の順序は変えない。design.md 決定2）。`npm test` が成功し、1470×800 で `/tools/json-formatter` の `scrollHeight` が 800 以下になること、幅 360px で今と同じ縦一列であることを計測で確認
- [x] 1.2 `components/tools/id-generator.tsx` のルートを `lg` 以上で2列のグリッドにし、UUID とパスワードのセクションを左右に並べる。`npm test` が成功し、1470×800 で `/tools/id-generator` の `scrollHeight` が 800 以下になることを計測で確認
- [x] 1.3 `components/tools/color-tool/color-tool.tsx` で、カラー変換とお気に入りを左の列のラッパーにまとめ、`lg` 以上でコントラスト比を右の列に置く（DOM の順序は変えない）。`npm test` が成功し、1470×800 で `/tools/color-tool` の `scrollHeight` が 800 以下になることを計測で確認

## 2. 余白の調整（必要な場合だけ）

- [x] 2.1 グループ1の後に4ツールを計測し、800px を超えるツールが残っていれば、design.md 決定3の順で `app/tools/[slug]/page.tsx` の余白を詰める。残っていなければ変更せず、その旨を記録する。`npm test` が成功し、4ツールとも `scrollHeight` が 800 以下であることを計測で確認
  - 結果: グループ1の後の計測で4ツールとも 800px 以内（JSON 800 / 文字数 800 / UUID 800 / カラー 800、カラーツール本体は 610px）だったため、余白は変更しなかった
- [x] 2.2 `npm run lint` を実行し、エラーがないことを確認

## 3. カラーツールの案内の移動

- [x] 3.1 `color-converter.tsx` の入力を促す案内の行を削除し、空入力のときは点線のプレビュー枠の中央に「HEX・RGB・HSL のどれかで色を入力してください。」を表示する（design.md 決定4）。`color-converter.test.tsx` で、空入力のとき案内がプレビュー枠の中に表示されエラーの強調がないこと、色を入れると案内が消えることを検証する。`npm test` が成功することを確認
- [x] 3.2 上限の案内を変換欄から外し、`favorite-colors.tsx` に見出しの行（「お気に入り」、`<件数>/10`、読み上げ用の「10件中3件」、上限のとき「不要な色を削除してください。」）を移す。上限の案内の id を `ColorTool` で作り、星ボタンが上限で押せないときに `aria-describedby` で参照する（design.md 決定4）。`favorite-colors.test.tsx`・`color-converter.test.tsx`・`color-tool.test.tsx` で、spec の「件数の表示」「上限の表示」「空の一覧」「上限」のシナリオ（変換欄に上限の行が出ないこと、星ボタンの説明に案内が結びつくこと）を検証する。`npm test` が成功することを確認
- [x] 3.3 `npm run lint` を実行し、1470×800 で `/tools/color-tool` の `scrollHeight` が 800 以下のままであることを計測で確認

- [x] 3.4 上限のときの「不要な色を削除してください。」を表示しないようにし、星ボタンが上限で押せないときは読み上げ用の件数（「10件中10件」）を `aria-describedby` で参照する（design.md 決定4）。`favorite-colors.test.tsx`・`color-converter.test.tsx`・`color-tool.test.tsx` を更新し、10 件のとき `10/10` だけが表示され上限を知らせる文がないこと、星ボタンの説明が「10件中10件」になることを検証する。`npm test` が成功することを確認

## 4. UUID/パスワード生成の行をそろえる

- [x] 4.1 `id-generator.tsx` の `PasswordSection` を「見出し」「長さ＋生成ボタン」「文字種とエラー」「結果欄」の4つの子にし、`UuidSection` を「見出し」「個数＋生成ボタン」「エラー」「結果欄」の4つの子にする。`lg` 以上で親を4行のグリッド、各セクションを `row-span-4` の subgrid にする（design.md 決定5）。`id-generator.test.tsx` が引き続き通ること（必要なら Tab の順の変更に合わせて直す）、`npm run lint` が通ること、1470×800 で左右の「入力欄＋ボタン」の行と結果欄の上端の位置がそれぞれ一致し、`scrollHeight` が 800 以下であることを計測で確認

## 5. 最終確認

- [x] 5.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [x] 5.2 1470×800 で4ツールの初期表示と spec「通常の操作の後」の操作後（カラーツールはお気に入り 10 件の状態も）に縦スクロールがないこと、幅 360px で横スクロールがないことを、ライト・ダーク両方で計測とスクリーンショットで確認する
- [x] 5.3 README・AGENTS.md の更新が要らないことを確認する（表示の配置だけの変更のため）
- [ ] 5.4 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認した後、PR に `archive` ラベルを付けてアーカイブする。アーカイブのコミットの CI は承認待ちになるので、承認して `verify` の成功を確認してからマージする
