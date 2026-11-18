# Design

## Context

- ツールは「`lib/tools/<name>.ts`（+テスト）→ `components/tools/<tool-slug>.tsx`（+テスト）→ `registry.ts` に1エントリ」で追加する。トップの一覧・ナビ・`generateStaticParams`・`proxy.ts` の 404 判定は、すべて registry から導出される
- localStorage は `lib/storage.ts` の `readJson` / `writeJson` を通す。UUID/パスワード生成ツールは、`useSyncExternalStore` とモジュール内のストアで設定を保持している。`getServerSnapshot` で既定値を返して、プリレンダーと hydration の不一致を避けている
- 想定内の失敗は結果型で返す（JSON 整形の `{ ok: false, kind: 'empty' | 'syntax' }` が前例）。空入力はエラー扱いしない
- コピーはアイコンのみの `CopyButton` を使い、`label` で区別する
- `registry.test.ts` は登録済み slug の配列を固定で検証している（`初期ツール3件が登録されている`）
- README の「データの扱い」は「保存するのは一部ツールの設定だけ」「入力内容は保存しない」と書いている。お気に入りの色はユーザーが登録するデータなので、この記述と食い違う

## Goals / Non-Goals

**Goals:**

- 変換・コントラスト・お気に入りの計算と検証を、React に依存しない純粋関数としてテストできる形にする
- 1ファイル 150 行程度に収まるよう、UI を役割ごとのファイルに分ける

**Non-Goals:**

- 色の計算の汎用ライブラリ化（このツールで使う範囲だけ実装する）
- CSS Color 4 の構文の網羅（spec に書いた形式だけを受け付ける）

## Decisions

### 1. ファイル構成

UI が大きいので `components/tools/color-tool/` ディレクトリにする（AGENTS.md の規約）。

```
lib/tools/
  color.ts                # 型 Rgb、parseColor、HEX/RGB/HSL の書式化と相互変換
  color-contrast.ts       # 相対輝度、コントラスト比、表示用の切り捨て、WCAG の合否
  color-favorites.ts      # お気に入りの登録・解除・削除（純粋関数）、検証、読み書き
components/tools/color-tool/
  color-tool.tsx          # ColorTool。3セクションを並べ、変換の入力値とお気に入りのストアを持つ
  color-field.tsx         # ColorField。テキスト入力 + カラーピッカー（3か所で使う）
  color-converter.tsx     # ColorConverter。入力・プレビュー・お気に入りボタン・3形式とコピー
  favorite-colors.tsx     # FavoriteColors。お気に入りの一覧（選択・削除）
  contrast-checker.tsx    # ContrastChecker。2色の入力・比・合否・見本
```

各ファイルに対応する `*.test.ts(x)` を置く。registry には `ColorTool` を `slug: 'color-tool'`、`name: 'カラー変換/コントラスト'`、`storage: 'localStorage'` で登録する。

- 代替案: 色の変換・コントラスト・お気に入りを別々のツールにする → ユーザーが1つのツールとして求めており、お気に入りから変換欄へ読み込む連携もあるため採らない

### 2. 色の解釈は正規表現と範囲チェックで行う

`parseColor(input)` は `{ ok: true, rgb } | { ok: false, kind: 'empty' | 'invalid' }` を返す。trim と小文字化の後、HEX / `rgb(...)` / `hsl(...)` の正規表現で数値を取り出す。区切りはカンマかスペースのどちらかで、1つの入力の中で混在させない。取り出した数値は spec の範囲でチェックする。

- RGB の各値は整数のみ受け付ける
- HSL の h は小数を許し、360 は 0 と同じ色になる
- HSL → RGB は標準の式で計算し、`Math.round` で整数にする

内部表現は整数の RGB にそろえ、表示する3形式はすべて RGB から作る。そのため HSL で入力した値と、表示される HSL が丸めで少しずれることがある（例: 入力 `hsl(200, 50%, 50%)` → 表示は RGB を経由した値）。

- 代替案: ブラウザに CSS として解釈させる（`CSS.supports` や canvas の `fillStyle`）→ 色名や透明度など spec の範囲外の形式も通ってしまう。node 環境の単体テストでも動かないため採らない

### 3. コントラスト比

WCAG 2.x の相対輝度を使う（sRGB の各成分を線形化し、0.2126 / 0.7152 / 0.0722 で重み付け）。比は `(明るい方 + 0.05) / (暗い方 + 0.05)`。

- 合否は丸める前の値で判定する
- 表示は `Math.floor(ratio * 100) / 100` を `toFixed(2)` で書式化し、切り上げで基準を満たしたように見えないようにする
- 4つの基準（AA/AAA × 通常/大きな文字）は、閾値つきの定数配列として `color-contrast.ts` に置く

合否の表示は「✓ 合格」「✗ 不合格」のように、アイコンと文言を併用する（色だけに頼らない）。

### 4. お気に入りのストア

キーは `toolbox:color-tool:favorites`、値は HEX 文字列の配列（登録した順）で、上限は `MAX_FAVORITES = 10`。履歴のように見えないよう、新しい色は末尾に加え、並びは登録時から変えない。

- 読み込み時の検証: 配列であること、各要素が `^#[0-9a-f]{6}$`、重複なし、10 件以下。満たさなければ空配列にする
- 純粋関数:
  - `isFavorite(list, hex)`
  - `canAddFavorite(list)`（上限未満か）
  - `toggleFavorite(list, hex)`: 登録済みなら外し、未登録なら末尾に加える。上限で加えられないときは `{ ok: false, reason: 'full' }` を返す
  - `removeFavorite(list, hex)`
- ストアは UUID/パスワード生成と同じ形にする（`useSyncExternalStore`、`getServerSnapshot` は空配列、書き込みに失敗してもメモリ上の一覧で動作を続ける）

重複の案内は不要にする。登録済みかどうかはボタンの状態でわかるため。

### 5. 状態の持ち方と星ボタン

お気に入りの選択で変換欄を書き換え、変換欄の星ボタンで一覧を書き換えるため、変換の入力文字列とお気に入りのストアは親の `ColorTool` が持つ。ストアのフック `useFavoriteColors` は `color-tool.tsx` 内に置く（このファイル専用）。

- `ColorConverter` に渡す props: 入力値と `onChange`、`isFavorite`（変換中の色が登録済みか）、`canAddFavorite`、`onToggleFavorite()`
- `FavoriteColors` に渡す props: 一覧と `onSelect(hex)`、`onRemove(hex)`

星ボタンは `ColorConverter` のプレビューの横に置く。

- `<button type="button" aria-pressed>` で、名前は常に「お気に入り」
- 押された状態は塗りの星、押されていない状態は線の星の SVG で示す
- 変換結果がないとき、または未登録で上限に達しているときは無効にする
- 上限の理由は、ボタンの近くに `aria-live="polite"` で表示する

コントラストの2色は `ContrastChecker` 内の state にする（他と連携しない）。

### 6. `ColorField`

テキスト入力と `<input type="color">` を並べる部品。props は `label`、`value`（入力文字列）、`onChange(text)`。

- ピッカーの値は `#rrggbb` しか受け付けないため、入力が解釈できるときはその HEX を、できないときは直前に解釈できた色（初期値は `#000000`）を表示する
- ピッカーにも、`sr-only` の `<label>`（例:「文字色をカラーピッカーで選ぶ」）を付ける
- 色の選択時は `onChange(hex)` を呼び、入力欄を HEX に置き換える

### 7. エラーはフォーカスが外れたときに `ColorField` が出す

入力中にエラーが出続けると、書きかけの値（`rgb(` など）で邪魔になるため、エラーの表示は入力欄からフォーカスが外れたときに限る。

- `ColorField` が `showError` の状態を持つ。テキスト入力の `onBlur` で true、テキスト入力の `onChange` で false にする。表示するのは「`showError` が true で、入力が解釈できない」ときだけ
- エラーの文言は親が `invalidMessage` で渡す。「空を解釈できない入力とみなすか」は `allowEmpty` で渡す（変換欄は空を案内として扱うので true、コントラストの2色は false）
- エラーはその入力欄のすぐ下に `aria-live="polite"` で表示し、テキスト入力に `aria-describedby` と `aria-invalid` を付ける。どの入力欄のエラーかが位置と支援技術の両方でわかるよう、親（変換欄・コントラスト）にまとめて出していたエラーは削除する
- 変換結果・プレビュー・コントラスト比は、これまでどおり入力のたびに解釈して更新する（解釈できない間は空）
- ピッカーで選んだ値は必ず解釈できるので、エラーは出ない

### 8. ドキュメント

README は2か所を更新する。

- 「ツール一覧」にカラー変換/コントラストを追加する（保存: localStorage（お気に入りの色））
- 「データの扱い」の「保存するのは一部ツールの設定だけ」を、「一部ツールの設定と、カラーツールのお気に入りの色」に直す

AGENTS.md のディレクトリ構成の例は変えない（例示であり、ツールの一覧ではないため）。

## Risks / Trade-offs

- [HSL で入力した値と表示される HSL が丸めでずれる] → 内部表現を RGB に統一する以上避けられない。spec の表示形式（整数に丸めた HSL）の範囲内として受け入れる
- [`<input type="color">` の見た目・操作はブラウザ依存] → テキスト入力で同じことができるので、ピッカーは補助として扱う
- [浮動小数点の誤差で、比が基準ちょうど（例: 4.5）のとき判定がぶれる] → 実際の色の組み合わせで比がちょうど閾値になることはまずない。テストでは spec の境界例（4.54 / 4.47）で確かめる
- [お気に入りの上限 10 件で足りなくなる] → 名前付き定数にしておき、変えやすくする

## Migration Plan

新規ツールの追加だけで、既存のデータ移行はない。戻すときはこの change のコミットを revert する（localStorage に残ったお気に入りのキーは使われなくなるだけで害はない）。
