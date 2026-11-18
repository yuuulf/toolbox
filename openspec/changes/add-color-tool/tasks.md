# Tasks

> npm コマンドは mise の Node 24 で実行する（`mise exec -- npm test` など）。作業は main から切った作業ブランチ `add-color-tool` で行う。ファイル構成は design.md 決定1のとおり。

## 1. ロジック（lib/tools）

- [x] 1.1 `lib/tools/color.ts` に `Rgb` 型、`parseColor`（結果型 `empty` / `invalid`）、HEX・RGB・HSL の書式化、RGB↔HSL の変換を実装する（design.md 決定2）。`color.test.ts` で spec「色の入力を解釈する」「色を3形式に変換して表示する」のシナリオを検証する（`#F00`、`F00`、`rgb(0 128 255)`、カンマとスペースの混在の拒否、`rgb(300, 0, 0)`、`#ff000080`、`rgba(...)`、色名、`#ff8000` → `hsl(30, 100%, 50%)`、`hsl(120, 100%, 25%)` → `#008000`、h=360 が 0 と同じになること）。`npm test` が成功することを確認
- [x] 1.2 `lib/tools/color-contrast.ts` に相対輝度・コントラスト比・表示用の切り捨て書式化・4基準の合否を実装する（design.md 決定3）。`color-contrast.test.ts` で、黒白 `21.00:1`、`#777777`/白 `4.47:1`（切り上げない）、`#767676`/白 `4.54:1` と各基準の合否、文字色と背景色を入れ替えても比が同じことを検証する。`npm test` が成功することを確認
- [x] 1.3 `lib/tools/color-favorites.ts` にキー `toolbox:color-tool:favorites`、`MAX_FAVORITES = 10`、保存値の検証、`isFavorite`、`canAddFavorite`、`toggleFavorite`（未登録なら末尾に追加・登録済みなら外す・上限なら `full`）、`removeFavorite`、読み書き（`lib/storage.ts` 経由）を実装する（design.md 決定4）。`color-favorites.test.ts` で、末尾への追加、もう一度で外れること、上限 10 件で `full` になること、削除、不正な保存値（壊れた JSON、形式違いの要素、重複、11 件）で空配列になることを検証する。`npm test` が成功することを確認

## 2. UI（components/tools/color-tool）

- [x] 2.1 `color-field.tsx`（`ColorField`）を実装する。テキスト入力・ピッカー・それぞれの `<label>` を持ち、ピッカーは解釈できないとき直前の色（初期 `#000000`）を表示し、選択すると入力を HEX に置き換える（design.md 決定6）。`color-field.test.tsx` で、ラベルで入力欄とピッカーを取得できること、ピッカーで選ぶと `onChange` に HEX が渡ること、入力が解釈できないときピッカーの値が直前の色のままであることを検証する。あわせて、フォーカスが外れたときだけエラーを出す仕組み（design.md 決定7: `invalidMessage`、`allowEmpty`、`onBlur` で表示・入力で非表示、`aria-describedby` / `aria-invalid`）を実装し、入力中は出ない・外れると出る・再入力で消える・空の扱いが `allowEmpty` で変わる・ピッカーで選んだときは出ないことを検証する。`npm test` が成功することを確認
- [x] 2.2 `color-converter.tsx`（`ColorConverter`）を実装する。入力値とお気に入りの状態は props で受け取り、プレビュー、その横のお気に入りボタン（名前「お気に入り」、`aria-pressed`、塗り／線の星の SVG、変換結果がないときと未登録で上限のとき無効、上限の理由を `aria-live` で表示）、HEX・RGB・HSL の表示、`CopyButton`（「HEX をコピー」「RGB をコピー」「HSL をコピー」）、空入力の案内、解釈できないときのエラーを表示する（design.md 決定5）。`color-converter.test.tsx` で spec の「色を3形式に変換して表示する」「入力が空または解釈できないときの表示」「変換結果をコピーする」「カラーピッカーで色を入力する」と、「お気に入りに登録・解除する」のうちボタンの状態（押された状態・無効・上限の表示・押すと `onToggleFavorite` が呼ばれる）のシナリオを検証する。あわせて、解釈できないときのエラーを `ColorField` に移し（design.md 決定7）、入力中はエラーが出ず、フォーカスが外れると出ることを検証する。`npm test` が成功することを確認
- [x] 2.3 `favorite-colors.tsx`（`FavoriteColors`）を実装する。props で受け取った一覧を色見本 + HEX で表示し、選択ボタン（`onSelect`）、削除ボタン（「<HEX> を削除」、`onRemove`）、空の一覧の表示を持つ（design.md 決定5）。`favorite-colors.test.tsx` で spec「お気に入りを使う・削除する」のシナリオとキーボードでの操作を検証する。`npm test` が成功することを確認
- [x] 2.4 `contrast-checker.tsx`（`ContrastChecker`）を実装する。`ColorField` 2つ（文字色 `#000000`・背景色 `#ffffff` が既定）、`<比>:1` の表示、4基準の合否（「✓ 合格」「✗ 不合格」の文言つき）、見本の文字、どちらの入力が解釈できないかを示すエラーを表示する。`contrast-checker.test.tsx` で spec「コントラスト比を表示する」「WCAG の合否を表示する」のシナリオを検証する。あわせて、どちらの入力が解釈できないかのエラーを各 `ColorField` に移し（空も解釈できない入力として扱う、design.md 決定7）、入力中は出ずフォーカスが外れると該当する入力欄に出ることを検証する。`npm test` が成功することを確認
- [x] 2.5 `color-tool.tsx`（`ColorTool`）で3セクション（「カラー変換」「お気に入り」「コントラスト比」の見出し付き）を並べ、変換の入力値とお気に入りのストア（`useFavoriteColors`、`useSyncExternalStore`、サーバーでは空配列）を持って子に渡す（design.md 決定4・5）。`color-tool.test.tsx` で、星ボタンで登録すると一覧の末尾に加わり押された状態になること、もう一度押すと外れること、変換しただけでは登録されないこと、一覧の色を選ぶと変換欄に読み込まれボタンが押された状態になること、spec「お気に入りを localStorage に保存する」のシナリオ（再読み込み相当で復元、不正な保存値、localStorage が例外を投げる場合）、変換中の色とコントラストの2色が保存されないことを検証する。`npm test` が成功することを確認
- [x] 2.6 `npm run lint` を実行し、エラーがないことを確認

## 3. 登録とドキュメント

- [x] 3.1 `components/tools/registry.ts` に `color-tool` のエントリ（名前「カラー変換/コントラスト」、説明「HEX・RGB・HSL を相互に変換し、文字色と背景色のコントラスト比を確かめます。」、`storage: 'localStorage'`）を追加し、`registry.test.ts` の登録済み slug の検証を4件に更新する。`npm test` が成功することを確認
- [x] 3.2 README.md の「ツール一覧」に1行追加し、「データの扱い」をお気に入りの色の保存に合わせて直す（design.md 決定7）。`npm run format:check` が通ることを確認

## 4. 最終確認

- [x] 4.1 `npm run lint` / `npm run format:check` / `npm test` / `npm run build` がすべて成功することを確認する
- [x] 4.2 開発サーバーで `/` と `/tools/color-tool` を開き、ライト・ダーク両方と幅 360px で、変換・コピー・ピッカー・お気に入りの登録/解除と再読み込み後の復元・コントラストの合否表示が動き、横スクロールが出ないことを確認する（ヘッドレスブラウザで自動確認する場合は、確認用のツールをリポジトリの外に置く）
- [ ] 4.3 ユーザーの確認を取ってから、作業ブランチを push して PR を作り、CI（`verify`）が成功することを確認

## Workflow follow-up

- レビューで spec と実装の整合を確認した後、PR に `archive` ラベルを付けてアーカイブする。アーカイブのコミットの CI は承認待ちになるので、承認して `verify` の成功を確認してからマージする
